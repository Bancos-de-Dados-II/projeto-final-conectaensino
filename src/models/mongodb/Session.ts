import { Schema, model, Document, Types } from 'mongoose';

export interface ISession extends Document {
  alunoId: string;
  monitorId: string;
  disciplinaId: string;
  dataHora: Date;
  tipoLocal: 'escola' | 'casa_aluno';
  institutionId?: Types.ObjectId; // Opcional: preenchido apenas se o tipoLocal for 'escola'
  enderecoEncontro: string;       // Endereço da escola selecionada ou da casa do aluno
  locationMeeting: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
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
    enum: ['escola', 'casa_aluno'],
    required: true
  },
  institutionId: {
    type: Schema.Types.ObjectId,
    ref: 'Institution',
    required: function(this: ISession) {
      return this.tipoLocal === 'escola'; 
    }
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