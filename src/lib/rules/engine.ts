import type { Product } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { VerdictResult, Reason, Flag } from '@/types/verdict';
import { extractSignals } from './signals';
import { RULES } from './registry';
import { SEVERITY_POINTS, bandToVerdict } from './score';
import { buildSummary } from './explanations';
import { extractBenefits } from '@/lib/organs/evaluate';

const MAX_REASONS = 5;

export function evaluate(product: Product, profile: Profile): VerdictResult {
  const signals = extractSignals(product);
  let score = 100;
  const triggeredRuleIds: string[] = [];
  const negReasons: Reason[] = [];
  const posReasons: Reason[] = [];
  const flags: Flag[] = [];

  for (const rule of RULES) {
    if (!rule.when(signals, profile, product)) continue;
    triggeredRuleIds.push(rule.id);
    if (rule.severity !== 'pos') {
      score -= SEVERITY_POINTS[rule.severity];
    }
    const hit = rule.build(signals, product);
    if (hit.reason) (hit.reason.kind === 'pos' ? posReasons : negReasons).push(hit.reason);
    if (hit.flag) flags.push(hit.flag);
  }

  score = Math.max(0, score);
  const verdict = bandToVerdict(score);
  const reasons = [...negReasons, ...posReasons].slice(0, MAX_REASONS);
  const summary = buildSummary(triggeredRuleIds, signals);
  const benefits = extractBenefits(signals);

  return { verdict, score, summary, reasons, flags, triggeredRuleIds, benefits };
}
