import { Schema, model, Document } from 'mongoose';

export interface IStudentProfile extends Document {
  userId: string; // UUID referente ao perfil cadastrado no Supabase
  tipoDeficiencia: string;
  necessidadesAcessibilidade: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // Obrigatoriamente [longitude, latitude]
  };
}

const StudentProfileSchema = new Schema<IStudentProfile>({
  userId: { type: String, required: true, unique: true },
  tipoDeficiencia: { type: String, required: true },
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
});

// ÍNDICE ESPACIAL ESSENCIAL: Permite buscas de proximidade ($near)
StudentProfileSchema.index({ location: '2dsphere' });

export const StudentProfile = model<IStudentProfile>('StudentProfile', StudentProfileSchema);