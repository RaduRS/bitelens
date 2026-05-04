import type { AllergenKey, Diet, GoalKey } from '@/types/product';

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  gluten: 'Gluten', dairy: 'Dairy', eggs: 'Eggs', nuts: 'Tree nuts', peanuts: 'Peanuts',
  soy: 'Soy', fish: 'Fish', shellfish: 'Shellfish', sesame: 'Sesame',
};

export const DIET_OPTIONS: { id: Diet; label: string }[] = [
  { id: 'omnivore', label: 'Omnivore' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
];

export const GOAL_OPTIONS: { id: GoalKey; label: string }[] = [
  { id: 'low_sugar', label: 'Low sugar' },
  { id: 'low_sodium', label: 'Low sodium' },
  { id: 'high_protein', label: 'High protein' },
  { id: 'less_processed', label: 'Less processed' },
  { id: 'high_fiber', label: 'High fiber' },
];
