// test-aislamiento.cjs — Verifica que las politicas RLS realmente aislen a un
//   cliente de otro. Crea un usuario TEMPORAL en la empresa A, inicia sesion
//   como el, e intenta leer y modificar datos de la empresa B. Al final borra
//   el usuario temporal, pase lo que pase.
//
//   No toca cuentas reales. No modifica datos de negocio (los intentos de
//   escritura son sobre la empresa B y deben fallar; si alguno pasa, es
//   exactamente el bug que buscamos y se reporta).
//
// uso:  node test-aislamiento.cjs

const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('='); if (i === -1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv(path.join(__dirname, 'credentials.env'));
const URL = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const ANON = (env.SUPABASE_ANON_KEY || '').trim();
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!URL || !ANON || !SERVICE) {
  console.error('Faltan SUPABASE_URL, SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY en credentials.env');
  process.exit(2);
}

const SH = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };
const svc = (p, o = {}) => fetch(URL + '/rest/v1/' + p, { ...o, headers: { ...SH, ...(o.headers || {}) } });
// Sesion del usuario temporal: apikey anon + su propio access token (como el navegador)
const asUser = (tok) => (p, o = {}) => fetch(URL + '/rest/v1/' + p, {
  ...o, headers: { apikey: ANON, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json', ...(o.headers || {}) },
});

const TEST_EMAIL = 'rls-test-' + Date.now() + '@toqueflow-test.local';
const TEST_PASS = 'Rls' + Math.random().toString(36).slice(2) + '!Aa9';

let uid = null;
const results = [];
function check(nombre, ok, detalle) {
  results.push({ nombre, ok, detalle });
  console.log('  ' + (ok ? '[OK]  ' : '[FALLA] ') + nombre + (detalle ? '  — ' + detalle : ''));
}

async function limpiar() {
  if (!uid) return;
  await fetch(URL + '/auth/v1/admin/users/' + uid, { method: 'DELETE', headers: SH }).catch(() => {});
  await svc('profiles?id=eq.' + uid, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }).catch(() => {});
  console.log('\nUsuario temporal eliminado.');
}

