# BiteLens Scoring Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the start-at-100/subtract-severity/hard-category-cap scoring with a smooth, evidence-based nutrient gradient (FSA/Nutri-Score "A points − C points") mapped to 0–100, so a banana scores on its nutrition (~good) even when the AI mislabels its category — eliminating the cliff where one wrong label drops a banana from 100 to 25.

**Architecture:** Keep the existing rule registry as the **explanation layer** (it still produces `triggeredRuleIds`, `reasons`, `flags`, and feeds `buildSummary`). Replace only the **score computation**: a new pure `nutrient-score.ts` module computes a continuous base score from graduated per-100g nutrient ladders + a central fruit/veg/legume/nut (FVL) offset; the engine then applies a bounded **penalty layer** (processing/additives/trans-fat/category-harm/diet) on top — because nutrient profiling alone is proven processing-blind and lenient at the high-sugar end. Nutrient-quantity rules (sugar/sodium/satfat/energy/total-fat tiers) stop contributing score points (the gradient now owns them) but keep firing for explanations.

**Tech Stack:** TypeScript, Vitest, Next.js 16. Pure functions in `src/lib/rules/`. Evidence base: `docs/research/scoring-systems.md`.

---

## Design decisions needing your sign-off (call-outs)

These two choices change the "feel" of scores. **Defaults are chosen; confirm or override before/at execution.**

**DECISION 1 — Whole-food "feel" — RESOLVED: bigger nudge (+17), egg ~90.**
On a pure nutrient gradient, a fresh egg scores ~73 (good) because its saturated fat earns A-points that only protein offsets — it is *not* a perfect 100. You previously praised egg = 100 and chose to keep clean whole foods near the top. The plan adds a **+17 bonus for genuinely unprocessed single foods** (NOVA 1, no additives, non-UPF category): egg ~90, banana ~95, raw veg ~100. It remains a *soft bonus, never a cap* — a mislabel (e.g. banana→dessert, which forces NOVA 4) simply loses the +17 and takes the penalty, degrading to caution instead of collapsing. Accepted trade-off: the top band is compressed (a plain egg and a great mixed meal can both read ~90+) — fine, since both are "eat freely."

**DECISION 2 — Sugar basis stays per-serving.**
Memory `scoring_per100g_basis` records a deliberate product choice: salt/sat-fat are per-100g (FSA), but **sugar is scored per-serving on purpose** so sugary drinks don't regress (a 39g/can cola must read as a sugar bomb; per-100ml it's only 11g). This plan keeps that: the gradient scores energy/sat-fat/sodium/fibre/protein/FVL **per 100g**, but **sugar on the FSA sugar ladder using the per-serving gram value**. Default: keep per-serving sugar. Override only if you want full FSA per-100g consistency (would regress sugary-drink scores — not recommended).

---

## Evidence-grounded scoring spec

All ladders per 100 g unless noted. Source: `docs/research/scoring-systems.md` (FSA/Ofcom NPM technical guidance).

### A points (negative) — each 0–10, max 40

`points = number of thresholds strictly exceeded`.

| Pts | Energy (kJ) | Sat fat (g) | **Sugar (g, per SERVING — see DECISION 2)** | Sodium (mg) |
|----:|------------:|------------:|--------------------------------------------:|------------:|
| 1 | >335 | >1 | >4.5 | >90 |
| 2 | >670 | >2 | >9 | >180 |
| 3 | >1005 | >3 | >13.5 | >270 |
| 4 | >1340 | >4 | >18 | >360 |
| 5 | >1675 | >5 | >22.5 | >450 |
| 6 | >2010 | >6 | >27 | >540 |
| 7 | >2345 | >7 | >31 | >630 |
| 8 | >2680 | >8 | >36 | >720 |
| 9 | >3015 | >9 | >40 | >810 |
| 10 | >3350 | >10 | >45 | >900 |

Energy input is kcal in our data → convert: `kJ = kcal * 4.184`.

### C points (positive) — each 0–5, max 15

