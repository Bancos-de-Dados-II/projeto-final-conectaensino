import { api } from "../api/axios";
import type {
  ExperienceSession,
  MonitorSchedule,
  PublicMonitor,
  SessionStatus,
} from "../types/experience";

type Dict = Record<string, unknown>;
const isObject = (value: unknown): value is Dict => typeof value === "object" && value !== null;

function list(value: unknown): Dict[] {
  if (Array.isArray(value)) return value.filter(isObject);
  if (!isObject(value)) return [];
  for (const key of ["data", "items", "results", "sessions", "sessoes", "monitors", "monitores"]) {
    const found = list(value[key]);
    if (found.length) return found;
  }
  return [];
}

function get(source: Dict, paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = source;
    for (const part of path.split(".")) {
      if (!isObject(current) || !(part in current)) { current = undefined; break; }
      current = current[part];
    }
    if (current !== undefined && current !== null) return current;
  }
}

const str = (value: unknown, fallback = "") =>
  typeof value === "string" || typeof value === "number" ? String(value) : fallback;
const num = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function normalizeStatus(value: unknown): SessionStatus {
  const status = str(value).toLowerCase();
  if (["completed", "concluida", "concluído", "finalizada"].includes(status)) return "completed";
  if (["cancelled", "canceled", "cancelada"].includes(status)) return "cancelled";
  if (["in_progress", "andamento", "em andamento"].includes(status)) return "in_progress";
  return "scheduled";
}

export function normalizeSession(item: Dict, index = 0): ExperienceSession {
  const start = str(
    get(item, ["start", "date", "data", "scheduled_at", "dataHora", "data_hora", "created_at"]),
    new Date().toISOString()
  );

  const tipoLocal = str(get(item, ["tipoLocal", "tipo_local"]));
  let locationLabel = str(get(item, ["location", "local", "enderecoEncontro", "endereco_encontro", "meeting_url", "link"]));

  if (!locationLabel) {
    if (tipoLocal === "casa_aluno") locationLabel = "Domicílio (Casa do Aluno)";
    else if (tipoLocal === "online") locationLabel = "Online";
    else locationLabel = "Instituição de Ensino";
  }

  return {
    id: str(get(item, ["id", "_id", "uuid"]), `session-${index}`),
    title: str(get(item, ["title", "titulo", "subject.name", "disciplina.nome", "disciplinaId"]), "Sessão de monitoria"),
    subject: str(get(item, ["subject.name", "disciplina.nome", "subject", "disciplina", "disciplinaId"]), "Disciplina não informada"),
    monitorName: str(get(item, ["monitor.name", "monitor.nome", "monitorName", "nome_monitor"]), "Monitor"),
    institutionName: str(
      get(item, [
        "institutionName",
        "nomeInstituicao",
        "monitor.institution.nome",
        "monitor.institutionId.nome",
      ]),
    ),
    studentName: str(get(item, ["student.name", "aluno.nome", "studentName", "nome_aluno"])),
    start,
    end: str(get(item, ["end", "ends_at", "end_at", "data_fim"])),
    status: normalizeStatus(get(item, ["status", "situacao"])),
    location: locationLabel,
    description: str(get(item, ["description", "descricao", "notes", "observacoes"])),
  };
}

export interface ScheduleSessionPayload {
  monitorId: string;
  subject: string;
  date: string;
  time: string;
  tipoLocal: "escola" | "casa_aluno" | "online";
  enderecoEncontro?: string;
  coordinates?: [number, number]; 
}

export async function getSessions(): Promise<ExperienceSession[]> {
  const { data } = await api.get("/sessoes");
  return list(data).map(normalizeSession);
}

export async function getSessionHistory(): Promise<ExperienceSession[]> {
  try {
    const { data } = await api.get("/history");
    const normalized = list(data).map(normalizeSession);
    if (normalized.length) return normalized;
  } catch { /* endpoint opcional */ }
  return getSessions();
}

export async function updateMonitorPreferences(data: { aceitaMonitoriaCasa: boolean }) {
  const response = await api.put("/profile", data);
  return response.data;
}

export async function getMyMonitorProfile(): Promise<PublicMonitor & { aceitaMonitoriaCasa?: boolean }> {
  const { data } = await api.get("/profile");
  if (isObject(data)) {
    const inner = isObject(data.data) ? data.data : data;
    return normalizeMonitor(inner);
  }
  throw new Error("Não foi possível carregar os dados do seu perfil.");
}

