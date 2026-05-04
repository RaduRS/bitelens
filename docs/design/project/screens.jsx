// screens.jsx — BiteLens screens

const { useState, useEffect, useRef } = React;

function Wordmark({ size = 22 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="10" fill="none" stroke="var(--accent)" strokeWidth="1.4"/>
        <circle cx="11" cy="11" r="5" fill="none" stroke="var(--accent)" strokeWidth="1.4"/>
        <circle cx="11" cy="11" r="1.6" fill="var(--accent)"/>
      </svg>
      <span style={{ fontSize: size * 0.82, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>BiteLens</span>
    </div>
  );
}

function TopBar({ onBack, title, right, leading }) {
  // leading: 'wordmark' (default when no onBack/title) | 'spacer' | 'back'
  const showBack = !!onBack;
  const showWordmark = !showBack && !title && leading !== 'spacer';
  const showSpacer = !showBack && (title || leading === 'spacer');
  return (
    <div style={{
      paddingTop: 60, paddingBottom: 12, padding: '60px 20px 12px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      {showBack && (
        <button onClick={onBack} style={iconBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L3 7L9 12" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {showWordmark && <Wordmark />}
      {showSpacer && <div style={{ width: 36, height: 36 }} />}
      {title && <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
    </div>
  );
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 18,
  background: 'rgba(255,255,255,0.06)',
  border: '0.5px solid rgba(255,255,255,0.08)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'var(--text)',
};
const linkBtnStyle = {
  display: 'inline-flex', alignItems: 'center',
  background: 'transparent', border: 0, color: 'var(--text-dim)',
  fontSize: 12, fontFamily: 'var(--font-mono)',
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
};

// ─── HOME ─────────────────────────────────────────────────
function HomeScreen({ go, recents, profile }) {
  // Calculate streak / quick stats
  const goodCount = recents.filter(r => r.verdict === 'good').length;
  const avgScore = Math.round(recents.reduce((s,r) => s + r.score, 0) / Math.max(1, recents.length));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: 72 }}>
      <TopBar right={
        <button style={iconBtnStyle} onClick={() => go('profile')}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <circle cx="7" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
            <path d="M2 12c1.2-2.2 3-3.4 5-3.4s3.8 1.2 5 3.4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      } />

      <div style={{ padding: '16px 24px 0' }}>
        <div style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent)',
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)' }} />
          Ready to scan
        </div>
        <h1 style={{
          margin: 0, fontSize: 36, lineHeight: 1.05, fontWeight: 600,
          letterSpacing: '-0.025em', color: 'var(--text)',
        }}>
          Point. Scan.<br/>
          <span style={{ color: 'var(--text-dim)' }}>Understand.</span>
        </h1>
      </div>

      {/* Quick stats card */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: 'rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          {[
            { label: 'Avg score', value: avgScore, color: 'var(--accent)' },
            { label: 'Good picks', value: `${goodCount}/${recents.length}`, color: 'var(--text)' },
            { label: 'This week', value: recents.length, color: 'var(--text)' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', padding: '12px 12px', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 500,
                color: s.color, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
              }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PrimaryActionCard tone="primary" eyebrow="Primary" title="Scan a barcode" subtitle="For packaged products"
          onClick={() => go('barcode')} icon={<BarcodeIcon />} />
        <PrimaryActionCard tone="ghost" eyebrow="Visual" title="Photograph food" subtitle="Real meals & fresh items"
          onClick={() => go('photo')} icon={<CameraIcon />} />
      </div>

      {profile.allergens.length > 0 && (
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'color-mix(in oklab, var(--accent) 14%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path d="M2 6.5L5 9L10 3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, fontSize: 12, color: 'var(--text-dim)' }}>
              Watching for <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                {profile.allergens.map(a => ALLERGEN_LABELS[a]).join(', ')}
              </span> · {profile.goals.length} goal{profile.goals.length === 1 ? '' : 's'}
            </div>
            <button onClick={() => go('profile')} style={{
              background: 'transparent', border: 0, color: 'var(--accent)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>Edit</button>
          </div>
        </div>
      )}

      <div style={{ padding: '24px 20px 0', flex: 1 }}>
        <SectionLabel action={
          <button onClick={() => go('recents')} style={linkBtnStyle}>
            View all
            <svg width="9" height="9" viewBox="0 0 9 9" style={{ marginLeft: 4 }}>
              <path d="M2 1.5L6 4.5L2 7.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        }>Recent · {recents.length}</SectionLabel>
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          {recents.slice(0, 3).map((p, i) => (
            <div key={p.id} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}>
              <RecentRow product={p} onClick={() => go('result', p.id)} showFav />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrimaryActionCard({ tone, eyebrow, title, subtitle, onClick, icon }) {
  const isPrimary = tone === 'primary';
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 16, width: '100%',
      padding: '20px',
      background: isPrimary
        ? 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 18%, var(--surface)) 0%, var(--surface) 80%)'
        : 'var(--surface)',
      border: isPrimary
        ? '0.5px solid color-mix(in oklab, var(--accent) 40%, transparent)'
        : '0.5px solid rgba(255,255,255,0.07)',
      borderRadius: 22,
      color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
      position: 'relative', overflow: 'hidden',
      boxShadow: isPrimary ? '0 0 24px color-mix(in oklab, var(--accent) 12%, transparent)' : 'none',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: isPrimary ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'rgba(255,255,255,0.05)',
        border: isPrimary ? '0.5px solid color-mix(in oklab, var(--accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isPrimary ? 'var(--accent)' : 'var(--text)', flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)',
          color: isPrimary ? 'var(--accent)' : 'var(--text-dim)',
          letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4,
        }}>{eyebrow}</div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{subtitle}</div>
      </div>
      <svg width="18" height="18" viewBox="0 0 18 18" style={{ color: 'var(--text-dim)' }}>
        <path d="M5 3L11 9L5 15" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function BarcodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
        <line x1="3.5" y1="5" x2="3.5" y2="17"/><line x1="6" y1="5" x2="6" y2="17"/>
        <line x1="8.5" y1="5" x2="8.5" y2="17"/><line x1="11" y1="5" x2="11" y2="17"/>
        <line x1="13.5" y1="5" x2="13.5" y2="17"/><line x1="16" y1="5" x2="16" y2="17"/>
        <line x1="18.5" y1="5" x2="18.5" y2="17"/>
      </g>
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="11" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="7.5" y="3.5" width="7" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  );
}

// ─── BARCODE SCAN ─────────────────────────────────────────
function BarcodeScanScreen({ go }) {
  const [phase, setPhase] = useState('scanning');
  useEffect(() => {
    if (phase !== 'scanning') return;
    const t = setTimeout(() => setPhase('success'), 2400);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'success') return;
    const t = setTimeout(() => go('result', 'p_oat_crisps'), 700);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#000' }}>
      <CameraFakeFeed mode="barcode" />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />
      <TopBar onBack={() => go('home')} right={
        <button style={iconBtnStyle}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M3 6V4a1 1 0 011-1h2M13 6V4a1 1 0 00-1-1h-2M3 10v2a1 1 0 001 1h2M13 10v2a1 1 0 01-1 1h-2"
              stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      } />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 180 }}>
        {['tl','tr','bl','br'].map(c => <Corner key={c} pos={c} verdict={phase === 'success' ? 'good' : 'idle'}/>)}
        {phase === 'scanning' && (
          <div style={{
            position: 'absolute', left: 8, right: 8, height: 2, borderRadius: 1,
            background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
            boxShadow: '0 0 12px var(--accent-glow), 0 0 24px var(--accent-glow)',
            animation: 'bl-scan 1.4s ease-in-out infinite alternate',
          }} />
        )}
        {phase === 'success' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'color-mix(in oklab, var(--accent) 12%, transparent)',
            borderRadius: 12, animation: 'bl-pop 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px var(--accent-glow)',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26">
                <path d="M7 13L11 17L19 9" stroke="#0a0a0b" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 110, left: 0, right: 0, textAlign: 'center', padding: '0 32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          fontSize: 13, color: 'var(--text)',
        }}>
          {phase === 'scanning' && <>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)', animation: 'bl-pulse 1.2s ease-in-out infinite' }} />
            Hold steady — scanning barcode
          </>}
          {phase === 'success' && <><span style={{ color: 'var(--accent)' }}>✓</span> Got it — opening result</>}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
        <ModePill active label="Barcode" onClick={() => {}} />
        <ModePill label="Photo" onClick={() => go('photo')} />
      </div>
    </div>
  );
}

function Corner({ pos, verdict }) {
  const c = verdict === 'good' ? 'var(--accent)' : 'rgba(255,255,255,0.85)';
  const sz = 26, w = 2;
  const base = { position: 'absolute', width: sz, height: sz };
  const styles = {
    tl: { ...base, top: 0, left: 0, borderTop: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderTopLeftRadius: 6 },
    tr: { ...base, top: 0, right: 0, borderTop: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderTopRightRadius: 6 },
    bl: { ...base, bottom: 0, left: 0, borderBottom: `${w}px solid ${c}`, borderLeft: `${w}px solid ${c}`, borderBottomLeftRadius: 6 },
    br: { ...base, bottom: 0, right: 0, borderBottom: `${w}px solid ${c}`, borderRight: `${w}px solid ${c}`, borderBottomRightRadius: 6 },
  };
  return <div style={{...styles[pos], boxShadow: verdict === 'good' ? `0 0 12px var(--accent-glow)` : 'none', transition: 'all 0.3s'}} />;
}

function ModePill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', borderRadius: 999,
      background: active ? 'var(--text)' : 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(20px)',
      border: active ? '0.5px solid var(--text)' : '0.5px solid rgba(255,255,255,0.12)',
      color: active ? '#0a0a0b' : 'var(--text)',
      fontSize: 13, fontWeight: 600, letterSpacing: '0.01em', cursor: 'pointer',
    }}>{label}</button>
  );
}

