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
});
