// ajustes.jsx — Settings page (internal panel)

// ── Cómo habla tu asistente ──────────────────────────────────────────────────
// Es lo que el negocio va a querer tocar cada semana: «que no salude con
// Holaa», «que trate de usted», «menos emojis». Mientras viviera en la consola
// de ToqueFlow, cada ajuste menor pasaba por una persona.
//
// Se guarda por `tf_agente_tono`, que solo escribe el tono y solo en un agente
// de esta empresa. Un UPDATE abierto sobre la configuración dejaría mover la
// instancia de WhatsApp, y eso es de lo que cuelga todo el aislamiento.
function ComoHabla() {
  const [agentes, setAgentes] = React.useState(null);
  const [elegido, setElegido] = React.useState(null);
  const [texto, setTexto] = React.useState('');
  const [aviso, setAviso] = React.useState(null);
  const [guardando, setGuardando] = React.useState(false);
  const MAX = 2000;

  React.useEffect(() => {
    TF_AUTH.sb.from('mis_agentes').select('*').order('nombre').then(({ data }) => {
      const a = data || [];
      setAgentes(a);
      if (a.length) { setElegido(a[0].id); setTexto(a[0].tono || ''); }
    });
  }, []);

  if (!agentes) return null;
  // Un negocio sin agente no tiene nada que ajustar, y una sección vacía con
  // un mensaje de «todavía no» solo estorba.
  if (!agentes.length) return null;

  const cambiar = (id) => {
    const a = agentes.find((x) => x.id === id);
    setElegido(id); setTexto((a && a.tono) || ''); setAviso(null);
  };

  const guardar = async () => {
    setGuardando(true); setAviso(null);
    const { data, error } = await TF_AUTH.sb.rpc('tf_agente_tono', { p_agent: elegido, p_tono: texto });
    setGuardando(false);
    if (error) { setAviso({ mal: true, txt: 'No se pudo guardar: ' + error.message }); return; }
    if (!data || !data.ok) { setAviso({ mal: true, txt: (data && data.motivo) || 'No se pudo guardar.' }); return; }
    setAgentes(agentes.map((a) => (a.id === elegido ? { ...a, tono: texto } : a)));
    setAviso({ mal: false, txt: 'Listo. Tu asistente ya habla así en el próximo mensaje.' });
  };

  const a = agentes.find((x) => x.id === elegido) || {};
  const sinCambios = (a.tono || '') === texto;

  return (
    <section className="dash-section">
      <div className="dash-section-h">
        <h2>Cómo habla tu asistente</h2>
        <p>Escríbelo como se lo explicarías a alguien nuevo en tu equipo.</p>
      </div>

      {agentes.length > 1 && (
        <div className="tono-tabs">
          {agentes.map((x) => (
            <button key={x.id} type="button" className={'tono-tab' + (x.id === elegido ? ' on' : '')}
                    onClick={() => cambiar(x.id)}>
              {x.nombre}{!x.activo && <em> · apagado</em>}
            </button>
          ))}
        </div>
      )}

      <textarea className="tono-caja" rows={9} value={texto} maxLength={MAX}
                onChange={(e) => { setTexto(e.target.value); setAviso(null); }}
                placeholder={'Ej. Cercano y directo, de tú. Nada corporativo.\nSaluda con «Hola» a secas y usa el nombre de la persona.\nEmojis solo si el cliente los usa primero.\nSi no sabes algo, dilo y pasa la conversación a una persona.'} />

      <div className="tono-pie">
        <span className={texto.length > MAX * 0.9 ? 'cerca' : ''}>
          {texto.length} de {MAX} caracteres
        </span>
        {/* El tope no es capricho: el tono viaja en cada mensaje que manda el
            agente, así que uno de tres páginas se cobra en cada conversación. */}
        <i>va en cada mensaje, así que más largo cuesta más</i>
        <button type="button" className="btn btn-primary" disabled={guardando || sinCambios} onClick={guardar}>
          {guardando ? 'Guardando…' : sinCambios ? 'Sin cambios' : 'Guardar'}
        </button>
      </div>

      {aviso && <p className={'tono-aviso' + (aviso.mal ? ' mal' : '')}>{aviso.txt}</p>}
    </section>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button type="button" className={`set-switch ${on ? 'on' : ''}`} onClick={onClick} role="switch" aria-checked={on}>
      <span className="set-switch-knob"></span>
    </button>
  );
}

