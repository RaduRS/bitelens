import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfile, saveProfile } from './storage';
import { DEFAULT_PROFILE } from '@/types/profile';

describe('profile storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns DEFAULT_PROFILE when nothing is saved', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
  });

  it('round-trips a saved profile', () => {
    saveProfile({ ...DEFAULT_PROFILE, diet: 'keto', goals: ['low_sugar'] });
    expect(loadProfile().diet).toBe('keto');
    expect(loadProfile().goals).toEqual(['low_sugar']);
  });

  it('migrates v1 profiles by stripping allergens and reverting unknown diets', () => {
    window.localStorage.setItem('bitelens.profile.v1', JSON.stringify({
      diet: 'omnivore',
      allergens: ['nuts', 'dairy'],
      goals: ['low_sugar'],
      schemaVersion: 1,
    }));
    const p = loadProfile();
    expect(p.diet).toBe('none');
    expect(p.goals).toEqual(['low_sugar']);
    expect((p as unknown as { allergens?: unknown }).allergens).toBeUndefined();
    expect(p.schemaVersion).toBe(2);
  });

  it('keeps a recognised diet across migration', () => {
    window.localStorage.setItem('bitelens.profile.v1', JSON.stringify({
      diet: 'keto', goals: [], schemaVersion: 2,
    }));
    expect(loadProfile().diet).toBe('keto');
  });
});
