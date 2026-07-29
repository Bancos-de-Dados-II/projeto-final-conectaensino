import { api } from "../api/axios";
import type {
  AssignedTask,
  EligibleStudent,
  TaskStatus,
} from "../types/task";

export async function getEligibleStudents(): Promise<EligibleStudent[]> {
  const { data } = await api.get<EligibleStudent[]>("/tasks/students");
  return Array.isArray(data) ? data : [];
}

export async function createTask(payload: {
  studentId: string;
  title: string;
  subject: string;
  description: string;
}): Promise<AssignedTask> {
  const { data } = await api.post<AssignedTask>("/tasks", payload);
  return data;
}

export async function getTasks(): Promise<AssignedTask[]> {
  const { data } = await api.get<AssignedTask[]>("/tasks");
  return Array.isArray(data) ? data : [];
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<AssignedTask> {
  const { data } = await api.patch<AssignedTask>(
    `/tasks/${taskId}/status`,
    { status },
  );
  return data;
}
