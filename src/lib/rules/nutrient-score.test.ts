import { describe, it, expect } from 'vitest';
import {
  energyPts, satFatPts, sugarPts, sodiumPts,
  fvlPts, fibrePts, proteinPts, nutrientBase,
} from './nutrient-score';

describe('A-point ladders', () => {
  it('energy converts kcal→kJ and tiers', () => {
    expect(energyPts(0)).toBe(0);
    expect(energyPts(80)).toBe(0);    // 80kcal=334.7kJ, not >335
    expect(energyPts(89)).toBe(1);    // banana ~372kJ
    expect(energyPts(534)).toBe(6);   // crisps ~2234kJ
    expect(energyPts(900)).toBe(10);  // >3350kJ
  });
  it('sat fat tiers 1g steps', () => {
    expect(satFatPts(1)).toBe(0);
    expect(satFatPts(1.1)).toBe(1);
    expect(satFatPts(5)).toBe(4);
    expect(satFatPts(30)).toBe(10);
  });
  it('sugar tiers (value is grams; caller passes per-serving)', () => {
    expect(sugarPts(4.5)).toBe(0);
    expect(sugarPts(14)).toBe(3);
    expect(sugarPts(39)).toBe(8);
    expect(sugarPts(60)).toBe(10);
  });
  it('sodium tiers 90mg steps', () => {
    expect(sodiumPts(90)).toBe(0);
    expect(sodiumPts(91)).toBe(1);
    expect(sodiumPts(667)).toBe(7);
    expect(sodiumPts(1000)).toBe(10);
  });
});

describe('C-point ladders', () => {
  it('FVL awards 0/1/2/5 only', () => {
    expect(fvlPts(40)).toBe(0); expect(fvlPts(41)).toBe(1);
    expect(fvlPts(61)).toBe(2); expect(fvlPts(81)).toBe(5);
  });
  it('fibre AOAC + protein tiers', () => {
    expect(fibrePts(0.9)).toBe(0); expect(fibrePts(4.7)).toBe(4); expect(fibrePts(4.8)).toBe(5);
    expect(proteinPts(1.6)).toBe(0); expect(proteinPts(8)).toBe(4); expect(proteinPts(8.1)).toBe(5);
  });
});

describe('nutrientBase', () => {
  it('banana lands high (good band)', () => {
    const b = nutrientBase({ energyPer100g: 89, satFatPer100g: 0, sodiumPer100g: 1,
      sugarForScore: 14, fvlPercent: 100, fiberPer100g: 2.6, proteinPer100g: 1.3 });
    expect(b).toBeGreaterThanOrEqual(74);
  });
  it('crisps land mid/low before penalties', () => {
    const b = nutrientBase({ energyPer100g: 534, satFatPer100g: 5, sodiumPer100g: 667,
      sugarForScore: 0.6, fvlPercent: 0, fiberPer100g: 3, proteinPer100g: 6 });
    expect(b).toBeLessThanOrEqual(50);
  });
  it('protein cannot rescue a high-A food (protein cap)', () => {
    const b = nutrientBase({ energyPer100g: 534, satFatPer100g: 8, sodiumPer100g: 900,
      sugarForScore: 30, fvlPercent: 0, fiberPer100g: 0, proteinPer100g: 25 });
    expect(b).toBeLessThan(25);
  });
});
