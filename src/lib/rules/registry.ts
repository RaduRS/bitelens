import type { Product } from '@/types/product';
import type { Profile } from '@/types/profile';
import type { Severity, Reason, Flag } from '@/types/verdict';
import type { SignalSet } from './signals';

export interface RuleHit {
  reason?: Reason;
  flag?: Flag;
}

export interface Rule {
  id: string;
  severity: Severity | 'pos';     // 'pos' = positive observation, no penalty
  when: (s: SignalSet, profile: Profile, p: Product) => boolean;
  build: (s: SignalSet, p: Product) => RuleHit;
}

export const RULES: Rule[] = [
  {
    id: 'high_added_sugar',
    severity: 'high',
    when: s => s.sugarPerServing >= 15,
    build: s => ({
      reason: { kind: 'neg', text: `High added sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'avoid', label: 'High sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'moderate_added_sugar',
    severity: 'moderate',
    when: s => s.sugarPerServing >= 10 && s.sugarPerServing < 15,
    build: s => ({
      reason: { kind: 'neg', text: `Moderate added sugar — ${s.sugarPerServing}g per serving` },
      flag:   { tone: 'caution', label: 'Added sugar', detail: `${s.sugarPerServing}g` },
    }),
  },
  {
    id: 'high_sodium',
    severity: 'moderate',
    when: s => s.sodiumPerServing >= 600,
    build: s => ({
      reason: { kind: 'neg', text: `High sodium — ${s.sodiumPerServing}mg per serving` },
      flag:   { tone: 'caution', label: 'High sodium', detail: `${s.sodiumPerServing}mg` },
    }),
  },
  {
    id: 'additive_high_risk',
    severity: 'high',
    when: s => s.additiveMaxRisk === 'high',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a high-risk additive' },
      flag:   { tone: 'avoid', label: 'High-risk additive' },
    }),
  },
  {
    id: 'additive_moderate_risk',
    severity: 'moderate',
    when: s => s.additiveMaxRisk === 'moderate',
    build: () => ({
      reason: { kind: 'neg', text: 'Contains a moderate-risk additive' },
      flag:   { tone: 'caution', label: 'Moderate-risk additive' },
    }),
  },
  {
    id: 'ultra_processed',
    severity: 'moderate',
    when: s => s.novaGroup === 4,
    build: () => ({
      reason: { kind: 'neg', text: 'Ultra-processed (NOVA group 4)' },
      flag:   { tone: 'caution', label: 'Ultra-processed', detail: 'NOVA 4' },
    }),
  },
  {
    id: 'nutri_score_de',
    severity: 'moderate',
    when: s => s.nutriScore === 'D' || s.nutriScore === 'E',
    build: s => ({
      reason: { kind: 'neg', text: `Nutri-Score ${s.nutriScore}` },
    }),
  },
  {
    id: 'allergen_match',
    severity: 'high',
    when: (s, profile) => s.containsAllergens.some(a => profile.allergens.includes(a)),
    build: (_s, p) => ({
      reason: { kind: 'neg', text: `Contains allergens you avoid` },
      flag:   { tone: 'avoid', label: 'Allergen', detail: p.allergens.join(', ') },
    }),
  },
  {
    id: 'goal_low_sugar_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('low_sugar') && s.sugarPerServing >= 8,
    build: s => ({
      reason: { kind: 'neg', text: `Above your low-sugar goal (${s.sugarPerServing}g)` },
    }),
  },
  {
    id: 'goal_less_processed_breach',
    severity: 'low',
    when: (s, profile) => profile.goals.includes('less_processed') && (s.novaGroup ?? 0) >= 3,
    build: s => ({
      reason: { kind: 'neg', text: `Processing level (NOVA ${s.novaGroup}) above your goal` },
    }),
  },
  {
    id: 'pos_no_additives',
    severity: 'pos',
    when: s => s.additiveCount === 0,
    build: () => ({ reason: { kind: 'pos', text: 'No additives detected' } }),
  },
  {
    id: 'pos_high_protein',
    severity: 'pos',
    when: s => s.proteinPerServing >= 10,
    build: s => ({ reason: { kind: 'pos', text: `Good protein content (${s.proteinPerServing}g)` } }),
  },
  {
    id: 'pos_nutri_a_b',
    severity: 'pos',
    when: s => s.nutriScore === 'A' || s.nutriScore === 'B',
    build: s => ({ reason: { kind: 'pos', text: `Nutri-Score ${s.nutriScore}` } }),
  },
  {
    id: 'pos_low_sugar',
    severity: 'pos',
    when: s => s.sugarPerServing < 5 && (s.kcalPerServing > 0),
    build: () => ({ reason: { kind: 'pos', text: 'Low sugar' } }),
  },
];
