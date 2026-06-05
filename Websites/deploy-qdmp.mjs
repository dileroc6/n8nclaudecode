// Deploy script for quedicemiperro.com â€” pure Node.js built-ins only
import fs from 'fs';
import path from 'path';
import https from 'https';
import { URL } from 'url';

const API_TOKEN = 'ojMli0mOUnyN6HVybAlogMFUKMMUbUc0QwosWckff5cd102a';
const BASE_URL  = 'https://developers.hostinger.com';
const DOMAIN    = 'quedicemiperro.com';
const USERNAME  = 'u473399989';
const ARCHIVE   = 'd:/Ferney Rojas/Proyectos/ToqueFlow/Websites/QDMP_deploy_20260602_102943.zip';
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

function request(method, url, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method,
      headers: { ...headers }
    };
    if (body) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
      opts.headers['Content-Length'] = buf.length;
      const req = https.request(opts, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
      req.write(buf);
      req.end();
    } else {
      const req = https.request(opts, res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks).toString() }));
      });
      req.on('error', reject);
      req.end();
    }
  });
}

function patchChunk(url, chunk, offset, totalSize, authToken, authRestToken) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'PATCH',
      headers: {
        'X-Auth': authToken,
        'X-Auth-Rest': authRestToken,
        'Content-Type': 'application/offset+octet-stream',
        'upload-offset': offset.toString(),
        'upload-length': totalSize.toString(),
        'Content-Length': chunk.length
      }
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks).toString() }));
    });
    req.on('error', reject);
    req.write(chunk);
    req.end();
  });
}

async function getUploadCredentials() {
  console.log('1/3 Obteniendo credenciales de subida...');
  const res = await request('POST', `${BASE_URL}/api/hosting/v1/files/upload-urls`,
    { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    { username: USERNAME, domain: DOMAIN }
  );
  if (res.status !== 200) throw new Error(`Credentials error ${res.status}: ${res.data}`);
  const data = JSON.parse(res.data);
  console.log('    OK ->', data.url ? 'URL recibida' : JSON.stringify(data));
  return data;
}

async function tusUpload(archivePath, uploadUrl, authToken, authRestToken) {
  console.log('2/3 Subiendo archivo via TUS...');
  const stats = fs.statSync(archivePath);
  const totalSize = stats.size;
  const basename = path.basename(archivePath);
  const cleanUrl = uploadUrl.replace(/\/$/, '');
  const fileUrl = `${cleanUrl}/${basename}?override=true`;

  // Step 1: Create upload slot (POST)
  const createRes = await request('POST', fileUrl,
    {
      'X-Auth': authToken,
      'X-Auth-Rest': authRestToken,
      'upload-length': totalSize.toString(),
      'upload-offset': '0',
      'Content-Length': '0'
    }
  );
  if (createRes.status !== 201) throw new Error(`Create slot error ${createRes.status}: ${createRes.data}`);
  console.log('    Slot creado, subiendo chunks...');

  // Step 2: Upload in chunks (PATCH)
  const fd = fs.openSync(archivePath, 'r');
  let offset = 0;
  try {
    while (offset < totalSize) {
      const chunkSize = Math.min(CHUNK_SIZE, totalSize - offset);
      const buf = Buffer.alloc(chunkSize);
      fs.readSync(fd, buf, 0, chunkSize, offset);

      const pct = Math.round((offset + chunkSize) / totalSize * 100);
      process.stdout.write(`\r    ${pct}% (${Math.round((offset + chunkSize) / 1024 / 1024)}MB / ${Math.round(totalSize / 1024 / 1024)}MB)`);

      const patchRes = await patchChunk(fileUrl, buf, offset, totalSize, authToken, authRestToken);
      if (patchRes.status !== 204 && patchRes.status !== 200) {
        throw new Error(`Chunk PATCH error at offset ${offset}: status ${patchRes.status} - ${patchRes.data}`);
      }
      offset += chunkSize;
    }
  } finally {
    fs.closeSync(fd);
  }
  console.log('\n    Upload completo.');
  return basename;
}

async function triggerDeploy(archiveBasename) {
  console.log('3/3 Activando deploy...');
  const url = `${BASE_URL}/api/hosting/v1/accounts/${USERNAME}/websites/${DOMAIN}/deploy`;
  const res = await request('POST', url,
    { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    { archive_path: archiveBasename }
  );
  if (res.status !== 200) throw new Error(`Deploy error ${res.status}: ${res.data}`);
  return JSON.parse(res.data);
}

(async () => {
  try {
    const creds = await getUploadCredentials();
    const { url: uploadUrl, auth_key: authToken, rest_auth_key: authRestToken } = creds;
    if (!uploadUrl || !authToken || !authRestToken) throw new Error('Credenciales incompletas: ' + JSON.stringify(creds));
    const filename = await tusUpload(ARCHIVE, uploadUrl, authToken, authRestToken);
    const result = await triggerDeploy(filename);
    console.log('\nâœ“ Deploy completado exitosamente:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('\nâœ— Error:', err.message);
    process.exit(1);
  }
})();


