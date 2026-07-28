import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  defaultPreferences,
  getSettingsPreferences,
  updateSettingsPreferences,
} from "../services/settings.service";
import type {
  SettingsPreferences,
  ThemePreference,
} from "../types/settings";

interface AppearanceContextValue {
  preferences: SettingsPreferences;
  loading: boolean;
  changePreferences: (
    patch: Partial<SettingsPreferences>,
  ) => Promise<void>;
}

const AppearanceContext =
  createContext<AppearanceContextValue | null>(null);

function resolveTheme(theme: ThemePreference) {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "original";
}

export function AppearanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] =
    useState<SettingsPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getSettingsPreferences()
      .then(setPreferences)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(
      preferences.theme,
    );
    document.documentElement.dataset.density =
      preferences.compactMode ? "compact" : "comfortable";
  }, [preferences]);

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preferences.theme]);

  async function changePreferences(
    patch: Partial<SettingsPreferences>,
  ) {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    await updateSettingsPreferences(next);
  }

  const value = useMemo(
    () => ({ preferences, loading, changePreferences }),
    [preferences, loading],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error(
      "useAppearance deve ser usado dentro de AppearanceProvider.",
    );
  }

  return context;
}
