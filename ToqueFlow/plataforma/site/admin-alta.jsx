/* ============================================================================
 * Consola de ToqueFlow — dar de alta un cliente, paso a paso
 * ----------------------------------------------------------------------------
 * Antes eran tres botones sueltos —crear empresa, crear usuario, y después
 * entrar a configurar cada producto a mano— sin nada que dijera qué falta.
 *
 * Esta pantalla es la que convierte «11 a 14 horas por cliente» en un número
 * comprobable: si dar de alta a alguien sigue siendo correr scripts, el
 * producto no es estándar.
 *
 * DOS DECISIONES QUE VALE LA PENA CONOCER:
 *
 * 1. Solo se ofrecen las piezas LIBERADAS. Enseñar aquí algo que está en el
 *    papel es la forma más fácil de prometerle a un cliente lo que no hay.
 *
 * 2. El agente nace APAGADO y con una instancia de WhatsApp que no existe.
 *    Encenderlo es un acto aparte, después de probarlo en el sandbox. Un alta
 *    que deja un bot contestando de una no es rápida: es peligrosa.
 * ========================================================================== */

const ALTA_PASOS = ['La empresa', 'Quién la usa', 'Qué contrata', 'El agente', 'Listo'];

function slugAlta(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Los campos que casi todo negocio quiere capturar. Se ofrecen marcados para
// que nadie arranque de una hoja en blanco, y se pueden quitar.
const ALTA_CAMPOS_SUGERIDOS = [
  { clave: 'nombre',     etiqueta: 'Su primer nombre',                   obligatorio: true,  puesto: true },
  { clave: 'correo',     etiqueta: 'Su correo electrónico',              obligatorio: false, puesto: true },
  { clave: 'interes',    etiqueta: 'Qué servicio o plan le interesa',    obligatorio: true,  puesto: true },
  { clave: 'como_llego', etiqueta: 'Por dónde nos conoció',              obligatorio: false, puesto: false },
  { clave: 'ciudad',     etiqueta: 'De qué ciudad escribe',              obligatorio: false, puesto: false },
];

function AltaClienteVista({ catalogo, onListo, onCancelar }) {
  const [paso, setPaso] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [creada, setCreada] = React.useState(null);

  const [f, setF] = React.useState({
    nombre: '', ciudad: '',
    correo: '', nombreUsuario: '',
    piezas: {},                       // clave -> true
    tono: '', negocio: '',
    campos: ALTA_CAMPOS_SUGERIDOS.map((c) => ({ ...c })),
    escalar: 'quiere comprar, agendar o pagar algo',
    nunca: '',
  });
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));

  // Solo lo liberado y lo que se vende. El Portal y el Simulador van siempre:
  // no se preguntan porque no son una elección.
  const ofrecibles = catalogo
    .filter((c) => c.liberado && c.vendible && c.tipo !== 'herramienta')
    .sort((a, b) => a.orden - b.orden);

  const eligioAgente = !!f.piezas['agente-atencion'];
  const pasosVisibles = eligioAgente ? ALTA_PASOS : ALTA_PASOS.filter((p) => p !== 'El agente');
  const pasoActual = pasosVisibles[paso];

  const puedeSeguir = () => {
    if (pasoActual === 'La empresa')  return f.nombre.trim().length > 1;
    if (pasoActual === 'Quién la usa') return /\S+@\S+\.\S+/.test(f.correo);
    if (pasoActual === 'Qué contrata') return Object.values(f.piezas).some(Boolean);
    return true;
  };

  const togglePieza = (clave) => setF((d) => ({ ...d, piezas: { ...d.piezas, [clave]: !d.piezas[clave] } }));
  const setCampo = (i, k, v) => setF((d) => ({ ...d, campos: d.campos.map((c, j) => j === i ? { ...c, [k]: v } : c) }));

  // ── El alta ────────────────────────────────────────────────────────────────
  const crear = async () => {
    setBusy(true); setErr('');
    try {
      const slug = slugAlta(f.nombre) + '-' + Date.now().toString(36).slice(-4);
      const { data: empresa, error: e1 } = await sb.from('companies')
        .insert({ name: f.nombre.trim(), city: f.ciudad.trim() || null, slug, status: 'active' })
        .select().single();
      if (e1) throw new Error('No se pudo crear la empresa: ' + e1.message);

      // El usuario se crea por la edge function: necesita service_role y ahí es
      // donde se verifica que quien lo pide sea super admin.
      const token = (await sb.auth.getSession()).data.session.access_token;
      const r = await fetch((window.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/admin-users', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, apikey: window.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', email: f.correo.trim(), full_name: f.nombreUsuario.trim() || null,
                               company_id: empresa.id, role: 'member' }),
      });
      const body = await r.json().catch(() => ({}));
      const avisoUsuario = (!r.ok || body.error) ? ('El usuario no se creó: ' + (body.error || 'error') + '. La empresa sí quedó.') : null;

      // Las piezas elegidas, más las que vienen con la plataforma.
      const conPlataforma = { ...f.piezas };
      for (const c of catalogo) if (!c.vendible && c.tipo === 'producto') conPlataforma[c.clave] = true;

      const filas = catalogo
        .filter((c) => conPlataforma[c.clave])
        .map((c) => ({
          company_id: empresa.id, catalogo_id: c.id, name: c.nombre,
          description: c.beneficio || c.descripcion,
          // Nace anunciado, no encendido: encender es un acto aparte, después
          // de probarlo. Un alta que deja un bot contestando de una no es
          // rápida, es peligrosa.
          status: 'próximamente', type: c.tipo, kind: c.clave,
        }));
      if (filas.length) {
        const { error: e2 } = await sb.from('flows').insert(filas);
        if (e2) throw new Error('La empresa quedó pero los productos no: ' + e2.message);
      }

      // Si contrató el agente, su configuración queda lista para afinar.
      if (eligioAgente) {
        const { error: e3 } = await sb.from('agent_config').insert({
          company_id: empresa.id,
          activo: false,
          // Una instancia que NO existe en Evolution. Ese nombre es el
          // interruptor: mientras sea este, ningún WhatsApp real le llega.
          whatsapp_instance: slug + '-sandbox',
          identidad: { negocio: f.negocio.trim() || f.nombre.trim(), tono: f.tono.trim() },
          captura: { campos: f.campos.filter((c) => c.puesto).map((c) => ({ clave: c.clave, etiqueta: c.etiqueta, obligatorio: c.obligatorio })) },
          enrutamiento: { reglas: f.escalar.trim() ? [{ si: f.escalar.trim(), accion: 'notificar_humano', destino: 'equipo' }] : [] },
          limites: { nunca: f.nunca.split('\n').map((x) => x.trim()).filter(Boolean), escalar_si: ['se molesta o repite la misma queja'] },
          agenda: { modo: 'ninguna' },
          herramientas: catalogo.filter((c) => c.tipo === 'herramienta' && f.piezas[c.clave]).map((c) => c.clave),
        });
        if (e3) throw new Error('La empresa quedó pero el agente no: ' + e3.message);
      }

      setCreada({ empresa, avisoUsuario, instancia: slug + '-sandbox' });
      setPaso(pasosVisibles.length - 1);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  // ── Pintar ─────────────────────────────────────────────────────────────────
  return (
    <div className="alta">
      <div className="emp-cabeza">
        <button type="button" className="emp-volver" onClick={onCancelar}>← Empresas</button>
        <h2>Dar de alta un cliente</h2>
      </div>

      <ol className="alta-pasos">
        {pasosVisibles.map((p, i) => (
          <li key={p} className={i === paso ? 'is-aqui' : i < paso ? 'is-hecho' : ''}>
            <span>{i < paso ? '✓' : i + 1}</span>{p}
          </li>
        ))}
      </ol>

      <div className="alta-caja">

        {pasoActual === 'La empresa' && (
          <React.Fragment>
            <h3>¿Qué negocio es?</h3>
            <div className="form-field"><label>nombre de la empresa</label>
              <input type="text" value={f.nombre} autoFocus placeholder="Clínica Estética Aurora"
                     onChange={(e) => set('nombre', e.target.value)} /></div>
            <div className="form-field"><label>ciudad (opcional)</label>
              <input type="text" value={f.ciudad} placeholder="Bogotá"
                     onChange={(e) => set('ciudad', e.target.value)} /></div>
            <p className="adm-hint">
              La empresa es una sola. Si tiene varias sedes, se agregan después —
              no hace falta crear una empresa por ciudad.
            </p>
          </React.Fragment>
        )}

        {pasoActual === 'Quién la usa' && (
          <React.Fragment>
            <h3>¿Quién va a entrar al portal?</h3>
            <div className="form-field"><label>correo</label>
              <input type="email" value={f.correo} autoFocus placeholder="maria@clinicaaurora.com"
                     onChange={(e) => set('correo', e.target.value)} /></div>
            <div className="form-field"><label>nombre de la persona (opcional)</label>
              <input type="text" value={f.nombreUsuario} placeholder="María Restrepo"
                     onChange={(e) => set('nombreUsuario', e.target.value)} /></div>
            <p className="adm-hint">
              Se crea con permisos de miembro: ve lo de su empresa y nada más. Después
              se le pueden agregar más personas desde la pestaña Usuarios.
            </p>
          </React.Fragment>
        )}

        {pasoActual === 'Qué contrata' && (
          <React.Fragment>
            <h3>¿Qué va a tener?</h3>
            <p className="adm-hint">
              Solo aparece lo que <b>se puede vender hoy</b>. Lo que está en construcción
              no se ofrece aquí a propósito: prometerlo es la forma más fácil de quedar mal.
              El Portal y el Simulador van incluidos y no se preguntan.
            </p>
            {ofrecibles.map((c) => {
              // Lo que este producto puede llevar adentro, ya liberado. Sale
              // DEBAJO de su casilla y solo cuando se marca: preguntarlo antes
              // de que elijan el producto no tiene sentido, y ponerlo al final
              // de la lista lo desconecta de lo que se está eligiendo.
              const opcionales = (c.puede_sumar || []).filter((x) => x.liberado);
              const puesto = !!f.piezas[c.clave];
              return (
                <div key={c.clave} className="alta-grupo">
                  <label className={'alta-pieza' + (puesto ? ' is-puesta' : '')}>
                    <input type="checkbox" checked={puesto} onChange={() => togglePieza(c.clave)} />
                    <div>
                      <b>{c.nombre}</b>
                      <span>{c.beneficio || c.descripcion}</span>
                    </div>
                  </label>

                  {puesto && opcionales.length > 0 && (
                    <div className="alta-opciones">
                      <p className="alta-sub">¿Le sumamos alguna de estas?</p>
                      {opcionales.map((x) => (
                        <label key={x.clave} className={'alta-pieza alta-sub-pieza' + (f.piezas[x.clave] ? ' is-puesta' : '')}>
                          <input type="checkbox" checked={!!f.piezas[x.clave]} onChange={() => togglePieza(x.clave)} />
                          <div><b>{x.nombre}</b><span>{x.que_hace}</span></div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        )}

        {pasoActual === 'El agente' && (
          <React.Fragment>
            <h3>¿Cómo tiene que atender?</h3>

            <div className="form-field"><label>cómo habla</label>
              <textarea rows="4" value={f.tono} placeholder={'Cercano y directo, tuteando.\nNada corporativo: nunca «Estimado cliente».'}
                        onChange={(e) => set('tono', e.target.value)} /></div>
            <p className="adm-hint ag-ojo">
              Describe <b>la voz</b>, no la mecánica. No pongas cada cuánto saludar ni
              cuántos emojis por mensaje: de eso se encarga el sistema, igual para todos.
            </p>

            <div className="alta-campos">
              <label className="alta-label">qué datos tiene que averiguar</label>
              <p className="adm-hint">
                Marca los que este negocio necesita. La <b>clave</b> es el nombre con el
                que se guarda el dato — <code>nombre</code> y <code>correo</code> van a su
                columna en la base; los demás quedan en la ficha del contacto.
              </p>
              {f.campos.map((c, i) => (
                <div key={c.clave} className={'alta-campo' + (c.puesto ? ' is-puesto' : '')}>
                  <input type="checkbox" checked={c.puesto} onChange={(e) => setCampo(i, 'puesto', e.target.checked)} />
                  <code>{c.clave}</code>
                  <input type="text" value={c.etiqueta} disabled={!c.puesto}
                         onChange={(e) => setCampo(i, 'etiqueta', e.target.value)} />
                  <label className="ag-check">
                    <input type="checkbox" checked={c.obligatorio} disabled={!c.puesto}
                           onChange={(e) => setCampo(i, 'obligatorio', e.target.checked)} />
                    <span>clave</span>
                  </label>
                </div>
              ))}
              <button type="button" className="ag-mini"
                      onClick={() => setF((d) => ({ ...d, campos: [...d.campos, { clave: '', etiqueta: '', obligatorio: false, puesto: true }] }))}>
                + otro dato
              </button>
            </div>

            <div className="form-field"><label>cuándo pasar a una persona</label>
              <input type="text" value={f.escalar} onChange={(e) => set('escalar', e.target.value)} /></div>

            <div className="form-field"><label>lo que nunca debe hacer — uno por línea</label>
              <textarea rows="3" value={f.nunca} placeholder={'Dar consejo médico.\nPrometer resultados.'}
                        onChange={(e) => set('nunca', e.target.value)} /></div>
            <p className="adm-hint">
              Es lo único que protege al negocio de una respuesta que le cueste un cliente.
              Nadie lo ofrece solo: hay que preguntarlo.
            </p>
          </React.Fragment>
        )}

        {pasoActual === 'Listo' && creada && (
          <React.Fragment>
            <h3>{creada.empresa.name} quedó creada</h3>
            {creada.avisoUsuario && <div className="login-notice error">{creada.avisoUsuario}</div>}
            <p className="alta-ok">
              Ya puede entrar al portal y ve sus productos. <b>Nada está encendido todavía</b>,
              que es como tiene que ser.
            </p>
            <ol className="alta-siguiente">
              <li><b>Cárgale lo que sabe.</b> Sin el documento de precios y horarios, el agente no puede responder nada.</li>
              <li><b>Pruébalo en el simulador.</b> Con preguntas reales, las que su gente hace todos los días.</li>
              <li><b>Cambia la instancia de WhatsApp.</b> Hoy apunta a <code>{creada.instancia}</code>, que no existe — por eso ningún mensaje real le llega. Cambiarla <b>es</b> el go-live.</li>
              <li><b>Enciéndelo.</b> Y recién ahí, no antes.</li>
            </ol>
          </React.Fragment>
        )}

        {err && <div className="login-notice error">{err}</div>}

        <div className="alta-pie">
          {paso > 0 && !creada && (
            <button type="button" className="btn btn-ghost" onClick={() => setPaso(paso - 1)}>← Atrás</button>
          )}
          {creada ? (
            <button type="button" className="btn btn-primary" onClick={() => onListo(creada.empresa)}>
              Ir a su ficha →
            </button>
          ) : paso < pasosVisibles.length - 2 ? (
            <button type="button" className="btn btn-primary" disabled={!puedeSeguir()} onClick={() => setPaso(paso + 1)}>
              Siguiente →
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy || !puedeSeguir()} onClick={crear}>
              {busy ? 'Creando…' : 'Crear el cliente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
