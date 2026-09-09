/* ============================================================================
 * Consola de ToqueFlow — la pestaña Productos
 * ----------------------------------------------------------------------------
 * UN ÁRBOL. Es la forma que pidió Diego, y tenía razón: la estructura ES un
 * árbol, y cualquier otra cosa obliga a explicarla.
 *
 *   Toque Atiende                      ← el producto. se vende solo
 *     + Toque Agenda                   ← lo que se le puede sumar
 *         · ver-disponibilidad         ← lo que trae adentro. no se vende
 *
 * QUÉ SE ARREGLÓ, porque el intento anterior fallaba en esto:
 *   · Las pestañas «Pines 3», «La plataforma» y «Piezas de adentro» no le
 *     decían nada a nadie. Los pines NO son una lista aparte: son de cada
 *     producto, y ahora salen debajo del suyo, al pulsarlo.
 *   · Lo que se puede vender va arriba y en negro. Lo que no, abajo y apagado.
 *     Si se ven igual, alguien va a ofrecer lo que no existe.
 *   · Pulsar un producto muestra lo que PUEDE tener. Esa era la pregunta.
 *
 * LAS DOS PALABRAS QUE NO SIGNIFICAN LO MISMO:
 *   liberado   si se le puede vender a un cliente nuevo tal cual está
 *   estado     qué tan construida está la pieza
 * Algo puede FUNCIONAR para un cliente concreto y no estar listo para
 * cualquiera: eso es «no se ofrece» aunque funcione.
 * ========================================================================== */

const CAT_MADUREZ = {
  funcionando: ['funciona', 'ok'],
  a_medias:    ['a medias', 'medio'],
  en_papel:    ['en el papel', 'papel'],
};

const catPesos = (n) =>
  (n === null || n === undefined) ? null : '$' + new Intl.NumberFormat('es-CO').format(n);


// Quién tiene esto, en palabras. «Prometido» es una deuda —alguien se lo
// anunció a un cliente y no está encendido— y merece palabra propia.
function CatQuienLoTiene({ p }) {
  const andando = p.clientes_encendido || 0;
  const pronto  = p.clientes_sin_encender || 0;
  return (
    <span className="cat-clientes">
      {andando > 0 && <b>{andando} andando</b>}
      {pronto > 0 && <em>{pronto} prometido{pronto > 1 ? 's' : ''}</em>}
      {!andando && !pronto && <em>nadie</em>}
    </span>
  );
}


// La hoja del árbol: una pieza que el agente ejecuta. No se abre porque no
// tiene nada dentro, y no se vende, así que no lleva precio.
function CatPieza({ x }) {
  return (
    <div className={'cat-hoja' + (x.liberado ? '' : ' is-obra')}>
      <span className="cat-hoja-punto">{x.liberado ? '●' : '○'}</span>
      <b>{x.nombre}</b>
      <span>{x.que_hace}</span>
      {!x.liberado && <i className="cat-hoja-obra">falta construirla</i>}
    </div>
  );
}


// Un pin: cuelga de un producto y se abre para ver qué trae adentro.
function CatPin({ p, abierto, alternar }) {
  const esta = abierto.indexOf(p.id) !== -1;
  const mes  = catPesos(p.precio_cop);
  const alta = catPesos(p.implementacion_cop);
  const mad  = CAT_MADUREZ[p.estado] || CAT_MADUREZ.en_papel;
  const dentro = p.contiene_piezas || [];
  const listas = dentro.filter((x) => x.liberado).length;

  return (
    <div className={'cat-nodo cat-nivel-2' + (p.liberado ? '' : ' is-obra')}>
      <button type="button" className="cat-nodo-cabeza" onClick={() => alternar(p.id)}>
        <span className="cat-flecha">{esta ? '▾' : '▸'}</span>
        <span className="cat-nodo-n"><i className="cat-mas">+</i>{p.nombre}</span>
        {dentro.length > 0 && (
          <span className="cat-dentro">{listas} de {dentro.length} construidas</span>
        )}
        {mes && <span className="cat-precio"><b>{mes}<em>/mes</em></b>{alta && <i>+ {alta} alta</i>}</span>}
        <span className={'cat-liberado ' + (p.liberado ? 'si' : 'no')}>{p.liberado ? 'se vende' : 'en construcción'}</span>
        <i className={'cat-estado e-' + mad[1]}>{mad[0]}</i>
        <CatQuienLoTiene p={p} />
      </button>

      {esta && (
        <div className="cat-nodo-cuerpo">
          <p className="cat-item-d">{p.beneficio || p.descripcion}</p>
          {dentro.length > 0 ? (
            <>
              <h5>Lo que trae adentro</h5>
              {dentro.map((x) => <CatPieza key={x.clave} x={x} />)}
              <p className="cat-piezas-pie">
                Estas piezas no se nombran al cliente: se le dice qué va a poder hacer, no cómo.
              </p>
            </>
          ) : <p className="cat-nada">Todavía no tiene piezas adentro.</p>}
        </div>
      )}
    </div>
  );
}


