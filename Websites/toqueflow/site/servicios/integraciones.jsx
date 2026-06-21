// integraciones.jsx — Servicio: Integraciones & sistemas

function IntegHero() {
  return (
    <section className="hero hero-inner section-dark">
      <img className="photo-bg" src={$('assets/img/tech-network.jpg')} alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ left: '-180px', top: '-180px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>servicio 03 · integraciones & sistemas</div>
        <h1 data-reveal data-reveal-delay="1">
          Tus herramientas dejan<br/>
          <em>de hablar idiomas distintos.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '62ch', marginTop: 28 }}>
          Conectamos lo que ya usas —ERP, CRM, contabilidad, pagos, Calendar, WhatsApp— para que <span className="hl">un dato entre una sola vez</span> y aparezca donde tenga que aparecer. Sin migrar nada, sin doble digitación.
        </p>
        <div className="hero-actions" data-reveal data-reveal-delay="3">
          <a href={$('contacto.html')} className="btn btn-primary">Conectar mis sistemas <span className="arrow">→</span></a>
          <a href="#mapa" className="btn btn-ghost">Ver cómo se conecta</a>
        </div>
      </div>
    </section>
  );
}

// The "double-entry" problem
function DoubleEntry() {
  return (
    <section className="section section-light">
      <div className="container">
        <div className="cold-grid">
          <div data-reveal>
            <div className="eyebrow">el problema</div>
            <h2 style={{ marginTop: 12 }}>
              El mismo dato,<br/>
              <span className="hl">escrito cuatro veces.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '46ch' }}>
              Llega un pedido. Alguien lo copia al CRM. Otro lo pasa a la factura. Otro lo registra en el Excel de inventario. Otro lo anota para el envío. <span className="hl">Cuatro veces el mismo dato</span>, cuatro lugares donde algo puede salir mal.
            </p>
            <p style={{ marginTop: 16, maxWidth: '46ch' }}>
              No es que falten herramientas. Es que ninguna se habla con la otra.
            </p>
          </div>
          <div className="cold-card" data-reveal="right" data-reveal-delay="1">
            <div className="cold-card-h">
              <span className="cold-tag">// un pedido, hoy</span>
              <span className="cold-count">4× digitado</span>
            </div>
            <ul className="cold-list">
              <li><span className="cold-name">Formulario web</span><span className="cold-time">→ origen</span></li>
              <li className="is-cold"><span className="cold-name">CRM</span><span className="cold-time">copiado a mano</span></li>
              <li className="is-cold"><span className="cold-name">Factura</span><span className="cold-time">copiado a mano</span></li>
              <li className="is-cold"><span className="cold-name">Inventario (Excel)</span><span className="cold-time">copiado a mano</span></li>
              <li className="is-cold"><span className="cold-name">Guía de envío</span><span className="cold-time">copiado a mano</span></li>
            </ul>
            <div className="cold-foot">
              <span>● <b>cada copia</b> es una oportunidad de error</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01', tag: 'mapeamos',
      h: 'Dibujamos por dónde van tus datos.',
      p: 'Qué entra, de dónde, a dónde tiene que llegar. Marcamos cada salto manual: ahí es donde se pierde tiempo y se cuelan errores.',
      hl: 'cada salto manual',
      icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4"/><circle cx="12" cy="12" r="3"/></svg>),
    },
    {
      n: '02', tag: 'conectamos',
      h: 'Enlazamos tus herramientas entre sí.',
      p: 'Vía API, webhooks o las conexiones que cada sistema permita. No te pedimos cambiar de software: trabajamos con el que ya tienes.',
      hl: 'el que ya tienes',
      icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>),
    },
    {
      n: '03', tag: 'vigilamos',
      h: 'Si algo se cae, lo sabes al instante.',
      p: 'Cada conexión tiene control. Si un sistema deja de responder o un dato no cuadra, te avisamos con qué pasó y qué falta para retomar.',
      hl: 'te avisamos',
      icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z"/><path d="M9 12l2 2 4-4"/></svg>),
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>cómo funciona</div>
          <h2 data-reveal data-reveal-delay="1">
            Tres pasos para que tus sistemas<br/>
            <span className="hl">trabajen como uno solo.</span>
          </h2>
        </div>
        <div className="process-grid">
          <div className="process-line"></div>
          {steps.map((s, i) => {
            const parts = s.p.split(s.hl);
            return (
              <article key={s.n} className="process-step" data-reveal data-reveal-delay={i + 1}>
                <div className="process-marker">
                  <div className="process-icon">{s.icon}</div>
                  <div className="process-n" style={{ background: 'var(--light-0)' }}>{s.n}</div>
                </div>
                <div className="process-tag">// {s.tag}</div>
                <h3>{s.h}</h3>
                <p>{parts[0]}<span className="hl" style={{fontWeight:'inherit'}}>{s.hl}</span>{parts[1]}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Integration map — hub & spoke animated
function IntegrationMap() {
  const nodes = [
    { label: 'WhatsApp', x: 50, y: 6 },
    { label: 'CRM', x: 88, y: 26 },
    { label: 'Contabilidad', x: 94, y: 68 },
    { label: 'Pagos', x: 62, y: 92 },
    { label: 'Calendar', x: 30, y: 92 },
    { label: 'ERP', x: 6, y: 68 },
    { label: 'Inventario', x: 12, y: 26 },
  ];
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % nodes.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="section section-dark" id="mapa" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .45 }}></div>
      <div className="glow" style={{ right: '-220px', top: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="demo-grid">
          <div data-reveal>
            <div className="eyebrow">el mapa</div>
            <h2 style={{ marginTop: 12 }}>
              ToqueFlow en el centro,<br/>
              <span className="hl">todo lo demás conectado.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '44ch' }}>
              Nos volvemos el punto donde tus herramientas se encuentran. El dato entra una vez y fluye a donde tenga que ir, en tiempo real.
            </p>
            <ul className="demo-points">
              <li><span className="demo-point-dot"></span><span><b>Una sola fuente de verdad</b> — sin versiones distintas del mismo dato.</span></li>
              <li><span className="demo-point-dot"></span><span><b>Tiempo real</b> — sin esperar a que alguien "lo pase".</span></li>
              <li><span className="demo-point-dot"></span><span><b>Sin migrar</b> — vive sobre lo que ya usas.</span></li>
            </ul>
          </div>
          <div data-reveal="right" data-reveal-delay="1">
            <div className="integ-map">
              <svg className="integ-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="hubg"><stop offset="0" stopColor="#f15a24" stopOpacity=".5"/><stop offset="1" stopColor="#f15a24" stopOpacity="0"/></radialGradient>
                </defs>
                {nodes.map((n, i) => (
                  <line key={i} x1="50" y1="50" x2={n.x} y2={n.y}
                        stroke={active === i ? '#f15a24' : 'rgba(233,236,238,.14)'}
                        strokeWidth={active === i ? '0.7' : '0.4'} />
                ))}
                <circle cx="50" cy="50" r="16" fill="url(#hubg)" />
              </svg>
              <div className="integ-hub">
                <img src={$('assets/favicon.png')} alt="ToqueFlow" />
              </div>
              {nodes.map((n, i) => (
                <div key={i} className={`integ-node ${active === i ? 'is-on' : ''}`} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
                  {n.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tools() {
  const tools = ['WhatsApp', 'Gmail', 'Google Calendar', 'Google Sheets', 'HubSpot', 'Pipedrive', 'Notion', 'Slack', 'Stripe', 'Wompi', 'PayU', 'Mercado Pago', 'Siigo', 'Alegra', 'World Office', 'Zapier', 'Make', 'Airtable', 'Telegram', 'Drive'];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>con qué conectamos</div>
          <h2 data-reveal data-reveal-delay="1">
            Si tiene API,<br/>
            <span className="hl">lo conectamos.</span>
          </h2>
        </div>
        <div className="tools-grid" style={{ marginTop: 40 }}>
          {tools.map((t, i) => (
            <div key={t} className="tool-chip" data-reveal data-reveal-delay={(i % 4) + 1} style={{ background: '#fff' }}>
              <span className="tool-dot"></span>
              <span>{t}</span>
            </div>
          ))}
          <div className="tool-chip tool-chip-more" data-reveal data-reveal-delay="4">
            <span>+ lo que tú uses</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const qs = [
    { q: '¿Tengo que cambiar mis herramientas actuales?', a: 'No. Justo al contrario: integramos las que ya tienes. Si mañana cambias una, ajustamos la conexión sin romper el resto.' },
    { q: '¿Y si mi sistema es viejo o muy de nicho?', a: 'La mayoría se puede conectar por API o por archivos. Si el tuyo no expone nada, buscamos el puente posible (correo, exportaciones, RPA) y te decimos con franqueza qué se puede y qué no.' },
    { q: '¿Qué pasa si una conexión se cae?', a: 'Cada integración tiene monitoreo. Si un sistema deja de responder, te avisamos de inmediato con qué falló y qué hace falta. Nada se pierde en silencio.' },
    { q: '¿Mis datos quedan seguros?', a: 'Sí. No almacenamos lo que no necesitamos, las conexiones van cifradas y tú decides qué se comparte con qué. Todo queda documentado.' },
    { q: '¿Cuánto toma conectar todo?', a: 'Una integración simple, días. Un ecosistema completo (ERP + CRM + pagos + inventario), unas semanas. Empezamos por la conexión que más tiempo te ahorra.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>preguntas que nos hacen</div>
          <h2 data-reveal data-reveal-delay="1">
            Lo que la gente quiere saber<br/>
            <span className="hl">antes de conectar.</span>
          </h2>
        </div>
        <div className="faq-list">
          {qs.map((it, i) => (
            <div key={i} className={`faq-item ${open === i ? 'is-open' : ''}`} data-reveal data-reveal-delay={(i % 3) + 1}>
              <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                <span className="faq-n">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq-q-text">{it.q}</span>
                <span className="faq-chev">+</span>
              </button>
              <div className="faq-a"><p>{it.a}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section section-dark final-cta">
      <img className="photo-bg" src={$('assets/img/wavy-pattern.jpg')} alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .35 }}></div>
      <div className="glow"></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="eyebrow" data-reveal>activa el flow</div>
        <h2 data-reveal data-reveal-delay="1">
          Deja de pasar datos a mano.<br/>
          <span className="hl">Que tus sistemas lo hagan solos.</span>
        </h2>
        <div className="final-cta-actions" data-reveal data-reveal-delay="2">
          <a href={$('contacto.html')} className="btn btn-primary">Conectar mis sistemas <span className="arrow">→</span></a>
          <a href={$('contacto.html')} className="btn btn-ghost">Hablar con el equipo</a>
        </div>
      </div>
    </section>
  );
}

function IntegApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div>
      <Nav active="servicios" />
      <IntegHero />
      <DoubleEntry />
      <HowItWorks />
      <IntegrationMap />
      <Tools />
      <Faq />
      <FinalCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<IntegApp />);
