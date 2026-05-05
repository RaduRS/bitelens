import type { Additive } from '@/types/product';

const RAW_REGISTRY: Record<string, Omit<Additive, 'code'>> = {
  // ── Caramel colors ────────────────────────────────────────────
  E150d: { name: 'Caramel color (Class IV)', risk: 'high', detail: 'Sulphite ammonia caramel. Trace 4-MEI is classified by IARC as possibly carcinogenic (Group 2B).' },
  E150c: { name: 'Caramel color (Class III)', risk: 'moderate', detail: 'Ammonia caramel. Lower 4-MEI than Class IV but still a processing marker.' },

  // ── Acidulants & emulsifiers ─────────────────────────────────
  E338:  { name: 'Phosphoric acid',          risk: 'moderate', detail: 'Strong acidity associated with enamel erosion and reduced calcium absorption.' },
  E322:  { name: 'Soy lecithin', risk: 'low', detail: 'Common emulsifier derived from soy. Generally recognized as safe.' },

  // ── Modified starches & gelling agents ───────────────────────
  E1442: { name: 'Hydroxypropyl distarch phosphate', risk: 'low', detail: 'Modified starch used as a thickener. Generally safe but indicates ultra-processing.' },
  E440:  { name: 'Pectin', risk: 'none', detail: 'Natural fiber from fruit, used as gelling agent. Considered safe.' },
  E428:  { name: 'Gelatine', risk: 'none', detail: 'Animal-derived gelling agent. Safe; not vegan/vegetarian.' },

  // ── Sweeteners ───────────────────────────────────────────────
  E951:  { name: 'Aspartame', risk: 'moderate', detail: 'IARC classified as possibly carcinogenic (Group 2B) in 2023. Acceptable within ADI for most adults.' },
  E952:  { name: 'Cyclamate', risk: 'moderate', detail: 'Banned in the US. Permitted in EU; debated rodent-bladder findings.' },
  E954:  { name: 'Saccharin', risk: 'moderate', detail: 'Older non-nutritive sweetener. Bladder concerns historically; current consensus considers it safe at typical intakes.' },
  E955:  { name: 'Sucralose', risk: 'low', detail: 'Heat-stable artificial sweetener. Some studies suggest gut microbiome effects.' },
  E965:  { name: 'Maltitol', risk: 'moderate', detail: 'Sugar alcohol. Can cause bloating, gas, or diarrhea in larger amounts.' },
  E967:  { name: 'Xylitol', risk: 'low', detail: 'Sugar alcohol. GI side effects possible. Toxic to dogs.' },
  E950:  { name: 'Acesulfame K', risk: 'low', detail: 'Heat-stable artificial sweetener. Long-term effects debated.' },

  // ── Southampton Six (artificial colors with EU warning label) ─
  E102: { name: 'Tartrazine (yellow)', risk: 'high', detail: 'EU mandates warning: "may have adverse effects on activity and attention in children" (Southampton study, 2007).' },
  E104: { name: 'Quinoline yellow', risk: 'high', detail: 'EU "Southampton Six": warning required on products marketed in the EU.' },
  E110: { name: 'Sunset yellow FCF', risk: 'high', detail: 'EU "Southampton Six": warning required on products marketed in the EU.' },
  E122: { name: 'Carmoisine (azorubine)', risk: 'high', detail: 'EU "Southampton Six": warning required on products marketed in the EU.' },
  E124: { name: 'Ponceau 4R', risk: 'high', detail: 'EU "Southampton Six": warning required on products marketed in the EU. Banned in the US.' },
  E129: { name: 'Allura red AC', risk: 'high', detail: 'EU "Southampton Six". California 2024 ban in school food.' },
  E133: { name: 'Brilliant blue FCF', risk: 'moderate', detail: 'Synthetic color; permitted in EU/US but flagged by some clean-label initiatives.' },

  // ── Banned / phased out ──────────────────────────────────────
  E171: { name: 'Titanium dioxide', risk: 'high', detail: 'Banned as a food additive in the EU since 2022 — EFSA could not rule out genotoxicity.' },

  // ── Preservatives with cancer concern ────────────────────────
  E249: { name: 'Potassium nitrite', risk: 'high', detail: 'In cured meat, forms nitrosamines. Processed meat is IARC Group 1 (carcinogenic to humans).' },
  E250: { name: 'Sodium nitrite', risk: 'high', detail: 'In cured meat, forms nitrosamines. Processed meat is IARC Group 1 (carcinogenic to humans).' },
  E251: { name: 'Sodium nitrate', risk: 'high', detail: 'Curing salt; converts to nitrite then nitrosamines in cured meat.' },
  E252: { name: 'Potassium nitrate', risk: 'high', detail: 'Curing salt; converts to nitrite then nitrosamines in cured meat.' },

  // ── Antioxidants under review ────────────────────────────────
  E320: { name: 'BHA', risk: 'moderate', detail: 'Listed by IARC as possibly carcinogenic (Group 2B) and as a "reasonably anticipated" carcinogen by US NTP.' },
  E321: { name: 'BHT', risk: 'moderate', detail: 'Synthetic antioxidant; rodent organ-effect data; permitted but flagged by clean-label apps.' },

  // ── Glazing / waxes (low risk, processing markers) ───────────
  E901: { name: 'Beeswax', risk: 'none', detail: 'Natural glazing agent. Safe.' },
  E903: { name: 'Carnauba wax', risk: 'low', detail: 'Plant-derived glazing agent on confectionery and sweets. Safe at normal intake.' },
  E330: { name: 'Citric acid', risk: 'none', detail: 'Naturally occurring acid widely used as acidulant/preservative. Safe.' },
};

const NORMALIZED: Record<string, Omit<Additive, 'code'>> = Object.fromEntries(
  Object.entries(RAW_REGISTRY).map(([k, v]) => [k.toUpperCase(), v]),
);

// Keep the original casing for direct lookups in tests / fixtures.
export const ADDITIVE_REGISTRY = RAW_REGISTRY;

export function lookupAdditive(code: string): Additive | undefined {
  const meta = NORMALIZED[code.toUpperCase()];
  return meta ? { code, ...meta } : undefined;
}
