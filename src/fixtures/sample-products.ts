import type { Product } from '@/types/product';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'p_oat_crisps', type: 'barcode', favorite: true,
    brand: 'Stoneground', name: 'Sea Salt Oat Crisps',
    subtitle: 'Sea Salt · 150g', swatch: '#c9a86b', glyph: 'O',
    ingredients: ['Whole oats', 'Sunflower oil', 'Brown rice flour', 'Sea salt', 'Rosemary extract'],
    allergens: ['gluten'], additives: [],
    nutrition: { serving: '30g (≈12 crisps)', kcal: 128, protein: 4.2, carbs: 18, sugar: 1.2, fat: 4.1, satFat: 0.6, fiber: 2.8, sodium: 180 },
    nutriScore: 'B', ecoScore: 'B', novaGroup: 2,
    timeAgo: 'Just now',
  },
  {
    id: 'p_strawberry_yogurt', type: 'barcode',
    brand: 'Meadow Cup', name: 'Strawberry Cream Yogurt',
    subtitle: 'Lowfat · 150g cup', swatch: '#e8a3a3', glyph: 'Y',
    ingredients: ['Lowfat milk', 'Sugar', 'Strawberry puree (8%)', 'Modified corn starch', 'Pectin', 'Natural flavor', 'Live cultures'],
    allergens: ['dairy'],
    additives: [
      { code: 'E1442', name: 'Hydroxypropyl distarch phosphate', risk: 'low', detail: 'Modified starch used as a thickener. Generally safe but indicates ultra-processing.' },
      { code: 'E440', name: 'Pectin', risk: 'none', detail: 'Natural fiber from fruit, used as gelling agent. Considered safe.' },
    ],
    nutrition: { serving: '150g cup', kcal: 142, protein: 6.0, carbs: 22, sugar: 18, fat: 2.4, satFat: 1.5, fiber: 0.4, sodium: 75 },
    nutriScore: 'C', ecoScore: 'C', novaGroup: 4,
    alternatives: ['p_plain_yogurt'], timeAgo: '12 min ago',
  },
  {
    id: 'p_cola', type: 'barcode',
    brand: 'Crestwave', name: 'Citrus Cola Original',
    subtitle: 'Carbonated · 355ml can', swatch: '#3a2418', glyph: 'C',
    ingredients: ['Carbonated water', 'High-fructose corn syrup', 'Caramel color (E150d)', 'Phosphoric acid', 'Natural flavors', 'Caffeine'],
    allergens: [],
    additives: [
      { code: 'E150d', name: 'Caramel color (Class IV)', risk: 'high', detail: 'Sulphite ammonia caramel. Trace 4-MEI is classified by IARC as possibly carcinogenic.' },
      { code: 'E338', name: 'Phosphoric acid', risk: 'moderate', detail: 'Strong acidity associated with enamel erosion and reduced calcium absorption.' },
    ],
    nutrition: { serving: '355ml can', kcal: 155, protein: 0, carbs: 39, sugar: 39, fat: 0, satFat: 0, fiber: 0, sodium: 45 },
    nutriScore: 'E', ecoScore: 'D', novaGroup: 4,
    alternatives: ['p_sparkling', 'p_kombucha'], timeAgo: '1 hr ago',
  },
  {
    id: 'p_grain_bowl', type: 'photo', brand: '', name: 'Grain bowl with salmon',
    subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
    components: ['Salmon (≈110g)', 'Quinoa', 'Mixed greens', 'Avocado', 'Cherry tomatoes', 'Lemon-tahini dressing'],
    allergens: ['fish', 'sesame'], additives: [],
    nutrition: { serving: 'Estimated bowl', kcal: 520, protein: 28, carbs: 48, sugar: 6, fat: 22, satFat: 4, fiber: 9, sodium: 480 },
    nutriScore: 'A', ecoScore: 'A', novaGroup: 1, confidence: 0.86, timeAgo: '3 hrs ago',
  },
  {
    id: 'p_protein_bar', type: 'barcode',
    brand: 'Vertex', name: 'Almond Cocoa Protein Bar',
    subtitle: 'Snack · 50g bar', swatch: '#5a4030', glyph: 'P',
    ingredients: ['Whey protein blend', 'Almonds', 'Maltitol syrup', 'Cocoa', 'Soy lecithin', 'Natural flavor'],
    allergens: ['dairy', 'nuts', 'soy'],
    additives: [
      { code: 'E965', name: 'Maltitol', risk: 'moderate', detail: 'Sugar alcohol. Can cause bloating, gas, or diarrhea in larger amounts.' },
      { code: 'E322', name: 'Soy lecithin', risk: 'low', detail: 'Common emulsifier derived from soy. Generally recognized as safe.' },
    ],
    nutrition: { serving: '50g bar', kcal: 198, protein: 12, carbs: 22, sugar: 5, fat: 9, satFat: 3, fiber: 5, sodium: 140 },
    nutriScore: 'C', ecoScore: 'C', novaGroup: 4, timeAgo: 'Yesterday',
  },
  {
    id: 'p_sparkling', type: 'barcode', favorite: true,
    brand: 'Rivermark', name: 'Cucumber Mint Sparkling',
    subtitle: 'Beverage · 330ml', swatch: '#9bbf9b', glyph: 'S',
    ingredients: ['Carbonated water', 'Natural cucumber flavor', 'Natural mint flavor'],
    allergens: [], additives: [],
    nutrition: { serving: '330ml can', kcal: 0, protein: 0, carbs: 0, sugar: 0, fat: 0, satFat: 0, fiber: 0, sodium: 15 },
    nutriScore: 'A', ecoScore: 'A', novaGroup: 1, timeAgo: 'Yesterday',
  },
  {
    id: 'p_plain_yogurt', type: 'barcode',
    brand: 'Meadow Cup', name: 'Plain Greek Yogurt',
    subtitle: 'Whole milk · 170g cup', swatch: '#f5ecd9', glyph: 'G',
    ingredients: ['Pasteurized whole milk', 'Live active cultures'],
    allergens: ['dairy'], additives: [],
    nutrition: { serving: '170g cup', kcal: 120, protein: 15, carbs: 5, sugar: 5, fat: 5, satFat: 3, fiber: 0, sodium: 50 },
    nutriScore: 'A', ecoScore: 'B', novaGroup: 1, timeAgo: '2 days ago',
  },
  {
    id: 'p_kombucha', type: 'barcode',
    brand: 'Fermentry', name: 'Ginger Kombucha',
    subtitle: 'Fermented tea · 330ml', swatch: '#c89860', glyph: 'K',
    ingredients: ['Filtered water', 'Black tea', 'Cane sugar', 'Ginger root', 'Live kombucha cultures'],
    allergens: [], additives: [],
    nutrition: { serving: '330ml bottle', kcal: 38, protein: 0, carbs: 9, sugar: 4, fat: 0, satFat: 0, fiber: 0, sodium: 10 },
    nutriScore: 'B', ecoScore: 'A', novaGroup: 3, timeAgo: '3 days ago',
  },
  {
    // Photo-flow Haribo Starmix at a typical 25g serving (~8 sweets).
    // Mirrors what gpt-5-nano now returns when asked for category/processing/flagged.
    id: 'p_haribo_photo', type: 'photo', brand: '', name: 'Haribo Starmix gummies',
    subtitle: 'Photo · detected meal', swatch: '#7a8a5e', glyph: '◐',
    components: ['Gummy candies', 'Glucose syrup', 'Sugar', 'Gelatine'],
    allergens: [],
    additives: [
      { code: 'E330', name: 'Citric acid', risk: 'none', detail: 'Naturally occurring acid widely used as acidulant/preservative. Safe.' },
    ],
    nutrition: { serving: 'Estimated serving', kcal: 86, protein: 1.5, carbs: 19, sugar: 11.5, fat: 0, satFat: 0, fiber: 0, sodium: 5 },
    nutriScore: null, ecoScore: null, novaGroup: 4, category: 'candy',
    confidence: 0.85,
  },
];

export const PRODUCT_INDEX: Record<string, Product> =
  Object.fromEntries(SAMPLE_PRODUCTS.map(p => [p.id, p]));
