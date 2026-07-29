import { Document, Schema, model } from 'mongoose';

export interface ISessionActivity extends Document {
  sessionId: string;
  alunoId: string;
  monitorId: string;
  originalName: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png';
  size: number;
  data: Buffer;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionActivitySchema = new Schema<ISessionActivity>(
  {
    sessionId: { type: String, required: true, index: true },
    alunoId: { type: String, required: true, index: true },
    monitorId: { type: String, required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    mimeType: {
      type: String,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
      required: true,
    },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export const SessionActivity = model<ISessionActivity>(
  'SessionActivity',
  SessionActivitySchema,
);
