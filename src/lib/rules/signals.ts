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
