import { NextResponse } from 'next/server';
import { searchOFF } from '@/lib/off/search';

export const runtime = 'nodejs';

const ALLOWED_CATEGORIES = new Set([
  'snacks', 'beverages', 'dairies', 'meals', 'sweets', 'groceries',
]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || undefined;
  const categoryRaw = url.searchParams.get('category')?.trim();
  const category = categoryRaw && ALLOWED_CATEGORIES.has(categoryRaw) ? categoryRaw : undefined;
  const top = url.searchParams.get('top') === '1';
  const limit = Number(url.searchParams.get('limit')) || 20;

  if (!q && !category && !top) {
    return NextResponse.json({ error: 'Provide q, category, or top.' }, { status: 400 });
  }

  try {
    const products = await searchOFF({ q, category, topRated: top, limit });
    return NextResponse.json({ products });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Discover query failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
