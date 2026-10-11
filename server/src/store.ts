import { randomUUID } from 'node:crypto';
import { MissionModel } from './models';
import type { MissionPlan, MissionRecord, MissionStatus } from './types';

const memory = new Map<string, MissionRecord>();
let useMongo = false;

export function setMongoEnabled(value: boolean) { useMongo = value; }
function normalize(doc: any): MissionRecord {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, _id: String(obj._id), createdAt: new Date(obj.createdAt).toISOString(), updatedAt: new Date(obj.updatedAt).toISOString(),
    evidence: obj.evidence ? {...obj.evidence, submittedAt: obj.evidence.submittedAt ? new Date(obj.evidence.submittedAt).toISOString() : undefined} : undefined };
}
export async function createMission(plan: MissionPlan): Promise<MissionRecord> {
  if (useMongo) return normalize(await MissionModel.create({...plan, status:'saved'}));
  const now = new Date().toISOString();
  const record: MissionRecord = {...plan, _id: randomUUID(), status:'saved', createdAt:now, updatedAt:now};
  memory.set(record._id, record); return record;
}
export async function listMissions(): Promise<MissionRecord[]> {
  if (useMongo) return (await MissionModel.find().sort({createdAt:-1}).limit(100)).map(normalize);
  return [...memory.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100);
}
export async function findMission(id: string): Promise<MissionRecord | null> {
  if (useMongo) { const doc = await MissionModel.findById(id); return doc ? normalize(doc) : null; }
  return memory.get(id) || null;
}
export async function updateMission(id: string, update: Partial<MissionRecord>): Promise<MissionRecord | null> {
  if (useMongo) { const doc = await MissionModel.findByIdAndUpdate(id, {$set:update}, {new:true, runValidators:true}); return doc ? normalize(doc) : null; }
  const old = memory.get(id); if (!old) return null;
  const next = {...old, ...update, updatedAt:new Date().toISOString()}; memory.set(id,next); return next;
}
export async function removeMission(id: string): Promise<boolean> {
  if (useMongo) return (await MissionModel.findByIdAndDelete(id)) !== null;
  return memory.delete(id);
}
