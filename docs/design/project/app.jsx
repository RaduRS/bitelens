// app.jsx — BiteLens main app shell

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "lime",
  "verdictTreatment": "medium",
  "showScore": true,
  "screen": "home"
}/*EDITMODE-END*/;

const ACCENTS = {
  lime: { color: 'oklch(0.86 0.20 130)', glow: 'oklch(0.86 0.20 130 / 0.4)' },
  jade: { color: 'oklch(0.78 0.16 165)', glow: 'oklch(0.78 0.16 165 / 0.4)' },
  cyan: { color: 'oklch(0.82 0.13 200)', glow: 'oklch(0.82 0.13 200 / 0.4)' },
  teal: { color: 'oklch(0.74 0.13 185)', glow: 'oklch(0.74 0.13 185 / 0.4)' },
};

// Tab bar shows on these screens
const TAB_SCREENS = new Set(['home', 'discover', 'recents', 'profile']);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = React.useState(t.screen || 'home');
  const [productId, setProductId] = React.useState('p_oat_crisps');
  const [recents, setRecents] = React.useState(SAMPLE_PRODUCTS);
  const [profile, setProfile] = React.useState(DEFAULT_PROFILE);

  const accent = ACCENTS[t.accent] || ACCENTS.lime;

  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', accent.color);
    root.style.setProperty('--accent-glow', accent.glow);
  }, [accent.color, accent.glow]);

  React.useEffect(() => {
    if (t.screen && t.screen !== screen) setScreen(t.screen);
  }, [t.screen]);

  const go = (s, id) => {
    if (id) setProductId(id);
    setScreen(s);
  };

  const onToggleFav = (id) => {
    setRecents(rs => rs.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));
  };

  const product = PRODUCT_INDEX[productId] || recents.find(r => r.id === productId);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px',
      background: 'radial-gradient(ellipse at 50% 0%, #1a1a1c 0%, #0a0a0b 60%)',
    }}>
      <div data-screen-label={`BiteLens · ${screen}`} style={{ position: 'relative' }}>
        <IOSDevice dark width={390} height={844}>
          <div style={{
            background: 'var(--bg)', color: 'var(--text)',
            height: '100%', position: 'relative',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {screen === 'home'     && <HomeScreen        go={go} recents={recents} profile={profile} />}
              {screen === 'barcode'  && <BarcodeScanScreen go={go} />}
              {screen === 'photo'    && <PhotoScanScreen   go={go} />}
              {screen === 'result'   && product && <ResultScreen go={go} product={product}
                                          verdictTreatment={t.verdictTreatment} showScore={t.showScore}
                                          profile={profile} onToggleFav={onToggleFav} />}
              {screen === 'recents'  && <RecentsScreen     go={go} recents={recents} />}
              {screen === 'discover' && <DiscoverScreen    go={go} recents={recents} />}
              {screen === 'profile'  && <ProfileScreen     go={go} profile={profile} setProfile={setProfile} />}
              {screen === 'compare'  && product && <CompareScreen go={go} productA={product} />}
            </div>
            {TAB_SCREENS.has(screen) && (
              <TabBar active={screen} onChange={(s) => { setScreen(s); setTweak('screen', s); }} />
            )}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Screen" />
        <TweakSelect label="Active screen" value={screen}
          options={[
            { value: 'home', label: 'Home (Scan)' },
            { value: 'discover', label: 'Discover' },
            { value: 'recents', label: 'History' },
            { value: 'profile', label: 'Profile' },
            { value: 'barcode', label: 'Barcode scan' },
            { value: 'photo', label: 'Photo scan' },
            { value: 'result', label: 'Result' },
            { value: 'compare', label: 'Compare' },
          ]}
          onChange={(v) => { setScreen(v); setTweak('screen', v); }} />
        {(screen === 'result' || screen === 'compare') && (
          <TweakSelect label="Sample product" value={productId}
            options={SAMPLE_PRODUCTS.map(p => ({ value: p.id, label: `${p.name} · ${p.verdict}` }))}
            onChange={setProductId} />
        )}

        <TweakSection label="Brand" />
        <TweakRadio label="Accent" value={t.accent}
          options={[
            { value: 'lime', label: 'Lime' },
            { value: 'jade', label: 'Jade' },
            { value: 'cyan', label: 'Cyan' },
            { value: 'teal', label: 'Teal' },
          ]}
          onChange={(v) => setTweak('accent', v)} />

        <TweakSection label="Result screen" />
        <TweakRadio label="Verdict emphasis" value={t.verdictTreatment}
          options={[
            { value: 'subtle',  label: 'Subtle' },
            { value: 'medium',  label: 'Medium' },
            { value: 'loud',    label: 'Loud' },
          ]}
          onChange={(v) => setTweak('verdictTreatment', v)} />
        <TweakToggle label="Show numeric score" value={t.showScore}
          onChange={(v) => setTweak('showScore', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
