import type { Product, FoodCategory } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { Severity, Reason, Flag } from '@/types/verdict';
import type { SignalSet } from './signals';

export interface RuleHit {
  reason?: Reason;
  flag?: Flag;
}

export interface Rule {
  id: string;
  severity: Severity | 'pos';     // 'pos' = positive observation, no penalty
  when: (s: SignalSet, profile: Profile, p: Product) => boolean;
  build: (s: SignalSet, p: Product) => RuleHit;
}

const UPF_CATEGORIES: FoodCategory[] = [
  'candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat',
];

export const RULES: Rule[] = [
  // ── Category-driven UPF penalties (strongest signal we have for photos) ──
  {
    id: 'category_candy',
    severity: 'severe',
    when: s => s.category === 'candy',
    build: () => ({
      reason: { kind: 'neg', text: 'Confectionery — empty calories from refined sugar' },
      flag:   { tone: 'avoid', label: 'Candy', detail: 'NOVA 4' },
    }),
  },
  {
    id: 'category_dessert',
    severity: 'high',
    when: s => s.category === 'dessert' || s.category === 'baked_good',
    build: s => ({
      reason: { kind: 'neg', text: s.category === 'baked_good'
        ? 'Sweetened baked good — typically high sugar and refined flour'
        : 'Dessert — typically high sugar and saturated fat' },
      flag:   { tone: 'avoid', label: 'Dessert', detail: 'NOVA 4' },
    }),
  },
  {
    id: 'category_fast_food',
    severity: 'high',
    when: s => s.category === 'fast_food' || s.category === 'fried_food',
    build: s => ({
      reason: { kind: 'neg', text: s.category === 'fried_food'
        ? 'Deep-fried — high in inflammatory oils and oxidized fats'
        : 'Fast food — typically high sodium, fat, and refined carbs' },
      flag:   { tone: 'avoid', label: 'Fast food' },
    }),
  },
  {
    id: 'category_processed_meat',
    severity: 'severe',
    when: s => s.category === 'processed_meat',
    build: () => ({
      reason: { kind: 'neg', text: 'Processed meat — IARC Group 1 carcinogen for colorectal cancer' },
      flag:   { tone: 'avoid', label: 'Processed meat', detail: 'IARC 1' },
    }),
  },

  // ── Sugar (graduated, per serving) ────────────────────────────
  {
    id: 'sugar_severe',
    severity: 'severe',
    when: s => s.sugarPerServing >= 22.5,
    build: s => ({
      reason: { kind: 'neg', text: `Excessive sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'avoid', label: 'Excessive sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'sugar_high',
    severity: 'high',
    when: s => s.sugarPerServing >= 12 && s.sugarPerServing < 22.5,
    build: s => ({
      reason: { kind: 'neg', text: `High sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'avoid', label: 'High sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'sugar_moderate',
    severity: 'moderate',
    when: s => s.sugarPerServing >= 7 && s.sugarPerServing < 12,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'caution', label: 'Added sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'sugar_mild',
    severity: 'low',
    when: s => s.sugarPerServing >= 4 && s.sugarPerServing < 7,
    build: s => ({
      reason: { kind: 'neg', text: `Some sugar — ${s.sugarPerServing}g per serving` },
    }),
  },

  // ── Sugar density: how much of the calories come from sugar ───
  // Catches small portions of intensely sweet food (candy, soda) where the
  // absolute sugar number under-reports the concern. Gated to NOT stack with
  // the absolute-sugar tiers above — sugar_high/severe already cover obvious
  // sugar-heavy products, density is the extra signal for sneaky-small servings.
  {
    id: 'sugar_density_severe',
    severity: 'high',
    when: s => s.kcalPerServing >= 30 && s.sugarShareOfKcal >= 0.5 && s.sugarPerServing < 12,
    build: s => ({
      reason: { kind: 'neg', text: `${Math.round(s.sugarShareOfKcal * 100)}% of calories from sugar` },
      flag:   { tone: 'avoid', label: 'Sugar-heavy', detail: `${Math.round(s.sugarShareOfKcal * 100)}%` },
    }),
  },
  {
    id: 'sugar_density_high',
    severity: 'moderate',
    when: s => s.kcalPerServing >= 30 && s.sugarShareOfKcal >= 0.3 && s.sugarShareOfKcal < 0.5 && s.sugarPerServing < 7,
    build: s => ({
      reason: { kind: 'neg', text: `${Math.round(s.sugarShareOfKcal * 100)}% of calories from sugar` },
    }),
  },

  // ── Sodium (graduated) ────────────────────────────────────────
  {
    id: 'sodium_severe',
    severity: 'severe',
    when: s => s.sodiumPerServing >= 1500,
    build: s => ({
      reason: { kind: 'neg', text: `Excessive sodium — ${s.sodiumPerServing}mg per serving` },
      flag:   { tone: 'avoid', label: 'Excessive sodium', detail: `${s.sodiumPerServing}mg` },
    }),
  },
  {
    id: 'sodium_high',
    severity: 'high',
    when: s => s.sodiumPerServing >= 800 && s.sodiumPerServing < 1500,
    build: s => ({
      reason: { kind: 'neg', text: `High sodium — ${s.sodiumPerServing}mg per serving` },
      flag:   { tone: 'avoid', label: 'High sodium', detail: `${s.sodiumPerServing}mg` },
    }),
  },
  {
    id: 'sodium_moderate',
    severity: 'moderate',
    when: s => s.sodiumPerServing >= 500 && s.sodiumPerServing < 800,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate sodium — ${s.sodiumPerServing}mg per serving` },
      flag:   { tone: 'caution', label: 'Sodium', detail: `${s.sodiumPerServing}mg` },
    }),
  },

  // ── Saturated fat (graduated) ─────────────────────────────────
  {
    id: 'satfat_high',
    severity: 'high',
    when: s => s.satFatPerServing >= 8,
    build: s => ({
      reason: { kind: 'neg', text: `High saturated fat — ${s.satFatPerServing}g per serving` },
      flag:   { tone: 'avoid', label: 'Sat. fat', detail: `${s.satFatPerServing}g` },
    }),
  },
  {
    id: 'satfat_moderate',
    severity: 'moderate',
    when: s => s.satFatPerServing >= 5 && s.satFatPerServing < 8,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate saturated fat — ${s.satFatPerServing}g per serving` },
    }),
  },

  // ── Refined sugar / UPF ingredient flags ─────────────────────
  {
    id: 'refined_sugar_ingredient',
    severity: 'high',
    when: s => containsAny(s.ingredientsLower, REFINED_SUGAR_PATTERNS),
    build: () => ({
      reason: { kind: 'neg', text: 'Contains refined-sugar ingredients (syrups, dextrose, HFCS)' },
      flag:   { tone: 'avoid', label: 'Refined sugar' },
    }),
  },
  {
    // Don't stack on top of an existing NOVA-4 verdict — that already captures
    // the same concern. Use this when NOVA is missing or unknown.
    id: 'upf_ingredient_marker',
    severity: 'moderate',
    when: s => s.novaGroup !== 4 && containsAny(s.ingredientsLower, UPF_INGREDIENT_PATTERNS),
    build: () => ({
      reason: { kind: 'neg', text: 'Industrial ingredients suggest ultra-processing' },
    }),
  },

  // ── Additives ─────────────────────────────────────────────────
  {
    id: 'additive_high_risk',
    severity: 'high',
    when: s => s.additiveMaxRisk === 'high',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a high-risk additive' },
      flag:   { tone: 'avoid', label: 'High-risk additive' },
    }),
  },
  {
    id: 'additive_moderate_risk',
    severity: 'moderate',
    when: s => s.additiveMaxRisk === 'moderate',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a moderate-risk additive' },
      flag:   { tone: 'caution', label: 'Moderate-risk additive' },
    }),
  },
  {
    // Stacking: multiple additives compounds processing concern even if each is "low".
    id: 'additive_count_stacked',
    severity: 'low',
    when: s => s.additiveCount >= 3,
    build: s => ({
      reason: { kind: 'neg', text: `${s.additiveCount} additives in the ingredient list` },
    }),
  },

  // ── Processing & official scores ──────────────────────────────
  {
    id: 'ultra_processed',
    severity: 'high',
    when: s => s.novaGroup === 4,
    build: () => ({
      reason: { kind: 'neg', text: 'Ultra-processed (NOVA group 4)' },
      flag:   { tone: 'avoid', label: 'Ultra-processed', detail: 'NOVA 4' },
    }),
  },
  {
    id: 'processed_nova3',
    severity: 'low',
    when: s => s.novaGroup === 3,
    build: () => ({
      reason: { kind: 'neg', text: 'Processed (NOVA group 3)' },
    }),
  },
  {
    id: 'nutri_score_e',
    severity: 'high',
    when: s => s.nutriScore === 'E',
    build: () => ({
      reason: { kind: 'neg', text: 'Nutri-Score E — among the worst rated' },
    }),
  },
  {
    id: 'nutri_score_d',
    severity: 'moderate',
    when: s => s.nutriScore === 'D',
    build: () => ({
      reason: { kind: 'neg', text: 'Nutri-Score D' },
    }),
  },

  // ── Personal goals ────────────────────────────────────────────
  {
    id: 'goal_low_sugar_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('low_sugar') && s.sugarPerServing >= 8,
    build: s => ({
      reason: { kind: 'neg', text: `Above your low-sugar goal (${s.sugarPerServing}g)` },
    }),
  },
  {
    id: 'goal_less_processed_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('less_processed') && (s.novaGroup ?? 0) >= 3,
    build: s => ({
      reason: { kind: 'neg', text: `Processing level (NOVA ${s.novaGroup}) above your goal` },
    }),
  },

  // ── Diet preference ───────────────────────────────────────────
  {
    id: 'diet_keto_severe_breach',
    severity: 'high',
    when: (s, profile) => profile.diet === 'keto' && s.carbsPerServing >= 25,
    build: s => ({
      reason: { kind: 'neg', text: `Off-keto — ${s.carbsPerServing}g carbs per serving` },
      flag:   { tone: 'avoid', label: 'Off-keto', detail: `${s.carbsPerServing}g carbs` },
    }),
  },
  {
    id: 'diet_keto_breach',
    severity: 'moderate',
    when: (s, profile) => profile.diet === 'keto' && s.carbsPerServing >= 10 && s.carbsPerServing < 25,
    build: s => ({
      reason: { kind: 'neg', text: `Borderline keto — ${s.carbsPerServing}g carbs per serving` },
    }),
  },
  {
    id: 'diet_low_carb_breach',
    severity: 'moderate',
    when: (s, profile) => profile.diet === 'low_carb' && s.carbsPerServing >= 25,
    build: s => ({
      reason: { kind: 'neg', text: `High carb for low-carb — ${s.carbsPerServing}g per serving` },
    }),
  },
  {
    id: 'diet_carnivore_breach',
    severity: 'moderate',
    when: (s, profile) =>
      profile.diet === 'carnivore' &&
      (s.sugarPerServing >= 5 || s.carbsPerServing >= 15),
    build: s => ({
      reason: { kind: 'neg', text: `Off-carnivore — ${s.carbsPerServing}g carbs, ${s.sugarPerServing}g sugar` },
    }),
  },
  {
    id: 'diet_anti_inflammatory_breach',
    severity: 'moderate',
    when: (s, profile) => profile.diet === 'anti_inflammatory' && containsSeedOils(s.ingredientsLower),
    build: () => ({
      reason: { kind: 'neg', text: 'Contains seed oils — inflammatory for some' },
      flag:   { tone: 'caution', label: 'Seed oil' },
    }),
  },

  // ── Positives (no penalty) ────────────────────────────────────
  {
    // Only credit "no additives" when we have evidence the product is genuinely
    // minimally processed — otherwise an empty additives array (e.g. on photos
    // before AI flags any) silently gives candy a positive.
    id: 'pos_no_additives',
    severity: 'pos',
    when: (s, _profile, p) => {
      if (s.additiveCount !== 0) return false;
      if (s.category && UPF_CATEGORIES.includes(s.category)) return false;
      if (s.novaGroup === 4) return false;
      if (p.type === 'photo') {
        return s.category === 'whole_food' || s.category === 'meal' || (s.novaGroup != null && s.novaGroup <= 2);
      }
      return s.novaGroup != null && s.novaGroup <= 2;
    },
    build: () => ({ reason: { kind: 'pos', text: 'No additives detected' } }),
  },
  {
    id: 'pos_high_protein',
    severity: 'pos',
    when: s => s.proteinPerServing >= 10,
    build: s => ({ reason: { kind: 'pos', text: `Good protein content (${s.proteinPerServing}g)` } }),
  },
  {
    id: 'pos_high_fiber',
    severity: 'pos',
    when: s => s.fiberPerServing >= 5,
    build: s => ({ reason: { kind: 'pos', text: `Good fiber (${s.fiberPerServing}g)` } }),
  },
  {
    id: 'pos_nutri_a_b',
    severity: 'pos',
    when: s => s.nutriScore === 'A' || s.nutriScore === 'B',
    build: s => ({ reason: { kind: 'pos', text: `Nutri-Score ${s.nutriScore}` } }),
  },
  {
    id: 'pos_low_sugar',
    severity: 'pos',
    when: s => s.sugarPerServing < 5 && s.kcalPerServing > 0 && !(s.category && UPF_CATEGORIES.includes(s.category)),
    build: () => ({ reason: { kind: 'pos', text: 'Low sugar' } }),
  },
];

