import { Schema, model, Document } from 'mongoose';

export interface IInstitution extends Document {
  nome: string;
  cnpj?: string;
  codigoInep?: string;
  diretorResponsavel: {
    nome: string;
    email: string;
    telefone: string;
  };
  endereco: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude]
  };
  ativa: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    nome: {
      type: String,
      required: true,
      trim: true,
    },
    cnpj: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    codigoInep: {
      type: String,
      trim: true,
    },
    diretorResponsavel: {
      nome: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      telefone: { type: String, required: true, trim: true },
    },
    endereco: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [Longitude, Latitude]
        required: true,
      },
    },
    ativa: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice geoespacial para localização da instituição
InstitutionSchema.index({ location: '2dsphere' });

export const Institution = model<IInstitution>('Institution', InstitutionSchema);