| Pts | FVL (%) | Fibre AOAC (g) | Protein (g) |
|----:|--------:|---------------:|------------:|
| 1 | >40 | >0.9 | >1.6 |
| 2 | >60 | >1.9 | >3.2 |
| 3 | — | >2.8 | >4.8 |
| 4 | — | >3.7 | >6.4 |
| 5 | >80 | >4.7 | >8.0 |

FVL only awards 0/1/2/5 (no 3 or 4), per the spec. We use the AOAC fibre ladder (OFF/modern EU labels report AOAC).

### Combine → raw → base100

```
A = energyPts + satFatPts + sugarPts + sodiumPts          // 0..40
Cfull = fvlPts + fibrePts + proteinPts                     // 0..15
// FSA protein-cap: high-A foods can't buy back via protein unless very FVL-rich
C = (A >= 11 && fvlPts < 5) ? (fvlPts + fibrePts) : Cfull
raw = A - C                                                // -15..+40, lower = healthier
base100 = clamp(0, 100, round(100 * (40 - raw) / 55))
```

Worked: banana (per100g ~89kcal, satfat 0, sodium ~1mg; sugar per-serving 14g; FVL 100%, fibre 2.6g AOAC→2pts, protein 1.3g) → A=1+0+3+0=4, C=5+2+0=7, raw=−3, **base100≈78**. Crisps (2230kJ, satfat 5g, sodium 667mg/100g; sugar 0.6g/serving; FVL 0, fibre ~3g→3pts, protein 6g→4pts) → A=6+5+0+7=18, protein-capped so C=0+3=3, raw=15, **base100≈45**.

### Bonus layer (added to base100)

| Bonus | Points | When |
|---|---:|---|
| `BONUS_WHOLE_UNPROCESSED` | +17 | DECISION 1 (resolved): `novaGroup===1 && additiveCount===0 && category not in UPF set` |
| `pos_organic_certified` | +5 | `isOrganic===true` |
| `pos_nutri_a_b` | +5 | barcode Nutri-Score A or B |

### Penalty layer (subtracted from base100)

The gradient owns energy/sugar/satfat/sodium/fibre/protein/FVL. Everything below is a **separate harm axis** the gradient is blind to. A fired rule deducts its `SCORING_PENALTY`; rules not in the table are explanation-only (0 points).

```ts
export const SCORING_PENALTY: Record<string, number> = {
  // Industrial trans fat — WHO ban target
  trans_fat_ingredient: 35, trans_fat_high: 35, trans_fat_present: 18,
  // Additives
  additive_high_risk: 18, additive_moderate_risk: 10, additive_count_stacked: 5,
  // Processing (the axis Nutri-Score is blind to)
  ultra_processed: 18, processed_nova3: 6,
  // Category "the type IS the harm" (stacks on NOVA4 for UPF cats)
  category_processed_meat: 20, category_candy: 15, category_fast_food: 10,
  category_dessert: 8, category_snack: 10,
  // Ingredient/processing markers
  refined_sugar_ingredient: 8, upf_ingredient_marker: 6,
  // Official third-party scores (barcode only)
  nutri_score_e: 12, nutri_score_d: 6,
  // Advisory
  commodity_elevated_residue: 5,
  // Personal diet/goal breaches
  diet_keto_severe_breach: 25, diet_keto_breach: 12, diet_low_carb_breach: 12,
  diet_carnivore_breach: 12, diet_anti_inflammatory_breach: 12,
  goal_low_sugar_breach: 5, goal_less_processed_breach: 5,
};
```

### Final

```
final = clamp(0, 100, base100 + bonuses - penalties)
verdict = bandToVerdict(final)   // unchanged: >=70 good, >=40 caution, else avoid
```

Verified targets (resolved decisions): banana whole_food 78+17=**95 good**; banana mislabeled dessert (FVL floored from components) 78 − 18(NOVA4) − 8(dessert) = **52 caution** (was 25 avoid — cliff gone); egg ~73+17=**90 good**; crisps 45 − 18(NOVA4) − 10(snack) = **17 avoid**; cola base100≈58 (sugar 39g/serving→8 A-pts) − 18(NOVA4) − 18(additive_high) − 12(nutri_E) − 8(refined_sugar) = **2 avoid**.

---

## File Structure

