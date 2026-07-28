import { Schema, model, Document, Types } from 'mongoose';

export interface IMonitorProfile extends Document {
  userId: string;
  institutionId: Types.ObjectId; // 👈 Referência para a Instituição
  disciplinas: string[];
  disponibilidade: string[];
  telefoneContato?: string;
  enderecoResidencial: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  ativo: boolean;
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
    institutionId: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: false, // Permite que monitores originados do CSV fiquem sem ID do MongoDB
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
    ativo: {
      type: Boolean,
      default: true,
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