function AjustesApp() {
  React.useEffect(() => { applyDefaultTokens(); }, []);

  const [tog, setTog] = React.useState({
    wa: true, mail: true, resumen: true, alertas: true, marketing: false, twofa: true,
  });
  const flip = (k) => setTog((t) => ({ ...t, [k]: !t[k] }));
  const service = { flows: 5, activos: 4, gestor: 'Equipo ToqueFlow', desde: 'mar 2026' };

  return (
    <div className="dash">
      <DashTopbar page="ajustes" />
      <main className="dash-main dash-narrow">
        <a href="dashboard.html" className="dash-back">← volver al panel</a>

        <div className="dash-head" style={{ marginTop: 16 }}>
          <div>
            <div className="eyebrow">configuración</div>
            <h1 className="dash-greeting">Ajustes.</h1>
            <p className="dash-greeting-sub">Notificaciones, seguridad y tu plan.</p>
          </div>
        </div>

        {/* Service summary (managed, not a subscription) */}
        <div className="set-plan">
          <div className="set-plan-info">
            <span className="set-plan-tag">// tu servicio</span>
            <b>{service.flows} flows contratados</b>
            <span className="set-plan-sub">{service.activos} activos · gestionado por {service.gestor} · desde {service.desde}</span>
          </div>
          <a href="contacto.html" className="btn btn-primary">Hablar con tu equipo <span className="arrow">→</span></a>
        </div>
        <p className="set-managed-note">// ¿necesitas un flow nuevo o cambiar uno existente? lo coordina tu equipo de ToqueFlow.</p>

        <ComoHabla />

        <section className="dash-section">
          <div className="dash-section-h">
            <h2>Notificaciones</h2>
            <p>Por dónde y cuándo quieres que te avisemos.</p>
          </div>
          <div className="set-list">
            <div className="set-row"><div><b>Avisos por WhatsApp</b><span>Cuando un flow necesita tu atención.</span></div><Toggle on={tog.wa} onClick={() => flip('wa')} /></div>
            <div className="set-row"><div><b>Avisos por correo</b><span>Errores de ejecución y eventos importantes.</span></div><Toggle on={tog.mail} onClick={() => flip('mail')} /></div>
            <div className="set-row"><div><b>Resumen semanal</b><span>Cada lunes, lo que hicieron tus flows.</span></div><Toggle on={tog.resumen} onClick={() => flip('resumen')} /></div>
            <div className="set-row"><div><b>Alertas de inactividad</b><span>Si un flow deja de responder o se detiene.</span></div><Toggle on={tog.alertas} onClick={() => flip('alertas')} /></div>
            <div className="set-row"><div><b>Novedades y tips</b><span>Ideas para sacarle más a tus flows.</span></div><Toggle on={tog.marketing} onClick={() => flip('marketing')} /></div>
          </div>
        </section>

        <section className="dash-section">
          <div className="dash-section-h">
            <h2>Seguridad</h2>
            <p>Protege el acceso a tu panel.</p>
          </div>
          <div className="set-list">
            <div className="set-row"><div><b>Verificación en dos pasos</b><span>Un código además de tu contraseña al entrar.</span></div><Toggle on={tog.twofa} onClick={() => flip('twofa')} /></div>
            <div className="set-row"><div><b>Contraseña</b><span>Última actualización hace 3 meses.</span></div><button type="button" className="btn btn-ghost set-row-btn">Cambiar</button></div>
            <div className="set-row"><div><b>Sesiones activas</b><span>2 dispositivos conectados ahora.</span></div><button type="button" className="btn btn-ghost set-row-btn">Ver</button></div>
          </div>
        </section>

        <section className="dash-section">
          <div className="dash-section-h">
            <h2>Acceso</h2>
            <p>Control sobre tu sesión y tus flows.</p>
          </div>
          <div className="set-list">
            <div className="set-row"><div><b>Pausar todos los flows</b><span>Detiene temporalmente todo lo que está corriendo.</span></div><button type="button" className="btn btn-ghost set-row-btn">Pausar todo</button></div>
            <div className="set-row"><div><b>Cerrar sesión en todos los dispositivos</b><span>Tendrás que volver a entrar en cada uno.</span></div><button type="button" className="btn btn-ghost set-row-btn">Cerrar todo</button></div>
          </div>
        </section>
      </main>
    </div>
  );
}

TF_AUTH.guard().then((profile) => {
  if (!profile) return; // el guard ya redirigió a login
  ReactDOM.createRoot(document.getElementById('root')).render(<AjustesApp />);
});
