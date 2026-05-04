import type { NutriScoreGrade } from '@/types/product';

const COLORS: Record<NutriScoreGrade, string> = {
  A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f',
};
const RANKS: NutriScoreGrade[] = ['A', 'B', 'C', 'D', 'E'];

export function NutriScoreBadge({ grade = 'A', size = 'md' }: { grade?: NutriScoreGrade; size?: 'md' | 'lg' }) {
  const idx = RANKS.indexOf(grade);
  const w = size === 'lg' ? 100 : 76;
  const h = size === 'lg' ? 28 : 22;
  return (
    <div
      className="inline-flex items-center overflow-hidden"
      style={{
        width: w, height: h, borderRadius: 4,
        boxShadow: '0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.06)',
      }}
    >
      {RANKS.map((r, i) => {
        const active = i === idx;
        return (
          <div
            key={r}
            className="flex h-full items-center justify-center font-mono font-bold"
            style={{
              flex: active ? 1.4 : 1,
              background: active ? COLORS[r] : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: size === 'lg' ? 13 : 10,
            }}
          >{r}</div>
        );
      })}
    </div>
  );
}
