export interface CertificateRecord {
  id: string;
  title: string;
  studentName?: string;
  subjectName?: string;
  issuedAt?: string;
  code?: string;
  status?: string;
  raw?: unknown;
}

export interface ReviewRecord {
  id: string;
  reviewerName?: string;
  reviewedName?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
  raw?: unknown;
}

export interface ProfileData {
  id?: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  institution?: string;
  course?: string;
  specialty?: string;
}
