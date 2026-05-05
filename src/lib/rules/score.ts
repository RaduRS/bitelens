import type { Product, FoodCategory } from '@/types/product';
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

const UPF_CATEGORIES: FoodCategory[] = [
  'candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
];

// Caps the maximum trustable score based on data completeness AND known UPF signal.
// Photos: we can't verify NOVA/Nutri-Score independently, so the cap is tighter.
// When the AI tells us "this is candy/dessert/fast food" the ceiling drops below the
// "good" verdict band — these foods cannot earn a green badge from a photo alone.
export function maxScoreCap(s: SignalSet, p: Product): number {
  if (p.type === 'photo') {
    if (s.category && UPF_CATEGORIES.includes(s.category)) return 45;
    if (s.novaGroup === 4) return 50;
    if (s.category === 'beverage' || s.category === 'snack') return 65;
    if (s.novaGroup === 3) return 70;
    // Whole foods (fresh fruit, vegetables, raw nuts, plain meat) are the safest
    // possible AI classification — there's no hidden industrial formulation to
    // worry about, so they get a near-database ceiling.
    if (s.category === 'whole_food') return 90;
    return 75;
  }
  const missingNutri = s.nutriScore == null;
  const missingNova = s.novaGroup == null;
  if (missingNutri && missingNova) return 80;
  if (missingNutri || missingNova) return 90;
  return 100;
}