function CameraFakeFeed({ mode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: mode === 'barcode'
          ? 'linear-gradient(180deg, #1a1814 0%, #2a2620 35%, #1f1c17 70%, #0d0c0a 100%)'
          : 'linear-gradient(180deg, #1f2218 0%, #2c3025 35%, #1a1d15 70%, #0c0e0a 100%)',
      }} />
      {mode === 'barcode' && (
        <>
          <div style={{
            position: 'absolute', top: '38%', left: '20%', right: '20%', height: 90,
            background: 'linear-gradient(180deg, rgba(245,235,215,0.15), rgba(245,235,215,0.05))',
            borderRadius: 4, transform: 'perspective(400px) rotateX(8deg)',
          }} />
          <div style={{
            position: 'absolute', top: 'calc(38% + 30px)', left: '32%', right: '32%',
            height: 30, display: 'flex', gap: 1.5, alignItems: 'center',
            transform: 'perspective(400px) rotateX(8deg)',
          }}>
            {[2,1,3,2,1,4,1,2,3,1,2,2,3,1,2,1,3].map((w, i) => (
              <div key={i} style={{ width: w, height: '100%', background: 'rgba(20,15,10,0.7)' }} />
            ))}
          </div>
        </>
      )}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '3px 3px', opacity: 0.7, mixBlendMode: 'overlay',
      }} />
    </div>
  );
}

