import type { VerdictLevel } from '@/types/verdict';

export const VERDICT: Record<VerdictLevel, { label: string; color: string; glow: string }> = {
  good:    { label: 'Good',    color: 'var(--color-accent)', glow: 'var(--color-accent-glow)' },
  caution: { label: 'Caution', color: 'var(--color-amber)',  glow: 'var(--color-amber-glow)' },
  avoid:   { label: 'Avoid',   color: 'var(--color-red)',    glow: 'var(--color-red-glow)' },
};
