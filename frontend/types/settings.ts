export type ThemePreference = "original" | "light" | "system";

export interface SettingsPreferences {
  theme: ThemePreference;
  compactMode: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  sessionReminders: boolean;
}

export interface SettingsProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  institution: string;
  bio: string;
  avatar?: string;
}

export interface AccountDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  createdAt: string;
}
