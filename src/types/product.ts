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
  kcal: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  satFat: number;
  fiber: number;
  sodium: number;
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
}

export type { Diet, GoalKey, Profile } from './profile';
