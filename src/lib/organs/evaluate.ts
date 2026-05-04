import type { OrganBenefit, OrganKey } from '@/types/organ';
import type { SignalSet } from '@/lib/rules/signals';
import { ORGAN_RULES } from './registry';

const MAX_BENEFITS = 4;

export function extractBenefits(signals: SignalSet): OrganBenefit[] {
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
