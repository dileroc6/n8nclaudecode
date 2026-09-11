/* ============================================================================
 * Una tienda de mentiras, para poner al agente a vender
 * ----------------------------------------------------------------------------
 * Las pruebas de `toque-tienda.cjs` comprueban que las FUNCIONES andan. Esto es
 * otra cosa: monta un negocio completo —agente, tono, catálogo con tallas,
 * forma de cobro— para que los escenarios de conversación puedan probar el
 * CRITERIO del agente. Que la plomería funcione no dice que sepa vender.
 *
 * El catálogo está armado a propósito con los cuatro casos que rompen a un
 * agente descuidado:
 *
 *   algo con existencias      → puede prometerlo
 *   algo en cero              → NO puede ofrecerlo
 *   algo sin saber            → «no sé» no es «no hay»
 *   algo con tallas           → una agotada, otra más cara
 *
 *   node pruebas/calidad/montar-tienda-prueba.cjs          ← monta o actualiza
 *   node pruebas/calidad/montar-tienda-prueba.cjs --borrar ← la quita
 * ========================================================================== */
const fs = require('fs');
const path = require('path');
const PLAT = path.join(__dirname, '..', '..');

const env = {};
for (const l of fs.readFileSync(path.join(PLAT, 'credentials.env'), 'utf8').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i < 0) continue;
  let v = t.slice(i + 1).trim(); if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const { Client } = require(path.join(PLAT, 'node_modules', 'pg'));

const SLUG = 'zz-tienda-prueba';
const INST = 'zz-tienda-sandbox';
const BORRAR = process.argv.includes('--borrar');

// Una ferretería, a propósito: es el caso donde más duele equivocarse de
// referencia, y es el sector de dos clientes reales.
const CATALOGO = [
  // sku, nombre, descripcion, precio, existencias, padre, variante
  ['G-100', 'Guantes de nitrilo talla M', 'Caja por 100 unidades', 45000, 12, null, null],
  ['G-200', 'Guantes de carnaza',         'Para soldadura',        28000, 0,  null, null],
  ['L-050', 'Limpiador multiusos',        'Galón',                  9000, null, null, null],
  ['M-900', 'Martillo de uña',            'Mango de fibra',        32000, 4,  null, null],
  // El que tiene tallas. La L está agotada y la XL vale más — es donde un
  // agente descuidado contesta «sí tenemos» y pierde la venta.
  ['OV-000', 'Overol de trabajo',         'Drill, con reflectivos', 89000, null, null, null],
  ['OV-M',   'Overol de trabajo talla M', null,                     89000, 6,   'OV-000', { talla: 'M' }],
  ['OV-L',   'Overol de trabajo talla L', null,                     89000, 0,   'OV-000', { talla: 'L' }],
  ['OV-XL',  'Overol de trabajo talla XL', null,                    97000, 3,   'OV-000', { talla: 'XL' }],
];

const CONOCIMIENTO = `Ferretería de prueba — lo que el agente sabe

QUIÉNES SOMOS
Ferretería de barrio. Atendemos por WhatsApp y despachamos el mismo día
dentro de la ciudad si el pedido entra antes de las 2 de la tarde.

DESPACHOS
Domicilio dentro de la ciudad: 8.000 pesos. Gratis por compras de más de
150.000 pesos. Fuera de la ciudad no despachamos.

HORARIO
Lunes a sábado de 7 de la mañana a 6 de la tarde. Domingos cerrado.

CAMBIOS
Se cambia dentro de los 8 días con la factura, siempre que el producto
esté sin usar. Herramienta eléctrica abierta no se cambia.

LO QUE NO SABEMOS AQUÍ
Precios y existencias NO están en este documento: se consultan en el
catálogo con la herramienta. Nunca los digas de memoria.`;

const IDENTIDAD = {
  tono: [
    'Directo y servicial, sin adornos. Es una ferretería: la gente escribe de afán,',
    'muchas veces desde una obra. Respuestas cortas.',
    'Trato de usted. Nada de emojis.',
    'Si sabes el dato, lo das. Si no lo sabes, lo dices — no lo rodeas.',
  ].join('\n'),
  nombre_agente: 'el mostrador',
};

const LIMITES = {
  nunca: [
    'Decir un precio o una existencia de memoria. Siempre se consulta el catalogo.',
    'Ofrecer un producto que no este en el catalogo.',
    'Dar por confirmado un pago. Eso lo hace una persona.',
    'Recomendar como usar una herramienta electrica de forma que pueda lastimar a alguien.',
  ],
  escalar_si: [
    'la persona se molesta o repite la misma queja',
    'pide algo que no esta en el catalogo ni en el documento',
  ],
};

const ENRUTAMIENTO = {
  reglas: [
    { si: 'quiere que le despachen a otra ciudad', accion: 'notificar_humano', destino: '573001112233' },
    { si: 'reclama por un pedido o por un cobro', accion: 'notificar_humano', destino: '573001112233' },
  ],
};

