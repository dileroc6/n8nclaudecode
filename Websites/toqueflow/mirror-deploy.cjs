// Mirror the CURRENT live toqueflow.com (pages + referenced jsx/js/css + asset-root
// files), exactly as served, into _mirror/. Then we add assets/img/ and redeploy.
const fs = require('fs');
const path = require('path');

const ORIGIN = 'https://toqueflow.com';
const OUT = path.join(__dirname, '_mirror');

const PAGES = [
  'index.html', 'nosotros.html', 'blog.html', 'blog-post.html', 'contacto.html',
  'login.html', 'dashboard.html', 'perfil.html', 'ajustes.html', 'admin.html',
  'servicios/agentes-virtuales.html', 'servicios/automatizacion.html',
  'servicios/integraciones.html', 'servicios/seguimiento-leads.html',
];
// Asset-root files referenced from JSX (not HTML), so add explicitly:
const ASSET_ROOT = ['assets/favicon.png', 'assets/toqueflow-logo.png', 'assets/hero-bg.mp4'];

function siteResolve(basePath, ref) {
  const baseDir = path.posix.dirname('/' + basePath);
  return path.posix.normalize(path.posix.join(baseDir, ref)).replace(/^\/+/, '');
}

async function dl(sitePath) {
  const res = await fetch(ORIGIN + '/' + sitePath);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + sitePath);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = path.join(OUT, sitePath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf;
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const codeFiles = new Set();
  for (const page of PAGES) {
    const html = (await dl(page)).toString('utf8');
    const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;
    let m;
    while ((m = re.exec(html))) {
      const ref = m[1];
      if (/^(https?:)?\/\//i.test(ref) || /^(data:|#|mailto:)/i.test(ref)) continue;
      const abs = siteResolve(page, ref);
      if (/\.(jsx|js|css)$/i.test(abs)) codeFiles.add(abs);
    }
  }
  for (const f of [...codeFiles].sort()) await dl(f);
  for (const a of ASSET_ROOT) await dl(a);

  // Scan all mirrored text files for assets/img references (to know the full set needed)
  const imgRefs = new Set();
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    if (!/\.(html|jsx|js|css)$/i.test(e.name)) return;
    const t = fs.readFileSync(p, 'utf8');
    const re = /assets\/img\/([A-Za-z0-9_.-]+\.(?:jpg|jpeg|png|webp|gif|svg|mp4))/gi;
    let m; while ((m = re.exec(t))) imgRefs.add(m[1]);
  });
  walk(OUT);

  console.log('PAGES mirrored:', PAGES.length);
  console.log('CODE files mirrored (' + codeFiles.size + '):');
  console.log('  ' + [...codeFiles].sort().join('\n  '));
  console.log('ASSET-ROOT mirrored:', ASSET_ROOT.join(', '));
  console.log('\nassets/img/ referenced by the live site (' + imgRefs.size + '):');
  console.log('  ' + [...imgRefs].sort().join('\n  '));
})().catch(e => { console.error('MIRROR ERROR:', e.message); process.exit(1); });
