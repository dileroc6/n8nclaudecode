/* ============================================================================
 * Consola de ToqueFlow — la ficha de una empresa
 * ----------------------------------------------------------------------------
 * Todo lo de un cliente en un solo sitio: sus productos, y dentro de cada uno
 * su configuración.
 *
 * Por qué existe: antes había una pestaña «Agentes» suelta, y no cuadraba —
 * ¿el agente de qué producto? Un agente no es una categoría: es la
 * configuración de UN producto, «Toque Atiende». Ponerlo aparte hacía que el
 * panel no se pareciera a cómo está hecho el negocio.
 *
 * El orden mental correcto es: empresa → sus productos → configurar este.
 * ========================================================================== */

// Qué producto abre qué configuración. Es lo único que hace falta declarar para
// que un producto nuevo traiga sus pantallas: se agrega su clave aquí.
const EMP_CONFIGURABLES = {
  'agente-atencion': [
    ['agente',       'Configurar',   'tono, qué capturar, cuándo escalar'],
    ['conocimiento', 'Conocimiento', 'lo que sabe responder'],
  ],
};

function EmpresaModal({ company, catalogo, matriz, usuarios, consumo,
                        onConfig, onConocimiento, onCambiar, onVerUsuarios, onClose, busy }) {
  const mias = matriz.filter((m) => m.company_id === company.id);
  const cel = (claveOId) => mias.find((m) => m.catalogo_id === claveOId || m.clave === claveOId);

  const tiene = mias.filter((m) => m.estado_empresa !== 'no')
                    .sort((a, b) => a.orden - b.orden);
  const noTiene = mias.filter((m) => m.estado_empresa === 'no' && m.tipo !== 'herramienta')
                      .sort((a, b) => a.orden - b.orden);

  const [mostrarResto, setMostrarResto] = React.useState(false);

  const gasto = consumo
    .filter((u) => u.company_id === company.id)
    .reduce((a, u) => a + Number(u.cost_usd || 0), 0);
  const nUsuarios = usuarios.filter((u) => u.company_id === company.id).length;

  return (
    <Modal title={company.name} onClose={onClose}>
      <div className="adm-form emp-ficha">

        <div className="emp-resumen">
          <div><b>{tiene.filter((t) => t.estado_empresa === 'activo').length}</b><span>productos andando</span></div>
          <div><b>{tiene.filter((t) => t.estado_empresa === 'proximamente').length}</b><span>próximamente</span></div>
          <div><b>{nUsuarios}</b><span>usuarios</span></div>
          <div><b>${gasto.toFixed(2)}</b><span>IA acumulada</span></div>
        </div>

        <div className="emp-atajos">
          <button type="button" className="ag-mini" onClick={() => onVerUsuarios(company)}>ver sus usuarios</button>
          <a className="ag-mini" href={'dashboard.html?empresa=' + company.id}>entrar a su panel →</a>
        </div>

        {/* ── Lo que tiene ─────────────────────────────────────────────── */}
        <div className="emp-bloque">
          <h4>Lo que tiene</h4>
          {tiene.length === 0 && (
            <div className="ag-lista-vacia">Todavía no tiene nada activo. Enciéndele algo abajo.</div>
          )}
          {tiene.map((p) => (
            <div key={p.catalogo_id} className={'emp-pieza is-' + p.estado_empresa}>
              <div className="emp-pieza-top">
                <b>{p.nombre}</b>
                {p.veces > 1 && <i className="emp-sedes">{p.veces} sedes</i>}
                <span className={'emp-estado e-' + p.estado_empresa}>
                  {p.estado_empresa === 'activo' ? 'andando' : 'próximamente'}
                </span>
              </div>
              <p className="emp-pieza-d">{p.beneficio || p.descripcion}</p>

              {/* Las pantallas propias de este producto, si las tiene. */}
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
                {p.estado_empresa === 'proximamente' && (
                  <button type="button" className="ag-mini" disabled={busy}
                          onClick={() => onCambiar(company, { id: p.catalogo_id, clave: p.clave, nombre: p.nombre, tipo: p.tipo, beneficio: p.beneficio, descripcion: p.descripcion }, 'activo')}>
                    encender
                  </button>
                )}
                {p.estado_empresa === 'activo' && (
                  <button type="button" className="ag-mini" disabled={busy}
                          onClick={() => onCambiar(company, { id: p.catalogo_id, clave: p.clave, nombre: p.nombre, tipo: p.tipo, beneficio: p.beneficio, descripcion: p.descripcion }, 'proximamente')}>
                    pausar
                  </button>
                )}
                <button type="button" className="ag-mini danger" disabled={busy}
                        onClick={() => onCambiar(company, { id: p.catalogo_id, clave: p.clave, nombre: p.nombre, tipo: p.tipo, beneficio: p.beneficio, descripcion: p.descripcion }, 'no')}>
                  quitar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Lo que se le podría activar ──────────────────────────────── */}
        <div className="emp-bloque">
          <h4>
            Lo que se le podría activar
            <button type="button" className="ag-mini" onClick={() => setMostrarResto(!mostrarResto)}>
              {mostrarResto ? 'ocultar' : 'ver ' + noTiene.length}
            </button>
          </h4>
          {mostrarResto && (
            <div className="emp-resto">
              {noTiene.map((p) => (
                <div key={p.catalogo_id} className="emp-resto-fila">
                  <div>
                    <b>{p.nombre}</b>
                    <i className={'cat-estado e-' + (p.estado_pieza === 'funcionando' ? 'ok' : p.estado_pieza === 'a_medias' ? 'medio' : 'papel')}>
                      {p.estado_pieza === 'funcionando' ? 'funciona' : p.estado_pieza === 'a_medias' ? 'a medias' : 'en el papel'}
                    </i>
                    <span>{p.beneficio || p.descripcion}</span>
                  </div>
                  <button type="button" className="ag-mini" disabled={busy}
                          onClick={() => onCambiar(company, { id: p.catalogo_id, clave: p.clave, nombre: p.nombre, tipo: p.tipo, beneficio: p.beneficio, descripcion: p.descripcion }, 'proximamente')}>
                    activar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="adm-form-foot">
          <button type="button" className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </Modal>
  );
}
