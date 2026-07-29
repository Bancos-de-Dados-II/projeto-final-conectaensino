import type { AuthUser } from "../types/auth";

export type ApplicationRole = "student" | "monitor" | "director" | "admin";

export function getApplicationRole(
  user: AuthUser | null | undefined,
): ApplicationRole {
  const metadataRole =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role.toLocaleLowerCase("pt-BR")
      : "";
  const responseRole = user?.role?.toLocaleLowerCase("pt-BR") ?? "";
  const role = metadataRole || responseRole;

  if (role === "director" || role === "diretor") {
    return "director";
  }
  if (role === "admin" || role === "administrator") {
    return "admin";
  }
  if (role === "monitor") {
    return "monitor";
  }

  // Contas antigas de aluno podem possuir apenas o papel padrão
  // "authenticated" do Supabase.
  return "student";
}

export function canManageMonitors(
  user: AuthUser | null | undefined,
): boolean {
  const role = getApplicationRole(user);
  return role === "director" || role === "admin";
}
