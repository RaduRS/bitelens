import type { Additive } from '@/types/product';

const RAW_REGISTRY: Record<string, Omit<Additive, 'code'>> = {
  E150d: { name: 'Caramel color (Class IV)', risk: 'high', detail: 'Sulphite ammonia caramel. Trace 4-MEI is classified by IARC as possibly carcinogenic.' },
  E338:  { name: 'Phosphoric acid',          risk: 'moderate', detail: 'Strong acidity associated with enamel erosion and reduced calcium absorption.' },
  E1442: { name: 'Hydroxypropyl distarch phosphate', risk: 'low', detail: 'Modified starch used as a thickener. Generally safe but indicates ultra-processing.' },
  E440:  { name: 'Pectin', risk: 'none', detail: 'Natural fiber from fruit, used as gelling agent. Considered safe.' },
  E965:  { name: 'Maltitol', risk: 'moderate', detail: 'Sugar alcohol. Can cause bloating, gas, or diarrhea in larger amounts.' },
  E322:  { name: 'Soy lecithin', risk: 'low', detail: 'Common emulsifier derived from soy. Generally recognized as safe.' },
};

const NORMALIZED: Record<string, Omit<Additive, 'code'>> = Object.fromEntries(
  Object.entries(RAW_REGISTRY).map(([k, v]) => [k.toUpperCase(), v]),
);

// Keep the original casing for direct lookups in tests / fixtures.
export const ADDITIVE_REGISTRY = RAW_REGISTRY;

export function lookupAdditive(code: string): Additive | undefined {
  const meta = NORMALIZED[code.toUpperCase()];
  return meta ? { code, ...meta } : undefined;
}
