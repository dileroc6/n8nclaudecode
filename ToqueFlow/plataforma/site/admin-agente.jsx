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

// ── Conectar el WhatsApp: el QR ─────────────────────────────────────────────
// Encender un agente no valía de nada si detrás no había un WhatsApp conectado.
// Aquí se crea la instancia en Evolution, se muestra el código QR y se espera a
// que el negocio lo escanee. El webhook con la firma se deja puesto DESDE LA
// CREACIÓN: dejarlo para después es como se olvida y se termina con una
// instancia abierta que nadie protege.
const WA_ESTADOS = {
  open:       ['conectado',    'ok'],
  connecting: ['conectando',   'medio'],
  close:      ['desconectado', 'papel'],
};

function ConectarWhatsApp({ instancia, onCambio }) {
  const [estado, setEstado] = React.useState(null);
  const [qr, setQr] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [esperando, setEsperando] = React.useState(false);

  const llamar = React.useCallback(async (accion) => {
    const ses = await sb.auth.getSession();
    const r = await fetch((window.TF_N8N || 'https://n8n.srv1398596.hstgr.cloud') + '/webhook/admin-evolution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accion, instancia,
        token: ses.data.session.access_token,
        webhook: (window.TF_N8N || 'https://n8n.srv1398596.hstgr.cloud') + '/webhook/toque-agente',
      }),
    });
    return await r.json().catch(() => ({ ok: false, motivo: 'respuesta ilegible' }));
  }, [instancia]);

  const mirar = React.useCallback(async () => {
    if (!instancia) return;
    const r = await llamar('estado');
    setEstado(r.ok ? (r.estado || 'no existe') : 'no existe');
    if (r.ok && r.estado === 'open') { setQr(null); setEsperando(false); if (onCambio) onCambio('open'); }
  }, [instancia, llamar, onCambio]);

  React.useEffect(() => { mirar(); }, [mirar]);

  // Mientras hay un QR en pantalla se pregunta cada 4 segundos si ya escanearon.
  // Un QR de WhatsApp caduca en menos de un minuto, así que también se avisa.
  React.useEffect(() => {
    if (!esperando) return;
    const t = setInterval(mirar, 4000);
    return () => clearInterval(t);
  }, [esperando, mirar]);

  const crear = async () => {
    setBusy(true); setErr(''); setQr(null);
    const r = await llamar('crear');
    if (!r.ok) { setErr('No se pudo crear: ' + (r.motivo || 'error')); setBusy(false); return; }
    if (r.qr) { setQr(r.qr); setEsperando(true); }
    else {
      // Si ya existía, se pide el código aparte.
      const c = await llamar('conectar');
      if (c.qr) { setQr(c.qr); setEsperando(true); }
      else setErr('Evolution no devolvió código. Puede que la instancia ya esté conectada.');
    }
    setBusy(false);
    mirar();
  };

  const reconectar = async () => {
    setBusy(true); setErr(''); setQr(null);
    const r = await llamar('conectar');
    if (r.qr) { setQr(r.qr); setEsperando(true); } else setErr('No devolvió código: ' + (r.motivo || 'ya podría estar conectada'));
    setBusy(false);
  };

  if (!instancia) {
    return (
      <div className="wa-caja">
        <p className="adm-hint">Ponle un nombre a la instancia arriba y guarda; después se conecta el WhatsApp.</p>
      </div>
    );
  }

  const et = WA_ESTADOS[estado] || ['sin crear', 'papel'];

  return (
    <div className="wa-caja">
      <div className="wa-cabeza">
        <div>
          <b>WhatsApp</b>
          <span>{instancia}</span>
        </div>
        <i className={'cat-estado e-' + et[1]}>{et[0]}</i>
      </div>

      {estado === 'open' && (
        <p className="wa-ok">
          Conectado y escuchando. Los mensajes que le lleguen a este número entran al agente.
        </p>
      )}

      {qr && (
        <div className="wa-qr">
          <img src={qr.startsWith('data:') ? qr : 'data:image/png;base64,' + qr} alt="Código QR de WhatsApp" />
          <div>
            <b>Escanéalo desde el celular del negocio</b>
            <ol>
              <li>WhatsApp → Configuración → Dispositivos vinculados</li>
              <li>Vincular un dispositivo</li>
              <li>Apunta a este código</li>
            </ol>
            <p className="adm-hint">
              El código caduca en menos de un minuto. Si se vence, pulsa «pedir otro».
              Esta pantalla se entera sola cuando conecte.
            </p>
          </div>
        </div>
      )}

      {err && <div className="login-notice error">{err}</div>}

      <div className="wa-botones">
        {estado === 'no existe' || estado === null ? (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={crear}>
            {busy ? 'Creando…' : 'Crear y conectar'}
          </button>
        ) : estado !== 'open' ? (
          <button type="button" className="btn btn-primary" disabled={busy} onClick={reconectar}>
            {busy ? 'Pidiendo…' : qr ? 'Pedir otro código' : 'Conectar'}
          </button>
        ) : null}
        <button type="button" className="ag-mini" onClick={mirar}>revisar estado</button>
      </div>

      <p className="adm-hint">
        Al crearla queda apuntando al agente <b>con su firma</b>, para que nadie más
        pueda mandarle mensajes falsos. No hay que configurar nada más en Evolution.
      </p>
    </div>
  );
}



