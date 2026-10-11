import type { MissionPlan, MissionStatus } from './types';

const unsafeTerms = [
  'needle', 'syringe', 'chemical spill', 'unknown chemical', 'hazardous waste',
  'dead animal', 'wild animal', 'snake', 'wasp nest', 'electrical wire',
  'power line', 'traffic signal', 'manhole', 'asbestos', 'medical waste'
];

export function containsUnsafeContent(text: string): boolean {
  const normalized = text.toLowerCase();
  return unsafeTerms.some(term => normalized.includes(term));
}

export function sanitizeMission(plan: MissionPlan): MissionPlan {
  const all = [plan.observation, plan.action, plan.whyItHelps, ...plan.materials, ...plan.steps].join(' ');
  if (containsUnsafeContent(all)) {
    throw new Error('This observation may involve a hazard. Keep your distance and contact the appropriate property manager or local authority.');
  }
  if (!plan.safetyNotes.length) plan.safetyNotes = ['Do not handle unknown or hazardous materials.', 'Ask permission before working on shared or private property.'];
  if (!plan.materials.length) plan.materials = ['No special materials specified'];
  plan.durationMinutes = Math.max(1, Math.min(60, Math.round(plan.durationMinutes || 5)));
  plan.steps = plan.steps.slice(0, 6);
  plan.materials = plan.materials.slice(0, 8);
  plan.safetyNotes = plan.safetyNotes.slice(0, 6);
  return plan;
}

const transitions: Record<MissionStatus, MissionStatus[]> = {
  suggested: ['saved', 'cancelled'],
  saved: ['in_progress', 'completed', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};
export function canTransition(from: MissionStatus, to: MissionStatus): boolean {
  return transitions[from]?.includes(to) ?? false;
}
