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
});
