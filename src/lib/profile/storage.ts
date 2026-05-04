import type { Profile } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';

const KEY = 'bitelens.profile.v1';

export function loadProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Profile;
    if (parsed.schemaVersion !== 1) return DEFAULT_PROFILE;
    return parsed;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(p: Profile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}
