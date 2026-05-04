import type { Additive } from '@/types/product';

const RISK_META: Record<Additive['risk'], { color: string; label: string }> = {
  none:     { color: 'var(--color-accent)', label: 'No risk' },
  low:      { color: 'var(--color-accent)', label: 'Low risk' },
  moderate: { color: 'var(--color-amber)',  label: 'Moderate risk' },
  high:     { color: 'var(--color-red)',    label: 'High risk' },
};

export function AdditiveRow({ additive, isLast }: { additive: Additive; isLast: boolean }) {
  const meta = RISK_META[additive.risk];
  return (
    <div
      className="px-4 py-[14px]"
      style={{ borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}
    >
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className="font-mono text-text-dim"
          style={{
            fontSize: 11, padding: '2px 6px', borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
          }}
        >{additive.code}</span>
        <span className="flex-1 text-text" style={{ fontSize: 14, fontWeight: 500 }}>{additive.name}</span>
        <span
          className="inline-flex items-center gap-[5px] font-semibold uppercase"
          style={{ fontSize: 10, color: meta.color, letterSpacing: '0.1em' }}
        >
          <span
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: meta.color, boxShadow: `0 0 5px ${meta.color}`,
            }}
          />
          {meta.label}
        </span>
      </div>
      <div className="text-text-dim" style={{ fontSize: 12, lineHeight: 1.5 }}>{additive.detail}</div>
    </div>
  );
}
