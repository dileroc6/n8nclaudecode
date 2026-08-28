/* ============================================================================
 * Consola de ToqueFlow — la ficha de una empresa
 * ----------------------------------------------------------------------------
 * Se ENTRA a un cliente y se ve todo lo suyo. No es un modal: reemplaza la
 * pantalla, con su propio «volver». Un popup sirve para confirmar algo; para
 * revisar a un cliente uno quiere entrar, no asomarse.
 *
 * El orden mental es: empresa → sus productos → el detalle de cada uno.
 * Un agente no es una categoría aparte: es la configuración de UN producto.
 *
 * Sobre los dos estados que se ven aquí, que son EJES DISTINTOS:
 *   la pieza      qué tan construida está    funciona · a medias · en el papel
 *   este cliente  si la tiene encendida      encendido · sin encender · no
 * Mezclarlos fue un error: «próximamente» parecía decir algo del producto
 * cuando solo decía que a ESE cliente se lo anunciaron y no está prendido.
 * ========================================================================== */

// Qué producto abre qué pantallas. Un producto nuevo trae las suyas agregando
// su clave aquí: no hay que tocar esta pantalla.
const EMP_CONFIGURABLES = {
  'agente-atencion': [
    ['agente',       'Configurar',   'tono, qué capturar, cuándo escalar'],
    ['conocimiento', 'Conocimiento', 'lo que sabe responder'],
  ],
};

const EMP_MADUREZ = {
  funcionando: ['funciona', 'ok'],
  a_medias:    ['a medias', 'medio'],
  en_papel:    ['en el papel', 'papel'],
};

const EMP_MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const empMes = (d) => { const x = new Date(d + 'T00:00:00'); return EMP_MES[x.getMonth()] + ' ' + String(x.getFullYear()).slice(2); };
// A 4.200 pesos por dólar. Es una referencia para dimensionar, no contabilidad:
// sirve para ver si la IA se está comiendo el margen, no para facturar.
const COP_POR_USD = 4200;

