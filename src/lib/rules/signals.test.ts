import { describe, it, expect } from 'vitest';
import { extractSignals } from './signals';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';

describe('extractSignals', () => {
  it('captures numeric facts from Cola', () => {
    const s = extractSignals(PRODUCT_INDEX.p_cola);
    expect(s.sugarPerServing).toBe(39);
    expect(s.sodiumPerServing).toBe(45);
    expect(s.proteinPerServing).toBe(0);
    expect(s.additiveMaxRisk).toBe('high');
    expect(s.additiveCount).toBe(2);
    expect(s.novaGroup).toBe(4);
    expect(s.nutriScoreOrdinal).toBe(4);
    expect(s.containsAllergens).toEqual([]);
  });

  it('captures allergens from Protein Bar', () => {
    const s = extractSignals(PRODUCT_INDEX.p_protein_bar);
    expect(s.containsAllergens.sort()).toEqual(['dairy', 'nuts', 'soy']);
    expect(s.additiveMaxRisk).toBe('moderate');
  });

  it('returns "none" max-risk for additive-free products', () => {
    const s = extractSignals(PRODUCT_INDEX.p_oat_crisps);
    expect(s.additiveMaxRisk).toBe('none');
    expect(s.additiveCount).toBe(0);
  });

  it('derives per-100g salt/sat-fat density from servingGrams', () => {
    const crisps = {
      id: 'x', type: 'barcode' as const, brand: 'Crisp Max', name: 'Cheese Crisps',
      subtitle: '30g', swatch: '#000', glyph: 'C',
      ingredients: ['Potatoes'], allergens: [], additives: [],
      nutrition: { serving: '30g', servingGrams: 30, kcal: 160, protein: 1.8, carbs: 14, sugar: 0.6, fat: 10.5, satFat: 1.5, fiber: 1, sodium: 200 },
      nutriScore: 'D' as const, ecoScore: null, novaGroup: 4 as const, category: 'snack' as const,
    };
    const s = extractSignals(crisps);
    // 200mg sodium / 30g * 100 = 667mg per 100g (FSA "red" salt)
    expect(s.sodiumPer100g).toBeGreaterThan(600);
    // 1.5g satFat / 30g * 100 = 5g per 100g
    expect(s.satFatPer100g).toBeCloseTo(5, 0);
  });

  it('derives energy/total-fat/fibre/protein per 100g and passes fvlPercent through', () => {
    const stew = {
      id: 'x', type: 'barcode' as const, brand: 'Hearth', name: 'Lentil Stew',
      subtitle: '400g', swatch: '#000', glyph: 'L',
      ingredients: ['Lentils', 'Tomato', 'Onion'], allergens: [], additives: [],
      nutrition: {
        serving: '200g', servingGrams: 200, kcal: 180, protein: 12, carbs: 22,
        sugar: 3, fat: 4, satFat: 0.6, fiber: 8, sodium: 240, fvlPercent: 75,
      },
      nutriScore: 'A' as const, ecoScore: null, novaGroup: 3 as const, category: 'meal' as const,
    };
    const s = extractSignals(stew);
    expect(s.energyPer100g).toBe(90);       // 180 / 200 * 100
    expect(s.totalFatPer100g).toBe(2);      // 4 / 200 * 100
    expect(s.fiberPer100g).toBe(4);         // 8 / 200 * 100
    expect(s.proteinPer100g).toBe(6);       // 12 / 200 * 100
    expect(s.fvlPercent).toBe(75);
    expect(s.transFatPer100g).toBeNull();   // no trans-fat data
  });

  it('leaves per-100g density null when no serving weight is known', () => {
    const photo = {
      id: 'p', type: 'photo' as const, brand: '', name: 'Mystery plate',
      subtitle: '', swatch: '#000', glyph: '◐', components: ['food'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated serving', kcal: 300, protein: 5, carbs: 30, sugar: 4, fat: 10, satFat: 3, fiber: 4, sodium: 250 },
      nutriScore: null, ecoScore: null, novaGroup: null, category: 'meal' as const,
    };
    const s = extractSignals(photo);
    expect(s.sodiumPer100g).toBeNull();
    expect(s.satFatPer100g).toBeNull();
  });
});