// Un producto: la raíz. Se abre para ver qué lleva siempre y qué se le puede
// sumar, que es justo lo que uno viene a preguntar.
function CatProducto({ p, pines, abierto, alternar }) {
  const esta = abierto.indexOf(p.id) !== -1;
  const mes  = catPesos(p.precio_cop);
  const alta = catPesos(p.implementacion_cop);
  const mad  = CAT_MADUREZ[p.estado] || CAT_MADUREZ.en_papel;
  const siempre = p.lleva_siempre || [];

  return (
    <div className={'cat-nodo cat-nivel-1' + (p.liberado ? '' : ' is-obra')}>
      <button type="button" className="cat-nodo-cabeza" onClick={() => alternar(p.id)}>
        <span className="cat-flecha">{esta ? '▾' : '▸'}</span>
        <span className="cat-nodo-n cat-raiz">{p.nombre}</span>
        {pines.length > 0 && <span className="cat-dentro">{pines.length} se le pueden sumar</span>}
        {mes && <span className="cat-precio"><b>{mes}<em>/mes</em></b>{alta && <i>+ {alta} alta</i>}</span>}
        <span className={'cat-liberado ' + (p.liberado ? 'si' : 'no')}>{p.liberado ? 'se vende' : 'en construcción'}</span>
        <i className={'cat-estado e-' + mad[1]}>{mad[0]}</i>
        <CatQuienLoTiene p={p} />
      </button>

      {esta && (
        <div className="cat-nodo-cuerpo">
          <p className="cat-item-d">{p.descripcion}</p>
          {p.beneficio && <p className="cat-item-d cat-pitch">«{p.beneficio}»</p>}

          {siempre.length > 0 && (
            <>
              <h5>Va siempre — no se puede apagar</h5>
              {siempre.map((x) => <CatPieza key={x.clave} x={x} />)}
            </>
          )}

          {(p.parametros || []).length > 0 && (
            <>
              <h5>Qué hay que preguntarle al cliente</h5>
              <ul className="cat-params-lista">{p.parametros.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </>
          )}

          {pines.length > 0
            ? <h5 className="cat-h5-suma">Lo que se le puede sumar</h5>
            : <p className="cat-nada">No tiene nada que sumarle todavía: se vende tal cual.</p>}
        </div>
      )}

      {/* Los pines viven DEBAJO de su producto y solo cuando está abierto. Es
          la respuesta a «¿qué puede tener esto?», que es para lo que se pulsa. */}
      {esta && pines.map((x) => <CatPin key={x.id} p={x} abierto={abierto} alternar={alternar} />)}
    </div>
  );
}


function CatalogoTab({ catalogo }) {
  const [abierto, setAbierto] = React.useState([]);
  const alternar = (id) => setAbierto((a) => a.indexOf(id) === -1 ? a.concat([id]) : a.filter((x) => x !== id));

  const orden = (a, b) => (a.orden || 0) - (b.orden || 0);
  const pines = catalogo.filter((c) => c.tipo === 'paquete');
  const susPines = (p) => pines.filter((x) => x.requiere === p.clave).sort(orden);

  const productos = catalogo.filter((c) => c.tipo === 'producto');
  const seVenden  = productos.filter((c) => c.vendible !== false && c.liberado).sort(orden);
  const enObra    = productos.filter((c) => c.vendible !== false && !c.liberado).sort(orden);
  const conTodo   = productos.filter((c) => c.vendible === false).sort(orden);

  // Un pin cuyo producto no está en ninguna lista no puede desaparecer: sería
  // esconder justo lo que está mal.
  const claves = productos.map((c) => c.clave);
  const huerfanos = pines.filter((x) => claves.indexOf(x.requiere) === -1).sort(orden);

  return (
    <div className="cat-arbol">

      {/* Va primero y en una línea: es el suelo sobre el que está todo lo
          demás, y hay que saberlo ANTES de leer el catálogo. No es una sección
          plegable con detalle — es un dato de contexto, y por eso se ve
          distinto de todo lo que sí se vende. */}
      <div className="cat-suelo">
        <b>Va con toda empresa</b>
        <span>
          {conTodo.map((p) => p.nombre).join(' · ')}
          {conTodo.length > 0 && ' — se le entrega a todo cliente y no se cotiza.'}
        </span>
      </div>

      <section className="cat-banda">
        <header>
          <h3>Se vende hoy</h3>
          <b className="cat-cuenta">{seVenden.length}</b>
          <em>Pulsa uno para ver qué lleva siempre y qué se le puede sumar.</em>
        </header>
        {seVenden.map((p) => (
          <CatProducto key={p.id} p={p} pines={susPines(p)} abierto={abierto} alternar={alternar} />
        ))}
      </section>

      {enObra.length > 0 && (
        <section className="cat-banda is-apagada">
          <header>
            <h3>Todavía no se ofrece</h3>
            <b className="cat-cuenta">{enObra.length}</b>
            <em>Existe en el catálogo y no está listo para un cliente nuevo. Se menciona como lo que viene, <b>nunca con fecha</b>.</em>
          </header>
          {enObra.map((p) => (
            <CatProducto key={p.id} p={p} pines={susPines(p)} abierto={abierto} alternar={alternar} />
          ))}
        </section>
      )}

      {huerfanos.length > 0 && (
        <section className="cat-banda is-apagada">
          <header>
            <h3>Sin producto que los lleve</h3>
            <b className="cat-cuenta">{huerfanos.length}</b>
            <em>Cuelgan de algo que no está en el catálogo. Es un error de datos, no una categoría.</em>
          </header>
          {huerfanos.map((x) => <CatPin key={x.id} p={x} abierto={abierto} alternar={alternar} />)}
        </section>
      )}
    </div>
  );
}
