const fs=require('fs'),path=require('path');
function loadEnv(file){const e={};if(!fs.existsSync(file))return e;for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const l=raw.trim();if(!l||l.startsWith('#'))continue;const i=l.indexOf('=');if(i===-1)continue;let v=l.slice(i+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);e[l.slice(0,i).trim()]=v;}return e;}
const env=loadEnv(path.join(__dirname,'credentials.env'));
const URL=(env.SUPABASE_URL||'').replace(/\/+$/,''),SERVICE=env.SUPABASE_SERVICE_ROLE_KEY;
const H={apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json'};
const updates=[['ferreteriayacom@gmail.com','Nico'],['ferreteriayamedellin@gmail.com','Fabi']];
(async()=>{
  for(const [email,name] of updates){
    const r=await fetch(URL+'/rest/v1/profiles?email=eq.'+email,{method:'PATCH',headers:{...H,Prefer:'return=representation'},body:JSON.stringify({full_name:name})});
    const b=await r.json().catch(()=>null);
    console.log(email+' → "'+name+'"  HTTP '+r.status+((r.ok&&Array.isArray(b)&&b.length)?' ✓':' ✗ '+JSON.stringify(b).slice(0,150)));
  }
  const prof=await (await fetch(URL+'/rest/v1/profiles?select=email,full_name,role&order=role.asc',{headers:H})).json();
  console.log('\n=== AHORA ===');
  for(const p of (prof||[])) console.log('• '+p.email+'  → "'+p.full_name+'"  ('+p.role+')');
})().catch(e=>{console.error('FALLÓ:',e.message);process.exit(1);});
