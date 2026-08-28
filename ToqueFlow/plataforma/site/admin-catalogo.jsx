/* ============================================================================
 * Consola de ToqueFlow — la pestaña Productos
 * ----------------------------------------------------------------------------
 * El catálogo de lo que ToqueFlow puede ofrecer, con lo que hace falta para
 * venderlo sin prometer de más y para configurarlo sin adivinar: qué hace cada
 * pieza, qué se le puede tocar, de qué está compuesta, si ya se puede vender y
 * cuántos clientes la tienen.
 *
 * Antes esto vivía en la cabeza de Diego y en varios markdown sueltos.
 *
 * OJO CON LOS DOS ESTADOS, que son ejes distintos:
 *   liberado   si se le puede vender a un cliente nuevo tal cual está
 *   estado     qué tan construida está la pieza
 * Algo puede FUNCIONAR para un cliente concreto y no estar listo para
 * cualquiera: eso es «en construcción» aunque funcione.
 * ========================================================================== */

const CAT_TIPOS = [
  ['producto',       'Productos',        'Lo que se vende y se factura. El cliente lo ve como una tarjeta en su panel.'],
  ['herramienta',    'Herramientas',     'Lo que el agente hace dentro de una conversación. No son productos aparte: son de qué está hecho el agente.'],
  ['automatizacion', 'Automatizaciones', 'Corren solas, sin conversación de por medio: un cron, un pago que entra, una campaña que sale.'],
];

const CAT_MADUREZ = {
  funcionando: ['funciona', 'ok'],
  a_medias:    ['a medias', 'medio'],
  en_papel:    ['en el papel', 'papel'],
};


// Las piezas de un producto, agrupadas por lo que son. Herramienta y
// automatización no son lo mismo y quien vende necesita distinguirlas: una
// actúa dentro de la conversación, la otra corre sola.
const PIEZA_GRUPOS = [
  ['herramienta',    'Herramientas',     'el agente las usa dentro de la conversación'],
  ['automatizacion', 'Automatizaciones', 'corren solas, sin que nadie escriba'],
];

function PiezasQueLleva({ siempre, opcionales }) {
  const todas = [
    ...siempre.map((x) => ({ ...x, siempre: true })),
    ...opcionales.map((x) => ({ ...x, siempre: false })),
  ];
  if (todas.length === 0) {
    return (
      <div className="cat-col">
        <h5>De qué se compone</h5>
        <p className="cat-nada">Es una pieza suelta: no lleva otras adentro.</p>
      </div>
    );
  }
  return (
    <div className="cat-piezas">
      {PIEZA_GRUPOS.map(([tipo, titulo, ayuda]) => {
        const del = todas.filter((x) => x.tipo === tipo);
        if (!del.length) return null;
        return (
          <div key={tipo} className="cat-grupo">
            <h5>{titulo} <em>{ayuda}</em></h5>
            {del.map((x) => (
              <div key={x.clave} className={'cat-pieza-fila' + (x.liberado ? '' : ' is-obra')}>
                <span className='cat-pieza-punto'>{x.siempre ? '●' : '○'}</span>
                <div>
                  <b>{x.nombre}</b>
                  <i className={'cat-liberado ' + (x.liberado ? 'si' : 'no')}>
                    {x.liberado ? 'liberada' : 'en construcción'}
                  </i>
                  <span>{x.que_hace}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
      <p className="cat-piezas-pie">● va siempre &nbsp;·&nbsp; ○ se le puede sumar por cliente</p>
    </div>
  );
}

function CatalogoTab({ catalogo }) {
  const [tipo, setTipo] = React.useState('producto');
  const [abierta, setAbierta] = React.useState(null);

  const piezas = catalogo.filter((c) => c.tipo === tipo).sort((a, b) => a.orden - b.orden);
  const liberadas = piezas.filter((p) => p.liberado).length;

  return (
    <div>
      <div className="cat-filtros">
        <div className="cat-tipos">
          {CAT_TIPOS.map(([k, etiqueta]) => (
            <button key={k} type="button"
                    className={'cat-tipo' + (tipo === k ? ' is-active' : '')}
                    onClick={() => { setTipo(k); setAbierta(null); }}>
              {etiqueta}
              <span>{catalogo.filter((c) => c.tipo === k).length}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="cat-ayuda">
        {CAT_TIPOS.find(([k]) => k === tipo)[2]}
        {' '}<b>{liberadas} de {piezas.length} se pueden vender hoy.</b>
      </p>

      <div className="cat-lista">
        {piezas.map((p) => {
          const esta = abierta === p.id;
          const tieneParams = (p.parametros || []).length > 0;
          return (
            <article key={p.id} className={'cat-item' + (p.liberado ? '' : ' is-obra')}>
              <button type="button" className="cat-item-cabeza" onClick={() => setAbierta(esta ? null : p.id)}>
                <span className="cat-item-n">
                  {p.nombre}
                  {!p.vendible && <i className="emp-sedes">viene con la plataforma</i>}
                </span>
                <span className={'cat-liberado ' + (p.liberado ? 'si' : 'no')}>
                  {p.liberado ? 'liberado' : 'en construcción'}
                </span>
                <i className={'cat-estado e-' + CAT_MADUREZ[p.estado][1]}>{CAT_MADUREZ[p.estado][0]}</i>
                <span className="cat-clientes">
                  {p.clientes_encendido > 0 && <b>{p.clientes_encendido} andando</b>}
                  {p.clientes_sin_encender > 0 && <em>{p.clientes_sin_encender} sin encender</em>}
                  {p.clientes_encendido === 0 && p.clientes_sin_encender === 0 && <em>nadie</em>}
                </span>
                <span className="emp-chevron">{esta ? '−' : '+'}</span>
              </button>

              {esta && (
                <div className="cat-item-cuerpo">
                  <p className="cat-item-d"><b>Qué hace:</b> {p.descripcion}</p>
                  {p.beneficio && <p className="cat-item-d"><b>Cómo se lo explicas al cliente:</b> «{p.beneficio}»</p>}

                  <div className="cat-col cat-params">
                    <h5>Qué se le puede configurar</h5>
                    {tieneParams ? (
                      <ul>{p.parametros.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    ) : (
                      <p className="cat-nada">Nada: se enciende y ya. Igual para todos los clientes.</p>
                    )}
                  </div>

                  <PiezasQueLleva siempre={p.lleva_siempre || []} opcionales={p.puede_sumar || []} />

                  {p.workflow && <p className="cat-tech">corre en <code>{p.workflow}</code></p>}

                  {!p.liberado && (
                    <p className="cat-aviso">
                      <b>No ofrecerla como lista.</b>{' '}
                      {p.estado === 'a_medias'
                        ? 'Existe para algún cliente como flujo aparte; falta volverla pieza del catálogo.'
                        : 'Está pensada pero no construida. Sirve para decir «podemos hacerlo», no para prometer una fecha.'}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
