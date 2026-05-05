import 'server-only';
import type { Product } from '@/types/product';
import { ALLERGEN_ENUM, CATEGORY_ENUM, responseToProduct, type AnalysisResponse } from './vision-shape';

interface AnalyzePhotoInput {
  base64: string;
  mimeType: string;
}

const SYSTEM_PROMPT = `You analyze food photos for a nutrition app. Identify what's in the photo accurately, including packaged products like candy, soda, and snacks (not just home-cooked meals). Return strictly the JSON shape requested.

CONFIDENCE: <0.4 blurry/ambiguous, 0.4-0.7 partially obscured, >0.7 clearly identifiable.

NUTRITION: realistic typical values for the visible portion. For packaged products (a bag of candy, a can of soda), use a typical single-serving size (e.g. ~25g for gummy sweets, 330ml for a soda can) — not the whole pack — and reflect that the per-serving sugar/sodium for these products is high.

CATEGORY: pick the closest tag.
  - whole_food: single-ingredient, minimally-prepared natural food (apple, banana, raw nuts in or out of shell, walnut halves, almonds, raw vegetables, plain raw meat/fish, eggs, plain milk). Use this for ANY identifiable whole food — even if it's served in a bowl, plate, or open bag — as long as it's the food itself with no added oil/salt/sugar/coating visible.
  - meal: a cooked dish made from recognizable whole foods (grain bowl, pasta, salad, stir-fry, soup)
  - snack: packaged/processed savoury snack (chips, crackers, pretzels, cereal bars, granola bars, flavoured/seasoned/coated nuts)
  - beverage: any drink other than plain water/tea/coffee
  - dessert: cake, ice cream, pastries, chocolate bar, cookies
  - candy: gummy sweets, hard candy, jelly beans, lollipops, marshmallows (Haribo, Skittles, Starburst, etc.)
  - fast_food: burger, fried chicken, pizza, fries from QSR-style preparation
  - baked_good: doughnuts, croissants, muffins, sweetened bread
  - fried_food: deep-fried foods (fries, fried chicken, tempura) — use this if not fast_food
  - processed_meat: bacon, ham, hot dogs, sausages, deli meat, salami

PROCESSING (NOVA-style 1-4):
  1 = unprocessed/minimally processed (fresh produce, raw nuts, raw meat, plain dairy, eggs). Use 1 for ALL whole_food items.
  2 = culinary ingredients (oil, salt, sugar, butter, vinegar)
  3 = processed (cheese, canned vegetables in brine, bread with simple ingredients, salted/roasted nuts, smoked fish)
  4 = ULTRA-PROCESSED. Industrial formulations with refined sugars, hydrogenated oils, modified starches, artificial colors/flavors, sweeteners, protein isolates. ALL candy, soda, packaged sweets, fast food, most breakfast cereals, instant noodles, processed meat. Use 4 when you see a clearly branded confectionery/snack/drink package OR when the product matches one of the NOVA-4 categories above. Do NOT use 4 just because a whole food is shown in a bowl or open bag.

FLAGGED INGREDIENTS: E-number codes for additives you can reasonably infer from the product type. Examples:
  - Cola/soda → ["E150d", "E338"]
  - Brightly colored candy → ["E102", "E110", "E129"] if you see yellow/orange/red colors
  - Cured/processed meats (bacon, ham) → ["E250"]
  - Diet/sugar-free drinks → ["E951"] for aspartame
  - Gummy candy → ["E330"] (citric acid) and gelatine doesn't have an E-code here
Use only codes when you're confident from the visible product. Do NOT guess randomly.`;

const USER_PROMPT = `Analyze this food photo. Return:
- name: one-line product/meal name, properly capitalized (e.g. "Grain bowl with salmon", "Haribo Starmix gummies", "Coca-Cola can")
- components: 3-8 visible foods/ingredients
- allergens: subset of [gluten, dairy, eggs, nuts, peanuts, soy, fish, shellfish, sesame]
- nutrition (per realistic single serving): kcal, protein g, carbs g, sugar g, fat g, satFat g, fiber g, sodium mg
- category: one of [meal, whole_food, snack, beverage, dessert, candy, fast_food, baked_good, fried_food, processed_meat]
- processing: 1-4 NOVA group
- flaggedIngredients: array of E-number codes (e.g. ["E150d","E338"]) — empty if none confidently inferable
- confidence: 0.0-1.0`;

const JSON_SCHEMA = {
  name: 'meal_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'components', 'allergens', 'nutrition', 'category', 'processing', 'flaggedIngredients', 'confidence'],
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
      category: { type: 'string', enum: CATEGORY_ENUM },
      processing: { type: 'integer', enum: [1, 2, 3, 4] },
      flaggedIngredients: { type: 'array', items: { type: 'string' } },
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
