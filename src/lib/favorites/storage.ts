import { getBitelensDB, STORE_FAVORITES } from '@/lib/idb/db';

export interface FavoriteEntry {
  id: string;
  addedAt: number;
}

export async function isFavorite(id: string): Promise<boolean> {
  const db = await getBitelensDB();
  return Boolean(await db.get(STORE_FAVORITES, id));
}

export async function listFavorites(): Promise<FavoriteEntry[]> {
  const db = await getBitelensDB();
  const all = (await db.getAll(STORE_FAVORITES)) as FavoriteEntry[];
  return all.sort((a, b) => b.addedAt - a.addedAt);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getBitelensDB();
  if (favorite) {
    await db.put(STORE_FAVORITES, { id, addedAt: Date.now() });
  } else {
    await db.delete(STORE_FAVORITES, id);
  }
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const current = await isFavorite(id);
  await setFavorite(id, !current);
  return !current;
}

export async function clearFavorites(): Promise<void> {
  const db = await getBitelensDB();
  await db.clear(STORE_FAVORITES);
}
