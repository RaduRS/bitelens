import type { Profile, Diet } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';

const KEY = 'bitelens.profile.v1';
const VALID_DIETS: Diet[] = ['none', 'keto', 'low_carb', 'carnivore', 'anti_inflammatory'];

interface AnyStored {
  diet?: unknown;
  allergens?: unknown;
  goals?: unknown;
  schemaVersion?: unknown;
}

export function loadProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as AnyStored;
    return migrate(parsed);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

function migrate(raw: AnyStored): Profile {
  const diet = (typeof raw.diet === 'string' && (VALID_DIETS as string[]).includes(raw.diet))
    ? (raw.diet as Diet)
    : 'none';
  const goals = Array.isArray(raw.goals) ? (raw.goals as Profile['goals']) : [];
  return { diet, goals, schemaVersion: 2 };
}
