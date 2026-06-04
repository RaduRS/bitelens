import type { Product, AllergenKey, AdditiveRisk, NutriScoreGrade, NovaGroup, FoodCategory } from '@/types/product';

export interface SignalSet {
  sugarPerServing: number;
  sodiumPerServing: number;
  proteinPerServing: number;
  fiberPerServing: number;
  satFatPerServing: number;
  fatPerServing: number;
  carbsPerServing: number;
  kcalPerServing: number;
  sugarShareOfKcal: number;          // 0..1 — share of energy that comes from sugar (4 kcal/g)
  // Concentration-based harms (FSA traffic-light basis). Per 100g/100ml of
  // product, NOT per serving — so a manufacturer can't dodge them by declaring
  // a tiny serving size. null = no reliable serving weight, so we don't guess.
  sodiumPer100g: number | null;
  satFatPer100g: number | null;
  energyPer100g: number | null;
  totalFatPer100g: number | null;
  transFatPer100g: number | null;
  fiberPer100g: number | null;
  proteinPer100g: number | null;
  fvlPercent: number | null;   // 0–100 fruit/veg/legume/nut share
  additiveMaxRisk: AdditiveRisk;
  additiveCount: number;
  nutriScore: NutriScoreGrade | null;
  nutriScoreOrdinal: number;        // 0..4 (A..E), or 5 if null
  ecoScore: NutriScoreGrade | null;
  novaGroup: NovaGroup | null;
  category: FoodCategory | null;
  containsAllergens: AllergenKey[];
  ingredientsLower: string[];
}

const RISK_RANK: Record<AdditiveRisk, number> = { none: 0, low: 1, moderate: 2, high: 3 };

// Pull a serving weight (g or ml) out of a free-text serving string like
// "30g (≈12 crisps)", "355ml can", "1 portion (40 g)". First number followed by
// a g/ml unit wins. Returns null when nothing usable is present (e.g. the
// photo-flow "Estimated serving").
function parseServingGrams(serving: string): number | null {
  const m = serving.match(/(\d+(?:\.\d+)?)\s*(?:g|ml|gram|grams|millilitres?|milliliters?)\b/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return Number.isFinite(v) && v > 0 ? v : null;
}

// Resolve a per-100g/100ml value. Priority: an explicit per-100 figure (OFF's
// authoritative _100g data) → derive it from the serving weight → null.
function per100(perServing: number, explicit: number | undefined, grams: number | null): number | null {
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(0, explicit);
  if (grams && grams > 0) return Math.round((perServing / grams) * 1000) / 10;
  return null;
}

export function extractSignals(p: Product): SignalSet {
  const additiveMaxRisk: AdditiveRisk = (p.additives.length === 0)
    ? 'none'
    : p.additives.reduce<AdditiveRisk>(
        (acc, a) => (RISK_RANK[a.risk] > RISK_RANK[acc] ? a.risk : acc),
        'none',
      );
  const ranks = { A: 0, B: 1, C: 2, D: 3, E: 4 } as const;
  const kcal = p.nutrition.kcal;
  const sugar = p.nutrition.sugar;
  const sugarShareOfKcal = kcal > 0 ? Math.min(1, (sugar * 4) / kcal) : 0;
  const grams = (typeof p.nutrition.servingGrams === 'number' && p.nutrition.servingGrams > 0)
    ? p.nutrition.servingGrams
    : parseServingGrams(p.nutrition.serving);
  return {
    sugarPerServing: sugar,
    sodiumPerServing: p.nutrition.sodium,
    proteinPerServing: p.nutrition.protein,
    fiberPerServing: p.nutrition.fiber,
    satFatPerServing: p.nutrition.satFat,
    fatPerServing: p.nutrition.fat,
    carbsPerServing: p.nutrition.carbs,
    kcalPerServing: kcal,
    sugarShareOfKcal,
    sodiumPer100g: per100(p.nutrition.sodium, p.nutrition.per100?.sodium, grams),
    satFatPer100g: per100(p.nutrition.satFat, p.nutrition.per100?.satFat, grams),
    energyPer100g: per100(p.nutrition.kcal, p.nutrition.per100?.kcal, grams),
    totalFatPer100g: per100(p.nutrition.fat, p.nutrition.per100?.fat, grams),
    transFatPer100g: per100(
      p.nutrition.transFat ?? 0,
      p.nutrition.per100?.transFat,
      p.nutrition.transFat == null && p.nutrition.per100?.transFat == null ? null : grams,
    ),
    fiberPer100g: per100(p.nutrition.fiber, p.nutrition.per100?.fiber, grams),
    proteinPer100g: per100(p.nutrition.protein, p.nutrition.per100?.protein, grams),
    fvlPercent: typeof p.nutrition.fvlPercent === 'number' ? p.nutrition.fvlPercent : null,
    additiveMaxRisk,
    additiveCount: p.additives.length,
    nutriScore: p.nutriScore,
    nutriScoreOrdinal: p.nutriScore ? ranks[p.nutriScore] : 5,
    ecoScore: p.ecoScore,
    novaGroup: p.novaGroup,
    category: p.category ?? null,
    containsAllergens: [...p.allergens],
    ingredientsLower: (p.ingredients ?? p.components ?? []).map(s => s.toLowerCase()),
  };
}
