// ── Cómo te pagan ───────────────────────────────────────────────────────────
// La pasarela de cada negocio, configurable desde su portal.
//
// Antes había UNA para toda la plataforma: las llaves de ePayco de Bejauha
// vivían como secretos globales de la edge function. Funciona con un cliente y
// se rompe con dos — el segundo negocio que cobrara estaría cobrando a la
// cuenta del primero.
//
// TRES DECISIONES DE ESTA PANTALLA
//
// 1. La lista sale de la BASE, no de aquí. `pasarelas_soportadas` dice qué
//    pasarelas hay y qué campos pide cada una, así que sumar una es una fila y
//    no un cambio de código. El formulario se arma solo.
//
// 2. Lo secreto se muestra TAPADO —«····4821»— y nunca se devuelve entero. Una
//    llave privada que se puede leer de vuelta viaja en cada carga de la
//    pantalla y sale en cualquier captura que el cliente mande pidiendo ayuda.
//
// 3. Un campo que se deja en blanco NO borra lo que había. Es la consecuencia
//    directa de lo anterior: como la pantalla nunca te devuelve tu llave
//    secreta, si el blanco borrara, entrar a cambiar el link de pago te dejaría
//    sin poder cobrar.
//
// Y arriba de todo va la opción que más se usa y que no cuesta comisión:
// transferencia, Nequi o Daviplata. Enseñar primero las pasarelas de verdad
// haría creer que hace falta una para empezar a vender.

function ComoTePagan({ companyId, tieneTienda }) {
  const [soportadas, setSoportadas] = React.useState(null);
  const [proveedor, setProveedor] = React.useState('');
  const [valores, setValores] = React.useState({});
  const [puestas, setPuestas] = React.useState({});   // lo que ya hay, tapado
  const [guardado, setGuardado] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [aviso, setAviso] = React.useState(null);

  const decir = (t, txt) => { setAviso({ t, txt }); if (t === 'ok') setTimeout(() => setAviso(null), 4000); };

  const cargar = React.useCallback(async () => {
    const [{ data: lista }, { data: mia }] = await Promise.all([
      sb.from('pasarelas_soportadas').select('*').eq('activa', true).order('orden'),
      sb.rpc('tf_pasarela_ver', { p_company: companyId }),
    ]);
    setSoportadas(lista || []);
    if (mia && mia.ok && mia.proveedor) {
      setProveedor(mia.proveedor);
      setPuestas(mia.llaves || {});
      setGuardado(mia);
    }
  }, [companyId]);

  React.useEffect(() => { cargar(); }, [cargar]);

  if (!tieneTienda) return null;
  if (soportadas === null) return null;

  const def = soportadas.find((p) => p.clave === proveedor);

  const guardar = async () => {
    if (!proveedor) { decir('error', 'Elige primero cómo te pagan.'); return; }
    setBusy(true);
    const { data, error } = await sb.rpc('tf_pasarela_guardar', {
      p_company: companyId, p_proveedor: proveedor, p_llaves: valores,
    });
    setBusy(false);
    if (error || (data && data.ok === false)) {
      decir('error', error ? error.message : data.motivo);
      return;
    }
    // Se dice qué falta, pero no se bloquea: un negocio puede dejarlo a medias
    // y volver mañana con la llave que le falta.
    const faltan = (data.faltan || []);
    decir(faltan.length ? 'ojo' : 'ok',
      faltan.length
        ? 'Guardado, pero todavía no puedes cobrar: falta ' + faltan.join(', ') + '.'
        : 'Guardado. Ya puedes cobrar con ' + (def ? def.nombre : proveedor) + '.');
    setValores({});
    cargar();
  };

  const quitar = async () => {
    setBusy(true);
    await sb.rpc('tf_pasarela_quitar', { p_company: companyId });
    setBusy(false);
    setProveedor(''); setValores({}); setPuestas({}); setGuardado(null);
    decir('ok', 'Quitada. Tu asistente vuelve a pedir el pago como antes.');
  };

  return (
    <section className="dash-section">
      <div className="dash-section-h">
        <h2>Cómo te pagan</h2>
        <p>
          Con esto tu asistente sabe qué decirle a quien quiere pagar. Mientras no
          lo configures, deja anotado que la persona dice que pagó y alguien lo
          verifica a mano — que también es una forma de trabajar.
        </p>
      </div>

      {aviso && <div className={'ag-aviso ' + aviso.t}>{aviso.txt}</div>}

      <div className="ag-bloque">
        <div className="form-field">
          <label>¿cómo te pagan hoy?</label>
          <select value={proveedor} onChange={(e) => { setProveedor(e.target.value); setValores({}); }}>
            <option value="">— elige —</option>
            {soportadas.map((p) => (
              <option key={p.clave} value={p.clave}>
                {p.nombre}{p.pais && p.pais !== 'CO' ? ' · ' + p.pais : ''}
              </option>
            ))}
          </select>
        </div>

        {def && def.nota && <p className="ag-nota">{def.nota}</p>}

        {def && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {(def.campos || []).map((c) => {
              const yaHay = puestas[c.campo];
              return (
                <div className="form-field" key={c.campo} style={{ margin: 0 }}>
                  <label>{c.etiqueta}</label>
                  {c.campo === 'instrucciones' ? (
                    <textarea rows="3"
                      placeholder={'Ej. Consigna a Nequi 300 123 4567 a nombre de…\ny mándanos el comprobante por aquí.'}
                      value={valores[c.campo] != null ? valores[c.campo] : (yaHay || '')}
                      onChange={(e) => setValores({ ...valores, [c.campo]: e.target.value })} />
                  ) : (
                    <input type="text"
                      placeholder={yaHay ? 'Ya tienes una puesta: ' + yaHay : (c.secreto ? 'pégala aquí' : '')}
                      value={valores[c.campo] != null ? valores[c.campo]
                             : (c.secreto ? '' : (yaHay || ''))}
                      onChange={(e) => setValores({ ...valores, [c.campo]: e.target.value })} />
                  )}
                  {c.secreto && yaHay && (
                    <p className="adm-hint">
                      Guardada y tapada a propósito: no te la mostramos de vuelta ni a ti.
                      Déjala en blanco para conservarla, o pega una nueva para reemplazarla.
                    </p>
                  )}
                </div>
              );
            })}

            {def.ayuda_url && (
              <p className="ag-nota">
                ¿No sabes dónde están estas llaves?{' '}
                <a href={def.ayuda_url} target="_blank" rel="noopener noreferrer">
                  Guía de {def.nombre} →
                </a>
              </p>
            )}

            <div className="fila-btn" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={guardar} disabled={busy}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
              {guardado && guardado.proveedor && (
                <button className="btn" onClick={quitar} disabled={busy}>Quitarla</button>
              )}
            </div>
          </div>
        )}

        {guardado && guardado.proveedor && (
          <p className="ag-nota" style={{ marginTop: 10 }}>
            Guardada el {String(guardado.actualizado_at || '').slice(0, 10)}.
            Tus llaves no salen del servidor: esta pantalla nunca las recibe enteras.
          </p>
        )}
      </div>
    </section>
  );
}
