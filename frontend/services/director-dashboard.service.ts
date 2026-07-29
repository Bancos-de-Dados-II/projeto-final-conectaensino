import { api } from "../api/axios";

export type Performance = { total: number; completed: number; percentage: number };
export type DirectorPerson = {
  id: string;
  name: string;
  email: string;
  active?: boolean;
  performance: Performance;
};
export type DirectorDashboardData = {
  institution: { id: string; name: string };
  students: DirectorPerson[];
  monitors: DirectorPerson[];
  sessionCount: number;
  completedSessionCount: number;
};
export type DirectorNote = { _id: string; content: string; createdAt: string };
export type DirectorMessage = {
  _id: string;
  senderName: string;
  institutionName: string;
  content: string;
  createdAt: string;
};
export type DirectorRegistration = {
  id: string;
  type: "student" | "monitor";
  name: string;
  email: string;
  institutionName: string;
  createdAt: string;
  legacy: boolean;
};

export const getDirectorDashboard = async () =>
  (await api.get<DirectorDashboardData>("/directors/dashboard")).data;
export const getDirectorRegistrationHistory = async () =>
  (await api.get<DirectorRegistration[]>("/directors/registration-history")).data;
export const getDirectorNotes = async () =>
  (await api.get<DirectorNote[]>("/directors/notes")).data;
export const createDirectorNote = async (content: string) =>
  (await api.post<DirectorNote>("/directors/notes", { content })).data;
export const deleteDirectorNote = async (id: string) => {
  await api.delete(`/directors/notes/${id}`);
};
export const getDirectorMessages = async () =>
  (await api.get<DirectorMessage[]>("/directors/messages")).data;
export const sendDirectorMessage = async (content: string) =>
  (await api.post<DirectorMessage>("/directors/messages", { content })).data;
