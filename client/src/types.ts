export type MissionStatus = 'suggested' | 'saved' | 'in_progress' | 'completed' | 'cancelled';
export interface MissionPlan {
  observation: string;
  action: string;
  whyItHelps: string;
  durationMinutes: number;
  materials: string[];
  steps: string[];
  safetyNotes: string[];
  permissionRequired: boolean;
  uncertainty: string;
}
export interface Mission extends MissionPlan {
  _id: string;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
  reflection?: string;
  evidence?: { afterPhotoName?: string; reflection?: string; submittedAt?: string };
}
