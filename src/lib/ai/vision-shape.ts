import { ulid } from 'ulid';
import type { Product, AllergenKey } from '@/types/product';

export const ALLERGEN_ENUM: AllergenKey[] = [
  'gluten', 'dairy', 'eggs', 'nuts', 'peanuts',
  'soy', 'fish', 'shellfish', 'sesame',
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
  confidence: number;
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
    additives: [],
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
    novaGroup: null,
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
