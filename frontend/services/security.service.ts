import { api } from "../api/axios";

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<string> {
  const { data } = await api.patch<{ message: string }>("/profile/security/password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return data.message;
}

export async function revokeOtherSessions(): Promise<string> {
  const { data } = await api.post<{ message: string }>("/profile/security/revoke-sessions");
  return data.message;
}

export async function deleteOwnAccount(password: string): Promise<void> {
  await api.delete("/profile/security/account", { data: { password } });
}
