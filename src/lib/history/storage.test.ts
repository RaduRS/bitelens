import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { recordScan, listScans, setFavorite, clearHistory, type ScanEntry } from './storage';
import { DEFAULT_PROFILE } from '@/types/profile';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';

const sample = (id: string, when: number): ScanEntry => ({
  id, barcode: 'p_oat_crisps', scannedAt: when, favorite: false,
  product: PRODUCT_INDEX.p_oat_crisps,
});

describe('history storage', () => {
  beforeEach(async () => { await clearHistory(); });

  it('records and lists scans newest first', async () => {
    await recordScan(sample('a', 1));
    await recordScan(sample('b', 3));
    await recordScan(sample('c', 2));
    const all = await listScans(DEFAULT_PROFILE);
    expect(all.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('toggles favorite', async () => {
    await recordScan(sample('a', 1));
    await setFavorite('a', true);
    expect((await listScans(DEFAULT_PROFILE))[0].favorite).toBe(true);
  });

  it('re-evaluates verdict and score on read against current rules', async () => {
    await recordScan(sample('a', 1));
    const [entry] = await listScans(DEFAULT_PROFILE);
    expect(entry.verdict).toBe('good');
    expect(entry.score).toBeGreaterThanOrEqual(70);
  });

  it('reflects profile changes (keto user sees keto breaches on stored scans)', async () => {
    const colaEntry: ScanEntry = {
      id: 'cola1', barcode: 'p_cola', scannedAt: 1, favorite: false,
      product: PRODUCT_INDEX.p_cola,
    };
    await recordScan(colaEntry);
    const ketoList = await listScans({ ...DEFAULT_PROFILE, diet: 'keto' });
    expect(ketoList[0].verdict).toBe('avoid');
  });
});