- **Create** `src/lib/rules/nutrient-score.ts` — pure: A/C ladders, protein-cap, raw→base100. One responsibility: the nutrient gradient.
- **Create** `src/lib/rules/nutrient-score.test.ts` — unit tests for every ladder + mapping.
- **Modify** `src/lib/rules/score.ts` — add `SCORING_PENALTY` table + bonus constants; keep `bandToVerdict`; **delete** `maxScoreCap` + `MAX_OFFSET` (cliff removed). `SEVERITY_POINTS` stays (rules still carry severity for display ordering).
- **Modify** `src/lib/rules/signals.ts` — add `fvlFloorFromComponents` so obvious whole fruit/veg can't be tanked by a stray `fvl=0`; expose `novaGroup`, `additiveCount`, `category` already present.
- **Modify** `src/lib/rules/engine.ts` — new compute: `base100` + bonuses − penalties (replacing the `100 − Σseverity`, offset, and cap logic). Still fire all rules for reasons/flags/summary.
- **Modify** `src/lib/rules/engine.test.ts` — migrate: keep behavioral invariants, rewrite cliff/cap-specific assertions.
- **Modify** `src/lib/db/scan-log.ts` — `maxScoreCap` import is removed; drop `scoreCap` derivation (set `score_cap` null or store `base100`). (Logging table column stays; just stop computing the deleted cap.)
- **Create** `src/lib/rules/scoring-regression.test.ts` — banana(whole+dessert)/egg/crisps/cola anchors + fixture snapshot guard.

---

## Task 1: Nutrient ladders (A points)

**Files:**
- Create: `src/lib/rules/nutrient-score.ts`
- Test: `src/lib/rules/nutrient-score.test.ts`

- [ ] **Step 1: Write failing tests for A-point ladders**

```ts
import { describe, it, expect } from 'vitest';
import { energyPts, satFatPts, sugarPts, sodiumPts } from './nutrient-score';

describe('A-point ladders', () => {
  it('energy converts kcal→kJ and tiers', () => {
    expect(energyPts(0)).toBe(0);
    expect(energyPts(80)).toBe(0);    // 335kJ boundary (80kcal=335kJ, not >335)
    expect(energyPts(89)).toBe(1);    // banana ~372kJ
    expect(energyPts(534)).toBe(6);   // crisps ~2234kJ
    expect(energyPts(900)).toBe(10);  // >3350kJ
  });
  it('sat fat tiers 1g steps', () => {
    expect(satFatPts(1)).toBe(0);
    expect(satFatPts(1.1)).toBe(1);
    expect(satFatPts(5)).toBe(4);
    expect(satFatPts(30)).toBe(10);
  });
  it('sugar tiers (value is grams; caller passes per-serving)', () => {
    expect(sugarPts(4.5)).toBe(0);
    expect(sugarPts(14)).toBe(3);
    expect(sugarPts(39)).toBe(8);
    expect(sugarPts(60)).toBe(10);
  });
  it('sodium tiers 90mg steps', () => {
    expect(sodiumPts(90)).toBe(0);
    expect(sodiumPts(91)).toBe(1);
    expect(sodiumPts(667)).toBe(7);
    expect(sodiumPts(1000)).toBe(10);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/rules/nutrient-score.test.ts`
Expected: FAIL — "energyPts is not a function".

- [ ] **Step 3: Implement A-point ladders**

```ts
// src/lib/rules/nutrient-score.ts
function ladder(value: number, thresholds: number[]): number {
  let pts = 0;
  for (const t of thresholds) if (value > t) pts++;
  return pts;
}
const E = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SAT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUG = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45];
const SOD = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900];

export function energyPts(kcal: number): number { return ladder(kcal * 4.184, E); }
export function satFatPts(g: number): number { return ladder(g, SAT); }
export function sugarPts(g: number): number { return ladder(g, SUG); }
export function sodiumPts(mg: number): number { return ladder(mg, SOD); }
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/rules/nutrient-score.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/nutrient-score.ts src/lib/rules/nutrient-score.test.ts
git commit -m "feat(scoring): FSA A-point nutrient ladders"
```

## Task 2: C points + raw→base100 mapping

