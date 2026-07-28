import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api } from '../services/api';

type User = {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
};

type LoginInput = { email: string; password: string };
type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): User | null {
  try {
    const value = localStorage.getItem('@conecta:user');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);
  const [isLoading, setIsLoading] = useState(false);

  async function login(input: LoginInput) {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', input);
      localStorage.setItem('@conecta:access_token', data.access_token);
      localStorage.setItem('@conecta:refresh_token', data.refresh_token);
      localStorage.setItem('@conecta:user', JSON.stringify(data.user));
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('@conecta:access_token');
    localStorage.removeItem('@conecta:refresh_token');
    localStorage.removeItem('@conecta:user');
    setUser(null);
  }

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user), isLoading, login, logout }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
