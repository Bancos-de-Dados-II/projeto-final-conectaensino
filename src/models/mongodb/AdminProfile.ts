import { Document, Schema, model } from 'mongoose';

export interface IAdminProfile extends Document {
  userId: string;
  name: string;
  email: string;
  cityName: string;
  stateCode: string;
  codigoIbge: string;
  lastLoginAt?: Date;
}

const AdminProfileSchema = new Schema<IAdminProfile>({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  cityName: { type: String, required: true, trim: true },
  stateCode: { type: String, required: true, uppercase: true, trim: true },
  codigoIbge: { type: String, required: true, unique: true, index: true, trim: true },
  lastLoginAt: Date,
}, { timestamps: true });

export const AdminProfile = model<IAdminProfile>('AdminProfile', AdminProfileSchema);
