// setup-supabase.cjs — Configura Supabase para el login de ToqueFlow.
// Lee las credenciales de credentials.env (gitignored), NUNCA las imprime.
//
// Hace 3 cosas:
//   1) Escribe site/supabase-config.js con URL + anon key (públicas).
//   2) Corre site/supabase/schema.sql contra la base (vía connection string).
//   3) Crea/confirma el super admin (Auth admin API) y le pone rol super_admin.
//
// uso:  node setup-supabase.cjs

const fs = require('fs');
const path = require('path');

// ── Cargar credentials.env ────────────────────────────────────────────────
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

const ROOT = __dirname;
const env = loadEnv(path.join(ROOT, 'credentials.env'));

const URL = env.SUPABASE_URL;
const ANON = env.SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = env.SUPABASE_DB_URL;
const SA_EMAIL = env.SUPER_ADMIN_EMAIL;
const SA_PASS = env.SUPER_ADMIN_PASSWORD;
const SA_NAME = env.SUPER_ADMIN_NAME || 'Super Admin';

const missing = [];
if (!URL) missing.push('SUPABASE_URL');
if (!ANON) missing.push('SUPABASE_ANON_KEY');
if (!SERVICE) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!DB_URL) missing.push('SUPABASE_DB_URL');
if (!SA_EMAIL) missing.push('SUPER_ADMIN_EMAIL');
if (!SA_PASS) missing.push('SUPER_ADMIN_PASSWORD');
if (missing.length) {
  console.error('Faltan variables en credentials.env: ' + missing.join(', '));
  process.exit(2);
}

(async () => {
  // ── 1) supabase-config.js ──────────────────────────────────────────────
  const cfg = `// supabase-config.js — generado por setup-supabase.cjs
// La anon key es PÚBLICA y segura de exponer en el front (RLS protege los datos).
window.SUPABASE_URL = ${JSON.stringify(URL)};
window.SUPABASE_ANON_KEY = ${JSON.stringify(ANON)};
`;
  fs.writeFileSync(path.join(ROOT, 'site', 'supabase-config.js'), cfg);
  console.log('1/3  supabase-config.js escrito (URL + anon key).');

  // ── 2) Correr schema.sql ───────────────────────────────────────────────
  let Client;
  try { Client = require('pg').Client; }
  catch (e) { console.error('Falta el módulo pg. Corre:  npm i pg --no-save'); process.exit(3); }

  const sql = fs.readFileSync(path.join(ROOT, 'site', 'supabase', 'schema.sql'), 'utf8');
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  console.log('2/3  schema.sql aplicado (tablas, RLS, triggers).');

  // ── 3) Crear super admin ───────────────────────────────────────────────
  const adminUsersUrl = URL.replace(/\/+$/, '') + '/auth/v1/admin/users';
  let resp = await fetch(adminUsersUrl, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SA_EMAIL, password: SA_PASS, email_confirm: true, user_metadata: { full_name: SA_NAME } }),
  });

  let uid = null;
  if (resp.ok) {
    uid = (await resp.json()).id;
  } else {
    const txt = await resp.text();
    if (/already.*registered|already been registered|email_exists|duplicate/i.test(txt)) {
      // Ya existe: lo buscamos por la API para sacar su id.
      const list = await fetch(adminUsersUrl + '?per_page=200', {
        headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE },
      }).then((r) => r.json());
      const u = (list.users || []).find((x) => (x.email || '').toLowerCase() === SA_EMAIL.toLowerCase());
      uid = u && u.id;
      console.log('     (el usuario ya existía, reutilizando su cuenta)');
    } else {
      console.error('Error creando el usuario en Auth: ' + txt.slice(0, 300));
      await client.end();
      process.exit(4);
    }
  }

  if (!uid) { console.error('No se pudo obtener el id del super admin.'); await client.end(); process.exit(5); }

  // El trigger ya creó el profile; lo elevamos a super_admin.
  await client.query(
    `insert into public.profiles (id, email, full_name, role, status)
     values ($1, $2, $3, 'super_admin', 'active')
     on conflict (id) do update set role = 'super_admin', status = 'active', full_name = excluded.full_name`,
    [uid, SA_EMAIL, SA_NAME]
  );
  console.log('3/3  super admin listo: ' + SA_EMAIL + ' (rol super_admin, confirmado).');

  await client.end();
  console.log('\n✅ Supabase configurado. Ya puedes entrar en login.html con ese correo.');
})().catch((e) => { console.error('FALLÓ: ' + (e && e.message ? e.message : e)); process.exit(1); });
