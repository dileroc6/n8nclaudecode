// extraer-complementary.cjs — lee los 12 "Informe Diario" (PDF) de SM Grand y
// extrae el bloque de habitaciones (cortesias). Columnas por fila:
//   [0]=HOY [1]=ESTE MES(CY) [2]=ANO ACTUAL(YTD) [3]=MES ANO ANTERIOR(PY) [4]=ANO ANTERIOR(YTD PY)
// Salida: tabla en consola + JSON/CSV mensual para construir la pestana.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = process.argv[2] || 'd:/Ferney Rojas/SM Grand Hotel/assets/Informes Complementary';
const MES_ES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function pdftext(file) {
  for (const bin of ['pdftotext', '/mingw64/bin/pdftotext', 'C:/Program Files/Git/mingw64/bin/pdftotext.exe']) {
    try { return execFileSync(bin, ['-layout', '-f', '1', '-l', '1', file, '-'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
    catch (e) { /* probar siguiente */ }
  }
  throw new Error('no pude correr pdftotext en ' + file);
}
function rowNums(text, labelRe) {
  // OJO: 2025 usa PUNTO de miles (1.470), 2026 usa COMA (1,519). Estas filas son
  // enteros (sin decimales), asi que quitamos tanto . como , de cada token.
  for (const line of text.split(/\r?\n/)) {
    if (labelRe.test(line)) {
      const m = line.match(/-?\d[\d.,]*/g) || [];
      return m.map((s) => parseInt(s.replace(/[.,]/g, ''), 10));
    }
  }
  return null;
}
function pctRow(text, labelRe) {
  // fila de % (ej "6.12% 21.79% ...") -> floats por columna
  for (const line of text.split(/\r?\n/)) {
    if (labelRe.test(line)) {
      const m = line.match(/-?\d+\.\d+/g) || [];
      return m.map(Number);
    }
  }
  return null;
}

const files = fs.readdirSync(DIR).filter((f) => /\.pdf$/i.test(f));
const out = [];
for (const f of files) {
  const txt = pdftext(path.join(DIR, f));
  const fecha = (txt.match(/Fecha:\s*(\d{4}-\d{2}-\d{2})/) || [])[1] || '????';
  const vend = rowNums(txt, /HABITACIONES VENDIDAS/i);
  const compl = rowNums(txt, /HABITACIONES COMPLEMENT/i);
  const total = rowNums(txt, /HABITACIONES TOTAL/i);
  const hPag = rowNums(txt, /SPEDES PAGANDO/i);
  const hCompl = rowNums(txt, /SPEDES COMPLEMENT/i);
  const ocup = pctRow(txt, /PORCENTAJE DE OCUPACI/i);   // % reportado (para verificar)
  const warn = [];
  for (const [k, v] of Object.entries({ vend, compl, total, hCompl })) {
    if (!v || v.length < 4) warn.push(k + '(' + (v ? v.length : 'null') + ')');
  }
  const [y, mo] = fecha.split('-').map(Number);
  out.push({
    fecha, y, mo, file: f,
    // CY = ESTE MES (idx1), PY = MES ANO ANTERIOR (idx3)
    vendCY: vend?.[1], vendPY: vend?.[3],
    complCY: compl?.[1], complPY: compl?.[3],
    totalCY: total?.[1], totalPY: total?.[3],
    hComplCY: hCompl?.[1], hComplPY: hCompl?.[3],
    ocupRepCY: ocup?.[1], ocupRepPY: ocup?.[3],
    warn: warn.join(' '),
  });
}
out.sort((a, b) => a.fecha.localeCompare(b.fecha));

const pct = (n, d) => (d ? (n / d * 100) : 0);
const f1 = (n) => n.toFixed(1);

console.log('\n=== CORTESIAS (COMPLEMENTARY) — 12 meses, CY vs PY ===\n');
console.log('Mes    | HabCort CY/PY | HuesCort CY/PY | Vend CY/PY  | Total CY/PY | OcupOfic CY (calc/rep) | OcupReal CY | PYdato?');
console.log('-'.repeat(118));
for (const r of out) {
  const lbl = MES_ES[r.mo] + ' ' + String(r.y).slice(2);
  const ocOfCY = pct(r.vendCY, r.totalCY);
  const ocReCY = pct(r.vendCY + r.complCY, r.totalCY);
  const rep = r.ocupRepCY != null ? f1(r.ocupRepCY) : '?';
  const match = (r.ocupRepCY != null && Math.abs(ocOfCY - r.ocupRepCY) < 0.15) ? 'OK' : '<<CHK';
  const pyHas = (r.complPY > 0 || r.vendPY > 0) ? 'si' : 'NO(0)';
  console.log(
    lbl.padEnd(6) + ' | ' +
    String(r.complCY + '/' + r.complPY).padEnd(13) + ' | ' +
    String(r.hComplCY + '/' + r.hComplPY).padEnd(14) + ' | ' +
    String(r.vendCY + '/' + r.vendPY).padEnd(11) + ' | ' +
    String(r.totalCY + '/' + r.totalPY).padEnd(11) + ' | ' +
    String(f1(ocOfCY) + '% / ' + rep + '% ' + match).padEnd(22) + ' | ' +
    String(f1(ocReCY) + '%').padEnd(11) + ' | ' +
    pyHas + (r.warn ? '  WARN:' + r.warn : '')
  );
}

// guardar JSON y CSV para construir la pestana
const clean = out.map((r) => ({
  ym: r.fecha.slice(0, 7), y: r.y, m: r.mo,
  complCY: r.complCY, complPY: r.complPY,
  hComplCY: r.hComplCY, hComplPY: r.hComplPY,
  vendCY: r.vendCY, vendPY: r.vendPY,
  totalCY: r.totalCY, totalPY: r.totalPY,
}));
fs.writeFileSync(path.join(__dirname, 'complementary-12m.json'), JSON.stringify(clean, null, 2));
console.log('\n-> complementary-12m.json guardado (' + clean.length + ' meses).');
