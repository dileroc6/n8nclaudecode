// ============================================================================
// Ojo con `process.exit()` DENTRO del try: se salta el `finally`, y el
// `finally` es el que borra la empresa y los usuarios que esta prueba creó.
// Por eso aquí se usa `throw`.
// Las cuatro pantallas que faltaban: dashboard, ajustes, perfil y modo prueba
// ----------------------------------------------------------------------------
// Hasta ahora de estas solo se comprobaba que COMPILARAN. Compilar dice que la
// página abre; no dice que muestre lo correcto, y sobre todo no dice que un
// cliente no esté viendo lo de otro.
//
// Corre las MISMAS consultas que hacen, con sesión real y el RLS puesto. Se
// montan DOS empresas con datos distintos, porque la pregunta que importa solo
// se puede contestar habiendo otro cliente al lado.
//
// Lo que más pesa aquí es `ajustes`: ahí vive el tono del agente, su
// conocimiento y los números a los que escala. Que eso se filtre es peor que
// filtrar una lista de contactos.
//
// No usa IA: corre aunque el agente esté sin saldo.
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
const MAIL_A = 'zz-pant-a-' + SELLO + '@toqueflow.com';
const MAIL_B = 'zz-pant-b-' + SELLO + '@toqueflow.com';

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
  for (let i = 1; i <= 3; i++) {
    const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: PASS }) });
    const j = await r.json();
    if (j.access_token) return j.access_token;
    await new Promise((s) => setTimeout(s, 1500 * i));
  }
  return null;
};

