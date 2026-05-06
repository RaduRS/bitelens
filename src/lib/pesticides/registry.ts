import type { FoodCategory } from '@/types/product';

// Per-barcode pesticide data does not exist in any open dataset — regulators
// (UK PRiF, EFSA, USDA PDP) sample by commodity, not by SKU. So this module
// is a deliberately small, conservative commodity-level advisory list. Every
// entry is grounded in a regulator-confirmed exceedance finding from a 2024
// monitoring report. We exclude commodities on EWG's "Dirty Dozen" that those
// same regulators tested clean (apples, strawberries, blueberries, spinach,
// kale) — peer-reviewed toxicology shows EWG's list is not a reliable signal.

export interface PesticideAdvisory {
  commodity: string;
  source: string;
  detail: string;
}

interface CommodityEntry {
  commodity: string;
  patterns: RegExp[];
  // When true, only flag if origin info is missing or shows non-UK/EU origin.
  // Used for items where UK/EU-grown samples test clean but imported batches
  // exceed limits (grapes, cherry tomatoes, cucumbers).
  importedOnly?: boolean;
  source: string;
  detail: string;
}

const REGISTRY: readonly CommodityEntry[] = [
  {
    commodity: 'Imported grapes',
    patterns: [/\bgrapes?\b/, /\btable\s+grapes?\b/, /\bsultanas?\b/],
    importedOnly: true,
    source: 'UK PRiF 2024',
    detail: 'UK regulator (PRiF) flagged elevated acetamiprid residue on imported grapes in 2024 — wash thoroughly or choose UK/EU-grown.',
  },
  {
    commodity: 'Chilli peppers',
    patterns: [
      /\bchill?ies?\b/, /\bchill?i\s+peppers?\b/, /\bbird'?s?\s+eye\b/,
      /\bjalape[ñn]os?\b/, /\bhabaneros?\b/, /\bscotch\s+bonnets?\b/,
    ],
    source: 'UK PRiF 2024',
    detail: 'UK PRiF 2024 detected residues above the legal limit on multiple chilli pepper samples — wash before use.',
  },
  {
    commodity: 'Sweet/bell peppers',
    patterns: [/\b(sweet|bell)\s+peppers?\b/, /\bcapsicums?\b/, /\bromano\s+peppers?\b/],
    source: 'EFSA 2024',
    detail: 'EFSA 2024 reported the highest non-compliance rate (4.7%) for sweet peppers among major produce — wash thoroughly.',
  },
  {
    commodity: 'Grapefruit',
    patterns: [/\bgrapefruits?\b/, /\bpomelos?\b/],
    source: 'EFSA 2024',
    detail: 'EFSA 2024 reported 3.7% non-compliance with residue limits for grapefruit — wash skin before zest or juicing.',
  },
  {
    commodity: 'Imported cherry tomatoes',
    patterns: [/\bcherry\s+tomatoes?\b/, /\bplum\s+tomatoes?\b/, /\bvine\s+tomatoes?\b/],
    importedOnly: true,
    source: 'USDA PDP 2024',
    detail: 'Regulator testing flagged elevated residues on imported cherry tomatoes in 2024 — rinse before eating.',
  },
  {
    commodity: 'Imported cucumbers',
    patterns: [/\bcucumbers?\b/, /\bgherkins?\b/],
    importedOnly: true,
    source: 'USDA PDP 2024',
    detail: 'Regulator testing flagged elevated residues on imported cucumbers in 2024 — wash skin or peel.',
  },
];

const UK_OR_EU_ORIGINS = new Set([
  'en:united-kingdom', 'en:england', 'en:scotland', 'en:wales', 'en:northern-ireland',
  'en:european-union', 'en:eu',
  'en:france', 'en:spain', 'en:italy', 'en:germany', 'en:netherlands',
  'en:belgium', 'en:portugal', 'en:greece', 'en:ireland', 'en:poland',
  'en:austria', 'en:denmark', 'en:sweden', 'en:finland', 'en:czech-republic',
  'en:slovakia', 'en:hungary', 'en:romania', 'en:bulgaria', 'en:croatia',
  'en:slovenia', 'en:lithuania', 'en:latvia', 'en:estonia', 'en:malta',
  'en:cyprus', 'en:luxembourg',
]);

function originIsUKorEU(originsTags: readonly string[]): boolean {
  return originsTags.some(o => UK_OR_EU_ORIGINS.has(o));
}

export function lookupPesticideAdvisory(
  name: string,
  category: FoodCategory | null | undefined,
  originsTags: readonly string[],
): PesticideAdvisory | null {
  // Only relevant for whole foods (or unset category — typical for fresh produce
  // with sparse OFF data). Packaged products carry their harm signal through
  // additives / NOVA / nutrition, not pesticide residue.
  if (category != null && category !== 'whole_food') return null;
  const lower = name.toLowerCase();
  for (const entry of REGISTRY) {
    if (!entry.patterns.some(re => re.test(lower))) continue;
    // Imported-only gate: skip if we have explicit UK/EU origin.
    if (entry.importedOnly && originIsUKorEU(originsTags)) continue;
    return {
      commodity: entry.commodity,
      source: entry.source,
      detail: entry.detail,
    };
  }
  return null;
}

const ORGANIC_LABEL_TAGS = new Set([
  'en:organic', 'en:eu-organic', 'en:usda-organic', 'en:fr-bio',
  'en:soil-association-organic-standard', 'en:certified-organic',
  'en:organic-agriculture', 'en:bio-organic', 'en:ab-agriculture-biologique',
  'en:bio',
]);

export function isOrganicLabelled(labelsTags: readonly string[]): boolean {
  return labelsTags.some(t => ORGANIC_LABEL_TAGS.has(t));
}
