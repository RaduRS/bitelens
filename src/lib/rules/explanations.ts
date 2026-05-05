import type { SignalSet } from './signals';

const HIGH_SUGAR_IDS = ['sugar_severe', 'sugar_high'];
const ANY_SUGAR_IDS = [...HIGH_SUGAR_IDS, 'sugar_moderate'];

function any(triggered: string[], ids: readonly string[]): boolean {
  return ids.some(id => triggered.includes(id));
}

export function buildSummary(triggered: string[], s: SignalSet): string {
  if (any(triggered, HIGH_SUGAR_IDS) && triggered.includes('ultra_processed')) {
    return 'Ultra-processed, high sugar load.';
  }
  if (triggered.includes('additive_high_risk')) {
    return 'Contains a concerning additive.';
  }
  if (triggered.includes('diet_keto_severe_breach') || triggered.includes('diet_keto_breach')) {
    return 'Off-track for your keto diet.';
  }
  if (triggered.includes('diet_anti_inflammatory_breach')) {
    return 'Contains seed oils — flagged for your diet.';
  }
  if (any(triggered, ANY_SUGAR_IDS)) {
    return 'Sweetened more than ideal.';
  }
  if (triggered.includes('ultra_processed')) {
    return 'Ultra-processed product.';
  }
  if (s.additiveCount === 0 && s.sugarPerServing < 5 && s.nutriScoreOrdinal <= 1) {
    return 'Whole-food, low sugar, no concerning additives.';
  }
  if (s.proteinPerServing >= 10 && s.sugarPerServing < 8) {
    return 'Solid protein, controlled sugar.';
  }
  if (s.category === 'whole_food') {
    return 'Whole, single-ingredient food.';
  }
  if (s.novaGroup != null && s.novaGroup <= 2 && s.additiveCount === 0) {
    return 'Minimally processed, no additives.';
  }
  if (s.novaGroup === 3) {
    return 'Processed but no major red flags.';
  }
  return 'Some pros, some cons — see the details below.';
}
