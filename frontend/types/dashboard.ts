export interface DashboardStats {
  students: number;
  monitors: number;
  sessions: number;
  certificates: number;
  averageRating: number;
}

export interface DashboardActivity {
  id: string;
  type: "student" | "monitor" | "session" | "certificate" | "review";
  title: string;
  description: string;
  date?: string;
}

export interface DashboardChartItem {
  label: string;
  value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  sessionsByMonth: DashboardChartItem[];
  subjectsRanking: DashboardChartItem[];
  ratingsDistribution: DashboardChartItem[];
  activities: DashboardActivity[];
}

export interface GlobalSearchResult {
  id: string;
  type: "student" | "monitor" | "subject" | "institution" | "session";
  title: string;
  subtitle?: string;
  route: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning";
  read: boolean;
  date?: string;
  route?: string;
}
