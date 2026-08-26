// asistente-virtual.jsx — Servicio: Asistente virtual

// ── Rotating word in hero ────────────────────────────────────────────────
function RotatingWord() {
  const words = ['vende', 'escribe', 'agenda', 'cotiza', 'administra', 'atiende'];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % words.length), 1800);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="rotating-word">
      {words.map((w, k) => (
        <span key={k} className={`rw-item ${k === i ? 'is-active' : ''}`}>{w}</span>
      ))}
    </span>
  );
}

// ── Animated chat demo ───────────────────────────────────────────────────
function ChatDemo() {
  const script = React.useMemo(() => [
    { from: 'in', text: 'Hola, estoy viendo el catálogo. ¿Tienen el modelo en negro?' },
    { from: 'out', text: '¡Hola! Sí, lo tenemos disponible. Te lo entregamos esta semana en Bogotá. ¿Para qué día lo necesitas?' },
    { from: 'in', text: 'Lo necesito para el jueves. ¿Cuánto sale?' },
    { from: 'out', text: '$1.290.000 con envío incluido. Si confirmas hoy te aseguro el cupo del jueves. ¿Te paso el link de pago?' },
    { from: 'in', text: 'Sí, mándamelo. Gracias.' },
    { from: 'out', text: 'Listo, lo recibes en un momento. También te agendé una llamada de seguimiento el viernes a las 10am, por si tienes dudas. ¿Te queda bien?' },
  ], []);

  const [visible, setVisible] = React.useState(0);
  const [typing, setTyping] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    let cancelled = false;
    let timeoutId;
    const advance = (next) => {
      if (cancelled) return;
      if (next > script.length) {
        // restart loop after a pause
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setVisible(0);
          setTyping(false);
          timeoutId = setTimeout(() => advance(1), 600);
        }, 4000);
        return;
      }
      const showTyping = script[next - 1]?.from === 'out';
      if (showTyping) {
        setTyping(true);
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setTyping(false);
          setVisible(next);
          timeoutId = setTimeout(() => advance(next + 1), 1500);
        }, 1200);
      } else {
        setVisible(next);
        timeoutId = setTimeout(() => advance(next + 1), 1400);
      }
    };
    timeoutId = setTimeout(() => advance(1), 800);
    return () => { cancelled = true; clearTimeout(timeoutId); };
  }, [script]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible, typing]);

  return (
    <div className="chat-demo">
      <div className="chat-demo-h">
        <div className="cd-logo">
          <span className="cd-dot"></span>
        </div>
        <div className="cd-meta">
          <b>Tu marca</b>
          <span>// asistente · respondiendo en tiempo real</span>
        </div>
        <div className="cd-platform">WhatsApp</div>
      </div>
      <div className="chat-demo-body" ref={containerRef}>
        {script.slice(0, visible).map((m, k) => (
          <div key={k} className={`cd-bubble cd-${m.from}`}>{m.text}</div>
        ))}
        {typing && (
          <div className="cd-bubble cd-out cd-typing">
            <span></span><span></span><span></span>
          </div>
        )}
      </div>
      <div className="chat-demo-foot">
        <span className="cd-foot-tag">// promedio de respuesta · 4 segundos</span>
        <span className="cd-foot-pulse">● en vivo</span>
      </div>
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────
function AsistenteHero() {
  return (
    <section className="hero hero-inner section-dark">
      <img className="photo-bg" src={$('https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev/img/cyborg-statue.jpg')} alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ right: '-180px', top: '-180px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>servicio 01 · agentes de ia</div>
        <h1 data-reveal data-reveal-delay="1">
          Un agente que <RotatingWord /><br/>
          <em>como lo harías tú.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '62ch', marginTop: 28 }}>
          Atienden a tus clientes en WhatsApp, Instagram y tu web —<span className="hl">y también a tu equipo</span>: consultan tu sistema, administran inventario o responden por Telegram. Con el tono de tu marca, sin guiones fríos.
        </p>
        <div className="hero-actions" data-reveal data-reveal-delay="3">
          <a href={$('contacto.html')} className="btn btn-primary">Activar mi agente <span className="arrow">→</span></a>
          <a href="#demo" className="btn btn-ghost">Ver demo en vivo</a>
        </div>
      </div>
    </section>
  );
}

