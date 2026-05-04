import type { AllergenKey, Diet, GoalKey } from '@/types/product';

// Used only for displaying allergen chips on result pages — not for filtering.
export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  gluten: 'Gluten', dairy: 'Dairy', eggs: 'Eggs', nuts: 'Tree nuts', peanuts: 'Peanuts',
  soy: 'Soy', fish: 'Fish', shellfish: 'Shellfish', sesame: 'Sesame',
};

export const DIET_OPTIONS: { id: Diet; label: string; sub?: string }[] = [
  { id: 'none',              label: 'No preference' },
  { id: 'keto',              label: 'Keto',                sub: 'Very low carb' },
  { id: 'low_carb',          label: 'Low carb' },
  { id: 'carnivore',         label: 'Carnivore',           sub: 'Animal foods' },
  { id: 'anti_inflammatory', label: 'Anti-inflammatory',   sub: 'Avoid seed oils' },
];

export const GOAL_OPTIONS: { id: GoalKey; label: string }[] = [
  { id: 'low_sugar', label: 'Low sugar' },
  { id: 'low_sodium', label: 'Low sodium' },
  { id: 'high_protein', label: 'High protein' },
  { id: 'less_processed', label: 'Less processed' },
  { id: 'high_fiber', label: 'High fiber' },
];
