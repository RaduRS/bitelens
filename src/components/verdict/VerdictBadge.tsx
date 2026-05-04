import type { VerdictLevel } from '@/types/verdict';
import { VERDICT } from './verdict-tokens';

export function VerdictBadge({
  verdict = 'good', score, size = 'md',
}: { verdict?: VerdictLevel; score?: number; size?: 'sm' | 'md' }) {
  const v = VERDICT[verdict];
  const small = size === 'sm';
  return (
    <div
      className="inline-flex items-center gap-1.5 font-semibold uppercase"
      style={{
        height: small ? 22 : 28, padding: small ? '0 8px' : '0 10px', borderRadius: 999,
        background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
        border: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
        color: v.color, fontSize: small ? 10 : 11, letterSpacing: '0.12em',
      }}
    >
      <span
        style={{
          width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%',
          background: v.color, boxShadow: `0 0 6px ${v.glow}`,
        }}
      />
      {v.label}
      {score != null && (
        <span
          className="font-mono"
          style={{
            marginLeft: 2, paddingLeft: 8, fontWeight: 500, letterSpacing: 0,
            borderLeft: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
          }}
        >{score}</span>
      )}
    </div>
  );
}
