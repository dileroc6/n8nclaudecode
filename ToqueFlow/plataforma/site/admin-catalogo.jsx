/* ============================================================================
 * Consola de ToqueFlow — la pestaña Productos
 * ----------------------------------------------------------------------------
 * La matriz: todas las piezas del catálogo por cada empresa, con su estado.
 * Activar un producto deja de ser teclear una fila en `flows` y pasa a ser
 * pulsar una casilla.
 *
 * Tres estados por celda, y los tres significan algo distinto:
 *   activo      la tiene andando
 *   proximamente  asi lo ve el cliente en su panel. Es una deuda, no un logro
 *   —           no la tiene
 * ========================================================================== */

const CAT_TIPOS = [
  ['producto',       'Productos',       'Lo que se vende y se factura. El cliente lo ve como una tarjeta en su panel.'],
  ['herramienta',    'Herramientas',    'Lo que el agente hace dentro de una conversación. No son productos aparte: son de qué está hecho el agente.'],
  ['automatizacion', 'Automatizaciones', 'Corren solas, sin conversación de por medio: un cron, un pago que entra, una campaña que sale.'],
];

const CAT_ESTADO_PIEZA = {
  funcionando: ['funciona', 'ok'],
  a_medias:    ['a medias', 'medio'],
  en_papel:    ['en el papel', 'papel'],
};

// El ciclo al pulsar una celda. Se pasa por «prometido» a propósito: es el
// estado real de casi todo lo que se vende antes de encenderlo, y esconderlo
// haría que el tablero mienta.
const CAT_CICLO = { no: 'proximamente', proximamente: 'activo', activo: 'no' };

function CatalogoTab({ companies, matriz, catalogo, onCambiar, busy }) {
  const [tipo, setTipo] = React.useState('producto');
  const [soloConAlgo, setSoloConAlgo] = React.useState(false);

  const piezas = catalogo
    .filter((c) => c.tipo === tipo)
    .sort((a, b) => a.orden - b.orden);

  const celda = (companyId, catalogoId) =>
    matriz.find((m) => m.company_id === companyId && m.catalogo_id === catalogoId);

  const visibles = soloConAlgo
    ? piezas.filter((p) => companies.some((co) => (celda(co.id, p.id) || {}).estado_empresa !== 'no'))
    : piezas;

  // Cuántas piezas tiene encendidas cada empresa, para la fila de resumen.
  const cuenta = (companyId, estado) =>
    matriz.filter((m) => m.company_id === companyId && m.estado_empresa === estado).length;

  return (
    <div>
      <div className="cat-filtros">
        <div className="cat-tipos">
          {CAT_TIPOS.map(([k, etiqueta]) => (
            <button key={k} type="button"
                    className={'cat-tipo' + (tipo === k ? ' is-active' : '')}
                    onClick={() => setTipo(k)}>
              {etiqueta}
              <span>{catalogo.filter((c) => c.tipo === k).length}</span>
            </button>
          ))}
        </div>
        <label className="ag-check cat-solo">
          <input type="checkbox" checked={soloConAlgo} onChange={(e) => setSoloConAlgo(e.target.checked)} />
          <span>solo lo que alguien tiene</span>
        </label>
      </div>

      <p className="cat-ayuda">{CAT_TIPOS.find(([k]) => k === tipo)[2]}</p>

      <div className="cat-tabla-wrap">
        <table className="cat-tabla">
          <thead>
            <tr>
              <th>Pieza</th>
              {companies.map((co) => (
                <th key={co.id} title={co.name}>
                  <span className="cat-emp">{co.name}</span>
                  <span className="cat-emp-n">{cuenta(co.id, 'activo')} activas</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr><td colSpan={companies.length + 1} className="admin-empty">Nadie tiene piezas de este tipo todavía.</td></tr>
            )}
            {visibles.map((p) => (
              <tr key={p.id}>
                <td className="cat-pieza">
                  <span className="cat-pieza-n">
                    {p.nombre}
                    <i className={'cat-estado e-' + CAT_ESTADO_PIEZA[p.estado][1]}>{CAT_ESTADO_PIEZA[p.estado][0]}</i>
                  </span>
                  <span className="cat-pieza-d">{p.descripcion}</span>
                </td>
                {companies.map((co) => {
                  const c = celda(co.id, p.id) || { estado_empresa: 'no' };
                  const e = c.estado_empresa;
                  return (
                    <td key={co.id} className="cat-celda">
                      <button type="button" disabled={busy}
                              className={'cat-marca m-' + e}
                              title={
                                (c.veces > 1 ? 'En ' + c.veces + ' sedes. La casilla las cambia todas. ' : '') + (
                                e === 'activo' ? 'Andando. Pulsa para quitarla.'
                                : e === 'proximamente' ? 'Anunciada en su panel como «próximamente». Pulsa para encenderla.'
                                : 'No la tiene. Pulsa para prometerla.')
                              }
                              onClick={() => onCambiar(co, p, CAT_CICLO[e])}>
                        {e === 'activo' ? '●' : e === 'proximamente' ? '◐' : '·'}
                        {c.veces > 1 && <i className="cat-veces">{c.veces}</i>}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cat-leyenda">
        <span><b className="m-activo">●</b> andando</span>
        <span><b className="m-proximamente">◐</b> «próximamente» en su panel</span>
        <span><b className="m-no">·</b> no la tiene</span>
        <span className="cat-leyenda-nota">Pulsa una celda para cambiarla.</span>
      </div>
    </div>
  );
}
