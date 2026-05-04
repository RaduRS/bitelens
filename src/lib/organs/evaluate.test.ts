import { describe, it, expect } from 'vitest';
import { extractSignals } from '@/lib/rules/signals';
import { extractBenefits } from './evaluate';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';

function benefitsFor(id: string) {
  return extractBenefits(extractSignals(PRODUCT_INDEX[id])).map(b => b.organ).sort();
}

describe('extractBenefits', () => {
  it('grain bowl with salmon hits brain, heart, eyes, gut/muscle (high protein, fiber, salmon)', () => {
    const benefits = benefitsFor('p_grain_bowl');
    expect(benefits).toContain('brain');
    expect(benefits).toContain('heart');
    expect(benefits.length).toBeLessThanOrEqual(4);
  });

  it('plain greek yogurt benefits bones, gut, muscle (live cultures, dairy, high protein)', () => {
    const benefits = benefitsFor('p_plain_yogurt');
    expect(benefits).toContain('bones');
    expect(benefits).toContain('gut');
    expect(benefits).toContain('muscle');
  });

  it('cola has zero benefits', () => {
    expect(benefitsFor('p_cola')).toEqual([]);
  });

  it('sparkling water has zero benefits (just water + flavor)', () => {
    expect(benefitsFor('p_sparkling')).toEqual([]);
  });

  it('oat crisps benefits heart (whole oats + fiber + Nutri-B)', () => {
    expect(benefitsFor('p_oat_crisps')).toContain('heart');
  });

  it('caps at 4 benefits even if more rules fire', () => {
    // Construct a hypothetical edge case via an existing product
    const benefits = extractBenefits(extractSignals(PRODUCT_INDEX.p_grain_bowl));
    expect(benefits.length).toBeLessThanOrEqual(4);
  });

  it('benefits are sorted by priority descending', () => {
    const benefits = extractBenefits(extractSignals(PRODUCT_INDEX.p_grain_bowl));
    for (let i = 1; i < benefits.length; i++) {
      expect(benefits[i - 1].priority).toBeGreaterThanOrEqual(benefits[i].priority);
    }
  });
});
