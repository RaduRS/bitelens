import type { Product } from '@/types/product';
import type { VerdictLevel, Severity } from '@/types/verdict';
import type { SignalSet } from './signals';

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

// Caps the maximum trustable score based on how complete the underlying data is.
// Missing Nutri-Score / NOVA / processing info means we can't credibly award a
// "perfect" score even when no negative rule fires.
export function maxScoreCap(s: SignalSet, p: Product): number {
  if (p.type === 'photo') return 75;
  const missingNutri = s.nutriScore == null;
  const missingNova = s.novaGroup == null;
  if (missingNutri && missingNova) return 80;
  if (missingNutri || missingNova) return 90;
  return 100;
}
