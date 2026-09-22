/* ============================================================================
 * ¿A dónde llega el aviso cuando el agente deja de responder?
 * ----------------------------------------------------------------------------
 * Una sola definición, para el alta y para la consola.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 *
 * Cuando el agente no sabe algo, se calla y avisa a una persona. La mitad que
 * se calla funciona siempre. La que avisa depende de que el destino sea algo a
 * lo que de verdad se pueda escribir.
 *
 * En Bejauha estaba escrito EN PALABRAS —«equipo de Bejauha», «administración»—
 * y el flujo manda ese texto como si fuera un número. Evolution lo rechaza. El
 * agente se calla, la persona que quería comprar queda esperando en silencio, y
 * **nadie se entera de que pasó**. Es peor que un bot que no contesta.
 *
 * Y no era un descuido de ese cliente: el asistente de alta grababa
 * `destino: 'equipo'` FIJO, sin preguntarlo. O sea que el defecto salía de
 * fábrica y se descubría el día del go-live, cliente por cliente.
 * ========================================================================== */

(function (w) {
  // Un destino sirve si es algo a lo que se puede escribir de verdad.
  //
  // Se acepta un teléfono con indicativo, el id de un grupo de WhatsApp, o una
  // URL (para quien prefiera un webhook a su propio sistema). Cualquier otra
  // cosa —un nombre de equipo, un cargo, «administración»— se rechaza, porque
  // es exactamente lo que se ve bien en la pantalla y no llega a ningún lado.
  // Once dígitos como mínimo: indicativo + número. Un colombiano sin indicativo
  // son exactamente 10 (3001234567), y es el error más común — se ve bien
  // escrito y Evolution lo rechaza igual que un nombre. España son 11 con el 34,
  // Colombia 12 con el 57.
  const TELEFONO = /^\+?[1-9][0-9]{10,14}$/;
  const GRUPO    = /@g\.us$/i;
  const URL      = /^https:\/\/\S+$/i;

  const limpio = (s) => String(s == null ? '' : s).replace(/[\s()-]/g, '');

  function destinoValido(s) {
    const v = limpio(s);
    if (!v) return false;
    return TELEFONO.test(v) || GRUPO.test(v) || URL.test(String(s).trim());
  }

  // Qué decirle a quien lo está escribiendo. Un «valor inválido» no ayuda: hay
  // que decir qué SÍ sirve, porque el error típico es escribir un nombre.
  function porQueNoSirve(s) {
    const v = String(s == null ? '' : s).trim();
    if (!v) return 'Falta decir a dónde llega el aviso.';
    if (destinoValido(v)) return null;
    if (/^https?:\/\//i.test(v)) return 'Si es una URL tiene que ser https.';
    if (/^[0-9+\s()-]+$/.test(v)) {
      return 'Ese número no lleva indicativo de país. Escríbelo completo: 573001234567.';
    }
    return 'Eso es un nombre, no un destino. El aviso se manda por WhatsApp, así que ' +
           'tiene que ser un número con indicativo (573001234567), el id de un grupo ' +
           '(…@g.us) o una URL https.';
  }

  w.TF_DESTINO = { valido: destinoValido, porQueNoSirve, ejemplo: '573001234567' };
})(window);