const rest = async (token, metodo, ruta, cuerpo) => {
  const r = await fetch(URL + '/rest/v1/' + ruta, { method: metodo,
    headers: { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

const cuantos = (r) => Array.isArray(r.data) ? r.data.length : -1;
// La API a veces devuelve un timeout en vez de una lista. Sin esto la prueba
// se cae con un error de JavaScript en vez de decir QUE fallo — y una prueba
// que revienta no dice nada de lo que estaba probando.
const filas = (r) => Array.isArray(r.data) ? r.data : [];

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  let empA, empB, uidA, uidB;
  try {
    empA = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Pant A ' + SELLO, 'zz-pant-a-' + SELLO])).id;
    empB = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Pant B ' + SELLO, 'zz-pant-b-' + SELLO])).id;

    // Datos distintos a cada lado, para que un cruce se note.
    const insA = 'zz-pant-a-' + SELLO, insB = 'zz-pant-b-' + SELLO;
    await c.query(`insert into public.agent_config (company_id, whatsapp_instance, activo, identidad, enrutamiento)
      values ($1,$2,false,$3::jsonb,$4::jsonb)`,
      [empA, insA, JSON.stringify({ tono: 'EL TONO SECRETO DE A' }),
       JSON.stringify({ reglas: [{ si: 'reclama', accion: 'notificar_humano', destino: '573001110000' }] })]);
    await c.query(`insert into public.agent_config (company_id, whatsapp_instance, activo, identidad)
      values ($1,$2,false,$3::jsonb)`,
      [empB, insB, JSON.stringify({ tono: 'el tono de B' })]);

    await c.query(`insert into public.agent_knowledge (company_id, tipo, titulo, contenido, activo, orden)
      values ($1,'manual','Precios de A','La membresia de A vale 999.999',true,1)`, [empA]);

    const cidA = (await uno(`insert into public.contacts (company_id, phone, full_name, source)
      values ($1,'573009990001','Cliente de A','whatsapp') returning id`, [empA])).id;
    await c.query(`insert into public.contacts (company_id, phone, full_name, source)
      values ($1,'573009990002','Cliente de B','whatsapp')`, [empB]);

    await c.query(`insert into public.contact_saldo (contact_id, company_id, unidades) values ($1,$2,7)`, [cidA, empA]);
    await c.query(`insert into public.test_messages (company_id, telefono, direction, body, flow)
      values ($1,'573009990001','out','conversacion privada del sandbox de A','cliente')`, [empA]);

    const a1 = await admin('POST', 'users', { email: MAIL_A, password: PASS, email_confirm: true });
    const a2 = await admin('POST', 'users', { email: MAIL_B, password: PASS, email_confirm: true });
    uidA = a1 && a1.id; uidB = a2 && a2.id;
    if (!uidA || !uidB) { throw new Error('no pude crear los usuarios: ' + JSON.stringify(a1)); }
    await c.query("update public.profiles set role='member', status='active', company_id=$1, full_name='Ana de A' where id=$2", [empA, uidA]);
    await c.query("update public.profiles set role='member', status='active', company_id=$1, full_name='Beto de B' where id=$2", [empB, uidB]);

    const tA = await entrar(MAIL_A), tB = await entrar(MAIL_B);
    if (!tA || !tB) { throw new Error('no pude iniciar sesión'); }

    // ── DASHBOARD ─────────────────────────────────────────────────────────
    console.log('\n── dashboard: la puerta de entrada del cliente ──');
    for (const tabla of ['flows', 'contacts', 'campaigns', 'ai_usage', 'message_log', 'sedes']) {
      const r = await rest(tA, 'GET', tabla + '?select=*&limit=50');
      check(r.ok, 'puede leer ' + tabla, 'HTTP ' + r.status + ' ' + JSON.stringify(r.data).slice(0, 120) +
        ' — si una sola falla, el dashboard sale en blanco y el cliente cree que no tiene nada');
    }
    const contA = await rest(tA, 'GET', 'contacts?select=full_name');
    check(cuantos(contA) === 1 && contA.data[0].full_name === 'Cliente de A',
      've SU contacto y solo el suyo', JSON.stringify(contA.data).slice(0, 140));

    const emp = await rest(tA, 'GET', 'companies?select=id,name');
    check(cuantos(emp) === 1 && emp.data[0].id === empA,
      'y solo su propia empresa', JSON.stringify(emp.data).slice(0, 140) +
      ' — el nombre del negocio sale en el encabezado de todas las pantallas');

    // ── AJUSTES ───────────────────────────────────────────────────────────
    console.log('\n── ajustes: aquí vive el tono, el saber y a quién escala ──');
    const cfgA = await rest(tA, 'GET', 'agent_config?select=*');
    check(cuantos(cfgA) === 1, 'A ve la configuración de su agente', 'vio ' + cuantos(cfgA));
    check(cuantos(cfgA) === 1 && JSON.stringify(cfgA.data[0].identidad).includes('SECRETO DE A'),
      'y es la suya', JSON.stringify(cfgA.data).slice(0, 140));

    const cfgB = await rest(tB, 'GET', 'agent_config?select=*');
    const filtrado = filas(cfgB).some((x) => JSON.stringify(x).includes('SECRETO DE A'));
    check(!filtrado, 'B NO ve el tono ni los números de escalación de A',
      JSON.stringify(cfgB.data).slice(0, 200) +
      ' — ahí van las palabras del negocio y los teléfonos a los que se avisa');

    const savA = await rest(tA, 'GET', 'agent_knowledge?select=titulo,contenido');
    check(cuantos(savA) === 1, 'A ve su conocimiento', 'vio ' + cuantos(savA));
    const savB = await rest(tB, 'GET', 'agent_knowledge?select=titulo,contenido');
    check(!filas(savB).some((x) => String(x.contenido).includes('999.999')),
      'B NO ve los precios de A',
      JSON.stringify(savB.data).slice(0, 160) + ' — el conocimiento lleva precios y políticas');

    const mis = await rest(tA, 'GET', 'mis_agentes?select=*');
    check(mis.ok, 'la vista mis_agentes responde', 'HTTP ' + mis.status + ' ' + JSON.stringify(mis.data).slice(0, 140));
    check(!filas(mis).some((x) => JSON.stringify(x).includes(insB)),
      'y no trae agentes de otro', JSON.stringify(mis.data).slice(0, 160));

    // ── PERFIL ────────────────────────────────────────────────────────────
    console.log('\n── perfil ──');
    const perf = await rest(tA, 'GET', 'profiles?select=id,full_name,email');
    check(cuantos(perf) >= 1 && perf.data.some((x) => x.id === uidA),
      'A se ve a sí mismo', JSON.stringify(perf.data).slice(0, 140));
    check(!filas(perf).some((x) => x.id === uidB),
      'y NO ve al usuario de otra empresa',
      JSON.stringify(perf.data).slice(0, 180) + ' — ahí va el correo de una persona');

    const cambio = await rest(tA, 'PATCH', 'profiles?id=eq.' + uidA, { full_name: 'Ana cambiada' });
    const verNombre = await uno('select full_name from public.profiles where id = $1', [uidA]);
    check(verNombre.full_name === 'Ana cambiada', 'puede cambiar su propio nombre',
      'HTTP ' + cambio.status + ' quedó «' + verNombre.full_name + '»');

    await rest(tB, 'PATCH', 'profiles?id=eq.' + uidA, { full_name: 'INTRUSO' });
    const sigue = await uno('select full_name from public.profiles where id = $1', [uidA]);
    check(sigue.full_name !== 'INTRUSO', 'y B NO puede cambiarle el nombre a A',
      'quedó «' + sigue.full_name + '»');

    // ── MODO PRUEBA ───────────────────────────────────────────────────────
    console.log('\n── modo prueba: el sandbox es una conversación privada ──');
    const tmA = await rest(tA, 'GET', 'test_messages?select=body,telefono');
    check(cuantos(tmA) === 1, 'A ve su chat de prueba', 'vio ' + cuantos(tmA));
    const tmB = await rest(tB, 'GET', 'test_messages?select=body');
    check(!filas(tmB).some((x) => String(x.body).includes('privada del sandbox de A')),
      'B NO ve la conversación de prueba de A',
      JSON.stringify(tmB.data).slice(0, 160) + ' — el sandbox es donde el cliente ensaya, y ensaya con lo suyo');

    const saldoA = await rest(tA, 'GET', 'contact_saldo?select=unidades');
    check(cuantos(saldoA) === 1 && Number(saldoA.data[0].unidades) === 7,
      'y ve el saldo con el que está ensayando', JSON.stringify(saldoA.data).slice(0, 120));

    const catA = await rest(tA, 'GET', 'empresa_catalogo?select=clave,estado_empresa&limit=5');
    check(catA.ok, 'la vista empresa_catalogo responde',
      'HTTP ' + catA.status + ' ' + JSON.stringify(catA.data).slice(0, 140) +
      ' — de ella salen las pestañas que el cliente ve en el sandbox');

  } finally {
    if (uidA) await admin('DELETE', 'users/' + uidA);
    if (uidB) await admin('DELETE', 'users/' + uidB);
    for (const e of [empA, empB]) if (e) await c.query('delete from public.companies where id = $1', [e]);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
