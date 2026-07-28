import type { AuthSession } from "../types/auth";

const STORAGE_KEY = "conecta_ensino_auth";

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  const storedSession = localStorage.getItem(STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as AuthSession;

    if (
      !parsedSession.accessToken ||
      !parsedSession.refreshToken ||
      !parsedSession.user
    ) {
      clearAuthSession();
      return null;
    }

    return parsedSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isSessionExpired(session: AuthSession): boolean {
  if (!session.expiresAt) {
    return false;
  }

  return Date.now() >= session.expiresAt;
}
