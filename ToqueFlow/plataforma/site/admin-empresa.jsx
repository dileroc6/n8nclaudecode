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

function EmpresaVista({ company, catalogo, matriz, usuarios, consumo, runtime, resumen,
                        onConfig, onConocimiento, onCambiar, onVolver, busy }) {
  const [abierto, setAbierto] = React.useState(null);
  const [mostrarResto, setMostrarResto] = React.useState(false);

  const mias = matriz.filter((m) => m.company_id === company.id);
  const tiene   = mias.filter((m) => m.estado_empresa !== 'no').sort((a, b) => a.orden - b.orden);
  const noTiene = mias.filter((m) => m.estado_empresa === 'no' && m.tipo !== 'herramienta' && m.vendible)
                      .sort((a, b) => a.orden - b.orden);

  const r  = resumen.find((x) => x.company_id === company.id) || {};
  const ag = runtime.find((x) => x.company_id === company.id);
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
        <h3>Sus productos</h3>
        {tiene.length === 0 && <div className="ag-lista-vacia">Todavía no tiene nada. Actívale algo abajo.</div>}

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
                <span className={'emp-estado e-' + (encendido ? 'activo' : 'apagado')}>
                  {encendido ? 'encendido' : 'sin encender'}
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
                    <div><dt>en su panel</dt><dd>{encendido ? 'la ve y la usa' : 'la ve como «próximamente»'}</dd></div>
                    {p.nombres_para_el_cliente && (
                      <div><dt>{p.veces > 1 ? 'tarjetas' : 'tarjeta'}</dt><dd>{p.nombres_para_el_cliente.join(' · ')}</dd></div>
                    )}
                    {p.clave === 'agente-atencion' && ag && (
                      <React.Fragment>
                        <div><dt>instancia</dt><dd>{ag.whatsapp_instance || '—'}</dd></div>
                        <div><dt>conocimiento</dt><dd>{ag.conocimiento_fuentes} documentos · {Math.round(ag.conocimiento_bytes / 1024 * 10) / 10} KB</dd></div>
                        <div><dt>el agente</dt><dd>{ag.activo ? 'respondiendo' : 'apagado'}</dd></div>
                      </React.Fragment>
                    )}
                  </dl>

                  {(EMP_CONFIGURABLES[p.clave] || []).length > 0 && (
                    <div className="emp-acciones">
                      {EMP_CONFIGURABLES[p.clave].map(([que, etiqueta, ayuda]) => (
                        <button key={que} type="button" className="emp-accion"
                                onClick={() => (que === 'agente' ? onConfig(company) : onConocimiento(company))}>
                          <b>{etiqueta}</b><span>{ayuda}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="emp-cambiar">
                    <button type="button" className="ag-mini" disabled={busy}
                            onClick={() => onCambiar(company, comoPieza(p), encendido ? 'proximamente' : 'activo')}>
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
        <h3>
          Se le podría activar
          <button type="button" className="ag-mini" onClick={() => setMostrarResto(!mostrarResto)}>
            {mostrarResto ? 'ocultar' : 'ver ' + noTiene.length}
          </button>
        </h3>
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

      {/* ── Sus usuarios ──────────────────────────────────────────────── */}
      <section className="emp-seccion">
        <h3>Sus usuarios</h3>
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
