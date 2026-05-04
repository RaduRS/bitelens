import type { Flag } from '@/types/verdict';

export function FlagChip({ tone = 'caution', label, detail }: Flag) {
  const color =
    tone === 'avoid' ? 'var(--color-red)' :
    tone === 'caution' ? 'var(--color-amber)' :
    'var(--color-accent)';
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        padding: '8px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.07)', fontSize: 13,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <path d="M7 1.5L13 12.5H1L7 1.5Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="6.5" y="5.5" width="1" height="3.5" rx="0.5" fill={color} />
        <circle cx="7" cy="10.5" r="0.7" fill={color} />
      </svg>
      <span className="text-text" style={{ fontWeight: 500 }}>{label}</span>
      {detail && <span className="font-mono text-text-dim" style={{ fontSize: 11 }}>{detail}</span>}
    </div>
  );
}
