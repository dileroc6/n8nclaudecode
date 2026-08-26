// hero.jsx — three hero variations

function HudCorners() {
  return (
    <>
      <span className="hud-tag no-dot" style={{ top: 110, right: 32, fontFeatureSettings: '"tnum"' }}>
        04:12:08 · bogotá · −05:00
      </span>
      <span className="hud-tag no-dot" style={{ bottom: 36, right: 32 }}>v.26 · build 0420 · stable</span>
    </>
  );
}

function ChatPreview({ style }) {
  return (
    <div className="chat-card" style={style}>
      <div className="chat-h">
        <span className="dot"></span>
        <b>Asistente · FerreteríaYa</b>
        <span>02:41 am</span>
      </div>
      <div className="chat-bubble in">¿Aún tienen disponibilidad para entrega esta semana?</div>
      <div className="chat-bubble out">Sí, tenemos cupo para el jueves. ¿Te paso la cotización ahora mismo?</div>
      <div className="chat-bubble typing"><span></span><span></span><span></span></div>
    </div>
  );
}

function HeroEditorial() {
  return (
    <section className="hero hero-editorial">
      <div className="vid-bg"></div>
      <div className="noise"></div>
      <HudCorners />
      <div className="container hero-inner">
        <div className="eyebrow">automatización b2b e inteligencia artificial</div>
        <h1>
          Tu negocio tiene el potencial.<br />
          <em>Nosotros le ponemos el flow.</em>
        </h1>
        <p className="hero-sub" style={{ marginTop: 36 }}>
          Automatizamos tu seguimiento de leads y operaciones internas.
          <span className="hl"> Cero tareas manuales</span>, <span className="hl">resultados inmediatos</span>.
        </p>
        <div className="hero-actions">
          <a href="#contacto" className="btn btn-primary">Activar mi Flow <span className="arrow">→</span></a>
          <a href="#demo" className="btn btn-ghost">Quiero una demo gratis</a>
        </div>

        <div className="hero-meta">
          <div className="hero-meta-col">
            <b>Leads</b>
            Seguimiento sin huecos. Cada cliente recibe el toque exacto en el momento exacto.
          </div>
          <div className="hero-meta-col">
            <b>Sincronización</b>
            Tus herramientas hablan entre sí. Un dato, una sola fuente de verdad.
          </div>
          <div className="hero-meta-col">
            <b>Tableros</b>
            Métricas en vivo. Ves dónde fugar y dónde acelerar antes que nadie.
          </div>
          <div className="hero-meta-col" style={{ textAlign: 'right', alignSelf: 'end' }}>
            <b>Decisiones</b>
            con datos reales, no con intuiciones
          </div>
        </div>

        <ChatPreview style={{ position: 'absolute', right: 32, top: '38%', zIndex: 3 }} />
      </div>
      <div className="scroll-cue">scroll</div>
    </section>
  );
}

