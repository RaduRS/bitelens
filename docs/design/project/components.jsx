// components.jsx — BiteLens primitive components

const VERDICT = {
  good:    { label: 'Good',    color: 'var(--accent)', glow: 'var(--accent-glow)' },
  caution: { label: 'Caution', color: 'var(--amber)',  glow: 'var(--amber-glow)' },
  avoid:   { label: 'Avoid',   color: 'var(--red)',    glow: 'var(--red-glow)' },
};

function VerdictRing({ verdict = 'good', score = 84, size = 156, showScore = true, animateIn = false }) {
  const v = VERDICT[verdict];
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const [progress, setProgress] = React.useState(animateIn ? 0 : pct);
  React.useEffect(() => {
    if (!animateIn) { setProgress(pct); return; }
    let raf, t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const k = Math.min(1, (t - t0) / 900);
      const eased = 1 - Math.pow(1 - k, 3);
      setProgress(eased * pct);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct, animateIn]);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <div style={{
        position: 'absolute', inset: -10, borderRadius: '50%',
        background: `radial-gradient(circle, ${v.glow} 0%, transparent 65%)`,
        opacity: 0.6, filter: 'blur(8px)',
      }} />
      <svg width={size} height={size} style={{ position: 'relative', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={v.color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`} style={{ filter: `drop-shadow(0 0 8px ${v.glow})` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {showScore && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: size * 0.32, fontWeight: 600,
            color: v.color, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
          }}>{Math.round(score)}</div>
        )}
        <div style={{
          marginTop: showScore ? 4 : 0,
          fontSize: showScore ? 12 : 22, fontWeight: 600,
          letterSpacing: showScore ? '0.18em' : '0.02em',
          textTransform: showScore ? 'uppercase' : 'none', color: v.color,
        }}>{v.label}</div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict = 'good', score, size = 'md' }) {
  const v = VERDICT[verdict];
  const small = size === 'sm';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: small ? 22 : 28, padding: small ? '0 8px' : '0 10px', borderRadius: 999,
      background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
      border: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
      color: v.color, fontSize: small ? 10 : 11, fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      <span style={{
        width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%',
        background: v.color, boxShadow: `0 0 6px ${v.glow}`,
      }} />
      {v.label}
      {score != null && (
        <span style={{
          marginLeft: 2, paddingLeft: 8,
          borderLeft: `0.5px solid color-mix(in oklab, ${v.color} 35%, transparent)`,
          fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: 0,
        }}>{score}</span>
      )}
    </div>
  );
}

// Nutri-Score grade badge (A–E)
function NutriScoreBadge({ grade = 'A', size = 'md' }) {
  const colors = {
    A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f',
  };
  const ranks = ['A','B','C','D','E'];
  const idx = ranks.indexOf(grade);
  const w = size === 'lg' ? 100 : 76;
  const h = size === 'lg' ? 28 : 22;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      width: w, height: h, borderRadius: 4, overflow: 'hidden',
      boxShadow: '0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 0.5px rgba(255,255,255,0.06)',
    }}>
      {ranks.map((r, i) => {
        const active = i === idx;
        return (
          <div key={r} style={{
            flex: active ? 1.4 : 1, height: '100%',
            background: active ? colors[r] : 'rgba(255,255,255,0.04)',
            color: active ? '#fff' : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size === 'lg' ? 13 : 10, fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}>{r}</div>
        );
      })}
    </div>
  );
}

// Eco-Score badge
function EcoScoreBadge({ grade = 'A' }) {
  const colors = { A: '#1e7d4a', B: '#7ab63e', C: '#ffb617', D: '#ee8225', E: '#cc1f1f' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px 4px 6px', borderRadius: 999,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.07)',
      fontSize: 11, fontWeight: 500, color: 'var(--text)',
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: colors[grade],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
      }}>{grade}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Eco</span>
    </div>
  );
}

// NOVA group pill
function NovaPill({ group = 1 }) {
  const colors = { 1: '#1e7d4a', 2: '#7ab63e', 3: '#ee8225', 4: '#cc1f1f' };
  const labels = { 1: 'Unprocessed', 2: 'Processed culinary', 3: 'Processed', 4: 'Ultra-processed' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 6px', borderRadius: 999,
      background: 'rgba(255,255,255,0.04)',
      border: '0.5px solid rgba(255,255,255,0.07)',
      fontSize: 11, color: 'var(--text)',
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: '50%', background: colors[group],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)',
      }}>{group}</span>
      <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>{labels[group]}</span>
    </div>
  );
}

// Additive risk row
function AdditiveRow({ additive, isLast }) {
  const riskMeta = {
    none:     { color: 'var(--accent)', label: 'No risk' },
    low:      { color: 'var(--accent)', label: 'Low risk' },
    moderate: { color: 'var(--amber)',  label: 'Moderate risk' },
    high:     { color: 'var(--red)',    label: 'High risk' },
  }[additive.risk] || { color: 'var(--text-dim)', label: 'Unknown' };
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--text-dim)',
          padding: '2px 6px', borderRadius: 4,
          background: 'rgba(255,255,255,0.05)',
        }}>{additive.code}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{additive.name}</span>
        <span style={{
          fontSize: 10, color: riskMeta.color, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: riskMeta.color, boxShadow: `0 0 5px ${riskMeta.color}` }} />
          {riskMeta.label}
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, paddingLeft: 0 }}>{additive.detail}</div>
    </div>
  );
}

// Allergen alert banner
function AllergenAlert({ matched }) {
  if (!matched || matched.length === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', borderRadius: 14,
      background: 'color-mix(in oklab, var(--red) 14%, transparent)',
      border: '0.5px solid color-mix(in oklab, var(--red) 40%, transparent)',
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, color: 'var(--red)', marginTop: 1 }}>
        <path d="M10 2L18 17H2L10 2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
        <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="10" cy="14.5" r="0.9" fill="currentColor"/>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 3, letterSpacing: '0.04em' }}>Contains allergens you avoid</div>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
          {matched.map(a => ALLERGEN_LABELS[a] || a).join(', ')}
        </div>
      </div>
    </div>
  );
}

function FlagChip({ tone = 'caution', label, detail }) {
  const color = tone === 'avoid' ? 'var(--red)' : tone === 'caution' ? 'var(--amber)' : 'var(--accent)';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.07)', fontSize: 13,
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
        <path d="M7 1.5L13 12.5H1L7 1.5Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
        <rect x="6.5" y="5.5" width="1" height="3.5" rx="0.5" fill={color}/>
        <circle cx="7" cy="10.5" r="0.7" fill={color}/>
      </svg>
      <span style={{ color: 'var(--text)', fontWeight: 500 }}>{label}</span>
      {detail && <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{detail}</span>}
    </div>
  );
}

function ReasonRow({ kind, text }) {
  const color = kind === 'pos' ? 'var(--accent)' : kind === 'neg' ? 'var(--red)' : 'var(--text-dim)';
  const icon = kind === 'pos'
    ? <path d="M2 6.5L5 9.5L10 3.5" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    : kind === 'neg'
    ? <path d="M3 3l6 6M9 3l-6 6" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    : <line x1="3" y1="6" x2="9" y2="6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: `color-mix(in oklab, ${color} 14%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12">{icon}</svg>
      </div>
      <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>{text}</div>
    </div>
  );
}

function NutritionBlock({ nutrition }) {
  const items = [
    { label: 'Calories', value: nutrition.kcal, unit: 'kcal' },
    { label: 'Protein',  value: nutrition.protein, unit: 'g' },
    { label: 'Carbs',    value: nutrition.carbs, unit: 'g' },
    { label: 'Sugar',    value: nutrition.sugar, unit: 'g', warn: nutrition.sugar >= 10 },
    { label: 'Fat',      value: nutrition.fat, unit: 'g' },
    { label: 'Sat. fat', value: nutrition.satFat, unit: 'g' },
    { label: 'Fiber',    value: nutrition.fiber, unit: 'g' },
    { label: 'Sodium',   value: nutrition.sodium, unit: 'mg', warn: nutrition.sodium >= 400 },
  ];
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)',
        textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
      }}>Per {nutrition.serving}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.06)' }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background: 'var(--surface)', padding: '14px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>{it.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 19, fontWeight: 500,
                color: it.warn ? 'var(--amber)' : 'var(--text)',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
              }}>{it.value}</span>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{it.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductThumb({ product, size = 44, radius = 10 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: `linear-gradient(135deg, ${product.swatch} 0%, color-mix(in oklab, ${product.swatch} 60%, #000) 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 500,
      fontSize: size * 0.42, color: 'rgba(255,255,255,0.85)',
      flexShrink: 0,
      boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 1px 0 rgba(0,0,0,0.4)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px)',
      }} />
      <span style={{ position: 'relative' }}>{product.glyph}</span>
    </div>
  );
}

function RecentRow({ product, onClick, showFav }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: 'transparent', border: 0, color: 'inherit',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <ProductThumb product={product} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <ScanTypeIcon type={product.type} />
          <span style={{
            fontSize: 10, color: 'var(--text-dim)',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>{product.type === 'barcode' ? 'Barcode' : 'Photo'}{product.timeAgo ? ` · ${product.timeAgo}` : ''}</span>
          {showFav && product.favorite && (
            <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: 'var(--accent)' }}>
              <path d="M5 1L6.2 3.6L9 4L7 6L7.5 9L5 7.5L2.5 9L3 6L1 4L3.8 3.6L5 1Z" fill="currentColor"/>
            </svg>
          )}
        </div>
        <div style={{
          fontSize: 15, fontWeight: 500, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.01em',
        }}>{product.name}</div>
      </div>
      <VerdictBadge verdict={product.verdict} score={product.score} size="sm" />
    </button>
  );
}

function ScanTypeIcon({ type }) {
  const c = 'var(--text-dim)';
  if (type === 'barcode') {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11">
        <rect x="0.5" y="1" width="1" height="9" fill={c}/>
        <rect x="2.5" y="1" width="0.5" height="9" fill={c}/>
        <rect x="4" y="1" width="1.5" height="9" fill={c}/>
        <rect x="6.5" y="1" width="0.5" height="9" fill={c}/>
        <rect x="8" y="1" width="1" height="9" fill={c}/>
        <rect x="10" y="1" width="0.5" height="9" fill={c}/>
      </svg>
    );
  }
  return (
    <svg width="11" height="11" viewBox="0 0 11 11">
      <rect x="0.5" y="2.5" width="10" height="7.5" rx="1.2" fill="none" stroke={c} strokeWidth="0.8"/>
      <circle cx="5.5" cy="6.25" r="2" fill="none" stroke={c} strokeWidth="0.8"/>
      <rect x="4" y="1" width="3" height="1.5" rx="0.4" fill={c}/>
    </svg>
  );
}

function ConfidenceBar({ value = 0.86 }) {
  const pct = Math.round(value * 100);
  const tone = value >= 0.8 ? 'good' : value >= 0.5 ? 'mid' : 'low';
  const color = tone === 'good' ? 'var(--accent)' : tone === 'mid' ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(255,255,255,0.03)',
      border: '0.5px solid rgba(255,255,255,0.07)',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4"/>
        <path d="M5.5 8L7.2 9.7L10.5 6.3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4, letterSpacing: '0.04em' }}>Visual confidence</div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }}/>
        </div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
    </div>
  );
}

function SectionLabel({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 10,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.16em',
      }}>{children}</div>
      {action}
    </div>
  );
}

// Alternative product card (horizontal carousel item)
function AlternativeCard({ product, onClick }) {
  const v = VERDICT[product.verdict];
  return (
    <button onClick={onClick} style={{
      flex: '0 0 auto', width: 168,
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: 14, borderRadius: 16,
      background: 'var(--surface)',
      border: '0.5px solid rgba(255,255,255,0.06)',
      color: 'inherit', cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <ProductThumb product={product} size={40} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 7px', borderRadius: 999,
          background: `color-mix(in oklab, ${v.color} 14%, transparent)`,
          color: v.color, fontFamily: 'var(--font-mono)',
          fontSize: 11, fontWeight: 600,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: v.color }} />
          {product.score}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{product.brand}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3, letterSpacing: '-0.005em' }}>{product.name}</div>
      </div>
    </button>
  );
}

// Bottom tab bar
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',     label: 'Scan',     icon: <path d="M3 5V3a1 1 0 011-1h2M16 5V3a1 1 0 00-1-1h-2M3 13v2a1 1 0 001 1h2M16 13v2a1 1 0 01-1 1h-2M2 9.5h16" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/> },
    { id: 'discover', label: 'Discover', icon: <><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><line x1="13" y1="13" x2="17" y2="17" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></> },
    { id: 'recents',  label: 'History',  icon: <><circle cx="9" cy="10" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.4"/><path d="M9 6.5v3.5l2.4 1.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></> },
    { id: 'profile',  label: 'You',      icon: <><circle cx="9" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M2.5 16c1.4-3 3.7-4.5 6.5-4.5s5.1 1.5 6.5 4.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></> },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 32, paddingTop: 6,
      background: 'rgba(10,10,11,0.85)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      borderTop: '0.5px solid rgba(255,255,255,0.06)',
      display: 'flex', justifyContent: 'space-around',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 0, padding: '6px 14px',
            color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            cursor: 'pointer',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.02em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  VERDICT, VerdictRing, VerdictBadge, NutriScoreBadge, EcoScoreBadge, NovaPill,
  AdditiveRow, AllergenAlert, FlagChip, ReasonRow,
  NutritionBlock, ProductThumb, RecentRow, ConfidenceBar, SectionLabel, ScanTypeIcon,
  AlternativeCard, TabBar,
});
