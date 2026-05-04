import type { Reason } from '@/types/verdict';

export function ReasonRow({ kind, text }: Reason) {
  const color =
    kind === 'pos' ? 'var(--color-accent)' :
    kind === 'neg' ? 'var(--color-red)' :
    'var(--color-text-dim)';
  const icon =
    kind === 'pos' ? <path d="M2 6.5L5 9.5L10 3.5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /> :
    kind === 'neg' ? <path d="M3 3l6 6M9 3l-6 6" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" /> :
    <line x1="3" y1="6" x2="9" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className="flex flex-shrink-0 items-center justify-center"
        style={{
          width: 20, height: 20, borderRadius: '50%', marginTop: 1,
          background: `color-mix(in oklab, ${color} 14%, transparent)`,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12">{icon}</svg>
      </div>
      <div className="flex-1 text-text" style={{ fontSize: 14, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}
