import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db/client';
import { fetchProductFromOFF } from '@/lib/off/client';
import { extractSignals } from '@/lib/rules/signals';
import { lookupAdditive } from '@/lib/additives/registry';
import type { Product, Additive } from '@/types/product';

export const BARCODE_RE = /^\d{6,14}$/;

export async function loadProductByBarcode(barcode: string): Promise<Product | null> {
  if (!BARCODE_RE.test(barcode)) return null;
  const db = getDb();

  const cached = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.barcode, barcode))
    .limit(1);
  if (cached.length > 0) {
    const product = rowToProduct(cached[0]);
    // Lazy backfill: rows inserted before the imageUrl column existed have no
    // image. Refetch once to populate it. We update DB and return the fresh
    // product so the user sees the image on this same render.
    if (!product.imageUrl) {
      const fresh = await fetchProductFromOFF(barcode).catch(() => null);
      if (fresh?.imageUrl) {
        await db
          .update(schema.products)
          .set({ imageUrl: fresh.imageUrl, updatedAt: new Date() })
          .where(eq(schema.products.barcode, barcode))
          .catch(() => {});
        return { ...product, imageUrl: fresh.imageUrl };
      }
    }
    return product;
  }

  const fresh = await fetchProductFromOFF(barcode);
  if (!fresh) return null;

  const signals = extractSignals(fresh);
  await db
    .insert(schema.products)
    .values({
      barcode,
      brand: fresh.brand,
      name: fresh.name,
      subtitle: fresh.subtitle,
      imageUrl: fresh.imageUrl ?? null,
      ingredients: fresh.ingredients ?? [],
      allergens: fresh.allergens,
      additives: fresh.additives,
      nutrition: fresh.nutrition,
      nutriScore: fresh.nutriScore,
      ecoScore: fresh.ecoScore,
      novaGroup: fresh.novaGroup,
      category: fresh.category ?? null,
      signals,
    })
    .onConflictDoNothing();

  return fresh;
}

function rowToProduct(row: typeof schema.products.$inferSelect): Product {
  // Re-enrich additives from the live registry so cache rows pick up new metadata.
  const cachedAdditives = (row.additives as Additive[]) ?? [];
  const additives = cachedAdditives.map(a => lookupAdditive(a.code) ?? a);
  return {
    id: row.barcode,
    type: 'barcode',
    brand: row.brand,
    name: row.name,
    subtitle: row.subtitle,
    swatch: '#7a8a5e',
    glyph: row.name.slice(0, 1).toUpperCase(),
    imageUrl: row.imageUrl,
    ingredients: row.ingredients,
    allergens: row.allergens as Product['allergens'],
    additives,
    nutrition: row.nutrition as Product['nutrition'],
    nutriScore: row.nutriScore as Product['nutriScore'],
    ecoScore: row.ecoScore as Product['ecoScore'],
    novaGroup: row.novaGroup as Product['novaGroup'],
    category: (row.category ?? null) as Product['category'],
  };
}
