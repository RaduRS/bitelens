import type { NutriScoreGrade, NovaGroup } from '@/types/product';

export interface ProductPreview {
  id: string;
  brand: string;
  name: string;
  nutriScore: NutriScoreGrade | null;
  ecoScore: NutriScoreGrade | null;
  novaGroup: NovaGroup | null;
}

interface OFFRow {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  nova_group?: number | string;
}

interface OFFSearchResponse {
  products?: OFFRow[];
  count?: number;
}

const FIELDS = 'code,product_name,brands,nutriscore_grade,ecoscore_grade,nova_group';

const HEADERS = {
  'User-Agent': 'BiteLens/1.0 (https://github.com/RaduRS/bitelens)',
};

function pickGrade(g?: string): NutriScoreGrade | null {
  if (!g) return null;
  const u = g.toUpperCase();
  return u === 'A' || u === 'B' || u === 'C' || u === 'D' || u === 'E' ? u : null;
}

function pickNova(n?: number | string): NovaGroup | null {
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  return v === 1 || v === 2 || v === 3 || v === 4 ? v : null;
}

export function rowsToPreviews(rows: OFFRow[]): ProductPreview[] {
  return rows
    .filter(r => typeof r.code === 'string' && r.code.length > 0 && (r.product_name ?? '').trim().length > 0)
    .map((r): ProductPreview => ({
      id: r.code as string,
      brand: ((r.brands ?? '').split(',')[0] ?? '').trim() || 'Unknown',
      name: (r.product_name ?? '').trim(),
      nutriScore: pickGrade(r.nutriscore_grade),
      ecoScore: pickGrade(r.ecoscore_grade),
      novaGroup: pickNova(r.nova_group),
    }));
}

interface SearchOptions {
  q?: string;
  category?: string;
  limit?: number;
  topRated?: boolean;
}

export async function searchOFF(opts: SearchOptions = {}): Promise<ProductPreview[]> {
  const limit = Math.max(1, Math.min(opts.limit ?? 20, 50));
  const params = new URLSearchParams({ fields: FIELDS, page_size: String(limit) });

  if (opts.q && opts.q.trim()) {
    params.set('search_terms', opts.q.trim());
  }
  if (opts.category) {
    params.set('categories_tags_en', opts.category);
  }
  if (opts.topRated) {
    params.set('nutriscore_grade', 'a');
    params.set('sort_by', 'popularity_key');
  }

  const url = `https://world.openfoodfacts.org/api/v2/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: HEADERS,
    next: { revalidate: opts.topRated || opts.category ? 3600 : 0 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as OFFSearchResponse;
  return rowsToPreviews(json.products ?? []);
}
