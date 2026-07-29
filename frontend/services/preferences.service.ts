import { api } from "../api/axios";
import type {
  AccountProfile,
  UserPreferences,
} from "../types/preferences";

const PREFERENCES_KEY = "conecta-ensino:preferences";
const PROFILE_KEY = "conecta-ensino:profile";

const defaults: UserPreferences = {
  theme: "dark",
  emailNotifications: true,
  browserNotifications: true,
  sessionReminders: true,
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const { data } = await api.get("/preferences");
    return { ...defaults, ...(data?.data ?? data) };
  } catch {
    return readLocal(PREFERENCES_KEY, defaults);
  }
}

export async function savePreferences(
  preferences: UserPreferences,
): Promise<UserPreferences> {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));

  try {
    const { data } = await api.put("/preferences", preferences);
    return { ...preferences, ...(data?.data ?? data) };
  } catch {
    return preferences;
  }
}

export async function getProfile(): Promise<AccountProfile> {
  const fallback = readLocal<AccountProfile>(PROFILE_KEY, {
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
        name: String(source?.name ?? source?.nome ?? fallback.name),
        email: String(source?.email ?? fallback.email),
        phone: String(source?.phone ?? source?.telefone ?? fallback.phone),
        institution: String(
          source?.institution?.name ??
            source?.instituicao?.nome ??
            source?.institution ??
            fallback.institution,
        ),
        bio: String(source?.bio ?? source?.biografia ?? fallback.bio),
        avatar: String(
          source?.avatar ?? source?.photo ?? source?.foto ?? fallback.avatar ?? "",
        ),
      };
    } catch {
    }
  }

  return fallback;
}

export async function saveProfile(
  profile: AccountProfile,
): Promise<AccountProfile> {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  for (const endpoint of ["/profile", "/users/me"]) {
    try {
      const { data } = await api.put(endpoint, profile);
      return { ...profile, ...(data?.data ?? data) };
    } catch {
    }
  }

  return profile;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return String(data?.url ?? data?.data?.url ?? URL.createObjectURL(file));
  } catch {
    return URL.createObjectURL(file);
  }
}
