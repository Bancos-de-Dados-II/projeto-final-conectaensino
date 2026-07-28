import { api } from "../api/axios";
import type {
  AuthSession,
  LoginCredentials,
  LoginResponse,
} from "../types/auth";

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  const { data } = await api.post<LoginResponse>("/auth/login", credentials);

  const expiresAt =
    typeof data.expires_in === "number"
      ? Date.now() + data.expires_in * 1000
      : null;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    user: data.user,
  };
}
