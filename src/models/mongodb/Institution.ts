import { Schema, model, Document } from 'mongoose';

export interface IInstitution extends Document {
  nome: string;
  cnpj?: string;
  codigoInep?: string;
  codigoIbge?: string;
  temRampa?: boolean;
  temBanheiroPcd?: boolean;
  acessoTotal?: boolean;
  diretorResponsavel?: {
    nome: string;
    email: string;
    telefone: string;
  };
  endereco?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; 
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
      sparse: true,
    },
    codigoIbge: {
      type: String,
      trim: true,
    },
    temRampa: {
      type: Boolean,
      default: false,
    },
    temBanheiroPcd: {
      type: Boolean,
      default: false,
    },
    acessoTotal: {
      type: Boolean,
      default: false,
    },
    diretorResponsavel: {
      nome: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      telefone: { type: String, trim: true },
    },
    endereco: {
      type: String,
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
        type: [Number], 
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

InstitutionSchema.index({ location: '2dsphere' });

export const Institution = model<IInstitution>('Institution', InstitutionSchema, 'institutions');