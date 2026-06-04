# BiteLens scoring enrichment — design spec

**Date:** 2026-06-04
**Status:** Approved for planning
**Author:** pairing session (RaduRS + Claude)

## 1. Purpose

Make the verdict engine reflect what nutrition science actually weights, so the
score is trustworthy across *every* product class — not just the crisps case
that exposed the gap. The recent fix moved salt + saturated fat onto a per-100g
basis. This spec adds the remaining evidence-based dimensions and, for the first
time, lets genuinely good nutrients **earn points back**.

This is an **enrichment of the existing transparent rules engine**, not a
rewrite. Every point added or subtracted must remain explainable in plain
language (PRD requirement: "transparent rules, not a mysterious black-box
score"). We keep the architecture: start at 100, apply +/− rules, clamp to a
data-completeness cap.

## 2. Evidence basis (research summary)

- **Nutri-Score 2023** (EU consensus): per-100g points. Negatives = energy,
  sugars, saturated fat, salt. Positives = protein, fibre, fruit/veg/legume/nut
  (FVL) %. Positives offset negatives. Drinks get a non-nutritive-sweetener
  penalty. → We are missing **energy density** and **positive offsets**.
- **NOVA / ultra-processing**: 2024 BMJ umbrella review — UPF intake RR ≈ **1.50**
  for CVD mortality, 1.12 for T2D. Processing belongs in the score on top of
  nutrients (already present; extend `snack`).
- **Industrial trans fat** (WHO): danger line **>2 g per 100 g of fat**; intake
  should be <1% energy; ~34% higher all-cause mortality. → We only catch it via
  a weak ingredient-string match today.
- **Energy density**: core axis in Nutri-Score / FSA / WHO, and named in our own
  PRD ("high calorie imbalance"). → Currently **absent**.
- **Emulsifiers** (2021–2024 microbiome studies): polysorbate 80 (E433),
  carboxymethylcellulose (E466), carrageenan (E407) promote gut inflammation. →
  Not in the additive registry; default to "low" today.

Sources: Nutri-Score 2023 technical reference (eclarion.com), Nutri-Score 2023
update (PubMed 38356074), UPF umbrella review (PMC10899807), WHO trans-fat fact
sheet, WHO Europe Nutrient Profile Model, dietary-emulsifier microbiome study
(PMC7986288), EFSA titanium-dioxide ban, Yuka methodology.

## 3. Non-goals

- No re-architecture around Nutri-Score/Yuka as a black box (rejected: violates
  PRD transparency).
- No change to the Good/Caution/Avoid band thresholds (70 / 40).
- No new UI surfaces. Existing reasons/flags/benefits rendering is reused.
- No micronutrient/glycemic-index modelling (data not reliably available).

## 4. New scoring dimensions

All new negative rules are **per-100g/100ml**, **skip when the input is null**
(no guessing — same discipline as the salt/fat fix), and **exempt `whole_food`**
(intrinsic energy/fat in nuts, avocado, oily fish is not the harm target).

### 4.1 Energy density (new negatives)
Targets calorie-dense formulated foods (chocolate, biscuits, crisps) without
penalising normal cooked meals (~120–180 kcal/100g). Tunable.
- `energy_high`     — severity `high`     — `energyPer100g >= 550`
- `energy_moderate` — severity `moderate` — `energyPer100g >= 450 && < 550`
- `energy_mild`     — severity `low`      — `energyPer100g >= 350 && < 450`

### 4.2 Trans fat (new negatives) — the highest-severity nutrient harm
- `trans_fat_ingredient` — severity `severe` — ingredients contain
  "partially hydrogenated" (WHO ban target). Fires regardless of declared values.
- `trans_fat_high` — severity `severe` — `transFatPer100g >= 1`
- `trans_fat_present` — severity `high` — `transFatPer100g >= 0.2 && < 1`
(Rarely fires on modern EU products by design; critical when it does.)

### 4.3 Total fat (new negatives) — FSA traffic-light basis
Modest so it doesn't double-crush with sat-fat/energy.
- `total_fat_high`     — severity `moderate` — `totalFatPer100g >= 17.5` (FSA red)
- `total_fat_moderate` — severity `low`      — `totalFatPer100g >= 8 && < 17.5`

### 4.4 `snack` as a capped processed category
- New rule `category_snack` — severity `moderate` — `category === 'snack'` —
  reason "Packaged savoury snack — ultra-processed, salt/fat dense".
- `maxScoreCap`: add `snack` → cap **55** (barcode and photo), so a packaged
  snack can never show a green "Low sugar" flag or reach the Good band.
- `pos_low_sugar` and other cosmetic positives gain a `snack` exclusion (already
  excluded for UPF categories).

## 5. Positive-offset system (the major change)

Today positives are display-only (`severity: 'pos'`, zero points). We give three
**nutrient** positives real point values that are **added back after penalties**,
so a high-fibre bean stew, plain yogurt, or lean fish bowl scores as well as it
deserves.

### 5.1 Offset rules (each carries a `bonus`)
- Fibre:   `+8` if `fiberPer100g >= 6`,   else `+4` if `>= 3`.
- Protein: `+8` if `proteinPer100g >= 16`, else `+4` if `>= 8`.
- FVL%:    `+10` if `fvlPercent >= 80`, `+6` if `>= 60`, `+3` if `>= 40`.

### 5.2 Aggregation & guards
- Sum the bonuses, **cap the total offset at +25**.
- **Gate (anti-junk):** offsets apply only when the product is NOT ultra-
  processed — `novaGroup <= 3 || novaGroup == null` AND `category` not in the UPF
  list AND `category !== 'snack'`. Ultra-processed products get **zero** offset:
  a fortified candy bar cannot buy its way up.
- Apply after penalties: `score = clamp(0, min(cap, 100), 100 − penalties + offset)`.
  The existing `maxScoreCap` still bounds everything, so offsets never lift a
  capped UPF product past its ceiling (belt and braces with the gate).
- The offset rules still emit their existing positive `reason` text for the
  "Why" list; only the point value is new.

### 5.3 Engine change
Extend `RuleHit`/the positive path so a rule may return `bonus?: number`. The
engine accumulates negatives and positive bonuses separately, caps the bonus
total, then combines. Keeps the loop simple and order-independent.

## 6. Additive registry additions

Add to `src/lib/additives/registry.ts` (risk `moderate`, sourced detail):
- `E433` Polysorbate 80 — emulsifier; gut-microbiome inflammation evidence
  (animal + in-vitro human-microbiota studies).
- `E466` Carboxymethylcellulose (CMC) — emulsifier; same evidence base.
- `E407` Carrageenan — emulsifier/thickener; intestinal-inflammation signal.

No change to scoring logic needed — `additiveMaxRisk`/count rules already consume
the registry.

## 7. Data model & flow wiring

### 7.1 `Nutrition` type (`src/types/product.ts`)
- Add `transFat?: number` (per serving, grams).
- Extend `per100?` to `{ sodium, satFat, transFat, fat, kcal, fiber, protein }`
  (all optional-by-absence; existing two stay).
- Add `fvlPercent?: number` (0–100): fruit/veg/legume/nut share.

### 7.2 Signals (`src/lib/rules/signals.ts`)
New fields, each via the existing `per100()` resolver (explicit per100 → derive
from servingGrams → null):
`energyPer100g`, `transFatPer100g`, `totalFatPer100g`, `fiberPer100g`,
`proteinPer100g`, and `fvlPercent` (passthrough, default null).

### 7.3 Barcode (`src/lib/off/normalize.ts`)
- Populate `per100` from OFF `_100g` fields: `energy-kcal_100g`, `fat_100g`,
  `saturated-fat_100g`, `trans-fat_100g`, `fiber_100g`, `proteins_100g`,
  `sodium_100g`.
- Populate `fvlPercent` from
  `nutriments['fruits-vegetables-legumes-estimate-from-ingredients_100g']`
  (fallback `…-nuts-estimate-from-ingredients_100g`).

### 7.4 Photo (`src/lib/ai/vision.ts` + `vision-shape.ts`)
- Add to the JSON schema/prompt: `transFat` (g per serving) and `fvlPercent`
  (0–100, "share of the item that is whole fruit/veg/legume/nut; 0 for none").
- `vision-shape.ts`: sanitise both (clamp), pass `fvlPercent` through, and let
  `servingGrams` derive the per100 figures (already in place).

## 8. Verdict & cap interactions

- Bands unchanged: Good ≥70, Caution ≥40, Avoid <40.
- `maxScoreCap` gains the `snack` cap (55). NOVA-4 photo caps unchanged.
- Net effect examples (illustrative, to be locked by tests):
  - Crisps: already Avoid; energy/total-fat rules push deeper, no offset (UPF).
  - Lentil/bean stew (NOVA 1–3, high fibre+protein+FVL): rises toward Good via
    offsets instead of being dragged by a lone sodium/fat ding.
  - Milk chocolate (NOVA 4, energy ~550, satfat high): Avoid, no offset.
  - Plain Greek yogurt: protein offset keeps it firmly Good.

## 9. Testing strategy (TDD)

Failing-test-first for each unit:
- `signals.test.ts`: new per-100g fields derive correctly; null when no basis;
  `fvlPercent` passthrough.
- `registry`/`engine.test.ts`: each new negative rule fires at its threshold and
  is exempt for `whole_food`; trans-fat ingredient string → severe.
- Offset tests: bonus applied for qualifying foods; **zero** offset for NOVA-4 /
  UPF / snack; total offset capped at +25; never exceeds `maxScoreCap`.
- Category/cap: `snack` capped at 55; no green low-sugar flag on snacks.
- Additive registry: E433/E466/E407 resolve to moderate and lift
  `additiveMaxRisk`.
- Regression guard: cola/candy/processed-meat stay Avoid; whole-food photos stay
  100; existing 115 tests stay green (update only those whose basis legitimately
  changed, with rationale in the diff).
- `vision.test.ts`: `transFat`/`fvlPercent` flow through; absent → safe defaults.

## 10. Risks & mitigations

- **Over-penalising via stacked nutrient rules** (energy + total fat + sat fat).
  Mitigation: conservative thresholds, positive offsets, score floor at 0, and a
  fixture sweep across ~10 representative products before merge.
- **OFF data sparsity** (`trans-fat_100g`, FVL estimate often missing). Mitigation:
  null-skips mean absence never invents a penalty or a bonus.
- **Photo estimate noise** for `fvlPercent`/`transFat`. Mitigation: offsets are
  capped and gated; photo caps already limit upside.
