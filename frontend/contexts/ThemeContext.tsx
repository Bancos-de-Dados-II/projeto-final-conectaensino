import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getPreferences,
  savePreferences,
} from "../services/preferences.service";
import type {
  ThemeMode,
  UserPreferences,
} from "../types/preferences";

interface ThemeContextValue {
  preferences: UserPreferences;
  setTheme: (theme: ThemeMode) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const initial: UserPreferences = {
  theme: "dark",
  emailNotifications: true,
  browserNotifications: true,
  sessionReminders: true,
};

function resolvedTheme(theme: ThemeMode) {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(initial);

  useEffect(() => {
    void getPreferences().then(setPreferences);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme =
      resolvedTheme(preferences.theme);
  }, [preferences.theme]);

  function updatePreferences(patch: Partial<UserPreferences>) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    void savePreferences(next);
  }

  const value = useMemo(
    () => ({
      preferences,
      setTheme: (theme: ThemeMode) => updatePreferences({ theme }),
      updatePreferences,
    }),
    [preferences],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
