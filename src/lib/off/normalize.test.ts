import { describe, it, expect } from 'vitest';
import { normalizeOFF } from './normalize';

describe('normalizeOFF', () => {
  it('returns null when product not found', () => {
    expect(normalizeOFF({ status: 0 }, '000')).toBeNull();
  });

  it('maps OFF allergen tags to canonical keys', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Test', brands: 'X', quantity: '100g',
        allergens_tags: ['en:milk', 'en:gluten'],
        nutriments: { 'energy-kcal_serving': 100 },
      },
    }, '111');
    expect(r?.allergens.sort()).toEqual(['dairy', 'gluten']);
  });

  it('converts sodium grams to milligrams', () => {
    const r = normalizeOFF({
      status: 1,
      product: { product_name: 'X', brands: 'Y', nutriments: { sodium_serving: 0.45 } },
    }, '222');
    expect(r?.nutrition.sodium).toBe(450);
  });

  it('infers whole_food category from OFF fruit/veg/nut tags', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Avocado', brands: 'Generic',
        categories_tags: ['en:plant-based-foods', 'en:fruits', 'en:fresh-fruits'],
        nova_group: 3, // OFF can be wrong; we override
        additives_tags: ['en:e330'], // and we strip
        nutriments: { 'energy-kcal_100g': 160, sugars_100g: 0.7, sodium_100g: 0.007 },
      },
    }, 'avo');
    expect(r?.category).toBe('whole_food');
    expect(r?.novaGroup).toBe(1); // forced
    expect(r?.additives).toEqual([]); // stripped
  });

  it('reroutes a honey jar from whole_food to dessert (free sugar)', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Pure Honey', brands: 'Rowse',
        categories_tags: ['en:honeys', 'en:sweet-spreads'],
        nutriments: { 'energy-kcal_100g': 304, sugars_100g: 82 },
      },
    }, 'honey1');
    expect(r?.category).toBe('dessert');
    expect(r?.novaGroup).toBe(4); // dessert forces NOVA 4
  });

  it('reroutes a honey product even when tags say whole_food and name has honey', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Raw Honey', brands: 'Local',
        categories_tags: ['en:fruits'], // mis-tagged
        nutriments: { 'energy-kcal_100g': 304, sugars_100g: 82 },
      },
    }, 'honey2');
    expect(r?.category).toBe('dessert');
  });

  it('forces NOVA 4 for OFF cured meat regardless of nova_group field', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Bacon', brands: 'X',
        categories_tags: ['en:meats', 'en:cured-meats', 'en:bacons'],
        nova_group: 2,
        nutriments: { 'energy-kcal_100g': 250, sodium_100g: 1 },
      },
    }, 'bacon1');
    expect(r?.category).toBe('processed_meat');
    expect(r?.novaGroup).toBe(4);
  });

  it('clamps absurd OFF nutrition outliers (bulk-pack typos)', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Bad Entry', brands: 'X',
        nutriments: { 'energy-kcal_100g': 99999, sugars_100g: -10, sodium_100g: 999 },
      },
    }, 'bad1');
    expect(r?.nutrition.kcal).toBe(2000);
    expect(r?.nutrition.sugar).toBe(0);
    expect(r?.nutrition.sodium).toBe(20_000);
  });

  it('falls back to name-based whole_food detection when tags are weak', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Banana', brands: '',
        categories_tags: ['en:plant-based-foods'],
        nutriments: { 'energy-kcal_100g': 89, sugars_100g: 12 },
      },
    }, 'ban1');
    expect(r?.category).toBe('whole_food');
  });
});
