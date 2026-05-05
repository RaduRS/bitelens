import type { Product } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { VerdictLevel } from '@/types/verdict';
import { getBitelensDB, STORE_SCANS } from '@/lib/idb/db';
import { evaluate } from '@/lib/rules/engine';

// Storing the full Product on every entry lets us re-evaluate against the
// current rules engine on every read — so a rule change tomorrow correctly
// updates the score on a scan from yesterday. Pre-v4 entries lacked this and
// showed permanently frozen wrong scores.
export interface ScanEntry {
  id: string;
  barcode: string;
  scannedAt: number;
  favorite: boolean;
  product: Product;
}

// Result of listScans — verdict/score recomputed against the active profile.
export interface ScoredScanEntry extends ScanEntry {
  verdict: VerdictLevel;
  score: number;
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

export async function listScans(profile: Profile): Promise<ScoredScanEntry[]> {
  const db = await getBitelensDB();
  const all = await db.getAll(STORE_SCANS) as ScanEntry[];
  return all
    .map(entry => {
      const r = evaluate(entry.product, profile);
      return { ...entry, verdict: r.verdict, score: r.score };
    })
    .sort((a, b) => b.scannedAt - a.scannedAt);
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