// ─── PHOTO SCAN ───────────────────────────────────────────
function PhotoScanScreen({ go }) {
  const [phase, setPhase] = useState('framing');
  useEffect(() => {
    if (phase !== 'analyzing') return;
    const t = setTimeout(() => go('result', 'p_grain_bowl'), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', background: '#000' }}>
      <PhotoFakeFeed analyzing={phase === 'analyzing'} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 70%, rgba(0,0,0,0.7) 100%)',
      }} />
      <TopBar onBack={() => go('home')} />
      {phase === 'framing' && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 240, height: 240 }}>
          {['tl','tr','bl','br'].map(c => <Corner key={c} pos={c} />)}
        </div>
      )}
      {phase === 'analyzing' && <AnalyzeOverlay />}
      {phase === 'framing' && (
        <>
          <div style={{ position: 'absolute', top: 130, left: 0, right: 0, textAlign: 'center', padding: '0 32px' }}>
            <div style={{
              display: 'inline-block', padding: '8px 14px', borderRadius: 999,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.1)',
              fontSize: 12, color: 'var(--text)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Center the meal</div>
          </div>
          <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 36 }}>
            <button style={iconBtnStyle}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="9" cy="9" r="2.5" fill="currentColor"/>
              </svg>
            </button>
            <button onClick={() => setPhase('analyzing')} style={{
              width: 76, height: 76, borderRadius: '50%',
              background: 'transparent', border: '3px solid rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 4,
            }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 24px var(--accent-glow)' }} />
            </button>
            <button style={iconBtnStyle} onClick={() => go('barcode')}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <g stroke="currentColor" strokeWidth="1.3">
                  <line x1="3" y1="4" x2="3" y2="14"/><line x1="5.5" y1="4" x2="5.5" y2="14"/>
                  <line x1="8" y1="4" x2="8" y2="14"/><line x1="10.5" y1="4" x2="10.5" y2="14"/>
                  <line x1="13" y1="4" x2="13" y2="14"/><line x1="15" y1="4" x2="15" y2="14"/>
                </g>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PhotoFakeFeed({ analyzing }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 55%, #4a5238 0%, #2c3225 25%, #1a1d15 55%, #0a0c08 100%)',
        filter: analyzing ? 'blur(2px)' : 'none', transition: 'filter 0.4s',
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)',
        width: 240, height: 240, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #d4c8b0 0%, #8a7e60 40%, #524a38 80%, #2a2418 100%)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
        filter: analyzing ? 'blur(2px)' : 'none', transition: 'filter 0.4s',
      }}>
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '32%', height: '40%', borderRadius: '40% 60% 50% 50%', background: '#d97757', opacity: 0.85 }} />
        <div style={{ position: 'absolute', top: '25%', right: '18%', width: '30%', height: '35%', borderRadius: '50% 40% 60% 50%', background: '#7b8a3e', opacity: 0.9 }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '30%', width: '40%', height: '30%', borderRadius: '60% 50% 50% 40%', background: '#b8a060', opacity: 0.85 }} />
        <div style={{ position: 'absolute', top: '55%', left: '15%', width: '18%', height: '18%', borderRadius: '50%', background: '#c43a3a', opacity: 0.9 }} />
      </div>
    </div>
  );
}

