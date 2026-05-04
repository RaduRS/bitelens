import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { fetchProductFromOFF } from '@/lib/off/client';
import { extractSignals } from '@/lib/rules/signals';
import type { Product } from '@/types/product';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ barcode: string }> },
) {
  const { barcode } = await ctx.params;
  if (!/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }
  const db = getDb();

  const cached = await db.select().from(schema.products).where(eq(schema.products.barcode, barcode)).limit(1);
  if (cached.length > 0) {
    const row = cached[0];
    const product: Product = rowToProduct(row);
    return NextResponse.json({ product, source: 'cache' });
  }

  const fresh = await fetchProductFromOFF(barcode);
  if (!fresh) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const signals = extractSignals(fresh);
  await db.insert(schema.products).values({
    barcode, brand: fresh.brand, name: fresh.name, subtitle: fresh.subtitle,
    ingredients: fresh.ingredients ?? [], allergens: fresh.allergens,
    additives: fresh.additives, nutrition: fresh.nutrition,
    nutriScore: fresh.nutriScore, ecoScore: fresh.ecoScore, novaGroup: fresh.novaGroup,
    signals,
  }).onConflictDoNothing();

  return NextResponse.json({ product: fresh, source: 'live' });
}

function rowToProduct(row: typeof schema.products.$inferSelect): Product {
  return {
    id: row.barcode, type: 'barcode',
    brand: row.brand, name: row.name, subtitle: row.subtitle,
    swatch: '#7a8a5e', glyph: row.name.slice(0, 1).toUpperCase(),
    ingredients: row.ingredients,
    allergens: row.allergens as Product['allergens'],
    additives: row.additives as Product['additives'],
    nutrition: row.nutrition as Product['nutrition'],
    nutriScore: row.nutriScore as Product['nutriScore'],
    ecoScore: row.ecoScore as Product['ecoScore'],
    novaGroup: row.novaGroup as Product['novaGroup'],
  };
}
