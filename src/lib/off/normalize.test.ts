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

  it('detects organic certification from OFF labels', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Organic Carrots', brands: 'Riverford',
        categories_tags: ['en:fresh-vegetables', 'en:vegetables'],
        labels_tags: ['en:organic', 'en:eu-organic'],
        nutriments: { 'energy-kcal_100g': 41, sugars_100g: 4.7 },
      },
    }, 'org1');
    expect(r?.isOrganic).toBe(true);
    // Organic short-circuits the residue advisory.
    expect(r?.pesticideAdvisory).toBeNull();
  });

  it('attaches a residue advisory for imported chilli peppers', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Bird\'s Eye Chillies', brands: 'Asda',
        categories_tags: ['en:fresh-vegetables', 'en:peppers'],
        origins_tags: ['en:thailand'],
        nutriments: { 'energy-kcal_100g': 40, sugars_100g: 5 },
      },
    }, 'chilli1');
    expect(r?.pesticideAdvisory?.commodity).toBe('Chilli peppers');
  });

  it('does NOT attach a residue advisory to UK strawberries (false-positive guard)', () => {
    const r = normalizeOFF({
      status: 1,
      product: {
        product_name: 'British Strawberries', brands: 'Asda',
        categories_tags: ['en:fresh-fruits', 'en:berries'],
        origins_tags: ['en:united-kingdom'],
        nutriments: { 'energy-kcal_100g': 32, sugars_100g: 4.9 },
      },
    }, 'straw1');
    expect(r?.pesticideAdvisory).toBeNull();
  });

  it('flags imported grapes but not Spanish/EU grapes', () => {
    const turkish = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Red Seedless Grapes', brands: 'Lidl',
        categories_tags: ['en:fresh-fruits'],
        origins_tags: ['en:turkey'],
        nutriments: { 'energy-kcal_100g': 69, sugars_100g: 16 },
      },
    }, 'grape1');
    expect(turkish?.pesticideAdvisory?.commodity).toBe('Imported grapes');

    const spanish = normalizeOFF({
      status: 1,
      product: {
        product_name: 'Red Seedless Grapes', brands: 'Lidl',
        categories_tags: ['en:fresh-fruits'],
        origins_tags: ['en:spain'],
        nutriments: { 'energy-kcal_100g': 69, sugars_100g: 16 },
      },
    }, 'grape2');
    expect(spanish?.pesticideAdvisory).toBeNull();
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
