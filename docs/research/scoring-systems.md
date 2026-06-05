# Food health scoring — evidence base

Research synthesis behind the BiteLens score redesign. Goal: a smooth, evidence-based
0–100 health score that won't rank a banana near potato crisps, grounded in validated
nutrient-profiling models rather than hand-tuned thresholds.

> Provenance note: gathered via a deep-research pass (fan-out web search + source fetch).
> The Nutri-Score 2023 mechanics were independently confirmed (3-0 votes). The FSA/Ofcom
> NPM, Health Star Rating, and Food Compass threshold tables below come from **primary
> sources** (official UK government technical-guidance PDFs; Nature Food papers) but the
> automated verifier crashed on them, so they are "uncorroborated in this pass," NOT
> refuted. Treat the FSA tables as authoritative (they are the published spec) and
> re-confirm against the linked PDF before relying on any single number.

## The core mechanism every validated system shares

**Score = (negative points) − (positive points), computed per 100 g**, with each component
scored on a *graduated* ladder (many small tiers), not an on/off flag. This is inherently a
smooth gradient — there is no "category cliff."

- **Negative (A) points:** energy, total sugars, saturated fat, sodium.
- **Positive (C) points:** fibre, protein, and **fruit/vegetable/legume/nut % (FVL)**.

The FVL component is *the* mechanism that separates whole fruit from junk. A banana is
~100% fruit → maximum positive points → offsets its sugar. Crisps are 0% FVL → no offset.
**None of these systems exempt whole foods by category** — they let the nutrient maths do it.

## FSA / Ofcom Nutrient Profiling Model (2004/2005) — the implementable base

Per 100 g. Score = A − C. (Foundation of both Nutri-Score and the Health Star Rating.)

**A points (0–10 each):**

| Pts | Energy (kJ) | Sat fat (g) | Total sugar (g) | Sodium (mg) |
|----:|------------:|------------:|----------------:|------------:|
| 0 | ≤335 | ≤1 | ≤4.5 | ≤90 |
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

**C points (0–5 each):**

| Pts | FVL (%) | Fibre NSP (g) | Fibre AOAC (g) | Protein (g) |
|----:|--------:|--------------:|---------------:|------------:|
| 0 | ≤40 | ≤0.7 | ≤0.9 | ≤1.6 |
| 1 | >40 | >0.7 | >0.9 | >1.6 |
| 2 | >60 | >1.4 | >1.9 | >3.2 |
| 3 | — | >2.1 | >2.8 | >4.8 |
| 4 | — | >2.8 | >3.7 | >6.4 |
| 5 | >80 | >3.5 | >4.7 | >8.0 |

**Combine:** `final = A − C`, **but** if A ≥ 11 and FVL < 5 points (<80%), protein points
are *not* subtracted (high-fat/sugar foods can't buy their way back via protein). Classified
"less healthy": food ≥ 4, drink ≥ 1. Only minimally-processed fruit/veg count toward FVL
(intact/cooked/dried/peeled/tinned/frozen/juice/puree); concentrates, powders, leathers and
starchy potatoes don't. Dried fruit/veg weight ×2.

Source: https://assets.publishing.service.gov.uk/media/695e87982a4a53b73d513855/NutrientProfilingModel_2004_2005_TechnicalGuidance.pdf

## Nutri-Score 2023 (confirmed mechanics)

Same A−C skeleton, stricter and category-specific. Confirmed facts:
- **Total sugar** scale 0–15 pts, first point at 3.4 g/100 g, max only above **51 g/100 g**
  → *lenient at the high end* (13 g/100 g = just 3/15). A documented weakness.
- **Saturated fat** caps at **10 g/100 g** (can't tell full-fat cheeses apart).
- Uses **total sugar** off the label — cannot separate intrinsic fruit sugar from added.
  Compensates only via the **FVL + protein positive components**, not a whole-food override.
- Separate algorithms for beverages (sugar 0–10 over ~0.5–11 g/100 ml; +4 pt non-nutritive-
  sweetener penalty), fats/oils (sat-fat-to-total-fat ratio), cheese, red meat (protein
  capped at 2 pts).
- Primary: Merz & Temme, *Nature Food* 5:102–110, 14 Feb 2024, DOI 10.1038/s43016-024-00920-3.

## Food Compass — the behaviour target

0–100 score, 54 attributes / 9 domains (incl. a processing domain). Reported behaviour:
- Raw fruits ≈ **100**; bananas/figs lower but still in the **encouraged (≥70)** band.
- Savoury snacks & sweet desserts average **~17**; legumes/nuts/seeds ~82.
- So a banana lands ~4–5× a bag of crisps. **This is the separation we want.**
- Criticised (J. Nutrition 2023) for *under*-penalising ultra-processed foods (rated some
  sugary cereals above cheese/eggs) → argues for keeping an explicit processing penalty.
- Primary: Mozaffarian et al., *Nature Food*, 2021, DOI 10.1038/s43016-021-00381-y.

## Processing (NOVA) — keep it as a separate axis

Nutrient profiling alone is "blind to processing" and lenient at the high-sugar end
(Nutri-Score). The consensus from the contrarian angle: **combine** a nutrient-profile score
with a NOVA/processing signal. No validated single combined formula exists, so this is a
defensible app-specific layer: nutrient gradient (A−C) for the base, processing/additive/
trans-fat penalties as modifiers on top.

## Design implications for BiteLens

1. **Replace the category cliff** (whole_food→cap 100, dessert→cap 45) with an **A−C nutrient
   gradient mapped to 0–100**. A mislabel then nudges the score, not collapses it.
2. **Make FVL% central** (we already capture `fvlPercent`). It's the validated reason a
   banana scores well — and it's a *different* axis from the category label, so one AI error
   can't tank a whole food.
3. **Keep processing/additive/trans-fat as explicit penalties** on top of the gradient
   (covers Nutri-Score's processing blind spot; satisfies "junk must score avoid").
4. **Floor FVL from components** (if ingredients are obviously whole fruit/veg, don't trust a
   stray `fvl=0`) so the offset survives a category misread — defence in depth.

Worked example (per 100 g): banana A≈3 (sugar 12 g), C≈6 (FVL 100% + fibre) → net ≈ −3 →
**good (~80)**. Crisps A≈10 (energy+satfat+sodium), C≈2 → net ≈ +8 → **avoid (~25)**.
