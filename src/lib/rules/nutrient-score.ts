// Evidence-based nutrient gradient — FSA/Ofcom NPM "A points − C points", the
// shared skeleton of every validated nutrient-profiling model (FSA, Nutri-Score,
// Health Star Rating). Each component is scored on a graduated per-100g ladder so
// the result is a smooth gradient with no category cliff. See
// docs/research/scoring-systems.md for the threshold sources.

function ladder(value: number, thresholds: number[]): number {
  let pts = 0;
  for (const t of thresholds) if (value > t) pts++;
  return pts;
}

// A-point thresholds (negative components), per 100g, max 10 each.
const E = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]; // kJ
const SAT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUG = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
const SOD = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]; // mg

// Energy data arrives in kcal; the FSA ladder is in kJ (1 kcal = 4.184 kJ).
export function energyPts(kcal: number): number { return ladder(kcal * 4.184, E); }
export function satFatPts(g: number): number { return ladder(g, SAT); }
export function sugarPts(g: number): number { return ladder(g, SUG); }
export function sodiumPts(mg: number): number { return ladder(mg, SOD); }

// C-point thresholds (positive components), per 100g.
const FIB = [0.9, 1.9, 2.8, 3.7, 4.7]; // AOAC fibre (modern EU/OFF labelling)
const PRO = [1.6, 3.2, 4.8, 6.4, 8.0];

// FVL (fruit/veg/legume/nut %) is the component that lets whole fruit offset its
// own sugar — and it's a different axis from the AI category label, so a
// misclassification can't erase it. Awards 0/1/2/5 only, per the FSA spec.
export function fvlPts(pct: number): number {
  if (pct > 80) return 5;
  if (pct > 60) return 2;
  if (pct > 40) return 1;
  return 0;
}
export function fibrePts(g: number): number { return ladder(g, FIB); }
export function proteinPts(g: number): number { return ladder(g, PRO); }

export interface NutrientInput {
  energyPer100g: number | null;
  satFatPer100g: number | null;
  sodiumPer100g: number | null;
  sugarForScore: number;        // grams — per-serving by product decision (see plan DECISION 2)
  fvlPercent: number | null;
  fiberPer100g: number | null;
  proteinPer100g: number | null;
}

// Smooth 0–100 base score. Lower raw (A−C) = healthier = higher score.
// raw spans −15 (A=0,C=15) … +40 (A=40,C=0); we linearly invert that to 0–100.
export function nutrientBase(i: NutrientInput): number {
  const A = energyPts(i.energyPer100g ?? 0) + satFatPts(i.satFatPer100g ?? 0)
    + sugarPts(i.sugarForScore) + sodiumPts(i.sodiumPer100g ?? 0);
  const fvl = fvlPts(i.fvlPercent ?? 0);
  const fib = fibrePts(i.fiberPer100g ?? 0);
  const pro = proteinPts(i.proteinPer100g ?? 0);
  // FSA protein-cap: a high-A food can't buy its way back with protein unless it
  // is also very FVL-rich (≥80%). Otherwise only fibre + FVL offset.
  const C = (A >= 11 && fvl < 5) ? (fvl + fib) : (fvl + fib + pro);
  const raw = A - C;
  return Math.max(0, Math.min(100, Math.round((100 * (40 - raw)) / 55)));
}
