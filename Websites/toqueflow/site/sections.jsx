// sections.jsx — all sections except hero

function StatsMega() {
  const stats = [
    { prefix: 'hasta', num: '160%', lbl: 'más ventas en 6 meses' },
    { num: '24/7', lbl: 'atendiendo, incluso en la madrugada' },
    { num: '+26', lbl: 'negocios funcionando con flow' },
    { num: '1 sem', lbl: 'y queda listo — sin esperas' },
  ];
  return (
    <section className="container">
      <div className="stats-mega">
        {stats.map((s, i) => (
          <div key={i} className="stat-mega" data-reveal data-reveal-delay={(i % 4) + 1}>
            {s.prefix && <div className="stat-prefix">{s.prefix}</div>}
            <div className="num">{s.num}</div>
            <div className="lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatsAppMock() {
  const convos = [
    { name: 'María L. — prospecto', time: '02:41', unread: 3, msg: '¿Aún tienen disponibilidad para esta semana?', cold: '2h sin respuesta' },
    { name: 'Andrés P.', time: '01:18', unread: 2, msg: 'Hola, me pasas la cotización por favor', cold: '5h sin respuesta' },
    { name: 'Carolina R.', time: 'ayer', unread: 5, msg: 'Vi el formulario que llené, querría hablar...', cold: '14h sin respuesta' },
    { name: 'Tomás G. — interesado', time: 'ayer', unread: 1, msg: 'Buenas noches, ¿siguen activos?', cold: '18h sin respuesta' },
    { name: 'Laura M.', time: 'lun', unread: 4, msg: 'Ok, espero el precio entonces', cold: '3 días sin respuesta' },
    { name: 'Cristian V.', time: 'lun', unread: 2, msg: 'Acá los datos que me pediste...', cold: '3 días sin respuesta' },
  ];
  return (
    <div className="wa-mock">
      <div className="wa-header">
        <div className="wa-header-l">
          <div className="wa-logo-dot"></div>
          <div>
            <div className="wa-title">WhatsApp Business</div>
            <div className="wa-sub">tu equipo · en línea</div>
          </div>
        </div>
        <div className="wa-badge">17 sin leer</div>
      </div>
      <div className="wa-list">
        {convos.map((c, i) => (
          <div key={i} className="wa-row" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="wa-avatar">{c.name[0]}</div>
            <div className="wa-body">
              <div className="wa-row-top">
                <span className="wa-name">{c.name}</span>
                <span className="wa-time">{c.time}</span>
              </div>
              <div className="wa-row-bot">
                <span className="wa-msg">{c.msg}</span>
                {c.unread && <span className="wa-unread">{c.unread}</span>}
              </div>
              <div className="wa-cold">● {c.cold}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="wa-overlay-bottom"></div>
      <div className="wa-leak">fuga detectada — y nadie responde</div>
    </div>
  );
}

function Problem() {
  const symptoms = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      ),
      title: 'Leads enfriándose',
      desc: '17 mensajes sin respuesta antes del almuerzo.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      ),
      title: 'Promesas en Excel',
      desc: 'Cotizaciones, fechas y notas viviendo en hojas perdidas.',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 6h16v12H4z" /><path d="m4 6 8 7 8-7" />
        </svg>
      ),
      title: 'Datos a mano',
      desc: 'El mismo pedido escrito en cuatro sistemas distintos.',
    },
  ];
  return (
    <section className="section section-light problem">
      <div className="container">
        <div className="problem-grid">
          <div className="problem-aside">
            <div className="eyebrow" data-reveal>el problema</div>
            <h2 data-reveal data-reveal-delay="1">
              Tu equipo gasta el <mark>60% de su tiempo</mark> en tareas repetitivas en lugar de hacer crecer el negocio.
            </h2>
            <p style={{ marginTop: 28 }} data-reveal data-reveal-delay="2">Te escriben por WhatsApp y <span className="hl">nadie responde a tiempo</span>. Llega un pedido y alguien lo copia al CRM, a la factura, al Excel de inventario. La misma información, escrita una y otra vez a mano.</p>
            <p data-reveal data-reveal-delay="2">Mientras tanto, lo importante —cotizar, facturar, hacer seguimiento, administrar— vive en libretas, en hojas sueltas, en <span className="hl">buenas intenciones que se olvidan</span>.</p>
            <p className="punchline" data-reveal data-reveal-delay="3">No te falta gente. Te falta un sistema que trabaje por ti.</p>

            <div className="symptoms">
              {symptoms.map((s, i) => (
                <div key={i} className="symptom" data-reveal data-reveal-delay={i + 1}>
                  <div className="symptom-icon">{s.icon}</div>
                  <div>
                    <div className="symptom-title">{s.title}</div>
                    <div className="symptom-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="problem-right" data-reveal="right" data-reveal-delay="1">
            <WhatsAppMock />
          </div>
        </div>
      </div>
    </section>
  );
}

const SvcIcon = {
  agente: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
      <circle cx="9" cy="11" r=".8" fill="currentColor" />
      <circle cx="12" cy="11" r=".8" fill="currentColor" />
      <circle cx="15" cy="11" r=".8" fill="currentColor" />
    </svg>
  ),
  procesos: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
    </svg>
  ),
  integra: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  ),
  tableros: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 6-6" />
    </svg>
  ),
};

function Services() {
  const items = [
    {
      n: '01', icon: 'agente', href: 'servicios/agentes-virtuales.html',
      title: 'Agentes de IA',
      desc: 'Atienden a tus clientes en WhatsApp, Instagram o tu web —y también a tu equipo por dentro: consultan tu sistema, administran inventario o responden por Telegram. Con el tono de tu marca.',
    },
    {
      n: '02', icon: 'procesos', href: 'servicios/automatizacion.html',
      title: 'Automatización de procesos',
      desc: 'Facturar, cotizar, registrar, agendar, controlar inventario. Eso que tu equipo repite cada semana lo dejamos corriendo solo, conectado a las herramientas que ya usas.',
    },
    {
      n: '03', icon: 'integra', href: 'servicios/integraciones.html',
      title: 'Integraciones & sistemas',
      desc: 'Conectamos lo que ya tienes —ERP, CRM, contabilidad, pagos, Calendar— para que hablen entre sí. Un solo dato, una sola fuente de verdad, sin migrar nada.',
    },
    {
      n: '04', icon: 'tableros', href: 'servicios/seguimiento-leads.html',
      title: 'Tableros & seguimiento',
      desc: 'Métricas en vivo de todo lo que está corriendo, y seguimiento que no deja enfriar a nadie. Ves dónde acelerar y decides con datos, no con intuiciones.',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>nuestros servicios</div>
          <h2 data-reveal data-reveal-delay="1">Cuatro formas de poner tu negocio<br/><span className="hl">a trabajar solo.</span></h2>
          <p data-reveal data-reveal-delay="2">No solo chats. Agentes, automatizaciones, integraciones y datos: cada uno resuelve un dolor concreto, y juntos hacen que tu operación corra sin empujarla.</p>
        </div>
        <div className="svc-grid">
          {items.map((it, i) => (
            <article key={it.n} className="svc" data-reveal data-reveal-delay={i + 1}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                  <div className="svc-icon">{SvcIcon[it.icon]}</div>
                  <span className="svc-num">{it.n} / 04</span>
                </div>
                <h3>{it.title}</h3>
                <p style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.6 }}>{it.desc}</p>
              </div>
              <a href={it.href} className="svc-link">ver_cómo_funciona<span className="arrow">→</span></a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const reasons = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      ),
      h: 'Listo en una semana',
      p: 'Lunes nos cuentas. Viernes ya trabaja para ti.',
      hl: 'Viernes ya trabaja para ti',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      ),
      h: 'Sin caja negra',
      p: 'Todo queda documentado y a la vista. Tu equipo entiende cómo funciona y puede ajustarlo sin esperar a nadie.',
      hl: 'sin esperar a nadie',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
        </svg>
      ),
      h: 'Habla como un humano',
      p: 'Tu tono, las preguntas reales de tus clientes. Nadie sospecha.',
      hl: 'Nadie sospecha',
    },
  ];
  return (
    <section className="section section-dark" style={{ position: 'relative', overflow: 'hidden' }}>
      <img className="photo-bg" src="assets/img/tech-network.jpg" alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .55 }}></div>
      <div className="glow" style={{ left: '-220px', bottom: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="shead">
          <div className="eyebrow" data-reveal>por qué toqueflow</div>
          <h2 data-reveal data-reveal-delay="1">El toque maestro en tus sistemas.<br/><span className="hl">Puro flow en tus operaciones.</span></h2>
        </div>
        <div className="why-reasons">
          {reasons.map((r, i) => {
            const parts = r.p.split(r.hl);
            return (
              <div key={i} className="why-reason" data-reveal data-reveal-delay={i + 1}>
                <div className="why-reason-icon">{r.icon}</div>
                <h4>{r.h}</h4>
                <p>{parts[0]}<span className="hl" style={{fontWeight:'inherit'}}>{r.hl}</span>{parts[1]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      q: 'Las facturas de contado y crédito se generan solas. Mi contadora dejó de pasar la noche del 30 digitando. Hoy eso simplemente ya está hecho.',
      name: 'Jorge Patiño', role: 'Administrador · FerreteríaYa', initials: 'JP',
    },
    {
      q: 'Tengo dos sedes y antes vivía llamando para saber el inventario. Ahora administro todo desde un chat de Telegram y el stock se repone solo.',
      name: 'Marcela Ruiz', role: 'Dueña · FerreteríaYa', initials: 'MR',
    },
    {
      q: 'No es un chat frío y robotizado. El agente de WhatsApp responde precios y disponibilidad como lo haría mi mejor vendedor, hasta de madrugada.',
      name: 'Diego Marín', role: 'Jefe de mostrador · FerreteríaYa', initials: 'DM',
    },
  ];
  return (
    <section className="section section-light">
      <div className="container">
        <div className="shead">
          <div className="eyebrow" data-reveal>lo que dicen</div>
          <h2 data-reveal data-reveal-delay="1">Equipos que pasaron del caos <span className="hl">al flow.</span></h2>
        </div>
        <div className="t-grid">
          {items.map((t, i) => (
            <div key={i} className="t-card" data-reveal data-reveal-delay={i + 1}>
              <div className="t-quote">"{t.q}"</div>
              <div className="t-who">
                <div className="t-avatar">{t.initials}</div>
                <div>
                  <b>{t.name}</b>
                  <span>{t.role}</span>
                </div>
              </div>
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
      <img className="photo-bg" src="assets/img/wavy-pattern.jpg" alt="" aria-hidden="true" />
      <div className="bp-grid" style={{ opacity: .35 }}></div>
      <div className="glow"></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="eyebrow" data-reveal>última parada</div>
        <h2 data-reveal data-reveal-delay="1">
          Tus clientes ya están ahí.<br/>
          Solo falta que alguien <em style={{ fontStyle: 'normal', background: 'var(--orange-grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>los atienda bien.</em>
        </h2>
        <p className="lead" data-reveal data-reveal-delay="2" style={{ marginTop: 28 }}>
          Reserva 30 minutos gratis. Te mostramos dónde está la fuga de ventas y te entregamos un plan claro para arrancar.
        </p>
        <div className="final-cta-actions" data-reveal data-reveal-delay="3">
          <a href="#contacto" className="btn btn-primary">Activar mi Flow <span className="arrow">→</span></a>
          <a href="#demo" className="btn btn-ghost">Quiero la demo gratis</a>
        </div>
      </div>
    </section>
  );
}

function SectionDivider({ n }) {
  return (
    <div className="sec-divider" aria-hidden="true">
      <div className="sec-divider-inner">
        <span className="sec-divider-line"></span>
        <span className="sec-divider-mark">
          {n && <span className="sec-divider-num">{n}</span>}
          <img className="sec-divider-logo" src="assets/favicon.png" alt="" />
        </span>
        <span className="sec-divider-line"></span>
      </div>
    </div>
  );
}

Object.assign(window, { StatsMega, Problem, Services, WhyUs, Testimonials, FinalCTA, SectionDivider });
