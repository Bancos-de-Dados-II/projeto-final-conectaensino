import { api } from "../api/axios";
import type {
  CertificateRecord,
  ProfileData,
  ReviewRecord,
  SessionRecord,
} from "../types/domain";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readNested(record: UnknownRecord, paths: string[]): unknown {
  for (const path of paths) {
    const keys = path.split(".");
    let current: unknown = record;

    for (const key of keys) {
      if (!isRecord(current) || !(key in current)) {
        current = undefined;
        break;
      }

      current = current[key];
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return undefined;
}

function extractCollection(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.sessoes,
    payload.sessions,
    payload.certificados,
    payload.certificates,
    payload.avaliacoes,
    payload.reviews,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (isRecord(candidate)) {
      const nested = extractCollection(candidate);

      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function normalizeId(record: UnknownRecord, index: number): string {
  return (
    asString(
      readNested(record, ["id", "_id", "uuid", "session_id", "certificate_id"]),
    ) || `temporary-${index}`
  );
}

export async function listSessions(): Promise<SessionRecord[]> {
  const { data } = await api.get("/sessoes");

  return extractCollection(data)
    .filter(isRecord)
    .map((record, index) => ({
      id: normalizeId(record, index),
      title:
        asString(
          readNested(record, [
            "title",
            "titulo",
            "subject.name",
            "disciplina.nome",
            "subject",
          ]),
        ) || "Sessão de monitoria",
      date: asString(
        readNested(record, [
          "date",
          "data",
          "scheduled_at",
          "scheduledAt",
          "start_time",
        ]),
      ),
      time: asString(readNested(record, ["time", "hora", "startTime"])),
      status: asString(readNested(record, ["status", "situacao"])),
      studentName: asString(
        readNested(record, [
          "student.name",
          "student.nome",
          "aluno.nome",
          "student_name",
        ]),
      ),
      monitorName: asString(
        readNested(record, [
          "monitor.name",
          "monitor.nome",
          "monitor_name",
        ]),
      ),
      subjectName: asString(
        readNested(record, [
          "subject.name",
          "disciplina.nome",
          "subject",
          "disciplina",
        ]),
      ),
      notes: asString(
        readNested(record, ["notes", "observacoes", "description"]),
      ),
      raw: record,
    }));
}

export async function createSession(
  payload: Record<string, unknown>,
): Promise<void> {
  await api.post("/sessoes", payload);
}

export async function updateSession(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await api.put(`/sessoes/${id}`, payload);
}

export async function deleteSession(id: string): Promise<void> {
  await api.delete(`/sessoes/${id}`);
}

export async function listCertificates(): Promise<CertificateRecord[]> {
  const { data } = await api.get("/certificados");

  return extractCollection(data)
    .filter(isRecord)
    .map((record, index) => ({
      id: normalizeId(record, index),
      title:
        asString(
          readNested(record, ["title", "titulo", "course", "curso"]),
        ) || "Certificado",
      studentName: asString(
        readNested(record, [
          "student.name",
          "student.nome",
          "aluno.nome",
          "student_name",
          "name",
          "nome",
        ]),
      ),
      subjectName: asString(
        readNested(record, [
          "subject.name",
          "disciplina.nome",
          "subject",
          "disciplina",
        ]),
      ),
      issuedAt: asString(
        readNested(record, [
          "issued_at",
          "issuedAt",
          "created_at",
          "createdAt",
          "data_emissao",
        ]),
      ),
      code: asString(
        readNested(record, ["code", "codigo", "verification_code"]),
      ),
      status: asString(readNested(record, ["status", "situacao"])),
      raw: record,
    }));
}

export async function issueCertificate(
  payload: Record<string, unknown>,
): Promise<void> {
  await api.post("/certificados", payload);
}

export async function deleteCertificate(id: string): Promise<void> {
  await api.delete(`/certificados/${id}`);
}

export async function listReviews(): Promise<ReviewRecord[]> {
  const { data } = await api.get("/avaliacoes");

  return extractCollection(data)
    .filter(isRecord)
    .map((record, index) => ({
      id: normalizeId(record, index),
      reviewerName: asString(
        readNested(record, [
          "reviewer.name",
          "avaliador.nome",
          "author.name",
          "student.name",
          "student.nome",
        ]),
      ),
      reviewedName: asString(
        readNested(record, [
          "reviewed.name",
          "avaliado.nome",
          "monitor.name",
          "monitor.nome",
        ]),
      ),
      rating:
        asNumber(
          readNested(record, ["rating", "nota", "score", "avaliacao"]),
        ) || 0,
      comment: asString(
        readNested(record, ["comment", "comentario", "description"]),
      ),
      createdAt: asString(
        readNested(record, ["created_at", "createdAt", "date", "data"]),
      ),
      raw: record,
    }));
}

export async function createReview(
  payload: Record<string, unknown>,
): Promise<void> {
  await api.post("/avaliacoes", payload);
}

export async function getProfile(): Promise<ProfileData | null> {
  const endpoints = ["/auth/me", "/profile", "/users/me"];

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint);
      const record = isRecord(data) && isRecord(data.data) ? data.data : data;

      if (!isRecord(record)) {
        continue;
      }

      return {
        id: asString(readNested(record, ["id", "_id", "uuid"])),
        name:
          asString(
            readNested(record, [
              "name",
              "nome",
              "user_metadata.name",
              "profile.name",
            ]),
          ) || "",
        email:
          asString(readNested(record, ["email", "user.email"])) || "",
        role: asString(readNested(record, ["role", "perfil"])),
        phone: asString(readNested(record, ["phone", "telefone"])),
        institution: asString(
          readNested(record, ["institution", "instituicao"]),
        ),
        course: asString(readNested(record, ["course", "curso"])),
      };
    } catch {
      // tenta o próximo endpoint
    }
  }

  return null;
}

export async function updateProfile(
  payload: Record<string, unknown>,
): Promise<void> {
  const endpoints = ["/profile", "/users/me"];

  for (const endpoint of endpoints) {
    try {
      await api.put(endpoint, payload);
      return;
    } catch {
      // tenta o próximo endpoint
    }
  }

  throw new Error("Nenhum endpoint de perfil respondeu.");
}
