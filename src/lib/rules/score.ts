import type { VerdictLevel, Severity } from '@/types/verdict';

export const SEVERITY_POINTS: Record<Severity, number> = { low: 5, moderate: 12, high: 25 };

export function bandToVerdict(score: number): VerdictLevel {
  if (score >= 70) return 'good';
  if (score >= 40) return 'caution';
  return 'avoid';
}
