# Scoring Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add evidence-based dimensions (energy density, trans fat, total fat), a positive-offset system, a capped `snack` category, and emulsifier additives to the BiteLens verdict engine — keeping every point transparent.

**Architecture:** Enrich the existing rules engine in `src/lib/rules/`. Negatives subtract from a base of 100; new positives add a capped bonus back, gated so ultra-processed products can't be rescued. All nutrient harms are per-100g (null-skip, whole-food exempt), matching the salt/fat fix already merged on this branch.

**Tech Stack:** TypeScript, Vitest, Next.js 16, Drizzle (Neon). Tests run with `npx vitest run <path>`.

**Spec:** `docs/superpowers/specs/2026-06-04-scoring-enrichment-design.md`

---

## File Structure

- `src/types/product.ts` — extend `Nutrition` (transFat, per100 fields, fvlPercent).
- `src/lib/rules/signals.ts` — derive new per-100g signals + fvlPercent.
- `src/lib/rules/registry.ts` — new negative rules, `category_snack`, offset eligibility, positive offsets with `bonus`.
- `src/lib/rules/score.ts` — `snack` cap; `MAX_OFFSET` constant.
- `src/lib/rules/engine.ts` — accumulate + cap positive bonus, apply after penalties.
- `src/lib/rules/explanations.ts` — summary phrases/priority for new rules.
- `src/lib/additives/registry.ts` — E433, E466, E407.
- `src/lib/off/normalize.ts` — populate per100 fields, transFat, fvlPercent from OFF.
- `src/lib/ai/vision.ts` + `src/lib/ai/vision-shape.ts` — model transFat + fvlPercent.
- Tests alongside each (`*.test.ts`).

---

## Task 1: Extend the Nutrition data model

**Files:**
- Modify: `src/types/product.ts` (the `Nutrition` interface)

- [ ] **Step 1: Edit the Nutrition interface**

Replace the existing `per100?` line and add `transFat`/`fvlPercent`. The final interface:

```typescript
export interface Nutrition {
  serving: string;
  servingGrams?: number;
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  satFat: number;
  fiber: number;
  sodium: number;
  /** Industrial trans fat, grams per serving (OFF: trans-fat; photo: model estimate). */
  transFat?: number;
  /** Fruit/veg/legume/nut share of the product, 0–100. OFF estimate or model estimate. */
  fvlPercent?: number;
  /**
   * Authoritative per-100g/100ml density for concentration-based harms +
   * positive offsets. Populated from OFF `_100g` on barcode; derived from
   * `servingGrams` in the signal layer otherwise. All fields optional-by-absence.
   */
  per100?: {
    sodium?: number;
    satFat?: number;
    transFat?: number;
    fat?: number;
    kcal?: number;
    fiber?: number;
    protein?: number;
  };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No new errors from `product.ts` (existing pre-existing React-hook lint errors are unrelated). Some `*.test.ts` files may now need `servingGrams`-style fields — those are handled in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/types/product.ts
git commit -m "feat(types): add transFat, fvlPercent, extended per100 to Nutrition"
```

---

## Task 2: Derive the new per-100g signals

**Files:**
- Modify: `src/lib/rules/signals.ts`
- Test: `src/lib/rules/signals.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/rules/signals.test.ts` inside the `describe('extractSignals', …)` block:

```typescript
  it('derives energy/total-fat/fibre/protein per 100g and passes fvlPercent through', () => {
    const stew = {
      id: 'x', type: 'barcode' as const, brand: 'Hearth', name: 'Lentil Stew',
      subtitle: '400g', swatch: '#000', glyph: 'L',
      ingredients: ['Lentils', 'Tomato', 'Onion'], allergens: [], additives: [],
      nutrition: {
        serving: '200g', servingGrams: 200, kcal: 180, protein: 12, carbs: 22,
        sugar: 3, fat: 4, satFat: 0.6, fiber: 8, sodium: 240, fvlPercent: 75,
      },
      nutriScore: 'A' as const, ecoScore: null, novaGroup: 3 as const, category: 'meal' as const,
    };
    const s = extractSignals(stew);
    expect(s.energyPer100g).toBe(90);       // 180 / 200 * 100
    expect(s.totalFatPer100g).toBe(2);      // 4 / 200 * 100
    expect(s.fiberPer100g).toBe(4);         // 8 / 200 * 100
    expect(s.proteinPer100g).toBe(6);       // 12 / 200 * 100
    expect(s.fvlPercent).toBe(75);
    expect(s.transFatPer100g).toBeNull();   // no trans-fat data
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/signals.test.ts`
Expected: FAIL — `s.energyPer100g` is `undefined`.

- [ ] **Step 3: Add the fields to the SignalSet interface**

In `src/lib/rules/signals.ts`, in the `SignalSet` interface, just after the existing `satFatPer100g: number | null;` line, add:

```typescript
  energyPer100g: number | null;
  totalFatPer100g: number | null;
  transFatPer100g: number | null;
  fiberPer100g: number | null;
  proteinPer100g: number | null;
  fvlPercent: number | null;   // 0–100 fruit/veg/legume/nut share
```

- [ ] **Step 4: Populate them in extractSignals**

In `extractSignals`, in the returned object just after the existing `satFatPer100g: per100(...)` line, add:

