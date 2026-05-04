interface Props {
  avgScore: number;
  goodCount: number;
  total: number;
}

export function QuickStats({ avgScore, goodCount, total }: Props) {
  const items = [
    { label: 'Avg score', value: avgScore || '—', color: 'var(--color-accent)' },
    { label: 'Good picks', value: total ? `${goodCount}/${total}` : '—', color: 'var(--color-text)' },
    { label: 'This week', value: total, color: 'var(--color-text)' },
  ];
  return (
    <div className="px-5 pt-6">
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.05)', borderRadius: 14,
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        {items.map(s => (
          <div key={s.label} className="bg-surface text-center" style={{ padding: '12px 12px' }}>
            <div
              className="font-mono"
              style={{
                fontSize: 22, fontWeight: 500, color: s.color,
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}
            >{s.value}</div>
            <div
              className="mt-0.5 uppercase text-text-dim"
              style={{ fontSize: 10, letterSpacing: '0.1em' }}
            >{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
