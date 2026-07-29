import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  alunoId: string;
  monitorId: string;
  disciplinaId: string;
  dataHora: Date;
  tipoLocal: 'casa_aluno' | 'escola' | 'local_publico';
  enderecoEncontro: string;
  locationMeeting: {
    type: 'Point';
    coordinates: [number, number]; 
  };
  status: 'pendente' | 'confirmada' | 'em_andamento' | 'aguardando_avaliacao' | 'finalizada' | 'cancelada';
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISession>({
  alunoId: { type: String, required: true },
  monitorId: { type: String, required: true },
  disciplinaId: { type: String, required: true },
  dataHora: { type: Date, required: true },
  tipoLocal: {
    type: String,
    enum: ['casa_aluno', 'escola', 'local_publico'],
    required: true
  },
  enderecoEncontro: { type: String, required: true },
  locationMeeting: {
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  status: {
    type: String,
    enum: ['pendente', 'confirmada', 'em_andamento', 'aguardando_avaliacao', 'finalizada', 'cancelada'],
    default: 'pendente'
  }
}, {
  timestamps: true,
});

SessionSchema.index({ locationMeeting: '2dsphere' });

export const Session = model<ISession>('Session', SessionSchema);