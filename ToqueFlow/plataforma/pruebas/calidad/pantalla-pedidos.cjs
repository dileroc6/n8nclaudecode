// ============================================================================
// ¿Funciona la pantalla de pedidos, de verdad?
// ----------------------------------------------------------------------------
// Corre EXACTAMENTE las consultas que hace `pedidos.html`, con una sesión real
// de un miembro del cliente y el RLS puesto — no con el rol de servicio, que ve
// todo y por tanto no prueba nada.
//
// Lo que protege:
//
//   1. que el cliente vea SUS pedidos y no los de otro
//   2. que la consulta con `contacts` anidado funcione bajo RLS (si la política
//      de contactos no lo cubre, la pantalla sale con todos los nombres vacíos
//      y nadie sabe por qué)
//   3. que los botones hagan lo que dicen: confirmar, rechazar, verificar pago
//   4. que un pedido sin contacto NO desaparezca de la lista
//
// Monta su propia empresa y la borra.
// ============================================================================
const fs = require('fs');
const path = require('path');
const PLAT = path.join(__dirname, '..', '..');

fs.readFileSync(path.join(PLAT, 'credentials.env'), 'utf8').split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { Client } = require(path.join(PLAT, 'node_modules', 'pg'));

const SELLO = Date.now().toString(36);
const PASS = 'Pr' + Math.random().toString(36).slice(2) + '!Aa9';
const EMAIL_A = 'zz-ped-a-' + SELLO + '@toqueflow.com';
const EMAIL_B = 'zz-ped-b-' + SELLO + '@toqueflow.com';

const fallos = [];
const check = (c, q, d) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + q + (c ? '' : '   ← ' + d));
  if (!c) fallos.push(q);
};

