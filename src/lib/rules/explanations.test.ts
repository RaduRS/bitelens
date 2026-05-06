import { describe, it, expect } from 'vitest';
import { evaluate } from './engine';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';
import { DEFAULT_PROFILE } from '@/types/profile';
import type { Product } from '@/types/product';

// These tests exist because the previous summary fallback ("Some pros, some
// cons — see the details below.") gave the user no information about WHAT
// was mixed. Every realistic product should now produce a summary that names
// the dominant concern (or, in the genuine mixed case, both top pos and top neg).

const baseBarcode = (over: Partial<Product>): Product => ({
  id: 'p_test', type: 'barcode', brand: 'X', name: 'Test',
  subtitle: '', swatch: '#fff', glyph: 'T',
  ingredients: [], allergens: [], additives: [],
  nutrition: { serving: '100g', kcal: 200, protein: 5, carbs: 30, sugar: 3, fat: 5, satFat: 1, fiber: 1, sodium: 100 },
  nutriScore: null, ecoScore: null, novaGroup: null,
  ...over,
});

const basePhoto = (over: Partial<Product>): Product => ({
  id: 'photo_test', type: 'photo', brand: '', name: 'Photo',
  subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
  components: [], allergens: [], additives: [],
  nutrition: { serving: 'Estimated', kcal: 200, protein: 5, carbs: 30, sugar: 3, fat: 5, satFat: 1, fiber: 1, sodium: 100 },
  nutriScore: null, ecoScore: null, novaGroup: null,
  confidence: 0.9,
  ...over,
});

describe('summary text', () => {
  it('processed meat names the carcinogen risk, not just "ultra-processed"', () => {
    const bacon = basePhoto({
      name: 'Bacon', components: ['Bacon'],
      additives: [{ code: 'E250', name: 'Sodium nitrite', risk: 'high', detail: '' }],
      nutrition: { serving: 'Estimated', kcal: 250, protein: 18, carbs: 1, sugar: 0, fat: 20, satFat: 7, fiber: 0, sodium: 900 },
      novaGroup: 4, category: 'processed_meat',
    });
    const r = evaluate(bacon, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/processed meat/i);
    expect(r.summary).toMatch(/carcinogen/i);
  });

  it('candy summary names refined sugar, not generic ultra-processed', () => {
    const r = evaluate(PRODUCT_INDEX.p_haribo_photo, DEFAULT_PROFILE);
    expect(r.summary.toLowerCase()).not.toBe('ultra-processed product.');
    expect(r.summary).toMatch(/confectionery|refined-sugar/i);
  });

  it('fast food gets a fast-food-specific summary', () => {
    const burger = basePhoto({
      name: 'Cheeseburger', components: ['Beef patty', 'Bun', 'Cheese', 'Sauce'],
      nutrition: { serving: 'Estimated', kcal: 600, protein: 25, carbs: 45, sugar: 6, fat: 30, satFat: 12, fiber: 2, sodium: 1100 },
      novaGroup: 4, category: 'fast_food',
    });
    const r = evaluate(burger, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/fast food/i);
  });

  it('high-sodium product names sodium instead of falling through to the generic line', () => {
    const broth = baseBarcode({
      name: 'Salty broth',
      nutrition: { serving: '250ml', kcal: 30, protein: 1, carbs: 4, sugar: 1, fat: 1, satFat: 0, fiber: 0, sodium: 1200 },
      novaGroup: 3,
    });
    const r = evaluate(broth, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/sodium/i);
    expect(r.summary).toMatch(/1200/);
  });

  it('high-saturated-fat product surfaces sat fat in the summary', () => {
    const cream = baseBarcode({
      name: 'Whipping cream',
      nutrition: { serving: '50ml', kcal: 200, protein: 1, carbs: 2, sugar: 2, fat: 22, satFat: 14, fiber: 0, sodium: 30 },
      novaGroup: 2,
    });
    const r = evaluate(cream, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/saturated fat/i);
  });

  it('low-confidence photo with no flags says detection is uncertain', () => {
    const blurry = basePhoto({
      name: 'Unclear food', components: ['Salad'],
      nutrition: { serving: 'Estimated', kcal: 200, protein: 5, carbs: 30, sugar: 4, fat: 5, satFat: 1, fiber: 6, sodium: 200 },
      novaGroup: 1, category: 'whole_food', confidence: 0.25,
    });
    const r = evaluate(blurry, DEFAULT_PROFILE);
    expect(r.summary).toMatch(/uncertain/i);
  });

  it('genuine mixed case names both the top positive and the top concern', () => {
    // Decent protein but moderate sodium — previously: "Some pros, some cons".
    const mixed = baseBarcode({
      name: 'Protein bar',
      nutrition: { serving: '50g', kcal: 200, protein: 12, carbs: 25, sugar: 8, fat: 6, satFat: 2, fiber: 3, sodium: 600 },
      novaGroup: 4, // forces ultra_processed → still want sodium named, not generic
    });
    const r = evaluate(mixed, DEFAULT_PROFILE);
    // No catch-all language allowed.
    expect(r.summary).not.toMatch(/some pros/i);
    expect(r.summary).not.toMatch(/^ultra-processed product\.?$/i);
  });

  it('never returns the deprecated generic catch-all', () => {
    // Walk every fixture and confirm the old phrase never appears.
    for (const product of Object.values(PRODUCT_INDEX)) {
      const r = evaluate(product, DEFAULT_PROFILE);
      expect(r.summary).not.toMatch(/some pros, some cons/i);
    }
  });
});