function EmpresaVista({ company, catalogo, matriz, usuarios, consumo, consumoDet, consumoPlan, runtime, resumen,
                        onConfig, onConocimiento, onCambiar, onVolver, busy }) {
  const [abierto, setAbierto] = React.useState(null);
  // null = todos los meses. Se elige uno pulsando su barra.
  const [mesElegido, setMesElegido] = React.useState(null);
  const [mostrarResto, setMostrarResto] = React.useState(false);

  const mias = matriz.filter((m) => m.company_id === company.id);
  // Los encendidos arriba: es lo que está pasando ahora. Los apagados debajo,
  // porque son cosas que el cliente TIENE y no están andando — eso siempre
  // tiene un motivo y alguien debería saber cuál.
  const tiene = mias.filter((m) => m.estado_empresa !== 'no')
    .sort((a, b) => (a.estado_empresa === b.estado_empresa ? a.orden - b.orden
                     : a.estado_empresa === 'activo' ? -1 : 1));
  const encendidos = tiene.filter((m) => m.estado_empresa === 'activo');
  const apagados   = tiene.filter((m) => m.estado_empresa !== 'activo');
  const noTiene = mias.filter((m) => m.estado_empresa === 'no' && m.tipo !== 'herramienta' && m.vendible)
                      .sort((a, b) => a.orden - b.orden);

  const r  = resumen.find((x) => x.company_id === company.id) || {};
  // Todos los agentes de esta empresa, no «el» agente. Una empresa puede
  // tener uno por sede o por línea de negocio.
  const agentes = runtime.filter((x) => x.company_id === company.id)
                         .sort((a, b) => String(a.agente).localeCompare(String(b.agente)));
  const ag = agentes[0];
  const misUsuarios = usuarios.filter((u) => u.company_id === company.id);

  // Las piezas se pasan al cambiar de estado con la forma que espera el
  // insert: la matriz trae el id del catálogo, no el objeto entero.
  const comoPieza = (p) => ({
    id: p.catalogo_id, clave: p.clave, nombre: p.nombre,
    tipo: p.tipo, beneficio: p.beneficio, descripcion: p.descripcion,
  });

  return (
    <div className="emp-vista">

      <div className="emp-cabeza">
        <button type="button" className="emp-volver" onClick={onVolver}>← Empresas</button>
        <h2>{company.name}</h2>
        <span className={`flow-status ${company.status === 'active' ? 'on' : 'off'}`}>
          <span className="flow-status-dot"></span>{company.status === 'active' ? 'activa' : 'pausada'}
        </span>
        <a className="ag-mini emp-ir" href={'dashboard.html?empresa=' + company.id}>ver su panel →</a>
      </div>

      <div className="emp-resumen">
        <div><b>{r.usuarios ?? 0}</b><span>usuarios</span></div>
        <div><b>{r.productos_activos ?? 0}</b><span>productos encendidos</span></div>
        <div><b>{r.productos_proximamente ?? 0}</b><span>sin encender</span></div>
        <div><b>${Number(r.ia_usd_mes ?? 0).toFixed(2)}</b><span>IA este mes</span></div>
        <div><b>${Number(r.ia_usd ?? 0).toFixed(2)}</b><span>IA acumulada</span></div>
      </div>

      {/* ── Sus productos ─────────────────────────────────────────────── */}
      <section className="emp-seccion">
        <h3 className="emp-titulo">
          Lo que tiene contratado
          <em>{encendidos.length} andando{apagados.length ? ' · ' + apagados.length + ' sin encender' : ''}</em>
        </h3>
        {apagados.length > 0 && (
          <p className="emp-nota">
            Lo de abajo es algo que este cliente <b>ya tiene contratado</b> y no está
            funcionando. Son dos situaciones distintas y el cliente las ve escritas
            distinto en su panel:{' '}
            <b>sin encender</b> es que nunca se ha prendido —falta configurarlo,
            probarlo o el go-live— y él lee «próximamente».{' '}
            <b>Desactivado</b> es que estuvo andando y se apagó, y él lee eso mismo.
            Decirle «próximamente» a algo que se le apagó sería tomarle el pelo.
          </p>
        )}
        {tiene.length === 0 && <div className="ag-lista-vacia">Todavía no tiene nada contratado.</div>}

        {tiene.map((p) => {
          const esta = abierto === p.catalogo_id;
          const encendido = p.estado_empresa === 'activo';
          return (
            <article key={p.catalogo_id} className={'emp-item' + (encendido ? '' : ' is-apagado')}>
              <button type="button" className="emp-item-cabeza" onClick={() => setAbierto(esta ? null : p.catalogo_id)}>
                <span className={'emp-luz ' + (encendido ? 'on' : 'off')}></span>
                <span className="emp-item-n">
                  {p.nombre}
                  {p.veces > 1 && <i className="emp-sedes">{p.veces} sedes</i>}
                  {!p.vendible && <i className="emp-sedes">viene con la plataforma</i>}
                </span>
                <span className={'emp-estado e-' + p.estado_empresa}>
                  {encendido ? 'encendido'
                    : p.estado_empresa === 'desactivado' ? 'desactivado'
                    : 'sin encender'}
                </span>
                <span className="emp-chevron">{esta ? '−' : '+'}</span>
              </button>

              {esta && (
                <div className="emp-item-cuerpo">
                  <p className="emp-item-d">{p.beneficio || p.descripcion}</p>

                  <dl className="emp-datos">
                    <div><dt>la pieza</dt><dd>
                      <i className={'cat-estado e-' + EMP_MADUREZ[p.estado_pieza][1]}>{EMP_MADUREZ[p.estado_pieza][0]}</i>
                    </dd></div>
                    <div><dt>en su panel</dt><dd>
                      {encendido ? 'la ve y la usa'
                        : p.estado_empresa === 'desactivado' ? 'la ve como «desactivado»'
                        : 'la ve como «próximamente»'}
                    </dd></div>
                    {p.nombres_para_el_cliente && (
                      <div><dt>{p.veces > 1 ? 'tarjetas' : 'tarjeta'}</dt><dd>{p.nombres_para_el_cliente.join(' · ')}</dd></div>
                    )}
                    {p.clave === 'agente-atencion' && (
                      <div><dt>agentes</dt><dd>{agentes.length || 'ninguno todavía'}</dd></div>
                    )}
                  </dl>

                  {p.clave === 'agente-atencion' && (
                    <div className="emp-agentes">
                      {agentes.map((a) => (
                        <div key={a.agent_id} className="emp-agente">
                          <span className={'emp-luz ' + (a.activo ? 'on' : 'off')}></span>
                          <div>
                            <b>{a.agente}</b>
                            <span>
                              {a.whatsapp_instance || 'sin instancia'} ·{' '}
                              {a.conocimiento_fuentes} documentos ·{' '}
                              {Math.round(a.conocimiento_bytes / 1024 * 10) / 10} KB ·{' '}
                              {a.activo ? 'respondiendo' : 'apagado'}
                            </span>
                          </div>
                          <button type="button" className="ag-mini" onClick={() => onConfig(company, a)}>configurar</button>
                          <button type="button" className="ag-mini" onClick={() => onConocimiento(company, a)}>conocimiento</button>
                        </div>
                      ))}
                      <button type="button" className="ag-mini" onClick={() => onConfig(company, null)}>
                        + otro agente
                      </button>
                      {agentes.length > 1 && (
                        <p className="emp-nota">
                          Cada agente tiene su propio número de WhatsApp y su propio tono.
                          El conocimiento se comparte salvo lo que se cargue solo para uno.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="emp-cambiar">
                    <button type="button" className="ag-mini" disabled={busy}
                            onClick={() => onCambiar(company, comoPieza(p), encendido ? 'desactivado' : 'activo')}>
                      {encendido ? 'apagar' : 'encender'}
                    </button>
                    <button type="button" className="ag-mini danger" disabled={busy}
                            onClick={() => onCambiar(company, comoPieza(p), 'no')}>
                      quitárselo
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* ── Lo que se le podría vender ────────────────────────────────── */}
      <section className="emp-seccion">
        <button type="button" className={'emp-sugerencias' + (mostrarResto ? ' is-abierta' : '')}
                onClick={() => setMostrarResto(!mostrarResto)}>
          <span>
            <b>Lo que le podrías vender</b>
            <em>{noTiene.length} piezas del catálogo que este cliente todavía no tiene</em>
          </span>
          <i>{mostrarResto ? '−' : '+'}</i>
        </button>
        {mostrarResto && (
          <div className="emp-resto">
            {noTiene.map((p) => (
              <div key={p.catalogo_id} className="emp-resto-fila">
                <div>
                  <b>{p.nombre}</b>
                  <i className={'cat-estado e-' + EMP_MADUREZ[p.estado_pieza][1]}>{EMP_MADUREZ[p.estado_pieza][0]}</i>
                  <span>{p.beneficio || p.descripcion}</span>
                </div>
                <button type="button" className="ag-mini" disabled={busy}
                        onClick={() => onCambiar(company, comoPieza(p), 'proximamente')}>
                  activar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Su consumo de IA ──────────────────────────────────────────── */}
      {(() => {
        const mio = consumoDet.filter((x) => x.company_id === company.id);
        const plan = consumoPlan.find((x) => x.company_id === company.id) || {};
        if (!mio.length) return (
          <section className="emp-seccion">
            <h3 className="emp-titulo">Consumo de IA</h3>
            <div className="ag-lista-vacia">Todavía no ha consumido nada. Nada que cobrar y nada de qué preocuparse.</div>
          </section>
        );

        const mes = Number(plan.usd_mes || 0), anterior = Number(plan.usd_mes_anterior || 0);
        const delta = anterior > 0 ? Math.round(((mes - anterior) / anterior) * 100) : null;
        const mensualidad = Number(plan.mensualidad_cop || 0);
        const pctPlan = mensualidad > 0 ? (mes * COP_POR_USD / mensualidad) * 100 : null;

        // Por producto. Si hay un mes elegido, solo ese: la pregunta «¿por
        // qué subió en agosto?» no se puede responder con el acumulado.
        const delMes = mesElegido ? mio.filter((x) => x.mes === mesElegido) : mio;
        const porProducto = {};
        for (const x of delMes) {
          const k = x.producto;
          if (!porProducto[k]) porProducto[k] = { producto: k, llamadas: 0, usd: 0, unit: 0 };
          porProducto[k].llamadas += x.llamadas;
          porProducto[k].usd += Number(x.usd);
          porProducto[k].unit = Number(x.usd_por_llamada);
        }
        const productos = Object.values(porProducto).sort((a, b) => b.usd - a.usd);

        const meses = [...new Set(mio.map((x) => x.mes))].sort().slice(-6);
        const porMes = meses.map((m) => ({
          mes: m,
          usd: mio.filter((x) => x.mes === m).reduce((a, x) => a + Number(x.usd), 0),
        }));
        const tope = Math.max(...porMes.map((x) => x.usd), 0.0001);

        return (
          <section className="emp-seccion">
            <h3 className="emp-titulo">Consumo de IA <em>lo que cuesta atender a este cliente</em></h3>

            <div className="con-cabeza">
              <div className="con-dato">
                <b>${mes.toFixed(2)}</b><span>este mes</span>
                {delta !== null && (
                  <i className={delta > 15 ? 'sube' : delta < -15 ? 'baja' : 'igual'}>
                    {delta > 0 ? '+' : ''}{delta}% contra el mes pasado
                  </i>
                )}
              </div>

              <div className="con-dato">
                <b>${Number(plan.usd_total || 0).toFixed(2)}</b><span>desde el principio</span>
                {plan.primer_consumo && (
                  <i className="igual">desde {empMes(String(plan.primer_consumo).slice(0, 10))}</i>
                )}
              </div>

              {/* La pregunta que de verdad importa: cuánto de lo que paga se
                  está yendo en IA. Sin la mensualidad cargada no se puede
                  calcular, y la pantalla lo dice en vez de inventar un número. */}
              <div className="con-dato">
                {pctPlan !== null ? (
                  <React.Fragment>
                    <b className={pctPlan > 25 ? 'alerta' : ''}>{pctPlan.toFixed(1)}%</b>
                    <span>de lo que paga</span>
                    <i className={pctPlan > 25 ? 'sube' : 'igual'}>
                      {pctPlan > 25
                        ? 'se está comiendo el margen'
                        : 'sobre ' + mensualidad.toLocaleString('es-CO') + ' COP/mes'}
                    </i>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <b className="sindato">—</b>
                    <span>de lo que paga</span>
                    <i className="igual">no sabemos cuánto paga</i>
                  </React.Fragment>
                )}
              </div>
            </div>

            <div className="con-meses">
              {porMes.map((m) => (
                <button key={m.mes} type="button"
                        className={'con-mes' + (mesElegido === m.mes ? ' is-elegido' : '')}
                        title={'Ver solo ' + empMes(m.mes)}
                        onClick={() => setMesElegido(mesElegido === m.mes ? null : m.mes)}>
                  <div className="con-barra"><i style={{ height: Math.max(3, (m.usd / tope) * 100) + '%' }} /></div>
                  <b>${m.usd.toFixed(2)}</b>
                  <span>{empMes(m.mes)}</span>
                </button>
              ))}
              {mesElegido && (
                <button type="button" className="con-todos" onClick={() => setMesElegido(null)}>
                  ver<br />todos
                </button>
              )}
            </div>

            <p className="con-cual">
              {mesElegido ? 'Solo ' + empMes(mesElegido) : 'Todos los meses'} · por producto
            </p>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Producto</th><th>Llamadas</th><th>Costo</th><th>Por llamada</th></tr></thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.producto}>
                      <td><b>{p.producto}</b></td>
                      <td className="admin-dim">{p.llamadas.toLocaleString('es-CO')}</td>
                      <td>${p.usd.toFixed(2)}</td>
                      <td className="admin-dim">${p.unit.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="emp-nota">
              El <b>costo por llamada</b> es el que avisa de un prompt que engordó sin que
              nadie se diera cuenta: el total puede subir por volumen, este no.
            </p>
          </section>
        );
      })()}

      {/* ── Sus usuarios ──────────────────────────────────────────────── */}
      <section className="emp-seccion">
        <h3 className="emp-titulo">Sus usuarios <em>{misUsuarios.length} con acceso al portal</em></h3>
        {misUsuarios.length === 0 && <div className="ag-lista-vacia">Sin usuarios todavía.</div>}
        {misUsuarios.map((u) => (
          <div key={u.id} className="emp-usuario">
            <span className="dash-avatar sm">{initials(u.full_name || u.email)}</span>
            <div><b>{u.full_name || '—'}</b><span>{u.email}</span></div>
            <span className={`flow-status ${u.status === 'active' ? 'on' : 'off'}`}>
              <span className="flow-status-dot"></span>{u.status === 'active' ? 'activo' : 'inactivo'}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
