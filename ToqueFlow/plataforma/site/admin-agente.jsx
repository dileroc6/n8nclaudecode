/* ============================================================================
 * Consola de ToqueFlow — la pestaña Agentes
 * ----------------------------------------------------------------------------
 * Aquí se configura el Agente de Atención de cada cliente y se le carga lo que
 * sabe. Es la pantalla que convierte "Diego corre un script y edita JSON a
 * mano" en algo que hace cualquiera.
 *
 * Va en su propio archivo porque admin.jsx ya pasa de 36 KB. No hay módulos:
 * se carga antes que admin.jsx y sus componentes quedan globales.
 * ========================================================================== */

// ── Utilidades ───────────────────────────────────────────────────────────────
const AG_ACCIONES = ['notificar_humano', 'enviar_link', 'responder_y_cerrar'];
const AG_MODOS_AGENDA = [
  ['ninguna', 'No agenda — captura y enruta'],
  ['google', 'Google Calendar del cliente'],
  ['propia', 'Agenda propia en el portal'],
];

// Un jsonb que llega null no debe reventar el formulario.
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
const arr = (v) => Array.isArray(v) ? v : [];
// Las listas de texto libre se editan como líneas: es lo que la gente espera.
const aLineas = (v) => arr(v).join('\n');
const deLineas = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function kb(bytes) {
  const n = Number(bytes || 0);
  return n < 1024 ? n + ' B' : (n / 1024).toFixed(1).replace('.0', '') + ' KB';
}

// ── El medidor ───────────────────────────────────────────────────────────────
// El límite tiene que verse ANTES de pasarse, no después. Y pasarse no bloquea:
// abre una conversación comercial. El texto lo dice así a propósito.
function MedidorConocimiento({ uso }) {
  const total = Number(uso?.bytes_total || 0);
  const limite = Number(uso?.bytes_limite || 40000);
  const pct = Math.min(100, Math.round((total * 100) / limite));
  const estado = uso?.estado || (total ? 'ok' : 'vacio');

  const copia = {
    vacio: 'Todavía no hay nada cargado. El agente no puede responder sin esto.',
    ok: 'Espacio de sobra.',
    cerca: 'Ya casi. Al pasarte el asistente consume más y el plan se ajusta — mejor hablarlo antes de llegar.',
    excedido: 'Pasaste lo incluido. El asistente sigue funcionando igual; hablemos para ajustar el plan.',
  }[estado];

  return (
    <div className={'ag-medidor is-' + estado}>
      <div className="ag-medidor-top">
        <b>{kb(total)}</b><span> de {kb(limite)}</span>
        <span className="ag-medidor-pct">{pct}%</span>
      </div>
      <div className="ag-medidor-barra"><i style={{ width: Math.max(pct, total ? 2 : 0) + '%' }} /></div>
      <p className="ag-medidor-nota">{copia}</p>
    </div>
  );
}

