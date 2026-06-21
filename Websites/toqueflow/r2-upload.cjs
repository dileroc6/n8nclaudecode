// r2-upload.cjs — sube los assets pesados de toqueflow a un bucket R2 dedicado.
// Lee las llaves R2 de Bejauha/.env.local y reusa su @aws-sdk/client-s3.
// NO imprime secretos. uso: node r2-upload.cjs
const fs = require('fs'); const path = require('path');
function loadEnv(file){const o={};try{fs.readFileSync(file,'utf8').split(/\r?\n/).forEach(l=>{const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)o[m[1]]=m[2].trim();});}catch(_){ }return o;}

const BEJ = 'D:/Ferney Rojas/Proyectos/ToqueFlow/Websites/Bejauha/plataforma';
const env = { ...loadEnv(path.join(BEJ,'.env.local')), ...loadEnv(path.join(BEJ,'.env.production')) };
const R2 = { endpoint: env.R2_ENDPOINT, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY };
if(!R2.endpoint||!R2.accessKeyId||!R2.secretAccessKey){console.error('No encontré las llaves R2 en Bejauha/.env.local');process.exit(2);}
const BUCKET = 'toqueflow-assets';

const { S3Client, CreateBucketCommand, PutObjectCommand, ListObjectsV2Command } = require(path.join(BEJ,'node_modules','@aws-sdk','client-s3'));
const s3 = new S3Client({ region:'auto', endpoint:R2.endpoint, credentials:{ accessKeyId:R2.accessKeyId, secretAccessKey:R2.secretAccessKey } });

const CT = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp4':'video/mp4'};
const SITE = path.join(__dirname,'site');

// que se sube: assets/img/* (lo pesado) + assets/hero-bg.mp4
const files = [];
const imgDir = path.join(SITE,'assets','img');
if(fs.existsSync(imgDir)) for(const f of fs.readdirSync(imgDir)) files.push(['img/'+f, path.join(imgDir,f)]);
const hero = path.join(SITE,'assets','hero-bg.mp4');
if(fs.existsSync(hero)) files.push(['hero-bg.mp4', hero]);

(async()=>{
  console.log('Endpoint R2: ...'+(R2.endpoint||'').slice(-30), '| bucket:', BUCKET);
  // 1) crear bucket (idempotente)
  try { await s3.send(new CreateBucketCommand({ Bucket: BUCKET })); console.log('bucket creado ✓'); }
  catch(e){
    if((e.name||'').match(/BucketAlreadyOwnedByYou|BucketAlreadyExists/)) console.log('bucket ya existía ✓');
    else { console.error('No pude crear el bucket: '+(e.name||e.message)+'\n→ Quizá el token R2 no tiene permiso de crear buckets. Créalo en el dashboard (toqueflow-assets) y vuelvo a correr.'); process.exit(3); }
  }
  // 2) subir
  let n=0, bytes=0;
  for(const [key,fp] of files){
    const body = fs.readFileSync(fp);
    const ct = CT[path.extname(fp).toLowerCase()]||'application/octet-stream';
    await s3.send(new PutObjectCommand({ Bucket:BUCKET, Key:key, Body:body, ContentType:ct }));
    n++; bytes+=body.length;
    console.log('  ↑ '+key+'  ('+(body.length/1e6).toFixed(1)+'MB, '+ct+')');
  }
  console.log('\n✓ Subidos '+n+' archivos ('+(bytes/1e6).toFixed(1)+'MB) a '+BUCKET);
  // 3) listar para confirmar
  const l = await s3.send(new ListObjectsV2Command({ Bucket:BUCKET }));
  console.log('Objetos en el bucket: '+(l.KeyCount||0));
})().catch(e=>{console.error('FALLO:',e.message);process.exit(1);});