// Multilingual seed-oil patterns. OFF ingredient text comes in product locale;
// we cover EN/FR/ES/DE/IT for the oils most commonly flagged in anti-inflammatory
// diets. Add more as we encounter them.
const SEED_OIL_PATTERNS = [
  // English
  'sunflower oil', 'soybean oil', 'soya oil', 'soy oil',
  'corn oil', 'canola oil', 'rapeseed oil',
  'cottonseed oil', 'safflower oil', 'grapeseed oil', 'rice bran oil',
  'palm oil', 'palm kernel oil',
  // French
  'huile de tournesol', 'huile de soja', 'huile de maïs', 'huile de mais',
  'huile de colza', 'huile de coton', 'huile de carthame',
  'huile de pépins de raisin', 'huile de pepins de raisin',
  'huile de palme', 'huile de palmiste',
  // Spanish
  'aceite de girasol', 'aceite de soja', 'aceite de maíz', 'aceite de maiz',
  'aceite de colza', 'aceite de algodón', 'aceite de algodon',
  'aceite de cártamo', 'aceite de cartamo', 'aceite de palma',
  // German
  'sonnenblumenöl', 'sonnenblumenoel', 'sojaöl', 'sojaoel',
  'maisöl', 'maisoel', 'rapsöl', 'rapsoel',
  'baumwollsamenöl', 'baumwollsamenoel', 'distelöl', 'disteloel',
  'palmöl', 'palmoel', 'palmkernöl', 'palmkernoel',
  // Italian
  'olio di girasole', 'olio di soia', 'olio di mais', 'olio di colza',
  'olio di palma', 'olio di palmisti', 'olio di vinaccioli',
];

