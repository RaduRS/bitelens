import { ulid } from 'ulid';
import type { Product, AllergenKey, FoodCategory, NovaGroup, Additive } from '@/types/product';
import { lookupAdditive } from '@/lib/additives/registry';

export const ALLERGEN_ENUM: AllergenKey[] = [
  'gluten', 'dairy', 'eggs', 'nuts', 'peanuts',
  'soy', 'fish', 'shellfish', 'sesame',
];

export const CATEGORY_ENUM: FoodCategory[] = [
  'meal', 'whole_food', 'snack', 'beverage', 'dessert',
  'candy', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
];

export interface AnalysisResponse {
  name: string;
  components: string[];
  allergens: AllergenKey[];
  nutrition: {
    kcal: number;
    protein: number;
    carbs: number;
    sugar: number;
    fat: number;
    satFat: number;
    fiber: number;
    sodium: number;
  };
  category: FoodCategory;
  processing: 1 | 2 | 3 | 4;
  flaggedIngredients: string[];
  confidence: number;
}

const NOVA_4_CATEGORIES: FoodCategory[] = [
  'candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
];

// By definition, a whole, single-ingredient food (raw fruit, raw nuts, plain
// produce, raw meat) is NOVA 1 — anything else contradicts the category. Guards
// against the AI returning whole_food + processing 3/4 for things like walnuts
// in a bowl that look "snack-y".
function deriveNovaGroup(processing: number, category: FoodCategory): NovaGroup | null {
  if (NOVA_4_CATEGORIES.includes(category)) return 4;
  if (category === 'whole_food') return 1;
  if (processing >= 1 && processing <= 4) return processing as NovaGroup;
  return null;
}

function deriveAdditives(flagged: string[]): Additive[] {
  const seen = new Set<string>();
  const out: Additive[] = [];
  for (const raw of flagged) {
    const code = raw.trim().toUpperCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const meta = lookupAdditive(code);
    if (meta) out.push(meta);
  }
  return out;
}

export function responseToProduct(r: AnalysisResponse): Product {
  return {
    id: `photo_${ulid()}`,
    type: 'photo',
    brand: '',
    name: r.name.trim(),
    subtitle: 'Photo · detected meal',
    swatch: '#7a8a5e',
    glyph: '◐',
    components: r.components.map(s => s.trim()).filter(Boolean),
    allergens: r.allergens,
    additives: deriveAdditives(r.flaggedIngredients ?? []),
    nutrition: {
      serving: 'Estimated serving',
      kcal: round(r.nutrition.kcal),
      protein: round(r.nutrition.protein),
      carbs: round(r.nutrition.carbs),
      sugar: round(r.nutrition.sugar),
      fat: round(r.nutrition.fat),
      satFat: round(r.nutrition.satFat),
      fiber: round(r.nutrition.fiber),
      sodium: round(r.nutrition.sodium),
    },
    nutriScore: null,
    ecoScore: null,
    novaGroup: deriveNovaGroup(r.processing, r.category),
    category: r.category,
    confidence: clamp01(r.confidence),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
