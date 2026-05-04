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
  if (triggered.includes('allergen_match')) {
    return 'Contains an allergen you watch.';
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
  return 'Mixed profile — review the details below.';
}