**Files:**
- Modify: `src/lib/rules/nutrient-score.ts`
- Test: `src/lib/rules/nutrient-score.test.ts`

- [ ] **Step 1: Add failing tests**

```ts
import { fvlPts, fibrePts, proteinPts, nutrientBase } from './nutrient-score';

describe('C-point ladders', () => {
  it('FVL awards 0/1/2/5 only', () => {
    expect(fvlPts(40)).toBe(0); expect(fvlPts(41)).toBe(1);
    expect(fvlPts(61)).toBe(2); expect(fvlPts(81)).toBe(5);
  });
  it('fibre AOAC + protein tiers', () => {
    expect(fibrePts(0.9)).toBe(0); expect(fibrePts(4.7)).toBe(4); expect(fibrePts(4.8)).toBe(5);
    expect(proteinPts(1.6)).toBe(0); expect(proteinPts(8)).toBe(4); expect(proteinPts(8.1)).toBe(5);
  });
});

describe('nutrientBase', () => {
  // input is a partial SignalSet-like object; sugarGramsForScore passed explicitly
  it('banana lands high (good band)', () => {
    const b = nutrientBase({ energyPer100g: 89, satFatPer100g: 0, sodiumPer100g: 1,
      sugarForScore: 14, fvlPercent: 100, fiberPer100g: 2.6, proteinPer100g: 1.3 });
    expect(b).toBeGreaterThanOrEqual(74);
  });
  it('crisps land mid/low before penalties', () => {
    const b = nutrientBase({ energyPer100g: 534, satFatPer100g: 5, sodiumPer100g: 667,
      sugarForScore: 0.6, fvlPercent: 0, fiberPer100g: 3, proteinPer100g: 6 });
    expect(b).toBeLessThanOrEqual(50);
  });
  it('protein cannot rescue a high-A food (protein cap)', () => {
    const b = nutrientBase({ energyPer100g: 534, satFatPer100g: 8, sodiumPer100g: 900,
      sugarForScore: 30, fvlPercent: 0, fiberPer100g: 0, proteinPer100g: 25 });
    expect(b).toBeLessThan(25);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/rules/nutrient-score.test.ts`
Expected: FAIL — "fvlPts is not a function".

- [ ] **Step 3: Implement C ladders + base**

```ts
const FIB = [0.9, 1.9, 2.8, 3.7, 4.7];
const PRO = [1.6, 3.2, 4.8, 6.4, 8.0];

export function fvlPts(pct: number): number {
  if (pct > 80) return 5; if (pct > 60) return 2; if (pct > 40) return 1; return 0;
}
export function fibrePts(g: number): number { return ladder(g, FIB); }
export function proteinPts(g: number): number { return ladder(g, PRO); }

export interface NutrientInput {
  energyPer100g: number | null;
  satFatPer100g: number | null;
  sodiumPer100g: number | null;
  sugarForScore: number;        // grams — per-serving by product decision (DECISION 2)
  fvlPercent: number | null;
  fiberPer100g: number | null;
  proteinPer100g: number | null;
}

export function nutrientBase(i: NutrientInput): number {
  const A = energyPts(i.energyPer100g ?? 0) + satFatPts(i.satFatPer100g ?? 0)
    + sugarPts(i.sugarForScore) + sodiumPts(i.sodiumPer100g ?? 0);
  const fvl = fvlPts(i.fvlPercent ?? 0);
  const fib = fibrePts(i.fiberPer100g ?? 0);
  const pro = proteinPts(i.proteinPer100g ?? 0);
  const C = (A >= 11 && fvl < 5) ? (fvl + fib) : (fvl + fib + pro);
  const raw = A - C;
  return Math.max(0, Math.min(100, Math.round((100 * (40 - raw)) / 55)));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/rules/nutrient-score.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/nutrient-score.ts src/lib/rules/nutrient-score.test.ts
git commit -m "feat(scoring): C-point offsets + raw→0-100 nutrient base"
```

## Task 3: FVL flooring from components (defence in depth)

**Files:**
- Modify: `src/lib/rules/signals.ts`
- Test: `src/lib/rules/signals.test.ts`