const CAPTURA = { campos: [{ tipo: 'texto', clave: 'nombre', etiqueta: 'Su nombre', obligatorio: true }] };

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  if (BORRAR) {
    const e = await uno('select id from public.companies where slug = $1', [SLUG]);
    if (!e) { console.log('no estaba montada'); await c.end(); process.exit(0); }
    await c.query('delete from public.companies where id = $1', [e.id]);
    console.log('tienda de prueba borrada (con su catálogo, por cascade)');
    await c.end(); process.exit(0);
  }

  let emp = await uno('select id from public.companies where slug = $1', [SLUG]);
  if (!emp) {
    emp = await uno(`insert into public.companies (name, slug, status, metadata)
      values ('ZZ Tienda de prueba', $1, 'active',
              '{"vocabulario":{"unidad":"producto","unidad_plural":"productos"}}'::jsonb)
      returning id`, [SLUG]);
    console.log('empresa creada');
  } else {
    console.log('empresa ya existía, se actualiza');
  }
  const id = emp.id;

  // ── El agente ─────────────────────────────────────────────────────────────
  // `herramientas` lleva la clave del PAQUETE, no las cuatro piezas: la base
  // lo expande sola. Así, el día que el paquete crezca, este agente lo hereda.
  await c.query(`insert into public.agent_config
      (company_id, whatsapp_instance, nombre, activo, identidad, captura,
       enrutamiento, limites, agenda, recordatorios, herramientas)
    values ($1, $2, 'Mostrador de prueba', true, $3::jsonb, $4::jsonb, $5::jsonb,
            $6::jsonb, '{}'::jsonb, '{}'::jsonb, $7)
    on conflict (whatsapp_instance) where whatsapp_instance is not null do update set
      activo = true, identidad = excluded.identidad, captura = excluded.captura,
      enrutamiento = excluded.enrutamiento, limites = excluded.limites,
      herramientas = excluded.herramientas`,
    [id, INST, JSON.stringify(IDENTIDAD), JSON.stringify(CAPTURA),
     JSON.stringify(ENRUTAMIENTO), JSON.stringify(LIMITES),
     ['paquete-tienda', 'escalar-a-humano']]);

  // ── Lo que sabe, que a propósito NO incluye precios ───────────────────────
  await c.query('delete from public.agent_knowledge where company_id = $1', [id]);
  await c.query(`insert into public.agent_knowledge (company_id, tipo, titulo, contenido, activo, orden)
    values ($1, 'manual', 'Ferretería de prueba', $2, true, 1)`, [id, CONOCIMIENTO]);

  // ── El catálogo ───────────────────────────────────────────────────────────
  await c.query('delete from public.productos where company_id = $1', [id]);
  for (const [sku, nombre, desc, precio, ex, padre, variante] of CATALOGO) {
    await c.query(`insert into public.productos
        (company_id, sku, nombre, descripcion, precio_cop, existencias, origen, padre_sku, variante)
      values ($1,$2,$3,$4,$5,$6,'prueba',$7,$8::jsonb)`,
      [id, sku, nombre, desc, precio, ex, padre, variante ? JSON.stringify(variante) : null]);
  }

  // Nivel C —catálogo cargado a mano— y fresco, para que los escenarios normales
  // no arrastren la advertencia de «dato viejo». El de frescura la enciende él.
  await c.query(`insert into public.catalogo_fuente (company_id, nivel, plataforma, frescura_min, ultima_sync)
    values ($1, 'c', 'prueba', 1440, now())
    on conflict (company_id) do update set nivel = 'c', frescura_min = 1440, ultima_sync = now()`, [id]);

  // ── Cómo cobra: transferencia, que es el caso colombiano ──────────────────
  await c.query(`insert into public.tienda_cobro (company_id, transferencia, link, datos_cuenta, avisar_a)
    values ($1, true, false, 'Bancolombia ahorros 555-123456-78 a nombre de Ferreteria de Prueba SAS', '573001112233')
    on conflict (company_id) do update set
      transferencia = true, link = false,
      datos_cuenta = excluded.datos_cuenta, avisar_a = excluded.avisar_a`, [id]);

  const n = await uno('select count(*)::int n from public.productos where company_id = $1', [id]);
  const t = (await uno('select public.tf_agente_contexto($1, $2, $3) as ctx',
    [INST, '573009998877', true])).ctx;

  console.log('');
  console.log('  empresa      ' + id);
  console.log('  instancia    ' + INST);
  console.log('  productos    ' + n.n);
  console.log('  herramientas que ve el agente: ' +
    ((t.config && t.config.herramientas) || []).map((h) => h.clave).join(', '));
  console.log('');
  console.log('Para correrle los escenarios:');
  console.log('  PRUEBAS_COMPANY_ID=' + id + ' PRUEBAS_INSTANCIA=' + INST +
              ' PRUEBAS_ESCENARIOS=escenarios-tienda.json node pruebas/calidad/correr-pruebas.cjs');

  await c.end(); process.exit(0);
})().catch((e) => { console.error('falló: ' + e.message); process.exit(1); });
