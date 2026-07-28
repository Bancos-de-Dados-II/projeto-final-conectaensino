import axios, { AxiosError } from "axios";

import {
  clearAuthSession,
  getAuthSession,
  isSessionExpired,
} from "../services/auth-storage";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const session = getAuthSession();

  if (!session) {
    return config;
  }

  if (isSessionExpired(session)) {
    clearAuthSession();
    window.dispatchEvent(new Event("auth:expired"));
    return config;
  }

  config.headers.Authorization = `Bearer ${session.accessToken}`;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  },
);

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}
