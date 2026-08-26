// seed-toqueflow.cjs — Da de alta a ToqueFlow como UNA EMPRESA MÁS en su propia
//   plataforma. Decisión de arquitectura: los prospectos de ToqueFlow (los spas
//   que queremos como clientes) van a vivir en `contacts` con esta company_id y
//   status='prospecto', reusando contactos.html (vista Prospectos), campanas.html
//   y el aislamiento por RLS. Ver _docs/estrategia-leads.md §5.
//
//   Usa SOLO la service_role (credentials.env). Idempotente: re-correrlo no
//   duplica (refresca empresa, usuario y flows).
//
// uso:  node seed-toqueflow.cjs

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
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
if (!URL || !SERVICE) { console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en credentials.env'); process.exit(2); }

const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };
const rest = (p, opts = {}) => fetch(URL + '/rest/v1/' + p, { ...opts, headers: { ...H, ...(opts.headers || {}) } });

// ── Datos de la empresa ───────────────────────────────────────────────────────
const COMPANY = { name: 'ToqueFlow', slug: 'toqueflow', city: 'Bogotá', logo_url: null };

// ⚠️ COMPLETAR ANTES DE CORRER. Es el usuario con el que TÚ entras al portal a
//    ver tus propios prospectos. Cámbiale la contraseña al primer ingreso.
const USER = {
  email:    'CAMBIAR@toqueflow.com',
  password: 'CAMBIAR_ESTA_CONTRASENA',
  name:     'CAMBIAR Nombre Apellido',
};

// Los flows de la máquina de leads. Arrancan en 'próximamente': son la card en
// el dashboard, sin herramienta detrás, hasta que cada workflow exista.
const FLOWS = [
  { name: 'Captura Google Maps', type: 'cron', kind: 'automatizacion', status: 'próximamente',
    desc: 'Busca spas y centros de estética por ciudad, los califica y arma la cola de prospección.',
    channels: [], stats: [], spark: [], last: 'en preparación' },
  { name: 'Diagnóstico automático', type: 'web', kind: 'automatizacion', status: 'próximamente',
    desc: 'Genera una página propia para cada prospecto con su diagnóstico de atención.',
    channels: [], stats: [], spark: [], last: 'en preparación' },
  { name: 'Secuencia outbound', type: 'email', kind: 'campana', status: 'próximamente',
    desc: 'Cuatro correos en doce días. Se detiene sola en cuanto el prospecto responde.',
    channels: ['email'], stats: [], spark: [], last: 'en preparación' },
  { name: 'Bot demo', type: 'chat', kind: 'agente', status: 'próximamente',
    desc: 'Un bot cargado con la información del prospecto, para que pruebe su propio negocio atendiendo solo.',
    channels: ['web'], stats: [], spark: [], last: 'en preparación' },
];

if (/CAMBIAR/.test(USER.email + USER.password + USER.name)) {
  console.error('\nCompleta el bloque USER de este archivo antes de correrlo.');
  console.error('Es el usuario con el que vas a entrar a ver tus prospectos.\n');
  process.exit(2);
}

async function getOrCreate(table, matchQS, insertBody) {
  const found = await rest(table + '?' + matchQS + '&select=*').then((r) => r.json());
  if (Array.isArray(found) && found.length) return found[0];
  const created = await rest(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(insertBody) })
    .then((r) => r.json());
  return Array.isArray(created) ? created[0] : created;
}

async function findUser(email) {
  const r = await fetch(URL + '/auth/v1/admin/users?per_page=500', { headers: H }).then((r) => r.json());
  return (r.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
}

(async () => {
  const probe = await rest('flows?select=id&limit=1');
  if (probe.status === 404 || probe.status === 400) {
    console.error('\nFalta la tabla "flows". Corre primero el SQL del schema en Supabase.'); process.exit(3);
  }

  // 1) Empresa
  const company = await getOrCreate('companies', 'slug=eq.' + COMPANY.slug,
    { name: COMPANY.name, slug: COMPANY.slug, city: COMPANY.city, logo_url: COMPANY.logo_url });
  await rest('companies?id=eq.' + company.id, {
    method: 'PATCH', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ name: COMPANY.name, city: COMPANY.city, logo_url: COMPANY.logo_url }),
  });
  console.log('1) empresa:', COMPANY.name, '(id ' + company.id + ')');

  // 2) Usuario (Auth + profile). Idempotente.
  let uid = null, reused = false;
  const create = await fetch(URL + '/auth/v1/admin/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ email: USER.email, password: USER.password, email_confirm: true, user_metadata: { full_name: USER.name } }),
  });
  if (create.ok) { uid = (await create.json()).id; }
  else {
    const t = await create.text();
    if (/already|exists|registered|duplicate/i.test(t)) {
      const u = await findUser(USER.email); uid = u && u.id; reused = true;
      if (uid) await fetch(URL + '/auth/v1/admin/users/' + uid, { method: 'PUT', headers: H, body: JSON.stringify({ password: USER.password, email_confirm: true }) });
    } else { console.error('crear usuario ->', t.slice(0, 200)); process.exit(4); }
  }
  if (!uid) { console.error('No se pudo obtener el uid del usuario.'); process.exit(4); }

  const up = await rest('profiles?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: uid, email: USER.email, full_name: USER.name, company_id: company.id, role: 'member', status: 'active' }),
  });
  if (!up.ok) { console.error('profile ->', (await up.text()).slice(0, 200)); process.exit(5); }
  console.log('2) usuario:', USER.email, reused ? '(ya existia -> contrasena actualizada)' : '(creado)');

  // 3) Flows — borra los previos de la empresa y reinserta (no duplica).
  await rest('flows?company_id=eq.' + company.id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  const rows = FLOWS.map((f, i) => ({
    company_id: company.id, sede_id: null, name: f.name, type: f.type, kind: f.kind,
    status: f.status, description: f.desc, channels: f.channels, stats: f.stats, spark: f.spark,
    last_label: f.last, tool_url: null, position: i,
  }));
  const ins = await rest('flows', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
  if (!ins.ok) { console.error('flows ->', (await ins.text()).slice(0, 200)); process.exit(6); }
  console.log('3) flows:', rows.map((r) => '"' + r.name + '"').join(', '));

  console.log('\nListo. ToqueFlow existe como empresa en su propia plataforma.');
  console.log('   Entra en login.html con: ' + USER.email);
  console.log('\n   Siguiente: correr schema-prospeccion.sql para el indice de place_id,');
  console.log('   outreach_events, outreach_optouts y demos.');
})().catch((e) => { console.error('FALLO: ' + (e && e.message ? e.message : e)); process.exit(1); });
