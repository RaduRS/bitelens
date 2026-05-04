'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  listFavorites, setFavorite as setFavStore, toggleFavorite as toggleFavStore,
  type FavoriteEntry,
} from '@/lib/favorites/storage';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listFavorites();
    setFavorites(new Set(list.map(f => f.id)));
    setHydrated(true);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = useCallback(async (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    await toggleFavStore(id);
  }, []);

  const set = useCallback(async (id: string, value: boolean) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
    await setFavStore(id, value);
  }, []);

  return { favorites, hydrated, toggle, set, refresh };
}

export type { FavoriteEntry };
