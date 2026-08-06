import { Schema, model, Document } from 'mongoose';

export interface ISubjectSuggestion extends Document {
  name: string;
  normalizedName: string;
  suggestedBy: string;
  suggestedByRole: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
}

const SubjectSuggestionSchema = new Schema<ISubjectSuggestion>({
  name: { type: String, required: true, trim: true },
  normalizedName: { type: String, required: true, trim: true, lowercase: true, index: true },
  suggestedBy: { type: String, required: true, index: true },
  suggestedByRole: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

SubjectSuggestionSchema.index({ normalizedName: 1, status: 1 });

export const SubjectSuggestion = model<ISubjectSuggestion>(
  'SubjectSuggestion',
  SubjectSuggestionSchema,
);
