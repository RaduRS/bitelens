import { describe, it, expect } from 'vitest';
import { evaluate } from './engine';
import { DEFAULT_PROFILE } from '@/types/profile';
import type { Product, FoodCategory } from '@/types/product';

// Builds a photo product. Defaults describe a medium banana (~118g); override
// nutrition per case. The point of these anchors: a whole food must never land
// near junk, AND a category misclassification must degrade gracefully (the old
// cliff dropped a banana to 25/avoid the instant the AI mislabelled it).
function photo(
  name: string, category: FoodCategory, nova: 1 | 2 | 3 | 4,
  components: string[], n: Partial<Product['nutrition']> = {},
): Product {
  return {
    id: 'photo_' + name, type: 'photo', brand: '', name, subtitle: '', swatch: '#000',
    glyph: '◐', components, allergens: [], additives: [],
    nutrition: {
      serving: 'Estimated serving', servingGrams: 118, kcal: 105, protein: 1.3,
      carbs: 27, sugar: 14, fat: 0.4, satFat: 0.1, fiber: 3.1, sodium: 1, fvlPercent: 100, ...n,
    },
    nutriScore: null, ecoScore: null, novaGroup: nova, category, confidence: 0.9,
  } as Product;
}

const CRISPS = (): Product => photo('Potato crisps', 'snack', 4,
  ['Potato', 'Sunflower oil', 'Salt'],
  { servingGrams: 30, kcal: 160, protein: 1.8, carbs: 15, sugar: 0.5, fat: 10, satFat: 1.5, fiber: 1.2, sodium: 170, fvlPercent: 0 });

describe('scoring regression — banana must never rank near crisps', () => {
  it('banana correctly classified is Good', () => {
    const r = evaluate(photo('Banana', 'whole_food', 1, ['Banana']), DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('banana MISCLASSIFIED as dessert degrades gracefully (not Avoid)', () => {
    // Old cliff: this scored 25 (avoid). FVL flooring + gradient keep it out of avoid.
    const r = evaluate(photo('Banana', 'dessert', 4, ['Banana'], { fvlPercent: 0 }), DEFAULT_PROFILE);
    expect(r.verdict).not.toBe('avoid');
    expect(r.score).toBeGreaterThanOrEqual(40);
  });

  it('egg is Good', () => {
    const r = evaluate(photo('Egg', 'whole_food', 1, ['Egg'], {
      servingGrams: 50, kcal: 72, protein: 6.3, carbs: 0.4, sugar: 0.2,
      fat: 5, satFat: 1.6, fiber: 0, sodium: 71, fvlPercent: 0,
    }), DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
  });

  it('crisps are Avoid', () => {
    expect(evaluate(CRISPS(), DEFAULT_PROFILE).verdict).toBe('avoid');
  });

  it('banana scores at least 2.5x crisps (clear separation)', () => {
    const b = evaluate(photo('Banana', 'whole_food', 1, ['Banana']), DEFAULT_PROFILE).score;
    const c = evaluate(CRISPS(), DEFAULT_PROFILE).score;
    expect(b).toBeGreaterThan(c * 2.5);
  });
});
