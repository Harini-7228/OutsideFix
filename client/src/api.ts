import type { Mission, MissionPlan, MissionStatus } from './types';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
  return data as T;
}
export async function analyzePhoto(file: File, description: string): Promise<MissionPlan> {
  const body = new FormData();
  body.append('image', file);
  if (description.trim()) body.append('description', description.trim());
  return request('/missions/analyze', { method: 'POST', body });
}
export const saveMission = (plan: MissionPlan) =>
  request<{ mission: Mission }>('/missions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(plan) });
export const getMissions = () => request<{ missions: Mission[] }>('/missions');
export const getMission = (id: string) => request<{ mission: Mission }>(`/missions/${id}`);
export const updateStatus = (id: string, status: MissionStatus) =>
  request<{ mission: Mission }>(`/missions/${id}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status}) });
export const submitEvidence = (id: string, afterPhotoName: string, reflection: string) =>
  request<{ mission: Mission }>(`/missions/${id}/evidence`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({afterPhotoName, reflection}) });
export const deleteMission = (id: string) => request<{ok: boolean}>(`/missions/${id}`, {method:'DELETE'});
