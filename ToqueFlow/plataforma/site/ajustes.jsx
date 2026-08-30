// ajustes.jsx — Settings page (internal panel)

// ── Cómo habla tu asistente ──────────────────────────────────────────────────
// Es lo que el negocio va a querer tocar cada semana: «que no salude con
// Holaa», «que trate de usted», «menos emojis». Mientras viviera en la consola
// de ToqueFlow, cada ajuste menor pasaba por una persona.
//
// Se guarda por `tf_agente_tono`, que solo escribe el tono y solo en un agente
// de esta empresa. Un UPDATE abierto sobre la configuración dejaría mover la
// instancia de WhatsApp, y eso es de lo que cuelga todo el aislamiento.
// ── Qué sabe tu asistente ────────────────────────────────────────────────────
// Los documentos con los que responde. El cliente los escribe, los edita y los
// apaga sin pedirle permiso a nadie: es su información, y es la que más cambia
// —precios, horarios, una promoción que se acabó.
//
// Apagar en vez de borrar está a propósito: una promoción de diciembre se
// apaga en enero y se vuelve a encender el año siguiente sin reescribirla.
// ── Qué tienes contratado ────────────────────────────────────────────────────
// Los tres niveles, en las palabras del cliente:
//
//   tu producto      lo que contrataste
//   lo que le sumas  los paquetes: los que tienes y los que existen
//   por dentro       las piezas, solo si le interesa mirar
//
// Los que NO tiene se muestran a propósito, pero sin botón de compra: el
// objetivo es que sepa que existen, no venderle desde una pantalla. La
// conversación la abre él.
function QueTienes() {
  const [cat, setCat] = React.useState(null);
  const [mios, setMios] = React.useState(null);
  const [abierto, setAbierto] = React.useState(null);

  React.useEffect(() => {
    // El catálogo es público a propósito: es lo que ToqueFlow ofrece, no datos
    // de nadie.
    sb.from('catalogo').select('clave,nombre,beneficio,descripcion,tipo,contiene,incluye,puede_llevar,liberado')
      .eq('activo', true).eq('visible_cliente', true).order('orden')
      .then(({ data }) => setCat(data || []));
    sb.from('mis_agentes').select('id').limit(1).then(() => {});
    sb.from('agent_config').select('herramientas').then(({ data }) => {
      const todas = [];
      for (const a of data || []) for (const h of a.herramientas || []) todas.push(h);
      setMios(Array.from(new Set(todas)));
    });
  }, []);

  if (!cat || !mios) return null;

  const prod = cat.find((x) => x.clave === 'agente-atencion');
  if (!prod) return null;
  const de = (ks) => (ks || []).map((k) => cat.find((x) => x.clave === k)).filter(Boolean);

  const paquetes = de(prod.puede_llevar).filter((x) => x.tipo === 'paquete' && x.liberado);
  const tengo = (p) => mios.includes(p.clave) || (p.contiene || []).some((k) => mios.includes(k));

  return (
    <section className="dash-section">
      <div className="dash-section-h">
        <h2>Qué tienes contratado</h2>
        <p>Tu asistente hace esto. Lo de abajo se le puede sumar cuando lo necesites.</p>
      </div>

      {/* Nivel 1 */}
      <div className="tuyo">
        <div className="tuyo-h">
          <span className="niv-tag">tu producto</span>
          <b>{prod.nombre}</b>
        </div>
        <div className="tuyo-piezas">
          {de(prod.incluye).map((x) => (
            <div key={x.clave} className="tuyo-pieza">
              <span>●</span><b>{x.nombre}</b><i>{x.beneficio || x.descripcion}</i>
            </div>
          ))}
        </div>
      </div>

      {/* Nivel 2 */}
      <p className="adm-hint" style={{ marginTop: 18 }}>Lo que se le puede sumar:</p>
      {paquetes.map((p) => {
        const lo = tengo(p);
        const ver = abierto === p.clave;
        return (
          <div key={p.clave} className={'tuyo-paq' + (lo ? ' on' : '')}>
            <button type="button" className="tuyo-paq-h" onClick={() => setAbierto(ver ? null : p.clave)}>
              <span className="tuyo-estado">{lo ? '✓' : '+'}</span>
              <div>
                <b>{p.nombre}</b>
                <span>{p.beneficio || p.descripcion}</span>
              </div>
              <em>{lo ? 'lo tienes' : 'ver qué hace'}</em>
            </button>
            {ver && (
              <div className="tuyo-piezas dentro">
                {de(p.contiene).map((x) => (
                  <div key={x.clave} className={'tuyo-pieza' + (x.liberado ? '' : ' falta')}>
                    <span>{x.liberado ? '●' : '○'}</span><b>{x.nombre}</b>
                    <i>{x.liberado ? (x.beneficio || x.descripcion) : 'En construcción.'}</i>
                  </div>
                ))}
                {!lo && (
                  <p className="tuyo-nota">
                    Si te sirve, escríbele a tu equipo de ToqueFlow y lo activamos.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function QueSabe() {
  const [docs, setDocs] = React.useState(null);
  const [uso, setUso] = React.useState(null);
  const [editando, setEditando] = React.useState(null);   // el doc abierto, o {} para uno nuevo
  const [aviso, setAviso] = React.useState(null);

  const cargar = React.useCallback(async () => {
    const [d, u] = await Promise.all([
      TF_AUTH.sb.from('agent_knowledge').select('*').order('orden').order('created_at'),
      TF_AUTH.sb.from('agent_knowledge_uso').select('*').maybeSingle(),
    ]);
    setDocs(d.data || []);
    setUso(u.data || null);
  }, []);
  React.useEffect(() => { cargar(); }, [cargar]);

  if (docs === null) return null;

  const total = docs.filter((d) => d.activo).reduce((a, d) => a + (d.bytes || 0), 0);
  const limite = Number((uso && uso.bytes_limite) || 40000);
  const pct = Math.min(100, Math.round((total * 100) / (limite || 1)));
  const kb = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + ' KB' : n + ' B');

  const guardar = async () => {
    const e = editando;
    const titulo = (e.titulo || '').trim();
    const contenido = (e.contenido || '').trim();
    if (!titulo || !contenido) { setAviso({ mal: true, txt: 'Ponle un título y algo de contenido.' }); return; }

    const fila = { titulo, contenido, tipo: 'manual', origen: 'portal', activo: e.activo !== false };
    const r = e.id
      ? await TF_AUTH.sb.from('agent_knowledge').update(fila).eq('id', e.id)
      : await TF_AUTH.sb.from('agent_knowledge').insert({ ...fila, company_id: (window.TF_PROFILE || {}).company_id });

    if (r.error) { setAviso({ mal: true, txt: 'No se pudo guardar: ' + r.error.message }); return; }
    setEditando(null);
    setAviso({ mal: false, txt: 'Guardado. Tu asistente ya responde con esto.' });
    cargar();
  };

  const alternar = async (d) => {
    await TF_AUTH.sb.from('agent_knowledge').update({ activo: !d.activo }).eq('id', d.id);
    cargar();
  };

  const borrar = async (d) => {
    if (!confirm('¿Borrar «' + d.titulo + '»? Si solo quieres que deje de usarlo, apágalo en vez de borrarlo.')) return;
    await TF_AUTH.sb.from('agent_knowledge').delete().eq('id', d.id);
    cargar();
  };

  return (
    <section className="dash-section">
      <div className="dash-section-h">
        <h2>Qué sabe tu asistente</h2>
        <p>Lo que responde sale de aquí. Si algo no está escrito, no se lo inventa: lo pasa a una persona.</p>
      </div>

      <div className={'saber-medidor' + (pct >= 100 ? ' pasado' : pct >= 75 ? ' cerca' : '')}>
        <div className="saber-barra"><i style={{ width: Math.max(pct, total ? 2 : 0) + '%' }} /></div>
        <span>{kb(total)} de {kb(limite)}</span>
        {/* Pasarse no bloquea nada: el asistente sigue funcionando. Bloquearlo
            castigaría al cliente por darle MÁS información, que es al revés. */}
        {pct >= 100 && <i>Te pasaste de lo incluido. Sigue funcionando igual; hablemos para ajustar el plan.</i>}
      </div>

      {docs.length === 0 && (
        <div className="ag-lista-vacia">
          Todavía no hay nada. Empieza por lo que más te preguntan: precios, horarios y qué ofreces.
        </div>
      )}

      {docs.map((d) => (
        <div key={d.id} className={'saber-doc' + (d.activo ? '' : ' off')}>
          <div className="saber-doc-h">
            <b>{d.titulo}</b>
            <span>{kb(d.bytes || 0)}{d.activo ? '' : ' · apagado'}</span>
          </div>
          <p>{(d.contenido || '').slice(0, 160)}{(d.contenido || '').length > 160 ? '…' : ''}</p>
          <div className="saber-doc-acc">
            <button type="button" onClick={() => { setEditando(d); setAviso(null); }}>editar</button>
            <button type="button" onClick={() => alternar(d)}>{d.activo ? 'apagar' : 'encender'}</button>
            <button type="button" className="mal" onClick={() => borrar(d)}>borrar</button>
          </div>
        </div>
      ))}

      {!editando && (
        <button type="button" className="btn btn-ghost saber-nuevo"
                onClick={() => { setEditando({ activo: true }); setAviso(null); }}>
          + Agregar algo que deba saber
        </button>
      )}

      {editando && (
        <div className="saber-editor">
          <div className="form-field">
            <label>De qué se trata</label>
            <input type="text" value={editando.titulo || ''} placeholder="Ej. Precios y formas de pago"
                   onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Lo que tiene que saber</label>
            <textarea rows={9} value={editando.contenido || ''}
                      placeholder={'Escríbelo como se lo explicarías a alguien nuevo.\nLos precios exactos, con el número.\nSi hay excepciones, ponlas: es lo que más preguntan.'}
                      onChange={(e) => setEditando({ ...editando, contenido: e.target.value })} />
          </div>
          <div className="saber-editor-pie">
            <button type="button" className="btn btn-ghost" onClick={() => { setEditando(null); setAviso(null); }}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={guardar}>Guardar</button>
          </div>
        </div>
      )}

      {aviso && <p className={'tono-aviso' + (aviso.mal ? ' mal' : '')}>{aviso.txt}</p>}
    </section>
  );
}

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

        <QueTienes />

        <QueSabe />

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
