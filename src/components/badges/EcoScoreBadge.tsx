import type { NutriScoreGrade } from '@/types/product';

const COLORS: Record<NutriScoreGrade, string> = {
  A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f',
};

export function EcoScoreBadge({ grade = 'A' }: { grade?: NutriScoreGrade }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-text"
      style={{
        padding: '4px 8px 4px 6px', borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        fontSize: 11, fontWeight: 500,
      }}
    >
      <span
        className="flex items-center justify-center font-mono font-bold text-white"
        style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS[grade], fontSize: 9 }}
      >{grade}</span>
      <span className="font-mono uppercase text-text-dim" style={{ fontSize: 10, letterSpacing: '0.08em' }}>Eco</span>
    </div>
  );
}
