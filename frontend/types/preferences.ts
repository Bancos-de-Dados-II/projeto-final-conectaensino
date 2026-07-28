export type ThemeMode = "dark" | "light" | "system";

export interface UserPreferences {
  theme: ThemeMode;
  emailNotifications: boolean;
  browserNotifications: boolean;
  sessionReminders: boolean;
}

export interface AccountProfile {
  name: string;
  email: string;
  phone: string;
  institution: string;
  bio: string;
  avatar?: string;
}
