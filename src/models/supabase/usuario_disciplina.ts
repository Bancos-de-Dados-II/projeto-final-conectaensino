import { SupabaseTableTimestamps } from './shared';

export interface UsuarioDisciplinaRow extends SupabaseTableTimestamps {
  usuario_id: string;
  disciplina_id: string;
}

export interface UsuarioDisciplinaInsert {
  usuario_id: string;
  disciplina_id: string;
}

export interface UsuarioDisciplinaUpdate {
  usuario_id?: string;
  disciplina_id?: string;
}