function AnalyzeOverlay() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ animation: 'bl-spin 1.6s linear infinite' }}>
          <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
          <circle cx="44" cy="44" r="38" fill="none" stroke="var(--accent)" strokeWidth="2"
            strokeLinecap="round" strokeDasharray="60 240"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }}/>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wordmark size={20} />
        </div>
      </div>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Analyzing</div>
        <div style={{ fontSize: 16, color: 'var(--text)', fontWeight: 500 }}>Identifying components…</div>
      </div>
    </div>
  );
}

// ─── RESULT ───────────────────────────────────────────────
function ResultScreen({ product, go, verdictTreatment = 'medium', showScore = true, profile, onToggleFav }) {
  const v = VERDICT[product.verdict];
  const isPhoto = product.type === 'photo';
  const matchedAllergens = (product.allergens || []).filter(a => profile.allergens.includes(a));
  const alts = (product.alternatives || []).map(id => PRODUCT_INDEX[id]).filter(Boolean);

  return (
    <div style={{ position: 'relative', height: '100%', overflowY: 'auto' }}>
      <div style={{
        position: 'relative', padding: '0 0 28px',
        background: verdictTreatment === 'loud'
          ? `linear-gradient(180deg, color-mix(in oklab, ${v.color} 22%, var(--bg)) 0%, var(--bg) 100%)`
          : verdictTreatment === 'subtle'
          ? 'var(--bg)'
          : `linear-gradient(180deg, color-mix(in oklab, ${v.color} 12%, var(--bg)) 0%, var(--bg) 70%)`,
      }}>
        <TopBar onBack={() => go('home')} right={
          <>
            <button style={iconBtnStyle} onClick={() => onToggleFav(product.id)}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M7 1.5L8.7 5.1L12.5 5.6L9.7 8.3L10.4 12L7 10.2L3.6 12L4.3 8.3L1.5 5.6L5.3 5.1L7 1.5Z"
                  fill={product.favorite ? 'var(--accent)' : 'none'}
                  stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </button>
            <button style={iconBtnStyle} onClick={() => go('compare', product.id)}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="1" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                <rect x="8" y="3" width="5" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            </button>
          </>
        } />

        <div style={{ padding: '8px 24px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
            <ScanTypeIcon type={product.type} />
            {isPhoto ? 'Photo Result' : `Barcode Result`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <ProductThumb product={product} size={64} radius={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {product.brand && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>{product.brand}</div>
              )}
              <div style={{ fontSize: 21, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 4 }}>
                {product.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{product.subtitle}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
            <VerdictRing verdict={product.verdict} score={product.score} size={156} showScore={showScore} animateIn />
          </div>

          <div style={{
            fontSize: 16, color: 'var(--text)', textAlign: 'center',
            lineHeight: 1.45, padding: '0 12px',
            textWrap: 'pretty', letterSpacing: '-0.005em',
          }}>{product.summary}</div>

          {/* Score badges row */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
            <NutriScoreBadge grade={product.nutriScore} />
            <NovaPill group={product.novaGroup} />
            <EcoScoreBadge grade={product.ecoScore} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {matchedAllergens.length > 0 && <AllergenAlert matched={matchedAllergens} />}

        {isPhoto && product.confidence != null && <ConfidenceBar value={product.confidence} />}

        <div>
          <SectionLabel>Why · {product.reasons.length} signals</SectionLabel>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: '6px 16px', border: '0.5px solid rgba(255,255,255,0.06)' }}>
            {product.reasons.map((r, i) => (
              <div key={i} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}>
                <ReasonRow {...r} />
              </div>
            ))}
          </div>
        </div>

        {alts.length > 0 && (
          <div>
            <SectionLabel>Healthier alternatives</SectionLabel>
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto',
              padding: '2px 0 8px', margin: '0 -20px', paddingLeft: 20, paddingRight: 20,
              scrollbarWidth: 'none',
            }}>
              {alts.map(p => (
                <AlternativeCard key={p.id} product={p} onClick={() => go('result', p.id)} />
              ))}
            </div>
          </div>
        )}

        {product.flags && product.flags.length > 0 && (
          <div>
            <SectionLabel>Flags</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.flags.map((f, i) => <FlagChip key={i} {...f} />)}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>Nutrition</SectionLabel>
          <NutritionBlock nutrition={product.nutrition} />
        </div>

        {product.additives && product.additives.length > 0 && (
          <div>
            <SectionLabel>Additives · {product.additives.length}</SectionLabel>
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {product.additives.map((a, i) => (
                <AdditiveRow key={i} additive={a} isLast={i === product.additives.length - 1} />
              ))}
            </div>
          </div>
        )}

        {product.allergens && product.allergens.length > 0 && (
          <div>
            <SectionLabel>Allergens</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {product.allergens.map(a => {
                const isMatch = matchedAllergens.includes(a);
                return (
                  <div key={a} style={{
                    padding: '6px 12px', borderRadius: 999,
                    background: isMatch ? 'color-mix(in oklab, var(--red) 14%, transparent)' : 'rgba(255,255,255,0.04)',
                    border: isMatch ? '0.5px solid color-mix(in oklab, var(--red) 35%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                    color: isMatch ? 'var(--red)' : 'var(--text)',
                    fontSize: 12, fontWeight: 500,
                  }}>{ALLERGEN_LABELS[a] || a}</div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <SectionLabel>{isPhoto ? 'Detected components' : 'Ingredients'}</SectionLabel>
          <div style={{
            background: 'var(--surface)', borderRadius: 14, padding: 16,
            border: '0.5px solid rgba(255,255,255,0.06)',
            fontSize: 14, color: 'var(--text)', lineHeight: 1.6, letterSpacing: '-0.005em',
          }}>
            {(product.ingredients || product.components || []).map((ing, i, arr) => (
              <span key={i}>
                <span style={{ color: /sugar|syrup|maltitol|color|phosphoric|modified/i.test(ing) ? 'var(--amber)' : 'inherit' }}>{ing}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--text-dim)' }}>, </span>}
              </span>
            ))}
          </div>
        </div>

        <button onClick={() => go(product.type)} style={{
          width: '100%', padding: '16px',
          background: 'var(--accent)', color: '#0a0a0b', border: 0, borderRadius: 14,
          fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em',
          cursor: 'pointer', boxShadow: '0 0 24px var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4M12 1V5H8M4 15V11H8" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Scan another
        </button>
      </div>
    </div>
  );
}

// ─── RECENTS ──────────────────────────────────────────────
function RecentsScreen({ go, recents }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = recents.filter(p => {
    if (filter !== 'all' && p.verdict !== filter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.brand?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
      <TopBar title="History" right={<div style={{ width: 36, height: 36 }} />} />
      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: 'var(--text-dim)' }}>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search recents"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--text)', fontSize: 14, letterSpacing: '-0.005em', fontFamily: 'inherit' }}/>
        </div>
      </div>
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        {[['all','All'],['good','Good'],['caution','Caution'],['avoid','Avoid']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            padding: '7px 14px', borderRadius: 999,
            background: filter === id ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: '0.5px solid rgba(255,255,255,0.07)',
            color: filter === id ? 'var(--text)' : 'var(--text-dim)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
        {filtered.length > 0 ? (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}>
                <RecentRow product={p} onClick={() => go('result', p.id)} showFav />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={q ? 'No matches' : 'No recent scans yet'} sub={q ? 'Try a different search.' : 'Scans will appear here automatically.'} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, sub }) {
  return (
    <div style={{ padding: '56px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'rgba(255,255,255,0.04)', border: '0.5px dashed rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ color: 'var(--text-dim)' }}>
          <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M11 7V11L13.5 12.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 240, lineHeight: 1.5 }}>{sub}</div>
    </div>
  );
}

// ─── DISCOVER ─────────────────────────────────────────────
function DiscoverScreen({ go, recents }) {
  const [q, setQ] = useState('');
  const all = SAMPLE_PRODUCTS;
  const goodOnes = all.filter(p => p.verdict === 'good').sort((a,b) => b.score - a.score);
  const filtered = q
    ? all.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase()))
    : null;
  const categories = [
    { id: 'snacks', label: 'Snacks', color: '#c9a86b' },
    { id: 'drinks', label: 'Drinks', color: '#9bbf9b' },
    { id: 'dairy', label: 'Dairy', color: '#f5ecd9' },
    { id: 'meals', label: 'Meals', color: '#7a8a5e' },
    { id: 'sweets', label: 'Sweets', color: '#e8a3a3' },
    { id: 'pantry', label: 'Pantry', color: '#5a4030' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 72 }}>
      <TopBar title="Discover" right={<div style={{ width: 36, height: 36 }}/>} />

      <div style={{ padding: '8px 20px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)', border: '0.5px solid rgba(255,255,255,0.06)',
          borderRadius: 12, padding: '10px 14px',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: 'var(--text-dim)' }}>
            <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products or brands"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 0, color: 'var(--text)', fontSize: 14, fontFamily: 'inherit' }}/>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
        {filtered ? (
          filtered.length > 0 ? (
            <div style={{ background: 'var(--surface)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}>
                  <RecentRow product={p} onClick={() => go('result', p.id)} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="No matches" sub="Try a different search." />
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <SectionLabel>Categories</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {categories.map(c => (
                  <button key={c.id} style={{
                    aspectRatio: '1', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)',
                    background: `linear-gradient(135deg, color-mix(in oklab, ${c.color} 18%, var(--surface)) 0%, var(--surface) 80%)`,
                    color: 'var(--text)', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end',
                    padding: 12, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, marginBottom: 6 }} />
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Top rated · {goodOnes.length}</SectionLabel>
              <div style={{ background: 'var(--surface)', borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                {goodOnes.map((p, i) => (
                  <div key={p.id} style={{ borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)' }}>
                    <RecentRow product={p} onClick={() => go('result', p.id)} showFav />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────
function ProfileScreen({ go, profile, setProfile }) {
  const toggle = (key, val) => {
    const cur = profile[key];
    const next = cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val];
    setProfile({ ...profile, [key]: next });
  };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', paddingBottom: 72, overflow: 'auto' }}>
      <TopBar title="Profile" right={<div style={{ width: 36, height: 36 }}/>} />

      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{
          padding: 20, borderRadius: 18,
          background: 'linear-gradient(135deg, color-mix(in oklab, var(--accent) 15%, var(--surface)) 0%, var(--surface) 80%)',
          border: '0.5px solid color-mix(in oklab, var(--accent) 30%, transparent)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'color-mix(in oklab, var(--accent) 24%, transparent)',
            border: '0.5px solid color-mix(in oklab, var(--accent) 40%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600,
          }}>YO</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>You</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Personal scan profile</div>
          </div>
        </div>

        <div>
          <SectionLabel>Diet</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {DIET_OPTIONS.map(d => {
              const active = profile.diet === d.id;
              return (
                <button key={d.id} onClick={() => setProfile({ ...profile, diet: d.id })} style={{
                  padding: '12px', borderRadius: 12,
                  background: active ? 'color-mix(in oklab, var(--accent) 14%, transparent)' : 'var(--surface)',
                  border: active ? '0.5px solid color-mix(in oklab, var(--accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left',
                }}>{d.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Allergens to avoid</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.keys(ALLERGEN_LABELS).map(a => {
              const active = profile.allergens.includes(a);
              return (
                <button key={a} onClick={() => toggle('allergens', a)} style={{
                  padding: '8px 14px', borderRadius: 999,
                  background: active ? 'color-mix(in oklab, var(--red) 14%, transparent)' : 'var(--surface)',
                  border: active ? '0.5px solid color-mix(in oklab, var(--red) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                  color: active ? 'var(--red)' : 'var(--text)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{ALLERGEN_LABELS[a]}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>Goals</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOAL_OPTIONS.map(g => {
              const active = profile.goals.includes(g.id);
              return (
                <button key={g.id} onClick={() => toggle('goals', g.id)} style={{
                  padding: '8px 14px', borderRadius: 999,
                  background: active ? 'color-mix(in oklab, var(--accent) 14%, transparent)' : 'var(--surface)',
                  border: active ? '0.5px solid color-mix(in oklab, var(--accent) 40%, transparent)' : '0.5px solid rgba(255,255,255,0.07)',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>{g.label}</button>
              );
            })}
          </div>
        </div>

        <div>
          <SectionLabel>About</SectionLabel>
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {[
              { label: 'Scoring methodology', detail: 'How scores work' },
              { label: 'Data sources', detail: 'Open Food Facts + USDA' },
              { label: 'Privacy', detail: 'On-device by default' },
              { label: 'Version', detail: '1.0.4' },
            ].map((row, i, arr) => (
              <div key={i} style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>{row.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{row.detail}</span>
                <svg width="6" height="10" viewBox="0 0 6 10" style={{ color: 'var(--text-dim)', opacity: 0.4 }}>
                  <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE ──────────────────────────────────────────────
function CompareScreen({ go, productA, productB }) {
  const a = productA;
  const altId = (a.alternatives || []).find(id => id !== a.id);
  const fallback = altId
    ? PRODUCT_INDEX[altId]
    : SAMPLE_PRODUCTS.find(p => p.id !== a.id && p.verdict === 'good')
      || SAMPLE_PRODUCTS.find(p => p.id !== a.id);
  const b = productB || fallback;
  const rows = [
    { label: 'Score',      get: p => p.score, fmt: v => v, hi: (av, bv) => av > bv },
    { label: 'Nutri-Score', get: p => p.nutriScore, fmt: v => v, hi: (av, bv) => 'ABCDE'.indexOf(av) < 'ABCDE'.indexOf(bv) },
    { label: 'NOVA',       get: p => p.novaGroup, fmt: v => v, hi: (av, bv) => av < bv },
    { label: 'Calories',   get: p => p.nutrition.kcal, fmt: v => `${v}`, unit: 'kcal' },
    { label: 'Sugar',      get: p => p.nutrition.sugar, fmt: v => `${v}`, unit: 'g', hi: (av,bv) => av < bv },
    { label: 'Protein',    get: p => p.nutrition.protein, fmt: v => `${v}`, unit: 'g', hi: (av, bv) => av > bv },
    { label: 'Sodium',     get: p => p.nutrition.sodium, fmt: v => `${v}`, unit: 'mg', hi: (av,bv) => av < bv },
    { label: 'Fiber',      get: p => p.nutrition.fiber, fmt: v => `${v}`, unit: 'g', hi: (av, bv) => av > bv },
    { label: 'Additives',  get: p => (p.additives || []).length, fmt: v => v, hi: (av,bv) => av < bv },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <TopBar onBack={() => go('result', a.id)} title="Compare" right={<div style={{ width: 36, height: 36 }}/>} />

      <div style={{ padding: '0 20px 24px' }}>
        {/* Heads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[a, b].map((p, i) => (
            <div key={p.id} style={{
              padding: 14, borderRadius: 14,
              background: 'var(--surface)', border: '0.5px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <ProductThumb product={p} size={40} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{p.brand}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{p.name}</div>
              </div>
              <VerdictBadge verdict={p.verdict} score={p.score} size="sm" />
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ background: 'var(--surface)', borderRadius: 14, border: '0.5px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          {rows.map((row, i) => {
            const av = row.get(a), bv = row.get(b);
            const aWins = row.hi ? row.hi(av, bv) : false;
            const bWins = row.hi ? row.hi(bv, av) : false;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
                  color: aWins ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums',
                }}>{row.fmt(av)}{row.unit && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 2 }}>{row.unit}</span>}</div>
                <div style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)',
                  letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', minWidth: 64,
                }}>{row.label}</div>
                <div style={{
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500,
                  color: bWins ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums',
                }}>{row.fmt(bv)}{row.unit && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 2 }}>{row.unit}</span>}</div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.5 }}>
          {a.score > b.score
            ? <><span style={{ color: 'var(--accent)' }}>{a.name}</span> wins on overall score.</>
            : <><span style={{ color: 'var(--accent)' }}>{b.name}</span> wins on overall score.</>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HomeScreen, BarcodeScanScreen, PhotoScanScreen, ResultScreen, RecentsScreen,
  DiscoverScreen, ProfileScreen, CompareScreen, Wordmark,
});
