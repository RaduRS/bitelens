import type { Product, NutriScoreGrade, NovaGroup, AllergenKey, Additive } from '@/types/product';
import { lookupAdditive } from '@/lib/additives/registry';

interface OFFRaw {
  product?: {
    code?: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    ingredients_text?: string;
    allergens_tags?: string[];
    additives_tags?: string[];
    nutriscore_grade?: string;
    ecoscore_grade?: string;
    nova_group?: number | string;
    serving_size?: string;
    nutriments?: {
      'energy-kcal_serving'?: number; 'energy-kcal_100g'?: number;
      proteins_serving?: number; proteins_100g?: number;
      carbohydrates_serving?: number; carbohydrates_100g?: number;
      sugars_serving?: number; sugars_100g?: number;
      fat_serving?: number; fat_100g?: number;
      'saturated-fat_serving'?: number; 'saturated-fat_100g'?: number;
      fiber_serving?: number; fiber_100g?: number;
      sodium_serving?: number; sodium_100g?: number;
    };
  };
  status?: number;
}

const ALLERGEN_MAP: Record<string, AllergenKey> = {
  'en:gluten': 'gluten', 'en:milk': 'dairy', 'en:eggs': 'eggs',
  'en:nuts': 'nuts', 'en:peanuts': 'peanuts', 'en:soybeans': 'soy',
  'en:fish': 'fish', 'en:crustaceans': 'shellfish', 'en:sesame-seeds': 'sesame',
};

function pickGrade(g?: string): NutriScoreGrade | null {
  if (!g) return null;
  const u = g.toUpperCase();
  return (u === 'A' || u === 'B' || u === 'C' || u === 'D' || u === 'E') ? u : null;
}

function pickNova(n?: number | string): NovaGroup | null {
  const v = typeof n === 'string' ? parseInt(n, 10) : n;
  if (v === 1 || v === 2 || v === 3 || v === 4) return v;
  return null;
}

function pickServing(serving?: number, per100?: number): number {
  if (typeof serving === 'number' && Number.isFinite(serving)) return Math.round(serving * 10) / 10;
  if (typeof per100 === 'number' && Number.isFinite(per100)) return Math.round(per100 * 10) / 10;
  return 0;
}

export function normalizeOFF(raw: OFFRaw, barcode: string): Product | null {
  if (raw.status !== 1 || !raw.product) return null;
  const p = raw.product;
  const n = p.nutriments ?? {};
  const ingredients = (p.ingredients_text ?? '').split(/,\s*/).filter(Boolean);
  const allergens = (p.allergens_tags ?? [])
    .map(t => ALLERGEN_MAP[t]).filter(Boolean) as AllergenKey[];
  const additives: Additive[] = (p.additives_tags ?? [])
    .map(t => t.replace(/^en:/i, '').toUpperCase())
    .map(code => lookupAdditive(code) ?? { code, name: code, risk: 'low' as const, detail: 'No detailed info on file.' });

  return {
    id: barcode,
    type: 'barcode',
    brand: (p.brands ?? '').split(',')[0]?.trim() || 'Unknown',
    name: p.product_name ?? 'Unknown product',
    subtitle: p.quantity ?? '',
    swatch: '#7a8a5e',
    glyph: (p.product_name ?? '?').slice(0, 1).toUpperCase(),
    ingredients,
    allergens: Array.from(new Set(allergens)),
    additives,
    nutrition: {
      serving: p.serving_size ?? 'serving',
      kcal:    pickServing(n['energy-kcal_serving'], n['energy-kcal_100g']),
      protein: pickServing(n.proteins_serving, n.proteins_100g),
      carbs:   pickServing(n.carbohydrates_serving, n.carbohydrates_100g),
      sugar:   pickServing(n.sugars_serving, n.sugars_100g),
      fat:     pickServing(n.fat_serving, n.fat_100g),
      satFat:  pickServing(n['saturated-fat_serving'], n['saturated-fat_100g']),
      fiber:   pickServing(n.fiber_serving, n.fiber_100g),
      sodium:  Math.round(((typeof n.sodium_serving === 'number' && Number.isFinite(n.sodium_serving)) ? n.sodium_serving : (typeof n.sodium_100g === 'number' && Number.isFinite(n.sodium_100g)) ? n.sodium_100g : 0) * 1000),  // OFF stores g, we want mg
    },
    nutriScore: pickGrade(p.nutriscore_grade),
    ecoScore:   pickGrade(p.ecoscore_grade),
    novaGroup:  pickNova(p.nova_group),
  };
}
