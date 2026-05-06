import type { Product, NutriScoreGrade, NovaGroup, AllergenKey, Additive, FoodCategory } from '@/types/product';
import { lookupAdditive } from '@/lib/additives/registry';
import { isOrganicLabelled, lookupPesticideAdvisory } from '@/lib/pesticides/registry';

interface OFFRaw {
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    image_front_small_url?: string;
    image_small_url?: string;
    image_url?: string;
    ingredients_text?: string;
    allergens_tags?: string[];
    additives_tags?: string[];
    categories_tags?: string[];
    labels_tags?: string[];
    origins_tags?: string[];
    countries_tags?: string[];
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    nova_group?: number | string;
    serving_size?: string;
    nutriments?: {
      'energy-kcal_serving'?: number; 'energy-kcal_100g'?: number;
      proteins_serving?: number; proteins_100g?: number;
      carbohydrates_serving?: number; carbohydrates_100g?: number;
      sugars_serving?: number; sugars_100g?: number;
      fat_serving?: number; fat_100g?: number;
      'saturated-fat_serving'?: number; 'saturated-fat_100g'?: number;
      fiber_serving?: number; fiber_100g?: number;
      sodium_serving?: number; sodium_100g?: number;
    };
  };
  status?: number;
}

const ALLERGEN_MAP: Record<string, AllergenKey> = {
  'en:gluten': 'gluten', 'en:milk': 'dairy', 'en:eggs': 'eggs',
  'en:nuts': 'nuts', 'en:peanuts': 'peanuts', 'en:soybeans': 'soy',
  'en:fish': 'fish', 'en:crustaceans': 'shellfish', 'en:sesame-seeds': 'sesame',
};

// OFF taxonomy → BiteLens FoodCategory. More specific tags first; first match
// wins. Mirrors the photo-flow categories so barcode + photo produce the same
// rule activations for the same kind of food.
const CATEGORY_TAGS: Array<[FoodCategory, string[]]> = [
  ['candy', [
    'en:candies', 'en:confectioneries', 'en:sweets', 'en:gummies', 'en:lollipops',
    'en:chocolates', 'en:candy-bars', 'en:chewing-gums', 'en:bonbons',
  ]],
  ['processed_meat', [
    'en:deli-meats', 'en:cured-meats', 'en:sausages', 'en:bacons', 'en:hams',
    'en:salamis', 'en:hot-dogs', 'en:processed-meats', 'en:cold-cuts',
  ]],
  ['fast_food', [
    'en:fast-foods', 'en:burgers', 'en:hamburgers', 'en:pizzas', 'en:hot-dogs-meals',
  ]],
  ['fried_food', [
    'en:fried-foods', 'en:french-fries', 'en:fried-chicken',
  ]],
  ['baked_good', [
    'en:biscuits-and-cakes', 'en:pastries', 'en:muffins', 'en:cookies',
    'en:cakes', 'en:pies', 'en:viennoiseries', 'en:doughnuts',
    'en:croissants', 'en:sweet-breads',
  ]],
  ['dessert', [
    'en:desserts', 'en:ice-creams', 'en:puddings', 'en:mousses',
    'en:honeys', 'en:honey', 'en:maple-syrups', 'en:syrups',
    'en:jams', 'en:fruit-spreads', 'en:sweet-spreads',
  ]],
  ['beverage', [
    'en:beverages', 'en:drinks', 'en:fruit-juices', 'en:sodas',
    'en:carbonated-drinks', 'en:energy-drinks', 'en:sweetened-beverages',
    'en:plant-based-milks', 'en:smoothies', 'en:flavoured-waters',
  ]],
  ['snack', [
    'en:snacks', 'en:chips', 'en:crisps', 'en:popcorn', 'en:rice-cakes',
    'en:crackers', 'en:salty-snacks', 'en:cereal-bars',
  ]],
  ['meal', [
    'en:meals', 'en:prepared-meals', 'en:ready-meals', 'en:soups',
    'en:sandwiches', 'en:pastas', 'en:salads', 'en:sushi',
  ]],
  // whole_food last — most specific produce/meat tags win, but we still catch
  // generic fruit/vegetable tags as a fallback.
  ['whole_food', [
    'en:fresh-fruits', 'en:raw-fruits', 'en:dried-fruits', 'en:fruits',
    'en:fresh-vegetables', 'en:raw-vegetables', 'en:vegetables',
    'en:roots-and-tubers', 'en:leaf-vegetables',
    'en:nuts', 'en:seeds', 'en:legumes',
    'en:raw-meats', 'en:fresh-fish', 'en:fresh-seafood',
    'en:eggs', 'en:fresh-herbs',
  ]],
];

function inferCategory(tags: string[] | undefined, name: string): FoodCategory | null {
  if (!tags || tags.length === 0) return null;
  const set = new Set(tags);
  for (const [cat, patterns] of CATEGORY_TAGS) {
    for (const p of patterns) if (set.has(p)) return cat;
  }
  // Last-resort name match for plain produce that may have weak tags.
  const lower = name.toLowerCase();
  if (/^(banana|apple|orange|pear|avocado|broccoli|carrot|spinach|kale|tomato|cucumber)/.test(lower)) {
    return 'whole_food';
  }
  return null;
}

