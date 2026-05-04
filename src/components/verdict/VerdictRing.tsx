'use client';
import { useEffect, useState } from 'react';
import type { VerdictLevel } from '@/types/verdict';
import { VERDICT } from './verdict-tokens';

interface Props {
  verdict?: VerdictLevel;
  score?: number;
  size?: number;
  showScore?: boolean;
  animateIn?: boolean;
}

export function VerdictRing({
  verdict = 'good', score = 84, size = 156, showScore = true, animateIn = false,
}: Props) {
  const v = VERDICT[verdict];
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const [progress, setProgress] = useState(animateIn ? 0 : pct);

  useEffect(() => {
    if (!animateIn) { setProgress(pct); return; }
    let raf: number;
    let t0: number | undefined;
    const tick = (t: number) => {
      if (t0 === undefined) t0 = t;
      const k = Math.min(1, (t - t0) / 900);
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(eased * pct);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct, animateIn]);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full"
        style={{
          inset: -10,
          background: `radial-gradient(circle, ${v.glow} 0%, transparent 65%)`,
          opacity: 0.6, filter: 'blur(8px)',
        }}
      />
      <svg width={size} height={size} className="relative" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={v.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${v.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showScore && (
          <div
            className="font-mono font-semibold"
            style={{
              fontSize: size * 0.32, color: v.color, lineHeight: 1,
              letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
            }}
          >{Math.round(score)}</div>
        )}
        <div
          className="font-semibold"
          style={{
            marginTop: showScore ? 4 : 0,
            fontSize: showScore ? 12 : 22,
            letterSpacing: showScore ? '0.18em' : '0.02em',
            textTransform: showScore ? 'uppercase' : 'none',
            color: v.color,
          }}
        >{v.label}</div>
      </div>
    </div>
  );
}
