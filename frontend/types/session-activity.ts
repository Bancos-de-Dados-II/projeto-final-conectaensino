export interface SessionActivity {
  id: string;
  sessionId: string;
  originalName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  size: number;
  createdAt?: string;
}

export interface SessionActivityReport {
  sent: number;
  completed: number;
  pending: number;
  notDone: number;
  totalSessions: number;
  generatedAt: string;
}
