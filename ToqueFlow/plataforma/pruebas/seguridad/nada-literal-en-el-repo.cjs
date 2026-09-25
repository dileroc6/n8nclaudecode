// ============================================================================
// Ningún secreto literal en NADA de lo que está versionado
// ----------------------------------------------------------------------------
// El hook de pre-commit mira lo que ENTRA. Esto mira lo que YA ESTÁ — y era una
// diferencia enorme: el hook llevaba semanas en verde mientras el repo público
// tenía dentro dos contraseñas de portal **que todavía abrían la sesión de un
// cliente**, comprobado iniciando sesión con ellas.
//
// El hook no las veía por tres motivos, y los tres están arreglados:
//
//   · exigía el nombre del campo en MAYÚSCULAS, y un workflow de n8n exportado
//     escribe `"apikey"`. O sea que la vía más común de sacar un secreto de
//     este proyecto —exportar un flujo al repo— pasaba por delante sin verse
//   · nunca se había corrido contra lo viejo: un hook solo protege del futuro
//   · marcaba la llave `anon` de Supabase, que es pública por diseño, y una
//     falsa alarma en algo que bloquea commits es un empujón a `--no-verify`
//
// Usa los MISMOS patrones y el MISMO descarte que el hook. Dos criterios
// distintos es como uno de los dos miente.
//
//   node pruebas/seguridad/nada-literal-en-el-repo.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const RAIZ = path.join(__dirname, "..", "..", "..", "..");

const src = fs.readFileSync(path.join(RAIZ, ".githooks", "buscar-secretos.cjs"), "utf8");
const mp = src.match(/const PATRONES = \[([\s\S]*?)\n\];/);
const mn = src.match(/const NO_REVISAR = \[([\s\S]*?)\n\];/);
const mf = src.match(/const MARCADORES[\s\S]*?\n\}/);
if (!mp || !mn || !mf) {
  console.error("No pude leer los patrones del hook. ¿Cambió su forma?");
  process.exit(2);
}
const PATRONES = eval("[" + mp[1] + "]");     // eslint-disable-line no-eval
const NO_REVISAR = eval("[" + mn[1] + "]");   // eslint-disable-line no-eval
eval(mf[0]);                                   // eslint-disable-line no-eval

// `-z` para que los nombres con acentos no lleguen escapados: hay carpetas de
// cliente con tilde y el parseo normal las parte mal.
const archivos = cp.execSync("git ls-files -z", { cwd: RAIZ, encoding: "buffer" })
  .toString("utf8").split("\0").filter(Boolean);

const hallazgos = [];
let leidos = 0;
for (const f of archivos) {
  if (NO_REVISAR.some((n) => f.endsWith(n))) continue;
  if (/\.(png|jpe?g|gif|webp|mp4|mov|pdf|zip|woff2?|ico)$/i.test(f)) continue;
  let t;
  try { t = fs.readFileSync(path.join(RAIZ, f), "utf8"); } catch (e) { continue; }
  leidos++;
  for (const p of PATRONES) {
    const re = new RegExp(p.re.source, p.re.flags.includes("g") ? p.re.flags : p.re.flags + "g");
    let m;
    while ((m = re.exec(t)) !== null) {
      if (esFalsaAlarma(m[0])) continue;
      hallazgos.push({
        f, que: p.que,
        linea: t.slice(0, m.index).split("\n").length,
        // Nunca el valor entero: la salida de una prueba acaba en un log.
        pista: m[0].length > 18 ? m[0].slice(0, 10) + "…" + m[0].slice(-4) : m[0],
      });
    }
  }
}

console.log("Archivos versionados revisados: " + leidos + "\n");

if (!hallazgos.length) {
  console.log("  ✅ Ningún secreto literal en nada de lo que está versionado.");
  console.log("\n" + "═".repeat(70));
  console.log("✅ El repo está limpio, no solo los commits nuevos.");
  process.exit(0);
}

const porArchivo = {};
hallazgos.forEach((h) => { (porArchivo[h.f] = porArchivo[h.f] || []).push(h); });
for (const [f, hs] of Object.entries(porArchivo).sort((a, b) => b[1].length - a[1].length)) {
  console.log("  ❌ " + f + "  (" + hs.length + ")");
  console.log("       línea " + hs[0].linea + ": " + hs[0].que);
  console.log("       " + hs[0].pista);
}

console.log("\n" + "═".repeat(70));
console.log("❌ " + hallazgos.length + " secreto(s) literales en " +
  Object.keys(porArchivo).length + " archivo(s) versionados.");
console.log("\n   Quitarlos del archivo NO los despublica: si el repo es público,");
console.log("   llevan ahí desde el commit que los metió. Hay que ROTARLOS.");
process.exitCode = 1;
