import type { Product } from './product';

export type VerdictLevel = 'good' | 'caution' | 'avoid';
export type Severity = 'low' | 'moderate' | 'high';
export type ReasonKind = 'pos' | 'neg' | 'neu';
export type FlagTone = 'good' | 'caution' | 'avoid';

export interface Reason {
  kind: ReasonKind;
  text: string;
}

export interface Flag {
  tone: FlagTone;
  label: string;
  detail?: string;
}

export interface VerdictResult {
  verdict: VerdictLevel;
  score: number;
  summary: string;
  reasons: Reason[];
  flags: Flag[];
  triggeredRuleIds: string[];
}

export interface VerdictContext {
  product: Product;
}
