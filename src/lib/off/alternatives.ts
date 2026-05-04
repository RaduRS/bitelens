import type { ProductPreview } from './search';
import { searchOFF } from './search';

const HEADERS = {
  'User-Agent': 'BiteLens/1.0 (https://github.com/RaduRS/bitelens)',
};

interface OFFCategoryResponse {
  product?: { categories_tags?: string[] };
  status?: number;
}

export async function fetchProductCategories(barcode: string): Promise<string[]> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=categories_tags`;
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as OFFCategoryResponse;
  if (json.status !== 1) return [];
  return (json.product?.categories_tags ?? []).map(t => t.replace(/^en:/i, ''));
}

export async function findHealthierAlternatives(barcode: string, limit = 5): Promise<ProductPreview[]> {
  const tags = await fetchProductCategories(barcode);
  if (tags.length === 0) return [];

  // Try the most specific category first (last in array), then fall back broader.
  for (let i = tags.length - 1; i >= 0; i--) {
    const category = tags[i];
    const previews = await searchOFF({ category, topRated: true, limit: limit + 5 }).catch(() => []);
    const filtered = previews.filter(p => p.id !== barcode);
    if (filtered.length >= 2) return filtered.slice(0, limit);
  }
  return [];
}
