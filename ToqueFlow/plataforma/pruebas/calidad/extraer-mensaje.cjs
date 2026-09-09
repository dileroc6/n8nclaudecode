/* ============================================================================
 * ¿A quién le contesta el agente, y a quién cree que le está contestando?
 * ----------------------------------------------------------------------------
 * El 30-ago el ensayo de go-live falló: el agente entendió, redactó bien y la
 * respuesta no llegó. WhatsApp había mandado `30146492928046@lid` —un
 * identificador opaco, no un teléfono— y el nodo le quitaba el «@lid» y usaba
 * esos dígitos para contestar Y para buscar a la persona en la base. Evolution
 * rechazó el envío y la base habría ganado un contacto que no es de nadie.
 *
 * POR QUÉ ESTA PRUEBA EXISTE Y NO OTRA: todas las pruebas del agente mandan
 * `<numero>@s.whatsapp.net` con números inventados, así que ninguna podía ver
 * esto. Es la segunda vez que pasa lo mismo —la primera fue el «+» de los 46
 * contactos de Bejauha— y las dos veces el agujero fue el método, no el código.
 *
 * Corre el código REAL del nodo «Extraer mensaje», sacado del JSON del
 * workflow. No una copia: si alguien edita el nodo y rompe esto, la prueba se
 * entera. Y no necesita n8n ni Evolution ni la base: son milisegundos.
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const WF = path.join(__dirname, '..', '..', '..', 'workflows', 'agente-atencion-generico.json');

// Se arma una función con el código del nodo y un `$input` de mentira, que es
// lo único que el nodo usa de n8n.
function extraer(payload) {
  const w = JSON.parse(fs.readFileSync(WF, 'utf8'));
  const nodo = w.nodes.find((n) => n.name === 'Extraer mensaje');
  if (!nodo) throw new Error('El workflow ya no tiene el nodo «Extraer mensaje»');
  const $input = { first: () => ({ json: payload }) };
  const fn = new Function('$input', nodo.parameters.jsCode);
  return fn($input)[0].json;
}

// Un mensaje normal, como llega hoy la mayoría.
const normal = {
  instance: 'dev-router',
  data: {
    key: { remoteJid: '573185478900@s.whatsapp.net', fromMe: false, id: 'AAA' },
    message: { conversation: 'hola, cuanto vale la membresia?' },
  },
};

// El que tumbó el ensayo: identificador opaco y ningún número a la vista.
const lidPelado = {
  instance: 'dev-router',
  data: {
    addressingMode: 'lid',
    key: { remoteJid: '30146492928046@lid', fromMe: false, id: 'BBB' },
    message: { conversation: 'hola, cuanto vale la membresia?' },
  },
};

// El mismo, pero con el número real en el campo hermano — que es como se
// espera que llegue de verdad.
const lidConNumero = {
  instance: 'dev-router',
  data: {
    addressingMode: 'lid',
    key: { remoteJid: '30146492928046@lid', remoteJidAlt: '573185478900@s.whatsapp.net',
           fromMe: false, id: 'CCC' },
    message: { conversation: 'hola, cuanto vale la membresia?' },
  },
};

// El número del PROPIO negocio viaja en `sender`. Si alguna vez se usa de
// respaldo, el agente se contesta a sí mismo.
const lidConSenderPropio = {
  instance: 'dev-router',
  data: {
    addressingMode: 'lid',
    sender: '573001112233@s.whatsapp.net',
    key: { remoteJid: '30146492928046@lid', fromMe: false, id: 'DDD' },
    message: { conversation: 'hola' },
  },
};

const casos = [];
const caso = (t, f) => casos.push([t, f]);
const igual = (a, b, q) => { if (a !== b) throw new Error(q + ': esperaba ' + JSON.stringify(b) + ' y llegó ' + JSON.stringify(a)); };

caso('un mensaje normal se atiende y el teléfono sale bien', () => {
  const r = extraer(normal);
  igual(r.atender, true, 'atender');
  igual(r.telefono, '573185478900', 'telefono');
  igual(r.destino, '573185478900', 'destino');
  igual(r.identificado, true, 'identificado');
});

caso('en un mensaje normal, destino y teléfono coinciden', () => {
  const r = extraer(normal);
  igual(r.destino, r.telefono, 'destino == telefono');
});

caso('un @lid NUNCA se toma como teléfono', () => {
  for (const p of [lidPelado, lidConNumero, lidConSenderPropio]) {
    const r = extraer(p);
    if (r.telefono === '30146492928046') {
      throw new Error('tomó el identificador del @lid como si fuera un número — es el bug del 30-ago');
    }
  }
});

caso('un @lid con el número real en el campo hermano se resuelve', () => {
  const r = extraer(lidConNumero);
  igual(r.atender, true, 'atender');
  igual(r.telefono, '573185478900', 'telefono');
  igual(r.identificado, true, 'identificado');
  igual(r.por_lid, true, 'por_lid');
});

caso('un @lid sin número real NO crea un contacto basura', () => {
  const r = extraer(lidPelado);
  igual(r.identificado, false, 'identificado');
  igual(r.telefono, '', 'telefono');
  igual(r.atender, false, 'atender');
  if (!/lid/.test(String(r.razon))) throw new Error('el motivo del descarte no dice que fue por @lid: ' + r.razon);
});

caso('el destino siempre sirve para contestar, aunque no se sepa quién es', () => {
  const r = extraer(lidPelado);
  if (!r.destino) throw new Error('se quedó sin destino: no habría a quién contestarle');
  if (!/@lid$/.test(r.destino)) throw new Error('el destino debería ser el JID completo, y es: ' + r.destino);
});

caso('nunca se contesta al número del propio negocio', () => {
  const r = extraer(lidConSenderPropio);
  if (r.telefono === '573001112233' || r.destino === '573001112233') {
    throw new Error('usó el número del negocio como remitente: el agente se contestaría a sí mismo');
  }
});

caso('lo de siempre se sigue descartando', () => {
  const grupo = JSON.parse(JSON.stringify(normal));
  grupo.data.key.remoteJid = '120363000000000000@g.us';
  igual(extraer(grupo).atender, false, 'un grupo');

  const propio = JSON.parse(JSON.stringify(normal));
  propio.data.key.fromMe = true;
  igual(extraer(propio).atender, false, 'mensaje propio');

  const mudo = JSON.parse(JSON.stringify(normal));
  mudo.data.message = {};
  igual(extraer(mudo).atender, false, 'sin texto');
});

console.log('\n── A quién le contesta el agente ──');
let malas = 0;
for (const [titulo, fn] of casos) {
  try { fn(); console.log('  ✅ ' + titulo); }
  catch (e) { malas++; console.log('  ❌ ' + titulo + '\n       ' + e.message); }
}
console.log(malas === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + malas + ' fallaron ═══');
process.exit(malas === 0 ? 0 : 1);
