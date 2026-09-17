// ── Cuándo atiendes ─────────────────────────────────────────────────────────
// La pieza que faltaba para que Toque Agenda se pueda entregar sin que nadie
// corra SQL.
//
// Se vendía como listo por $250.000/mes y **no había ninguna pantalla** —ni del
// cliente ni de la consola— que llenara `agenda_franjas`. Solo las pruebas la
// tocaban. Así que un cliente nuevo compraba la agenda, el alta le creaba la
// tarjeta, y la agenda quedaba vacía hasta que alguien entrara a la base a mano.
//
// Y arrastraba todo lo de encima: sin franjas no hay horas libres, sin horas
// libres no hay Toque Rescata, y el aviso diario no tiene nada que decir.
//
// TRES DECISIONES DE LA PANTALLA
//
// 1. Un día puede tener VARIAS franjas. Media jornada del sábado, o cerrar al
//    mediodía, es lo normal en la mayoría de negocios pequeños — no un caso
//    raro. Modelarlo como «una hora de apertura y una de cierre» obliga a
//    mentir o a llamar a soporte.
//
// 2. Se guarda al tocar, sin botón de guardar. Un formulario largo con guardar
//    al final es donde el negocio pierde media hora de trabajo por cerrar la
//    pestaña. A cambio, cada cambio avisa.
//
// 3. Los cupos se explican en sus palabras —«cuánta gente cabe a la vez»— y no
//    como un número técnico. Una peluquería con dos sillas pone 2.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function CuandoAtiendes({ companyId, tieneAgenda, tieneRescata }) {
  const [franjas, setFranjas] = React.useState(null);
  const [servicios, setServicios] = React.useState(null);
  const [bloqueos, setBloqueos] = React.useState(null);
  const [agente, setAgente] = React.useState(null);
  const [rec, setRec] = React.useState(null);
  const [campos, setCampos] = React.useState([]);
  const [resc, setResc] = React.useState({ campo: '', dias: 7 });
  const [aviso, setAviso] = React.useState(null);

  const decir = (t, txt) => { setAviso({ t, txt }); if (t === 'ok') setTimeout(() => setAviso(null), 2500); };

  const cargar = React.useCallback(async () => {
    const [f, s, b, a, c] = await Promise.all([
      sb.from('agenda_franjas').select('*').order('dia').order('desde'),
      sb.from('agenda_servicios').select('*').order('orden').order('nombre'),
      sb.from('agenda_bloqueos').select('*').gte('hasta', new Date().toISOString()).order('desde'),
      sb.from('agent_config').select('id,recordatorios').limit(1),
      sb.from('contact_campos').select('clave,etiqueta,tipo').order('orden'),
    ]);
    setFranjas(f.data || []); setServicios(s.data || []); setBloqueos(b.data || []);
    setCampos(c.data || []);
    const ag = (a.data || [])[0];
    setAgente(ag || null);
    if (ag) {
      const { data } = await sb.rpc('tf_mi_recordatorio', { p_agent: ag.id });
      setRec(data || { horas_antes: 24, pedir_confirmacion: true, desde: '08:00', hasta: '20:00' });
    }
  }, []);

  React.useEffect(() => {
    cargar();
    // Qué campo guarda la fecha de la propuesta vive en la empresa, no en el agente.
    sb.from('companies').select('metadata').eq('id', companyId).single()
      .then(({ data }) => {
        const r = (data && data.metadata && data.metadata.rescate) || {};
        setResc({ campo: r.campo_fecha_propuesta || '', dias: r.dias || 7 });
      });
  }, [cargar, companyId]);

  if (!tieneAgenda) return null;
  if (franjas === null) return null;

  // ── Franjas ───────────────────────────────────────────────────────────────
  const agregarFranja = async (dia) => {
    // Se propone la jornada más común. Empezar de un campo vacío obliga a
    // teclear lo mismo siete veces.
    const { error } = await sb.from('agenda_franjas')
      .insert({ company_id: companyId, dia, desde: '09:00', hasta: '18:00', cupos: 1, activa: true });
    if (error) return decir('error', 'No se pudo: ' + error.message);
    decir('ok', 'Listo'); cargar();
  };
  const tocarFranja = async (id, campo, valor) => {
    const { error } = await sb.from('agenda_franjas').update({ [campo]: valor }).eq('id', id);
    if (error) return decir('error', 'No se pudo: ' + error.message);
    decir('ok', 'Guardado'); cargar();
  };
  const quitarFranja = async (id) => {
    const { error } = await sb.from('agenda_franjas').delete().eq('id', id);
    if (error) return decir('error', 'No se pudo: ' + error.message);
    decir('ok', 'Quitado'); cargar();
  };

  // ── Servicios ─────────────────────────────────────────────────────────────
  const agregarServicio = async () => {
    const { error } = await sb.from('agenda_servicios')
      .insert({ company_id: companyId, nombre: 'Nuevo servicio', minutos: 60, ocupa: 1, activo: true, orden: 100 });
    if (error) return decir('error', 'No se pudo: ' + error.message);
    cargar();
  };
  const tocarServicio = async (id, campo, valor) => {
    const { error } = await sb.from('agenda_servicios').update({ [campo]: valor }).eq('id', id);
    if (error) return decir('error', 'No se pudo: ' + error.message);
    decir('ok', 'Guardado'); cargar();
  };
  const quitarServicio = async (id) => {
    const { error } = await sb.from('agenda_servicios').delete().eq('id', id);
    if (error) return decir('error', 'No se pudo: ' + error.message);
    cargar();
  };

  // ── Bloqueos ──────────────────────────────────────────────────────────────
  const agregarBloqueo = async (desde, hasta, motivo) => {
    if (!desde || !hasta) return decir('error', 'Falta la fecha de inicio o la de fin.');
    if (new Date(hasta) <= new Date(desde)) return decir('error', 'El fin tiene que ser después del inicio.');
    const { error } = await sb.from('agenda_bloqueos')
      .insert({ company_id: companyId, desde, hasta, motivo: motivo || null });
    if (error) return decir('error', 'No se pudo: ' + error.message);
    decir('ok', 'Bloqueado'); cargar();
  };

  // ── Recordatorio ──────────────────────────────────────────────────────────
  const guardarRec = async (cambios) => {
    const n = Object.assign({}, rec, cambios);
    setRec(n);
    const { data, error } = await sb.rpc('tf_agente_recordatorios', {
      p_agent: agente.id, p_horas_antes: n.horas_antes,
      p_pedir_confirmacion: n.pedir_confirmacion, p_desde: n.desde, p_hasta: n.hasta,
    });
    if (error || (data && data.ok === false)) {
      decir('error', error ? error.message : data.motivo);
      cargar();
      return;
    }
    decir('ok', 'Guardado');
  };

  // ── El campo de la propuesta ──────────────────────────────────────────────
  const guardarResc = async (cambios) => {
    const n = Object.assign({}, resc, cambios);
    setResc(n);
    const { data, error } = await sb.rpc('tf_rescate_config', {
      p_company: companyId, p_campo_fecha: n.campo || null, p_dias: Number(n.dias) || 7,
    });
    if (error || (data && data.ok === false)) return decir('error', error ? error.message : data.motivo);
    decir('ok', 'Guardado');
  };

  const porDia = (d) => franjas.filter((f) => f.dia === d);
  const abiertos = franjas.filter((f) => f.activa).length;

  return (
    <section className="dash-section">
      <div className="dash-section-h">
        <h2>Cuándo atiendes</h2>
        <p>
          De esto salen las horas que tu asistente ofrece. Mientras esté vacío no
          puede agendar nada — no porque falle, sino porque no sabe cuándo abres.
        </p>
      </div>

      {aviso && (
        <div className={'ag-aviso ' + aviso.t}>{aviso.txt}</div>
      )}

      {abiertos === 0 && (
        <div className="ag-vacio">
          Todavía no has dicho a qué horas abres. Agrega al menos un día para que
          tu asistente pueda empezar a agendar.
        </div>
      )}

      {/* ── Horarios ─────────────────────────────────────────────────────── */}
      <div className="ag-bloque">
        <h3>Tus horarios</h3>
        <p className="ag-nota">
          Puedes poner más de un tramo en el mismo día: por ejemplo de 9 a 13 y de
          15 a 19 si cierras al mediodía.
        </p>
        <div className="ag-dias">
          {DIAS.map((nombre, d) => (
            <div className={'ag-dia' + (porDia(d).length ? '' : ' cerrado')} key={d}>
              <div className="ag-dia-h">
                <b>{nombre}</b>
                <button className="ag-mini" onClick={() => agregarFranja(d)}>+ tramo</button>
              </div>
              {porDia(d).length === 0
                ? <span className="ag-cerrado">cerrado</span>
                : porDia(d).map((f) => (
                    <div className="ag-franja" key={f.id}>
                      <input type="time" value={String(f.desde).slice(0, 5)}
                             onChange={(e) => tocarFranja(f.id, 'desde', e.target.value)} />
                      <span>a</span>
                      <input type="time" value={String(f.hasta).slice(0, 5)}
                             onChange={(e) => tocarFranja(f.id, 'hasta', e.target.value)} />
                      <label className="ag-cupos" title="Cuánta gente cabe a la vez en ese horario">
                        <input type="number" min="1" max="99" value={f.cupos}
                               onChange={(e) => tocarFranja(f.id, 'cupos', Math.max(1, +e.target.value || 1))} />
                        <span>a la vez</span>
                      </label>
                      <button className="ag-quitar" onClick={() => quitarFranja(f.id)} title="Quitar este tramo">×</button>
                    </div>
                  ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Servicios ────────────────────────────────────────────────────── */}
      <div className="ag-bloque">
        <h3>Qué se puede agendar</h3>
        <p className="ag-nota">
          El nombre lo pones tú, con las palabras de tu negocio: corte, valoración,
          masaje, revisión. La duración es la que tu asistente reserva.
        </p>
        {(servicios || []).length === 0 && (
          <div className="ag-vacio">
            Sin servicios, tu asistente no sabe cuánto dura una cita. Agrega al menos uno.
          </div>
        )}
        <div className="ag-servicios">
          {(servicios || []).map((s) => (
            <div className="ag-servicio" key={s.id}>
              <input type="text" value={s.nombre} placeholder="Nombre del servicio"
                     onChange={(e) => setServicios(servicios.map((x) => x.id === s.id ? { ...x, nombre: e.target.value } : x))}
                     onBlur={(e) => tocarServicio(s.id, 'nombre', e.target.value.trim() || 'Sin nombre')} />
              <label className="ag-min">
                <input type="number" min="5" max="600" step="5" value={s.minutos}
                       onChange={(e) => tocarServicio(s.id, 'minutos', Math.min(600, Math.max(5, +e.target.value || 60)))} />
                <span>minutos</span>
              </label>
              <button className="ag-quitar" onClick={() => quitarServicio(s.id)} title="Quitar">×</button>
            </div>
          ))}
        </div>
        <button className="ag-mini" onClick={agregarServicio}>+ servicio</button>
      </div>

      {/* ── Bloqueos ─────────────────────────────────────────────────────── */}
      <div className="ag-bloque">
        <h3>Días que no atiendes</h3>
        <p className="ag-nota">
          Festivos, vacaciones, un cierre por obra. Tu asistente deja de ofrecer esas
          horas sin que tengas que cambiar tu horario.
        </p>
        <BloqueoNuevo onAgregar={agregarBloqueo} />
        <div className="ag-bloqueos">
          {(bloqueos || []).length === 0
            ? <span className="ag-nota">Nada bloqueado por ahora.</span>
            : bloqueos.map((b) => (
                <div className="ag-bloqueo" key={b.id}>
                  <b>{String(b.desde).slice(0, 10)} → {String(b.hasta).slice(0, 10)}</b>
                  <span>{b.motivo || 'sin motivo'}</span>
                  <button className="ag-quitar" title="Quitar"
                          onClick={async () => { await sb.from('agenda_bloqueos').delete().eq('id', b.id); cargar(); }}>×</button>
                </div>
              ))}
        </div>
      </div>

      {/* ── Recordatorio ─────────────────────────────────────────────────── */}
      {rec && agente && (
        <div className="ag-bloque">
          <h3>El recordatorio</h3>
          <p className="ag-nota">
            Cuánto antes le escribes a quien tiene cita. Veinticuatro horas es lo que
            mejor funciona: da tiempo a reorganizarse y no tanto como para olvidarlo otra vez.
          </p>
          <div className="ag-rec">
            <label>
              <span>Avisar</span>
              <input type="number" min="1" max="168" value={rec.horas_antes}
                     onChange={(e) => guardarRec({ horas_antes: Math.min(168, Math.max(1, +e.target.value || 24)) })} />
              <span>horas antes</span>
            </label>
            <label>
              <span>Solo entre</span>
              <input type="time" value={rec.desde} onChange={(e) => guardarRec({ desde: e.target.value })} />
              <span>y</span>
              <input type="time" value={rec.hasta} onChange={(e) => guardarRec({ hasta: e.target.value })} />
            </label>
            <label className="ag-check">
              <input type="checkbox" checked={!!rec.pedir_confirmacion}
                     onChange={(e) => guardarRec({ pedir_confirmacion: e.target.checked })} />
              <span>Pedirle que confirme — si dice que no, la hora se libera sola</span>
            </label>
          </div>
        </div>
      )}

      {/* ── El campo de la propuesta (solo si tiene Rescata) ─────────────── */}
      {tieneRescata && (
        <div className="ag-bloque">
          <h3>Tus propuestas</h3>
          <p className="ag-nota">
            Para avisarte de las que llevan días sin respuesta hay que saber dónde
            guardas la fecha. Es un dato tuyo, y cada negocio lo llama distinto:
            presupuesto, cotización, propuesta.
          </p>
          {campos.filter((c) => c.tipo === 'fecha').length === 0 ? (
            <div className="ag-vacio">
              No tienes ningún dato de tipo fecha. Créalo en{' '}
              <a href="contactos.html">tu base de contactos</a> y vuelve aquí.
            </div>
          ) : (
            <div className="ag-rec">
              <label>
                <span>La fecha está en</span>
                <select value={resc.campo} onChange={(e) => guardarResc({ campo: e.target.value })}>
                  <option value="">— ninguno —</option>
                  {campos.filter((c) => c.tipo === 'fecha').map((c) => (
                    <option key={c.clave} value={c.clave}>{c.etiqueta || c.clave}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Avisarme si lleva más de</span>
                <input type="number" min="1" max="365" value={resc.dias}
                       onChange={(e) => guardarResc({ dias: Math.max(1, +e.target.value || 7) })} />
                <span>días sin respuesta</span>
              </label>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// Un bloqueo se arma entero antes de guardarse: media fecha guardada dejaría a
// la agenda cerrada desde una fecha hasta nunca.
function BloqueoNuevo({ onAgregar }) {
  const [d, setD] = React.useState('');
  const [h, setH] = React.useState('');
  const [m, setM] = React.useState('');
  return (
    <div className="ag-bloqueo-nuevo">
      <input type="date" value={d} onChange={(e) => setD(e.target.value)} />
      <span>a</span>
      <input type="date" value={h} onChange={(e) => setH(e.target.value)} />
      <input type="text" value={m} placeholder="motivo (opcional)" onChange={(e) => setM(e.target.value)} />
      <button className="ag-mini" onClick={() => {
        // Hasta el final del último día, no hasta su medianoche: «del 24 al 25»
        // tiene que cerrar el 25 entero.
        if (!d || !h) return onAgregar(null, null);
        onAgregar(d + 'T00:00:00', h + 'T23:59:59', m.trim());
        setD(''); setH(''); setM('');
      }}>Bloquear</button>
    </div>
  );
}
