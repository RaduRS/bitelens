import { describe, it, expect } from 'vitest';
import { evaluate } from './engine';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';
import { DEFAULT_PROFILE } from '@/types/profile';
import type { Product } from '@/types/product';

describe('evaluate', () => {
  it('cola is Avoid with a near-zero score (severe sugar + bad additive + ultra-processed)', () => {
    const r = evaluate(PRODUCT_INDEX.p_cola, DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
    expect(r.score).toBeLessThan(15);
    expect(r.triggeredRuleIds).toContain('sugar_severe');
    expect(r.triggeredRuleIds).toContain('additive_high_risk');
    expect(r.triggeredRuleIds).toContain('ultra_processed');
    expect(r.triggeredRuleIds).toContain('nutri_score_e');
  });

  it('strawberry yogurt is Caution', () => {
    const r = evaluate(PRODUCT_INDEX.p_strawberry_yogurt, DEFAULT_PROFILE);
    expect(r.verdict).toBe('caution');
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.score).toBeLessThan(70);
  });

  it('plain yogurt is Good', () => {
    const r = evaluate(PRODUCT_INDEX.p_plain_yogurt, DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(70);
  });

  it('sparkling water is Good with positives', () => {
    const r = evaluate(PRODUCT_INDEX.p_sparkling, DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.reasons.some(x => x.kind === 'pos')).toBe(true);
  });

  it('keto diet penalises high-carb products', () => {
    const r = evaluate(PRODUCT_INDEX.p_strawberry_yogurt, { ...DEFAULT_PROFILE, diet: 'keto' });
    expect(r.triggeredRuleIds).toContain('diet_keto_breach');
  });

  it('low-carb diet only flags clearly carb-heavy products', () => {
    // Cola at 39g carbs/serving should breach.
    const lc = evaluate(PRODUCT_INDEX.p_cola, { ...DEFAULT_PROFILE, diet: 'low_carb' });
    expect(lc.triggeredRuleIds).toContain('diet_low_carb_breach');
    // Oat crisps at 18g carbs/serving should not.
    const ok = evaluate(PRODUCT_INDEX.p_oat_crisps, { ...DEFAULT_PROFILE, diet: 'low_carb' });
    expect(ok.triggeredRuleIds).not.toContain('diet_low_carb_breach');
  });

  it('caps photo products at 75 even when no negative rule fires', () => {
    const photoProduct: Product = {
      id: 'photo_test', type: 'photo', brand: '', name: 'Pristine Bowl',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Quinoa', 'Spinach', 'Avocado'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated', kcal: 400, protein: 12, carbs: 50, sugar: 3, fat: 14, satFat: 2, fiber: 8, sodium: 200 },
      nutriScore: null, ecoScore: null, novaGroup: null,
      confidence: 0.9,
    };
    const r = evaluate(photoProduct, DEFAULT_PROFILE);
    expect(r.score).toBe(75);
  });

  it('caps barcode products with no Nutri-Score and no NOVA at 80', () => {
    const product: Product = {
      ...PRODUCT_INDEX.p_oat_crisps,
      nutriScore: null,
      novaGroup: null,
    };
    const r = evaluate(product, DEFAULT_PROFILE);
    expect(r.score).toBeLessThanOrEqual(80);
  });

  it('caps barcode products missing one of Nutri-Score/NOVA at 90', () => {
    const product: Product = {
      ...PRODUCT_INDEX.p_oat_crisps,
      nutriScore: null,
    };
    const r = evaluate(product, DEFAULT_PROFILE);
    expect(r.score).toBeLessThanOrEqual(90);
  });

  it('Haribo-style candy photo is Avoid (sub-40), not Good', () => {
    const r = evaluate(PRODUCT_INDEX.p_haribo_photo, DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
    expect(r.score).toBeLessThan(40);
    expect(r.triggeredRuleIds).toContain('category_candy');
    expect(r.triggeredRuleIds).toContain('ultra_processed');
    // Density catches the "small serving + intensely sweet" trap.
    expect(r.triggeredRuleIds).toContain('sugar_density_severe');
    // Refined-sugar markers in the AI-detected components.
    expect(r.triggeredRuleIds).toContain('refined_sugar_ingredient');
    // Empty/light additive list must NOT earn the "no additives detected" pat.
    expect(r.triggeredRuleIds).not.toContain('pos_no_additives');
  });

  it('photos labelled candy/dessert can never reach the Good band', () => {
    const r = evaluate(PRODUCT_INDEX.p_haribo_photo, DEFAULT_PROFILE);
    expect(r.score).toBeLessThan(70);
  });

  it('apple+banana whole_food photo lands in the Good band, not Caution', () => {
    const fruitPhoto: Product = {
      id: 'photo_fruit', type: 'photo', brand: '', name: 'Apple and banana',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Apple', 'Banana'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated serving', kcal: 200, protein: 2, carbs: 52, sugar: 33, fat: 0.6, satFat: 0.2, fiber: 7, sodium: 2 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.9,
    };
    const r = evaluate(fruitPhoto, DEFAULT_PROFILE);
    expect(r.verdict).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.triggeredRuleIds).not.toContain('sugar_severe');
    expect(r.triggeredRuleIds).not.toContain('sugar_high');
    expect(r.triggeredRuleIds).toContain('pos_whole_food');
    expect(r.triggeredRuleIds).toContain('pos_high_fiber');
  });

  it('processed-meat photo flags the IARC Group 1 carcinogen risk', () => {
    const baconPhoto: Product = {
      id: 'photo_bacon', type: 'photo', brand: '', name: 'Bacon strips',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Bacon strips'],
      allergens: [],
      additives: [
        { code: 'E250', name: 'Sodium nitrite', risk: 'high', detail: 'In cured meat, forms nitrosamines. Processed meat is IARC Group 1.' },
      ],
      nutrition: { serving: 'Estimated', kcal: 250, protein: 18, carbs: 1, sugar: 0, fat: 20, satFat: 7, fiber: 0, sodium: 900 },
      nutriScore: null, ecoScore: null, novaGroup: 4, category: 'processed_meat',
      confidence: 0.9,
    };
    const r = evaluate(baconPhoto, DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
    expect(r.triggeredRuleIds).toContain('category_processed_meat');
    expect(r.triggeredRuleIds).toContain('additive_high_risk');
  });
});
