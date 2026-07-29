import { api } from "../api/axios";

export type LinkedStudentProfile = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  institutionName: string;
  specialty: string;
  accessibilityNeeds: string;
};

export async function getLinkedStudentProfile(
  id: string,
): Promise<LinkedStudentProfile> {
  const { data } = await api.get<LinkedStudentProfile>(
    `/students/${encodeURIComponent(id)}/profile`,
  );
  return data;
}
