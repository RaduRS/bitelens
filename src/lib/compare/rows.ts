import type { Product } from '@/types/product';

export type Side = 'a' | 'b';

export interface CompareRow {
  label: string;
  valueA: string | number;
  valueB: string | number;
  unit?: string;
  winner: Side | null;
}

interface BuildArgs {
  a: Product;
  scoreA: number;
  b: Product;
  scoreB: number;
}

const NUTRI_ORDER = 'ABCDE';

function nutriRank(grade: Product['nutriScore']): number | null {
  if (!grade) return null;
  const idx = NUTRI_ORDER.indexOf(grade);
  return idx >= 0 ? idx : null;
}

function lowerIsBetter(av: number, bv: number): Side | null {
  if (av === bv) return null;
  return av < bv ? 'a' : 'b';
}

function higherIsBetter(av: number, bv: number): Side | null {
  if (av === bv) return null;
  return av > bv ? 'a' : 'b';
}

export function buildCompareRows({ a, scoreA, b, scoreB }: BuildArgs): CompareRow[] {
  const rows: CompareRow[] = [];

  rows.push({
    label: 'Score',
    valueA: scoreA,
    valueB: scoreB,
    winner: higherIsBetter(scoreA, scoreB),
  });

  const nutriA = nutriRank(a.nutriScore);
  const nutriB = nutriRank(b.nutriScore);
  rows.push({
    label: 'Nutri-Score',
    valueA: a.nutriScore ?? '—',
    valueB: b.nutriScore ?? '—',
    winner: nutriA === null || nutriB === null ? null : lowerIsBetter(nutriA, nutriB),
  });

  rows.push({
    label: 'NOVA',
    valueA: a.novaGroup ?? '—',
    valueB: b.novaGroup ?? '—',
    winner:
      a.novaGroup == null || b.novaGroup == null
        ? null
        : lowerIsBetter(a.novaGroup, b.novaGroup),
  });

  rows.push({
    label: 'Calories',
    valueA: a.nutrition.kcal,
    valueB: b.nutrition.kcal,
    unit: 'kcal',
    winner: null,
  });

  rows.push({
    label: 'Sugar',
    valueA: a.nutrition.sugar,
    valueB: b.nutrition.sugar,
    unit: 'g',
    winner: lowerIsBetter(a.nutrition.sugar, b.nutrition.sugar),
  });

  rows.push({
    label: 'Protein',
    valueA: a.nutrition.protein,
    valueB: b.nutrition.protein,
    unit: 'g',
    winner: higherIsBetter(a.nutrition.protein, b.nutrition.protein),
  });

  rows.push({
    label: 'Sodium',
    valueA: a.nutrition.sodium,
    valueB: b.nutrition.sodium,
    unit: 'mg',
    winner: lowerIsBetter(a.nutrition.sodium, b.nutrition.sodium),
  });

  rows.push({
    label: 'Fiber',
    valueA: a.nutrition.fiber,
    valueB: b.nutrition.fiber,
    unit: 'g',
    winner: higherIsBetter(a.nutrition.fiber, b.nutrition.fiber),
  });

  const additivesA = a.additives.length;
  const additivesB = b.additives.length;
  rows.push({
    label: 'Additives',
    valueA: additivesA,
    valueB: additivesB,
    winner: lowerIsBetter(additivesA, additivesB),
  });

  return rows;
}

export function pickOverallWinner(scoreA: number, scoreB: number): Side | null {
  if (scoreA === scoreB) return null;
  return scoreA > scoreB ? 'a' : 'b';
}
