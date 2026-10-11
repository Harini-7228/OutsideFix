import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { analyzeWithGemma, imageToDataUrl, IntegrationError } from './gemma';
import { canTransition, sanitizeMission } from './safety';
import { createMission, findMission, listMissions, removeMission, updateMission } from './store';
import type { MissionPlan, MissionStatus } from './types';

const app = express();
app.disable('x-powered-by');
app.use(helmet() as any);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(s=>s.trim());
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) callback(null,true); else callback(new Error('Origin not allowed by CORS')); } }) as any);
app.use(express.json({limit:'100kb'}));
const aiLimiter = rateLimit({windowMs:60_000, limit:8, standardHeaders:true, legacyHeaders:false, message:{error:'Too many AI requests. Please wait a minute and try again.'}});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_IMAGE_MB || 5) * 1024 * 1024, files: 1 },
  fileFilter(_req,file,cb) { cb(null, ['image/jpeg','image/png','image/webp'].includes(file.mimetype)); }
});
const planSchema = z.object({
  observation:z.string().min(3).max(500), action:z.string().min(3).max(300), whyItHelps:z.string().min(3).max(600),
  durationMinutes:z.number().int().min(1).max(60), materials:z.array(z.string().min(1).max(100)).max(8),
  steps:z.array(z.string().min(3).max(300)).min(1).max(6), safetyNotes:z.array(z.string().min(3).max(300)).max(6),
  permissionRequired:z.boolean(), uncertainty:z.string().max(500)
});
const statusSchema = z.object({status:z.enum(['saved','in_progress','completed','cancelled'])});
const evidenceSchema = z.object({afterPhotoName:z.string().max(160).optional().default(''),reflection:z.string().max(1000).optional().default('')});
app.get('/', (_req,res)=>res.json({
  service:'OutsideFix API',
  message:'The API is running. Open the OutsideFix web app to use the application.',
  frontend:process.env.CLIENT_APP_URL || null,
  health:'/api/health',
  endpoints:['/api/missions','/api/missions/analyze']
}));
app.get('/api/health', (_req,res)=>res.json({ok:true,service:'outsidefix-api',aiConfigured:Boolean(process.env.GEMMA_API_URL&&process.env.GEMMA_API_KEY&&process.env.GEMMA_MODEL),databaseMode:process.env.MONGODB_URI?'mongodb-configured':'memory-demo'}));

app.post('/api/missions/analyze', aiLimiter as any, upload.single('image') as any, async (req: Request, res: Response, next: NextFunction)=>{
  try {
    if (!req.file) return res.status(400).json({error:'Choose a valid JPEG, PNG, or WebP image up to the configured size.'});
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0,500) : '';
    const plan = await analyzeWithGemma(imageToDataUrl(req.file.buffer,req.file.mimetype),description);
    return res.json(plan);
  } catch(e) { return next(e); }
});
app.post('/api/missions', async (req,res,next)=>{
  try {
    const parsed=planSchema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({error:'Mission fields are invalid.',details:parsed.error.flatten()});
    const plan=sanitizeMission(parsed.data as MissionPlan);
    const mission=await createMission(plan);
    return res.status(201).json({mission});
  } catch(e){return next(e);}
});
app.get('/api/missions', async (_req,res,next)=>{try{return res.json({missions:await listMissions()});}catch(e){return next(e);}});
app.get('/api/missions/:id', async (req,res,next)=>{try{const mission=await findMission(req.params.id);return mission?res.json({mission}):res.status(404).json({error:'Mission not found.'});}catch(e){return next(e);}});
app.patch('/api/missions/:id/status', async (req,res,next)=>{
  try{
    const parsed=statusSchema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:'Invalid mission status.'});
    const existing=await findMission(req.params.id);
    if(!existing)return res.status(404).json({error:'Mission not found.'});
    if(!canTransition(existing.status,parsed.data.status as MissionStatus))return res.status(409).json({error:`Cannot change a ${existing.status} mission to ${parsed.data.status}.`});
    const mission=await updateMission(req.params.id,{status:parsed.data.status as MissionStatus});
    return res.json({mission});
  }catch(e){return next(e);}
});
app.post('/api/missions/:id/evidence', async (req,res,next)=>{
  try{
    const parsed=evidenceSchema.safeParse(req.body);
    if(!parsed.success)return res.status(400).json({error:'Invalid evidence metadata.'});
    const existing=await findMission(req.params.id);
    if(!existing)return res.status(404).json({error:'Mission not found.'});
    const evidence={afterPhotoName:parsed.data.afterPhotoName || undefined,reflection:parsed.data.reflection || undefined,submittedAt:new Date().toISOString()};
    const mission=await updateMission(req.params.id,{evidence,reflection:parsed.data.reflection});
    return res.json({mission});
  }catch(e){return next(e);}
});
app.delete('/api/missions/:id', async (req,res,next)=>{try{const removed=await removeMission(req.params.id);return removed?res.json({ok:true}):res.status(404).json({error:'Mission not found.'});}catch(e){return next(e);}});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) return res.status(err.code==='LIMIT_FILE_SIZE'?413:400).json({error:err.code==='LIMIT_FILE_SIZE'?'Image is too large.':'Upload was rejected.'});
  if (err instanceof IntegrationError) return res.status(err.statusCode).json({error:err.message});
  if (err instanceof Error && err.message==='Not allowed by CORS') return res.status(403).json({error:'Origin not allowed.'});
  console.error('Request failed:', err instanceof Error ? err.message : err);
  return res.status(500).json({error:'Unexpected server error. Please try again.'});
});
export default app;
