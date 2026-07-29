import { api } from "../api/axios";
import type {
  DashboardActivity,
  DashboardChartItem,
  DashboardData,
  DashboardStats,
  NotificationItem,
} from "../types/dashboard";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function collection(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.students,
    payload.alunos,
    payload.monitors,
    payload.sessoes,
    payload.sessions,
    payload.certificados,
    payload.avaliacoes,
    payload.disciplinas,
    payload.institutions,
  ];

  for (const candidate of candidates) {
    const result = collection(candidate);

    if (result.length) {
      return result;
    }
  }

  return [];
}

function read(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    const parts = key.split(".");
    let current: unknown = record;

    for (const part of parts) {
      if (!isRecord(current) || !(part in current)) {
        current = undefined;
        break;
      }

      current = current[part];
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return undefined;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function number(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function dateValue(record: UnknownRecord): Date | null {
  const raw = read(record, [
    "date",
    "data",
    "created_at",
    "createdAt",
    "scheduled_at",
    "issued_at",
  ]);

  if (typeof raw !== "string") {
    return null;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function idOf(record: UnknownRecord, index: number): string {
  return text(read(record, ["id", "_id", "uuid"]), `item-${index}`);
}

async function safeList(endpoint: string): Promise<UnknownRecord[]> {
  try {
    const { data } = await api.get(endpoint);
    return collection(data);
  } catch {
    return [];
  }
}

function sessionsChart(sessions: UnknownRecord[]): DashboardChartItem[] {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: formatter.format(date).replace(".", ""),
      value: 0,
    };
  });

  sessions.forEach((session) => {
    const date = dateValue(session);

    if (!date) {
      return;
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const month = months.find((item) => item.key === key);

    if (month) {
      month.value += 1;
    }
  });

  return months.map(({ label, value }) => ({ label, value }));
}

function subjectRanking(
  sessions: UnknownRecord[],
  subjects: UnknownRecord[],
): DashboardChartItem[] {
  const counter = new Map<string, number>();

  sessions.forEach((session) => {
    const label = text(
      read(session, [
        "subject.name",
        "disciplina.nome",
        "subject",
        "disciplina",
        "title",
        "titulo",
      ]),
      "Outras",
    );

    counter.set(label, (counter.get(label) || 0) + 1);
  });

  if (!counter.size) {
    subjects.slice(0, 5).forEach((subject) => {
      const label = text(read(subject, ["name", "nome"]), "Disciplina");
      counter.set(label, number(read(subject, ["sessions", "total"]), 0));
    });
  }

  return [...counter.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

function ratingsChart(reviews: UnknownRecord[]): DashboardChartItem[] {
  return [1, 2, 3, 4, 5].map((rating) => ({
    label: `${rating}★`,
    value: reviews.filter((review) => {
      const value = Math.round(
        number(read(review, ["rating", "nota", "score", "avaliacao"])),
      );

      return value === rating;
    }).length,
  }));
}

function buildActivities(
  students: UnknownRecord[],
  sessions: UnknownRecord[],
  certificates: UnknownRecord[],
  reviews: UnknownRecord[],
): DashboardActivity[] {
  const activities: Array<DashboardActivity & { timestamp: number }> = [];

  students.slice(0, 4).forEach((student, index) => {
    const date = dateValue(student);

    activities.push({
      id: `student-${idOf(student, index)}`,
      type: "student",
      title: "Novo aluno cadastrado",
      description: text(read(student, ["name", "nome", "email"]), "Novo aluno"),
      date: date?.toISOString(),
      timestamp: date?.getTime() || 0,
    });
  });

  sessions.slice(0, 5).forEach((session, index) => {
    const date = dateValue(session);

    activities.push({
      id: `session-${idOf(session, index)}`,
      type: "session",
      title: "Sessão de monitoria",
      description: text(
        read(session, ["title", "titulo", "subject.name", "disciplina.nome"]),
        "Nova sessão",
      ),
      date: date?.toISOString(),
      timestamp: date?.getTime() || 0,
    });
  });

  certificates.slice(0, 3).forEach((certificate, index) => {
    const date = dateValue(certificate);

    activities.push({
      id: `certificate-${idOf(certificate, index)}`,
      type: "certificate",
      title: "Certificado emitido",
      description: text(
        read(certificate, ["title", "titulo", "student.name", "aluno.nome"]),
        "Novo certificado",
      ),
      date: date?.toISOString(),
      timestamp: date?.getTime() || 0,
    });
  });

  reviews.slice(0, 3).forEach((review, index) => {
    const date = dateValue(review);
    const rating = number(read(review, ["rating", "nota", "score"]));

    activities.push({
      id: `review-${idOf(review, index)}`,
      type: "review",
      title: "Nova avaliação recebida",
      description: `Nota ${rating.toFixed(1)} registrada na plataforma`,
      date: date?.toISOString(),
      timestamp: date?.getTime() || 0,
    });
  });

  return activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8)
    .map(({ timestamp: _, ...activity }) => activity);
}

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const { data } = await api.get("/dashboard");

    if (isRecord(data) && isRecord(data.stats)) {
      const stats = data.stats;

      return {
        stats: {
          students: number(read(stats, ["students", "alunos"])),
          monitors: number(read(stats, ["monitors"])),
          sessions: number(read(stats, ["sessions", "sessoes"])),
          certificates: number(read(stats, ["certificates", "certificados"])),
          averageRating: number(
            read(stats, ["averageRating", "average_rating", "media_avaliacoes"]),
          ),
        },
        sessionsByMonth: collection(data.sessionsByMonth).map((item) => ({
          label: text(read(item, ["label", "month", "mes"])),
          value: number(read(item, ["value", "total"])),
        })),
        subjectsRanking: collection(data.subjectsRanking).map((item) => ({
          label: text(read(item, ["label", "name", "nome"])),
          value: number(read(item, ["value", "total"])),
        })),
        ratingsDistribution: collection(data.ratingsDistribution).map(
          (item) => ({
            label: text(read(item, ["label", "rating", "nota"])),
            value: number(read(item, ["value", "total"])),
          }),
        ),
        activities: collection(data.activities).map((item, index) => ({
          id: idOf(item, index),
          type: "session",
          title: text(read(item, ["title", "titulo"]), "Atividade"),
          description: text(read(item, ["description", "descricao"])),
          date: text(read(item, ["date", "data", "created_at"])),
        })),
      };
    }
  } catch {
    // Usa agregação dos endpoints existentes.
  }

  const [students, monitors, sessions, certificates, reviews, subjects] =
    await Promise.all([
      safeList("/students"),
      safeList("/monitors"),
      safeList("/sessoes"),
      safeList("/certificados"),
      safeList("/avaliacoes"),
      safeList("/disciplinas"),
    ]);

  const ratings = reviews
    .map((review) =>
      number(read(review, ["rating", "nota", "score", "avaliacao"])),
    )
    .filter((rating) => rating > 0);

  const stats: DashboardStats = {
    students: students.length,
    monitors: monitors.length,
    sessions: sessions.length,
    certificates: certificates.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0,
  };

  return {
    stats,
    sessionsByMonth: sessionsChart(sessions),
    subjectsRanking: subjectRanking(sessions, subjects),
    ratingsDistribution: ratingsChart(reviews),
    activities: buildActivities(students, sessions, certificates, reviews),
  };
}

export async function getNotifications(): Promise<NotificationItem[]> {
  try {
    const { data } = await api.get("/notifications");

    return collection(data).map((item, index) => ({
      id: idOf(item, index),
      title: text(read(item, ["title", "titulo"]), "Notificação"),
      description: text(read(item, ["description", "descricao", "message"])),
      type:
        (text(read(item, ["type", "tipo"]), "info") as
          NotificationItem["type"]),
      read: Boolean(read(item, ["read", "lida", "is_read"])),
      date: text(read(item, ["date", "data", "created_at"])),
      route: text(read(item, ["route", "url"])),
    }));
  } catch {
    const dashboard = await getDashboardData();

    return dashboard.activities.slice(0, 6).map((activity) => ({
      id: activity.id,
      title: activity.title,
      description: activity.description,
      type: activity.type === "review" ? "success" : "info",
      read: false,
      date: activity.date,
      route:
        activity.type === "session"
          ? "/sessoes"
          : activity.type === "certificate"
            ? "/certificados"
            : activity.type === "review"
              ? "/avaliacoes"
              : activity.type === "student"
                ? "/alunos"
                : "/dashboard",
    }));
  }
}
