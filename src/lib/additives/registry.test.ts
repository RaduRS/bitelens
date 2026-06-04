import { describe, it, expect } from 'vitest';
import { lookupAdditive } from './registry';

describe('emulsifier additives', () => {
  it('rates gut-microbiome emulsifiers as moderate risk', () => {
    expect(lookupAdditive('E433')?.risk).toBe('moderate');
    expect(lookupAdditive('E466')?.risk).toBe('moderate');
    expect(lookupAdditive('E407')?.risk).toBe('moderate');
  });
});
