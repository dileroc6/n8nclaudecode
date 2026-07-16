// seed-smgrandhotel.cjs — Da de alta al cliente SM Grand Hotel en ToqueFlow:
//   empresa + usuario (Camila Suárez) y, con --with-flow, el módulo "Ocupación".
// Usa SOLO la service_role key (credentials.env). Idempotente: re-correrlo no duplica.
//
// uso:
//   node seed-smgrandhotel.cjs              → empresa + usuario
//   node seed-smgrandhotel.cjs --with-flow  → además crea/refresca el flow "Ocupación"

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

const WITH_FLOW = process.argv.includes('--with-flow');
const FLOW_ONLY = process.argv.includes('--flow-only'); // solo refresca empresa+flow; NO toca al usuario (no resetea contraseña)
const H = { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' };
const rest = (p, opts = {}) => fetch(URL + '/rest/v1/' + p, { ...opts, headers: { ...H, ...(opts.headers || {}) } });

// ── Datos del cliente ─────────────────────────────────────────────────────────
const COMPANY = { name: 'SM Grand Hotel', slug: 'sm-grand-hotel', city: 'Bogotá · Colombia' };
const USER = { email: 'camila.suarez@gruposume.com', password: 'SMGrand2026*', name: 'Camila Suárez' };

// El módulo "Ocupación": tarjeta en el panel que abre el dashboard de ocupación.
const FLOW = {
  name: 'KPI de Ocupación', type: 'chart', kind: 'automatización', status: 'activo', sede: null,
  desc: 'Dashboard de ocupación hotelera (49 habitaciones), actualizado periódicamente desde el Excel de reservas.',
  channels: [],
  // prom. 12m (jul25–jun26) + ocupación del último mes CERRADO (jun26).
  // La 3ª métrica ("real" con complementary) vuelve cuando llegue el Informe Diario de junio.
  stats: [{ n: '35%', l: 'prom. 12m' }, { n: '37%', l: 'ocup. jun' }],
  spark: [52, 41, 33, 53, 56, 24, 23, 37, 16, 25, 22, 37],   // ocupación % oficial, jul25–jun26
  last: 'actualizado 16 jul 2026', tool_url: 'sm-grand/ocupacion.html',
};

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
  // 0) ¿existe la tabla flows? (avisa si falta correr el SQL nuevo)
  const probe = await rest('flows?select=id&limit=1');
  if (probe.status === 404 || probe.status === 400) {
    console.error('\n⚠️  Falta la tabla "flows". Corre primero el SQL del schema en Supabase.'); process.exit(3);
  }

  // 1) Empresa
  const company = await getOrCreate('companies', 'slug=eq.' + COMPANY.slug,
    { name: COMPANY.name, slug: COMPANY.slug, city: COMPANY.city });
  console.log('1) empresa:', company.name, '(id ' + company.id + ')');

  // 2) Usuario (Auth + profile). Idempotente: si ya existe, le refresca la contraseña.
  if (!FLOW_ONLY) {
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
      } else { console.error('crear usuario →', t.slice(0, 200)); process.exit(4); }
    }
    if (!uid) { console.error('No se pudo obtener el uid del usuario.'); process.exit(4); }

    const up = await rest('profiles?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: uid, email: USER.email, full_name: USER.name, company_id: company.id, role: 'member', status: 'active' }),
    });
    if (!up.ok) { console.error('profile →', (await up.text()).slice(0, 200)); process.exit(5); }
    console.log('2) usuario:', USER.email, reused ? '(ya existía → contraseña actualizada)' : '(creado)');
  } else {
    console.log('2) usuario: omitido (--flow-only, no se toca la contraseña)');
  }

  // 3) Flow "Ocupación" — solo con --with-flow (cuando el HTML ya esté desplegado)
  if (WITH_FLOW) {
    const existing = await rest('flows?company_id=eq.' + company.id + '&tool_url=eq.' + encodeURIComponent(FLOW.tool_url) + '&select=id')
      .then((r) => r.json());
    const row = {
      company_id: company.id, sede_id: FLOW.sede, name: FLOW.name, type: FLOW.type, kind: FLOW.kind,
      status: FLOW.status, description: FLOW.desc, channels: FLOW.channels, stats: FLOW.stats, spark: FLOW.spark,
      last_label: FLOW.last, tool_url: FLOW.tool_url, position: 0,
    };
    if (Array.isArray(existing) && existing.length) {
      await rest('flows?id=eq.' + existing[0].id, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
      console.log('3) flow "Ocupación": actualizado');
    } else {
      const ins = await rest('flows', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
      if (!ins.ok) { console.error('flow →', (await ins.text()).slice(0, 200)); process.exit(6); }
      console.log('3) flow "Ocupación": creado');
    }
  } else {
    console.log('3) flow "Ocupación": omitido (corre con --with-flow tras desplegar el HTML)');
  }

  console.log('\n✅ Listo. Camila entra en login.html con:');
  console.log('   ' + USER.email + '  /  ' + USER.password);
})().catch((e) => { console.error('FALLÓ: ' + (e && e.message ? e.message : e)); process.exit(1); });
