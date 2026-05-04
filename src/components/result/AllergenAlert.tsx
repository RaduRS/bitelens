import type { AllergenKey } from '@/types/product';
import { ALLERGEN_LABELS } from '@/fixtures/profile-options';

export function AllergenAlert({ matched }: { matched: AllergenKey[] }) {
  if (!matched.length) return null;
  return (
    <div
      className="flex items-start gap-3"
      style={{
        padding: '14px 16px', borderRadius: 14,
        background: 'color-mix(in oklab, var(--color-red) 14%, transparent)',
        border: '0.5px solid color-mix(in oklab, var(--color-red) 40%, transparent)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ color: 'var(--color-red)', marginTop: 1, flexShrink: 0 }}>
        <path d="M10 2L18 17H2L10 2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="10" cy="14.5" r="0.9" fill="currentColor" />
      </svg>
      <div className="flex-1">
        <div className="mb-[3px] font-semibold" style={{ fontSize: 13, color: 'var(--color-red)', letterSpacing: '0.04em' }}>
          Contains allergens you avoid
        </div>
        <div className="text-text" style={{ fontSize: 13, lineHeight: 1.4 }}>
          {matched.map(a => ALLERGEN_LABELS[a]).join(', ')}
        </div>
      </div>
    </div>
  );
}
