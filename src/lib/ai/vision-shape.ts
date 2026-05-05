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

// Concentrated sweeteners are technically single-ingredient minimally-processed
// (so the AI may pick `whole_food`) but per WHO are FREE SUGARS — the harm
// target the sugar guidelines are written against. They have no fiber matrix
// and no nutrient density. Reclassify them so the sugar/category penalties fire
// instead of the whole-food exemption letting them through.
const CONCENTRATED_SWEETENER_PATTERNS = [
  'honey', 'maple syrup', 'agave', 'agave nectar', 'agave syrup',
  'molasses', 'treacle', 'golden syrup', 'corn syrup', 'rice syrup',
  'date syrup', 'fruit juice concentrate',
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

function deriveAdditives(flagged: string[], category: FoodCategory): Additive[] {
  // Whole foods cannot have additives by definition — drop any AI hallucinations.
  if (category === 'whole_food') return [];
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

// If the AI tagged a concentrated sweetener as whole_food, reroute to dessert
// (closest harm-aware category). Honey/syrup look "natural" but per WHO are
// free sugars and should be scored as such.
function coerceCategory(category: FoodCategory, components: string[]): FoodCategory {
  if (category !== 'whole_food') return category;
  const hay = components.map(c => c.toLowerCase()).join(' | ');
  for (const pat of CONCENTRATED_SWEETENER_PATTERNS) {
    if (hay.includes(pat)) return 'dessert';
  }
  return 'whole_food';
}

// Defend against AI hallucinations: never trust negative or absurdly large
// values, which would corrupt sugarShareOfKcal and let candy slip through
// a "kcal: 0" loophole.
function sanitizeNutrition(n: AnalysisResponse['nutrition']): AnalysisResponse['nutrition'] {
  const clampGrams = (x: number) => Math.max(0, Math.min(500, Number.isFinite(x) ? x : 0));
  return {
    kcal:    Math.max(0, Math.min(2000, Number.isFinite(n.kcal) ? n.kcal : 0)),
    protein: clampGrams(n.protein),
    carbs:   clampGrams(n.carbs),
    sugar:   clampGrams(n.sugar),
    fat:     clampGrams(n.fat),
    satFat:  clampGrams(n.satFat),
    fiber:   clampGrams(n.fiber),
    sodium:  Math.max(0, Math.min(20_000, Number.isFinite(n.sodium) ? n.sodium : 0)),
  };
}

export function responseToProduct(r: AnalysisResponse): Product {
  const components = r.components.map(s => s.trim()).filter(Boolean);
  const category = coerceCategory(r.category, components);
  const nutrition = sanitizeNutrition(r.nutrition);
  return {
    id: `photo_${ulid()}`,
    type: 'photo',
    brand: '',
    name: r.name.trim(),
    subtitle: 'Photo · detected meal',
    swatch: '#7a8a5e',
    glyph: '◐',
    components,
    allergens: r.allergens,
    additives: deriveAdditives(r.flaggedIngredients ?? [], category),
    nutrition: {
      serving: 'Estimated serving',
      kcal: round(nutrition.kcal),
      protein: round(nutrition.protein),
      carbs: round(nutrition.carbs),
      sugar: round(nutrition.sugar),
      fat: round(nutrition.fat),
      satFat: round(nutrition.satFat),
      fiber: round(nutrition.fiber),
      sodium: round(nutrition.sodium),
    },
    nutriScore: null,
    ecoScore: null,
    novaGroup: deriveNovaGroup(r.processing, category),
    category,
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
