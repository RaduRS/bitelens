import type { SignalSet } from './signals';
import type { Product } from '@/types/product';

const HIGH_SUGAR_IDS = ['sugar_severe', 'sugar_high'];
const ANY_SUGAR_IDS = [...HIGH_SUGAR_IDS, 'sugar_moderate'];

function any(triggered: string[], ids: readonly string[]): boolean {
  return ids.some(id => triggered.includes(id));
}

// Short, summary-friendly fragments per rule ID. Tighter than the full Reason
// text shown in the "Why" list — the summary line should read like a verdict.
const NEG_PHRASE: Record<string, string> = {
  category_processed_meat:        'IARC Group 1 carcinogen risk',
  category_candy:                 'refined-sugar bomb',
  category_fast_food:             'fast-food sodium-and-fat profile',
  category_dessert:               'dessert-grade sugar and sat fat',
  sugar_severe:                   'excessive sugar',
  sugar_high:                     'high sugar',
  sugar_moderate:                 'moderate sugar',
  sugar_mild:                     'some added sugar',
  sugar_density_severe:           'sugar-heavy for the calories',
  sugar_density_high:             'sugar-dense calories',
  sodium_severe:                  'excessive sodium',
  sodium_high:                    'high sodium',
  sodium_moderate:                'moderate sodium',
  satfat_high:                    'high saturated fat',
  satfat_moderate:                'moderate saturated fat',
  refined_sugar_ingredient:       'refined sugars in the ingredients',
  upf_ingredient_marker:          'industrial ingredients',
  additive_high_risk:             'a high-risk additive',
  additive_moderate_risk:         'a moderate-risk additive',
  additive_count_stacked:         'multiple additives stacked',
  ultra_processed:                'ultra-processed (NOVA 4)',
  processed_nova3:                'processed (NOVA 3)',
  nutri_score_e:                  'Nutri-Score E',
  nutri_score_d:                  'Nutri-Score D',
  goal_low_sugar_breach:          'above your low-sugar goal',
  goal_less_processed_breach:     'above your processing goal',
  diet_keto_severe_breach:        'off your keto diet',
  diet_keto_breach:               'borderline for keto',
  diet_low_carb_breach:           'high-carb for low-carb',
  diet_carnivore_breach:          'off-carnivore',
  diet_anti_inflammatory_breach:  'seed oils flagged',
};

const POS_PHRASE: Record<string, string> = {
  pos_whole_food:    'whole food',
  pos_nutri_a_b:     'top Nutri-Score',
  pos_high_protein:  'solid protein',
  pos_high_fiber:    'good fiber',
  pos_low_sugar:     'low sugar',
  pos_no_additives:  'no additives',
};

// "What's the dominant concern" priority. Carcinogen and category-driven UPF
// rank above raw nutrient counts because the food *type* itself is the harm
// signal — a piece of bacon is still a Group 1 risk even with modest sodium.
const NEG_PRIORITY: string[] = [
  'category_processed_meat',
  'additive_high_risk',
  'category_candy',
  'category_fast_food',
  'category_dessert',
  'sugar_severe',
  'sodium_severe',
  'satfat_high',
  'sugar_high',
  'sodium_high',
  'sugar_density_severe',
  'nutri_score_e',
  'refined_sugar_ingredient',
  'ultra_processed',
  'sugar_moderate',
  'sodium_moderate',
  'satfat_moderate',
  'additive_moderate_risk',
  'sugar_density_high',
  'upf_ingredient_marker',
  'additive_count_stacked',
  'processed_nova3',
  'nutri_score_d',
  'sugar_mild',
  'goal_low_sugar_breach',
  'goal_less_processed_breach',
  'diet_keto_severe_breach',
  'diet_keto_breach',
  'diet_low_carb_breach',
  'diet_carnivore_breach',
  'diet_anti_inflammatory_breach',
];

const POS_PRIORITY: string[] = [
  'pos_whole_food',
  'pos_nutri_a_b',
  'pos_high_protein',
  'pos_high_fiber',
  'pos_low_sugar',
  'pos_no_additives',
];

