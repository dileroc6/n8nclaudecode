// ============================================================================
// Ojo con `process.exit()` DENTRO del try: se salta el `finally`, y el
// `finally` es el que borra la empresa y los usuarios que esta prueba creó.
// Por eso aquí se usa `throw`.
// ¿Funciona la pantalla de campañas, de verdad?
// ----------------------------------------------------------------------------
// Es la pantalla de más riesgo del portal: un error aquí **le escribe a
// clientes de verdad**. No se puede quedar en «compila».
//
// Corre las MISMAS consultas que hace `campanas.html`, con sesión real de un
// miembro y el RLS puesto. Lo que protege:
//
//   1. que un cliente no cuente ni vea los contactos de otro —el segmentador
//      hace un `count` sobre `contacts`, y si el RLS no lo cubriera el número
//      que sale en pantalla sería el de toda la plataforma
//   2. que NO se pueda disparar una campaña a nombre de otra empresa
//   3. que el modo prueba viaje en el evento: sin `test: true` un ensayo sale
//      por WhatsApp real
//   4. que borrar una campaña de otro no se pueda
//
// No usa IA: se puede correr aunque el agente esté sin saldo.
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
const MAIL_A = 'zz-camp-a-' + SELLO + '@toqueflow.com';
const MAIL_B = 'zz-camp-b-' + SELLO + '@toqueflow.com';

const fallos = [];
const check = (c, q, d) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + q + (c ? '' : '   ← ' + d));
  if (!c) fallos.push(q);
};

const admin = async (m, r, b) => {
  const x = await fetch(URL + '/auth/v1/admin/' + r, { method: m,
    headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined });
  const t = await x.text(); try { return JSON.parse(t); } catch (e) { return null; }
};

const entrar = async (email) => {
  const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }) });
  return (await r.json()).access_token;
};

