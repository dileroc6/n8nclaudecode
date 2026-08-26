// actualizar-ocupacion.cjs — Actualiza el dashboard de ocupación de SM Grand desde el
// export "historico-proyectad*.xls" del hotel.
//
// Por qué existe: el export del hotel (a) solo trae una VENTANA (ej. jun-dic 2026), no el
// histórico completo, y (b) trae % OCUPACION / TARIFA / REVPAR / ACUMULADOS en CERO.
// Así que: FUSIONA (histórico viejo + ventana nueva) y RECALCULA las columnas derivadas.
// Reglas verificadas contra las 852 filas del CSV actual:
//   occ%  = noches / 49
//   tarifa= revenue / noches      revpar = revenue / 49
//   acumulados = running totals sobre todo el archivo; occ acum = acumNoches/(dias*49)
//
// uso (xlsx vive en el proyecto SM Grand):
//   NODE_PATH="d:/Ferney Rojas/SM Grand Hotel/node_modules" node actualizar-ocupacion.cjs "<ruta.xls>" [--cut YYYY-MM-DD] [--dry]
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const ROOMS = 49;
const XLS = process.argv[2];
const DRY = process.argv.includes('--dry');
const cutArg = process.argv.indexOf('--cut');
const CUT = cutArg > -1 ? process.argv[cutArg + 1] : new Date().toISOString().slice(0, 10);
if (!XLS) { console.error('uso: node actualizar-ocupacion.cjs "<ruta.xls>" [--cut YYYY-MM-DD] [--dry]'); process.exit(2); }

const CSV = path.join(__dirname, 'site', 'sm-grand', 'data.csv');
const HTML = path.join(__dirname, 'site', 'sm-grand', 'ocupacion.html');
const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const n2 = (n) => (Number.isFinite(n) ? n : 0).toFixed(2).replace('.', ',');
const p2 = (n) => n2(n) + '%';

// ── 1) leer el XLS nuevo ─────────────────────────────────────────────────────
const wb = XLSX.readFile(XLS);
const ws = wb.Sheets[wb.SheetNames[0]];
const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '' });
const nuevas = [];
for (const r of raw) {
  const f = String(r[0] || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) continue;
  nuevas.push({ fecha: f, noches: Number(r[1]) || 0, pax: Number(r[2]) || 0, revenue: Number(r[4]) || 0 });
}
if (!nuevas.length) { console.error('El XLS no trae filas de fecha reconocibles.'); process.exit(3); }
nuevas.sort((a, b) => a.fecha.localeCompare(b.fecha));
const DESDE = nuevas[0].fecha;
console.log('XLS nuevo : ' + nuevas.length + ' filas | ' + DESDE + ' -> ' + nuevas[nuevas.length - 1].fecha);

// ── 2) leer el CSV actual: cabecera + filas ──────────────────────────────────
const lines = fs.readFileSync(CSV, 'utf8').split(/\r?\n/);
const iFirst = lines.findIndex((l) => /^\d{4}-\d{2}-\d{2}/.test(l.trim()));
const cabecera = lines.slice(0, iFirst);
const viejas = lines.slice(iFirst).map((l) => l.trim()).filter((l) => /^\d{4}-\d{2}-\d{2}/.test(l));
console.log('CSV actual: ' + viejas.length + ' filas | ' + viejas[0].split(';')[0] + ' -> ' + viejas[viejas.length - 1].split(';')[0]);

// filas que se conservan tal cual (anteriores a la ventana nueva)
const conservadas = viejas.filter((l) => l.split(';')[0].trim() < DESDE);
console.log('Se conservan ' + conservadas.length + ' filas de histórico; se regeneran ' + nuevas.length + ' desde ' + DESDE);

// estado acumulado al final de las conservadas (para continuar los ACUMULADOS)
let acN = 0, acP = 0, acR = 0, dias = 0;
if (conservadas.length) {
  const c = conservadas[conservadas.length - 1].split(';');
  acN = parseFloat(c[7].replace(/\./g, '').replace(',', '.')) || 0;
  acP = parseFloat(c[8].replace(/\./g, '').replace(',', '.')) || 0;
  acR = parseFloat(c[10].replace(/\./g, '').replace(',', '.')) || 0;
  dias = parseInt(c[13], 10) || 0;
}

