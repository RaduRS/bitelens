'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  listScans, setFavorite as setFavStore, clearHistory as clearStore,
  type ScoredScanEntry,
} from '@/lib/history/storage';
import { useProfile } from './useProfile';

export function useHistory() {
  const { profile, hydrated: profileHydrated } = useProfile();
  const [scans, setScans] = useState<ScoredScanEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    setScans(await listScans(profile));
    setHydrated(true);
  }, [profile]);

  useEffect(() => { if (profileHydrated) void refresh(); }, [profileHydrated, refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    const cur = scans.find(s => s.id === id);
    if (!cur) return;
    await setFavStore(id, !cur.favorite);
    await refresh();
  }, [scans, refresh]);

  const clear = useCallback(async () => {
    await clearStore();
    setScans([]);
  }, []);

  return { scans, hydrated, refresh, toggleFavorite, clear };
}
