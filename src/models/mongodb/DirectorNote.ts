import { Schema, model } from 'mongoose';

const DirectorNoteSchema = new Schema(
  {
    directorId: { type: String, required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

export const DirectorNote = model('DirectorNote', DirectorNoteSchema);
