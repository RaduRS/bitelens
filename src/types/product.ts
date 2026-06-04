export type AllergenKey =
  | 'gluten' | 'dairy' | 'eggs' | 'nuts' | 'peanuts'
  | 'soy' | 'fish' | 'shellfish' | 'sesame';

export type AdditiveRisk = 'none' | 'low' | 'moderate' | 'high';

export interface Additive {
  code: string;
  name: string;
  risk: AdditiveRisk;
  detail: string;
}

export interface Nutrition {
  serving: string;
  /**
   * Net weight (grams) or volume (ml) of ONE serving. Lets us convert the
   * per-serving figures below into a per-100g/100ml density for the
   * concentration-based (FSA-style) salt/sat-fat rules. Barcode: parsed from
   * OFF serving_size. Photo: estimated by the vision model.
   */
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
   * Authoritative per-100g/100ml density for concentration-based harms (salt,
   * saturated fat, energy, total/trans fat) and positive offsets (fibre,
   * protein). Populated directly from OFF's `_100g` fields on the barcode path;
   * on photos it is derived from `servingGrams`. When absent the density signals
   * fall back to deriving from `servingGrams`, then to null (rule skipped — we
   * don't guess). All fields optional-by-absence.
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

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type NovaGroup = 1 | 2 | 3 | 4;

export type FoodCategory =
  | 'meal'
  | 'whole_food'
  | 'snack'
  | 'beverage'
  | 'dessert'
  | 'candy'
  | 'fast_food'
  | 'baked_good'
  | 'fried_food'
  | 'processed_meat';

export interface Product {
  id: string;
  type: 'barcode' | 'photo';
  brand: string;
  name: string;
  subtitle: string;
  swatch: string;
  glyph: string;
  imageUrl?: string | null;
  ingredients?: string[];
  components?: string[];
  allergens: AllergenKey[];
  additives: Additive[];
  nutrition: Nutrition;
  nutriScore: NutriScoreGrade | null;
  ecoScore: NutriScoreGrade | null;
  novaGroup: NovaGroup | null;
  category?: FoodCategory | null;
  alternatives?: string[];
  confidence?: number;
  favorite?: boolean;
  timeAgo?: string;
  isOrganic?: boolean;
  pesticideAdvisory?: {
    commodity: string;
    source: string;
    detail: string;
  } | null;
  // Raw OFF taxonomy passthroughs — kept so the cache layer can re-derive
  // isOrganic / pesticideAdvisory on read instead of persisting the derived
  // values (which would go stale when the registry expands).
  labelsTags?: string[];
  originsTags?: string[];
}

export type { Diet, GoalKey, Profile } from './profile';
