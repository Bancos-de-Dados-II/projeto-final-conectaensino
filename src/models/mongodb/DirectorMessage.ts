import { Schema, model } from 'mongoose';

const DirectorMessageSchema = new Schema(
  {
    directorId: { type: String, required: true, index: true },
    senderName: { type: String, required: true, trim: true },
    institutionId: { type: Schema.Types.ObjectId, ref: 'Institution', required: true, index: true },
    institutionName: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export const DirectorMessage = model('DirectorMessage', DirectorMessageSchema);
