import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, containsUnsafeContent, sanitizeMission } from './safety';
import type { MissionPlan } from './types';

const plan: MissionPlan = {
  observation: 'A dry plant bed', action: 'Check soil moisture', whyItHelps: 'Plants need suitable water',
  durationMinutes: 5, materials: ['Watering can'], steps: ['Touch the soil gently', 'Water only if needed'],
  safetyNotes: ['Ask permission first'], permissionRequired: true, uncertainty: 'The photo cannot show soil moisture.'
};

test('flags clearly unsafe content', () => {
  assert.equal(containsUnsafeContent('There is an unknown chemical spill'), true);
});
test('clamps duration and preserves safe plan', () => {
  const result = sanitizeMission({...plan, durationMinutes: 200});
  assert.equal(result.durationMinutes, 60);
});
test('blocks dangerous AI mission output', () => {
  assert.throws(() => sanitizeMission({...plan, action: 'Pick up a needle'}), /hazard/i);
});
test('allows valid status transition and rejects invalid transition', () => {
  assert.equal(canTransition('saved', 'in_progress'), true);
  assert.equal(canTransition('completed', 'in_progress'), false);
});
