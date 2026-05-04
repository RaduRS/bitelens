import type { LucideIcon } from 'lucide-react';
import { Heart, Brain, Bone, Eye, Shield, Sparkles, BicepsFlexed } from 'lucide-react';
import type { OrganKey } from '@/types/organ';
import type { SignalSet } from '@/lib/rules/signals';

export interface OrganMeta {
  label: string;
  color: string;
  glow: string;
  source: 'lucide' | 'custom';
  lucide?: LucideIcon;
}

export const ORGAN_META: Record<OrganKey, OrganMeta> = {
  heart:  { label: 'Heart',  color: 'oklch(0.74 0.16 12)',  glow: 'oklch(0.74 0.16 12 / 0.35)',  source: 'lucide', lucide: Heart },
  brain:  { label: 'Brain',  color: 'oklch(0.78 0.13 280)', glow: 'oklch(0.78 0.13 280 / 0.35)', source: 'lucide', lucide: Brain },
  bones:  { label: 'Bones',  color: 'oklch(0.92 0.04 85)',  glow: 'oklch(0.92 0.04 85 / 0.35)',  source: 'lucide', lucide: Bone },
  gut:    { label: 'Gut',    color: 'oklch(0.78 0.14 60)',  glow: 'oklch(0.78 0.14 60 / 0.35)',  source: 'custom' },
  immune: { label: 'Immune', color: 'oklch(0.78 0.12 180)', glow: 'oklch(0.78 0.12 180 / 0.35)', source: 'lucide', lucide: Shield },
  eyes:   { label: 'Eyes',   color: 'oklch(0.82 0.13 220)', glow: 'oklch(0.82 0.13 220 / 0.35)', source: 'lucide', lucide: Eye },
  muscle: { label: 'Muscle', color: 'oklch(0.78 0.14 50)',  glow: 'oklch(0.78 0.14 50 / 0.35)',  source: 'lucide', lucide: BicepsFlexed },
  skin:   { label: 'Skin',   color: 'oklch(0.83 0.10 110)', glow: 'oklch(0.83 0.10 110 / 0.35)', source: 'lucide', lucide: Sparkles },
};

export interface OrganRule {
  organ: OrganKey;
  priority: number;
  when: (s: SignalSet) => boolean;
}

function hasIngredient(s: SignalSet, kws: string[]): boolean {
  return s.ingredientsLower.some(ing => kws.some(k => ing.includes(k)));
}

export const ORGAN_RULES: OrganRule[] = [
  // Heart — omega-3 sources, fiber-rich whole grains, low sodium
  { organ: 'heart', priority: 8, when: s => hasIngredient(s, ['salmon', 'walnut', 'flax', 'chia', 'mackerel', 'sardine', 'herring', 'anchovy']) },
  { organ: 'heart', priority: 5, when: s => s.fiberPerServing >= 4 && s.sodiumPerServing < 250 && s.nutriScoreOrdinal <= 1 },
  { organ: 'heart', priority: 3, when: s => hasIngredient(s, ['whole oat', 'rolled oat', 'whole grain', 'whole-grain', 'quinoa', 'barley', 'rye']) && s.fiberPerServing >= 2 },

  // Brain — omega-3, choline, antioxidant-rich
  { organ: 'brain', priority: 8, when: s => hasIngredient(s, ['salmon', 'sardine', 'mackerel', 'walnut', 'flax', 'chia']) },
  { organ: 'brain', priority: 5, when: s => hasIngredient(s, ['egg', 'almond', 'dark chocolate', 'blueberry', 'blueberries', 'blackberry', 'blackberries']) },

  // Bones — calcium and bone-supportive minerals
  { organ: 'bones', priority: 6, when: s => hasIngredient(s, ['milk', 'yogurt', 'cheese', 'kefir', 'live cultures', 'live active cultures']) },
  { organ: 'bones', priority: 4, when: s => hasIngredient(s, ['almond', 'sesame', 'tahini', 'kale', 'spinach', 'broccoli', 'collard']) },

  // Gut — probiotics and fiber
  { organ: 'gut', priority: 8, when: s => hasIngredient(s, ['live cultures', 'live active cultures', 'kombucha', 'kefir', 'kimchi', 'sauerkraut', 'miso', 'tempeh', 'probiotic']) },
  { organ: 'gut', priority: 6, when: s => s.fiberPerServing >= 8 },
  { organ: 'gut', priority: 4, when: s => s.fiberPerServing >= 5 && (s.novaGroup ?? 1) <= 3 },

  // Immune — vitamin C and immunomodulators
  { organ: 'immune', priority: 6, when: s => hasIngredient(s, ['orange', 'lemon', 'lime', 'grapefruit', 'citrus', 'berry', 'strawberry', 'blueberry', 'raspberry', 'bell pepper', 'red pepper', 'garlic', 'ginger', 'turmeric', 'elderberry']) },

  // Eyes — vitamin A / lutein
  { organ: 'eyes', priority: 5, when: s => hasIngredient(s, ['carrot', 'spinach', 'kale', 'salmon', 'egg yolk', 'sweet potato']) },

  // Muscle — protein
  { organ: 'muscle', priority: 6, when: s => s.proteinPerServing >= 12 },
  { organ: 'muscle', priority: 5, when: s => hasIngredient(s, ['chicken', 'beef', 'turkey', 'tuna', 'salmon', 'tofu', 'tempeh', 'lentil', 'chickpea', 'black bean']) },
  { organ: 'muscle', priority: 4, when: s => s.proteinPerServing >= 8 && s.sugarPerServing < 8 },

  // Skin — vitamin E, healthy fats
  { organ: 'skin', priority: 5, when: s => hasIngredient(s, ['almond', 'sunflower seed', 'hazelnut', 'olive oil', 'avocado', 'sweet potato']) },
  { organ: 'skin', priority: 3, when: s => s.fatPerServing > 0 && s.satFatPerServing < 2 && hasIngredient(s, ['nut', 'seed', 'olive']) },
];
