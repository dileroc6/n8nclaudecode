// list-users.cjs — lista los usuarios con acceso (profiles) y su rol/estado.
const fs = require('fs'); const path = require('path');
function loadEnv(file){const env={};if(!fs.existsSync(file))return env;for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i===-1)continue;let v=line.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[line.slice(0,i).trim()]=v;}return env;}
const env = loadEnv(path.join(__dirname,'credentials.env'));
const URL = (env.SUPABASE_URL||'').replace(/\/+$/,'');
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SERVICE, Authorization: 'Bearer '+SERVICE };
const PERM = { super_admin:'Super admin (ve y gestiona TODO)', admin:'Admin de empresa', member:'Usuario normal' };

(async () => {
  const profiles = await (await fetch(URL+'/rest/v1/profiles?select=email,full_name,role,status,company_id,last_sign_in_at,created_at', {headers:H})).json();
  const companies = await (await fetch(URL+'/rest/v1/companies?select=id,name,status', {headers:H})).json();
  const cmap = {}; (Array.isArray(companies)?companies:[]).forEach(c => cmap[c.id] = c.name);
  if (!Array.isArray(profiles)) { console.log('Respuesta inesperada:', JSON.stringify(profiles).slice(0,300)); return; }
  const order = { super_admin:0, admin:1, member:2 };
  profiles.sort((a,b) => (order[a.role]??9)-(order[b.role]??9) || (a.email||'').localeCompare(b.email||''));

  const active = profiles.filter(p => p.status === 'active');
  const disabled = profiles.filter(p => p.status !== 'active');

  console.log('=== CON ACCESO HOY (status = active): ' + active.length + ' ===');
  for (const p of active) {
    console.log('• ' + (p.email||'(sin correo)'));
    console.log('    rol: ' + p.role + '  →  ' + (PERM[p.role]||'(rol desconocido)'));
    console.log('    nombre: ' + (p.full_name||'—') + '  | empresa: ' + (p.company_id ? (cmap[p.company_id]||p.company_id) : '—'));
    console.log('    último acceso: ' + (p.last_sign_in_at ? p.last_sign_in_at.slice(0,16).replace('T',' ') : 'nunca') + '  | creado: ' + (p.created_at||'').slice(0,10));
  }
  if (disabled.length) {
    console.log('\n=== SIN ACCESO (desactivados): ' + disabled.length + ' ===');
    for (const p of disabled) console.log('• ' + (p.email||'?') + '  | rol: ' + p.role + '  | estado: ' + p.status);
  }
  console.log('\nTotal perfiles: ' + profiles.length + '  | empresas: ' + (Array.isArray(companies)?companies.length:0));
})().catch(e => { console.error('FALLÓ:', e.message); process.exit(1); });