(async () => {
  // 1) Elegir dos empresas que tengan contactos
  const companies = await svc('companies?select=id,name,slug').then(r => r.json());
  if (!Array.isArray(companies) || companies.length < 2) {
    console.error('Se necesitan al menos 2 empresas para probar el aislamiento.'); process.exit(3);
  }
  const conteos = [];
  for (const c of companies) {
    const r = await svc('contacts?company_id=eq.' + c.id + '&select=id', { headers: { Prefer: 'count=exact', Range: '0-0' } });
    const total = Number((r.headers.get('content-range') || '/0').split('/')[1]) || 0;
    conteos.push({ ...c, total });
  }
  conteos.sort((a, b) => b.total - a.total);
  const B = conteos[0];                                   // la que MAS datos tiene: la victima
  const A = conteos.find(c => c.id !== B.id);             // desde donde atacamos
  console.log('Empresa A (sesion):  ' + A.name + '  (' + A.total + ' contactos)');
  console.log('Empresa B (objetivo):' + B.name + '  (' + B.total + ' contactos)\n');
  if (B.total === 0) { console.error('La empresa objetivo no tiene contactos; la prueba no seria concluyente.'); process.exit(4); }

  // 2) Crear usuario temporal en la empresa A
  const cr = await fetch(URL + '/auth/v1/admin/users', {
    method: 'POST', headers: SH,
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS, email_confirm: true }),
  });
  if (!cr.ok) { console.error('No se pudo crear el usuario temporal: ' + (await cr.text()).slice(0, 200)); process.exit(5); }
  uid = (await cr.json()).id;
  const pf = await svc('profiles?on_conflict=id', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: uid, email: TEST_EMAIL, full_name: 'RLS Test', company_id: A.id, role: 'member', status: 'active' }),
  });
  if (!pf.ok) { console.error('No se pudo crear el profile: ' + (await pf.text()).slice(0, 200)); await limpiar(); process.exit(6); }

  // 3) Iniciar sesion como ese usuario (igual que el navegador)
  const tk = await fetch(URL + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  }).then(r => r.json());
  if (!tk.access_token) { console.error('No se pudo iniciar sesion: ' + JSON.stringify(tk).slice(0, 200)); await limpiar(); process.exit(7); }
  const u = asUser(tk.access_token);
  console.log('Sesion iniciada como miembro de ' + A.name + '. Intentando alcanzar los datos de ' + B.name + ':\n');

  // 4) Los intentos
  const propios = await u('contacts?select=id,company_id').then(r => r.json());
  const ajenos = Array.isArray(propios) ? propios.filter(c => c.company_id !== A.id) : [];
  check('SELECT contacts sin filtro solo devuelve los propios',
    Array.isArray(propios) && ajenos.length === 0,
    Array.isArray(propios) ? propios.length + ' filas, ' + ajenos.length + ' ajenas' : 'respuesta inesperada');

  const dirigido = await u('contacts?company_id=eq.' + B.id + '&select=id').then(r => r.json());
  check('SELECT contacts filtrando por la empresa B devuelve 0',
    Array.isArray(dirigido) && dirigido.length === 0,
    Array.isArray(dirigido) ? dirigido.length + ' filas' : JSON.stringify(dirigido).slice(0, 80));

  for (const t of ['campaigns', 'campaign_runs', 'message_log', 'payments']) {
    const r = await u(t + '?company_id=eq.' + B.id + '&select=id').then(x => x.json());
    check('SELECT ' + t + ' de la empresa B devuelve 0',
      Array.isArray(r) && r.length === 0,
      Array.isArray(r) ? r.length + ' filas' : JSON.stringify(r).slice(0, 80));
  }

  const perfilesAjenos = await u('profiles?company_id=eq.' + B.id + '&select=id,email').then(r => r.json());
  check('SELECT profiles de la empresa B devuelve 0',
    Array.isArray(perfilesAjenos) && perfilesAjenos.length === 0,
    Array.isArray(perfilesAjenos) ? perfilesAjenos.length + ' filas' : JSON.stringify(perfilesAjenos).slice(0, 80));

  const victima = await svc('contacts?company_id=eq.' + B.id + '&select=id&limit=1').then(r => r.json());
  if (Array.isArray(victima) && victima[0]) {
    const up = await u('contacts?id=eq.' + victima[0].id, {
      method: 'PATCH', headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ full_name: 'NO DEBERIA PODER' }),
    });
    const cuerpo = await up.json().catch(() => []);
    check('UPDATE de un contacto de la empresa B no modifica nada',
      !Array.isArray(cuerpo) || cuerpo.length === 0,
      'HTTP ' + up.status + (Array.isArray(cuerpo) ? ', ' + cuerpo.length + ' filas afectadas' : ''));
  }

  const ins = await u('contacts', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ company_id: B.id, full_name: 'INYECTADO', phone: '+570000000000' }),
  });
  const insBody = await ins.json().catch(() => null);
  const inyectado = Array.isArray(insBody) && insBody.length > 0;
  check('INSERT de un contacto en la empresa B es rechazado', !inyectado, 'HTTP ' + ins.status);
  if (inyectado) await svc('contacts?id=eq.' + insBody[0].id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });

  await limpiar();

  const fallas = results.filter(r => !r.ok);
  console.log('\n' + '='.repeat(60));
  console.log(fallas.length === 0
    ? 'AISLAMIENTO OK — ' + results.length + '/' + results.length + ' pruebas pasaron.'
    : 'ATENCION — ' + fallas.length + ' de ' + results.length + ' pruebas FALLARON:\n  ' + fallas.map(f => f.nombre).join('\n  '));
  process.exit(fallas.length === 0 ? 0 : 1);
})().catch(async (e) => { console.error('FALLO: ' + (e && e.message ? e.message : e)); await limpiar(); process.exit(1); });
