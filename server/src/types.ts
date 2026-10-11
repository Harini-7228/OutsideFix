export const missionStatuses = ['suggested', 'saved', 'in_progress', 'completed', 'cancelled'] as const;
export type MissionStatus = typeof missionStatuses[number];
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
export interface MissionRecord extends MissionPlan {
  _id: string;
  status: MissionStatus;
  createdAt: string;
  updatedAt: string;
  reflection?: string;
  evidence?: { afterPhotoName?: string; reflection?: string; submittedAt?: string };
}
