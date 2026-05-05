import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'bitelens';
// v4 stored the full Product on each ScanEntry so history can be re-evaluated
// against the current rules engine instead of showing frozen scores.
const DB_VERSION = 4;

export const STORE_SCANS = 'scans';
export const STORE_PHOTO_PRODUCTS = 'photo_products';
export const STORE_FAVORITES = 'favorites';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getBitelensDB() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const scans = db.createObjectStore(STORE_SCANS, { keyPath: 'id' });
          scans.createIndex('byScannedAt', 'scannedAt');
          scans.createIndex('byBarcode', 'barcode');
        }
        if (oldVersion < 2) {
          db.createObjectStore(STORE_PHOTO_PRODUCTS, { keyPath: 'id' });
        }
        if (oldVersion < 3) {
          const favs = db.createObjectStore(STORE_FAVORITES, { keyPath: 'id' });
          favs.createIndex('byAddedAt', 'addedAt');
        }
        if (oldVersion < 4 && oldVersion >= 1) {
          // Pre-v4 ScanEntry stored only a tiny display snapshot — not enough
          // to re-score. Drop them; users will re-populate by scanning.
          tx.objectStore(STORE_SCANS).clear();
        }
      },
    });
  }
  return dbPromise;
}
