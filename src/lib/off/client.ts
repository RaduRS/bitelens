import { normalizeOFF } from './normalize';
import type { Product } from '@/types/product';

export async function fetchProductFromOFF(barcode: string): Promise<Product | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BiteLens/1.0 (https://github.com/RaduRS/bitelens)' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return normalizeOFF(json, barcode);
}