// ── Cómo funciona — 3 steps ─────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01', tag: 'aprende',
      h: 'Lo entrenamos con tu negocio.',
      p: 'Le pasamos tus precios, tu tono, tus respuestas frecuentes, tus condiciones. Habla como tu mejor vendedor.',
      hl: 'tu mejor vendedor',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="M3 14l9 5 9-5" />
        </svg>
      ),
    },
    {
      n: '02', tag: 'conversa',
      h: 'Atiende a quien escriba, cuando escriba.',
      p: 'A las 3 am o un domingo da igual. Responde en menos de 5 segundos, mantiene la conversación y va calificando.',
      hl: 'menos de 5 segundos',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
        </svg>
      ),
    },
    {
      n: '03', tag: 'avisa',
      h: 'Te pasa el cliente cuando vale la pena.',
      p: 'Apenas alguien está listo para comprar, te avisa a ti o a tu equipo con todo el contexto resuelto. Llegas a cerrar, no a empezar.',
      hl: 'llegas a cerrar',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 18a4 4 0 0 1 8 0" /><circle cx="7" cy="11" r="3" />
          <path d="M14 8l3 3 5-5" />
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
            Tres pasos para que tu asistente<br/>
            <span className="hl">atienda como tú.</span>
          </h2>
        </div>
        <div className="process-grid">
          <div className="process-line" style={{ background: 'linear-gradient(to right, transparent 0%, color-mix(in oklab, var(--orange-2) 45%, transparent) 20%, color-mix(in oklab, var(--orange-2) 45%, transparent) 80%, transparent 100%)' }}></div>
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

// ── Live demo section ───────────────────────────────────────────────────
function DemoSection() {
  return (
    <section className="section section-dark" id="demo" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .45 }}></div>
      <div className="glow" style={{ left: '-220px', bottom: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="demo-grid">
          <div data-reveal>
            <div className="eyebrow">demo · conversación real</div>
            <h2 style={{ marginTop: 12 }}>
              Mira cómo se ve<br/>
              <span className="hl">una conversación real.</span>
            </h2>
            <p style={{ marginTop: 20, maxWidth: '44ch' }}>
              Esto es un ejemplo del flujo natural que vive tu cliente: pregunta, recibe respuesta inmediata, recibe la cotización y queda agendado. Sin esperar a nadie.
            </p>
            <ul className="demo-points">
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Respuesta inmediata</b> — antes de que se distraiga.</span>
              </li>
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Tono de tu marca</b> — sin "espero te encuentres bien".</span>
              </li>
              <li>
                <span className="demo-point-dot"></span>
                <span><b>Cierra el flow</b> — pago, agenda, próxima acción.</span>
              </li>
            </ul>
          </div>
          <div data-reveal="right" data-reveal-delay="1">
            <ChatDemo />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Features ────────────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      h: 'Habla como tu marca',
      p: 'Aprende tu tono, las palabras que sí usas y las que no. Nadie sospecha que del otro lado hay un sistema.',
      hl: 'tu tono',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ),
      h: '24/7, sin pausas',
      p: 'Madrugada, festivos, fines de semana. Quien escriba va a tener respuesta antes de que pierda el interés.',
      hl: 'antes de que pierda el interés',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18" /><path d="M8 4v6" />
        </svg>
      ),
      h: 'Agenda directo en tu calendario',
      p: 'Mira tus huecos reales en Google Calendar y propone horarios que tú sí tienes. Confirma con el cliente y registra la cita.',
      hl: 'tus huecos reales',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 8l8 6 8-6" /><rect x="4" y="6" width="16" height="12" rx="2" />
        </svg>
      ),
      h: 'WhatsApp, Instagram, web',
      p: 'Un mismo asistente atendiendo en todos los canales. Si el cliente saltó de IG a WhatsApp, recuerda dónde quedaron.',
      hl: 'recuerda dónde quedaron',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 12h4l3-9 4 18 3-9h4" />
        </svg>
      ),
      h: 'Te pasa solo lo que importa',
      p: 'Filtra preguntas frecuentes, descarta curiosos y solo te llega lo que merece tu tiempo: clientes listos para comprar.',
      hl: 'clientes listos para comprar',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 22s-7-7-7-13a7 7 0 0 1 14 0c0 6-7 13-7 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
      h: 'Sabe cuándo callarse',
      p: 'Si la pregunta es delicada o el cliente quiere hablar con alguien, te lo pasa con todo el contexto resuelto.',
      hl: 'te lo pasa',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>lo que sabe hacer</div>
          <h2 data-reveal data-reveal-delay="1">
            No es un chatbot.<br/>
            <span className="hl">Es alguien más en tu equipo.</span>
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
    { q: '¿Cuánto se demora en estar listo?', a: 'Una semana hábil. Lunes nos cuentas cómo vendes hoy, viernes ya está respondiendo a tus clientes.' },
    { q: '¿Y si mi cliente prefiere hablar con una persona?', a: 'El asistente detecta cuándo conviene pasarte la conversación. Tú llegas con todo el contexto resuelto, no a empezar de cero.' },
    { q: '¿Se nota que no es un humano?', a: 'No. Lo entrenamos con tu tono real, tus modismos y la manera en que de verdad hablan tus mejores vendedores. La mayoría de tus clientes no se va a dar cuenta.' },
    { q: '¿En qué herramientas funciona?', a: 'WhatsApp Business, Instagram DM, formularios de tu web, Messenger, correo. Si tu cliente está ahí, el asistente también.' },
    { q: '¿Qué pasa si pregunta algo que no sabe responder?', a: 'Te avisa de inmediato con el contexto. Mejor decir "déjame consultarlo y te confirmo en 10 minutos" que inventar una respuesta.' },
    { q: '¿Puedo ver cómo está respondiendo?', a: 'Sí. Cada conversación queda registrada. Puedes leerlas, corregir el tono, ajustar lo que quieras. Es tuyo y vive donde tú decidas.' },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>preguntas que nos hacen</div>
          <h2 data-reveal data-reveal-delay="1">
            Lo que la gente quiere saber<br/>
            <span className="hl">antes de empezar.</span>
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
          Tu próximo cliente está escribiendo.<br/>
          <span className="hl">Que alguien le responda.</span>
        </h2>
        <div className="final-cta-actions" data-reveal data-reveal-delay="2">
          <a href={$('contacto.html')} className="btn btn-primary">Activar mi asistente <span className="arrow">→</span></a>
          <a href={$('contacto.html')} className="btn btn-ghost">Hablar con el equipo</a>
        </div>
      </div>
    </section>
  );
}

// ── App ─────────────────────────────────────────────────────────────────
function AsistenteApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="servicios" />
      <AsistenteHero />
      <HowItWorks />
      <DemoSection />
      <Features />
      <Faq />
      <FinalCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AsistenteApp />);
