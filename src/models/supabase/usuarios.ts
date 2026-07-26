import { MongoObjectIdString, SupabaseTableTimestamps } from './shared';

export interface UsuarioRow extends SupabaseTableTimestamps {
  id: string;
  mongo_profile_id: MongoObjectIdString;
  email: string;
}

export interface UsuarioInsert {
  mongo_profile_id: MongoObjectIdString;
  email: string;
}

export interface UsuarioUpdate {
  mongo_profile_id?: MongoObjectIdString;
  email?: string;
}
