// contacto.jsx — Contacto page (form + calendar + alt contact)

function ContactoHero() {
  return (
    <section className="hero hero-inner section-dark">
      <div className="bp-grid" style={{ opacity: .5 }}></div>
      <div className="glow" style={{ right: '-200px', top: '-160px', opacity: .35 }}></div>
      <div className="container hero-inner-content">
        <div className="eyebrow" data-reveal>contacto</div>
        <h1 data-reveal data-reveal-delay="1">
          Cuéntanos qué te quita tiempo.<br/>
          <em>Nosotros vemos cómo quitártelo.</em>
        </h1>
        <p className="hero-sub" data-reveal data-reveal-delay="2" style={{ maxWidth: '52ch', marginTop: 28 }}>
          Te responde una persona de verdad. <span className="hl">De ahí en adelante, todo lo demás se vuelve flow.</span>
        </p>
      </div>
    </section>
  );
}

function ContactForm() {
  const [data, setData] = React.useState({
    nombre: '', correo: '', empresa: '', team: '', dolor: '',
  });
  const [sent, setSent] = React.useState(false);
  const teams = ['1 a 5', '6 a 20', '21 a 50', '+50'];
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 6000);
  };
  return (
    <form className={`contact-form ${sent ? 'is-sent' : ''}`} onSubmit={submit}>
      <div className="form-row">
        <div className="form-field">
          <label>Tu nombre</label>
          <input type="text" value={data.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ana Restrepo" />
        </div>
        <div className="form-field">
          <label>Tu correo</label>
          <input type="email" value={data.correo} onChange={(e) => set('correo', e.target.value)} placeholder="ana@empresa.com" />
        </div>
      </div>

      <div className="form-field">
        <label>Empresa</label>
        <input type="text" value={data.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Nombre de tu empresa" />
      </div>

      <div className="form-field">
        <label>¿Cuántas personas son?</label>
        <div className="team-pills">
          {teams.map((t) => (
            <button
              key={t}
              type="button"
              className={`team-pill ${data.team === t ? 'is-active' : ''}`}
              onClick={() => set('team', t)}
            >
              <span className="team-pill-dot"></span>
              {t} personas
            </button>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label>¿Qué te gustaría dejar de hacer a mano?</label>
        <textarea
          rows="4"
          value={data.dolor}
          onChange={(e) => set('dolor', e.target.value)}
          placeholder="Ej. Responder cotizaciones por WhatsApp, copiar leads del formulario al CRM, hacer seguimiento manual..."
        />
      </div>

      <div className="form-foot">
        <button type="submit" className="btn btn-primary">
          {sent
            ? <><span>✓ Recibido</span></>
            : <>Quiero la demo gratis <span className="arrow">→</span></>}
        </button>
        <div className="form-hint">
          {sent
            ? <span className="form-success">✓ recibido · te escribimos en menos de 24 horas</span>
            : <span>// gratis · 30 min · sin compromiso · sin venta agresiva</span>}
        </div>
      </div>
    </form>
  );
}

function Calendar() {
  const [selectedDay, setSelectedDay] = React.useState(8);
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  // May 2026 starts on Friday. Build grid manually.
  const days = [];
  // Prev month tail (Apr 28-30): 28, 29, 30
  for (let d = 28; d <= 30; d++) days.push({ d, prev: true });
  // May 1-31
  for (let d = 1; d <= 31; d++) days.push({ d });
  // Next month head: 1
  days.push({ d: 1, next: true });

  const availableDays = [8, 9, 12, 14, 15, 19, 21, 22, 27, 28];
  const slots = ['09:00', '10:30', '13:00', '14:30', '16:00'];

  return (
    <div className="cal">
      <div className="cal-head">
        <span className="cal-tag">// mayo 2026</span>
        <div className="cal-nav">
          <button type="button" aria-label="Mes anterior">‹</button>
          <button type="button" aria-label="Mes siguiente">›</button>
        </div>
      </div>
      <div className="cal-week">
        {['L','M','M','J','V','S','D'].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {days.map((c, i) => {
          const avail = !c.prev && !c.next && availableDays.includes(c.d);
          const isSel = !c.prev && !c.next && c.d === selectedDay;
          return (
            <button
              key={i}
              type="button"
              className={`cal-day ${c.prev || c.next ? 'is-muted' : ''} ${avail ? 'is-avail' : ''} ${isSel ? 'is-sel' : ''}`}
              disabled={c.prev || c.next || !avail}
              onClick={() => avail && setSelectedDay(c.d)}
            >
              {c.d}
            </button>
          );
        })}
      </div>

      <div className="cal-slots">
        <div className="cal-slots-head">// jueves {selectedDay} de mayo · cdmx · disponibles</div>
        <div className="cal-slot-row">
          {slots.map((s) => (
            <button
              key={s}
              type="button"
              className={`cal-slot ${selectedSlot === s ? 'is-active' : ''}`}
              onClick={() => setSelectedSlot(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FormAndCalendar() {
  return (
    <section className="section section-light">
      <div className="container">
        <div className="form-grid">
          <div data-reveal>
            <div className="eyebrow">cuéntanos</div>
            <h2 style={{ marginTop: 12 }}>
              Llena esto y <span className="hl">arrancamos.</span>
            </h2>
            <p style={{ marginTop: 16, maxWidth: '40ch' }}>
              Mientras más nos cuentes, más concreto será el primer plan que te entreguemos.
            </p>
            <div style={{ marginTop: 28 }}>
              <ContactForm />
            </div>
          </div>
          <div data-reveal="right" data-reveal-delay="1">
            <div className="eyebrow">o agenda directo</div>
            <h2 style={{ marginTop: 12 }}>
              Escoge un día y una <span className="hl">hora.</span>
            </h2>
            <p style={{ marginTop: 16, maxWidth: '40ch' }}>
              30 minutos. Te llamamos nosotros. Tú solo abres el calendario.
            </p>
            <div style={{ marginTop: 28 }}>
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AltContacts() {
  return (
    <section className="section section-dark">
      <div className="bp-grid" style={{ opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative' }}>
        <div className="shead">
          <div className="eyebrow" data-reveal>otras formas</div>
          <h2 data-reveal data-reveal-delay="1">
            ¿Prefieres algo más <span className="hl">directo?</span>
          </h2>
        </div>
        <div className="alt-grid">
          <a href="mailto:hola@toqueflow.com" className="alt-card" data-reveal data-reveal-delay="1">
            <div className="alt-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 6h16v12H4z" /><path d="m4 6 8 7 8-7" />
              </svg>
            </div>
            <div className="alt-tag">// correo</div>
            <h3>hola@toqueflow.com</h3>
            <p>Respondemos en <span className="hl" style={{fontWeight:'inherit'}}>menos de 4 horas hábiles</span>. Te contesta una persona, no un bot.</p>
            <div className="alt-cta">Escribir correo <span className="arrow">→</span></div>
          </a>
          <a href="https://wa.me/573205550142?text=demo" className="alt-card" data-reveal data-reveal-delay="2">
            <div className="alt-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
                <circle cx="9" cy="11" r=".8" fill="currentColor" />
                <circle cx="12" cy="11" r=".8" fill="currentColor" />
                <circle cx="15" cy="11" r=".8" fill="currentColor" />
              </svg>
            </div>
            <div className="alt-tag">// whatsapp directo</div>
            <h3>+57 320 555 0142</h3>
            <p>Escríbenos <span className="hl" style={{fontWeight:'inherit'}}>"demo"</span> y arranca la conversación al instante.</p>
            <div className="alt-cta">Abrir WhatsApp <span className="arrow">→</span></div>
          </a>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="section section-dark final-cta" style={{ paddingTop: 100, paddingBottom: 100, overflow: 'hidden' }}>
      <div className="bp-grid" style={{ opacity: .4 }}></div>
      <div className="glow" style={{ right: '-200px', bottom: '-200px', opacity: .35 }}></div>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="eyebrow" data-reveal>último argumento</div>
        <h2 data-reveal data-reveal-delay="1" style={{ maxWidth: '20ch' }}>
          Empezar <span className="hl">no te cuesta nada.</span>
        </h2>
        <p data-reveal data-reveal-delay="2" style={{ marginTop: 20, maxWidth: '56ch' }}>
          Solo 30 minutos contigo para entender cómo trabajas hoy. Si encajamos, seguimos. <span className="hl">Si no, te dejamos un plan que puedes usar igual.</span>
        </p>
      </div>
    </section>
  );
}

function ContactoApp() {
  React.useEffect(() => {
    applyDefaultTokens();
    const id = requestAnimationFrame(() => initRevealObserver());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div>
      <Nav active="contacto" />
      <ContactoHero />
      <FormAndCalendar />
      <ClosingCTA />
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ContactoApp />);
