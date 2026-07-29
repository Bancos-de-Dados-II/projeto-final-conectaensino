import { Document, Schema, model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  subject: string;
  description: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  monitorId: string;
  monitorName: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 3000 },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentEmail: { type: String, trim: true, lowercase: true },
    monitorId: { type: String, required: true, index: true },
    monitorName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

export const Task = model<ITask>('Task', TaskSchema);
