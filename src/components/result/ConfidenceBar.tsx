export function ConfidenceBar({ value = 0.86 }: { value?: number }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.8 ? 'good' : value >= 0.5 ? 'mid' : 'low';
  const color =
    tone === 'good' ? 'var(--color-accent)' :
    tone === 'mid'  ? 'var(--color-amber)'  :
    'var(--color-red)';
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: '10px 14px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.07)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" />
        <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex-1">
        <div className="mb-1 text-text-dim" style={{ fontSize: 12, letterSpacing: '0.04em' }}>Visual confidence</div>
        <div className="overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>
      <span
        className="font-mono"
        style={{
          fontSize: 13, color, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
        }}
      >{pct}%</span>
    </div>
  );
}
