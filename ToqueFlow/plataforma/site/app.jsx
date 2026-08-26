// app.jsx — Home page App root with Tweaks (Nav + Footer come from chrome.jsx)

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "hero": "particles",
  "mode": "mixed",
  "bgTone": "standard",
  "orange": "balanced",
  "cardStyle": "lines",
  "font": "manrope",
  "density": "regular"
}/*EDITMODE-END*/;

function applyOrangeIntensity(level) {
  const root = document.documentElement;
  if (level === 'subtle') {
    root.style.setProperty('--orange-1', '#8a2a2e');
    root.style.setProperty('--orange-2', '#c8551f');
  } else if (level === 'loud') {
    root.style.setProperty('--orange-1', '#d92128');
    root.style.setProperty('--orange-2', '#ff6b1f');
  } else {
    root.style.setProperty('--orange-1', '#c1272d');
    root.style.setProperty('--orange-2', '#f15a24');
  }
  root.style.setProperty('--orange-grad',
    `linear-gradient(135deg, ${getComputedStyle(root).getPropertyValue('--orange-1').trim()} 0%, ${getComputedStyle(root).getPropertyValue('--orange-2').trim()} 100%)`);
}

function applyFont(font) {
  const root = document.documentElement;
  if (font === 'manrope') {
    root.style.setProperty('--sans', '"Manrope", ui-sans-serif, system-ui, sans-serif');
  } else if (font === 'instrument') {
    root.style.setProperty('--sans', '"Sora", ui-sans-serif, system-ui, sans-serif');
    root.style.setProperty('--display', '"Instrument Serif", "Sora", serif');
  } else {
    root.style.setProperty('--sans', '"Sora", ui-sans-serif, system-ui, sans-serif');
    root.style.setProperty('--display', 'var(--sans)');
  }
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Init scroll-reveal observer once on mount, re-init when content changes
  React.useEffect(() => {
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, [t.hero]);

  // Apply tweaks
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', t.mode === 'dark' ? 'dark' : t.mode === 'light' ? 'light' : 'mixed');
    root.setAttribute('data-hero', t.hero);
    root.setAttribute('data-bg-tone', t.bgTone);
    root.setAttribute('data-card-style', t.cardStyle);
    root.setAttribute('data-density', t.density);
    applyOrangeIntensity(t.orange);
    applyFont(t.font);

    // If global mode is dark or light, override section bgs
    if (t.mode === 'dark') {
      document.body.style.background = 'var(--dark-1)';
      document.body.style.color = 'var(--dark-ink)';
    } else if (t.mode === 'light') {
      document.body.style.background = 'var(--light-0)';
      document.body.style.color = 'var(--light-ink)';
    } else {
      document.body.style.background = '';
      document.body.style.color = '';
    }
  }, [t]);

  // Force-color sections when global mode is set
  const sectionClass = t.mode === 'dark' ? 'force-dark' : t.mode === 'light' ? 'force-light' : '';

  return (
    <div className={sectionClass}>
      <Nav active="inicio" />
      <Hero variant={t.hero} />
      <StatsMega />
      <Problem />
      <SectionDivider />
      <Services />
      <WhyUs />
      <Testimonials />
      <FinalCTA />
      <Footer />

      <TweaksPanel>
        <TweakSection label="Hero" />
        <TweakRadio label="Variación" value={t.hero}
                    options={[
                      { value: 'editorial', label: 'Editorial' },
                      { value: 'blueprint', label: 'Blueprint' },
                      { value: 'particles', label: 'Particles' },
                    ]}
                    onChange={(v) => setTweak('hero', v)} />

        <TweakSection label="Modo global" />
        <TweakRadio label="Esquema" value={t.mode}
                    options={[
                      { value: 'mixed', label: 'Mezcla' },
                      { value: 'light', label: 'Claro' },
                      { value: 'dark',  label: 'Oscuro' },
                    ]}
                    onChange={(v) => setTweak('mode', v)} />
        <TweakRadio label="Tono oscuro" value={t.bgTone}
                    options={['darker', 'standard', 'lighter']}
                    onChange={(v) => setTweak('bgTone', v)} />

        <TweakSection label="Naranja" />
        <TweakRadio label="Intensidad" value={t.orange}
                    options={['subtle', 'balanced', 'loud']}
                    onChange={(v) => setTweak('orange', v)} />

        <TweakSection label="Tipografía" />
        <TweakRadio label="Familia" value={t.font}
                    options={[
                      { value: 'sora', label: 'Sora' },
                      { value: 'manrope', label: 'Manrope' },
                      { value: 'instrument', label: 'Serif mix' },
                    ]}
                    onChange={(v) => setTweak('font', v)} />

        <TweakSection label="Cards" />
        <TweakRadio label="Estilo" value={t.cardStyle}
                    options={[
                      { value: 'lines', label: 'Líneas' },
                      { value: 'solid', label: 'Sólido' },
                      { value: 'glass', label: 'Glass' },
                    ]}
                    onChange={(v) => setTweak('cardStyle', v)} />

        <TweakSection label="Espaciado" />
        <TweakRadio label="Densidad" value={t.density}
                    options={['compact', 'regular', 'comfy']}
                    onChange={(v) => setTweak('density', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
