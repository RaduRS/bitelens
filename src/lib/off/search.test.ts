import { describe, it, expect } from 'vitest';
import { rowsToPreviews } from './search';

describe('rowsToPreviews', () => {
  it('drops rows missing code or name', () => {
    const out = rowsToPreviews([
      { code: '12345', product_name: 'Real product', brands: 'Brand', nutriscore_grade: 'a' },
      { code: '', product_name: 'Empty code' },
      { code: '67890', product_name: '', brands: 'X' },
      { product_name: 'No code' },
    ]);
    expect(out.map(p => p.id)).toEqual(['12345']);
  });

  it('takes the first brand only', () => {
    const out = rowsToPreviews([
      { code: '1', product_name: 'X', brands: 'Brand A, Brand B, Brand C' },
    ]);
    expect(out[0].brand).toBe('Brand A');
  });

  it('falls back to "Unknown" when brand is empty', () => {
    const out = rowsToPreviews([
      { code: '1', product_name: 'X' },
    ]);
    expect(out[0].brand).toBe('Unknown');
  });

  it('normalizes nutri/eco scores to uppercase letters', () => {
    const out = rowsToPreviews([
      { code: '1', product_name: 'X', nutriscore_grade: 'a', ecoscore_grade: 'B' },
      { code: '2', product_name: 'Y', nutriscore_grade: 'unknown', ecoscore_grade: '' },
    ]);
    expect(out[0].nutriScore).toBe('A');
    expect(out[0].ecoScore).toBe('B');
    expect(out[1].nutriScore).toBeNull();
    expect(out[1].ecoScore).toBeNull();
  });

  it('parses NOVA from string or number', () => {
    const out = rowsToPreviews([
      { code: '1', product_name: 'X', nova_group: 4 },
      { code: '2', product_name: 'Y', nova_group: '2' },
      { code: '3', product_name: 'Z', nova_group: '99' },
    ]);
    expect(out[0].novaGroup).toBe(4);
    expect(out[1].novaGroup).toBe(2);
    expect(out[2].novaGroup).toBeNull();
  });

  it('trims whitespace from name and brand', () => {
    const out = rowsToPreviews([
      { code: '1', product_name: '  Padded Name  ', brands: '  Brand  ' },
    ]);
    expect(out[0].name).toBe('Padded Name');
    expect(out[0].brand).toBe('Brand');
  });
});