// ── 3) generar las filas nuevas con las columnas derivadas ───────────────────
const generadas = nuevas.map((r) => {
  const tarifa = r.noches > 0 ? r.revenue / r.noches : 0;
  const occ = r.noches / ROOMS * 100;
  const revpar = r.revenue / ROOMS;
  acN += r.noches; acP += r.pax; acR += r.revenue; dias += 1;
  const acTar = acN > 0 ? acR / acN : 0;
  const acOcc = dias > 0 ? acN / (dias * ROOMS) * 100 : 0;
  const acRev = dias > 0 ? acR / (dias * ROOMS) : 0;
  return [r.fecha, r.noches, r.pax, n2(tarifa), n2(r.revenue), p2(occ), n2(revpar),
    acN, acP, n2(acTar), n2(acR), p2(acOcc), n2(acRev), dias].join(';');
});

const salida = cabecera.concat(conservadas, generadas).join('\n') + '\n';

// ── 4) INLINE_DATA (respaldo embebido) desde el resultado final ──────────────
const todas = conservadas.concat(generadas).map((l) => {
  const c = l.split(';');
  const [y, m, d] = c[0].split('-').map(Number);
  const noches = parseFloat(c[1].replace(',', '.')) || 0;
  const occ = parseFloat(c[5].replace('%', '').replace(',', '.')) || 0;
  return { y, m, d, noches, occ };
});
const inline = '[' + todas.map((r) => '[' + r.y + ',' + r.m + ',' + r.d + ',' + r.noches + ',' + r.occ + ']').join(',') + ']';

// ── 5) reporte mensual + cifras para la card ─────────────────────────────────
const mm = {};
for (const r of todas) { const k = r.y * 100 + r.m; (mm[k] = mm[k] || { y: r.y, m: r.m, noches: 0, dias: 0 }); mm[k].noches += r.noches; mm[k].dias++; }
const meses = Object.values(mm).map((g) => ({ ...g, occ: g.noches / (g.dias * ROOMS) * 100 })).sort((a, b) => (a.y * 100 + a.m) - (b.y * 100 + b.m));

const [cy, cm] = [Number(CUT.slice(0, 4)), Number(CUT.slice(5, 7))];
// último mes CERRADO = el anterior al mes del corte
const cerrados = meses.filter((g) => (g.y * 100 + g.m) < (cy * 100 + cm));
const ultimo = cerrados[cerrados.length - 1];
const ult12 = cerrados.slice(-12);
const prom12 = ult12.reduce((s, g) => s + g.occ, 0) / ult12.length;

console.log('\n--- Últimos 14 meses (ocupación oficial) ---');
for (const g of meses.slice(-14)) {
  const marca = (g.y * 100 + g.m) === (ultimo.y * 100 + ultimo.m) ? '  <= último mes cerrado' : '';
  console.log('  ' + MESES[g.m] + ' ' + String(g.y).slice(2) + ': ' + String(g.noches).padStart(4) + ' noches / ' + g.dias + ' d -> ' + g.occ.toFixed(1) + '%' + marca);
}
console.log('\n=== CIFRAS PARA LA CARD (corte ' + CUT + ') ===');
console.log('  prom. 12m  (' + MESES[ult12[0].m] + ' ' + String(ult12[0].y).slice(2) + '–' + MESES[ultimo.m] + ' ' + String(ultimo.y).slice(2) + '): ' + prom12.toFixed(1) + '%  -> "' + Math.round(prom12) + '%"');
console.log('  ocup. ' + MESES[ultimo.m].toLowerCase() + ' (último cerrado): ' + ultimo.occ.toFixed(1) + '%  -> "' + Math.round(ultimo.occ) + '%"');
console.log('  spark 12m: [' + ult12.map((g) => Math.round(g.occ)).join(', ') + ']');
console.log('  (la "ocupación real" con complementary necesita el Informe Diario de ' + MESES[ultimo.m] + ')');

// ── 6) escribir ──────────────────────────────────────────────────────────────
if (DRY) { console.log('\n[--dry] no se escribió nada.'); process.exit(0); }
fs.writeFileSync(CSV, salida, 'utf8');
console.log('\n✔ data.csv actualizado (' + (conservadas.length + generadas.length) + ' filas)');

let html = fs.readFileSync(HTML, 'utf8');
const antesInline = html;
html = html.replace(/const INLINE_DATA = \[.*?\];/s, 'const INLINE_DATA = ' + inline + ';');
if (html === antesInline) console.warn('⚠ no pude reemplazar INLINE_DATA (revisar patrón)');
const antesCut = html;
html = html.replace(/const DATA_UPDATED = '[^']*';/, "const DATA_UPDATED = '" + CUT + "';");
if (html === antesCut) console.warn('⚠ no pude reemplazar DATA_UPDATED (revisar patrón)');
fs.writeFileSync(HTML, html, 'utf8');
console.log('✔ ocupacion.html: INLINE_DATA regenerado + DATA_UPDATED = ' + CUT);
