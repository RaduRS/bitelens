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

  it('whole_food photo with naturally high sodium is not penalised (smoked salmon)', () => {
    const wholeFood: Product = {
      id: 'photo_salmon', type: 'photo', brand: '', name: 'Smoked salmon',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Smoked salmon'],
      allergens: ['fish'], additives: [],
      nutrition: { serving: 'Estimated', kcal: 180, protein: 22, carbs: 0, sugar: 0, fat: 10, satFat: 2, fiber: 0, sodium: 850 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.9,
    };
    const r = evaluate(wholeFood, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).not.toContain('sodium_high');
    expect(r.triggeredRuleIds).not.toContain('sodium_moderate');
    expect(r.verdict).toBe('good');
  });

  it('whole_food photo with naturally high sat fat is not penalised (coconut, fatty meat)', () => {
    const wholeFood: Product = {
      id: 'photo_coconut', type: 'photo', brand: '', name: 'Fresh coconut',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Coconut flesh'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated', kcal: 350, protein: 3, carbs: 15, sugar: 6, fat: 33, satFat: 30, fiber: 9, sodium: 20 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.9,
    };
    const r = evaluate(wholeFood, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).not.toContain('satfat_high');
    expect(r.triggeredRuleIds).not.toContain('satfat_moderate');
    expect(r.verdict).toBe('good');
  });

  it('low-confidence photo cannot reach the Good band even with no negatives', () => {
    const lowConfPhoto: Product = {
      id: 'photo_blurry', type: 'photo', brand: '', name: 'Unclear food',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Salad'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated', kcal: 200, protein: 5, carbs: 30, sugar: 4, fat: 5, satFat: 1, fiber: 6, sodium: 200 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.25,
    };
    const r = evaluate(lowConfPhoto, DEFAULT_PROFILE);
    expect(r.score).toBeLessThanOrEqual(60);
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
    expect(r.score).toBe(100);
    expect(r.triggeredRuleIds).not.toContain('sugar_severe');
    expect(r.triggeredRuleIds).not.toContain('sugar_high');
    expect(r.triggeredRuleIds).toContain('pos_whole_food');
    expect(r.triggeredRuleIds).toContain('pos_high_fiber');
  });

  it('a clean whole-food photo with zero negatives scores a perfect 100', () => {
    const broccoli: Product = {
      id: 'photo_broccoli', type: 'photo', brand: '', name: 'Raw broccoli',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Broccoli florets'],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated', kcal: 30, protein: 2.5, carbs: 6, sugar: 1.5, fat: 0, satFat: 0, fiber: 2.4, sodium: 30 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.9,
    };
    const r = evaluate(broccoli, DEFAULT_PROFILE);
    expect(r.score).toBe(100);
    expect(r.verdict).toBe('good');
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
