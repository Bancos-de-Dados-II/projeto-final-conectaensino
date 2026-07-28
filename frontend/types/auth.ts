export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type?: string;
  expires_in?: number;
  user: AuthUser;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number | null;
  user: AuthUser;
}
