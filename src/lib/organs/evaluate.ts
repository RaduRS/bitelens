import type { OrganBenefit, OrganKey } from '@/types/organ';
import type { FoodCategory } from '@/types/product';
import type { SignalSet } from '@/lib/rules/signals';
import { ORGAN_RULES } from './registry';

const MAX_BENEFITS = 4;

const UPF_CATEGORIES: FoodCategory[] = [
  'candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
];

// Don't credit organ benefits to ultra-processed/junk products even if their
// ingredient list mentions a recognized food. The classic false positive: a
// cheese-flavoured bag of crisps lists "cheese powder (milk)" and earns a
// "supports bones" halo — when in reality the salt load is a NET NEGATIVE for
// bone density. Packaged savoury snacks (chips/crisps/crackers/popcorn) are
// quintessential ultra-processed food, so they get no organ credit regardless
// of trace recognizable ingredients.
function isJunk(s: SignalSet): boolean {
  if (s.category && UPF_CATEGORIES.includes(s.category)) return true;
  if (s.category === 'snack') return true;
  if (s.novaGroup === 4 && s.sugarShareOfKcal >= 0.3) return true;
  return false;
}

export function extractBenefits(signals: SignalSet): OrganBenefit[] {
  if (isJunk(signals)) return [];
  const best: Partial<Record<OrganKey, number>> = {};
  for (const rule of ORGAN_RULES) {
    if (!rule.when(signals)) continue;
    const current = best[rule.organ] ?? 0;
    if (rule.priority > current) best[rule.organ] = rule.priority;
  }
  return (Object.entries(best) as [OrganKey, number][])
    .map(([organ, priority]) => ({ organ, priority }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_BENEFITS);
}
