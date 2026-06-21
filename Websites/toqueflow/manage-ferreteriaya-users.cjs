// Crea los 2 usuarios gmail de FerreteríaYa (member) y borra a nicolas.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
function loadEnv(file){const e={};if(!fs.existsSync(file))return e;for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const l=raw.trim();if(!l||l.startsWith('#'))continue;const i=l.indexOf('=');if(i===-1)continue;let v=l.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);e[l.slice(0,i).trim()]=v;}return e;}
const env = loadEnv(path.join(__dirname,'credentials.env'));
const URL=(env.SUPABASE_URL||'').replace(/\/+$/,''); const SERVICE=env.SUPABASE_SERVICE_ROLE_KEY;
const H={apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json'};
const genPass = () => 'Tf' + crypto.randomBytes(12).toString('base64').replace(/[+/=]/g,'').slice(0,10) + '9!';

async function jget(u){ const r=await fetch(u,{headers:H}); return {ok:r.ok,status:r.status,body:await r.json().catch(()=>null)}; }
async function findUser(email){ const r=await jget(URL+'/auth/v1/admin/users?per_page=500'); return (r.body&&r.body.users||[]).find(u=>(u.email||'').toLowerCase()===email.toLowerCase()); }

async function createMember(email, fullName, companyId){
  const pass = genPass(); let uid; let reused=false;
  const c = await fetch(URL+'/auth/v1/admin/users',{method:'POST',headers:H,body:JSON.stringify({email,password:pass,email_confirm:true,user_metadata:{full_name:fullName}})});
  if (c.ok){ uid=(await c.json()).id; }
  else { const t=await c.text();
    if(/already|exists|registered|duplicate/i.test(t)){ const u=await findUser(email); uid=u&&u.id; reused=true;
      if(uid) await fetch(URL+'/auth/v1/admin/users/'+uid,{method:'PUT',headers:H,body:JSON.stringify({password:pass,email_confirm:true})});
    } else throw new Error('crear '+email+' → '+t.slice(0,200)); }
  if(!uid) throw new Error('sin uid para '+email);
  // upsert del profile: rol member, empresa FerreteríaYa, activo
  const up = await fetch(URL+'/rest/v1/profiles?on_conflict=id',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:uid,email,full_name:fullName,role:'member',status:'active',company_id:companyId})});
  if(!up.ok) throw new Error('profile '+email+' → '+(await up.text()).slice(0,200));
  return {email, fullName, uid, pass, reused};
}

(async()=>{
  // 1) empresa FerreteríaYa
  const comp = (await jget(URL+'/rest/v1/companies?select=id,name,slug,city')).body || [];
  const company = comp.find(c=>/ferreteria/i.test(c.name||'')||/ferreteria/i.test(c.slug||'')) || comp[0];
  if(!company){ console.error('No encontré la empresa FerreteríaYa'); process.exit(2); }
  console.log('Empresa: ' + company.name + '  (id ' + company.id + ', ' + (company.city||'—') + ')\n');

  // 2) crear los dos gmail (additivo primero)
  const created = [];
  created.push(await createMember('ferreteriayacom@gmail.com','FerreteríaYa Bogotá',company.id));
  created.push(await createMember('ferreteriayamedellin@gmail.com','FerreteríaYa Medellín',company.id));
  console.log('=== USUARIOS CREADOS (rol member de FerreteríaYa) ===');
  for(const u of created) console.log('• ' + u.email + (u.reused?' (ya existía, actualizado)':'') + '\n    nombre: ' + u.fullName + '\n    CONTRASEÑA TEMPORAL: ' + u.pass);

  // 3) borrar a nicolas (destructivo, al final)
  console.log('\n=== BORRAR nicolas@ferreteriaya.co ===');
  const nico = await findUser('nicolas@ferreteriaya.co');
  if(!nico){ console.log('  no estaba en Auth (quizá ya borrado).'); }
  else { const d=await fetch(URL+'/auth/v1/admin/users/'+nico.id,{method:'DELETE',headers:H});
    console.log('  DELETE auth user: HTTP ' + d.status + (d.ok?' ✓ borrado (su profile cae por cascade)':' ✗')); }

  // 4) verificación final
  const prof = (await jget(URL+'/rest/v1/profiles?select=email,full_name,role,status,company_id&order=role.asc')).body || [];
  console.log('\n=== ESTADO FINAL — perfiles ===');
  for(const p of prof) console.log('• ' + p.email + '  | rol: ' + p.role + ' | estado: ' + p.status + ' | empresa: ' + (p.company_id===company.id?'FerreteríaYa':(p.company_id||'—')));
  const ferre = prof.filter(p=>p.company_id===company.id);
  console.log('\nUsuarios de FerreteríaYa ahora: ' + ferre.length + ' (' + ferre.map(p=>p.email).join(', ') + ')');
  console.log('¿nicolas sigue? ' + (prof.some(p=>(p.email||'').toLowerCase()==='nicolas@ferreteriaya.co') ? 'SÍ ✗' : 'NO ✓ (eliminado)'));
})().catch(e=>{console.error('FALLÓ:',e.message);process.exit(1);});
