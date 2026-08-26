// verify-creds.cjs — comprueba que credentials.env funcione y esté al día.
// NO imprime secretos: solo rol/proyecto/vencimiento + huella sha256 corta.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('='); if (i === -1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}
const fp = s => s ? crypto.createHash('sha256').update(s).digest('hex').slice(0, 12) : '(vacío)';
function jwt(t) { try { const p = JSON.parse(Buffer.from(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString()); return p; } catch { return null; } }
const d = u => new Date(u * 1000).toISOString().slice(0, 10);

(async () => {
  const env = loadEnv(path.join(__dirname, 'credentials.env'));
  const URL = (env.SUPABASE_URL || '').replace(/\/+$/, '');
  const ANON = env.SUPABASE_ANON_KEY || '';
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const EMAIL = env.SUPER_ADMIN_EMAIL || '';
  const PASS = env.SUPER_ADMIN_PASSWORD || '';
  const NAME = env.SUPER_ADMIN_NAME || '';
  const out = [];
  const L = s => out.push(s);

  L('=== CAMPOS PRESENTES ===');
  for (const [k, v] of [['SUPABASE_URL', URL], ['SUPABASE_ANON_KEY', ANON], ['SUPABASE_SERVICE_ROLE_KEY', SERVICE], ['SUPER_ADMIN_EMAIL', EMAIL], ['SUPER_ADMIN_PASSWORD', PASS], ['SUPER_ADMIN_NAME', NAME]])
    L(`  ${v ? '✓' : '✗ FALTA'}  ${k}${k.includes('PASSWORD') ? (v ? ' (presente)' : '') : ''}`);

  L('\n=== PROYECTO / URL ===');
  L('  URL: ' + (URL || '(vacío)'));
  // comparar contra el sitio en vivo
  let liveUrl = '', liveAnon = '';
  try {
    const cfg = await (await fetch('https://toqueflow.com/supabase-config.js')).text();
    liveUrl = (cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/) || [])[1] || '';
    liveAnon = (cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/) || [])[1] || '';
  } catch (e) { L('  (no pude leer supabase-config.js en vivo: ' + e.message + ')'); }
  L('  URL en el sitio en vivo: ' + (liveUrl || '?'));
  L('  ¿coinciden URL env vs sitio?  ' + (URL === liveUrl.replace(/\/+$/, '') ? 'SÍ ✓' : 'NO ✗'));
  L('  ¿anon env == anon del sitio?  ' + (ANON && ANON === liveAnon ? 'SÍ ✓ (misma llave publicada)' : (ANON ? 'NO ✗ (difieren)' : 'sin anon en env')) + (ANON ? '  fp=' + fp(ANON) : ''));

  for (const [label, key, wantRole] of [['ANON', ANON, 'anon'], ['SERVICE_ROLE', SERVICE, 'service_role']]) {
    L(`\n=== LLAVE ${label} ===`);
    if (!key) { L('  ✗ ausente'); continue; }
    const c = jwt(key);
    if (!c) { L('  ✗ no es un JWT válido'); continue; }
    const now = Math.floor(Date.now() / 1000);
    L('  rol(claim): ' + c.role + (c.role === wantRole ? ' ✓' : ' ✗ (esperado ' + wantRole + ')'));
    L('  proyecto(ref): ' + c.ref + (liveUrl.includes(c.ref) ? ' ✓ (coincide con el sitio)' : ''));
    L('  emitida: ' + d(c.iat) + '  vence: ' + d(c.exp) + (c.exp > now ? ' ✓ vigente' : ' ✗ VENCIDA'));
    L('  huella sha256: ' + fp(key));
  }

  // pruebas en vivo
  const H = k => ({ apikey: k, Authorization: 'Bearer ' + k });
  L('\n=== PRUEBAS EN VIVO ===');
  // anon -> RLS debe devolver vacío
  try {
    const r = await fetch(URL + '/rest/v1/profiles?select=id&limit=1', { headers: H(ANON) });
    const body = await r.json().catch(() => null);
    L('  anon GET profiles: HTTP ' + r.status + ' → ' + (Array.isArray(body) ? body.length + ' filas (RLS ' + (body.length === 0 ? 'protege ✓' : 'ABIERTO ✗') + ')' : JSON.stringify(body)));
  } catch (e) { L('  anon GET profiles: ERROR ' + e.message); }
  // service_role -> bypassa RLS, debe ver datos
  let companies = 0, profiles = 0, sa = null;
  try {
    const r = await fetch(URL + '/rest/v1/profiles?select=id,email,role,status,last_sign_in_at,created_at', { headers: { ...H(SERVICE), Prefer: 'count=exact' } });
    const body = await r.json().catch(() => null);
    if (Array.isArray(body)) { profiles = body.length; sa = body.find(p => (p.email || '').toLowerCase() === EMAIL.toLowerCase()); }
    L('  service GET profiles: HTTP ' + r.status + ' → ' + (Array.isArray(body) ? profiles + ' perfiles' : JSON.stringify(body).slice(0, 200)));
  } catch (e) { L('  service GET profiles: ERROR ' + e.message); }
  try {
    const r = await fetch(URL + '/rest/v1/companies?select=id,name,status', { headers: H(SERVICE) });
    const body = await r.json().catch(() => null);
    if (Array.isArray(body)) companies = body.length;
    L('  service GET companies: HTTP ' + r.status + ' → ' + (Array.isArray(body) ? companies + ' empresas' : JSON.stringify(body).slice(0, 200)));
  } catch (e) { L('  service GET companies: ERROR ' + e.message); }
  try {
    const r = await fetch(URL + '/auth/v1/admin/users?per_page=1', { headers: H(SERVICE) });
    L('  service Admin API (auth/users): HTTP ' + r.status + (r.status === 200 ? ' ✓ (service_role válida)' : ' ✗'));
  } catch (e) { L('  service Admin API: ERROR ' + e.message); }

  // login real del super admin
  L('\n=== LOGIN SUPER ADMIN ===');
  try {
    const r = await fetch(URL + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { ...H(ANON), 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASS }) });
    const body = await r.json().catch(() => null);
    const okTok = !!(body && body.access_token);
    L('  POST token (email+password): HTTP ' + r.status + ' → ' + (okTok ? 'access_token recibido ✓ LOGIN OK' : 'sin token ✗ ' + JSON.stringify(body).slice(0, 160)));
    L('  correo: ' + EMAIL);
  } catch (e) { L('  login: ERROR ' + e.message); }
  if (sa) {
    L('  perfil del super admin → rol: ' + sa.role + (sa.role === 'super_admin' ? ' ✓' : ' ✗') + ' | estado: ' + sa.status + (sa.status === 'active' ? ' ✓' : ' ✗'));
    L('  creado: ' + (sa.created_at || '?').slice(0, 10) + ' | último acceso: ' + (sa.last_sign_in_at ? sa.last_sign_in_at.slice(0, 16).replace('T', ' ') : 'nunca registrado'));
  } else L('  (no encontré el perfil del super admin con la service_role — revisar)');

  L('\n=== RESUMEN DATOS ===');
  L('  empresas: ' + companies + ' | perfiles/usuarios: ' + profiles);

  console.log(out.join('\n'));
})().catch(e => { console.error('FALLÓ:', e.message); process.exit(1); });
