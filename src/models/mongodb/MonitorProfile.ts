import { Schema, model, Document } from 'mongoose';

export interface IMonitorProfile extends Document {
  userId: string; // UUID referente ao perfil do Supabase
  disciplinasAtendidas: string[]; // Array com IDs das disciplinas no Postgres
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const MonitorProfileSchema = new Schema<IMonitorProfile>({
  userId: { type: String, required: true, unique: true },
  disciplinasAtendidas: [{ type: String, required: true }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  }
});

MonitorProfileSchema.index({ location: '2dsphere' });

export const MonitorProfile = model<IMonitorProfile>('MonitorProfile', MonitorProfileSchema);