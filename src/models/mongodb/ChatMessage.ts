import { Document, Schema, model } from 'mongoose';

export interface IChatMessage extends Document {
  conversationId: string;
  studentId: string;
  monitorId: string;
  senderId: string;
  senderRole: 'student' | 'monitor';
  content: string;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    monitorId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: {
      type: String,
      enum: ['student', 'monitor'],
      required: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    readBy: { type: [String], default: [] },
  },
  { timestamps: true },
);

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ChatMessage = model<IChatMessage>(
  'ChatMessage',
  ChatMessageSchema,
);
