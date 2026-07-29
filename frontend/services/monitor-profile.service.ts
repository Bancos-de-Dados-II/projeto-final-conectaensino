import { api } from "../api/axios";

type PopulatedInstitution = {
  _id?: string;
  id?: string;
  nome?: string;
  name?: string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
};

export interface OwnMonitorProfile {
  name?: string;
  email?: string;
  avatar?: string;
  mustChangePassword?: boolean;
  tipoDeficiencia?: string;
  specialty?: string;
  institutionId?: PopulatedInstitution | string;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Não foi possível ler a foto."));
    reader.onerror = () => reject(new Error("Não foi possível ler a foto."));
    reader.readAsDataURL(file);
  });
}

export async function getOwnMonitorProfile(): Promise<OwnMonitorProfile> {
  const { data } = await api.get<OwnMonitorProfile>("/monitors/me");
  return data;
}

export async function updateOwnMonitorInstitution(
  institutionId: string,
): Promise<{ institutionName: string; distanceKm: number }> {
  const { data } = await api.patch<{
    institutionName: string;
    distanceKm: number;
  }>("/monitors/me/institution", { institutionId });
  return data;
}

export async function updateOwnMonitorAvatar(file: File): Promise<string> {
  const contentBase64 = await readFileAsDataUrl(file);
  const { data } = await api.patch<{ avatar: string }>(
    "/monitors/me/avatar",
    { contentBase64 },
  );
  return data.avatar;
}

export async function getOwnAccountProfile(): Promise<OwnMonitorProfile> {
  const { data } = await api.get<OwnMonitorProfile>("/profile");
  return data;
}

export async function updateOwnAccountInstitution(
  institutionId: string,
): Promise<{ institutionName: string; distanceKm: number }> {
  const { data } = await api.patch<{
    institutionName: string;
    distanceKm: number;
  }>("/profile/institution", { institutionId });
  return data;
}

export async function updateOwnAccountAvatar(file: File): Promise<string> {
  const contentBase64 = await readFileAsDataUrl(file);
  const { data } = await api.patch<{ avatar: string }>(
    "/profile/avatar",
    { contentBase64 },
  );
  return data.avatar;
}

export async function updateRequiredPassword(
  newPassword: string,
  confirmPassword: string,
): Promise<void> {
  await api.patch("/profile/password", { newPassword, confirmPassword });
}
