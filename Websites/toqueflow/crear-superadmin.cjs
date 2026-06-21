// crear-superadmin.cjs — Crea/eleva el super admin usando SOLO la service_role
// key (no necesita la contraseña de la base). Lee credentials.env, no imprime
// secretos. Requiere que el schema.sql ya se haya corrido en el SQL Editor.
//
// uso:  node crear-superadmin.cjs

const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv(path.join(__dirname, 'credentials.env'));
const URL = (env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const SA_EMAIL = env.SUPER_ADMIN_EMAIL;
const SA_PASS = env.SUPER_ADMIN_PASSWORD;
const SA_NAME = env.SUPER_ADMIN_NAME || 'Super Admin';

const miss = [];
if (!URL) miss.push('SUPABASE_URL');
if (!SERVICE) miss.push('SUPABASE_SERVICE_ROLE_KEY');
if (!SA_EMAIL) miss.push('SUPER_ADMIN_EMAIL');
if (!SA_PASS) miss.push('SUPER_ADMIN_PASSWORD');
if (miss.length) { console.error('Faltan en credentials.env: ' + miss.join(', ')); process.exit(2); }

const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };

(async () => {
  // 0) ¿El schema ya está? (probamos leer la tabla profiles vía REST)
  const check = await fetch(URL + '/rest/v1/profiles?select=id&limit=1', { headers: H });
  if (check.status === 404 || check.status === 400) {
    console.error('\n⚠️  No encuentro la tabla "profiles". Primero corre el schema.sql en el SQL Editor de Supabase.\n   (Ver instrucciones que te pasé.)');
    process.exit(3);
  }

  // 1) Crear el usuario en Auth (ya confirmado).
  let uid = null;
  const create = await fetch(URL + '/auth/v1/admin/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ email: SA_EMAIL, password: SA_PASS, email_confirm: true, user_metadata: { full_name: SA_NAME } }),
  });
  if (create.ok) {
    uid = (await create.json()).id;
    console.log('1/2  usuario creado en Auth y confirmado.');
  } else {
    const txt = await create.text();
    if (/already|registered|exists|duplicate/i.test(txt)) {
      const list = await fetch(URL + '/auth/v1/admin/users?per_page=200', { headers: H }).then((r) => r.json());
      const u = (list.users || []).find((x) => (x.email || '').toLowerCase() === SA_EMAIL.toLowerCase());
      uid = u && u.id;
      console.log('1/2  el usuario ya existía, lo reutilizo.');
    } else {
      console.error('Error creando el usuario: ' + txt.slice(0, 300)); process.exit(4);
    }
  }
  if (!uid) { console.error('No pude obtener el id del usuario.'); process.exit(5); }

  // 2) Elevar su profile a super_admin (service_role salta el RLS).
  //    upsert por si el trigger aún no creó la fila.
  const up = await fetch(URL + '/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id: uid, email: SA_EMAIL, full_name: SA_NAME, role: 'super_admin', status: 'active' }),
  });
  if (!up.ok) { console.error('Error asignando rol: ' + (await up.text()).slice(0, 300)); process.exit(6); }
  console.log('2/2  rol super_admin asignado.');

  console.log('\n✅ Listo. Entra en login.html con:\n   correo: ' + SA_EMAIL + '\n   (la contraseña que pusiste en SUPER_ADMIN_PASSWORD)');
})().catch((e) => { console.error('FALLÓ: ' + (e && e.message ? e.message : e)); process.exit(1); });
