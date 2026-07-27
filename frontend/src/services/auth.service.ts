import { api } from './api';
import type { LoginCredentials, LoginResponse } from '../types/auth';

export async function loginRequest(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', credentials);
  return data;
}