Rationale: if the AI mislabels a banana as `dessert` it may also report `fvl=0`. Flooring FVL from obvious whole-food component names keeps the offset alive so the score degrades gracefully.

- [ ] **Step 1: Add failing test**

```ts
import { fvlFloorFromComponents } from './signals';
describe('fvlFloorFromComponents', () => {
  it('floors a single obvious fruit to ~100', () => {
    expect(fvlFloorFromComponents(['Banana'], 0)).toBeGreaterThanOrEqual(90);
  });
  it('does not lower an already-high AI value', () => {
    expect(fvlFloorFromComponents(['Banana'], 100)).toBe(100);
  });
  it('ignores non-whole components', () => {
    expect(fvlFloorFromComponents(['Chocolate', 'Sugar'], 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `npx vitest run src/lib/rules/signals.test.ts`
Expected: FAIL — "fvlFloorFromComponents is not a function".

- [ ] **Step 3: Implement (small curated whole-food list; conservative — only floors when ALL components are whole)**

```ts
const WHOLE_FVL = [
  'apple','banana','orange','pear','grape','berry','strawberry','blueberry','raspberry',
  'mango','pineapple','peach','plum','kiwi','melon','watermelon','cherry','apricot','fig',
  'broccoli','spinach','carrot','tomato','cucumber','pepper','lettuce','kale','courgette',
  'zucchini','cauliflower','green bean','pea','lentil','chickpea','bean','avocado',
];
export function fvlFloorFromComponents(components: string[], aiValue: number): number {
  if (!components.length) return aiValue;
  const allWhole = components.every(c => {
    const l = c.toLowerCase();
    return WHOLE_FVL.some(w => l.includes(w));
  });
  return allWhole ? Math.max(aiValue, 100) : aiValue;
}
```

Then in `extractSignals`, set `fvlPercent` to `fvlFloorFromComponents(ingredientsLower-or-components, aiFvl)` only for photo products (barcode FVL comes from OFF and is trustworthy). Keep existing barcode behavior.

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/lib/rules/signals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/signals.ts src/lib/rules/signals.test.ts
git commit -m "feat(scoring): floor FVL from whole-food components (mislabel defence)"
```

## Task 4: Penalty table + bonus constants in score.ts

**Files:**
- Modify: `src/lib/rules/score.ts`

- [ ] **Step 1: Add `SCORING_PENALTY` (full table from spec above) and bonus constants; keep `bandToVerdict`; remove `maxScoreCap` and `MAX_OFFSET`.**

```ts
export const BONUS_WHOLE_UNPROCESSED = 17;  // DECISION 1 resolved: bigger nudge (egg ~90)
export const BONUS_ORGANIC = 5;
export const BONUS_NUTRI_AB = 5;
export const SCORING_PENALTY: Record<string, number> = { /* full table from spec */ };
// bandToVerdict unchanged. Delete maxScoreCap + MAX_OFFSET.
```

- [ ] **Step 2: Update consumers so the build stays green**

`src/lib/db/scan-log.ts`: remove the `maxScoreCap` import + `cap` computation; pass `scoreCap: null` (or compute `nutrientBase` and store that instead — optional). `src/lib/rules/engine.ts` is rewritten in Task 5.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors ONLY in `engine.ts` (rewritten next) — fix scan-log.ts now so it's clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/rules/score.ts src/lib/db/scan-log.ts
git commit -m "feat(scoring): penalty table + bonuses, remove category cap"
```

## Task 5: Rewire the engine onto the gradient

**Files:**
- Modify: `src/lib/rules/engine.ts`

- [ ] **Step 1: Replace the score computation**

```ts
import { nutrientBase } from './nutrient-score';
import { bandToVerdict, SCORING_PENALTY, BONUS_WHOLE_UNPROCESSED, BONUS_ORGANIC, BONUS_NUTRI_AB } from './score';

const UPF = new Set(['candy','dessert','fast_food','baked_good','fried_food','processed_meat']);

