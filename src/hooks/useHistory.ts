'use client';
import { useEffect, useState, useCallback } from 'react';
import { listScans, setFavorite as setFavStore, type ScanEntry } from '@/lib/history/storage';

export function useHistory() {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    setScans(await listScans());
    setHydrated(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleFavorite = useCallback(async (id: string) => {
    const cur = scans.find(s => s.id === id);
    if (!cur) return;
    await setFavStore(id, !cur.favorite);
    await refresh();
  }, [scans, refresh]);

  return { scans, hydrated, refresh, toggleFavorite };
}
