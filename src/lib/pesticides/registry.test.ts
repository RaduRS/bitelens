import { describe, it, expect } from 'vitest';
import { lookupPesticideAdvisory, isOrganicLabelled } from './registry';

describe('lookupPesticideAdvisory', () => {
  // ── No-flag cases (must be silent — these are what protect us from false
  // positives the user explicitly worried about) ──
  it('does NOT flag strawberries (regulators tested clean)', () => {
    expect(lookupPesticideAdvisory('Strawberries 400g', 'whole_food', [])).toBeNull();
  });

  it('does NOT flag apples (regulators tested clean)', () => {
    expect(lookupPesticideAdvisory('Pink Lady Apples', 'whole_food', [])).toBeNull();
  });

  it('does NOT flag blueberries / spinach / kale (EWG list, but regulators clean)', () => {
    expect(lookupPesticideAdvisory('Blueberries 250g', 'whole_food', [])).toBeNull();
    expect(lookupPesticideAdvisory('Baby Spinach 100g', 'whole_food', [])).toBeNull();
    expect(lookupPesticideAdvisory('Curly Kale', 'whole_food', [])).toBeNull();
  });

  it('does NOT flag packaged products (additives/NOVA carry the harm signal)', () => {
    expect(lookupPesticideAdvisory('Pepper Crisps', 'snack', [])).toBeNull();
    expect(lookupPesticideAdvisory('Chilli Sauce', 'beverage', [])).toBeNull();
  });

  // ── Flag cases (regulator-confirmed exceedances) ──
  it('flags imported grapes', () => {
    const a = lookupPesticideAdvisory('Red Seedless Grapes', 'whole_food', ['en:turkey']);
    expect(a?.commodity).toBe('Imported grapes');
    expect(a?.source).toBe('UK PRiF 2024');
  });

  it('does NOT flag UK or EU grapes', () => {
    expect(lookupPesticideAdvisory('Grapes', 'whole_food', ['en:united-kingdom'])).toBeNull();
    expect(lookupPesticideAdvisory('Grapes', 'whole_food', ['en:spain'])).toBeNull();
  });

  it('flags chilli peppers regardless of origin', () => {
    expect(lookupPesticideAdvisory('Bird\'s Eye Chillies', 'whole_food', ['en:united-kingdom']))
      .toMatchObject({ commodity: 'Chilli peppers' });
    expect(lookupPesticideAdvisory('Jalapeños', 'whole_food', []))
      .toMatchObject({ commodity: 'Chilli peppers' });
  });

  it('flags sweet/bell peppers (EFSA highest non-compliance)', () => {
    expect(lookupPesticideAdvisory('Red Bell Peppers', 'whole_food', [])?.source).toMatch(/EFSA/);
    expect(lookupPesticideAdvisory('Sweet peppers', 'whole_food', [])?.source).toMatch(/EFSA/);
  });

  it('flags grapefruit', () => {
    expect(lookupPesticideAdvisory('Pink Grapefruit', 'whole_food', [])).not.toBeNull();
  });

  it('flags imported cherry tomatoes but not UK ones', () => {
    expect(lookupPesticideAdvisory('Cherry Tomatoes', 'whole_food', ['en:morocco']))
      .toMatchObject({ commodity: 'Imported cherry tomatoes' });
    expect(lookupPesticideAdvisory('Cherry Tomatoes', 'whole_food', ['en:united-kingdom']))
      .toBeNull();
  });

  it('flags imported cucumbers but not UK ones', () => {
    expect(lookupPesticideAdvisory('Cucumber', 'whole_food', ['en:spain', 'en:netherlands']))
      .toBeNull(); // Spain + NL are EU
    expect(lookupPesticideAdvisory('Cucumber', 'whole_food', ['en:turkey']))
      .toMatchObject({ commodity: 'Imported cucumbers' });
  });

  it('treats missing origin info as worst-case (imported)', () => {
    expect(lookupPesticideAdvisory('Cherry Tomatoes', 'whole_food', [])).not.toBeNull();
    expect(lookupPesticideAdvisory('Cucumber', 'whole_food', [])).not.toBeNull();
  });
});

describe('isOrganicLabelled', () => {
  it('detects common organic certification tags', () => {
    expect(isOrganicLabelled(['en:organic'])).toBe(true);
    expect(isOrganicLabelled(['en:eu-organic'])).toBe(true);
    expect(isOrganicLabelled(['en:usda-organic'])).toBe(true);
    expect(isOrganicLabelled(['en:soil-association-organic-standard'])).toBe(true);
  });

  it('returns false for unrelated tags', () => {
    expect(isOrganicLabelled(['en:vegan', 'en:gluten-free'])).toBe(false);
    expect(isOrganicLabelled([])).toBe(false);
  });
});
