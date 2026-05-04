import type { AllergenKey } from './product';

export type Diet = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
export type GoalKey = 'low_sugar' | 'low_sodium' | 'high_protein' | 'less_processed' | 'high_fiber';

export interface Profile {
  diet: Diet;
  allergens: AllergenKey[];
  goals: GoalKey[];
  schemaVersion: 1;
}

export const DEFAULT_PROFILE: Profile = {
  diet: 'omnivore',
  allergens: [],
  goals: [],
  schemaVersion: 1,
};
