// seguimiento.jsx — Servicio: Seguimiento automático

// ── Hero ────────────────────────────────────────────────────────────────
function SeguimientoHero() {
  return (
    <section className="hero hero-inner section-dark">
      <img className="photo-bg" src={$('https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/img/twin-avatar.jpg')} alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ left: '-180px', top: '-180px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>servicio 04 · tableros & seguimiento</div>
        <h1 data-reveal data-reveal-delay="1">
          Ves todo lo que corre<br/>
          <em>y nada se enfría.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '62ch', marginTop: 28 }}>
          Un tablero en vivo de todo lo que está corriendo —agentes, automatizaciones, leads— <span className="hl">y seguimiento que no deja enfriar a nadie</span>. Ves dónde acelerar y decides con datos, no con intuiciones.
        </p>
        <div className="hero-actions" data-reveal data-reveal-delay="3">
          <a href={$('contacto.html')} className="btn btn-primary">Activar mis tableros <span className="arrow">→</span></a>
          <a href="#secuencia" className="btn btn-ghost">Ver una secuencia real</a>
        </div>
      </div>
    </section>
  );
}

// ── The cold lead problem ───────────────────────────────────────────────
function ColdLeadStat() {
  return (
    <section className="section section-light">
      <div className="container">
        <div className="cold-grid">
          <div data-reveal>
            <div className="eyebrow">la realidad</div>
            <h2 style={{ marginTop: 12 }}>
              48% de los leads<br/>
              <span className="hl">nunca reciben un segundo mensaje.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '46ch' }}>
              No porque no quieras venderles. Porque entre una cosa y otra, se olvidan. Y un lead sin tocar a las 72 horas <span className="hl">ya no es un lead</span>: es un cliente perdido.
            </p>
          </div>
          <div className="cold-card" data-reveal="right" data-reveal-delay="1">
            <div className="cold-card-h">
              <span className="cold-tag">// lo que pasa hoy</span>
              <span className="cold-count">+17 sin tocar</span>
            </div>
            <ul className="cold-list">
              <li><span className="cold-name">María L.</span><span className="cold-time">hace 2h</span></li>
              <li><span className="cold-name">Andrés P.</span><span className="cold-time">hace 5h</span></li>
              <li><span className="cold-name">Carolina R.</span><span className="cold-time">hace 14h</span></li>
              <li><span className="cold-name">Tomás G.</span><span className="cold-time">hace 18h</span></li>
              <li className="is-cold"><span className="cold-name">Laura M.</span><span className="cold-time">hace 3 días</span></li>
              <li className="is-cold"><span className="cold-name">Cristian V.</span><span className="cold-time">hace 3 días</span></li>
              <li className="is-cold"><span className="cold-name">Felipe O.</span><span className="cold-time">hace 5 días</span></li>
            </ul>
            <div className="cold-foot">
              <span>● <b>3 ya están fríos</b> y nadie los ha tocado</span>
            </div>
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
      n: '01', tag: 'detecta',
      h: 'Sabemos cuándo enfriar y cuándo apretar.',
      p: 'Cada lead recibe un puntaje según lo que contestó y cuándo. Los calientes pasan a ti. Los tibios entran a una secuencia paciente.',
      hl: 'cuándo apretar',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 12h4l3-9 4 18 3-9h4" />
        </svg>
      ),
    },
    {
      n: '02', tag: 'escribe',
      h: 'Manda el mensaje correcto en el canal correcto.',
      p: 'WhatsApp si te escribió por ahí. Correo si llenó un formulario. Cada mensaje va con su nombre, su producto y la pregunta que dejó pendiente.',
      hl: 'su nombre, su producto',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 6h16v12H4z" /><path d="m4 6 8 7 8-7" />
        </svg>
      ),
    },
    {
      n: '03', tag: 'cierra',
      h: 'Te pasa el cliente cuando responde.',
      p: 'Apenas reacciona, llega a tu chat con el resumen entero: qué preguntó, qué le respondió la secuencia, qué falta.',
      hl: 'con el resumen entero',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M14 8l3 3 5-5" />
          <path d="M3 18a4 4 0 0 1 8 0" /><circle cx="7" cy="11" r="3" />
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
            Tres pasos para que ningún cliente<br/>
            <span className="hl">se quede sin respuesta.</span>
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

// ── Animated sequence timeline ──────────────────────────────────────────
function SequenceTimeline() {
  const events = [
    { t: '00:00', day: 'día 0', ch: 'whatsapp', label: 'Llega el lead', msg: 'Ana llena el formulario de tu web.', kind: 'event' },
    { t: '+5 min', day: 'día 0', ch: 'whatsapp', label: 'Confirmación', msg: 'Hola Ana, gracias por escribir. ¿Para cuándo lo necesitas?', kind: 'out' },
    { t: '+2 h', day: 'día 0', ch: 'correo', label: 'Cotización', msg: 'Te paso la propuesta completa con tres opciones. Cualquier duda, me dices.', kind: 'out' },
    { t: '+24 h', day: 'día 1', ch: 'whatsapp', label: 'Recordatorio suave', msg: '¿Pudiste revisar la propuesta, Ana? Estoy por aquí para resolver dudas.', kind: 'out' },
    { t: '+3 días', day: 'día 3', ch: 'whatsapp', label: 'Cierre amable', msg: 'Ana, antes de marcar tu propuesta como cerrada, ¿algún cambio que te ayude a decidir?', kind: 'out' },
    { t: '+5 días', day: 'día 5', ch: '—', label: 'Cliente responde', msg: 'Ana escribe pidiendo cambiar una opción. La secuencia se detiene. La conversación llega a ti.', kind: 'event' },
  ];

  return (
    <section className="section section-dark" id="secuencia" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .45 }}></div>
      <div className="glow" style={{ right: '-220px', top: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="shead">
          <div className="eyebrow" data-reveal>una secuencia real</div>
          <h2 data-reveal data-reveal-delay="1">
            Así se ve la diferencia<br/>
            <span className="hl">entre perseguir y dar seguimiento.</span>
          </h2>
          <p data-reveal data-reveal-delay="2" style={{ marginTop: 20, maxWidth: '56ch' }}>
            Un caso real: Ana entra como lead un martes. La secuencia se encarga durante 5 días. Cuando Ana reacciona, su conversación llega a ti, lista para cerrar.
          </p>
        </div>
        <div className="seq-timeline">
          <div className="seq-line"></div>
          {events.map((e, i) => (
            <article key={i} className={`seq-step seq-${e.kind}`} data-reveal data-reveal-delay={(i % 3) + 1}>
              <div className="seq-time">
                <span className="seq-time-day">{e.day}</span>
                <span className="seq-time-rel">{e.t}</span>
              </div>
              <div className="seq-dot">
                {e.kind === 'event' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="seq-dot-inner"></span>
                )}
              </div>
              <div className="seq-card">
                <div className="seq-card-h">
                  <span className="seq-label">{e.label}</span>
                  <span className="seq-channel">// {e.ch}</span>
                </div>
                <p>{e.msg}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Features grid ───────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      ),
      h: 'Manda en el momento correcto',
      p: 'Aprende cuándo abre tu cliente sus mensajes y manda en ese rango. Nada en plena madrugada.',
      hl: 'cuándo abre tu cliente',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
        </svg>
      ),
      h: 'Multi-canal de verdad',
      p: 'WhatsApp, correo, SMS, Instagram. Si el cliente se mueve de canal, la secuencia lo sigue sin perder el hilo.',
      hl: 'sin perder el hilo',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
      h: 'Mensajes que suenan tuyos',
      p: 'No son plantillas frías. Cada secuencia se entrena con tu tono, tus modismos y las preguntas reales que ya respondes.',
      hl: 'preguntas reales que ya respondes',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
      h: 'Agenda directo en tu calendario',
      p: 'Si el lead pide reunión, propone los huecos reales que tienes en Google Calendar y confirma sin que tú intervengas.',
      hl: 'sin que tú intervengas',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 4l16 0" /><path d="M4 12l10 0" /><path d="M4 20l6 0" />
        </svg>
      ),
      h: 'Sabe cuándo soltar',
      p: 'Si el lead no responde tras varios intentos, lo marca como frío y para. No molestamos clientes que ya dijeron que no.',
      hl: 'no molestamos',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 6-6" />
        </svg>
      ),
      h: 'Métricas en vivo',
      p: 'Ves cuántos leads están activos, en qué paso, cuántos respondieron y cuáles llegaron a venta. Sin Excel, sin estimar.',
      hl: 'cuáles llegaron a venta',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>lo que sabe hacer</div>
          <h2 data-reveal data-reveal-delay="1">
            No es un &quot;mensaje masivo&quot;.<br/>
            <span className="hl">Es seguimiento que se siente personal.</span>
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

// ── FAQ ─────────────────────────────────────────────────────────────────
function Faq() {
  const qs = [
    { q: '¿Cuántos mensajes manda? ¿No va a saturar a mis clientes?', a: 'Mandamos lo justo. La cantidad y el ritmo se calibran con tu producto, tu industria y cómo respondieron leads anteriores. Si alguien no contesta tras los intentos, paramos.' },
    { q: '¿Qué pasa si un cliente responde a la secuencia?', a: 'La secuencia se detiene de inmediato y la conversación pasa a ti o a tu equipo, con todo el contexto resuelto: qué preguntó, qué se le respondió, qué quedó pendiente.' },
    { q: '¿Puedo cambiar los mensajes después?', a: 'Sí. Tienes acceso a las plantillas, al tono y al ritmo. Si una semana ves que un mensaje no está funcionando, lo cambiamos.' },
    { q: '¿En qué canales funciona?', a: 'WhatsApp Business, correo, Instagram DM, SMS. Si el cliente saltó de canal, mantenemos el hilo.' },
    { q: '¿Esto es spam?', a: 'No. Es seguimiento a personas que ya levantaron la mano (escribieron, llenaron un formulario, pidieron algo). Mandamos contenido útil y paramos cuando no responden.' },
    { q: '¿Se nota que es automático?', a: 'No, si la secuencia está bien hecha. Los mensajes salen con tu tono, con datos del lead, en horarios humanos. La mayoría de tus clientes piensa que eres tú escribiendo.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>preguntas que nos hacen</div>
          <h2 data-reveal data-reveal-delay="1">
            Lo que la gente quiere saber<br/>
            <span className="hl">antes de soltar el seguimiento.</span>
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
          Hoy se te enfriaron 5 leads.<br/>
          <span className="hl">Que el flow se encargue del resto.</span>
        </h2>
        <div className="final-cta-actions" data-reveal data-reveal-delay="2">
          <a href={$('contacto.html')} className="btn btn-primary">Activar seguimiento <span className="arrow">→</span></a>
          <a href={$('contacto.html')} className="btn btn-ghost">Hablar con el equipo</a>
        </div>
      </div>
    </section>
  );
}

// ── App ─────────────────────────────────────────────────────────────────
function SeguimientoApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="servicios" />
      <SeguimientoHero />
      <ColdLeadStat />
      <HowItWorks />
      <SequenceTimeline />
      <Features />
      <Faq />
      <FinalCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SeguimientoApp />);
