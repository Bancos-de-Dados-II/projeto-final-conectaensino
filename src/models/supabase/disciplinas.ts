import { SupabaseTableTimestamps } from './shared';

export interface DisciplinaRow extends SupabaseTableTimestamps {
  id: string;
  nome: string;
  carga_horaria: number;
}

export interface DisciplinaInsert {
  nome: string;
  carga_horaria: number;
}

export interface DisciplinaUpdate {
  nome?: string;
  carga_horaria?: number;
}
