import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type LayoutMode = "modern" | "traditional";

interface LayoutModeContextValue {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
}

const LayoutModeContext = createContext<LayoutModeContextValue | null>(null);
const STORAGE_KEY = "conecta-ensino:layout-mode";

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "traditional" ? "traditional" : "modern";
    } catch {
      return "modern";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, layoutMode);
      document.documentElement.dataset.layout = layoutMode;
    } catch {
      // Ignora falhas de localStorage
    }
  }, [layoutMode]);

  const setLayoutMode = (mode: LayoutMode) => setLayoutModeState(mode);
  const toggleLayoutMode = () =>
    setLayoutModeState((prev) => (prev === "modern" ? "traditional" : "modern"));

  return (
    <LayoutModeContext.Provider value={{ layoutMode, setLayoutMode, toggleLayoutMode }}>
      {children}
    </LayoutModeContext.Provider>
  );
}

export function useLayoutMode() {
  const context = useContext(LayoutModeContext);
  if (!context) {
    throw new Error("useLayoutMode deve ser usado dentro de LayoutModeProvider.");
  }
  return context;
}