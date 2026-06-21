// nosotros.jsx — Nosotros page

function NosotrosHero() {
  return (
    <section className="hero hero-inner section-dark">
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ right: '-200px', top: '-120px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>nosotros</div>
        <h1 data-reveal data-reveal-delay="1">
          Hacemos que tu negocio funcione<br/>
          <em>sin que nadie tenga que estar encima.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '64ch', marginTop: 32 }}>
          Somos un equipo pequeño y obsesivo. Diseñamos sistemas que atienden, venden y dan seguimiento por ti. <span className="hl">Si todo fluye y nadie se da cuenta, hicimos bien nuestro trabajo.</span>
        </p>
      </div>
      <div className="scroll-cue">scroll</div>
    </section>
  );
}

function Manifesto() {
  const beliefs = [
    { t: 'Creemos que automatizar dejó de ser un lujo. Hoy es ', hl: 'lo mínimo', x: ' para que un negocio no se ahogue en tareas.' },
    { t: 'Tu mejor vendedor no debería perder el día copiando datos. Y tu cliente no debería esperar dos días por una respuesta que un buen sistema ', hl: 'da en cuatro minutos', x: '.' },
    { t: 'La mejor tecnología es la que ', hl: 'no se siente como tecnología', x: '. Tu cliente solo nota que lo atienden bien y rápido.' },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="manifesto-grid">
          <div className="manifesto-fig" data-reveal>
            <img src={$('assets/img/portrait-light.jpg')} alt="" loading="lazy" />
            <div className="manifesto-fig-tint"></div>
            <span className="manifesto-fig-tag">// flow.invisible</span>
          </div>
          <div className="manifesto-body">
            <div className="eyebrow" data-reveal>manifiesto</div>
            <h2 data-reveal data-reveal-delay="1">
              Cómo pensamos <span className="hl">cuando construimos.</span>
            </h2>
            <div className="manifesto-text">
              {beliefs.map((b, i) => (
                <p key={i} data-reveal data-reveal-delay={i + 1}>
                  {b.t}<span className="hl" style={{fontWeight:'inherit'}}>{b.hl}</span>{b.x}
                </p>
              ))}
              <p className="punchline" data-reveal data-reveal-delay="4">
                Eso hacemos. Calladito. Constante. Confiable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProcessTimeline() {
  const steps = [
    {
      n: '01',
      tag: 'diagnóstico',
      h: 'Te escuchamos.',
      p: '30 minutos contigo para entender qué te quita tiempo y dónde se te escapan clientes.',
      hl: 'dónde se te escapan clientes',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M6 18a4 4 0 0 1 12 0" /><circle cx="12" cy="9" r="3.5" />
        </svg>
      ),
    },
    {
      n: '02',
      tag: 'plan',
      h: 'Te lo dibujamos.',
      p: 'Te entregamos un plan claro: qué se va a automatizar, en qué orden y con qué herramientas.',
      hl: 'qué se va a automatizar',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4h12l4 4v12H4z" /><path d="M16 4v4h4" />
          <path d="M8 12h8M8 16h5" />
        </svg>
      ),
    },
    {
      n: '03',
      tag: 'lo armamos',
      h: 'Lo construimos.',
      p: 'En 5 días hábiles tenemos lo primero corriendo. Tú lo pruebas antes de usarlo con clientes reales.',
      hl: '5 días hábiles',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 6h7v7" /><path d="M21 6 10 17" />
          <path d="M3 17a4 4 0 0 1 4-4h2" />
        </svg>
      ),
    },
    {
      n: '04',
      tag: 'lo encendemos',
      h: 'Lo prendemos.',
      p: 'Sale al aire con vigilancia diaria. Te acompañamos durante el primer mes para ajustar lo que haga falta.',
      hl: 'el primer mes',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v6M5.6 5.6l4.2 4.2M3 12h6M5.6 18.4l4.2-4.2M12 21v-6M18.4 18.4l-4.2-4.2M21 12h-6M18.4 5.6l-4.2 4.2" />
        </svg>
      ),
    },
  ];
  return (
    <section className="section section-dark process">
      <div className="bp-grid" style={{ opacity: .45 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="shead">
          <div className="eyebrow" data-reveal>cómo trabajamos</div>
          <h2 data-reveal data-reveal-delay="1">
            Cuatro pasos.<br/><span className="hl">Sin vueltas.</span>
          </h2>
          <p data-reveal data-reveal-delay="2" style={{ maxWidth: '60ch', marginTop: 20 }}>
            Nuestro proceso es corto a propósito. Si no podemos darte un resultado útil en una semana, no era el problema correcto para empezar.
          </p>
        </div>
        <div className="process-grid">
          <div className="process-line"></div>
          {steps.map((s, i) => (
            <article key={s.n} className="process-step" data-reveal data-reveal-delay={i + 1}>
              <div className="process-marker">
                <div className="process-icon">{s.icon}</div>
                <div className="process-n">{s.n}</div>
              </div>
              <div className="process-tag">// {s.tag}</div>
              <h3>{s.h}</h3>
              <p>
                {s.p.split(s.hl)[0]}
                <span className="hl" style={{fontWeight:'inherit'}}>{s.hl}</span>
                {s.p.split(s.hl)[1]}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Principles() {
  const rules = [
    {
      n: '01',
      h: 'Tu negocio manda',
      p: 'Adaptamos el sistema a tu manera de trabajar, no al revés.',
      hl: 'a tu manera de trabajar',
    },
    {
      n: '02',
      h: 'Sin caja negra',
      p: 'Todo queda documentado y a la vista. Tu equipo entiende cómo funciona y puede ajustarlo sin esperarnos.',
      hl: 'sin esperarnos',
    },
    {
      n: '03',
      h: 'Pequeños a propósito',
      p: 'Hablas directo con quien arma tu sistema. Sin intermediarios.',
      hl: 'Sin intermediarios',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>principios</div>
          <h2 data-reveal data-reveal-delay="1">
            Cómo trabajamos,<br/><span className="hl">en tres reglas.</span>
          </h2>
        </div>
        <div className="principles-grid">
          {rules.map((r, i) => {
            const parts = r.p.split(r.hl);
            return (
              <article key={r.n} className="principle" data-reveal data-reveal-delay={i + 1}>
                <div className="principle-n">{r.n}</div>
                <h3>{r.h}</h3>
                <p>{parts[0]}<span className="hl" style={{fontWeight:'inherit'}}>{r.hl}</span>{parts[1]}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NosotrosFinalCTA() {
  return (
    <section className="section section-dark final-cta">
      <div className="bp-grid" style={{ opacity: .35 }}></div>
      <div className="glow"></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="eyebrow" data-reveal>trabajemos juntos</div>
        <h2 data-reveal data-reveal-delay="1">
          Si llegaste hasta acá,<br/>
          <span className="hl">probablemente ya somos compatibles.</span>
        </h2>
        <div className="final-cta-actions" data-reveal data-reveal-delay="2">
          <a href="contacto.html" className="btn btn-primary">Activar mi Flow <span className="arrow">→</span></a>
          <a href="contacto.html#diagnostico" className="btn btn-ghost">Quiero la demo gratis</a>
        </div>
      </div>
    </section>
  );
}

function NosotrosApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="nosotros" />
      <NosotrosHero />
      <Manifesto />
      <ProcessTimeline />
      <Principles />
      <NosotrosFinalCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NosotrosApp />);
