// automatizacion.jsx — Servicio: Tareas automáticas

// ── Hero ────────────────────────────────────────────────────────────────
function AutoHero() {
  return (
    <section className="hero hero-inner section-dark">
      <img className="photo-bg" src={$('https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/img/tech-network.jpg')} alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ right: '-180px', top: '-180px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>servicio 02 · automatización de procesos</div>
        <h1 data-reveal data-reveal-delay="1">
          Lo que se puede repetir,<br/>
          <em>se puede automatizar.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '60ch', marginTop: 28 }}>
          Cotizar, agendar, registrar al cliente, enviar la factura, recordar el pago. Todo eso que repites cada semana <span className="hl">lo dejamos funcionando solo</span>, conectado a las herramientas que ya usas.
        </p>
        <div className="hero-actions" data-reveal data-reveal-delay="3">
          <a href={$('contacto.html')} className="btn btn-primary">Automatizar mi operación <span className="arrow">→</span></a>
          <a href="#flow" className="btn btn-ghost">Ver un flow en acción</a>
        </div>
      </div>
    </section>
  );
}

// ── Before vs After ─────────────────────────────────────────────────────
function BeforeAfter() {
  const before = [
    { t: 'Cliente llena formulario en la web.', m: '+ 1 min' },
    { t: 'Te llega un correo. Lo abres cuando puedes.', m: '+ 30 min' },
    { t: 'Copias los datos al CRM. Otra ventana, otro tab.', m: '+ 4 min' },
    { t: 'Buscas el PDF de la cotización en Drive.', m: '+ 3 min' },
    { t: 'Cambias el nombre, el precio, la fecha.', m: '+ 5 min' },
    { t: 'Mandas WhatsApp con el PDF.', m: '+ 2 min' },
    { t: 'Anotas en una libreta para hacer seguimiento.', m: '+ 1 min' },
  ];
  const after = [
    { t: 'Cliente llena formulario en la web.', m: 'instantáneo' },
    { t: 'Se crea el lead en tu CRM con los datos correctos.', m: '0 s' },
    { t: 'Se arma la cotización con su nombre, producto y precio.', m: '2 s' },
    { t: 'Le llega por WhatsApp con un mensaje en tu tono.', m: '4 s' },
    { t: 'La conversación queda agendada para seguimiento.', m: '5 s' },
    { t: 'Si paga, recibes la notificación con la factura adjunta.', m: 'automático' },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>el contraste</div>
          <h2 data-reveal data-reveal-delay="1">
            Lo mismo,<br/>
            <span className="hl">pero sin hacerlo a mano.</span>
          </h2>
          <p data-reveal data-reveal-delay="2" style={{ marginTop: 20, maxWidth: '56ch' }}>
            Esto es lo que pasa cuando llega un lead a tu negocio hoy, comparado con lo que pasa cuando el flow está prendido.
          </p>
        </div>
        <div className="ba-grid">
          <div className="ba-col ba-before" data-reveal>
            <div className="ba-h">
              <span className="ba-tag">// antes</span>
              <span className="ba-total">46 min · 7 pasos manuales</span>
            </div>
            <ol className="ba-list">
              {before.map((s, i) => (
                <li key={i}>
                  <span className="ba-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ba-text">{s.t}</span>
                  <span className="ba-time">{s.m}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="ba-col ba-after" data-reveal="right" data-reveal-delay="1">
            <div className="ba-h">
              <span className="ba-tag" style={{ color: 'var(--orange-2)' }}>// después</span>
              <span className="ba-total ba-total-after">11 segundos · 0 pasos manuales</span>
            </div>
            <ol className="ba-list">
              {after.map((s, i) => (
                <li key={i}>
                  <span className="ba-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="ba-text">{s.t}</span>
                  <span className="ba-time ba-time-after">{s.m}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How it works ────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01', tag: 'identifica',
      h: 'Encontramos lo que repites.',
      p: 'Una semana contigo y tu equipo. Marcamos cada tarea manual que aparece más de tres veces. Esa es la lista.',
      hl: 'más de tres veces',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
      ),
    },
    {
      n: '02', tag: 'conecta',
      h: 'Enlazamos las herramientas que ya usas.',
      p: 'WhatsApp, tu CRM, Google Calendar, Stripe, Drive, Excel. No te pedimos cambiar de software. Los conectamos entre sí.',
      hl: 'No te pedimos cambiar',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </svg>
      ),
    },
    {
      n: '03', tag: 'corre solo',
      h: 'Encendemos el flow y lo vigilamos.',
      p: 'En siete días tienes los primeros flujos vivos. Te mandamos un reporte semanal con qué se corrió, qué se ahorró y qué hay que ajustar.',
      hl: 'qué se ahorró',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v6M5.6 5.6l4.2 4.2M3 12h6M5.6 18.4l4.2-4.2M12 21v-6M18.4 18.4l-4.2-4.2M21 12h-6M18.4 5.6l-4.2 4.2" />
        </svg>
      ),
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>cómo funciona</div>
          <h2 data-reveal data-reveal-delay="1">
            Tres pasos para que tu operación<br/>
            <span className="hl">corra sin empujarla.</span>
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

// ── Animated flow diagram ───────────────────────────────────────────────
function FlowDiagram() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200);
    return () => clearInterval(id);
  }, []);
  // Walk along the chain: 0 = trigger, 1 = crm, 2 = doc, 3 = wa, 4 = calendar
  const active = tick % 5;

  const node = (top, left, label, sub, on) => (
    <div
      className={`fd-node ${on ? 'is-on' : ''}`}
      style={{ top: `${top}%`, left: `${left}%` }}
    >
      <div className="fd-node-label">{label}</div>
      <div className="fd-node-sub">{sub}</div>
    </div>
  );

  return (
    <div className="flow-diagram-svc">
      <svg className="fd-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fd-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#c1272d" stopOpacity=".25" />
            <stop offset="1" stopColor="#f15a24" stopOpacity=".85" />
          </linearGradient>
        </defs>

        {/* trigger -> crm */}
        <path d="M 14 22 C 30 22 30 50 50 50" stroke="url(#fd-line)" strokeWidth=".5" fill="none" />
        {/* crm -> doc */}
        <path d="M 50 50 C 65 50 65 22 84 22" stroke="url(#fd-line)" strokeWidth=".5" fill="none" />
        {/* crm -> wa */}
        <path d="M 50 50 C 65 50 65 78 84 78" stroke="url(#fd-line)" strokeWidth=".5" fill="none" />
        {/* crm -> calendar */}
        <path d="M 50 50 C 30 50 30 78 16 78" stroke="url(#fd-line)" strokeWidth=".5" fill="none" />

        {/* Moving dot */}
        <circle r="1.2" fill="#f15a24">
          <animateMotion dur="11s" repeatCount="indefinite"
            path="M 14 22 C 30 22 30 50 50 50 C 65 50 65 22 84 22 M 84 22 L 50 50 M 50 50 C 65 50 65 78 84 78 M 84 78 L 50 50 M 50 50 C 30 50 30 78 16 78" />
        </circle>
      </svg>

      {node(14,  4, 'Formulario web', 'trigger', active === 0)}
      {node(42, 40, 'CRM', 'lead creado',       active === 1)}
      {node(14, 75, 'Cotización PDF', 'generada', active === 2)}
      {node(70, 75, 'WhatsApp', 'enviado',      active === 3)}
      {node(70,  6, 'Calendar', 'agendado',     active === 4)}
    </div>
  );
}

function FlowSection() {
  return (
    <section className="section section-dark" id="flow" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .45 }}></div>
      <div className="glow" style={{ left: '-220px', bottom: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="demo-grid">
          <div data-reveal>
            <div className="eyebrow">un flow real</div>
            <h2 style={{ marginTop: 12 }}>
              Una entrada,<br/>
              <span className="hl">cuatro cosas que pasan solas.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '44ch' }}>
              Un cliente llena el formulario. En menos de 10 segundos, el lead queda en tu CRM, la cotización armada, el WhatsApp enviado y la reunión agendada. Sin que nadie mueva un dedo.
            </p>
            <ul className="demo-points">
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Disparador único</b> — un formulario, un mensaje, un click.</span>
              </li>
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Salidas en paralelo</b> — todo pasa al mismo tiempo.</span>
              </li>
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Vive en tus herramientas</b> — sin migrar nada.</span>
              </li>
            </ul>
          </div>
          <div data-reveal="right" data-reveal-delay="1">
            <FlowDiagram />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Common automations ──────────────────────────────────────────────────
function CommonAutomations() {
  const items = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
      h: 'Cotizaciones automáticas',
      p: 'El cliente pregunta por un producto y recibe la propuesta personalizada con su nombre y precio en menos de 30 segundos.',
      hl: 'menos de 30 segundos',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
      h: 'Agendamiento sin ping-pong',
      p: 'El cliente ve tus huecos reales en Google Calendar y reserva. Tú recibes la confirmación con todos los datos.',
      hl: 'todos los datos',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      h: 'Registro automático en CRM',
      p: 'Cada lead, cada llamada, cada mensaje entra al CRM con sus datos correctos. Sin copy-paste, sin tabs abiertos.',
      hl: 'Sin copy-paste',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M4 9h16" /><circle cx="9" cy="14" r="1.2" fill="currentColor" />
        </svg>
      ),
      h: 'Facturación al cerrar',
      p: 'Cliente paga, factura sale. Llega al correo correcto, queda registrada en tu contabilidad y tú recibes la notificación.',
      hl: 'recibes la notificación',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
      h: 'Recordatorios de pago',
      p: 'Tres días antes del vencimiento, una semana después si no pagó. Sin que tú estés revisando una hoja de cobros.',
      hl: 'Sin que tú estés revisando',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 6-6" />
        </svg>
      ),
      h: 'Reportes que llegan solos',
      p: 'Cada lunes, en tu correo: cuántos leads entraron, cuántos se cerraron, qué falta. Sin abrir un dashboard.',
      hl: 'Sin abrir un dashboard',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>algunas que ya viven</div>
          <h2 data-reveal data-reveal-delay="1">
            Las tareas que más automatizamos<br/>
            <span className="hl">en negocios como el tuyo.</span>
          </h2>
        </div>
        <div className="features-grid">
          {items.map((f, i) => {
            const parts = f.p.split(f.hl);
            return (
              <article key={i} className="feature" data-reveal data-reveal-delay={(i % 3) + 1}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.h}</h3>
                <p>{parts[0]}<span className="hl" style={{fontWeight:'inherit'}}>{f.hl}</span>{parts[1]}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Tools integrations grid ─────────────────────────────────────────────
function Tools() {
  const tools = [
    'WhatsApp', 'Gmail', 'Google Calendar', 'Google Sheets',
    'HubSpot', 'Pipedrive', 'Notion', 'Slack',
    'Stripe', 'Wompi', 'PayU', 'Mercado Pago',
    'Zapier', 'Make', 'Airtable', 'Drive',
  ];
  return (
    <section className="section section-dark" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bp-grid fine" style={{ opacity: .4 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="shead">
          <div className="eyebrow" data-reveal>tu stack</div>
          <h2 data-reveal data-reveal-delay="1">
            Vivimos donde tú vives.<br/>
            <span className="hl">No te pedimos cambiar de herramientas.</span>
          </h2>
        </div>
        <div className="tools-grid">
          {tools.map((t, i) => (
            <div key={t} className="tool-chip" data-reveal data-reveal-delay={(i % 4) + 1}>
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

// ── FAQ ─────────────────────────────────────────────────────────────────
function Faq() {
  const qs = [
    { q: '¿Tengo que cambiar las herramientas que ya uso?', a: 'No. La idea es justo lo contrario: usamos las que ya tienes y las conectamos entre sí. Si mañana cambias una, ajustamos el flow sin romper nada.' },
    { q: '¿Qué pasa si algo falla en medio de un flow?', a: 'Cada flow tiene puntos de control. Si una pieza falla (un correo no se envió, un dato no entró), te avisa de inmediato con qué pasó y qué le falta para retomar.' },
    { q: '¿Esto reemplaza a mi equipo?', a: 'No. Lo libera. Tu equipo deja de hacer trabajo repetitivo y se dedica a lo que sí necesita criterio humano: cerrar ventas, atender casos complejos, pensar.' },
    { q: '¿Cuánto se demora en estar listo?', a: 'Una semana hábil por flow. Si son varios, te ponemos primero los que más tiempo te quitan y los demás van entrando en orden.' },
    { q: '¿Puedo modificar los flows después?', a: 'Sí. Cada flow está documentado y editable. Tu equipo puede ajustar mensajes, condiciones y pasos sin pedirnos permiso.' },
    { q: '¿Y si quiero algo muy específico de mi industria?', a: 'Casi todo lo hemos hecho. Y si no, lo construimos. Cada operación tiene su versión, y ese es justo el punto: el flow se adapta a ti, no al revés.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>preguntas que nos hacen</div>
          <h2 data-reveal data-reveal-delay="1">
            Lo que la gente quiere saber<br/>
            <span className="hl">antes de automatizar.</span>
          </h2>
        </div>
        <div className="faq-list">
          {qs.map((it, i) => (
            <div key={i} className={`faq-item ${open === i ? 'is-open' : ''}`} data-reveal data-reveal-delay={(i % 3) + 1}>
              <button
                type="button"
                className="faq-q"
                onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i}
              >
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

// ── Final CTA ───────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="section section-dark final-cta">
      <div className="bp-grid" style={{ opacity: .35 }}></div>
      <div className="glow"></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="eyebrow" data-reveal>activa el flow</div>
        <h2 data-reveal data-reveal-delay="1">
          La hora que pierdes hoy en tareas repetidas,<br/>
          <span className="hl">mañana ya no existe.</span>
        </h2>
        <div className="final-cta-actions" data-reveal data-reveal-delay="2">
          <a href={$('contacto.html')} className="btn btn-primary">Automatizar mi operación <span className="arrow">→</span></a>
          <a href={$('contacto.html')} className="btn btn-ghost">Hablar con el equipo</a>
        </div>
      </div>
    </section>
  );
}

// ── App ─────────────────────────────────────────────────────────────────
function AutoApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="servicios" />
      <AutoHero />
      <BeforeAfter />
      <HowItWorks />
      <FlowSection />
      <CommonAutomations />
      <Tools />
      <Faq />
      <FinalCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AutoApp />);
