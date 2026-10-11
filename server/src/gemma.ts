import { z } from 'zod';
import type { MissionPlan } from './types';
import { sanitizeMission } from './safety';

const missionSchema = z.object({
  observation: z.string().min(3).max(500),
  action: z.string().min(3).max(300),
  whyItHelps: z.string().min(3).max(600),
  durationMinutes: z.number().int().min(1).max(60),
  materials: z.array(z.string().min(1).max(100)).max(8),
  steps: z.array(z.string().min(3).max(300)).min(1).max(6),
  safetyNotes: z.array(z.string().min(3).max(300)).max(6),
  permissionRequired: z.boolean(),
  uncertainty: z.string().max(500)
});

export class IntegrationError extends Error {
  constructor(message: string, public statusCode = 503) { super(message); }
}

export async function analyzeWithGemma(imageDataUrl: string, description = ''): Promise<MissionPlan> {
  const { GEMMA_API_URL, GEMMA_API_KEY, GEMMA_MODEL } = process.env;
  if (!GEMMA_API_URL || !GEMMA_API_KEY || !GEMMA_MODEL) {
    throw new IntegrationError('Gemma is not configured yet. Set GEMMA_API_URL, GEMMA_API_KEY, and GEMMA_MODEL in the server environment.');
  }
  let endpoint: URL;
  try { endpoint = new URL(GEMMA_API_URL); }
  catch { throw new IntegrationError('GEMMA_API_URL must be a valid HTTPS endpoint URL.', 500); }
  if (process.env.NODE_ENV === 'production' && endpoint.protocol !== 'https:') {
    throw new IntegrationError('Gemma endpoint must use HTTPS in production.', 500);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_TIMEOUT_MS || 30000));
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GEMMA_API_KEY}`,
        'HTTP-Referer': 'https://outsidefix.dev',
        'X-Title': 'OutsideFix'
      },
      body: JSON.stringify({
        model: GEMMA_MODEL,
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: `You are OutsideFix, a cautious outdoor action assistant. Analyze the user's image and optional context. Recommend only a safe, small, legal, permission-aware outdoor action. If there is a hazard or uncertainty, do not advise handling it; tell the user to keep distance and contact an appropriate authority. Return ONLY JSON with keys: observation, action, whyItHelps, durationMinutes (integer 1-60), materials (string array), steps (string array, 1-6), safetyNotes (string array), permissionRequired (boolean), uncertainty (string). Never claim an action has already happened. Never invent image details.` },
          { role: 'user', content: [
            { type: 'text', text: `Analyze this outdoor observation. Additional context: ${description || 'None supplied'}. Return only the requested JSON.` },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]}
        ]
      })
    });
    if (!response.ok) {
      const status = response.status;
      throw new IntegrationError(`Gemma provider returned HTTP ${status}. Check the endpoint, model ID, credentials, and quota.`, status === 429 ? 429 : 502);
    }
    const data = await response.json() as { choices?: { message?: { content?: string | Array<{type?:string;text?:string}> } }[] };
    const raw = data.choices?.[0]?.message?.content;
    const content = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw.map(p => p.text || '').join('\n') : '';
    if (!content) throw new IntegrationError('Gemma returned an empty response. Try again.', 502);

    // Strip reasoning tags (<think>...</think>) and extract structured JSON safely
    const withoutThinking = content.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, '').trim();
    const jsonMatch = withoutThinking.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) || withoutThinking.match(/(\{[\s\S]*\})/);
    const cleaned = jsonMatch ? jsonMatch[1].trim() : withoutThinking;

    let parsed: unknown;
    try { parsed = JSON.parse(cleaned); }
    catch { throw new IntegrationError('Gemma returned an invalid structured response. Please try again.', 502); }
    const validated = missionSchema.safeParse(parsed);
    if (!validated.success) throw new IntegrationError('Gemma response did not match the required mission format. Please try again.', 502);
    try { return sanitizeMission(validated.data); }
    catch (error) { throw new IntegrationError(error instanceof Error ? error.message : 'Safety check blocked this recommendation.', 422); }
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    if (error instanceof Error && error.name === 'AbortError') throw new IntegrationError('Gemma request timed out. Try a smaller image or try again later.', 504);
    throw new IntegrationError('Could not reach the configured Gemma endpoint. Check provider availability and network settings.', 502);
  } finally { clearTimeout(timeout); }
}

export function imageToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
