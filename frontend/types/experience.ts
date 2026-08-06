export type SessionStatus = "scheduled" | "completed" | "cancelled" | "in_progress";

export interface ExperienceSession {
  id: string;
  title: string;
  subject: string;
  monitorName: string;
  institutionName?: string;
  studentName?: string;
  start: string;
  end?: string;
  status: SessionStatus;
  location?: string;
  description?: string;
}

export interface PublicMonitor {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  institution?: string;
  subjects: string[];
  rating: number;
  sessions: number;
  certificates: number;
  city?: string;
  availability: string[];
  aceitaMonitoriaCasa?: boolean;
  habilidadesPcd?: string[]; 
}

export interface ScheduleSlot {
  time: string;
  available: boolean;
}

export interface MonitorSchedule {
  date: string;
  monitorId: string;
  periods: {
    matutino: ScheduleSlot[];
    vespertino: ScheduleSlot[];
    noturno: ScheduleSlot[];
  };
}