```typescript
    energyPer100g: per100(p.nutrition.kcal, p.nutrition.per100?.kcal, grams),
    totalFatPer100g: per100(p.nutrition.fat, p.nutrition.per100?.fat, grams),
    transFatPer100g: per100(p.nutrition.transFat ?? 0, p.nutrition.per100?.transFat,
      p.nutrition.transFat == null && p.nutrition.per100?.transFat == null ? null : grams),
    fiberPer100g: per100(p.nutrition.fiber, p.nutrition.per100?.fiber, grams),
    proteinPer100g: per100(p.nutrition.protein, p.nutrition.per100?.protein, grams),
    fvlPercent: typeof p.nutrition.fvlPercent === 'number' ? p.nutrition.fvlPercent : null,
```

Note: `transFatPer100g` must stay `null` when there is no trans-fat data at all (so the rule skips) — the third arg forces `null` grams in that case, and `per100` returns `null` when grams is null and no explicit value.

- [ ] **Step 5: Run to verify it passes**

Run: `npx vitest run src/lib/rules/signals.test.ts`
Expected: PASS (all signals tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/rules/signals.ts src/lib/rules/signals.test.ts
git commit -m "feat(signals): derive energy/fat/fibre/protein per-100g + fvlPercent"
```

---

## Task 3: Energy-density negative rules

**Files:**
- Modify: `src/lib/rules/registry.ts`
- Test: `src/lib/rules/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('evaluate', …)` block in `src/lib/rules/engine.test.ts`:

```typescript
  it('penalises calorie-dense formulated food and exempts energy-dense whole foods', () => {
    const biscuit: Product = {
      id: 'p_biscuit', type: 'barcode', brand: 'Snap', name: 'Choc Biscuits',
      subtitle: '40g', swatch: '#000', glyph: 'B',
      ingredients: ['Wheat flour', 'Sugar', 'Palm oil'], allergens: ['gluten'], additives: [],
      nutrition: { serving: '40g', servingGrams: 40, kcal: 200, protein: 2, carbs: 28, sugar: 12, fat: 9, satFat: 4, fiber: 1, sodium: 100 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'baked_good',
    };
    // 200 / 40 * 100 = 500 kcal/100g → energy_high
    expect(evaluate(biscuit, DEFAULT_PROFILE).triggeredRuleIds).toContain('energy_high');

    const almonds: Product = {
      id: 'p_almonds', type: 'barcode', brand: 'Raw', name: 'Almonds',
      subtitle: '30g', swatch: '#000', glyph: 'A',
      ingredients: ['Almonds'], allergens: ['nuts'], additives: [],
      nutrition: { serving: '30g', servingGrams: 30, kcal: 174, protein: 6, carbs: 6, sugar: 1, fat: 15, satFat: 1, fiber: 4, sodium: 0 },
      nutriScore: 'A', ecoScore: null, novaGroup: 1, category: 'whole_food',
    };
    // 580 kcal/100g but whole_food → exempt
    expect(evaluate(almonds, DEFAULT_PROFILE).triggeredRuleIds).not.toContain('energy_high');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: FAIL — `energy_high` not in triggered ids.

- [ ] **Step 3: Add the rules**

In `src/lib/rules/registry.ts`, immediately after the `satfat_moderate` rule object (before the "Refined sugar / UPF ingredient flags" comment), insert:

```typescript
  // ── Energy density (per 100g — Nutri-Score/FSA basis) ──────────
  // Calorie-dense formulated foods (chocolate, biscuits, crisps) carry risk
  // independent of any single nutrient. Whole foods (nuts, avocado, oily fish,
  // olive oil) are energy-dense but protective — exempt them. Skip when null.
  {
    id: 'energy_high',
    severity: 'high',
    when: s => s.category !== 'whole_food' && s.energyPer100g != null && s.energyPer100g >= 550,
    build: s => ({
      reason: { kind: 'neg', text: `Calorie-dense — ${s.energyPer100g} kcal per 100g` },
      flag:   { tone: 'avoid', label: 'Calorie-dense', detail: `${s.energyPer100g}kcal/100g` },
    }),
  },
  {
    id: 'energy_moderate',
    severity: 'moderate',
    when: s => s.category !== 'whole_food' && s.energyPer100g != null && s.energyPer100g >= 450 && s.energyPer100g < 550,
    build: s => ({
      reason: { kind: 'neg', text: `Calorie-dense — ${s.energyPer100g} kcal per 100g` },
    }),
  },
  {
    id: 'energy_mild',
    severity: 'low',
    when: s => s.category !== 'whole_food' && s.energyPer100g != null && s.energyPer100g >= 350 && s.energyPer100g < 450,
    build: s => ({
      reason: { kind: 'neg', text: `Fairly calorie-dense — ${s.energyPer100g} kcal per 100g` },
    }),
  },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS for the new test. (Other tests may shift; if any unrelated existing test fails, note it — it is reconciled in Task 12. The biscuit/almonds test itself must pass.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/registry.ts src/lib/rules/engine.test.ts
git commit -m "feat(scoring): per-100g energy-density penalty, whole-food exempt"
```

---

## Task 4: Trans-fat negative rules

**Files:**
- Modify: `src/lib/rules/registry.ts`
- Test: `src/lib/rules/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('evaluate', …)`:

```typescript
  it('flags industrial trans fat as a severe harm', () => {
    const margarine: Product = {
      id: 'p_phos', type: 'barcode', brand: 'OldSpread', name: 'Baking Spread',
      subtitle: '250g', swatch: '#000', glyph: 'S',
      ingredients: ['Partially hydrogenated vegetable oil', 'Water', 'Salt'],
      allergens: [], additives: [],
      nutrition: { serving: '10g', servingGrams: 10, kcal: 72, protein: 0, carbs: 0, sugar: 0, fat: 8, satFat: 2, fiber: 0, sodium: 80 },
      nutriScore: 'E', ecoScore: null, novaGroup: 4, category: null,
    };
    const r = evaluate(margarine, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('trans_fat_ingredient');
    expect(r.verdict).toBe('avoid');

    const product: Product = {
      ...margarine, id: 'p_tf', ingredients: ['Vegetable oil'],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 500, protein: 1, carbs: 2, sugar: 1, fat: 50, satFat: 10, fiber: 0, sodium: 80, transFat: 1.5 },
    };
    expect(evaluate(product, DEFAULT_PROFILE).triggeredRuleIds).toContain('trans_fat_high');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: FAIL — `trans_fat_ingredient` not present.

- [ ] **Step 3: Add the rules + ingredient patterns**

In `src/lib/rules/registry.ts`, immediately after the energy rules from Task 3, insert:

```typescript
  // ── Trans fat (the single most harmful fat — WHO ban target) ───
  {
    id: 'trans_fat_ingredient',
    severity: 'severe',
    when: s => containsAny(s.ingredientsLower, TRANS_FAT_PATTERNS),
    build: () => ({
      reason: { kind: 'neg', text: 'Contains partially hydrogenated oil — industrial trans fat' },
      flag:   { tone: 'avoid', label: 'Trans fat', detail: 'Hydrogenated oil' },
    }),
  },
  {
    id: 'trans_fat_high',
    severity: 'severe',
    when: s => s.transFatPer100g != null && s.transFatPer100g >= 1,
    build: s => ({
      reason: { kind: 'neg', text: `High industrial trans fat — ${s.transFatPer100g}g per 100g` },
      flag:   { tone: 'avoid', label: 'Trans fat', detail: `${s.transFatPer100g}g/100g` },
    }),
  },
  {
    id: 'trans_fat_present',
    severity: 'high',
    when: s => s.transFatPer100g != null && s.transFatPer100g >= 0.2 && s.transFatPer100g < 1,
    build: s => ({
      reason: { kind: 'neg', text: `Trans fat present — ${s.transFatPer100g}g per 100g` },
    }),
  },
```

Then add the pattern list near the other pattern constants at the bottom of the file (after `UPF_INGREDIENT_PATTERNS`):

```typescript
// Industrial trans fat markers. WHO best practice is a total ban on PHOs.
const TRANS_FAT_PATTERNS = [
  'partially hydrogenated', 'partly hydrogenated',
  'hydrogenated vegetable oil', 'hydrogenated palm', 'hydrogenated soybean',
  'huile partiellement hydrogénée', 'aceite parcialmente hidrogenado',
  'teilweise gehärtet', 'teilgehärtet',
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS for the new test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/registry.ts src/lib/rules/engine.test.ts
git commit -m "feat(scoring): trans-fat penalty (ingredient + per-100g)"
```

---

## Task 5: Total-fat negative rules (FSA)

**Files:**
- Modify: `src/lib/rules/registry.ts`
- Test: `src/lib/rules/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('evaluate', …)`:

```typescript
  it('applies FSA total-fat penalty per 100g, whole-food exempt', () => {
    const sauce: Product = {
      id: 'p_sauce', type: 'barcode', brand: 'Rich', name: 'Cheese Sauce',
      subtitle: '100g', swatch: '#000', glyph: 'S',
      ingredients: ['Cream', 'Cheese', 'Starch'], allergens: ['dairy'], additives: [],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 300, protein: 5, carbs: 6, sugar: 2, fat: 28, satFat: 4, fiber: 0, sodium: 300 },
      nutriScore: 'D', ecoScore: null, novaGroup: 3, category: null,
    };
    // 28g fat/100g → FSA red → total_fat_high
    expect(evaluate(sauce, DEFAULT_PROFILE).triggeredRuleIds).toContain('total_fat_high');

    const avocado: Product = {
      id: 'p_avo', type: 'barcode', brand: 'Fresh', name: 'Avocado',
      subtitle: '1 each', swatch: '#000', glyph: 'A',
      ingredients: ['Avocado'], allergens: [], additives: [],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 160, protein: 2, carbs: 9, sugar: 1, fat: 15, satFat: 2, fiber: 7, sodium: 7 },
      nutriScore: 'A', ecoScore: null, novaGroup: 1, category: 'whole_food',
    };
    expect(evaluate(avocado, DEFAULT_PROFILE).triggeredRuleIds).not.toContain('total_fat_high');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: FAIL — `total_fat_high` not present.

- [ ] **Step 3: Add the rules**

In `src/lib/rules/registry.ts`, immediately after the trans-fat rules, insert:

```typescript
  // ── Total fat (FSA traffic-light basis, per 100g) ──────────────
  // Modest so it doesn't double-crush with sat-fat/energy. FSA red >17.5g/100g.
  {
    id: 'total_fat_high',
    severity: 'moderate',
    when: s => s.category !== 'whole_food' && s.totalFatPer100g != null && s.totalFatPer100g >= 17.5,
    build: s => ({
      reason: { kind: 'neg', text: `High total fat — ${s.totalFatPer100g}g per 100g` },
      flag:   { tone: 'caution', label: 'High fat', detail: `${s.totalFatPer100g}g/100g` },
    }),
  },
  {
    id: 'total_fat_moderate',
    severity: 'low',
    when: s => s.category !== 'whole_food' && s.totalFatPer100g != null && s.totalFatPer100g >= 8 && s.totalFatPer100g < 17.5,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate total fat — ${s.totalFatPer100g}g per 100g` },
    }),
  },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS for the new test.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/registry.ts src/lib/rules/engine.test.ts
git commit -m "feat(scoring): FSA total-fat penalty per-100g, whole-food exempt"
```

---

## Task 6: `snack` as a capped processed category

**Files:**
- Modify: `src/lib/rules/registry.ts`, `src/lib/rules/score.ts`
- Test: `src/lib/rules/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('evaluate', …)`:

```typescript
  it('treats snack as a capped processed category with no green low-sugar flag', () => {
    const crackers: Product = {
      id: 'p_crackers', type: 'barcode', brand: 'Crackly', name: 'Cream Crackers',
      subtitle: '25g', swatch: '#000', glyph: 'C',
      ingredients: ['Wheat flour', 'Vegetable oil', 'Salt'], allergens: ['gluten'], additives: [],
      nutrition: { serving: '25g', servingGrams: 25, kcal: 110, protein: 2, carbs: 18, sugar: 1, fat: 3, satFat: 1, fiber: 1, sodium: 120 },
      nutriScore: 'C', ecoScore: null, novaGroup: 4, category: 'snack',
    };
    const r = evaluate(crackers, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('category_snack');
    expect(r.triggeredRuleIds).not.toContain('pos_low_sugar');
    expect(r.score).toBeLessThanOrEqual(55);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: FAIL — `category_snack` not present.

- [ ] **Step 3: Add the category_snack rule**

In `src/lib/rules/registry.ts`, immediately after the `category_processed_meat` rule object, insert:

```typescript
  {
    id: 'category_snack',
    severity: 'moderate',
    when: s => s.category === 'snack',
    build: () => ({
      reason: { kind: 'neg', text: 'Packaged savoury snack — ultra-processed, salt/fat dense' },
      flag:   { tone: 'caution', label: 'Packaged snack' },
    }),
  },
```

- [ ] **Step 4: Exclude snack from pos_low_sugar**

In `src/lib/rules/registry.ts`, change the `pos_low_sugar` rule's `when` from:

```typescript
    when: s => s.sugarPerServing < 5 && s.kcalPerServing > 0 && !(s.category && UPF_CATEGORIES.includes(s.category)),
```

to:

```typescript
    when: s => s.sugarPerServing < 5 && s.kcalPerServing > 0 && s.category !== 'snack' && !(s.category && UPF_CATEGORIES.includes(s.category)),
```

- [ ] **Step 5: Add the snack cap in score.ts**

In `src/lib/rules/score.ts`, in `maxScoreCap`, inside the `if (p.type === 'photo')` block change the beverage/snack branch:

```typescript
    else if (s.category === 'beverage') cap = 65;
    else if (s.category === 'snack') cap = 55;
```

And in the barcode path (after the `if (p.type === 'photo') { … }` block), add a snack cap before the missing-data checks:

```typescript
  if (s.category === 'snack') return 55;
  const missingNutri = s.nutriScore == null;
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS for the new test.

- [ ] **Step 7: Commit**

```bash
git add src/lib/rules/registry.ts src/lib/rules/score.ts src/lib/rules/engine.test.ts
git commit -m "feat(scoring): snack as capped processed category (55), no low-sugar flag"
```

---

## Task 7: Positive-offset system (engine bonus + offset rules)

**Files:**
- Modify: `src/lib/rules/registry.ts` (Rule/RuleHit, offset eligibility, convert pos_high_fiber/pos_high_protein, add pos_fvl_content), `src/lib/rules/score.ts` (MAX_OFFSET), `src/lib/rules/engine.ts` (accumulate + apply)
- Test: `src/lib/rules/engine.test.ts`

- [ ] **Step 1: Write the failing tests**

Append inside `describe('evaluate', …)`:

```typescript
  it('lets positives offset penalties for minimally-processed food', () => {
    const stew: Product = {
      id: 'p_stew', type: 'barcode', brand: 'Hearth', name: 'Lentil Stew',
      subtitle: '400g', swatch: '#000', glyph: 'L',
      ingredients: ['Lentils', 'Tomato', 'Onion', 'Olive oil'], allergens: [], additives: [],
      nutrition: { serving: '200g', servingGrams: 200, kcal: 180, protein: 12, carbs: 22, sugar: 3, fat: 4, satFat: 0.6, fiber: 8, sodium: 360, fvlPercent: 75 },
      nutriScore: 'A', ecoScore: null, novaGroup: 3, category: 'meal',
    };
    const r = evaluate(stew, DEFAULT_PROFILE);
    // fibre(8/100g→+8) + protein(6/100g→+4) + fvl(75%→+6) offset the sodium/processing dings.
    expect(r.triggeredRuleIds).toContain('pos_high_fiber');
    expect(r.triggeredRuleIds).toContain('pos_fvl_content');
    expect(r.verdict).toBe('good');
  });

  it('does NOT let positives rescue an ultra-processed product', () => {
    const bar: Product = {
      id: 'p_fortbar', type: 'barcode', brand: 'GymCo', name: 'Fortified Candy Bar',
      subtitle: '60g', swatch: '#000', glyph: 'B',
      ingredients: ['Glucose syrup', 'Sugar', 'Soy protein isolate', 'Inulin'], allergens: ['soy'], additives: [],
      nutrition: { serving: '60g', servingGrams: 60, kcal: 300, protein: 20, carbs: 40, sugar: 30, fat: 8, satFat: 4, fiber: 9, sodium: 200, fvlPercent: 0 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'candy',
    };
    const r = evaluate(bar, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).not.toContain('pos_high_protein');
    expect(r.triggeredRuleIds).not.toContain('pos_high_fiber');
    expect(r.verdict).toBe('avoid');
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: FAIL — `pos_fvl_content` not present / verdict wrong.

- [ ] **Step 3: Add `bonus` to RuleHit**

In `src/lib/rules/registry.ts`, extend the `RuleHit` interface:

```typescript
export interface RuleHit {
  reason?: Reason;
  flag?: Flag;
  bonus?: number;   // positive offset points (only meaningful on severity 'pos')
}
```

- [ ] **Step 4: Add the offset-eligibility helper**

In `src/lib/rules/registry.ts`, just before `export const RULES: Rule[] = [`, add:

```typescript
// Positive offsets must never rescue ultra-processed food. Eligible only when
// the product is NOT a UPF category, NOT a packaged snack, and NOT NOVA 4.
function offsetEligible(s: SignalSet): boolean {
  if (s.category && UPF_CATEGORIES.includes(s.category)) return false;
  if (s.category === 'snack') return false;
  return s.novaGroup == null || s.novaGroup <= 3;
}
```

- [ ] **Step 5: Convert pos_high_protein and pos_high_fiber to per-100g + bonus, gated**

In `src/lib/rules/registry.ts`, replace the existing `pos_high_protein` and `pos_high_fiber` rule objects with:

```typescript
  {
    id: 'pos_high_protein',
    severity: 'pos',
    when: s => offsetEligible(s) && s.proteinPer100g != null && s.proteinPer100g >= 8,
    build: s => ({
      reason: { kind: 'pos', text: `Good protein (${s.proteinPer100g}g/100g)` },
      bonus: s.proteinPer100g != null && s.proteinPer100g >= 16 ? 8 : 4,
    }),
  },
  {
    id: 'pos_high_fiber',
    severity: 'pos',
    when: s => offsetEligible(s) && s.fiberPer100g != null && s.fiberPer100g >= 3,
    build: s => ({
      reason: { kind: 'pos', text: `Good fibre (${s.fiberPer100g}g/100g)` },
      bonus: s.fiberPer100g != null && s.fiberPer100g >= 6 ? 8 : 4,
    }),
  },
```

- [ ] **Step 6: Add pos_fvl_content**

In `src/lib/rules/registry.ts`, immediately after the `pos_high_fiber` rule, add:

```typescript
  {
    id: 'pos_fvl_content',
    severity: 'pos',
    when: s => offsetEligible(s) && s.fvlPercent != null && s.fvlPercent >= 40,
    build: s => ({
      reason: { kind: 'pos', text: `${Math.round(s.fvlPercent!)}% fruit/veg/legume/nut` },
      flag:   { tone: 'good', label: 'Plant-rich' },
      bonus: s.fvlPercent! >= 80 ? 10 : s.fvlPercent! >= 60 ? 6 : 3,
    }),
  },
```

- [ ] **Step 7: Add MAX_OFFSET to score.ts**

In `src/lib/rules/score.ts`, after the `SEVERITY_POINTS` constant, add:

```typescript
// Total positive offset is capped so good nutrients soften a verdict without
// erasing real harms. Tuned against Nutri-Score's max positive (17 pts) scaled
// to our 100-point space.
export const MAX_OFFSET = 25;
```

- [ ] **Step 8: Apply the bonus in engine.ts**

In `src/lib/rules/engine.ts`, import `MAX_OFFSET`:

```typescript
import { SEVERITY_POINTS, bandToVerdict, maxScoreCap, MAX_OFFSET } from './score';
```

Add a `bonus` accumulator and apply it. Change the loop body and clamp:

```typescript
  let score = 100;
  let bonus = 0;
  const triggeredRuleIds: string[] = [];
  // … inside the for loop, after computing hit:
    const hit = rule.build(signals, product);
    if (hit.reason) (hit.reason.kind === 'pos' ? posReasons : negReasons).push(hit.reason);
    if (hit.flag) flags.push(hit.flag);
    if (rule.severity === 'pos' && hit.bonus) bonus += hit.bonus;
  }

  const cap = maxScoreCap(signals, product);
  score = Math.max(0, Math.min(cap, score + Math.min(bonus, MAX_OFFSET)));
```

(The `score -= SEVERITY_POINTS[...]` line for non-pos rules stays unchanged.)

- [ ] **Step 9: Run to verify it passes**

Run: `npx vitest run src/lib/rules/engine.test.ts`
Expected: PASS for the two new tests.

- [ ] **Step 10: Fix the apple+banana fixture test (basis change)**

The existing test "apple+banana whole_food photo lands in the Good band" asserts `pos_high_fiber`, which now needs a per-100g basis. Add `servingGrams` to its fixture so fibre derives. Change that fixture's `nutrition` line to:

```typescript
      nutrition: { serving: 'Estimated serving', servingGrams: 230, kcal: 200, protein: 2, carbs: 52, sugar: 33, fat: 0.6, satFat: 0.2, fiber: 7, sodium: 2 },
```

(7g / 230g × 100 = 3.04 g/100g ≥ 3 → `pos_high_fiber` fires; whole_food is offset-eligible.)

- [ ] **Step 11: Run the full rules suite**

Run: `npx vitest run src/lib/rules`
Expected: PASS. If any other fixture test shifted band due to offsets, reconcile in Task 12; the two offset tests + apple/banana test must pass here.

- [ ] **Step 12: Commit**

```bash
git add src/lib/rules/registry.ts src/lib/rules/score.ts src/lib/rules/engine.ts src/lib/rules/engine.test.ts
git commit -m "feat(scoring): positive-offset system (fibre/protein/FVL), gated from UPF"
```

---

## Task 8: Summary phrases for the new rules

**Files:**
- Modify: `src/lib/rules/explanations.ts`
- Test: `src/lib/rules/explanations.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('summary text', …)` in `src/lib/rules/explanations.test.ts`:

```typescript
  it('names trans fat as the dominant concern when present', () => {
    const spread = baseBarcode({
      name: 'Old Spread',
      ingredients: ['Partially hydrogenated vegetable oil', 'Water'],
      nutrition: { serving: '10g', servingGrams: 10, kcal: 72, protein: 0, carbs: 0, sugar: 0, fat: 8, satFat: 2, fiber: 0, sodium: 80 },
      novaGroup: 4,
    });
    const r = evaluate(spread, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/trans fat/i);
  });
```

Note: confirm `baseBarcode` accepts an `ingredients` override; if it does not, add `ingredients` to its defaults in the test helper at the top of the file.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/rules/explanations.test.ts`
Expected: FAIL — summary does not mention trans fat.

- [ ] **Step 3: Add phrases and priority entries**

In `src/lib/rules/explanations.ts`:

(a) Add to `NEG_PHRASE`:

```typescript
  trans_fat_ingredient:           'industrial trans fat',
  trans_fat_high:                 'high trans fat',
  trans_fat_present:              'trans fat present',
  energy_high:                    'very calorie-dense',
  energy_moderate:                'calorie-dense',
  category_snack:                 'ultra-processed packaged snack',
  total_fat_high:                 'high total fat',
```

(b) Add to `POS_PHRASE`:

```typescript
  pos_fvl_content: 'plant-rich (fruit/veg/legume/nut)',
```

(c) Add a dedicated trans-fat branch in `buildSummary`, right after the `additive_high_risk` branch:

```typescript
  if (triggered.includes('trans_fat_ingredient') || triggered.includes('trans_fat_high')) {
    return 'Contains industrial trans fat — the most harmful fat for the heart.';
  }
```

(d) Insert the new negative ids into `NEG_PRIORITY` at sensible ranks: put `'trans_fat_ingredient'` and `'trans_fat_high'` right after `'additive_high_risk'`; put `'category_snack'` just after `'category_dessert'`; put `'energy_high'` just after `'satfat_high'`; put `'total_fat_high'` just after `'sodium_moderate'`; put `'energy_moderate'` and `'trans_fat_present'` near `'additive_moderate_risk'`. Add `'pos_fvl_content'` to `POS_PRIORITY` just after `'pos_whole_food'`.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/rules/explanations.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/rules/explanations.ts src/lib/rules/explanations.test.ts
git commit -m "feat(scoring): summary names trans fat, energy, snack, total fat"
```

---

## Task 9: Emulsifier additives in the registry

**Files:**
- Modify: `src/lib/additives/registry.ts`
- Test: `src/lib/additives/registry.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

If `src/lib/additives/registry.test.ts` does not exist, create it:

```typescript
import { describe, it, expect } from 'vitest';
import { lookupAdditive } from './registry';

describe('emulsifier additives', () => {
  it('rates gut-microbiome emulsifiers as moderate risk', () => {
    expect(lookupAdditive('E433')?.risk).toBe('moderate');
    expect(lookupAdditive('E466')?.risk).toBe('moderate');
    expect(lookupAdditive('E407')?.risk).toBe('moderate');
  });
});
```

(If the file exists, append the `describe` block. Confirm `lookupAdditive` is the exported lookup — it is used in `normalize.ts` and `loader.ts`.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/additives/registry.test.ts`
Expected: FAIL — `lookupAdditive('E433')` is undefined.

- [ ] **Step 3: Add the additives**

In `src/lib/additives/registry.ts`, add to `RAW_REGISTRY` (near the emulsifiers section):

```typescript
  E433: { name: 'Polysorbate 80', risk: 'moderate', detail: 'Synthetic emulsifier. Animal and in-vitro human-microbiota studies link it to gut inflammation and altered microbiota.' },
  E466: { name: 'Carboxymethylcellulose (CMC)', risk: 'moderate', detail: 'Synthetic emulsifier. Linked in studies to reduced microbial diversity and low-grade gut inflammation.' },
  E407: { name: 'Carrageenan', risk: 'moderate', detail: 'Seaweed-derived thickener/emulsifier. Degraded forms show intestinal-inflammation signals; flagged by clean-label apps.' },
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/lib/additives/registry.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/additives/registry.ts src/lib/additives/registry.test.ts
git commit -m "feat(additives): add P80/CMC/carrageenan emulsifiers as moderate risk"
```

---

## Task 10: Wire OFF per-100g + fvlPercent + transFat (barcode)

**Files:**
- Modify: `src/lib/off/normalize.ts`
- Test: `src/lib/off/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/lib/off/normalize.test.ts` (match the existing test style — find how `normalizeOFF` is called and reuse the helper/raw shape):

```typescript
  it('captures per-100g energy/fat/fibre/protein, transFat, and FVL%', () => {
    const raw = {
      status: 1,
      product: {
        code: '111', product_name: 'Veg Soup', brands: 'X', quantity: '300g',
        categories_tags: ['en:soups'], serving_size: '250 g',
        nutriments: {
          'energy-kcal_100g': 60, fat_100g: 2, 'saturated-fat_100g': 0.5,
          'trans-fat_100g': 0, fiber_100g: 3, proteins_100g: 4, sodium_100g: 0.3,
          'fruits-vegetables-legumes-estimate-from-ingredients_100g': 70,
        },
      },
    };
    const p = normalizeOFF(raw as any, '111')!;
    expect(p.nutrition.per100?.kcal).toBe(60);
    expect(p.nutrition.per100?.fiber).toBe(3);
    expect(p.nutrition.per100?.protein).toBe(4);
    expect(p.nutrition.fvlPercent).toBe(70);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/off/normalize.test.ts`
Expected: FAIL — `per100.kcal` undefined.

- [ ] **Step 3: Extend the OFFRaw nutriments type**

In `src/lib/off/normalize.ts`, in the `OFFRaw` interface `nutriments` block, add:

```typescript
      'trans-fat_serving'?: number; 'trans-fat_100g'?: number;
      'fruits-vegetables-legumes-estimate-from-ingredients_100g'?: number;
      'fruits-vegetables-nuts-estimate-from-ingredients_100g'?: number;
```

- [ ] **Step 4: Replace pickPer100 and add FVL/transFat extraction**

Replace the `pickPer100` function body so it captures all per-100g fields:

```typescript
function pickPer100(n: NonNullable<OFFRaw['product']>['nutriments']): NonNullable<Product['nutrition']['per100']> | undefined {
  if (!n) return undefined;
  const g = (v: unknown, max: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round((v as number) * 10) / 10)) : undefined;
  const mg = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(20_000, Math.round((v as number) * 1000))) : undefined;
  const per100 = {
    sodium: mg(n.sodium_100g),
    satFat: g(n['saturated-fat_100g'], 500),
    transFat: g(n['trans-fat_100g'], 500),
    fat: g(n.fat_100g, 500),
    kcal: typeof n['energy-kcal_100g'] === 'number' && Number.isFinite(n['energy-kcal_100g'])
      ? Math.max(0, Math.min(2000, Math.round(n['energy-kcal_100g'] as number))) : undefined,
    fiber: g(n.fiber_100g, 500),
    protein: g(n.proteins_100g, 500),
  };
  return Object.values(per100).some(v => v !== undefined) ? per100 : undefined;
}

function pickFvlPercent(n: NonNullable<OFFRaw['product']>['nutriments']): number | undefined {
  const v = n?.['fruits-vegetables-legumes-estimate-from-ingredients_100g']
    ?? n?.['fruits-vegetables-nuts-estimate-from-ingredients_100g'];
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : undefined;
}
```

- [ ] **Step 5: Populate transFat + fvlPercent in the returned nutrition**

In `normalizeOFF`, in the returned `nutrition` object, after the `per100: pickPer100(n),` line add:

```typescript
      transFat: pickServing(n['trans-fat_serving'], n['trans-fat_100g'], 500),
```

And in the top-level returned `Product` object, after the `nutrition: { … }` block (as a sibling property), add:

```typescript
    fvlPercent: pickFvlPercent(n),
```

Wait — `fvlPercent` lives on `Nutrition`, not `Product`. Put it INSIDE the `nutrition` object instead:

```typescript
      fvlPercent: pickFvlPercent(n),
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run src/lib/off/normalize.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/off/normalize.ts src/lib/off/normalize.test.ts
git commit -m "feat(off): capture per-100g energy/fat/fibre/protein, transFat, FVL%"
```

---

## Task 11: Wire photo flow (transFat + fvlPercent)

**Files:**
- Modify: `src/lib/ai/vision-shape.ts`, `src/lib/ai/vision.ts`
- Test: `src/lib/ai/vision.test.ts`

- [ ] **Step 1: Write the failing test**

Append inside `describe('responseToProduct', …)` in `src/lib/ai/vision.test.ts`:

```typescript
  it('passes transFat and fvlPercent through from the model', () => {
    const p = responseToProduct({
      ...sample,
      nutrition: { ...sample.nutrition, transFat: 0.3 },
      fvlPercent: 65,
    } as any);
    expect(p.nutrition.transFat).toBe(0.3);
    expect(p.nutrition.fvlPercent).toBe(65);
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/lib/ai/vision.test.ts`
Expected: FAIL — `p.nutrition.transFat` undefined.

- [ ] **Step 3: Extend AnalysisResponse**

In `src/lib/ai/vision-shape.ts`, add `transFat` to the `nutrition` block and `fvlPercent` to the top-level `AnalysisResponse`:

```typescript
  nutrition: {
    servingGrams: number;
    kcal: number;
    protein: number;
    carbs: number;
    sugar: number;
    fat: number;
    satFat: number;
    fiber: number;
    sodium: number;
    transFat: number;
  };
  fvlPercent: number;
```

- [ ] **Step 4: Sanitise + pass through in responseToProduct**

In `sanitizeNutrition`, add `transFat` to the returned object:

```typescript
    transFat: clampGrams(n.transFat),
```

In `responseToProduct`, in the built `nutrition` object add (after `sodium:`):

```typescript
      transFat: nutrition.transFat > 0 ? round(nutrition.transFat) : undefined,
      fvlPercent: typeof r.fvlPercent === 'number' && Number.isFinite(r.fvlPercent)
        ? Math.max(0, Math.min(100, Math.round(r.fvlPercent))) : undefined,
```

- [ ] **Step 5: Update the JSON schema + prompts in vision.ts**

In `src/lib/ai/vision.ts`, in `JSON_SCHEMA`:
- add `'transFat'` to the `nutrition.required` array and `transFat: { type: 'number' }` to `nutrition.properties`.
- add `'fvlPercent'` to the top-level `required` array and `fvlPercent: { type: 'number' }` to the top-level `properties`.

In the `SERVING WEIGHT` paragraph of `SYSTEM_PROMPT`, append:

```
TRANS FAT: estimate transFat grams per serving — almost always 0 for modern products; only non-zero if you see "partially hydrogenated" oils. FVL: estimate fvlPercent (0–100) — the share of the item that is whole fruit, vegetable, legume, or nut (0 for sweets/drinks/refined snacks).
```

In `USER_PROMPT`, change the nutrition bullet to include `transFat g` and add a line:

```
- fvlPercent: 0–100, share that is whole fruit/veg/legume/nut (0 if none)
```

- [ ] **Step 6: Update existing vision test fixtures**

Add `transFat: 0` to `sample.nutrition` and the two inline nutrition overrides (honey, clamp test), and `fvlPercent: 0` to the `sample` object, so the `AnalysisResponse` type is satisfied. Example for `sample`:

```typescript
    nutrition: {
      servingGrams: 350, kcal: 519.7, protein: 28.04, carbs: 47.6, sugar: 6.13,
      fat: 22.21, satFat: 4.05, fiber: 9.24, sodium: 480.4, transFat: 0,
    },
    fvlPercent: 0,
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run src/lib/ai/vision.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/ai/vision.ts src/lib/ai/vision-shape.ts src/lib/ai/vision.test.ts
git commit -m "feat(vision): model estimates transFat + fvlPercent for photo scoring"
```

---

## Task 12: Full-suite reconciliation + representative product sweep

**Files:**
- Modify: any fixture/test whose band legitimately shifted; `src/lib/off/__sweep.test.ts` (temporary)

- [ ] **Step 1: Run the full suite and tsc**

Run: `npx tsc --noEmit && npx vitest run`
Expected: List any failures. Pre-existing React-hook lint errors are out of scope.

- [ ] **Step 2: Reconcile legitimately-shifted fixture tests**

For each failing existing test, decide: is the new score *more correct* per the spec? If yes, update the expectation and note why in the commit. If a healthy whole-food/minimally-processed product dropped a band incorrectly, that's a tuning bug — adjust thresholds in `registry.ts`, don't just edit the test. Re-run `npx vitest run src/lib/rules` until green.

- [ ] **Step 3: Representative product sanity sweep**

Create `src/lib/off/__sweep.test.ts` to print scores for ~10 representative products through the real engine (reuse the `normalizeOFF` + `evaluate` pattern from the Task 10 test). Cover: crisps, cola, plain yogurt, lentil/bean dish, milk chocolate, whole-grain bread, salted nuts, fresh apple (barcode), cheese, breakfast cereal. Log `{name, score, verdict, top reasons}`.

```typescript
import { describe, it } from 'vitest';
import { normalizeOFF } from './normalize';
import { evaluate } from '@/lib/rules/engine';
import { DEFAULT_PROFILE } from '@/types/profile';
// Build ~10 minimal OFF raw payloads (per-100g nutriments) and print results.
// This is a manual sanity tool — delete before final commit.
```

Run: `npx vitest run src/lib/off/__sweep.test.ts`
Expected: Eyeball that junk (cola, chocolate, crisps, cereal) is Avoid/Caution and genuine whole/minimally-processed foods (yogurt, lentils, bread, apple, nuts) are Good/Caution. If anything is clearly wrong, fix thresholds and re-run.

- [ ] **Step 4: Delete the sweep file**

```bash
rm src/lib/off/__sweep.test.ts
```

- [ ] **Step 5: Final verification**

Run: `npx tsc --noEmit && npx vitest run && npx eslint src/lib src/types`
Expected: tsc clean; all tests pass; no new lint errors in touched lib/types files (pre-existing React-hook errors excepted).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test(scoring): reconcile fixtures after enrichment; verify representative products"
```

---

## Self-Review

**Spec coverage:**
- §4.1 energy density → Task 3 ✓
- §4.2 trans fat → Task 4 ✓
- §4.3 total fat → Task 5 ✓
- §4.4 snack category + cap → Task 6 ✓
- §5 positive-offset system (rules + engine + cap + gate) → Task 7 ✓
- §6 emulsifier additives → Task 9 ✓
- §7.1 Nutrition type → Task 1 ✓
- §7.2 signals → Task 2 ✓
- §7.3 barcode wiring → Task 10 ✓
- §7.4 photo wiring → Task 11 ✓
- §8 cap interactions → Tasks 6, 7 ✓
- §9 testing strategy → every task is TDD; Task 12 regression sweep ✓

**Type consistency:** `RuleHit.bonus` (Task 7) consumed in `engine.ts` (Task 7). `MAX_OFFSET` defined in `score.ts` (Task 7), imported in `engine.ts` (Task 7). Signal field names (`energyPer100g`, `totalFatPer100g`, `transFatPer100g`, `fiberPer100g`, `proteinPer100g`, `fvlPercent`) defined in Task 2 and used identically in Tasks 3–7. `per100` sub-fields (`kcal`, `fat`, `transFat`, `fiber`, `protein`, `sodium`, `satFat`) defined in Task 1, populated in Task 10, read in Task 2. `fvlPercent` lives on `Nutrition` (Task 1), populated in Tasks 10 & 11, read in Task 2.

**Placeholder scan:** No TBD/TODO; every code step has full code. The Task 12 sweep file is intentionally a stub (manual tool, deleted in Step 4).

**Note for executor:** Tasks 3–7 each add rules that change scores; some *existing* fixture tests may go red mid-plan. That is expected and reconciled in Task 12 — do not chase them inside each task beyond the test that task introduces.