export function normalizeMonitor(item: Dict, index = 0): PublicMonitor & { aceitaMonitoriaCasa?: boolean } {
  const rawSubjects = get(item, ["subjects", "disciplinas", "specialties"]);
  const subjects = Array.isArray(rawSubjects)
    ? rawSubjects.map((subject) => isObject(subject) ? str(get(subject, ["name", "nome"])) : str(subject)).filter(Boolean)
    : str(rawSubjects).split(",").map((item) => item.trim()).filter(Boolean);

  const rawAvailability = get(item, ["availability", "disponibilidade"]);
  const availability = Array.isArray(rawAvailability)
    ? rawAvailability.map((item) => str(item)).filter(Boolean)
    : str(rawAvailability).split(",").map((item) => item.trim()).filter(Boolean);

  return {
    id: str(get(item, ["id", "_id", "uuid"]), `monitor-${index}`),
    name: str(get(item, ["name", "nome", "user.name", "usuario.nome"]), "Monitor"),
    email: str(get(item, ["email", "user.email", "usuario.email"])),
    avatar: str(get(item, ["avatar", "photo", "foto", "image_url"])),
    bio: str(get(item, ["bio", "biografia", "description", "descricao"]), "Monitor disponível para ajudar estudantes a avançarem nos estudos."),
    institution: str(
      get(item, [
        "institutionId.nome",
        "institutionId.name",
        "institution.name",
        "instituicao.nome",
        "institution",
        "instituicao",
      ]),
    ),
    subjects,
    rating: num(get(item, ["rating", "average_rating", "media_avaliacoes", "nota"])),
    sessions: num(get(item, ["sessions", "sessions_count", "total_sessoes", "monitorias"])),
    certificates: num(get(item, ["certificates", "certificates_count", "total_certificados"])),
    city: str(get(item, ["city", "cidade", "address.city", "endereco.cidade"])),
    availability,
    aceitaMonitoriaCasa: Boolean(get(item, ["aceitaMonitoriaCasa", "aceita_monitoria_casa"])),
  };
}

export async function getMonitors(): Promise<Array<PublicMonitor & { aceitaMonitoriaCasa?: boolean }>> {
  const { data } = await api.get("/monitors");
  return list(data).map(normalizeMonitor);
}

export async function getMonitorsByInstitution(
  institutionId: string,
): Promise<Array<PublicMonitor & { aceitaMonitoriaCasa?: boolean }>> {
  const { data } = await api.get(`/monitors/institution/${institutionId}`);
  return list(data).map(normalizeMonitor);
}

export async function getMonitor(id: string): Promise<PublicMonitor & { aceitaMonitoriaCasa?: boolean }> {
  try {
    const { data } = await api.get(`/monitors/${id}`);
    if (isObject(data)) {
      const inner = isObject(data.data) ? data.data : data;
      return normalizeMonitor(inner);
    }
  } catch { /* fallback na listagem */ }
  const monitor = (await getMonitors()).find((item) => item.id === id);
  if (!monitor) throw new Error("Monitor não encontrado");
  return monitor;
}

export async function getMonitorSchedule(
  monitorId: string,
  date: string,
): Promise<MonitorSchedule> {
  const { data } = await api.get<MonitorSchedule>("/sessoes/disponibilidade", {
    params: { monitorId, data: date },
  });
  return data;
}

export async function scheduleMonitorSession(payload: ScheduleSessionPayload): Promise<void> {
  await api.post("/sessoes/solicitar", {
    monitorId: payload.monitorId,
    disciplinaId: payload.subject,
    dataHora: `${payload.date}T${payload.time}:00-03:00`,
    tipoLocal: payload.tipoLocal,
    enderecoEncontro: 
      payload.tipoLocal === "casa_aluno"
        ? payload.enderecoEncontro || "Casa do aluno"
        : payload.tipoLocal === "online"
        ? "Plataforma Online"
        : "Instituição de ensino",
    locationMeeting: {
      type: "Point",
      coordinates: payload.coordinates || [0, 0],
    },
  });
}

export async function cancelSession(sessionId: string): Promise<void> {
  await api.patch(`/sessoes/${sessionId}/status`, {
    status: "cancelada",
  });
}