// ── Editor de listas de objetos (campos a capturar, reglas de enrutamiento) ──
function ListaEditable({ titulo, ayuda, items, columnas, vacio, onChange }) {
  const set = (i, k, v) => onChange(items.map((it, j) => j === i ? { ...it, [k]: v } : it));
  const quitar = (i) => onChange(items.filter((_, j) => j !== i));
  const agregar = () => onChange([...items, vacio]);
  return (
    <div className="ag-lista">
      <div className="ag-lista-head">
        <label>{titulo}</label>
        <button type="button" className="ag-mini" onClick={agregar}>+ agregar</button>
      </div>
      {ayuda && <p className="adm-hint">{ayuda}</p>}
      {items.length === 0 && <div className="ag-lista-vacia">Ninguno todavía.</div>}
      {items.map((it, i) => (
        <div key={i} className="ag-fila">
          {columnas.map((col) => (
            col.tipo === 'select' ? (
              <select key={col.k} value={it[col.k] || col.opciones[0][0]} onChange={(e) => set(i, col.k, e.target.value)}>
                {col.opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            ) : col.tipo === 'check' ? (
              <label key={col.k} className="ag-check">
                <input type="checkbox" checked={!!it[col.k]} onChange={(e) => set(i, col.k, e.target.checked)} />
                <span>{col.etiqueta}</span>
              </label>
            ) : (
              <input key={col.k} type="text" value={it[col.k] || ''} placeholder={col.ph}
                     style={col.ancho ? { flex: col.ancho } : undefined}
                     onChange={(e) => set(i, col.k, e.target.value)} />
            )
          ))}
          <button type="button" className="ag-quitar" title="Quitar" onClick={() => quitar(i)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── Modal: configurar el agente ──────────────────────────────────────────────
function AgenteModal({ company, config, onClose, onSaved }) {
  const c = config || {};
  const [f, setF] = React.useState({
    activo: !!c.activo,
    whatsapp_instance: c.whatsapp_instance || '',
    negocio: obj(c.identidad).negocio || company.name,
    tono: obj(c.identidad).tono || '',
    campos: arr(obj(c.captura).campos),
    reglas: arr(obj(c.enrutamiento).reglas),
    nunca: aLineas(obj(c.limites).nunca),
    escalar_si: aLineas(obj(c.limites).escalar_si),
    agenda: obj(c.agenda).modo || 'ninguna',
  });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));

  const guardar = async (e) => {
    e.preventDefault();
    if (f.activo && !f.whatsapp_instance.trim()) {
      setErr('Para encenderlo hace falta la instancia de WhatsApp: es lo único que le dice al agente de qué empresa es cada mensaje.');
      return;
    }
    setBusy(true); setErr('');
    const fila = {
      company_id: company.id,
      activo: f.activo,
      whatsapp_instance: f.whatsapp_instance.trim() || null,
      identidad: { negocio: f.negocio.trim() || company.name, tono: f.tono.trim() },
      captura: { campos: f.campos.filter((x) => (x.clave || '').trim()) },
      enrutamiento: { reglas: f.reglas.filter((x) => (x.si || '').trim()) },
      limites: { nunca: deLineas(f.nunca), escalar_si: deLineas(f.escalar_si) },
      agenda: { ...obj(c.agenda), modo: f.agenda },
      actualizado_at: new Date().toISOString(),
    };
    const { error } = await sb.from('agent_config').upsert(fila, { onConflict: 'company_id' });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  };

  return (
    <Modal title={'Agente de ' + company.name} onClose={onClose}>
      <form className="adm-form ag-form" onSubmit={guardar}>

        <div className="ag-encendido">
          <label className="ag-check">
            <input type="checkbox" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} />
            <span><b>Agente encendido</b></span>
          </label>
          <p className="adm-hint">
            Apagado, el agente no responde nada y no cuesta nada. Enciéndelo cuando el
            sandbox se vea bien — no antes.
          </p>
        </div>

        <div className="form-field">
          <label>instancia de WhatsApp (Evolution)</label>
          <input type="text" value={f.whatsapp_instance} placeholder="bejauha-sandbox"
                 onChange={(e) => set('whatsapp_instance', e.target.value)} />
          <p className="adm-hint">
            Es la llave que traduce «llegó un WhatsApp» a «es de esta empresa».
            <b> Mientras apunte a una instancia que no existe, ningún WhatsApp real le llega</b> —
            eso lo hace el interruptor más seguro para probar.
          </p>
        </div>

        <div className="form-field">
          <label>cómo se llama el negocio</label>
          <input type="text" value={f.negocio} onChange={(e) => set('negocio', e.target.value)} />
        </div>

        <div className="form-field">
          <label>cómo habla</label>
          <textarea rows="5" value={f.tono} onChange={(e) => set('tono', e.target.value)}
                    placeholder={'Cercano y breve, tuteando. Nada de formalismos.\nEmojis suaves, máximo dos por mensaje.'} />
          <p className="adm-hint">
            <b>Describe la voz, no la mecánica de cada mensaje.</b> Cómo suena, qué
            palabras sí y cuáles no, si trata de tú o de usted. Lo que mejor funciona
            son ejemplos: «di “Holaa” y no “Estimado cliente”».
          </p>
          <p className="adm-hint ag-ojo">
            No escribas <i>cada cuánto</i> saludar, cuántos emojis por mensaje ni qué
            tan largo responder — de eso se encarga el sistema, igual para todos.
            Poner «saluda con Holaa en cada mensaje» produce un agente que saluda seis
            veces seguidas: <b>medido, no supuesto.</b>
          </p>
        </div>

        <ListaEditable
          titulo="qué datos tiene que averiguar"
          ayuda="La clave es el nombre con el que se guarda el dato; la etiqueta es cómo se lo explicas al agente. Sin clave, el dato se pierde."
          items={f.campos}
          vacio={{ clave: '', etiqueta: '', obligatorio: false }}
          columnas={[
            { k: 'clave', ph: 'nombre', ancho: 1 },
            { k: 'etiqueta', ph: 'Su primer nombre', ancho: 2 },
            { k: 'obligatorio', tipo: 'check', etiqueta: 'clave' },
          ]}
          onChange={(v) => set('campos', v)}
        />

        <ListaEditable
          titulo="cuándo dejar de responder y pasar a una persona"
          ayuda="Se lee como una frase: «si [situación] → [acción] ([a dónde])»."
          items={f.reglas}
          vacio={{ si: '', accion: 'notificar_humano', destino: '' }}
          columnas={[
            { k: 'si', ph: 'pide un descuento especial', ancho: 2 },
            { k: 'accion', tipo: 'select', opciones: AG_ACCIONES.map((a) => [a, a.replace(/_/g, ' ')]) },
            { k: 'destino', ph: 'grupo de ventas · o una URL', ancho: 2 },
          ]}
          onChange={(v) => set('reglas', v)}
        />

        <div className="form-field">
          <label>lo que nunca debe hacer — uno por línea</label>
          <textarea rows="4" value={f.nunca} onChange={(e) => set('nunca', e.target.value)}
                    placeholder={'Dar consejo médico o de nutrición.\nPrometer resultados.'} />
          <p className="adm-hint">
            Es lo único que protege al negocio de una respuesta que le cueste un cliente
            o algo peor. Nadie lo ofrece solo: hay que preguntarlo.
          </p>
        </div>

        <div className="form-field">
          <label>cuándo escalar aunque no haya regla — uno por línea</label>
          <textarea rows="3" value={f.escalar_si} onChange={(e) => set('escalar_si', e.target.value)}
                    placeholder={'se molesta o repite la misma queja\npide algo que no está escrito'} />
        </div>

        <div className="form-field">
          <label>agenda</label>
          <select value={f.agenda} onChange={(e) => set('agenda', e.target.value)}>
            {AG_MODOS_AGENDA.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
          <p className="adm-hint">
            Si el negocio ya usa un calendario, la verdad vive ahí: así el bot no ofrece
            las 3 PM mientras recepción ya puso a alguien a las 3.
            <b> Google Calendar todavía no está conectado</b>, así que por ahora ese caso
            se comporta como escalamiento.
          </p>
        </div>

        {err && <div className="login-notice error">{err}</div>}
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: lo que el agente sabe ─────────────────────────────────────────────
function ConocimientoModal({ company, onClose, onChanged }) {
  const [docs, setDocs] = React.useState(null);
  const [uso, setUso] = React.useState(null);
  const [nuevo, setNuevo] = React.useState({ titulo: '', contenido: '' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [viendo, setViendo] = React.useState(null);

  const cargar = React.useCallback(async () => {
    const [d, u] = await Promise.all([
      sb.from('agent_knowledge').select('*').eq('company_id', company.id).order('orden').order('created_at'),
      sb.from('agent_knowledge_prompt').select('*').eq('company_id', company.id).maybeSingle(),
    ]);
    setDocs(d.data || []);
    setUso(u.data || null);
  }, [company.id]);
  React.useEffect(() => { cargar(); }, [cargar]);

  const agregar = async (e) => {
    e.preventDefault();
    const t = nuevo.titulo.trim(), c = nuevo.contenido.trim();
    if (!t || !c) { setErr('Hacen falta el título y el texto.'); return; }
    setBusy(true); setErr('');
    const { error } = await sb.from('agent_knowledge').insert({
      company_id: company.id, tipo: 'manual', titulo: t, contenido: c,
      activo: true, orden: (docs || []).length + 1,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setNuevo({ titulo: '', contenido: '' });
    await cargar(); onChanged();
  };

  const alternar = async (d) => {
    setDocs((xs) => xs.map((x) => x.id === d.id ? { ...x, activo: !x.activo } : x));
    await sb.from('agent_knowledge').update({ activo: !d.activo }).eq('id', d.id);
    await cargar(); onChanged();
  };
  const borrar = async (d) => {
    await sb.from('agent_knowledge').delete().eq('id', d.id);
    await cargar(); onChanged();
  };

  return (
    <Modal title={'Lo que sabe el agente de ' + company.name} onClose={onClose}>
      <div className="adm-form ag-form">
        <MedidorConocimiento uso={uso} />

        {docs === null && <div className="admin-empty">Cargando…</div>}
        {docs && docs.length === 0 && (
          <div className="ag-lista-vacia">
            Nada cargado. Lo que hay que pedirle al cliente está en la guía de
            levantamiento: qué hace, cómo lo hace, <b>su valor agregado</b>, precios,
            horarios, las preguntas que ya recibe a diario y sus límites.
          </div>
        )}

        {docs && docs.map((d) => (
          <div key={d.id} className={'ag-doc' + (d.activo ? '' : ' is-off')}>
            <div className="ag-doc-top">
              <b>{d.titulo}</b>
              <span className="ag-doc-bytes">{kb(d.bytes)}</span>
              <span className="ag-doc-tipo">{d.tipo}</span>
            </div>
            <p className="ag-doc-prev">{String(d.contenido || '').replace(/\s+/g, ' ').slice(0, 150)}…</p>
            <div className="ag-doc-acc">
              <button type="button" className="ag-mini" onClick={() => setViendo(viendo === d.id ? null : d.id)}>
                {viendo === d.id ? 'ocultar' : 'ver completo'}
              </button>
              <button type="button" className="ag-mini" onClick={() => alternar(d)}>
                {d.activo ? 'desactivar' : 'activar'}
              </button>
              <button type="button" className="ag-mini danger" onClick={() => borrar(d)}>borrar</button>
            </div>
            {viendo === d.id && <pre className="ag-doc-full">{d.contenido}</pre>}
          </div>
        ))}

        <form className="ag-nuevo" onSubmit={agregar}>
          <div className="form-field">
            <label>agregar un documento — título</label>
            <input type="text" value={nuevo.titulo} placeholder="Precios y cómo se paga"
                   onChange={(e) => setNuevo((n) => ({ ...n, titulo: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>el texto, pegado tal cual</label>
            <textarea rows="7" value={nuevo.contenido}
                      placeholder={'Membresía Virtual: $79.900/mes, clases en vivo ilimitadas.\nMembresía completa: $160.000/mes, suma presenciales y cursos.\nSe compran en https://…'}
                      onChange={(e) => setNuevo((n) => ({ ...n, contenido: e.target.value }))} />
            <p className="adm-hint">
              Pégalo como esté: de un Word, de un WhatsApp, de donde sea. No hace falta
              pasarlo a limpio. <b>Escribir «consultar» es peor que no poner nada</b> —
              el agente lo repite literal y el cliente se va.
            </p>
          </div>
          {err && <div className="login-notice error">{err}</div>}
          <div className="adm-form-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Agregar'}</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

// ── La pestaña ───────────────────────────────────────────────────────────────
function AgentesTab({ companies, runtime, onConfig, onConocimiento }) {
  const porEmpresa = {};
  for (const r of runtime) porEmpresa[r.company_id] = r;

  if (!companies.length) return <div className="admin-empty">Aún no hay empresas.</div>;

  return (
    <div className="admin-cards">
      {companies.map((c) => {
        const r = porEmpresa[c.id];
        const sinAgente = !r;
        const estado = sinAgente ? 'sin' : (r.activo ? 'on' : 'off');
        return (
          <article key={c.id} className="admin-co-card">
            <div className="admin-co-top">
              <span className="admin-co-logo admin-co-logo-fallback">{initials(c.name)}</span>
              <div className="admin-co-meta"><b>{c.name}</b></div>
              <span className={'flow-status ' + (estado === 'on' ? 'on' : 'off')}>
                <span className="flow-status-dot"></span>
                {estado === 'on' ? 'encendido' : estado === 'off' ? 'apagado' : 'sin agente'}
              </span>
            </div>

            {sinAgente ? (
              <p className="ag-card-vacia">
                Esta empresa todavía no tiene agente. Configúralo y cárgale lo que
                tiene que saber.
              </p>
            ) : (
              <React.Fragment>
                <div className="admin-co-stats">
                  <div><b>{kb(r.conocimiento_bytes)}</b><span>conocimiento</span></div>
                  <div><b>{r.conocimiento_fuentes}</b><span>documentos</span></div>
                  <div><b>{r.whatsapp_instance || '—'}</b><span>instancia</span></div>
                </div>
                {r.conocimiento_estado === 'excedido' && (
                  <p className="ag-aviso excedido">Pasó lo incluido. Sigue funcionando — es momento de hablar del plan.</p>
                )}
                {r.conocimiento_estado === 'cerca' && (
                  <p className="ag-aviso cerca">Cerca del límite.</p>
                )}
                {r.conocimiento_estado === 'vacio' && (
                  <p className="ag-aviso vacio">Sin conocimiento cargado: no puede responder nada.</p>
                )}
              </React.Fragment>
            )}

            <div className="admin-co-foot">
              <button type="button" className="admin-co-btn primary" onClick={() => onConfig(c)}>
                {sinAgente ? 'Configurar agente →' : 'Configuración'}
              </button>
              <button type="button" className="admin-co-btn" onClick={() => onConocimiento(c)}>Conocimiento</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
