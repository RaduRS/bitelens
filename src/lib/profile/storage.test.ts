import { describe, it, expect, beforeEach } from 'vitest';
import { loadProfile, saveProfile } from './storage';
import { DEFAULT_PROFILE } from '@/types/profile';

describe('profile storage', () => {
  beforeEach(() => window.localStorage.clear());

  it('returns DEFAULT_PROFILE when nothing is saved', () => {
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
  });

  it('round-trips a saved profile', () => {
    saveProfile({ ...DEFAULT_PROFILE, allergens: ['nuts'], goals: ['low_sugar'] });
    expect(loadProfile().allergens).toEqual(['nuts']);
    expect(loadProfile().goals).toEqual(['low_sugar']);
  });

  it('falls back to default when stored schema is incompatible', () => {
    window.localStorage.setItem('bitelens.profile.v1', JSON.stringify({ schemaVersion: 99 }));
    expect(loadProfile()).toEqual(DEFAULT_PROFILE);
  });
});
