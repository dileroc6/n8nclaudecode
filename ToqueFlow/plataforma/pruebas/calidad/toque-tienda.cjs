/* ============================================================================
 * Toque Tienda: buscar en el catálogo y dejar el pedido armado
 * ----------------------------------------------------------------------------
 * LO QUE ESTA PRUEBA EXISTE PARA PROTEGER:
 *
 *   1. el precio de un pedido sale del CATÁLOGO, nunca del modelo
 *   2. el agente ARMA pedidos, no los confirma
 *   3. nadie ve los pedidos de otra persona
 *   4. «no sé si hay» y «no hay» son respuestas distintas
 *   5. «ya pagué» queda ANOTADO, nunca dado por cierto
 *   6. el agente ofrece la talla que HAY, y sabe si su dato está viejo
 *
 * La 1 importa más de lo que parece: si el agente pudiera poner el precio,
 * quien escriba «me dijeron que valía 10.000» acabaría con un pedido a 10.000.
 *
 * Monta su propia empresa y la borra al final.
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, 'credentials.env'), 'utf8').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const { Client } = require(path.join(ROOT, 'node_modules', 'pg'));

const fallos = [];
const check = (c, q, d) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + q + (c ? '' : '   ← ' + d));
  if (!c) fallos.push(q);
};

const SELLO = Date.now().toString(36);
const INST = 'zz-tienda-' + SELLO;
const TEL  = '573005' + String(Date.now()).slice(-6);
const TEL2 = '573004' + String(Date.now()).slice(-6);

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];
  const llamar = async (fn, p) => (await uno('select public.' + fn + '($1::jsonb) as r', [JSON.stringify(p)])).r;
  let empresa;
  let borrarUsuario = async () => {};
  let pid, creado, usuario;

  try {
    empresa = (await uno(`insert into public.companies (name, slug, status)
      values ($1, $2, 'active') returning id`, ['ZZ Tienda ' + SELLO, 'zz-tienda-' + SELLO])).id;
    await c.query('insert into public.agent_config (company_id, whatsapp_instance, activo) values ($1,$2,true)', [empresa, INST]);
    const cid = (await uno(`insert into public.contacts (company_id, phone, full_name, source)
      values ($1,$2,'Cliente uno','whatsapp') returning id`, [empresa, TEL])).id;
    const cid2 = (await uno(`insert into public.contacts (company_id, phone, full_name, source)
      values ($1,$2,'Cliente dos','whatsapp') returning id`, [empresa, TEL2])).id;

    console.log('\n── El catálogo vacío se dice, no se inventa ──');
    const vacio = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'guantes' });
    check(vacio.ok === false && /catalogo/.test(vacio.motivo),
      'sin catálogo cargado lo dice, y no responde «no encontré»', JSON.stringify(vacio));

    // El sincronizador metería esto. Aquí se mete a mano.
    await c.query(`insert into public.productos (company_id, sku, nombre, descripcion, precio_cop, existencias, origen)
      values ($1,'G-100','Guantes de nitrilo talla M','Caja por 100 unidades', 45000, 12, 'prueba'),
             ($1,'G-200','Guantes de carnaza','Para soldadura', 28000, 0, 'prueba'),
             ($1,'L-050','Limpiador para guantes',null, 9000, null, 'prueba'),
             ($1,'M-900','Martillo de uña','Mango de fibra', 32000, 4, 'prueba')`, [empresa]);

    console.log('\n── Buscar ──');
    const b = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'guantes' });
    check(b.ok === true && b.encontrados === 3, 'encuentra los tres que dicen guantes', JSON.stringify(b).slice(0, 200));
    check(b.productos[0].sku === 'G-100' || b.productos[0].sku === 'G-200',
      'lo que EMPIEZA por lo buscado va primero, no el limpiador', JSON.stringify(b.productos.map((x) => x.sku)));
    check(b.catalogo_al != null, 'dice de cuándo es el catálogo', 'sin fecha, el agente afirmaría existencias viejas como si fueran de ahora');

    const tilde = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'MARTÍLLO' });
    check(tilde.encontrados === 1, 'busca sin que importen tildes ni mayúsculas', JSON.stringify(tilde).slice(0, 150));

    console.log('\n── «No sé» y «no hay» son distintos ──');
    const g = b.productos.find((x) => x.sku === 'G-200');
    const l = b.productos.find((x) => x.sku === 'L-050');
    check(g.existencias === 0, 'el que no tiene existencias dice 0', JSON.stringify(g));
    check(l.existencias === null, 'el que no se sabe dice null, no 0', JSON.stringify(l) + ' — decir «no hay» cuando no se sabe es una venta perdida');

    console.log('\n── El precio sale del catálogo, NUNCA del modelo ──');
    const ped = await llamar('tf_tool_crear_pedido', {
      instance: INST, telefono: TEL, dicho: 'quiero dos cajas de guantes',
      items: [{ sku: 'G-100', cantidad: 2, precio_cop: 10 }],   // el modelo intenta poner el precio
    });
    check(ped.ok === true && ped.total === 90000,
      'ignora el precio que mande el modelo y usa el del catálogo (2 × 45.000)', JSON.stringify(ped));
    check(ped.aplicado === false, 'el pedido queda ARMADO, no confirmado', JSON.stringify(ped));

    const est = await uno('select estado from public.pedidos where company_id = $1', [empresa]);
    check(est.estado === 'armado', 'y en la base también dice armado', JSON.stringify(est));

    console.log('\n── Lo que no existe no entra ──');
    const inv = await llamar('tf_tool_crear_pedido', {
      instance: INST, telefono: TEL, items: [{ sku: 'NO-EXISTE', cantidad: 1 }] });
    check(inv.ok === false, 'un pedido con solo productos inexistentes se rechaza', JSON.stringify(inv));
    const cuantos = await uno('select count(*)::int n from public.pedidos where company_id = $1', [empresa]);
    check(cuantos.n === 1, 'y no deja un pedido vacío tirado', 'hay ' + cuantos.n);

    console.log('\n── Cada quien ve solo sus pedidos ──');
    const mios = await llamar('tf_tool_estado_pedido', { instance: INST, telefono: TEL });
    check(mios.tiene === true && mios.pedidos.length === 1, 'quien lo pidió ve el suyo', JSON.stringify(mios).slice(0, 150));
    const ajeno = await llamar('tf_tool_estado_pedido', { instance: INST, telefono: TEL2, numero: '1' });
    check(ajeno.tiene === false,
      'otra persona NO ve el pedido número 1', JSON.stringify(ajeno) + ' — preguntar por el 1 no da derecho a ver el 1 de otro');

    console.log('\n── Solo una persona con sesión confirma ──');
    pid = (await uno('select id from public.pedidos where company_id = $1', [empresa])).id;
    const sin = (await uno('select public.tf_pedido_resolver($1, $2, null) as r', [pid, 'confirmado'])).r;
    check(sin.ok === false, 'sin sesión no se puede confirmar', JSON.stringify(sin));

    // Un usuario de VERDAD: `profiles.id` apunta a `auth.users`, asi que una
    // fila suelta no se puede insertar. Se crea por la API de Auth y se borra
    // al final — una prueba que deja usuarios vivos acaba siendo un problema de
    // seguridad, no de orden.
    const admin = async (metodo, ruta, cuerpo) => {
      const r = await fetch(env.SUPABASE_URL + '/auth/v1/admin/' + ruta, {
        method: metodo,
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                   Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
                   'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const t = await r.text();
      try { return JSON.parse(t); } catch (e) { return null; }
    };
    creado = await admin('POST', 'users', {
      email: 'zz-tienda-' + SELLO + '@toqueflow.com',
      password: 'Prueba-' + SELLO + '-Ax9', email_confirm: true });
    usuario = creado && creado.id;
    if (usuario) await c.query('update public.profiles set company_id = $1 where id = $2', [empresa, usuario]);
    borrarUsuario = async () => { if (usuario) await admin('DELETE', 'users/' + usuario); };

    if (usuario) {
      await c.query("select set_config('request.jwt.claims', $1, false)",
        [JSON.stringify({ sub: usuario, role: 'authenticated' })]);
      const ok = (await uno('select public.tf_pedido_resolver($1, $2, $3) as r', [pid, 'confirmado', 'verificado'])).r;
      check(ok.ok === true && ok.estado === 'confirmado', 'un miembro de la empresa sí confirma', JSON.stringify(ok));
      const dos = (await uno('select public.tf_pedido_resolver($1, $2, null) as r', [pid, 'confirmado'])).r;
      check(dos.ok === false, 'y no se confirma dos veces', JSON.stringify(dos));
      await c.query("select set_config('request.jwt.claims', '', false)");
    } else {
      console.log('  ·  (no se pudo crear el usuario de prueba: se salta la confirmación)');
    }

    console.log('\n── «Ya pagué» se anota, no se cree ──');
    const pg1 = await llamar('tf_tool_confirmar_pago', { instance: INST, telefono: TEL, referencia: '4471', dicho: 'ya pagué por Nequi' });
    check(pg1.ok === true && pg1.pago_estado === 'reportado',
      'queda anotado contra su pedido', JSON.stringify(pg1));
    check(pg1.verificado === false,
      'y dice EXPLÍCITAMENTE que no está verificado',
      JSON.stringify(pg1) + ' — si el agente no lee un «no», lo redondea a «listo»');

    const pg2 = await llamar('tf_tool_confirmar_pago', { instance: INST, telefono: TEL, dicho: 'ya pagué!!' });
    check(pg2.repetido === true, 'insistir no crea un segundo reporte', JSON.stringify(pg2));
    const nrep = await uno('select count(*)::int n from public.pedidos where company_id = $1 and pago_estado = $2', [empresa, 'reportado']);
    check(nrep.n === 1, 'y en la base sigue habiendo uno solo', 'hay ' + nrep.n);

    const ajenoPago = await llamar('tf_tool_confirmar_pago', { instance: INST, telefono: TEL2, numero: '1' });
    check(ajenoPago.ok === false,
      'otra persona NO puede reportar el pago del pedido 1', JSON.stringify(ajenoPago));

    console.log('\n── Verificar un pago es de una persona, no del agente ──');
    const vSin = (await uno('select public.tf_pago_verificar($1, true, null) as r', [pid])).r;
    check(vSin.ok === false, 'sin sesión no se verifica', JSON.stringify(vSin));

    if (usuario) {
      await c.query("select set_config('request.jwt.claims', $1, false)",
        [JSON.stringify({ sub: usuario, role: 'authenticated' })]);
      const vOk = (await uno('select public.tf_pago_verificar($1, true, $2) as r', [pid, 'entró por Nequi'])).r;
      check(vOk.ok === true && vOk.pago_estado === 'verificado', 'un miembro de la empresa sí verifica', JSON.stringify(vOk));
      const band = await uno('select count(*)::int n from public.pagos_por_verificar where company_id = $1', [empresa]);
      check(band.n === 0, 'y sale de la bandeja de por verificar', 'quedan ' + band.n);
      await c.query("select set_config('request.jwt.claims', '', false)");

      const pg3 = await llamar('tf_tool_confirmar_pago', { instance: INST, telefono: TEL, numero: '1' });
      check(pg3.verificado === true && pg3.repetido === true,
        'y si vuelve a escribir, se le dice que ya está verificado', JSON.stringify(pg3));
    }

    console.log('\n── Variantes: ofrecer la talla que hay, no «sí tenemos» ──');
    await c.query(`insert into public.productos (company_id, sku, nombre, precio_cop, existencias, origen, padre_sku, variante)
      values ($1,'CAM','Camiseta de algodón', 55000, null, 'prueba', null, null),
             ($1,'CAM-M','Camiseta de algodón talla M', 55000, 4, 'prueba', 'CAM', '{"talla":"M"}'),
             ($1,'CAM-L','Camiseta de algodón talla L', 55000, 0, 'prueba', 'CAM', '{"talla":"L"}'),
             ($1,'CAM-XL','Camiseta de algodón talla XL', 59000, 7, 'prueba', 'CAM', '{"talla":"XL"}')`, [empresa]);

    const v = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'camiseta' });
    const padre = v.productos.find((x) => x.sku === 'CAM');
    check(padre && padre.presentaciones.length === 3,
      'el agente ve las tres tallas, no solo «camiseta»',
      JSON.stringify(padre && padre.presentaciones).slice(0, 220));
    const laL = padre && padre.presentaciones.find((x) => x.sku === 'CAM-L');
    check(laL && laL.existencias === 0,
      'y sabe que de la L no queda ninguna',
      JSON.stringify(laL) + ' — decir «sí tenemos camisetas» a quien usa L es una venta perdida y un cliente molesto');
    const laXL = padre && padre.presentaciones.find((x) => x.sku === 'CAM-XL');
    check(laXL && Number(laXL.precio) === 59000,
      'cada talla lleva su propio precio', JSON.stringify(laXL));

    const hermana = v.productos.find((x) => x.sku === 'CAM-M');
    check(hermana && hermana.presentaciones.length === 2,
      'y desde una talla se ven las otras dos', JSON.stringify(hermana && hermana.presentaciones).slice(0, 200));

    console.log('\n── El agente sabe si su dato está viejo ──');
    check(v.frescura && v.frescura.estado === 'fresco',
      'recién cargado, el catálogo está fresco', JSON.stringify(v.frescura));
    // Se envejece el catálogo a mano: un dato de hace tres semanas.
    await c.query(`update public.productos set actualizado_at = now() - interval '21 days' where company_id = $1`, [empresa]);
    await c.query(`insert into public.catalogo_fuente (company_id, nivel, plataforma, frescura_min)
      values ($1, 'c', 'prueba', 1440) on conflict (company_id) do update set frescura_min = 1440`, [empresa]);
    const viejo = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'camiseta' });
    check(viejo.frescura.estado === 'viejo', 'a las tres semanas dice que está viejo', JSON.stringify(viejo.frescura));
    check(/viejo/.test(String(viejo.que_decir)),
      'y le dice al agente que lo advierta en vez de prometer', JSON.stringify(viejo.que_decir));

    await c.query(`update public.catalogo_fuente set nivel = 'a' where company_id = $1`, [empresa]);
    const vivo = await llamar('tf_tool_buscar_catalogo', { instance: INST, telefono: TEL, que: 'camiseta' });
    check(vivo.frescura.estado === 'vivo',
      'con la tienda conectada el dato es «vivo» aunque la copia tenga días',
      JSON.stringify(vivo.frescura) + ' — si la tienda avisa cuando algo cambia, la fecha de la copia no dice nada');

    console.log('\n── Qué cambió entre armar el pedido y confirmarlo ──');
    const pedXL = await llamar('tf_tool_crear_pedido', { instance: INST, telefono: TEL,
      items: [{ sku: 'CAM-XL', cantidad: 5 }] });
    const idXL = (await uno(`select id from public.pedidos where company_id = $1 and numero = $2`, [empresa, pedXL.numero])).id;
    const limpio = (await uno('select public.tf_pedido_revisar($1) as r', [idXL])).r;
    check(limpio.revisar.length === 0, 'recién armado no hay nada que revisar', JSON.stringify(limpio.revisar));

    // Mientras el pedido esperaba, alguien más se llevó el inventario y
    // subió el precio. Es exactamente lo que pasa en un día normal.
    await c.query(`update public.productos set existencias = 2, precio_cop = 65000 where company_id = $1 and sku = 'CAM-XL'`, [empresa]);
    const ojo = (await uno('select public.tf_pedido_revisar($1) as r', [idXL])).r;
    check(ojo.revisar.length === 1, 'ahora sí hay algo que mirar antes de confirmar', JSON.stringify(ojo.revisar));
    check(ojo.revisar[0].hay === 2 && ojo.revisar[0].pedidas === 5,
      'dice que se pidieron 5 y solo quedan 2', JSON.stringify(ojo.revisar[0]));
    check(Number(ojo.revisar[0].precio_pedido) === 59000 && Number(ojo.revisar[0].precio_hoy) === 65000,
      'y que el precio se movió desde que se le prometió',
      JSON.stringify(ojo.revisar[0]) + ' — el pedido conserva lo que se le dijo a la persona');

  } finally {
    await c.query("select set_config('request.jwt.claims', '', false)").catch(() => {});
    await borrarUsuario().catch(() => {});
    if (empresa) await c.query('delete from public.companies where id = $1', [empresa]);
    const q = await c.query('select count(*)::int n from public.productos where company_id = $1', [empresa]);
    check(q.rows[0].n === 0, 'al borrar la empresa se lleva su catálogo (cascade)', 'quedan ' + q.rows[0].n);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
