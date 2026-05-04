export type Diet = 'none' | 'keto' | 'low_carb' | 'carnivore' | 'anti_inflammatory';
export type GoalKey = 'low_sugar' | 'low_sodium' | 'high_protein' | 'less_processed' | 'high_fiber';

export interface Profile {
  diet: Diet;
  goals: GoalKey[];
  schemaVersion: 2;
}

export const DEFAULT_PROFILE: Profile = {
  diet: 'none',
  goals: [],
  schemaVersion: 2,
};
