// ============================================================================
// ¿La consola de verdad guarda cómo cobra un cliente?
// ----------------------------------------------------------------------------
// Corre las MISMAS consultas que hace la pantalla, con una sesión real de super
// admin y el RLS puesto — no con el rol de servicio, que ve todo y por tanto no
// prueba nada.
//
// Lo que protege:
//
//   1. que el super admin pueda leer y ESCRIBIR `tienda_cobro` (el upsert de la
//      pantalla falla en silencio si la política de escritura no lo cubre, y la
//      pantalla se ve como si hubiera guardado)
//   2. que un cliente NO pueda ver cómo cobra otro
//   3. que lo que se prende aquí sea exactamente lo que el agente ve allá
//
// Crea su propia empresa y su propio usuario, y los borra.
// ============================================================================
const fs = require('fs');
const path = require('path');
const PLAT = path.join(__dirname, '..', '..');

fs.readFileSync(path.join(PLAT, 'credentials.env'), 'utf8').split('\n').forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { Client } = require(path.join(PLAT, 'node_modules', 'pg'));

const SELLO = Date.now().toString(36);
const EMAIL_ADMIN = 'zz-cobro-admin-' + SELLO + '@toqueflow.com';
const EMAIL_OTRO  = 'zz-cobro-otro-'  + SELLO + '@toqueflow.com';
const PASS = 'Pr' + Math.random().toString(36).slice(2) + '!Aa9';

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
  const t = await r.text();
  try { return JSON.parse(t); } catch (e) { return null; }
};

const entrar = async (email) => {
  const r = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  return (await r.json()).access_token;
};

const rest = async (token, metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + '/rest/v1/' + ruta, {
    method: metodo,
    headers: Object.assign({ apikey: ANON, Authorization: 'Bearer ' + token,
                             'Content-Type': 'application/json' }, extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  let empA, empB, uidAdmin, uidOtro;
  try {
    empA = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Cobro A ' + SELLO, 'zz-cobro-a-' + SELLO])).id;
    empB = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Cobro B ' + SELLO, 'zz-cobro-b-' + SELLO])).id;

    const a1 = await admin('POST', 'users', { email: EMAIL_ADMIN, password: PASS, email_confirm: true });
    const a2 = await admin('POST', 'users', { email: EMAIL_OTRO,  password: PASS, email_confirm: true });
    uidAdmin = a1 && a1.id; uidOtro = a2 && a2.id;
    if (!uidAdmin || !uidOtro) { console.error('no pude crear los usuarios de prueba'); process.exit(2); }

    await c.query("update public.profiles set role='super_admin', status='active' where id=$1", [uidAdmin]);
    // El otro es un miembro normal de la empresa B. Es el que no debe ver lo de A.
    await c.query("update public.profiles set role='member', status='active', company_id=$1 where id=$2", [empB, uidOtro]);

    const tAdmin = await entrar(EMAIL_ADMIN);
    const tOtro  = await entrar(EMAIL_OTRO);
    if (!tAdmin || !tOtro) { console.error('no pude iniciar sesión'); process.exit(2); }

    console.log('\n── Lo que hace la pantalla al prender una casilla ──');
    // Exactamente el upsert del componente.
    const guardar = await rest(tAdmin, 'POST', 'tienda_cobro',
      { company_id: empA, transferencia: true, link: false, efectivo: false,
        datos_cuenta: 'Bancolombia ahorros 111-222333-44', avisar_a: '573001112233' },
      { Prefer: 'resolution=merge-duplicates,return=representation' });
    check(guardar.ok, 'el super admin puede guardar',
      'HTTP ' + guardar.status + ' ' + JSON.stringify(guardar.data).slice(0, 200) +
      ' — si la política de escritura no lo cubre, la pantalla se ve como si hubiera guardado y no guardó');

    const leer = await rest(tAdmin, 'GET', 'tienda_cobro?company_id=eq.' + empA);
    check(leer.ok && leer.data.length === 1 && leer.data[0].transferencia === true,
      'y lo vuelve a leer al recargar', JSON.stringify(leer.data).slice(0, 200));

    console.log('\n── Prender otra casilla no borra lo anterior ──');
    const antes = leer.data[0];
    const otra = await rest(tAdmin, 'POST', 'tienda_cobro',
      Object.assign({}, antes, { link: true }),
      { Prefer: 'resolution=merge-duplicates,return=representation' });
    check(otra.ok, 'guarda el segundo método', 'HTTP ' + otra.status);
    const dos = await rest(tAdmin, 'GET', 'tienda_cobro?company_id=eq.' + empA);
    check(dos.data[0].transferencia === true && dos.data[0].link === true,
      'quedan los dos prendidos a la vez', JSON.stringify(dos.data[0]));
    check(dos.data[0].datos_cuenta === 'Bancolombia ahorros 111-222333-44',
      'y los datos de la cuenta siguen ahí',
      JSON.stringify(dos.data[0].datos_cuenta) + ' — un upsert que pisa los campos que no tocó borraría la cuenta del cliente');

    console.log('\n── Nadie ve cómo cobra otro ──');
    const espia = await rest(tOtro, 'GET', 'tienda_cobro?company_id=eq.' + empA);
    check(espia.ok && Array.isArray(espia.data) && espia.data.length === 0,
      'un miembro de otra empresa NO ve esa configuración',
      'HTTP ' + espia.status + ' ' + JSON.stringify(espia.data).slice(0, 200) +
      ' — ahí adentro va un número de cuenta bancaria');

    const intruso = await rest(tOtro, 'POST', 'tienda_cobro',
      { company_id: empA, link: true, transferencia: false },
      { Prefer: 'resolution=merge-duplicates' });
    check(!intruso.ok, 'y tampoco la puede cambiar',
      'HTTP ' + intruso.status + ' ' + JSON.stringify(intruso.data).slice(0, 160));

    console.log('\n── Lo que se prende aquí es lo que ve el agente ──');
    const visto = (await uno('select public.tf_cobro_de($1) as r', [empA])).r;
    check(visto.configurado === true && visto.metodos.length === 2,
      'el agente ve los dos métodos que se prendieron', JSON.stringify(visto.metodos));
    check(visto.datos_cuenta === 'Bancolombia ahorros 111-222333-44',
      'y los datos de la cuenta exactamente como se escribieron',
      JSON.stringify(visto.datos_cuenta) + ' — el agente los dicta, no los recuerda');

    const sinNada = (await uno('select public.tf_cobro_de($1) as r', [empB])).r;
    check(sinNada.configurado === false,
      'una empresa sin configurar sale como no configurada', JSON.stringify(sinNada));

  } finally {
    if (uidAdmin) await admin('DELETE', 'users/' + uidAdmin);
    if (uidOtro)  await admin('DELETE', 'users/' + uidOtro);
    for (const e of [empA, empB]) if (e) await c.query('delete from public.companies where id = $1', [e]);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
