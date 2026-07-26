import { MongoObjectIdString, SupabaseTableTimestamps } from './shared';

export interface AvaliacaoRow extends SupabaseTableTimestamps {
  id: string;
  mongo_avaliador_id: MongoObjectIdString;
  mongo_avaliado_id: MongoObjectIdString;
  nota: number;
  comentario: string | null;
}

export interface AvaliacaoInsert {
  mongo_avaliador_id: MongoObjectIdString;
  mongo_avaliado_id: MongoObjectIdString;
  nota: number;
  comentario?: string | null;
}

export interface AvaliacaoUpdate {
  mongo_avaliador_id?: MongoObjectIdString;
  mongo_avaliado_id?: MongoObjectIdString;
  nota?: number;
  comentario?: string | null;
}
