// verify-bejauha.cjs — verifica empresa + usuario + flows de Bejauha.
const fs = require('fs'); const path = require('path');
function loadEnv(file){const env={};for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i===-1)continue;let v=line.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);env[line.slice(0,i).trim()]=v;}return env;}
const env = loadEnv(path.join(__dirname,'credentials.env'));
const URL = (env.SUPABASE_URL||'').trim().replace(/\/+$/,'');
const SERVICE = (env.SUPABASE_SERVICE_ROLE_KEY||'').trim();
const H = { apikey: SERVICE, Authorization: 'Bearer '+SERVICE };
const get = (p) => fetch(URL+'/rest/v1/'+p, { headers: H }).then(r=>r.json());

(async () => {
  const co = (await get('companies?slug=eq.bejauha&select=id,name,city,status,logo_url'))[0];
  if (!co) { console.log('No existe la empresa.'); return; }
  console.log('EMPRESA: ' + co.name + ' | ' + (co.city||'—') + ' | ' + co.status + ' | logo: ' + (co.logo_url||'(monograma)'));
  const users = await get('profiles?company_id=eq.'+co.id+'&select=email,full_name,role,status');
  console.log('USUARIOS (' + users.length + '):');
  for (const u of users) console.log('  • ' + u.email + ' — ' + u.full_name + ' [' + u.role + ', ' + u.status + ']');
  const flows = await get('flows?company_id=eq.'+co.id+'&select=name,type,kind,status,channels,tool_url,last_label&order=position.asc');
  console.log('FLOWS (' + flows.length + '):');
  for (const f of flows) console.log('  • "' + f.name + '" [' + f.type + '/' + f.kind + ', ' + f.status + '] canales=' + JSON.stringify(f.channels) + ' tool=' + (f.tool_url||'(card)') + ' · ' + f.last_label);
})().catch(e => { console.error('FALLÓ:', e.message); process.exit(1); });
