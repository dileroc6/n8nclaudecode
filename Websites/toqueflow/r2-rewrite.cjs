// r2-rewrite.cjs — cambia en el código las rutas locales de los assets pesados
// por la URL pública de R2. uso: node r2-rewrite.cjs [reverse]
const fs = require('fs'), path = require('path');
const R2 = 'https://pub-0e0fe333e9d349258d55b3986cb8d38b.r2.dev';
const SITE = path.join(__dirname, 'site');
const reverse = process.argv[2] === 'reverse';

function walk(d){let out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==='supabase'||e.name==='node_modules')continue;const p=path.join(d,e.name);if(e.isDirectory())out=out.concat(walk(p));else if(/\.(jsx|js|html|css)$/.test(e.name))out.push(p);}return out;}

const pairs = [
  ['assets/hero-bg.mp4', R2 + '/hero-bg.mp4'],
  ['assets/img/', R2 + '/img/'],
];
let total = 0;
for (const f of walk(SITE)) {
  let s = fs.readFileSync(f, 'utf8'); const orig = s;
  for (const [local, remote] of pairs) {
    const [from, to] = reverse ? [remote, local] : [local, remote];
    s = s.split(from).join(to);
  }
  if (s !== orig) {
    const n = (orig.match(reverse ? new RegExp(R2.replace(/[.]/g,'\\.') + '/(img/|hero-bg\\.mp4)','g') : /assets\/(img\/|hero-bg\.mp4)/g) || []).length;
    fs.writeFileSync(f, s);
    console.log('  ' + path.relative(SITE, f).replace(/\\/g,'/') + ': ' + n + ' refs');
    total += n;
  }
}
console.log((reverse ? 'Revertidos' : 'Reemplazados') + ' ' + total + ' refs ' + (reverse ? '<- R2' : '-> R2'));
