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
    let cap: number;
    if (s.category && UPF_CATEGORIES.includes(s.category)) cap = 45;
    else if (s.novaGroup === 4) cap = 50;
    else if (s.category === 'beverage' || s.category === 'snack') cap = 65;
    else if (s.novaGroup === 3) cap = 70;
    // Whole foods (fresh fruit, vegetables, raw nuts, plain meat) are the safest
    // possible AI classification: NOVA 1 by force, additives stripped by force,
    // honey/syrup already rerouted to dessert, low-confidence already capped at
    // 60 below. Nothing left to hedge against — score them on their merits.
    else if (s.category === 'whole_food') cap = 100;
    else cap = 75;
    // Low-confidence photos can't be trusted to climb into the "good" band even
    // if everything else looks clean — the AI itself flagged this as uncertain.
    // Threshold matches the prompt's "<0.4 = blurry/ambiguous" guidance.
    if ((p.confidence ?? 1) < 0.4) cap = Math.min(cap, 60);
    return cap;
  }
  const missingNutri = s.nutriScore == null;
  const missingNova = s.novaGroup == null;
  if (missingNutri && missingNova) return 80;
  if (missingNutri || missingNova) return 90;
  return 100;
}
