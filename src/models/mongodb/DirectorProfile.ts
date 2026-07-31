import { Schema, model, Document, Types } from 'mongoose';

interface IDirectorProfile extends Document {
  userId: string; 
  name?: string;
  email?: string;
  phone?: string;
  lastLoginAt?: Date;
  institutionId: Types.ObjectId; 
  cargo?: string;
  avatarMimeType?: 'image/jpeg' | 'image/png';
  avatarData?: Buffer;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedByAdminId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

const DirectorProfileSchema = new Schema<IDirectorProfile>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  lastLoginAt: { type: Date },
  institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true },
  cargo: { type: String, default: 'Diretor(a)' },
  avatarMimeType: {
    type: String,
    enum: ['image/jpeg', 'image/png'],
    select: false,
  },
  avatarData: { type: Buffer, select: false },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  approvedByAdminId: { type: String },
  approvedAt: { type: Date },
  rejectionReason: { type: String, trim: true },
}, { timestamps: true });

export const DirectorProfile = model<IDirectorProfile>('DirectorProfile', DirectorProfileSchema);
