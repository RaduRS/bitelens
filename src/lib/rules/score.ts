import type { Severity, VerdictLevel } from '@/types/verdict';

// Severity is retained for explanation/display ordering only — the score is now
// computed by the nutrient gradient (nutrient-score.ts) plus the bonus/penalty
// layers below, NOT by subtracting these points from 100.
export const SEVERITY_POINTS: Record<Severity, number> = {
  low: 5,
  moderate: 12,
  high: 25,
  severe: 45,
};

export function bandToVerdict(score: number): VerdictLevel {
  if (score >= 70) return 'good';
  if (score >= 40) return 'caution';
  return 'avoid';
}

// ── Bonus layer (added to the nutrient base) ──────────────────────
// Soft bonuses, never caps — a mislabel just forfeits them, it cannot collapse
// a score the way the old category cap did.
export const BONUS_WHOLE_UNPROCESSED = 17; // NOVA 1, no additives, non-UPF → egg ~90, banana ~95
export const BONUS_ORGANIC = 5;
export const BONUS_NUTRI_AB = 5;

// ── Penalty layer (subtracted from the nutrient base) ─────────────
// The gradient owns energy/sugar/sat-fat/sodium/fibre/protein/FVL. These rules
// cover the harm axes nutrient profiling is blind to (processing, additives,
// trans fat, carcinogenic food types, personal diet/goal breaches). A fired rule
// deducts its points here; rules absent from this map are explanation-only.
export const SCORING_PENALTY: Record<string, number> = {
  // Industrial trans fat — WHO ban target.
  trans_fat_ingredient: 35,
  trans_fat_high: 35,
  trans_fat_present: 18,
  // Additives.
  additive_high_risk: 18,
  additive_moderate_risk: 10,
  additive_count_stacked: 5,
  // Processing — the axis Nutri-Score is blind to.
  ultra_processed: 18,
  processed_nova3: 6,
  // Category "the type IS the harm" (stacks on NOVA 4 for UPF categories).
  category_processed_meat: 20,
  category_candy: 15,
  category_fast_food: 10,
  category_snack: 10,
  category_dessert: 8,
  // Ingredient/processing markers.
  refined_sugar_ingredient: 8,
  upf_ingredient_marker: 6,
  // Official third-party scores (barcode only).
  nutri_score_e: 12,
  nutri_score_d: 6,
  // Advisory.
  commodity_elevated_residue: 5,
  // Personal diet/goal breaches.
  diet_keto_severe_breach: 25,
  diet_keto_breach: 12,
  diet_low_carb_breach: 12,
  diet_carnivore_breach: 12,
  diet_anti_inflammatory_breach: 12,
  goal_low_sugar_breach: 5,
  goal_less_processed_breach: 5,
};
