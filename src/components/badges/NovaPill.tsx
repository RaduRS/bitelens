import type { NovaGroup } from '@/types/product';

const COLORS: Record<NovaGroup, string> = { 1: '#1e7d4a', 2: '#7ab63e', 3: '#ee8225', 4: '#cc1f1f' };
const LABELS: Record<NovaGroup, string> = {
  1: 'Unprocessed', 2: 'Processed culinary', 3: 'Processed', 4: 'Ultra-processed',
};

export function NovaPill({ group = 1 }: { group?: NovaGroup }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-text"
      style={{
        padding: '4px 10px 4px 6px', borderRadius: 999,
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.07)',
        fontSize: 11,
      }}
    >
      <span
        className="flex items-center justify-center font-mono font-bold text-white"
        style={{ width: 16, height: 16, borderRadius: '50%', background: COLORS[group], fontSize: 9 }}
      >{group}</span>
      <span className="text-text-dim" style={{ fontSize: 11 }}>{LABELS[group]}</span>
    </div>
  );
}
