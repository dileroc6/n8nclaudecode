// Drives the Hostinger MCP server to call hosting_deployStaticWebsite.
// usage: node mcp-deploy.cjs <domain> <archivePath>
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DOMAIN = process.argv[2];
const ARCHIVE = process.argv[3];
if (!DOMAIN || !ARCHIVE) { console.error('usage: node mcp-deploy.cjs <domain> <archivePath>'); process.exit(2); }
if (!fs.existsSync(ARCHIVE)) { console.error('archive not found:', ARCHIVE); process.exit(2); }

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '.mcp.json'), 'utf8'));
const s = cfg.mcpServers.hostinger;

// El .mcp.json guarda placeholders del tipo ${HOSTINGER_API_TOKEN}, y nadie los
// expande: se pasaban literales al servidor, que respondía 401 Unauthenticated
// justo antes de subir el zip. El token de verdad vive en
// .claude/settings.local.json (gitignoreado), que es el mismo sitio del que lo
// toma el MCP cuando arranca Claude Code.
function resolverSecretos(vars) {
  const locales = {};
  const settings = path.join(__dirname, '..', '..', '.claude', 'settings.local.json');
  if (fs.existsSync(settings)) {
    const buscar = (o) => {
      if (!o || typeof o !== 'object') return;
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string') { if (!(k in locales)) locales[k] = v; }
        else buscar(v);
      }
    };
    try { buscar(JSON.parse(fs.readFileSync(settings, 'utf8'))); } catch (e) {}
  }
  const salida = {};
  for (const [k, v] of Object.entries(vars || {})) {
    const m = typeof v === 'string' && v.match(/^\$\{([A-Z_0-9]+)\}$/);
    const nombre = m ? m[1] : null;
    const resuelto = nombre ? (process.env[nombre] || locales[nombre]) : v;
    if (nombre && !resuelto) {
      console.error('[deploy] falta ' + nombre + ': ni en el entorno ni en .claude/settings.local.json');
      process.exit(2);
    }
    salida[k] = resuelto;
  }
  return salida;
}

const env = { ...process.env, ...resolverSecretos(s.env) };
const child = spawn(s.command, s.args, { env, stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
let done = false;
const send = o => child.stdin.write(JSON.stringify(o) + '\n');

child.stdout.on('data', d => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
    if (!line) continue;
    let msg; try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id === 1) {
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      console.error('[deploy] handshake ok -> hosting_deployStaticWebsite domain=' + DOMAIN);
      console.error('[deploy] uploading archive (may take a few minutes): ' + ARCHIVE);
      send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'hosting_deployStaticWebsite', arguments: { domain: DOMAIN, archivePath: ARCHIVE, removeArchive: false } } });
    } else if (msg.id === 2) {
      done = true;
      console.log('=== DEPLOY RESULT ===');
      if (msg.error) { console.log('JSONRPC ERROR:', JSON.stringify(msg.error, null, 2)); child.kill(); return process.exit(1); }
      const r = msg.result || {};
      if (r.isError) console.log('** TOOL REPORTED ERROR **');
      for (const c of (r.content || [])) console.log(c.type === 'text' ? c.text : JSON.stringify(c));
      if (!(r.content || []).length) console.log(JSON.stringify(r, null, 2));
      child.kill();
      return process.exit(r.isError ? 1 : 0);
    }
  }
});
child.stderr.on('data', d => process.stderr.write('[srv] ' + d.toString()));
child.on('exit', code => { if (!done) { console.error('[deploy] server exited early, code', code); process.exit(3); } });

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'deploy', version: '1.0' } } });
setTimeout(() => { if (!done) { console.error('[deploy] TIMEOUT after 540s'); child.kill(); process.exit(1); } }, 540000);