// WHO classifies these as free sugars even when sold as a single ingredient.
// Reroute from whole_food → dessert so they get the harm-aware rules.
const SWEETENER_NAME_PATTERNS = [
  'honey', 'maple syrup', 'agave', 'molasses', 'treacle', 'golden syrup',
  'corn syrup', 'rice syrup', 'date syrup', 'fruit juice concentrate',
];

function coerceCategoryByName(category: FoodCategory | null, name: string): FoodCategory | null {
  if (category !== 'whole_food') return category;
  const lower = name.toLowerCase();
  for (const pat of SWEETENER_NAME_PATTERNS) {
    if (lower.includes(pat)) return 'dessert';
  }
  return category;
}

function pickGrade(g?: string): NutriScoreGrade | null {
  if (!g) return null;
  const u = g.toUpperCase();
  return (u === 'A' || u === 'B' || u === 'C' || u === 'D' || u === 'E') ? u : null;
}

function pickNova(n?: number | string): NovaGroup | null {
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  if (v === 1 || v === 2 || v === 3 || v === 4) return v;
  return null;
}

// Defends against OFF outliers (bulk-pack or label-typo entries with absurd
// per-100g values). Mirrors the photo-flow sanitization.
function pickServing(serving: number | undefined, per100: number | undefined, max: number): number {
  const raw = (typeof serving === 'number' && Number.isFinite(serving))
    ? serving
    : (typeof per100 === 'number' && Number.isFinite(per100)) ? per100 : 0;
  const clamped = Math.max(0, Math.min(max, raw));
  return Math.round(clamped * 10) / 10;
}

function pickSodium(serving: number | undefined, per100: number | undefined): number {
  // OFF stores sodium in grams; convert to mg and clamp.
  const raw = (typeof serving === 'number' && Number.isFinite(serving))
    ? serving
    : (typeof per100 === 'number' && Number.isFinite(per100)) ? per100 : 0;
  return Math.max(0, Math.min(20_000, Math.round(raw * 1000)));
}

export function normalizeOFF(raw: OFFRaw, barcode: string): Product | null {
  if (raw.status !== 1 || !raw.product) return null;
  const p = raw.product;
  const n = p.nutriments ?? {};
  const ingredients = (p.ingredients_text ?? '').split(/,\s*/).filter(Boolean);
  const allergens = (p.allergens_tags ?? [])
    .map(t => ALLERGEN_MAP[t]).filter(Boolean) as AllergenKey[];

  const name = p.product_name ?? 'Unknown product';
  const inferred = inferCategory(p.categories_tags, name);
  const category = coerceCategoryByName(inferred, name);

  const isWholeFood = category === 'whole_food';
  // Whole foods can't have additives by definition — drop any spurious tags.
  const additives: Additive[] = isWholeFood ? [] : (p.additives_tags ?? [])
    .map(t => t.replace(/^en:/i, '').toUpperCase())
    .map(code => lookupAdditive(code) ?? { code, name: code, risk: 'low' as const, detail: 'No detailed info on file.' });

  // NOVA-4 categories override any lower NOVA value OFF reports.
  const NOVA_4_CATS: FoodCategory[] = ['candy', 'dessert', 'fast_food', 'baked_good', 'fried_food', 'processed_meat'];
  let novaGroup: NovaGroup | null = pickNova(p.nova_group);
  if (category && NOVA_4_CATS.includes(category)) novaGroup = 4;
  else if (isWholeFood) novaGroup = 1;

  const imageUrl = p.image_front_small_url || p.image_small_url || p.image_url || null;

  const labelsTags = p.labels_tags ?? [];
  const originsTags = [...(p.origins_tags ?? []), ...(p.countries_tags ?? [])];
  const isOrganic = isOrganicLabelled(labelsTags);
  // Don't double-warn on certified-organic produce — by definition it cannot
  // legally carry the pesticides our registry references.
  const pesticideAdvisory = isOrganic
    ? null
    : lookupPesticideAdvisory(name, category, originsTags);

  return {
    id: barcode,
    type: 'barcode',
    brand: (p.brands ?? '').split(',')[0]?.trim() || 'Unknown',
    name,
    subtitle: p.quantity ?? '',
    swatch: '#7a8a5e',
    glyph: name.slice(0, 1).toUpperCase(),
    imageUrl,
    ingredients,
    allergens: Array.from(new Set(allergens)),
    additives,
    nutrition: {
      serving: p.serving_size ?? 'serving',
      kcal:    pickServing(n['energy-kcal_serving'], n['energy-kcal_100g'], 2000),
      protein: pickServing(n.proteins_serving, n.proteins_100g, 500),
      carbs:   pickServing(n.carbohydrates_serving, n.carbohydrates_100g, 500),
      sugar:   pickServing(n.sugars_serving, n.sugars_100g, 500),
      fat:     pickServing(n.fat_serving, n.fat_100g, 500),
      satFat:  pickServing(n['saturated-fat_serving'], n['saturated-fat_100g'], 500),
      fiber:   pickServing(n.fiber_serving, n.fiber_100g, 500),
      sodium:  pickSodium(n.sodium_serving, n.sodium_100g),
    },
    nutriScore: pickGrade(p.nutriscore_grade),
    ecoScore:   pickGrade(p.ecoscore_grade),
    novaGroup,
    category,
    isOrganic: isOrganic || undefined,
    pesticideAdvisory,
  };
}
