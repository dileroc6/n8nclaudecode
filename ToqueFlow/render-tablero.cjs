// render-tablero.cjs — Genera TABLERO.html desde TABLERO.md con el sistema de
// diseño de ToqueFlow (paleta naranja sobre azul petróleo, Sora/Manrope/JetBrains
// Mono, tema claro y oscuro). Las filas ya cerradas quedan atenuadas.
//
// uso:  node render-tablero.cjs
//
// Existe para que el HTML no se desactualice: se regenera desde el markdown,
// que es la fuente de verdad.

const fs = require('fs');
const path = require('path');
const DIR = __dirname;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(s) {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return t;
}

const md = fs.readFileSync(path.join(DIR, 'TABLERO.md'), 'utf8').split(/\r?\n/);
const out = [];
let i = 0, abiertas = 0, cerradas = 0;

function tabla() {
  const filas = [];
  while (i < md.length && md[i].trim().startsWith('|')) {
    filas.push(md[i].trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
    i++;
  }
  if (filas.length < 2) return;
  const head = filas[0];
  const esTareas = /^#$/.test(head[0]);
  out.push('<div class="tw"><table' + (esTareas ? ' class="tareas"' : '') + '>');
  out.push('<thead><tr>' + head.map((h) => '<th>' + inline(h) + '</th>').join('') + '</tr></thead><tbody>');
  for (const r of filas.slice(2)) {
    const hecha = r.some((c) => /~~|✅/.test(c));
    if (esTareas) { hecha ? cerradas++ : abiertas++; }
    out.push('<tr' + (hecha ? ' class="hecha"' : '') + '>' +
      r.map((c, n) => '<td' + (esTareas && n === 0 ? ' class="id"' : '') + '>' + inline(c) + '</td>').join('') + '</tr>');
  }
  out.push('</tbody></table></div>');
}

while (i < md.length) {
  const t = md[i].trim();
  if (!t) { i++; continue; }
  if (t === '---') { out.push('<hr>'); i++; continue; }
  if (t.startsWith('|')) { tabla(); continue; }
  if (t.startsWith('### ')) { out.push('<h3>' + inline(t.slice(4)) + '</h3>'); i++; continue; }
  if (t.startsWith('## ')) { out.push('<h2>' + inline(t.slice(3)) + '</h2>'); i++; continue; }
  if (t.startsWith('# ')) { out.push('<h1>' + inline(t.slice(2)) + '</h1>'); i++; continue; }
  if (t.startsWith('>')) {
    const buf = [];
    while (i < md.length && md[i].trim().startsWith('>')) { buf.push(md[i].trim().replace(/^>\s?/, '')); i++; }
    out.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>');
    continue;
  }
  if (/^(\d+\.|[-*])\s/.test(t)) {
    const ord = /^\d+\.\s/.test(t);
    const buf = [];
    while (i < md.length && /^(\d+\.|[-*])\s/.test(md[i].trim())) { buf.push(md[i].trim().replace(/^(\d+\.|[-*])\s/, '')); i++; }
    out.push(`<${ord ? 'ol' : 'ul'}>` + buf.map((b) => '<li>' + inline(b) + '</li>').join('') + `</${ord ? 'ol' : 'ul'}>`);
    continue;
  }
  const buf = [];
  while (i < md.length && md[i].trim() && !/^[|#>-]/.test(md[i].trim())) { buf.push(md[i].trim()); i++; }
  if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>'); else i++;
}

const CSS = `
:root{
  --brand-1:#c1272d; --brand-2:#f15a24;
  --grad:linear-gradient(135deg,#c1272d 0%,#f15a24 100%);
  --bg:#ffffff; --ink:#0a2230;
  --mute:rgba(10,34,48,.66); --faint:rgba(10,34,48,.44);
  --line:rgba(10,34,48,.13); --line-soft:rgba(10,34,48,.07);
  --card:rgba(10,34,48,.022);
  --done:#1c6b52; --done-bg:rgba(28,107,82,.06);
  --sans:"Sora",ui-sans-serif,system-ui,sans-serif;
  --body:"Manrope",ui-sans-serif,system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --brandface:"Audiowide","Sora",sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#0a2230; --ink:#e9ecee;
  --mute:rgba(233,236,238,.66); --faint:rgba(233,236,238,.44);
  --line:rgba(233,236,238,.15); --line-soft:rgba(233,236,238,.08);
  --card:rgba(255,255,255,.035);
  --done:#5ecfa2; --done-bg:rgba(94,207,162,.07);
}}
:root[data-theme="dark"]{
  --bg:#0a2230; --ink:#e9ecee;
  --mute:rgba(233,236,238,.66); --faint:rgba(233,236,238,.44);
  --line:rgba(233,236,238,.15); --line-soft:rgba(233,236,238,.08);
  --card:rgba(255,255,255,.035);
  --done:#5ecfa2; --done-bg:rgba(94,207,162,.07);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.62;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:48px 24px 110px}
.marca{font-family:var(--brandface);font-size:.78rem;letter-spacing:.05em;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;margin:0 0 20px}
h1{font-family:var(--sans);font-weight:700;font-size:clamp(2rem,5vw,2.9rem);line-height:1.06;letter-spacing:-.028em;margin:0 0 24px}
h2{font-family:var(--sans);font-weight:650;font-size:1.32rem;letter-spacing:-.022em;margin:50px 0 14px;padding-bottom:10px;border-bottom:1px solid var(--line)}
h3{font-family:var(--sans);font-weight:600;font-size:1.02rem;margin:28px 0 10px}
p{margin:0 0 14px;max-width:80ch}
blockquote{border-left:3px solid;border-image:var(--grad) 1;padding:2px 0 2px 20px;margin:0 0 20px;color:var(--mute);max-width:78ch}
ul,ol{max-width:80ch;margin:0 0 16px;padding-left:1.2em;color:var(--mute)}
li{margin-bottom:7px} li strong,p strong{color:var(--ink);font-weight:650}
hr{border:0;border-top:1px solid var(--line-soft);margin:32px 0}
code{font-family:var(--mono);font-size:.85em;background:var(--card);border:1px solid var(--line-soft);border-radius:3px;padding:.08em .32em}
a{color:var(--ink);text-decoration:underline;text-decoration-color:var(--brand-2);text-underline-offset:3px}
del{color:var(--faint)}
.tw{overflow-x:auto;margin:0 0 22px;border:1px solid var(--line);border-radius:4px}
table{border-collapse:collapse;width:100%;font-size:.9rem;min-width:540px}
th,td{text-align:left;padding:11px 15px;border-bottom:1px solid var(--line-soft);vertical-align:top}
thead th{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--faint);font-weight:500;background:var(--card);border-bottom:1px solid var(--line);white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
td.id{font-family:var(--mono);font-size:.78rem;color:var(--faint);width:46px;white-space:nowrap;font-variant-numeric:tabular-nums}
table.tareas td:nth-child(2){min-width:240px}
tr.hecha{background:var(--done-bg)} tr.hecha td.id{color:var(--done)} tr.hecha td:nth-child(2){color:var(--mute)}
td strong{color:var(--ink);font-weight:650}
.tot{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden;margin:0 0 8px;max-width:420px}
.tot div{background:var(--bg);padding:14px 18px}
.tot .n{font-family:var(--mono);font-size:1.7rem;font-weight:600;line-height:1;display:block;margin-bottom:5px}
.tot .l{font-family:var(--mono);font-size:.62rem;letter-spacing:.13em;text-transform:uppercase;color:var(--faint)}
.tot .ab .n{color:var(--brand-2)} .tot .ce .n{color:var(--done)}
`;

const cuerpo = out.join('\n');
const contador = `<div class="tot"><div class="ab"><span class="n">${abiertas}</span><span class="l">Abiertas</span></div><div class="ce"><span class="n">${cerradas}</span><span class="l">Cerradas</span></div></div>`;

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tablero ToqueFlow</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Audiowide&display=swap">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<p class="marca">TOQUEFLOW</p>
${cuerpo.replace('</h1>', '</h1>' + contador)}
</div>
</body>
</html>`;

fs.writeFileSync(path.join(DIR, 'TABLERO.html'), html);
console.log(`TABLERO.html generado — ${abiertas} abiertas, ${cerradas} cerradas, ${Math.round(html.length / 1024)} KB`);
