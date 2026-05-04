'use client';
import { useEffect, useState, useCallback } from 'react';
import type { Profile } from '@/types/profile';
import { DEFAULT_PROFILE } from '@/types/profile';
import { loadProfile, saveProfile } from '@/lib/profile/storage';

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  const update = useCallback((p: Profile) => {
    setProfile(p);
    saveProfile(p);
  }, []);

  return { profile, setProfile: update, hydrated };
}
