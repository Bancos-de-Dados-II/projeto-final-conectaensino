import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearAuthSession,
  getAuthSession,
  isSessionExpired,
  saveAuthSession,
} from "../services/auth-storage";
import { loginRequest } from "../services/auth.service";
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
} from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedSession = await loginRequest(credentials);

    saveAuthSession(authenticatedSession);
    setSession(authenticatedSession);
  }, []);

  useEffect(() => {
    const storedSession = getAuthSession();

    if (storedSession && !isSessionExpired(storedSession)) {
      setSession(storedSession);
    } else if (storedSession) {
      clearAuthSession();
    }

    setIsInitializing(false);
  }, []);

  useEffect(() => {
    function handleExpiredSession() {
      logout();
    }

    window.addEventListener("auth:expired", handleExpiredSession);

    return () => {
      window.removeEventListener("auth:expired", handleExpiredSession);
    };
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session?.accessToken),
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
