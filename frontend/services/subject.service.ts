import { api } from "../api/axios";

export interface SubjectSuggestionRecord {
  _id: string;
  name: string;
  suggestedByRole: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
}

export async function getSubjectCatalog(): Promise<string[]> {
  const { data } = await api.get<string[]>("/disciplinas/catalog");
  return Array.isArray(data) ? data : [];
}

export async function suggestSubject(name: string): Promise<void> {
  await api.post("/disciplinas/suggestions", { name });
}

export async function getSubjectSuggestions(): Promise<SubjectSuggestionRecord[]> {
  const { data } = await api.get<SubjectSuggestionRecord[]>("/disciplinas/suggestions");
  return Array.isArray(data) ? data : [];
}

export async function reviewSubjectSuggestion(id: string, status: "approved" | "rejected"): Promise<void> {
  await api.patch(`/disciplinas/suggestions/${id}`, { status });
}
