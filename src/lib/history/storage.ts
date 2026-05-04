import type { Product } from '@/types/product';
import type { VerdictLevel } from '@/types/verdict';
import { getBitelensDB, STORE_SCANS } from '@/lib/idb/db';

export interface ScanEntry {
  id: string;
  barcode: string;
  scannedAt: number;
  verdict: VerdictLevel;
  score: number;
  favorite: boolean;
  snapshot: Pick<Product, 'brand' | 'name' | 'subtitle' | 'swatch' | 'glyph' | 'type' | 'nutriScore' | 'ecoScore' | 'novaGroup' | 'imageUrl'>;
}

const MAX_ENTRIES = 100;

export async function recordScan(entry: ScanEntry): Promise<void> {
  const db = await getBitelensDB();
  await db.put(STORE_SCANS, entry);
  const tx = db.transaction(STORE_SCANS, 'readwrite');
  const idx = tx.store.index('byScannedAt');
  const all = await idx.getAllKeys();
  if (all.length > MAX_ENTRIES) {
    for (const key of all.slice(0, all.length - MAX_ENTRIES)) {
      await tx.store.delete(key as IDBValidKey);
    }
  }
  await tx.done;
}

export async function listScans(): Promise<ScanEntry[]> {
  const db = await getBitelensDB();
  const all = await db.getAll(STORE_SCANS) as ScanEntry[];
  return all.sort((a, b) => b.scannedAt - a.scannedAt);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getBitelensDB();
  const entry = await db.get(STORE_SCANS, id) as ScanEntry | undefined;
  if (!entry) return;
  await db.put(STORE_SCANS, { ...entry, favorite });
}

export async function clearHistory(): Promise<void> {
  const db = await getBitelensDB();
  await db.clear(STORE_SCANS);
}
