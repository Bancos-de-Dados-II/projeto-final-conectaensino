export type TaskStatus = "pending" | "in_progress" | "completed";

export interface AssignedTask {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  monitorId: string;
  monitorName: string;
  status: TaskStatus;
  createdAt?: string;
}

export interface EligibleStudent {
  id: string;
  userId: string;
  name: string;
  email?: string;
}