// ── Los campos a capturar, con opciones ──────────────────────────────────────
// Un campo sin opciones devuelve texto libre, que es lo que hace falta para un
// nombre. Pero preguntar «¿qué plan te interesa?» sin opciones devuelve «el
// plan virtual», «virtual» y «la membresía virtual»: tres cadenas para una
// cosa, y después nadie puede filtrar ni contar — que era el punto de capturar.
function CamposACapturar({ campos, onChange }) {
  const set = (i, k, v) => onChange(campos.map((c, j) => j === i ? { ...c, [k]: v } : c));
  const quitar = (i) => onChange(campos.filter((_, j) => j !== i));

  return (
    <div className="ag-lista">
      <div className="ag-lista-head">
        <label>qué datos tiene que averiguar</label>
        <button type="button" className="ag-mini"
                onClick={() => onChange([...campos, { clave: '', etiqueta: '', obligatorio: false }])}>
          + agregar
        </button>
      </div>
      <p className="adm-hint">
        La <b>clave</b> es el nombre con el que se guarda el dato — sin ella, el dato se
        pierde. <code>nombre</code> y <code>correo</code> van a su columna en la base; los
        demás quedan en la ficha del contacto.
      </p>
      {campos.length === 0 && <div className="ag-lista-vacia">Ninguno todavía.</div>}

      {campos.map((c, i) => {
        const ops = Array.isArray(c.opciones) ? c.opciones : [];
        return (
          <div key={i} className="ag-campo">
            <div className="ag-fila">
              <input type="text" value={c.clave || ''} placeholder="nombre" style={{ flex: 1 }}
                     onChange={(e) => set(i, 'clave', e.target.value)} />
              <input type="text" value={c.etiqueta || ''} placeholder="Su primer nombre" style={{ flex: 2 }}
                     onChange={(e) => set(i, 'etiqueta', e.target.value)} />
              <label className="ag-check">
                <input type="checkbox" checked={!!c.obligatorio} onChange={(e) => set(i, 'obligatorio', e.target.checked)} />
                <span>clave</span>
              </label>
              <button type="button" className="ag-quitar" title="Quitar" onClick={() => quitar(i)}>×</button>
            </div>

            <div className="ag-campo-ops">
              <label className="ag-check">
                <input type="checkbox" checked={ops.length > 0}
                       onChange={(e) => set(i, 'opciones', e.target.checked ? [''] : undefined)} />
                <span>tiene opciones fijas</span>
              </label>
              {ops.length > 0 && (
                <React.Fragment>
                  <textarea rows={Math.min(6, Math.max(2, ops.length))}
                            value={ops.join('\n')}
                            placeholder={'Membresía Virtual\nMembresía completa\nTodavía no sabe'}
                            onChange={(e) => set(i, 'opciones', e.target.value.split('\n'))} />
                  <p className="adm-hint">
                    Una por línea. El agente <b>tiene que elegir una de estas</b> o dejarlo
                    vacío — no puede escribir su propia versión. Así el dato sirve para
                    filtrar y contar.
                  </p>
                </React.Fragment>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ── Qué herramientas tiene encendidas este agente ────────────────────────────
// Solo se ofrecen las liberadas. Ofrecer aquí una que está en construcción
// sería dejar que alguien la encienda y que el agente la pida a un webhook que
// no existe: el modelo prometería algo y el flujo se quedaría esperando.
function HerramientasDelAgente({ puestas, onChange }) {
  const [cat, setCat] = React.useState(null);
  React.useEffect(() => {
    sb.from('catalogo').select('clave,nombre,beneficio,descripcion,liberado')
      .eq('tipo', 'herramienta').eq('activo', true).order('orden')
      .then(({ data }) => setCat(data || []));
  }, []);

  if (!cat) return null;
  const libres = cat.filter((h) => h.liberado && h.clave !== 'responder-conocimiento');
  const enObra = cat.filter((h) => !h.liberado);
  const alternar = (k) => onChange(puestas.includes(k) ? puestas.filter((x) => x !== k) : [...puestas, k]);

  return (
    <div className="ag-lista">
      <div className="ag-lista-head"><label>qué más puede hacer</label></div>
      <p className="adm-hint">
        Además de responder con su conocimiento, que va siempre. Cada una es algo que
        el agente puede consultar o hacer <b>dentro de la conversación</b>.
      </p>
      {libres.length === 0 && <div className="ag-lista-vacia">Todavía no hay ninguna liberada.</div>}
      {libres.map((h) => (
        <label key={h.clave} className={'alta-pieza' + (puestas.includes(h.clave) ? ' is-puesta' : '')}>
          <input type="checkbox" checked={puestas.includes(h.clave)} onChange={() => alternar(h.clave)} />
          <div><b>{h.nombre}</b><span>{h.beneficio || h.descripcion}</span></div>
        </label>
      ))}
      {enObra.length > 0 && (
        <p className="adm-hint">
          En construcción y por eso no se ofrecen: {enObra.map((h) => h.nombre).join(' · ')}.
        </p>
      )}
    </div>
  );
}

// ── Modal: configurar el agente ──────────────────────────────────────────────
function AgenteModal({ company, config, onClose, onSaved }) {
  // `config` es una fila de agent_runtime, o null si es un agente nuevo.
  const c = config || {};
  const [f, setF] = React.useState({
    // Un nombre para distinguirlo de los otros agentes de la misma empresa.
    // Sin esto, dos agentes se ven idénticos y nadie sabe cuál está tocando.
    nombre: c.agente || company.name,
    activo: !!c.activo,
    whatsapp_instance: c.whatsapp_instance || '',
    negocio: obj(c.identidad).negocio || company.name,
    tono: obj(c.identidad).tono || '',
    campos: arr(obj(c.captura).campos),
    reglas: arr(obj(c.enrutamiento).reglas),
    nunca: aLineas(obj(c.limites).nunca),
    escalar_si: aLineas(obj(c.limites).escalar_si),
    agenda: obj(c.agenda).modo || 'ninguna',
    herramientas: arr(c.herramientas),
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
      nombre: f.nombre.trim() || company.name,
      activo: f.activo,
      whatsapp_instance: f.whatsapp_instance.trim() || null,
      identidad: { negocio: f.negocio.trim() || company.name, tono: f.tono.trim() },
      captura: { campos: f.campos.filter((x) => (x.clave || '').trim()) },
      enrutamiento: { reglas: f.reglas.filter((x) => (x.si || '').trim()) },
      limites: { nunca: deLineas(f.nunca), escalar_si: deLineas(f.escalar_si) },
      agenda: { ...obj(c.agenda), modo: f.agenda },
      herramientas: f.herramientas,
      actualizado_at: new Date().toISOString(),
    };
    // Antes era un upsert por company_id. Ya no: la empresa dejó de ser única
    // en esta tabla, así que se actualiza ESTE agente o se crea uno nuevo.
    const { error } = config && config.agent_id
      ? await sb.from('agent_config').update(fila).eq('id', config.agent_id)
      : await sb.from('agent_config').insert(fila);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved();
  };

  return (
    <Modal title={config ? 'Agente: ' + (config.agente || company.name) : 'Nuevo agente de ' + company.name} onClose={onClose}>
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
          <label>nombre del agente</label>
          <input type="text" value={f.nombre} placeholder="Nico Bogotá"
                 onChange={(e) => set('nombre', e.target.value)} />
          <p className="adm-hint">
            Solo para distinguirlo aquí. Si esta empresa tiene un agente por sede
            o por línea de negocio, ponle el nombre que use el equipo.
          </p>
        </div>

        <div className="form-field">
          <label>instancia de WhatsApp (Evolution)</label>
          <input type="text" value={f.whatsapp_instance} placeholder="bejauha-sandbox"
                 onChange={(e) => set('whatsapp_instance', e.target.value)} />
          <p className="adm-hint">
            Es la llave que traduce «llegó un WhatsApp» a «es de este agente».
            <b> Mientras apunte a una instancia que no existe, ningún WhatsApp real le llega</b> —
            eso lo hace el interruptor más seguro para probar.
          </p>
        </div>

        <ConectarWhatsApp instancia={f.whatsapp_instance.trim()} />

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

        <CamposACapturar campos={f.campos} onChange={(v) => set('campos', v)} />

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

        <HerramientasDelAgente puestas={f.herramientas} onChange={(v) => set('herramientas', v)} />

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
