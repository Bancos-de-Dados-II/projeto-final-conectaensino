import { api } from "../api/axios";
import type { SessionActivity } from "../types/session-activity";

export async function listSessionActivities(): Promise<SessionActivity[]> {
  const { data } = await api.get<SessionActivity[]>("/sessoes/atividades");
  return Array.isArray(data) ? data : [];
}

export async function uploadSessionActivity(
  sessionId: string,
  file: File,
): Promise<SessionActivity> {
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler o arquivo."));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsDataURL(file);
  });

  const { data } = await api.post<SessionActivity>(
    `/sessoes/${sessionId}/atividades`,
    {
      originalName: file.name,
      contentBase64,
    },
  );
  return data;
}

export async function downloadSessionActivity(
  activity: SessionActivity,
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/sessoes/atividades/${activity.id}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = activity.originalName;
  anchor.click();
  URL.revokeObjectURL(url);
}
