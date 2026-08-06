import { Schema, model, Document, Types } from 'mongoose';

export interface IMonitorProfile extends Document {
  userId: string;
  name?: string;
  email?: string;
  course?: string;
  lastLoginAt?: Date;
  mustChangePassword?: boolean;
  createdByDirectorId?: string;
  institutionId: Types.ObjectId; 
  disciplinas: string[];
  disponibilidade: string[];
  habilidadesPcd?: string[]; // <--- Adicionado na Interface
  telefoneContato?: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  aceitaMonitoriaCasa: boolean;
  ativo: boolean;
  avatarMimeType?: 'image/jpeg' | 'image/png';
  avatarData?: Buffer;
  createdAt?: Date;
  updatedAt?: Date;
}

const MonitorProfileSchema = new Schema<IMonitorProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    course: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    createdByDirectorId: {
      type: String,
      index: true,
    },
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: false, 
    },
    disciplinas: {
      type: [String],
      required: true,
      default: [],
    },
    disponibilidade: {
      type: [String],
      required: true,
      default: [],
    },
    habilidadesPcd: { 
      type: [String],
      default: [],
    },
    telefoneContato: {
      type: String,
      trim: true,
    },
    enderecoResidencial: {
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
        type: [Number],
        required: true,
      },
    },
    aceitaMonitoriaCasa: {
      type: Boolean,
      default: false,
    },
    ativo: {
      type: Boolean,
      default: true,
    },
    avatarMimeType: {
      type: String,
      enum: ['image/jpeg', 'image/png'],
      select: false,
    },
    avatarData: {
      type: Buffer,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

MonitorProfileSchema.index({ location: '2dsphere' });

export const MonitorProfile = model<IMonitorProfile>(
  'MonitorProfile',
  MonitorProfileSchema
);