export function evaluate(product: Product, profile: Profile): VerdictResult {
  const s = extractSignals(product);
  const triggeredRuleIds: string[] = [];
  const negReasons: Reason[] = []; const posReasons: Reason[] = []; const flags: Flag[] = [];

  for (const rule of RULES) {
    if (!rule.when(s, profile, product)) continue;
    triggeredRuleIds.push(rule.id);
    const hit = rule.build(s, product);
    if (hit.reason) (hit.reason.kind === 'pos' ? posReasons : negReasons).push(hit.reason);
    if (hit.flag) flags.push(hit.flag);
  }

  // Base: smooth nutrient gradient (owns energy/sugar/satfat/sodium/fibre/protein/FVL).
  let score = nutrientBase({
    energyPer100g: s.energyPer100g, satFatPer100g: s.satFatPer100g, sodiumPer100g: s.sodiumPer100g,
    sugarForScore: s.sugarPerServing,                 // DECISION 2: per-serving sugar
    fvlPercent: s.fvlPercent, fiberPer100g: s.fiberPer100g, proteinPer100g: s.proteinPer100g,
  });

  // Bonuses (soft, never a cap).
  if (s.novaGroup === 1 && s.additiveCount === 0 && !(s.category && UPF.has(s.category)))
    score += BONUS_WHOLE_UNPROCESSED;
  if (product.isOrganic === true) score += BONUS_ORGANIC;
  if (s.nutriScore === 'A' || s.nutriScore === 'B') score += BONUS_NUTRI_AB;

  // Penalty layer: harm axes the gradient is blind to.
  for (const id of triggeredRuleIds) score -= (SCORING_PENALTY[id] ?? 0);

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = bandToVerdict(score);
  const reasons = [...negReasons, ...posReasons].slice(0, MAX_REASONS);
  const summary = buildSummary(triggeredRuleIds, s, product);
  const benefits = extractBenefits(s);
  return { verdict, score, summary, reasons, flags, triggeredRuleIds, benefits };
}
```

Note: rules still carry `severity`/`bonus` fields (used by other code paths / display ordering); the engine no longer reads them for score. Leave the `Rule` interface as-is.

- [ ] **Step 2: Typecheck + run full suite (expect engine.test failures to migrate next)**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; `nutrient-score`/`signals` green; `engine.test.ts` has failures on cliff-specific assertions (addressed in Task 6).

- [ ] **Step 3: Commit**

```bash
git add src/lib/rules/engine.ts
git commit -m "feat(scoring): evaluate on nutrient gradient + penalty layer"
```

## Task 6: Migrate engine.test.ts

**Files:**
- Modify: `src/lib/rules/engine.test.ts`

Keep BEHAVIORAL invariants; rewrite assertions that encode the removed cliff. Mapping of each existing test:

- [ ] **Step 1: Preserve as-is (must still pass — behavioral truth):**
  - cola → avoid, score < 15, triggers sugar_severe/additive_high_risk/ultra_processed/nutri_score_e
  - strawberry yogurt → caution (40–69)
  - plain yogurt → good (≥70)
  - sparkling water → good with a positive reason
  - keto/low-carb diet breach triggers
  - Haribo candy photo → avoid (<40), triggers category_candy/ultra_processed/refined_sugar_ingredient; not pos_no_additives
  - candy/dessert photo never reaches good (<70)
  - smoked salmon whole_food → good; no sodium_high penalty effect (still good despite 850mg/serving)
  - coconut whole_food → good
  - crisps (per-100g salt) → avoid (<40), triggers sodium_high
  - cheese-crisps → no bones benefit
  - photo cracker → sodium_high fires
  - biscuit → energy_high fires; almonds → not energy_high
  - trans fat margarine → avoid, trans_fat_ingredient
  - cheese sauce → total_fat_high; avocado → not
  - cream crackers snack → avoid-ish, category_snack, not pos_low_sugar, score ≤ 55
  - salted almonds → not energy_high/total_fat_high; not good; score > 15
  - lentil stew → good, pos_high_fiber + pos_fvl_content
  - fortified candy bar → avoid; positives don't rescue
  - bacon photo → avoid, category_processed_meat + additive_high_risk
  - pesticide/organic/strawberry tests unchanged

  *Note:* these rule IDs still FIRE (explanation layer), so `triggeredRuleIds` assertions hold. The score-band assertions for junk hold because the penalty layer keeps them in avoid/caution. **Run them; only adjust numeric thresholds that genuinely shift (see Step 2).**

- [ ] **Step 2: Rewrite cliff/cap-specific assertions:**
  - `'caps photo products at 75'` → DELETE (cap removed). Replace with: a clean photo meal (the Pristine Bowl, FVL-rich) scores in the good band (`>=70`) on its merits.

```ts
it('a clean nutrient-dense photo meal scores in the good band on its merits', () => {
  const photoProduct: Product = { /* same Pristine Bowl as before */ };
  const r = evaluate(photoProduct, DEFAULT_PROFILE);
  expect(r.verdict).toBe('good');
  expect(r.score).toBeGreaterThanOrEqual(70);
});
```
  - `'caps barcode products with no Nutri-Score and no NOVA at 80'` and `'...at 90'` → DELETE (data-completeness caps removed). The gradient scores on actual nutrients regardless of missing official grades. Replace with a single test asserting a missing-grade product still scores by nutrients (no artificial ceiling): pick `p_oat_crisps` w/o nutriScore/nova and assert `verdict` is computed and finite, not pinned to ≤80.
  - `'apple+banana whole_food photo ... score === 100'` → CHANGE to band: `expect(r.verdict).toBe('good'); expect(r.score).toBeGreaterThanOrEqual(80);` and keep `not sugar_high`, `pos_whole_food`, `pos_high_fiber` rule-fire assertions.
  - `'clean whole-food photo ... perfect 100'` (broccoli) → CHANGE `toBe(100)` to `toBeGreaterThanOrEqual(90)` (broccoli: A≈0, C high, +8 bonus → ~100, but assert ≥90 to be robust).
  - `'low-confidence photo cannot reach Good ... <= 60'` → **Behavior change:** the confidence cap lived in `maxScoreCap` (deleted). DECISION 3 (minor): either (a) drop this guarantee [default — confidence is shown in UI, not scored], or (b) re-add a confidence penalty in the engine: `if (product.type==='photo' && (product.confidence??1) < 0.4) score = Math.min(score, 60);`. **Default: re-add the one-line confidence clamp** to preserve the guarantee, since it's a safety rail not a cliff. Update the test to keep passing.

- [ ] **Step 3: Run migrated suite**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS (all behavioral invariants + rewritten band assertions).

- [ ] **Step 4: Commit**

```bash
git add src/lib/rules/engine.test.ts src/lib/rules/engine.ts
git commit -m "test(scoring): migrate engine tests off the removed cliff/caps"
```

## Task 7: Regression anchors — the exact complaint cases

**Files:**
- Create: `src/lib/rules/scoring-regression.test.ts`

- [ ] **Step 1: Write the anchor tests (the foods the user complained about)**

```ts
import { describe, it, expect } from 'vitest';
import { evaluate } from './engine';
import { DEFAULT_PROFILE } from '@/types/profile';
import type { Product, FoodCategory } from '@/types/product';