function FlowDiagram() {
  // Animated flow diagram showing message → AI → action
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const i = setInterval(() => setActive(a => (a + 1) % 4), 1400);
    return () => clearInterval(i);
  }, []);
  const nodes = [
    { x: 4, y: 8, w: 44, label: 'cliente.write()' },
    { x: 28, y: 38, w: 44, label: 'toqueflow.read()' },
    { x: 52, y: 18, w: 44, label: 'crm.update()' },
    { x: 56, y: 68, w: 44, label: 'reunión.book()' },
  ];
  return (
    <div className="flow-diagram">
      <svg className="flow-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ln" x1="0" x2="1">
            <stop offset="0" stopColor="#c1272d" stopOpacity=".25" />
            <stop offset="1" stopColor="#f15a24" stopOpacity=".85" />
          </linearGradient>
        </defs>
        <path d="M 26 14 C 35 14 35 48 50 48" stroke="url(#ln)" strokeWidth="0.6" fill="none" />
        <path d="M 50 48 C 65 48 65 26 74 26" stroke="url(#ln)" strokeWidth="0.6" fill="none" />
        <path d="M 50 48 C 65 48 65 76 78 76" stroke="url(#ln)" strokeWidth="0.6" fill="none" />
        {/* moving dot */}
        <circle r="1.2" fill="#f15a24">
          <animateMotion dur="3s" repeatCount="indefinite" path="M 26 14 C 35 14 35 48 50 48 C 65 48 65 26 74 26" />
        </circle>
      </svg>
      {nodes.map((n, i) => (
        <div key={i} className={`flow-node ${active === i ? 'active' : ''}`}
             style={{ left: `${n.x}%`, top: `${n.y}%`, width: `${n.w}%` }}>
          {n.label}
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 14, left: 14, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--light-mute)' }}>
        flow · runtime
      </div>
      <div style={{ position: 'absolute', bottom: 14, right: 14, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--orange-2)' }}>
        ● live
      </div>
    </div>
  );
}

function HeroBlueprint() {
  return (
    <section className="hero hero-blueprint">
      <div className="bp-grid"></div>
      <div className="container hero-inner">
        <div className="eyebrow">automatización b2b e inteligencia artificial</div>
        <div className="hero-grid">
          <div>
            <h1>
              Tu negocio tiene el potencial.<br/>
              <em>Nosotros le ponemos el flow.</em>
            </h1>
            <p className="hero-sub" style={{ marginTop: 28 }}>
              Automatizamos tu seguimiento de leads y operaciones internas.
              <span className="hl"> Cero tareas manuales</span>, <span className="hl">resultados inmediatos</span>.
            </p>
            <div className="hero-actions">
              <a href="#contacto" className="btn btn-primary">Activar mi Flow <span className="arrow">→</span></a>
              <a href="#demo" className="btn btn-ghost">Quiero una demo gratis</a>
            </div>
          </div>
          <FlowDiagram />
        </div>
      </div>
      <div className="scroll-cue">scroll</div>
    </section>
  );
}

function Particles({ count = 28 }) {
  const dots = React.useMemo(
    () => Array.from({ length: count }).map((_, i) => ({
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 60,
      delay: Math.random() * -12,
      duration: 10 + Math.random() * 14,
      size: 1 + Math.random() * 2.2,
    })), [count]
  );
  return (
    <div className="particles">
      {dots.map((d, i) => (
        <span key={i} className="particle" style={{
          left: `${d.left}%`,
          width: d.size, height: d.size,
          animationDuration: `${d.duration}s`,
          animationDelay: `${d.delay}s`,
          '--dx': `${d.dx}vw`,
        }} />
      ))}
    </div>
  );
}

function HeroParticles() {
  return (
    <section className="hero hero-particles">
      <video
        className="hero-video"
        src="https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/hero-bg.mp4"
        autoPlay muted loop playsInline
        aria-hidden="true"
      />
      <div className="hero-video-overlay"></div>
      <div className="center-glow"></div>
      <Particles count={36} />
      <div className="bp-grid fine" style={{ opacity: .35 }}></div>
      <span className="hud-tag no-dot" style={{ bottom: 36, right: 32 }}>v.26 · build 0420</span>
      <div className="container hero-inner">
        <div className="eyebrow" style={{ justifyContent: 'center', display: 'inline-flex' }}>automatización b2b e inteligencia artificial</div>
        <h1>
          Tu negocio tiene el potencial.<br/>
          <em>Nosotros le ponemos el flow.</em>
        </h1>
        <p className="hero-sub">
          Automatizamos tu seguimiento de leads y operaciones internas.
          <span className="hl"> Cero tareas manuales</span>, <span className="hl">resultados inmediatos</span>.
        </p>
        <div className="hero-actions">
          <a href="#contacto" className="btn btn-primary">Activar mi Flow <span className="arrow">→</span></a>
          <a href="#demo" className="btn btn-ghost">Quiero una demo gratis</a>
        </div>
      </div>
      <div className="scroll-cue">scroll</div>
    </section>
  );
}

function Hero({ variant }) {
  if (variant === 'blueprint') return <HeroBlueprint />;
  if (variant === 'particles') return <HeroParticles />;
  return <HeroEditorial />;
}

Object.assign(window, { Hero });