function pickFirst(triggered: string[], priority: readonly string[]): string | null {
  for (const id of priority) if (triggered.includes(id)) return id;
  return null;
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildSummary(triggered: string[], s: SignalSet, p: Product): string {
  // ── Personally-relevant breaches lead — the user opted into these. ──
  if (triggered.includes('diet_keto_severe_breach') || triggered.includes('diet_keto_breach')) {
    return `Off your keto diet — ${s.carbsPerServing}g carbs per serving.`;
  }
  if (triggered.includes('diet_anti_inflammatory_breach')) {
    return 'Contains seed oils — flagged for your diet.';
  }

  // ── Category-first: name the food type when AI tagged it as junk-class. ──
  // These would otherwise collapse onto the generic "ultra-processed" line
  // because vision-shape forces NOVA 4 for any UPF category.
  if (triggered.includes('category_processed_meat')) {
    return 'Processed meat — IARC Group 1 carcinogen risk.';
  }
  if (triggered.includes('category_candy')) {
    return 'Confectionery — refined-sugar bomb, no nutritional upside.';
  }
  if (triggered.includes('category_fast_food')) {
    return s.category === 'fried_food'
      ? 'Deep-fried — inflammatory oils and refined carbs.'
      : 'Fast food — high sodium, fat, and refined carbs.';
  }
  if (triggered.includes('category_dessert')) {
    return s.category === 'baked_good'
      ? 'Sweet baked good — high sugar and refined flour.'
      : 'Dessert — high sugar and saturated fat.';
  }

  // ── High-severity single-axis avoid signals. ──
  if (any(triggered, HIGH_SUGAR_IDS) && triggered.includes('ultra_processed')) {
    return 'Ultra-processed, high sugar load.';
  }
  if (triggered.includes('additive_high_risk')) {
    return 'Contains a high-risk additive.';
  }
  if (triggered.includes('sodium_severe') || triggered.includes('sodium_high')) {
    return `High sodium — ${s.sodiumPerServing}mg per serving.`;
  }
  if (triggered.includes('satfat_high')) {
    return `High saturated fat — ${s.satFatPerServing}g per serving.`;
  }
  if (any(triggered, HIGH_SUGAR_IDS)) {
    const word = triggered.includes('sugar_severe') ? 'Excessive' : 'High';
    return `${word} sugar — ${s.sugarPerServing}g per serving.`;
  }
  if (triggered.includes('nutri_score_e')) {
    return 'Nutri-Score E — among the worst rated.';
  }

  // ── Mid-range concerns that previously fell through to the catch-all. ──
  if (triggered.includes('sugar_moderate')) {
    return `Sweeter than ideal — ${s.sugarPerServing}g sugar per serving.`;
  }
  if (triggered.includes('refined_sugar_ingredient')) {
    return 'Contains refined sugars (syrups, HFCS).';
  }
  if (triggered.includes('additive_moderate_risk')) {
    return 'Contains a moderate-risk additive.';
  }
  if (triggered.includes('ultra_processed')) {
    return 'Ultra-processed product.';
  }

  // ── Low-confidence photo: tell the user that's the actual issue. ──
  if (p.type === 'photo' && (p.confidence ?? 1) < 0.4) {
    return 'Uncertain detection — verify before trusting this score.';
  }

  // ── Clean defaults (positives reaching the green band). ──
  if (s.additiveCount === 0 && s.sugarPerServing < 5 && s.nutriScoreOrdinal <= 1) {
    return 'Whole-food, low sugar, no concerning additives.';
  }
  if (s.proteinPerServing >= 10 && s.sugarPerServing < 8) {
    return 'Solid protein, controlled sugar.';
  }
  if (s.category === 'whole_food') {
    return 'Whole, single-ingredient food.';
  }
  if (s.novaGroup != null && s.novaGroup <= 2 && s.additiveCount === 0) {
    return 'Minimally processed, no additives.';
  }
  if (s.novaGroup === 3) {
    return 'Processed but no major red flags.';
  }

  // ── Genuine "mixed" case — name BOTH the dominant pro and the dominant con
  // instead of punting with "Some pros, some cons". This is the path that the
  // user complained about: they want to know WHAT is mixed, not just THAT it is.
  const topNegId = pickFirst(triggered, NEG_PRIORITY);
  const topPosId = pickFirst(triggered, POS_PRIORITY);
  const negPhrase = topNegId ? NEG_PHRASE[topNegId] : null;
  const posPhrase = topPosId ? POS_PHRASE[topPosId] : null;
  if (negPhrase && posPhrase) {
    return `${capitalise(posPhrase)}, but ${negPhrase}.`;
  }
  if (negPhrase) {
    return `${capitalise(negPhrase)} — see details below.`;
  }
  if (posPhrase) {
    return `${capitalise(posPhrase)} — no major red flags.`;
  }
  // True empty-data case: no rules fired at all (e.g. nutrition all zeros).
  return 'Not enough signal to score confidently — see details below.';
}
