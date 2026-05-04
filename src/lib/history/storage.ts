import { openDB, type IDBPDatabase } from 'idb';
import type { Product } from '@/types/product';
import type { VerdictLevel } from '@/types/verdict';

export interface ScanEntry {
  id: string;
  barcode: string;
  scannedAt: number;
  verdict: VerdictLevel;
  score: number;
  favorite: boolean;
  snapshot: Pick<Product, 'brand' | 'name' | 'subtitle' | 'swatch' | 'glyph' | 'type' | 'nutriScore' | 'ecoScore' | 'novaGroup'>;
}

const DB_NAME = 'bitelens';
const STORE = 'scans';
const MAX_ENTRIES = 100;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byScannedAt', 'scannedAt');
        store.createIndex('byBarcode', 'barcode');
      },
    });
  }
  return dbPromise;
}

export async function recordScan(entry: ScanEntry): Promise<void> {
  const db = await getDB();
  await db.put(STORE, entry);
  // Cap to MAX_ENTRIES, oldest first.
  const tx = db.transaction(STORE, 'readwrite');
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
  const db = await getDB();
  const all = await db.getAll(STORE) as ScanEntry[];
  return all.sort((a, b) => b.scannedAt - a.scannedAt);
}

export async function setFavorite(id: string, favorite: boolean): Promise<void> {
  const db = await getDB();
  const entry = await db.get(STORE, id) as ScanEntry | undefined;
  if (!entry) return;
  await db.put(STORE, { ...entry, favorite });
}

export async function clearHistory(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE);
}
