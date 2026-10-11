import mongoose, { Schema } from 'mongoose';
import type { MissionPlan, MissionStatus } from './types';

export interface MissionDocument extends MissionPlan, mongoose.Document {
  status: MissionStatus;
  reflection?: string;
  evidence?: { afterPhotoName?: string; reflection?: string; submittedAt?: Date };
}
const MissionSchema = new Schema<MissionDocument>({
  observation: { type: String, required: true, maxlength: 500 },
  action: { type: String, required: true, maxlength: 300 },
  whyItHelps: { type: String, required: true, maxlength: 600 },
  durationMinutes: { type: Number, required: true, min: 1, max: 60 },
  materials: { type: [String], default: [] },
  steps: { type: [String], default: [] },
  safetyNotes: { type: [String], default: [] },
  permissionRequired: { type: Boolean, default: true },
  uncertainty: { type: String, default: '' },
  status: { type: String, enum: ['suggested','saved','in_progress','completed','cancelled'], default: 'saved' },
  reflection: { type: String, maxlength: 1000 },
  evidence: {
    afterPhotoName: { type: String, maxlength: 160 },
    reflection: { type: String, maxlength: 1000 },
    submittedAt: Date
  }
}, { timestamps: true, versionKey: false });
export const MissionModel = mongoose.model<MissionDocument>('Mission', MissionSchema);