function photo(name: string, category: FoodCategory, nova: 1|2|3|4, components: string[],
  n: Partial<Product['nutrition']>): Product {
  return { id: 'photo_'+name, type: 'photo', brand: '', name, subtitle: '', swatch: '#000',
    glyph: '◐', components, allergens: [], additives: [],
    nutrition: { serving: 'Estimated serving', servingGrams: 118, kcal: 105, protein: 1.3,
      carbs: 27, sugar: 14, fat: 0.4, satFat: 0.1, fiber: 3.1, sodium: 1, fvlPercent: 100, ...n },
    nutriScore: null, ecoScore: null, novaGroup: nova, category, confidence: 0.9 } as Product;
}

describe('scoring regression — banana must never rank near crisps', () => {
  it('banana correctly classified is good', () => {
    const r = evaluate(photo('Banana', 'whole_food', 1, ['Banana'], {}), DEFAULT_PROFILE);
    expect(r.verdict).toBe('good'); expect(r.score).toBeGreaterThanOrEqual(80);
  });
  it('banana MISCLASSIFIED as dessert degrades gracefully (caution, NOT avoid)', () => {
    const r = evaluate(photo('Banana', 'dessert', 4, ['Banana'], {}), DEFAULT_PROFILE);
    expect(r.verdict).not.toBe('avoid');
    expect(r.score).toBeGreaterThanOrEqual(40);   // was 25 (avoid) under the old cliff
  });
  it('egg is good', () => {
    const r = evaluate(photo('Egg', 'whole_food', 1, ['Egg'],
      { servingGrams: 50, kcal: 72, protein: 6.3, carbs: 0.4, sugar: 0.2, fat: 5, satFat: 1.6,
        fiber: 0, sodium: 71, fvlPercent: 0 }), DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
  });
  it('crisps are avoid', () => {
    const r = evaluate(photo('Potato crisps', 'snack', 4, ['Potato','Sunflower oil','Salt'],
      { servingGrams: 30, kcal: 160, protein: 1.8, carbs: 15, sugar: 0.5, fat: 10, satFat: 1.5,
        fiber: 1.2, sodium: 170, fvlPercent: 0 }), DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
  });
  it('banana scores at least 2.5x crisps (clear separation)', () => {
    const b = evaluate(photo('Banana','whole_food',1,['Banana'],{}), DEFAULT_PROFILE).score;
    const c = evaluate(photo('Crisps','snack',4,['Potato','Sunflower oil','Salt'],
      { servingGrams: 30, kcal: 160, sugar: 0.5, satFat: 1.5, sodium: 170, fvlPercent: 0 }),
      DEFAULT_PROFILE).score;
    expect(b).toBeGreaterThan(c * 2.5);
  });
});
```

- [ ] **Step 2: Run**

Run: `npx vitest run src/lib/rules/scoring-regression.test.ts`
Expected: PASS. If the dessert-banana case fails (<40), confirm FVL flooring (Task 3) is wired into `extractSignals` for photos.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rules/scoring-regression.test.ts
git commit -m "test(scoring): regression anchors for banana/egg/crisps separation"
```

## Task 8: Full suite + manual re-score of the sample set

**Files:** none (verification).

- [ ] **Step 1: Run everything**

Run: `npx vitest run && npx tsc --noEmit`
Expected: ALL pass, tsc clean.

- [ ] **Step 2: Print the re-scored fixtures for human review (temporary script)**

```bash
cat > /tmp/rescore.mjs <<'EOF'
import { SAMPLE_PRODUCTS } from './src/fixtures/sample-products.ts';
import { evaluate } from './src/lib/rules/engine.ts';
import { DEFAULT_PROFILE } from './src/types/profile.ts';
for (const p of SAMPLE_PRODUCTS) {
  const r = evaluate(p, DEFAULT_PROFILE);
  console.log(`${r.score}\t${r.verdict}\t${p.name}`);
}
EOF
npx tsx /tmp/rescore.mjs | sort -n
```
Expected: junk (cola, candy, crisps) at the bottom (avoid); whole foods/clean meals at the top (good); no fruit sitting among the snacks. **Eyeball every row** against intuition; if any look wrong, note them for tuning (do NOT silently accept).

- [ ] **Step 3: Final commit / branch ready for review**

```bash
git add -A && git commit -m "chore(scoring): re-score verification pass"
```

---

## Self-Review

- **Spec coverage:** A-ladders (T1), C-ladders+mapping (T2), FVL floor (T3), penalty/bonus tables (T4), engine integration (T5), test migration (T6), regression anchors (T7), full verification (T8). Decisions 1–3 are flagged inline at their tasks. ✔
- **Type consistency:** `nutrientBase(NutrientInput)` signature is identical in T2 definition and T5 call site; `SCORING_PENALTY` keys are real rule IDs from `registry.ts`; `bandToVerdict` thresholds unchanged (70/40). ✔
- **No placeholders:** every code step has concrete code; "full table from spec" in T4 refers to the complete `SCORING_PENALTY` literal printed in the spec section above. ✔
- **Known behavior changes (must be accepted by reviewer):** egg 100→~90 (DECISION 1, +17 nudge); data-completeness caps (80/90) removed; photo cap (75) removed; confidence cap re-added as a one-liner (DECISION 3). All other junk/whole-food invariants preserved.
```
