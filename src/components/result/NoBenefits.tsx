import { Ban } from 'lucide-react';

export function NoBenefits() {
  return (
    <div
      className="flex items-start gap-3"
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        background: 'color-mix(in oklab, var(--color-red) 10%, transparent)',
        border: '0.5px solid color-mix(in oklab, var(--color-red) 30%, transparent)',
      }}
    >
      <Ban size={20} strokeWidth={1.6} style={{ color: 'var(--color-red)', flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1">
        <div
          className="font-semibold"
          style={{ fontSize: 13, color: 'var(--color-red)', letterSpacing: '0.04em' }}
        >
          No benefits detected
        </div>
        <div className="text-text-dim" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>
          This product doesn&rsquo;t add anything to your day.
        </div>
      </div>
    </div>
  );
}
