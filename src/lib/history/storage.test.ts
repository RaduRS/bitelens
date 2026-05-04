import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { recordScan, listScans, setFavorite, clearHistory, type ScanEntry } from './storage';

const sample = (id: string, when: number): ScanEntry => ({
  id, barcode: '12345', scannedAt: when,
  verdict: 'good', score: 80, favorite: false,
  snapshot: { brand: 'X', name: 'Y', subtitle: '', swatch: '#fff', glyph: 'X', type: 'barcode', nutriScore: 'A', ecoScore: 'A', novaGroup: 1 },
});

describe('history storage', () => {
  beforeEach(async () => { await clearHistory(); });

  it('records and lists scans newest first', async () => {
    await recordScan(sample('a', 1));
    await recordScan(sample('b', 3));
    await recordScan(sample('c', 2));
    const all = await listScans();
    expect(all.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('toggles favorite', async () => {
    await recordScan(sample('a', 1));
    await setFavorite('a', true);
    expect((await listScans())[0].favorite).toBe(true);
  });
});
