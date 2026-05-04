import 'server-only';
import type { Product } from '@/types/product';
import { ALLERGEN_ENUM, responseToProduct, type AnalysisResponse } from './vision-shape';

interface AnalyzePhotoInput {
  base64: string;
  mimeType: string;
}

const SYSTEM_PROMPT = `You analyze food photos. Identify the meal, list visible components, flag allergens, and estimate per-serving nutrition. Return strictly the JSON shape requested. Be conservative with confidence: <0.4 if blurry/ambiguous, 0.4-0.7 if partially obscured, >0.7 if clearly identifiable. Use realistic typical nutrition values for the identified meal at the visible portion size.`;

const USER_PROMPT = `Analyze this meal photo. Return:
- name: one-line meal name (e.g. "Grain bowl with salmon"), properly capitalized
- components: visible foods (3-8 items max)
- allergens: subset of [gluten, dairy, eggs, nuts, peanuts, soy, fish, shellfish, sesame] potentially present
- nutrition (per estimated serving): kcal, protein (g), carbs (g), sugar (g), fat (g), satFat (g), fiber (g), sodium (mg)
- confidence: 0.0-1.0`;

const JSON_SCHEMA = {
  name: 'meal_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'components', 'allergens', 'nutrition', 'confidence'],
    properties: {
      name: { type: 'string' },
      components: { type: 'array', items: { type: 'string' } },
      allergens: {
        type: 'array',
        items: { type: 'string', enum: ALLERGEN_ENUM },
      },
      nutrition: {
        type: 'object',
        additionalProperties: false,
        required: ['kcal', 'protein', 'carbs', 'sugar', 'fat', 'satFat', 'fiber', 'sodium'],
        properties: {
          kcal: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          sugar: { type: 'number' },
          fat: { type: 'number' },
          satFat: { type: 'number' },
          fiber: { type: 'number' },
          sodium: { type: 'number' },
        },
      },
      confidence: { type: 'number' },
    },
  },
} as const;

export async function analyzePhoto({ base64, mimeType }: AnalyzePhotoInput): Promise<Product> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY');

  const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-5-nano';
  const timeoutMs = Number(process.env.OPENAI_VISION_TIMEOUT_MS) || 60_000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        reasoning_effort: 'minimal',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: USER_PROMPT },
            ],
          },
        ],
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
      }),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`Photo analysis timed out after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI vision error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned empty content');

  const parsed = JSON.parse(text) as AnalysisResponse;
  return responseToProduct(parsed);
}
