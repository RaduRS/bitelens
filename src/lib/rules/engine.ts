import type { Product, FoodCategory } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { VerdictResult, Reason, Flag } from '@/types/verdict';
import { extractSignals } from './signals';
import { RULES } from './registry';
import { nutrientBase } from './nutrient-score';
import {
  bandToVerdict, SCORING_PENALTY,
  BONUS_WHOLE_UNPROCESSED, BONUS_ORGANIC, BONUS_NUTRI_AB,
} from './score';
import { buildSummary } from './explanations';
import { extractBenefits } from '@/lib/organs/evaluate';

const MAX_REASONS = 5;

const UPF_CATEGORIES = new Set<FoodCategory>([
  'candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
]);

export function evaluate(product: Product, profile: Profile): VerdictResult {
  const signals = extractSignals(product);
  const triggeredRuleIds: string[] = [];
  const negReasons: Reason[] = [];
  const posReasons: Reason[] = [];
  const flags: Flag[] = [];

  // Rules still fire — they own the explanation layer (reasons/flags/summary).
  // Their severity no longer subtracts from the score; the nutrient gradient and
  // the penalty layer below do that.
  for (const rule of RULES) {
    if (!rule.when(signals, profile, product)) continue;
    triggeredRuleIds.push(rule.id);
    const hit = rule.build(signals, product);
    if (hit.reason) (hit.reason.kind === 'pos' ? posReasons : negReasons).push(hit.reason);
    if (hit.flag) flags.push(hit.flag);
  }

  // ── Base: smooth nutrient gradient (FSA A−C), owns energy/sugar/sat-fat/
  // sodium/fibre/protein/FVL. No category cliff. ──
  let score = nutrientBase({
    energyPer100g: signals.energyPer100g,
    satFatPer100g: signals.satFatPer100g,
    sodiumPer100g: signals.sodiumPer100g,
    sugarForScore: signals.sugarPerServing,   // per-serving sugar (intentional product choice)
    fvlPercent: signals.fvlPercent,
    fiberPer100g: signals.fiberPer100g,
    proteinPer100g: signals.proteinPer100g,
  });

  // ── Bonuses (soft, never a cap) ──
  if (
    signals.novaGroup === 1 &&
    signals.additiveCount === 0 &&
    !(signals.category && UPF_CATEGORIES.has(signals.category))
  ) {
    score += BONUS_WHOLE_UNPROCESSED;
  }
  if (product.isOrganic === true) score += BONUS_ORGANIC;
  if (signals.nutriScore === 'A' || signals.nutriScore === 'B') score += BONUS_NUTRI_AB;

  // ── Penalty layer: harm axes the gradient is blind to ──
  for (const id of triggeredRuleIds) score -= (SCORING_PENALTY[id] ?? 0);

  // ── Safety rail: a low-confidence photo can't reach the Good band even if
  // everything else looks clean — the AI itself flagged it as uncertain. ──
  if (product.type === 'photo' && (product.confidence ?? 1) < 0.4) {
    score = Math.min(score, 60);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = bandToVerdict(score);
  const reasons = [...negReasons, ...posReasons].slice(0, MAX_REASONS);
  const summary = buildSummary(triggeredRuleIds, signals, product);
  const benefits = extractBenefits(signals);

  return { verdict, score, summary, reasons, flags, triggeredRuleIds, benefits };
}
