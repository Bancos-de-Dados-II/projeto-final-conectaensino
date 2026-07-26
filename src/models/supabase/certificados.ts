import { MongoObjectIdString, SupabaseTableTimestamps } from './shared';

export interface CertificadoRow extends SupabaseTableTimestamps {
  id: string;
  mongo_monitor_id: MongoObjectIdString;
  disciplina_id: string;
  horas_validadas: number;
  emitido_em: string;
}

export interface CertificadoInsert {
  mongo_monitor_id: MongoObjectIdString;
  disciplina_id: string;
  horas_validadas: number;
  emitido_em?: string;
}

export interface CertificadoUpdate {
  mongo_monitor_id?: MongoObjectIdString;
  disciplina_id?: string;
  horas_validadas?: number;
  emitido_em?: string;
}
