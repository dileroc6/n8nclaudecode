// seed-ferreteriaya.cjs — Crea el dashboard de ejemplo de FerreteríaYa:
// empresa + sedes (Bogotá/Medellín) + flows de ejemplo + un usuario demo.
// Usa SOLO la service_role key (no necesita la contraseña de la base).
// Idempotente: re-correrlo refresca los flows sin duplicar empresa/sedes.
//
// uso:  node seed-ferreteriaya.cjs

const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const env = {};
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

// Usuario demo de FerreteríaYa
const DEMO = { email: 'nicolas@ferreteriaya.co', password: 'FerreteriaYa2026', name: 'Nicolas Rojas' };

// Flows REALES de FerreteríaYa (sede: 'medellin' | 'bogota' | 'ambas')
const FLOWS = [
  { name: 'Impresión Pedidos Rappi · Bogotá', type: 'invoice', kind: 'automatización', status: 'activo', sede: 'bogota',
    desc: 'Convierte el texto del pedido de Rappi en un recibo POS 80mm listo para imprimir.', channels: ['rappi'],
    stats: [{ n: 'POS', l: 'recibo' }, { n: '80mm', l: 'formato' }, { n: 'IA', l: 'lectura' }],
    spark: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8], last: 'lista para usar', tool_url: 'rappi-bogota.html' },
  { name: 'Impresión Pedidos Rappi · Medellín', type: 'invoice', kind: 'automatización', status: 'activo', sede: 'medellin',
    desc: 'Convierte el texto del pedido de Rappi en un recibo POS 80mm listo para imprimir.', channels: ['rappi'],
    stats: [{ n: 'POS', l: 'recibo' }, { n: '80mm', l: 'formato' }, { n: 'IA', l: 'lectura' }],
    spark: [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8], last: 'lista para usar', tool_url: 'rappi-medellin.html' },
];

async function getOrCreate(table, matchQS, insertBody) {
  const found = await rest(table + '?' + matchQS + '&select=*').then((r) => r.json());
  if (Array.isArray(found) && found.length) return found[0];
  const created = await rest(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(insertBody) })
    .then((r) => r.json());
  return Array.isArray(created) ? created[0] : created;
}

(async () => {
  // 0) ¿existe la tabla flows? (avisa si falta correr el SQL nuevo)
  const probe = await rest('flows?select=id&limit=1');
  if (probe.status === 404 || probe.status === 400) {
    console.error('\n⚠️  Falta la tabla "flows"/"sedes". Corre primero el SQL nuevo en el SQL Editor.'); process.exit(3);
  }

  // 1) Empresa
  const company = await getOrCreate('companies', 'slug=eq.ferreteriaya',
    { name: 'FerreteríaYa', slug: 'ferreteriaya', city: 'Colombia' });
  console.log('1/4  empresa:', company.name);

  // 2) Sedes
  const sedeBog = await getOrCreate('sedes', 'company_id=eq.' + company.id + '&name=eq.Sede%20Bogot%C3%A1',
    { company_id: company.id, name: 'Sede Bogotá', city: 'Bogotá · Cundinamarca' });
  const sedeMed = await getOrCreate('sedes', 'company_id=eq.' + company.id + '&name=eq.Sede%20Medell%C3%ADn',
    { company_id: company.id, name: 'Sede Medellín', city: 'Medellín · Antioquia' });
  const sedeId = { bogota: sedeBog.id, medellin: sedeMed.id, ambas: null };
  console.log('2/4  sedes: Bogotá + Medellín');

  // 3) Flows (borra los previos de la empresa y reinserta para no duplicar)
  await rest('flows?company_id=eq.' + company.id, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  const rows = FLOWS.map((f, i) => ({
    company_id: company.id, sede_id: sedeId[f.sede], name: f.name, type: f.type, kind: f.kind,
    status: f.status, description: f.desc, channels: f.channels, stats: f.stats, spark: f.spark,
    last_label: f.last, tool_url: f.tool_url || null, position: i,
  }));
  const ins = await rest('flows', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
  if (!ins.ok) { console.error('Error insertando flows:', (await ins.text()).slice(0, 300)); process.exit(4); }
  console.log('3/4  flows de ejemplo:', rows.length);

  // 4) Usuario demo de FerreteríaYa (admin de la empresa)
  let uid = null;
  const create = await fetch(URL + '/auth/v1/admin/users', {
    method: 'POST', headers: H,
    body: JSON.stringify({ email: DEMO.email, password: DEMO.password, email_confirm: true, user_metadata: { full_name: DEMO.name } }),
  });
  if (create.ok) { uid = (await create.json()).id; }
  else {
    const list = await fetch(URL + '/auth/v1/admin/users?per_page=200', { headers: H }).then((r) => r.json());
    const u = (list.users || []).find((x) => (x.email || '').toLowerCase() === DEMO.email.toLowerCase());
    uid = u && u.id;
  }
  if (uid) {
    await rest('profiles?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: uid, email: DEMO.email, full_name: DEMO.name, company_id: company.id, role: 'member', status: 'active' }),
    });
    console.log('4/4  usuario demo:', DEMO.email, '(usuario de FerreteríaYa)');
  } else {
    console.log('4/4  (no se pudo crear el usuario demo; revisa Auth)');
  }

  console.log('\n✅ FerreteríaYa lista. Entra en login.html con:');
  console.log('   ' + DEMO.email + '  /  ' + DEMO.password);
  console.log('   → verás el dashboard de FerreteríaYa con sus 6 flows y el selector de sedes.');
})().catch((e) => { console.error('FALLÓ: ' + (e && e.message ? e.message : e)); process.exit(1); });
