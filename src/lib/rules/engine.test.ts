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
      nutrition: { serving: 'Estimated serving', servingGrams: 230, kcal: 200, protein: 2, carbs: 52, sugar: 33, fat: 0.6, satFat: 0.2, fiber: 7, sodium: 2 },
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

  it('low-sugar goal does not breach on whole fruit (banana)', () => {
    const banana: Product = {
      id: 'p_banana_test', type: 'barcode', brand: 'X', name: 'Banana',
      subtitle: '', swatch: '#fff', glyph: 'B',
      ingredients: ['Banana'], allergens: [], additives: [],
      nutrition: { serving: '100g', kcal: 89, protein: 1, carbs: 23, sugar: 12, fat: 0, satFat: 0, fiber: 2.6, sodium: 1 },
      nutriScore: 'A', ecoScore: 'A', novaGroup: 1, category: 'whole_food',
    };
    const r = evaluate(banana, { ...DEFAULT_PROFILE, goals: ['low_sugar'] });
    expect(r.triggeredRuleIds).not.toContain('goal_low_sugar_breach');
    expect(r.verdict).toBe('good');
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

  it('imported chilli pepper photo triggers the residue advisory', () => {
    const chilli: Product = {
      id: 'photo_chilli', type: 'photo', brand: '', name: "Bird's eye chillies",
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ["Bird's eye chillies"],
      allergens: [], additives: [],
      nutrition: { serving: 'Estimated', kcal: 40, protein: 2, carbs: 9, sugar: 5, fat: 0.5, satFat: 0, fiber: 1.5, sodium: 7 },
      nutriScore: null, ecoScore: null, novaGroup: 1, category: 'whole_food',
      confidence: 0.9,
      pesticideAdvisory: { commodity: 'Chilli peppers', source: 'UK PRiF 2024', detail: 'flagged' },
    };
    const r = evaluate(chilli, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('commodity_elevated_residue');
  });

  it('strawberries do NOT get a residue advisory (false-positive guard)', () => {
    const strawberry: Product = {
      id: 'p_strawberry', type: 'barcode', brand: 'Asda', name: 'Strawberries',
      subtitle: '400g', swatch: '#fff', glyph: 'S',
      ingredients: ['Strawberries'], allergens: [], additives: [],
      nutrition: { serving: '100g', kcal: 32, protein: 0.7, carbs: 7.7, sugar: 4.9, fat: 0.3, satFat: 0, fiber: 2, sodium: 1 },
      nutriScore: 'A', ecoScore: 'A', novaGroup: 1, category: 'whole_food',
      pesticideAdvisory: null,
    };
    const r = evaluate(strawberry, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).not.toContain('commodity_elevated_residue');
  });

  it('certified-organic product gets a positive', () => {
    const organic: Product = {
      id: 'p_organic', type: 'barcode', brand: 'Riverford', name: 'Organic Cucumber',
      subtitle: '1 each', swatch: '#fff', glyph: 'C',
      ingredients: ['Organic cucumber'], allergens: [], additives: [],
      nutrition: { serving: '100g', kcal: 16, protein: 0.7, carbs: 3.6, sugar: 1.7, fat: 0.1, satFat: 0, fiber: 0.5, sodium: 1 },
      nutriScore: 'A', ecoScore: 'A', novaGroup: 1, category: 'whole_food',
      isOrganic: true,
      pesticideAdvisory: null,
    };
    const r = evaluate(organic, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('pos_organic_certified');
    expect(r.verdict).toBe('good');
  });

  it('a bag of crisps is Avoid — salt registers on a per-100g basis', () => {
    const crisps: Product = {
      id: 'p_crisp_max', type: 'barcode', brand: 'Crisp Max', name: 'Cheese Crisps',
      subtitle: '30g bag', swatch: '#caa', glyph: 'C',
      ingredients: ['Potatoes', 'Sunflower oil', 'Cheese powder (milk)', 'Whey powder (milk)', 'Salt', 'Flavouring'],
      allergens: ['dairy'],
      additives: [
        { code: 'E621', name: 'Monosodium glutamate', risk: 'moderate', detail: '' },
        { code: 'E627', name: 'Disodium guanylate', risk: 'low', detail: '' },
        { code: 'E631', name: 'Disodium inosinate', risk: 'low', detail: '' },
      ],
      // OFF reports a 30g serving; ~0.5g salt/serving = ~1.7g salt/100g (FSA red).
      nutrition: { serving: '30g', servingGrams: 30, kcal: 160, protein: 1.8, carbs: 14, sugar: 0.6, fat: 10.5, satFat: 1.5, fiber: 1, sodium: 200 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'snack',
    };
    const r = evaluate(crisps, DEFAULT_PROFILE);
    expect(r.verdict).toBe('avoid');
    expect(r.score).toBeLessThan(40);
    expect(r.triggeredRuleIds).toContain('sodium_high');
  });

  it('does not credit a bones benefit to cheese-flavoured ultra-processed crisps', () => {
    const crisps: Product = {
      id: 'p_crisp_max2', type: 'barcode', brand: 'Crisp Max', name: 'Cheese Crisps',
      subtitle: '30g bag', swatch: '#caa', glyph: 'C',
      ingredients: ['Potatoes', 'Sunflower oil', 'Cheese powder (milk)', 'Whey powder (milk)', 'Salt', 'Flavouring'],
      allergens: ['dairy'], additives: [],
      nutrition: { serving: '30g', servingGrams: 30, kcal: 160, protein: 1.8, carbs: 14, sugar: 0.6, fat: 10.5, satFat: 1.5, fiber: 1, sodium: 200 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'snack',
    };
    const r = evaluate(crisps, DEFAULT_PROFILE);
    expect(r.benefits.map(b => b.organ)).not.toContain('bones');
  });

  it('a photo snack with a known serving weight gets the per-100g salt penalty', () => {
    const cracker: Product = {
      id: 'photo_cracker', type: 'photo', brand: '', name: 'Salted crackers',
      subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
      components: ['Wheat crackers', 'Salt'],
      allergens: ['gluten'], additives: [],
      nutrition: { serving: 'Estimated serving', servingGrams: 30, kcal: 130, protein: 3, carbs: 22, sugar: 1, fat: 4, satFat: 1, fiber: 1, sodium: 250 },
      nutriScore: null, ecoScore: null, novaGroup: 3, category: 'snack',
      confidence: 0.85,
    };
    const r = evaluate(cracker, DEFAULT_PROFILE);
    // 250mg / 30g * 100 = 833mg per 100g → FSA "red" salt
    expect(r.triggeredRuleIds).toContain('sodium_high');
  });

  it('penalises calorie-dense formulated food and exempts energy-dense whole foods', () => {
    const biscuit: Product = {
      id: 'p_biscuit', type: 'barcode', brand: 'Snap', name: 'Choc Biscuits',
      subtitle: '40g', swatch: '#000', glyph: 'B',
      ingredients: ['Wheat flour', 'Sugar', 'Palm oil'], allergens: ['gluten'], additives: [],
      nutrition: { serving: '40g', servingGrams: 40, kcal: 222, protein: 2, carbs: 28, sugar: 12, fat: 11, satFat: 5, fiber: 1, sodium: 100 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'baked_good',
    };
    // 222 / 40 * 100 = 555 kcal/100g → energy_high
    expect(evaluate(biscuit, DEFAULT_PROFILE).triggeredRuleIds).toContain('energy_high');

    const almonds: Product = {
      id: 'p_almonds', type: 'barcode', brand: 'Raw', name: 'Almonds',
      subtitle: '30g', swatch: '#000', glyph: 'A',
      ingredients: ['Almonds'], allergens: ['nuts'], additives: [],
      nutrition: { serving: '30g', servingGrams: 30, kcal: 174, protein: 6, carbs: 6, sugar: 1, fat: 15, satFat: 1, fiber: 4, sodium: 0 },
      nutriScore: 'A', ecoScore: null, novaGroup: 1, category: 'whole_food',
    };
    expect(evaluate(almonds, DEFAULT_PROFILE).triggeredRuleIds).not.toContain('energy_high');
  });

  it('flags industrial trans fat as a severe harm', () => {
    const margarine: Product = {
      id: 'p_phos', type: 'barcode', brand: 'OldSpread', name: 'Baking Spread',
      subtitle: '250g', swatch: '#000', glyph: 'S',
      ingredients: ['Partially hydrogenated vegetable oil', 'Water', 'Salt'],
      allergens: [], additives: [],
      nutrition: { serving: '10g', servingGrams: 10, kcal: 72, protein: 0, carbs: 0, sugar: 0, fat: 8, satFat: 2, fiber: 0, sodium: 80 },
      nutriScore: 'E', ecoScore: null, novaGroup: 4, category: null,
    };
    const r = evaluate(margarine, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('trans_fat_ingredient');
    expect(r.verdict).toBe('avoid');

    const product: Product = {
      ...margarine, id: 'p_tf', ingredients: ['Vegetable oil'],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 500, protein: 1, carbs: 2, sugar: 1, fat: 50, satFat: 10, fiber: 0, sodium: 80, transFat: 1.5 },
    };
    expect(evaluate(product, DEFAULT_PROFILE).triggeredRuleIds).toContain('trans_fat_high');
  });

  it('applies FSA total-fat penalty per 100g, whole-food exempt', () => {
    const sauce: Product = {
      id: 'p_sauce', type: 'barcode', brand: 'Rich', name: 'Cheese Sauce',
      subtitle: '100g', swatch: '#000', glyph: 'S',
      ingredients: ['Cream', 'Cheese', 'Starch'], allergens: ['dairy'], additives: [],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 300, protein: 5, carbs: 6, sugar: 2, fat: 28, satFat: 4, fiber: 0, sodium: 300 },
      nutriScore: 'D', ecoScore: null, novaGroup: 3, category: null,
    };
    expect(evaluate(sauce, DEFAULT_PROFILE).triggeredRuleIds).toContain('total_fat_high');

    const avocado: Product = {
      id: 'p_avo', type: 'barcode', brand: 'Fresh', name: 'Avocado',
      subtitle: '1 each', swatch: '#000', glyph: 'A',
      ingredients: ['Avocado'], allergens: [], additives: [],
      nutrition: { serving: '100g', servingGrams: 100, kcal: 160, protein: 2, carbs: 9, sugar: 1, fat: 15, satFat: 2, fiber: 7, sodium: 7 },
      nutriScore: 'A', ecoScore: null, novaGroup: 1, category: 'whole_food',
    };
    expect(evaluate(avocado, DEFAULT_PROFILE).triggeredRuleIds).not.toContain('total_fat_high');
  });

  it('treats snack as a capped processed category with no green low-sugar flag', () => {
    const crackers: Product = {
      id: 'p_crackers', type: 'barcode', brand: 'Crackly', name: 'Cream Crackers',
      subtitle: '25g', swatch: '#000', glyph: 'C',
      ingredients: ['Wheat flour', 'Vegetable oil', 'Salt'], allergens: ['gluten'], additives: [],
      nutrition: { serving: '25g', servingGrams: 25, kcal: 110, protein: 2, carbs: 18, sugar: 1, fat: 3, satFat: 1, fiber: 1, sodium: 120 },
      nutriScore: 'C', ecoScore: null, novaGroup: 4, category: 'snack',
    };
    const r = evaluate(crackers, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('category_snack');
    expect(r.triggeredRuleIds).not.toContain('pos_low_sugar');
    expect(r.score).toBeLessThanOrEqual(55);
  });

  it('exempts nut/seed-based foods from energy + total-fat penalties (healthy fats)', () => {
    const saltedAlmonds: Product = {
      id: 'p_saltalm', type: 'barcode', brand: 'Nutty', name: 'Salted Almonds',
      subtitle: '30g', swatch: '#000', glyph: 'A',
      ingredients: ['Almonds', 'Salt'], allergens: ['nuts'], additives: [],
      nutrition: { serving: '30g', servingGrams: 30, kcal: 180, protein: 6, carbs: 2, sugar: 1, fat: 16, satFat: 1, fiber: 3, sodium: 150 },
      nutriScore: 'C', ecoScore: null, novaGroup: 4, category: 'snack',
    };
    const r = evaluate(saltedAlmonds, DEFAULT_PROFILE);
    // 600 kcal/100g and 53g fat/100g, but nut-based → not penalised on those axes
    expect(r.triggeredRuleIds).not.toContain('energy_high');
    expect(r.triggeredRuleIds).not.toContain('total_fat_high');
    // Still a salty processed snack — caution, not a rock-bottom avoid like cola.
    expect(r.verdict).not.toBe('good');
    expect(r.score).toBeGreaterThan(15);
  });

  it('lets positives offset penalties for minimally-processed food', () => {
    const stew: Product = {
      id: 'p_stew', type: 'barcode', brand: 'Hearth', name: 'Lentil Stew',
      subtitle: '400g', swatch: '#000', glyph: 'L',
      ingredients: ['Lentils', 'Tomato', 'Onion', 'Olive oil'], allergens: [], additives: [],
      nutrition: { serving: '200g', servingGrams: 200, kcal: 180, protein: 12, carbs: 22, sugar: 3, fat: 4, satFat: 0.6, fiber: 8, sodium: 360, fvlPercent: 75 },
      nutriScore: 'A', ecoScore: null, novaGroup: 3, category: 'meal',
    };
    const r = evaluate(stew, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).toContain('pos_high_fiber');
    expect(r.triggeredRuleIds).toContain('pos_fvl_content');
    expect(r.verdict).toBe('good');
  });

  it('does NOT let positives rescue an ultra-processed product', () => {
    const bar: Product = {
      id: 'p_fortbar', type: 'barcode', brand: 'GymCo', name: 'Fortified Candy Bar',
      subtitle: '60g', swatch: '#000', glyph: 'B',
      ingredients: ['Glucose syrup', 'Sugar', 'Soy protein isolate', 'Inulin'], allergens: ['soy'], additives: [],
      nutrition: { serving: '60g', servingGrams: 60, kcal: 300, protein: 20, carbs: 40, sugar: 30, fat: 8, satFat: 4, fiber: 9, sodium: 200, fvlPercent: 0 },
      nutriScore: 'D', ecoScore: null, novaGroup: 4, category: 'candy',
    };
    const r = evaluate(bar, DEFAULT_PROFILE);
    expect(r.triggeredRuleIds).not.toContain('pos_high_protein');
    expect(r.triggeredRuleIds).not.toContain('pos_high_fiber');
    expect(r.verdict).toBe('avoid');
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
