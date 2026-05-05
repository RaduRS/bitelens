import { describe, it, expect } from 'vitest';
import { responseToProduct } from './vision-shape';

describe('responseToProduct', () => {
  const sample = {
    name: '  Grain bowl with salmon  ',
    components: ['Salmon', '  Quinoa  ', '', 'Mixed greens'],
    allergens: ['fish' as const, 'sesame' as const],
    nutrition: {
      kcal: 519.7, protein: 28.04, carbs: 47.6, sugar: 6.13,
      fat: 22.21, satFat: 4.05, fiber: 9.24, sodium: 480.4,
    },
    category: 'meal' as const,
    processing: 1 as const,
    flaggedIngredients: [],
    confidence: 0.86,
  };

  it('produces a Product shaped for the result screen', () => {
    const p = responseToProduct(sample);
    expect(p.type).toBe('photo');
    expect(p.id).toMatch(/^photo_/);
    expect(p.brand).toBe('');
    expect(p.name).toBe('Grain bowl with salmon');
    expect(p.subtitle).toBe('Photo · detected meal');
    expect(p.components).toEqual(['Salmon', 'Quinoa', 'Mixed greens']);
    expect(p.allergens).toEqual(['fish', 'sesame']);
    expect(p.additives).toEqual([]);
    expect(p.nutriScore).toBeNull();
    expect(p.ecoScore).toBeNull();
    expect(p.novaGroup).toBe(1);
    expect(p.category).toBe('meal');
    expect(p.confidence).toBe(0.86);
  });

  it('rounds nutrition values to one decimal place', () => {
    const p = responseToProduct(sample);
    expect(p.nutrition.kcal).toBe(519.7);
    expect(p.nutrition.protein).toBe(28);
    expect(p.nutrition.carbs).toBe(47.6);
    expect(p.nutrition.sugar).toBe(6.1);
    expect(p.nutrition.fat).toBe(22.2);
    expect(p.nutrition.satFat).toBe(4.1);
    expect(p.nutrition.fiber).toBe(9.2);
    expect(p.nutrition.sodium).toBe(480.4);
    expect(p.nutrition.serving).toBe('Estimated serving');
  });

  it('clamps confidence outside [0, 1]', () => {
    expect(responseToProduct({ ...sample, confidence: 1.4 }).confidence).toBe(1);
    expect(responseToProduct({ ...sample, confidence: -0.2 }).confidence).toBe(0);
    expect(responseToProduct({ ...sample, confidence: NaN }).confidence).toBe(0);
  });

  it('emits unique ids per call', () => {
    const a = responseToProduct(sample);
    const b = responseToProduct(sample);
    expect(a.id).not.toBe(b.id);
  });

  it('derives NOVA 4 from a candy category regardless of declared processing', () => {
    const p = responseToProduct({
      ...sample,
      name: 'Haribo Starmix',
      components: ['Gummy candies', 'Glucose syrup', 'Sugar'],
      category: 'candy',
      processing: 2,
      flaggedIngredients: ['E330'],
    });
    expect(p.novaGroup).toBe(4);
    expect(p.category).toBe('candy');
  });

  it('forces NOVA 1 for whole_food regardless of declared processing (walnut bug)', () => {
    const p = responseToProduct({
      ...sample,
      name: 'Walnuts',
      components: ['Walnut halves'],
      category: 'whole_food',
      processing: 4,
      flaggedIngredients: [],
    });
    expect(p.novaGroup).toBe(1);
    expect(p.category).toBe('whole_food');
    expect(p.additives).toEqual([]);
  });

  it('synthesizes Additive entries from AI-flagged E-codes', () => {
    const p = responseToProduct({
      ...sample,
      category: 'beverage',
      processing: 4,
      flaggedIngredients: ['E150d', 'E338', 'unknown_code', 'E150D'],
    });
    expect(p.additives.map(a => a.code)).toEqual(['E150D', 'E338']);
    expect(p.additives[0].risk).toBe('high');
  });
});