const admin = async (metodo, ruta, cuerpo) => {
  const r = await fetch(URL + '/auth/v1/admin/' + ruta, {
    method: metodo,
    headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text(); try { return JSON.parse(t); } catch (e) { return null; }
};

const entrar = async (email) => {
  const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  return (await r.json()).access_token;
};

const rest = async (token, ruta) => {
  const r = await fetch(URL + '/rest/v1/' + ruta,
    { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

const rpc = async (token, fn, args) => {
  const r = await fetch(URL + '/rest/v1/rpc/' + fn, {
    method: 'POST',
    headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

// La consulta TAL CUAL la hace la pantalla.
const CONSULTA = 'pedidos?select=*,contacto:contacts(full_name,phone)&order=created_at.desc&limit=200';

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  let empA, empB, uidA, uidB;
  try {
    empA = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Pedidos A ' + SELLO, 'zz-ped-a-' + SELLO])).id;
    empB = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Pedidos B ' + SELLO, 'zz-ped-b-' + SELLO])).id;

    const a1 = await admin('POST', 'users', { email: EMAIL_A, password: PASS, email_confirm: true });
    const a2 = await admin('POST', 'users', { email: EMAIL_B, password: PASS, email_confirm: true });
    uidA = a1 && a1.id; uidB = a2 && a2.id;
    if (!uidA || !uidB) { console.error('no pude crear los usuarios'); process.exit(2); }
    await c.query("update public.profiles set role='member', status='active', company_id=$1 where id=$2", [empA, uidA]);
    await c.query("update public.profiles set role='member', status='active', company_id=$1 where id=$2", [empB, uidB]);

    // Datos de A: un contacto, un producto, dos pedidos.
    await c.query("insert into public.agent_config (company_id, whatsapp_instance, activo) values ($1,$2,false)",
      [empA, 'zz-ped-' + SELLO]);
    const cid = (await uno(`insert into public.contacts (company_id, phone, full_name, source)
      values ($1,'573001234567','Marcela Ruiz','whatsapp') returning id`, [empA])).id;
    await c.query(`insert into public.productos (company_id, sku, nombre, precio_cop, existencias, origen)
      values ($1,'X-1','Taladro percutor', 250000, 3, 'prueba')`, [empA]);

    const p1 = (await uno(`insert into public.pedidos (company_id, contact_id, numero, estado, total_cop, dicho)
      values ($1,$2,1,'armado',500000,'quiero dos taladros') returning id`, [empA, cid])).id;
    await c.query(`insert into public.pedido_lineas (pedido_id, sku, nombre, cantidad, precio_cop)
      values ($1,'X-1','Taladro percutor',2,250000)`, [p1]);

    // Uno con pago reportado y comprobante.
    const p2 = (await uno(`insert into public.pedidos
        (company_id, contact_id, numero, estado, total_cop, pago_estado, pago_metodo,
         pago_referencia, pago_comprobante_wa_id, pago_reportado_at)
      values ($1,$2,2,'confirmado',250000,'reportado','transferencia','4471','WAMSG123',now())
      returning id`, [empA, cid])).id;

    // Y uno huérfano: el contacto se borró, el pedido no.
    const p3 = (await uno(`insert into public.pedidos (company_id, contact_id, numero, estado, total_cop)
      values ($1, null, 3, 'armado', 90000) returning id`, [empA])).id;

    const tA = await entrar(EMAIL_A), tB = await entrar(EMAIL_B);
    if (!tA || !tB) { console.error('no pude iniciar sesión'); process.exit(2); }

    console.log('\n── Lo que carga la pantalla al abrir ──');
    const r = await rest(tA, CONSULTA);
    check(r.ok, 'la consulta con el contacto anidado funciona bajo RLS',
      'HTTP ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 200) +
      ' — si la política de contactos no la cubre, la pantalla sale con todos los nombres en blanco');
    check(Array.isArray(r.data) && r.data.length === 3, 've sus 3 pedidos',
      'vio ' + (Array.isArray(r.data) ? r.data.length : '?'));

    const uno1 = (r.data || []).find((x) => x.numero === 1);
    check(uno1 && uno1.contacto && uno1.contacto.full_name === 'Marcela Ruiz',
      'y trae el nombre de quien pidió', JSON.stringify(uno1 && uno1.contacto));

    const huerfano = (r.data || []).find((x) => x.numero === 3);
    check(!!huerfano, 'un pedido sin contacto NO desaparece de la lista',
      'esconderlo sería peor: es plata que alguien tiene que resolver');

    console.log('\n── Las líneas y la revisión ──');
    const ls = await rest(tA, 'pedido_lineas?select=*&pedido_id=eq.' + p1);
    check(ls.ok && ls.data.length === 1, 've las líneas del pedido', JSON.stringify(ls.data).slice(0, 150));

    // Alguien se llevó el inventario mientras el pedido esperaba.
    await c.query("update public.productos set existencias = 1 where company_id = $1 and sku = 'X-1'", [empA]);
    const rev = await rpc(tA, 'tf_pedido_revisar', { p_pedido: p1 });
    check(rev.ok && rev.data && rev.data.ok && rev.data.revisar.length === 1,
      'avisa que ya no alcanza antes de confirmar', JSON.stringify(rev.data).slice(0, 220));

    console.log('\n── Nadie ve los pedidos de otro ──');
    const espia = await rest(tB, CONSULTA);
    check(espia.ok && Array.isArray(espia.data) && espia.data.length === 0,
      'el cliente B no ve ni uno de A',
      'HTTP ' + espia.status + ' vio ' + (Array.isArray(espia.data) ? espia.data.length : '?'));
    const espiaRpc = await rpc(tB, 'tf_pedido_resolver', { p_pedido: p1, p_estado: 'confirmado', p_nota: null });
    check(espiaRpc.data && espiaRpc.data.ok === false,
      'y tampoco puede confirmarlo', JSON.stringify(espiaRpc.data));

    console.log('\n── Los botones hacen lo que dicen ──');
    const conf = await rpc(tA, 'tf_pedido_resolver', { p_pedido: p1, p_estado: 'confirmado', p_nota: null });
    check(conf.data && conf.data.ok === true, 'confirmar confirma', JSON.stringify(conf.data));
    const est = await uno('select estado from public.pedidos where id = $1', [p1]);
    check(est.estado === 'confirmado', 'y en la base queda confirmado', est.estado);

    const dos = await rpc(tA, 'tf_pedido_resolver', { p_pedido: p1, p_estado: 'confirmado', p_nota: null });
    check(dos.data && dos.data.ok === false, 'no se confirma dos veces', JSON.stringify(dos.data));

    const pago = await rpc(tA, 'tf_pago_verificar', { p_pedido: p2, p_ok: true, p_nota: 'entró por Nequi' });
    check(pago.data && pago.data.ok === true, 'verificar el pago funciona', JSON.stringify(pago.data));
    const pe = await uno('select pago_estado, pago_comprobante_wa_id from public.pedidos where id = $1', [p2]);
    check(pe.pago_estado === 'verificado', 'y queda verificado', pe.pago_estado);
    check(pe.pago_comprobante_wa_id === 'WAMSG123',
      'el id del comprobante sigue ahí para poder ver la imagen', String(pe.pago_comprobante_wa_id));

    const rechazo = await rpc(tA, 'tf_pedido_resolver', { p_pedido: p3, p_estado: 'rechazado', p_nota: 'sin stock' });
    check(rechazo.data && rechazo.data.ok === true, 'rechazar un pedido sin contacto también funciona',
      JSON.stringify(rechazo.data));

  } finally {
    if (uidA) await admin('DELETE', 'users/' + uidA);
    if (uidB) await admin('DELETE', 'users/' + uidB);
    for (const e of [empA, empB]) if (e) await c.query('delete from public.companies where id = $1', [e]);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
