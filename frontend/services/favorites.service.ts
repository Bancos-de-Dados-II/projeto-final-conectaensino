import { api } from "../api/axios";

const STORAGE_KEY = "conecta-ensino:favorites";

function localIds(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch { return []; }
}

function saveLocal(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const { data } = await api.get("/favorites");
    const source = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
    if (Array.isArray(source)) {
      const ids = source.map((item) => String(item?.monitor_id ?? item?.monitorId ?? item?.id ?? item)).filter(Boolean);
      saveLocal(ids);
      return ids;
    }
  } catch { /* backend opcional */ }
  return localIds();
}

export async function toggleFavorite(monitorId: string, favorite: boolean): Promise<void> {
  const current = localIds();
  saveLocal(favorite ? [...current, monitorId] : current.filter((id) => id !== monitorId));
  try {
    if (favorite) await api.post("/favorites", { monitor_id: monitorId });
    else await api.delete(`/favorites/${monitorId}`);
  } catch { /* mantém fallback local */ }
}
