import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: string; // UUID referente ao perfil cadastrado no Supabase
  name?: string;
  email?: string;
  phone?: string;
  course?: string;
  lastLoginAt?: Date;
  mustChangePassword?: boolean;
  createdByDirectorId?: string;
  institutionId?: Types.ObjectId;
  avatarMimeType?: 'image/jpeg' | 'image/png';
  avatarData?: Buffer;
  createdAt?: Date;
  updatedAt?: Date;
  tipoDeficiencia?: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // Obrigatoriamente [longitude, latitude]
  };
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  course: { type: String, trim: true },
  lastLoginAt: { type: Date },
  mustChangePassword: { type: Boolean, default: false },
  createdByDirectorId: { type: String, index: true },
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
  avatarMimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png'],
    select: false,
  },
  avatarData: { type: Buffer, select: false },
  tipoDeficiencia: { type: String, default: "" },
  necessidadesAcessibilidade: { type: String, default: "" },
  enderecoResidencial: { type: String, required: true },
  location: {   
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
}, { timestamps: true });

// ÍNDICE ESPACIAL ESSENCIAL: Permite buscas de proximidade ($near)
StudentProfileSchema.index({ location: '2dsphere' });

export const StudentProfile = model<IStudentProfile>('StudentProfile', StudentProfileSchema);
