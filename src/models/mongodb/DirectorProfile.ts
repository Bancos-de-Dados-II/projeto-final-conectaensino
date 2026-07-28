import { Schema, model, Document } from 'mongoose';

interface IDirectorProfile extends Document {
  userId: string; // ID do usuário no Supabase Auth
  institutionId: Schema.Types.ObjectId; // ID da instituição gerenciada
  cargo?: string;
}

const DirectorProfileSchema = new Schema<IDirectorProfile>({
  userId: { type: String, required: true, unique: true },
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  cargo: { type: String, default: 'Diretor(a)' },
}, { timestamps: true });

export const DirectorProfile = model<IDirectorProfile>('DirectorProfile', DirectorProfileSchema);