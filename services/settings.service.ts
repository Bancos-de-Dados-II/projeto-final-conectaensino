import { api } from "../api/axios";
import type {
  AccountDocument,
  SettingsPreferences,
  SettingsProfile,
} from "../types/settings";

const PREFERENCES_KEY = "conecta-ensino:settings";
const PROFILE_KEY = "conecta-ensino:profile";
const DOCUMENTS_KEY = "conecta-ensino:documents";

export const defaultPreferences: SettingsPreferences = {
  theme: "original",
  compactMode: false,
  emailNotifications: true,
  browserNotifications: true,
  sessionReminders: true,
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export async function getSettingsPreferences() {
  try {
    const { data } = await api.get("/preferences");
    return { ...defaultPreferences, ...(data?.data ?? data) };
  } catch {
    return loadLocal(PREFERENCES_KEY, defaultPreferences);
  }
}

export async function updateSettingsPreferences(
  preferences: SettingsPreferences,
) {
  saveLocal(PREFERENCES_KEY, preferences);

  try {
    const { data } = await api.put("/preferences", preferences);
    return { ...preferences, ...(data?.data ?? data) };
  } catch {
    return preferences;
  }
}

export async function getSettingsProfile(): Promise<SettingsProfile> {
  const fallback = loadLocal<SettingsProfile>(PROFILE_KEY, {
    name: "Usuário",
    email: "",
    phone: "",
    institution: "",
    bio: "",
  });

  for (const endpoint of ["/auth/me", "/profile", "/users/me"]) {
    try {
      const { data } = await api.get(endpoint);
      const source = data?.data ?? data?.user ?? data;

      return {
        id: String(source?.id ?? source?._id ?? ""),
        name: String(source?.name ?? source?.nome ?? fallback.name),
        email: String(source?.email ?? fallback.email),
        phone: String(source?.phone ?? source?.telefone ?? ""),
        institution: String(
          source?.institution?.name ??
            source?.instituicao?.nome ??
            source?.institution ??
            "",
        ),
        bio: String(source?.bio ?? source?.biografia ?? ""),
        avatar: String(
          source?.avatar ?? source?.photo ?? source?.foto ?? "",
        ),
      };
    } catch {
      // Tenta o próximo endpoint disponível.
    }
  }

  return fallback;
}

export async function updateSettingsProfile(
  profile: SettingsProfile,
): Promise<SettingsProfile> {
  saveLocal(PROFILE_KEY, profile);

  for (const endpoint of ["/profile", "/users/me"]) {
    try {
      const { data } = await api.put(endpoint, profile);
      return { ...profile, ...(data?.data ?? data) };
    } catch {
      // Tenta o próximo endpoint.
    }
  }

  return profile;
}

export async function uploadProfileAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "avatar");

  try {
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return String(
      data?.url ?? data?.data?.url ?? URL.createObjectURL(file),
    );
  } catch {
    return URL.createObjectURL(file);
  }
}

export async function getAccountDocuments(): Promise<AccountDocument[]> {
  try {
    const { data } = await api.get("/documents");
    const items = data?.data ?? data?.items ?? data;

    if (Array.isArray(items)) {
      return items.map((item, index) => ({
        id: String(item.id ?? item._id ?? `document-${index}`),
        name: String(item.name ?? item.nome ?? item.filename ?? "Documento"),
        size: Number(item.size ?? item.tamanho ?? 0),
        type: String(item.type ?? item.tipo ?? "application/octet-stream"),
        url: String(item.url ?? item.link ?? ""),
        createdAt: String(
          item.createdAt ??
            item.created_at ??
            item.criado_em ??
            new Date().toISOString(),
        ),
      }));
    }
  } catch {
    // Usa a persistência local.
  }

  return loadLocal<AccountDocument[]>(DOCUMENTS_KEY, []);
}

export async function uploadAccountDocument(
  file: File,
): Promise<AccountDocument> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "document");

  try {
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const source = data?.data ?? data?.file ?? data;

    return {
      id: String(source?.id ?? source?._id ?? `document-${Date.now()}`),
      name: String(source?.name ?? source?.filename ?? file.name),
      size: Number(source?.size ?? file.size),
      type: String(source?.type ?? file.type),
      url: String(source?.url ?? URL.createObjectURL(file)),
      createdAt: String(
        source?.createdAt ??
          source?.created_at ??
          new Date().toISOString(),
      ),
    };
  } catch {
    const document: AccountDocument = {
      id: `local-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    };

    const current = loadLocal<AccountDocument[]>(DOCUMENTS_KEY, []);
    saveLocal(DOCUMENTS_KEY, [document, ...current]);
    return document;
  }
}

export async function removeAccountDocument(id: string) {
  try {
    await api.delete(`/documents/${id}`);
  } catch {
    const current = loadLocal<AccountDocument[]>(DOCUMENTS_KEY, []);
    saveLocal(
      DOCUMENTS_KEY,
      current.filter((document) => document.id !== id),
    );
  }
}
