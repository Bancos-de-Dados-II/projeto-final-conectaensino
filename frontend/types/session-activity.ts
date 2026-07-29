export interface SessionActivity {
  id: string;
  sessionId: string;
  originalName: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png";
  size: number;
  createdAt?: string;
}
