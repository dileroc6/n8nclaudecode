// gen-n8n-worker-token.cjs — Genera el token JWT del rol `n8n_worker` para que
// n8n autentique contra Supabase (least-privilege). CORRELO VOS: el JWT Secret
// NO se comparte ni queda guardado — se pide por teclado (oculto) y se usa en RAM.
//
// De dónde sale el JWT Secret:
//   Supabase → Project Settings → API → JWT Settings → "JWT Secret" → Reveal.
//
// uso (te lo pide por teclado, sin mostrarlo):
//   node gen-n8n-worker-token.cjs
//
// o pasándolo por variable de entorno (queda en el historial del shell, menos ideal):
//   SUPABASE_JWT_SECRET='pega-aqui' node gen-n8n-worker-token.cjs
//
// Salida: imprime SOLO el token. Ese texto es la "key n8n_worker" que le das a Ferney
// para ponerla en las credenciales de n8n (header:  Authorization: Bearer <token>  y  apikey: <token>).

const crypto = require('crypto');

const PROJECT_REF = 'pyoauvbwqxuuzamnjwfd';   // ToqueFlow
const ROLE = 'n8n_worker';
const ANIOS_VALIDEZ = 10;                     // vida del token

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(secret) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: 'supabase',
    ref: PROJECT_REF,
    role: ROLE,
    iat: now,
    exp: now + ANIOS_VALIDEZ * 365 * 24 * 3600,
  };
  const data = b64url(JSON.stringify(header)) + '.' + b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return data + '.' + sig;
}

function readSecretHidden() {
  return new Promise((resolve) => {
    const env = process.env.SUPABASE_JWT_SECRET;
    if (env && env.trim()) return resolve(env.trim());
    process.stdout.write('Pegá el JWT Secret (no se mostrará) y Enter: ');
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setEncoding('utf8');
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();
    let buf = '';
    stdin.on('data', function onData(ch) {
      ch = String(ch);
      if (ch === '\n' || ch === '\r' || ch === '') {
        if (stdin.setRawMode) stdin.setRawMode(wasRaw);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(buf.trim());
      } else if (ch === '') { // Ctrl-C
        process.exit(1);
      } else if (ch === '' || ch === '\b') { // backspace
        buf = buf.slice(0, -1);
      } else {
        buf += ch;
      }
    });
  });
}

// Lee el secreto de jwt-secret.local.txt si existe (más confiable que pegar a ciegas).
async function readSecret() {
  const fs = require('fs');
  const f = require('path').join(__dirname, 'jwt-secret.local.txt');
  if (fs.existsSync(f)) {
    const s = fs.readFileSync(f, 'utf8').trim();
    if (s) return { secret: s, file: f };
  }
  return { secret: await readSecretHidden(), file: null };
}

async function validar(token) {
  try {
    const r = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/contacts?select=full_name&limit=1`,
      { headers: { apikey: token, Authorization: 'Bearer ' + token } });
    if (r.ok) return { ok: true };
    const body = await r.text();
    return { ok: false, msg: body.slice(0, 160) };
  } catch (e) { return { ok: false, msg: String(e).slice(0, 160) }; }
}

// Chequeo LOCAL: re-firma la parte header.payload de la service_role (de credentials.env)
// con el secreto ingresado y compara la firma. Si coincide, el secreto es correcto.
// No usa red. Devuelve true/false/null(si no hay service_role para comparar).
function secretoCorrecto(secret) {
  try {
    const fs = require('fs');
    const line = fs.readFileSync(require('path').join(__dirname, 'credentials.env'), 'utf8')
      .split(/\r?\n/).find((l) => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='));
    if (!line) return null;
    const svc = line.slice('SUPABASE_SERVICE_ROLE_KEY='.length).trim();
    const [h, p, realSig] = svc.split('.');
    if (!realSig) return null;
    const mySig = crypto.createHmac('sha256', secret).update(h + '.' + p).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return mySig === realSig;
  } catch (e) { return null; }
}

(async () => {
  const { secret, file } = await readSecret();
  if (!secret) { console.error('Sin secreto. Cancelado.'); process.exit(2); }

  // Verificación local del secreto ANTES de nada.
  const ok = secretoCorrecto(secret);
  if (ok === false) {
    console.log('\n❌ El secreto NO coincide con el de tu proyecto.');
    console.log('   (Se comparó contra tu service_role y la firma no da.)');
    console.log('   → Copiá de nuevo el **Legacy JWT secret COMPLETO**: en Supabase dale **Reveal**,');
    console.log('     hacé clic en el campo, Ctrl+A (seleccionar todo), Ctrl+C, y pegalo entero en');
    console.log('     jwt-secret.local.txt (solo el secreto). Longitud que ingresaste:', secret.length, 'chars.');
    console.log('   No borré el archivo — corregilo y volvé a correr.');
    process.exit(3);
  }
  if (ok === true) console.log('\n✅ Secreto verificado localmente (coincide con tu proyecto).');

  const token = sign(secret);
  // Guardar en archivo (gitignored) para copiarlo LIMPIO — en la terminal se parte en varias líneas.
  const fs = require('fs');
  const outFile = require('path').join(__dirname, 'n8n-worker-token.local.txt');
  fs.writeFileSync(outFile, token + '\n', { mode: 0o600 });

  // Auto-verificación contra Supabase.
  process.stdout.write('\nVerificando el token contra Supabase... ');
  const v = await validar(token);
  if (v.ok) {
    console.log('✅ FUNCIONA');
    console.log('\n── Token n8n_worker (válido ' + ANIOS_VALIDEZ + ' años) ──');
    console.log('Guardado en:  n8n-worker-token.local.txt  (ábrelo y copiá TODO — empieza con eyJ)');
    console.log('Va en DOS headers en n8n:  apikey: <token>   y   Authorization: Bearer <token>');
  } else {
    console.log('❌ NO válido');
    console.log('   Supabase respondió:', v.msg);
    console.log('   → El JWT Secret está mal o incompleto. Revisá que copiaste el "JWT Secret" completo');
    console.log('     (Settings → API → JWT Settings → JWT Secret), sin espacios ni cortes.');
  }

  // Borrar el archivo del secreto (higiene) si se usó.
  if (file) { try { fs.unlinkSync(file); console.log('\n(Se borró jwt-secret.local.txt)'); } catch (e) {} }
})();
