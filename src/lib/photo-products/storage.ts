import type { Product } from '@/types/product';
import { getBitelensDB, STORE_PHOTO_PRODUCTS } from '@/lib/idb/db';

const MAX_PRODUCTS = 50;

export async function putPhotoProduct(product: Product): Promise<void> {
  if (product.type !== 'photo') {
    throw new Error('putPhotoProduct only accepts photo products');
  }
  const db = await getBitelensDB();
  await db.put(STORE_PHOTO_PRODUCTS, product);

  const tx = db.transaction(STORE_PHOTO_PRODUCTS, 'readwrite');
  const allKeys = await tx.store.getAllKeys();
  if (allKeys.length > MAX_PRODUCTS) {
    const sorted = [...allKeys].sort();
    for (const key of sorted.slice(0, allKeys.length - MAX_PRODUCTS)) {
      await tx.store.delete(key as IDBValidKey);
    }
  }
  await tx.done;
}

export async function getPhotoProduct(id: string): Promise<Product | null> {
  const db = await getBitelensDB();
  const product = (await db.get(STORE_PHOTO_PRODUCTS, id)) as Product | undefined;
  return product ?? null;
}