// Refined-sugar ingredients are the strongest signal of an industrial sweet
// formulation — they are the canonical NOVA-4 markers for confectionery.
const REFINED_SUGAR_PATTERNS = [
  'glucose syrup', 'glucose-fructose syrup', 'fructose syrup',
  'high-fructose corn syrup', 'high fructose corn syrup', 'hfcs',
  'corn syrup', 'invert sugar', 'invert syrup',
  'dextrose', 'maltodextrin', 'caramelised sugar syrup', 'caramelized sugar syrup',
  'agave syrup', 'rice syrup',
];

// Industrial markers: substances "of no or rare culinary use" per NOVA criteria.
const UPF_INGREDIENT_PATTERNS = [
  'modified starch', 'modified corn starch', 'hydrogenated', 'partially hydrogenated',
  'mono- and diglycerides', 'mono and diglycerides',
  'protein isolate', 'soy protein isolate', 'whey protein isolate',
  'artificial flavor', 'artificial colour', 'artificial color',
];

function containsAny(ingredientsLower: string[], patterns: string[]): boolean {
  return ingredientsLower.some(ing => patterns.some(pat => ing.includes(pat)));
}

function containsSeedOils(ingredientsLower: string[]): boolean {
  return containsAny(ingredientsLower, SEED_OIL_PATTERNS);
}
