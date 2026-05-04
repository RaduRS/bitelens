import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  isFavorite, setFavorite, toggleFavorite, listFavorites, clearFavorites,
} from './storage';

describe('favorites storage', () => {
  beforeEach(async () => { await clearFavorites(); });

  it('returns false for unknown ids', async () => {
    expect(await isFavorite('p_nope')).toBe(false);
  });

  it('persists a favorite', async () => {
    await setFavorite('p_abc', true);
    expect(await isFavorite('p_abc')).toBe(true);
  });

  it('removes a favorite', async () => {
    await setFavorite('p_abc', true);
    await setFavorite('p_abc', false);
    expect(await isFavorite('p_abc')).toBe(false);
  });

  it('toggles in place', async () => {
    expect(await toggleFavorite('p_x')).toBe(true);
    expect(await isFavorite('p_x')).toBe(true);
    expect(await toggleFavorite('p_x')).toBe(false);
    expect(await isFavorite('p_x')).toBe(false);
  });

  it('lists favorites newest-first', async () => {
    await setFavorite('p_a', true);
    await new Promise(r => setTimeout(r, 2));
    await setFavorite('p_b', true);
    const list = await listFavorites();
    expect(list.map(f => f.id)).toEqual(['p_b', 'p_a']);
  });
});
