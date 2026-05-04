import { describe, it, expect } from 'vitest';
import { buildCompareRows, pickOverallWinner } from './rows';
import { PRODUCT_INDEX } from '@/fixtures/sample-products';

const yogurt = PRODUCT_INDEX.p_strawberry_yogurt;
const cola = PRODUCT_INDEX.p_cola;
const oats = PRODUCT_INDEX.p_oat_crisps;

describe('buildCompareRows', () => {
  it('emits all expected metric labels in order', () => {
    const rows = buildCompareRows({ a: yogurt, scoreA: 60, b: cola, scoreB: 30 });
    expect(rows.map(r => r.label)).toEqual([
      'Score', 'Nutri-Score', 'NOVA',
      'Calories', 'Sugar', 'Protein', 'Sodium', 'Fiber', 'Additives',
    ]);
  });

  it('marks higher score as winner', () => {
    const rows = buildCompareRows({ a: yogurt, scoreA: 60, b: cola, scoreB: 30 });
    const score = rows.find(r => r.label === 'Score')!;
    expect(score.winner).toBe('a');
    expect(score.valueA).toBe(60);
    expect(score.valueB).toBe(30);
  });

  it('treats lower Nutri-Score letter as winner (A beats E)', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Nutri-Score')!.winner).toBe('a');
  });

  it('returns no winner for Nutri-Score when one side is null', () => {
    const noScore = { ...yogurt, nutriScore: null };
    const rows = buildCompareRows({ a: noScore, scoreA: 50, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Nutri-Score')!.winner).toBeNull();
  });

  it('treats lower NOVA group as winner (less processed)', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'NOVA')!.winner).toBe('a');
  });

  it('declares no winner on Calories (informational)', () => {
    const rows = buildCompareRows({ a: yogurt, scoreA: 50, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Calories')!.winner).toBeNull();
  });

  it('treats lower Sugar/Sodium as winner', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Sugar')!.winner).toBe('a');
    expect(rows.find(r => r.label === 'Sodium')!.winner).toBe('b');
  });

  it('treats higher Protein/Fiber as winner', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Protein')!.winner).toBe('a');
    expect(rows.find(r => r.label === 'Fiber')!.winner).toBe('a');
  });

  it('treats fewer additives as winner', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    expect(rows.find(r => r.label === 'Additives')!.valueA).toBe(0);
    expect(rows.find(r => r.label === 'Additives')!.valueB).toBe(2);
    expect(rows.find(r => r.label === 'Additives')!.winner).toBe('a');
  });

  it('emits no winner when values tie', () => {
    const rows = buildCompareRows({ a: yogurt, scoreA: 50, b: yogurt, scoreB: 50 });
    expect(rows.find(r => r.label === 'Score')!.winner).toBeNull();
    expect(rows.find(r => r.label === 'Sugar')!.winner).toBeNull();
  });

  it('attaches units where the design expects them', () => {
    const rows = buildCompareRows({ a: oats, scoreA: 80, b: cola, scoreB: 20 });
    const byLabel = Object.fromEntries(rows.map(r => [r.label, r.unit]));
    expect(byLabel['Calories']).toBe('kcal');
    expect(byLabel['Sugar']).toBe('g');
    expect(byLabel['Protein']).toBe('g');
    expect(byLabel['Sodium']).toBe('mg');
    expect(byLabel['Fiber']).toBe('g');
    expect(byLabel['Score']).toBeUndefined();
  });
});

describe('pickOverallWinner', () => {
  it('picks A when score A is higher', () => {
    expect(pickOverallWinner(80, 30)).toBe('a');
  });
  it('picks B when score B is higher', () => {
    expect(pickOverallWinner(20, 80)).toBe('b');
  });
  it('returns null on tie', () => {
    expect(pickOverallWinner(50, 50)).toBeNull();
  });
});