const rest = async (token, metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + '/rest/v1/' + ruta, { method: metodo,
    headers: Object.assign({ apikey: ANON, Authorization: 'Bearer ' + token,
                             'Content-Type': 'application/json' }, extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j, headers: r.headers };
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  let empA, empB, uidA, uidB;
  try {
    empA = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Camp A ' + SELLO, 'zz-camp-a-' + SELLO])).id;
    empB = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Camp B ' + SELLO, 'zz-camp-b-' + SELLO])).id;

    // A tiene 3 contactos; B tiene 7. Números distintos a propósito: si el
    // conteo se filtrara, A vería 10 y eso se nota.
    for (let i = 0; i < 3; i++)
      await c.query("insert into public.contacts (company_id, phone, full_name, source) values ($1,$2,$3,'whatsapp')",
        [empA, '57300100' + String(1000 + i), 'A' + i]);
    for (let i = 0; i < 7; i++)
      await c.query("insert into public.contacts (company_id, phone, full_name, source) values ($1,$2,$3,'whatsapp')",
        [empB, '57300200' + String(1000 + i), 'B' + i]);

    const a1 = await admin('POST', 'users', { email: MAIL_A, password: PASS, email_confirm: true });
    const a2 = await admin('POST', 'users', { email: MAIL_B, password: PASS, email_confirm: true });
    uidA = a1 && a1.id; uidB = a2 && a2.id;
    if (!uidA || !uidB) { throw new Error('no pude crear los usuarios: ' + JSON.stringify(a1) + ' | ' + JSON.stringify(a2)); }
    await c.query("update public.profiles set role='member', status='active', company_id=$1 where id=$2", [empA, uidA]);
    await c.query("update public.profiles set role='member', status='active', company_id=$1 where id=$2", [empB, uidB]);

    const tA = await entrar(MAIL_A), tB = await entrar(MAIL_B);
    if (!tA || !tB) { throw new Error('no pude iniciar sesión'); }

    console.log('\n── El segmentador cuenta SOLO lo suyo ──');
    // Tal cual la pantalla: count exacto, head, filtrado por empresa.
    const cnt = await rest(tA, 'GET', 'contacts?select=id&company_id=eq.' + empA,
      null, { Prefer: 'count=exact', Range: '0-0' });
    const rango = cnt.headers.get('content-range') || '';
    const total = Number(String(rango).split('/')[1]);
    check(total === 3, 'A cuenta sus 3 contactos, no los 10 que hay',
      'contó ' + total + ' (rango ' + rango + ') — un conteo que se filtra le dice al cliente que tiene el doble de gente');

    const lista = await rest(tA, 'GET', 'contacts?select=full_name,phone&company_id=eq.' + empA);
    check(Array.isArray(lista.data) && lista.data.length === 3,
      'y la lista de destinatarios también', JSON.stringify(lista.data).slice(0, 120));

    const espia = await rest(tA, 'GET', 'contacts?select=full_name&company_id=eq.' + empB);
    check(Array.isArray(espia.data) && espia.data.length === 0,
      'pedir los de OTRA empresa devuelve vacío',
      'devolvió ' + (Array.isArray(espia.data) ? espia.data.length : JSON.stringify(espia.data)));

    console.log('\n── Guardar y disparar una campaña ──');
    const camp = await rest(tA, 'POST', 'campaigns', {
      company_id: empA, name: 'ZZ prueba ' + SELLO, message_template: 'Hola, es una prueba',
      status: 'borrador', quantity: 3, batch_size: 1,
    }, { Prefer: 'return=representation' });
    check(camp.ok && camp.data && camp.data[0], 'puede guardar su campaña',
      'HTTP ' + camp.status + ' ' + JSON.stringify(camp.data).slice(0, 200));
    const campId = camp.data && camp.data[0] && camp.data[0].id;

    // El evento, exactamente como lo arma la pantalla en modo prueba.
    const ev = await rest(tA, 'POST', 'n8n_events', {
      company_id: empA, event: 'ejecutar_campana',
      payload: { campaign_id: campId, mensaje: 'Hola, es una prueba', cantidad: 3, test: true },
    }, { Prefer: 'return=representation' });
    check(ev.ok, 'puede disparar la campaña', 'HTTP ' + ev.status + ' ' + JSON.stringify(ev.data).slice(0, 200));

    const guardado = await uno("select payload from public.n8n_events where company_id=$1 and event='ejecutar_campana' order by created_at desc limit 1", [empA]);
    check(guardado && guardado.payload && guardado.payload.test === true,
      'y el modo prueba VIAJA en el evento',
      JSON.stringify(guardado && guardado.payload) +
      ' — sin `test: true` un ensayo sale por WhatsApp real a clientes de verdad');

    console.log('\n── Nadie dispara a nombre de otro ──');
    const suplanta = await rest(tB, 'POST', 'n8n_events', {
      company_id: empA, event: 'ejecutar_campana',
      payload: { campaign_id: campId, mensaje: 'mensaje de un intruso', cantidad: 999 },
    });
    check(!suplanta.ok, 'B NO puede encolar una campaña para A',
      'HTTP ' + suplanta.status + ' ' + JSON.stringify(suplanta.data).slice(0, 160) +
      ' — si pudiera, cualquiera con una cuenta le escribe a los clientes de otro');

    const verAjena = await rest(tB, 'GET', 'campaigns?select=*&company_id=eq.' + empA);
    check(Array.isArray(verAjena.data) && verAjena.data.length === 0,
      'ni ver sus campañas', JSON.stringify(verAjena.data).slice(0, 160));

    if (campId) {
      const borrarAjena = await rest(tB, 'DELETE', 'campaigns?id=eq.' + campId);
      const sigue = await uno('select id from public.campaigns where id = $1', [campId]);
      check(!!sigue, 'ni borrarlas',
        'HTTP ' + borrarAjena.status + ' — la campaña de A desapareció');
    }

  } finally {
    if (uidA) await admin('DELETE', 'users/' + uidA);
    if (uidB) await admin('DELETE', 'users/' + uidB);
    for (const e of [empA, empB]) if (e) await c.query('delete from public.companies where id = $1', [e]);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
