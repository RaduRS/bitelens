import type { SignalSet } from './signals';

export function buildSummary(triggered: string[], s: SignalSet): string {
  if (triggered.includes('high_added_sugar') && triggered.includes('ultra_processed')) {
    return 'Ultra-processed, high sugar load.';
  }
  if (triggered.includes('additive_high_risk')) {
    return 'Contains a concerning additive.';
  }
  if (triggered.includes('allergen_match')) {
    return 'Contains an allergen you watch.';
  }
  if (triggered.includes('high_added_sugar') || triggered.includes('moderate_added_sugar')) {
    return 'Sweetened more than ideal.';
  }
  if (triggered.includes('ultra_processed')) {
    return 'Ultra-processed product.';
  }
  if (s.additiveCount === 0 && s.sugarPerServing < 5 && (s.nutriScoreOrdinal <= 1)) {
    return 'Whole-food, low sugar, no concerning additives.';
  }
  if (s.proteinPerServing >= 10 && s.sugarPerServing < 8) {
    return 'Solid protein, controlled sugar.';
  }
  return 'Mixed profile — review the details below.';
}
