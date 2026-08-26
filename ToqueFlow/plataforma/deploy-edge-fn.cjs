// deploy-edge-fn.cjs — despliega una Edge Function por la Management API de Supabase.
// uso: node deploy-edge-fn.cjs <slug>   (default: admin-users)
const fs = require('fs'); const path = require('path');
function loadEnv(file){const e={};for(const l of fs.readFileSync(file,'utf8').split(/\r?\n/)){const t=l.trim();if(!t||t.startsWith('#'))continue;const i=t.indexOf('=');if(i===-1)continue;let v=t.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);e[t.slice(0,i).trim()]=v;}return e;}
const env = loadEnv(path.join(__dirname,'credentials.env'));
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const REF = ((env.SUPABASE_URL||'').match(/https:\/\/([a-z0-9]+)\.supabase\.co/)||[])[1];
const SLUG = process.argv[2] || 'admin-users';
const SRC = fs.readFileSync(path.join(__dirname,'site','supabase','functions',SLUG,'index.ts'),'utf8');
const API = 'https://api.supabase.com';

(async()=>{
  if(!TOKEN||!REF){console.error('Falta SUPABASE_ACCESS_TOKEN o no pude leer el ref del SUPABASE_URL');process.exit(2);}
  console.log('Proyecto ref:', REF, '| funcion:', SLUG);

  // 1) listar funciones (verifica acceso)
  const list = await fetch(API+`/v1/projects/${REF}/functions`,{headers:{Authorization:'Bearer '+TOKEN}});
  if(!list.ok){console.error('No pude listar funciones: HTTP '+list.status+' '+(await list.text()).slice(0,200));process.exit(3);}
  const fns = await list.json();
  console.log('Funciones actuales:', (fns||[]).map(f=>f.slug+':'+f.status).join(', ')||'(ninguna)');

  // 2) deploy (multipart: metadata + file)
  const fd = new FormData();
  fd.append('metadata', JSON.stringify({ name: SLUG, entrypoint_path: 'index.ts', verify_jwt: false }));
  fd.append('file', new Blob([SRC], { type: 'application/typescript' }), 'index.ts');
  const r = await fetch(API+`/v1/projects/${REF}/functions/deploy?slug=${SLUG}`,{
    method:'POST', headers:{Authorization:'Bearer '+TOKEN}, body: fd,
  });
  const t = await r.text();
  console.log('\nDEPLOY '+SLUG+': HTTP '+r.status);
  console.log(t.slice(0,700));
})().catch(e=>{console.error('FALLO:',e.message);process.exit(1);});
