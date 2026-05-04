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
});
