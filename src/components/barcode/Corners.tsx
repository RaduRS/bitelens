type Pos = 'tl' | 'tr' | 'bl' | 'br';

export function Corners({ verdict }: { verdict?: 'good' }) {
  const c = verdict === 'good' ? 'var(--color-accent)' : 'rgba(255,255,255,0.85)';
  const sz = 26, w = 2;
  const base = { position: 'absolute' as const, width: sz, height: sz };
  const styles: Record<Pos, React.CSSProperties> = {
    tl: { ...base, top: 0, left: 0, borderTop: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderTopLeftRadius: 6 },
    tr: { ...base, top: 0, right: 0, borderTop: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderTopRightRadius: 6 },
    bl: { ...base, bottom: 0, left: 0, borderBottom: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderBottomLeftRadius: 6 },
    br: { ...base, bottom: 0, right: 0, borderBottom: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderBottomRightRadius: 6 },
  };
  const glow = verdict === 'good' ? '0 0 12px var(--color-accent-glow)' : 'none';
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as Pos[]).map(p => (
        <div key={p} style={{ ...styles[p], boxShadow: glow, transition: 'all 0.3s' }} />
      ))}
    </>
  );
}
