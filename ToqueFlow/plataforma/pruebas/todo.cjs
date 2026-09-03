// ============================================================================
// Correr todas las pruebas de una
// ----------------------------------------------------------------------------
// Antes cada prueba se corría a mano, y eso significa que en la práctica se
// corren las que uno recuerda. Esto las corre todas y da un solo veredicto.
//
// Están separadas en dos carpetas porque responden preguntas distintas:
//
//   seguridad/   ¿puede alguien ver o hacer algo que no debe?
//   calidad/     ¿funciona, y se ve como tiene que verse?
//
// Seguridad va primero a propósito. Si algo se está filtrando, da igual que la
// pantalla se vea bonita.
//
// Las que le hablan a Claude cuestan plata (~$0.10 la corrida) y tardan, así
// que quedan detrás de una bandera — menos el canario de fugas entre agentes,
// que es de seguridad: una prueba de seguridad que se corre «cuando hay
// tiempo» no es una prueba de seguridad.
//
//   node pruebas/todo.cjs             ← las de siempre
//   node pruebas/todo.cjs --con-ia    ← también las de conversación
//   node pruebas/todo.cjs seguridad   ← solo una carpeta
// ============================================================================
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AQUI = __dirname;
const CON_IA = process.argv.includes("--con-ia");
const soloCarpeta = process.argv.slice(2).find((a) => !a.startsWith("--"));

// El orden importa para leerlo, no para que funcione: dentro de cada carpeta,
// primero lo que se rompe solo y después lo que se rompe con datos.
const ORDEN = {
  seguridad: [
    "aislamiento-rls",
    "aislamiento-entre-clientes",
    "auditoria-bd",
    "auditoria-registro-abierto",
    "auditoria-secretos",
    "auditoria-n8n",
    "cliente-tono",
    "cliente-conocimiento",
    "canario-entre-agentes",
  ],
  calidad: [
    "compila-jsx",
    "nada-de-un-cliente",
    "consola-agentes",
    "consola-catalogo",
    "consola-alta",
    "cliente-contactos",
    "cliente-campos",
    "cargador-conocimiento",
    "agenda",
    "agendar-cita",
    "agente-agenda",
    "recordatorio-cita",
  ],
};

// Las que le hablan a Claude. No entran salvo --con-ia.
const CUESTAN = ["correr-pruebas", "calidad-conversacion"];

const carpetas = soloCarpeta ? [soloCarpeta] : ["seguridad", "calidad"];
const lista = [];

for (const carpeta of carpetas) {
  const dir = path.join(AQUI, carpeta);
  if (!fs.existsSync(dir)) { console.log("No existe la carpeta " + carpeta); process.exit(2); }

  const hay = fs.readdirSync(dir).filter((f) => f.endsWith(".cjs")).map((f) => f.replace(/\.cjs$/, ""));
  const ordenadas = (ORDEN[carpeta] || []).filter((n) => hay.includes(n));

  // Si alguien agrega una prueba y se le olvida ponerla en la lista, que se
  // corra igual. Correr de más es mejor que dejar una prueba muerta.
  const sueltas = hay.filter((n) => !ordenadas.includes(n) && !CUESTAN.includes(n));
  if (sueltas.length) console.log("(nuevas en " + carpeta + ", sin ordenar: " + sueltas.join(", ") + ")");

  for (const n of ordenadas.concat(sueltas)) lista.push({ carpeta, nombre: n });
  if (CON_IA) for (const n of CUESTAN.filter((n) => hay.includes(n))) lista.push({ carpeta, nombre: n });
}

if (!lista.length) { console.log("No encontré pruebas que correr."); process.exit(2); }

const arranque = process.hrtime.bigint();
const resultados = [];
let carpetaActual = null;

for (const { carpeta, nombre } of lista) {
  if (carpeta !== carpetaActual) {
    carpetaActual = carpeta;
    console.log("\n" + carpeta.toUpperCase());
  }
  process.stdout.write("  " + nombre + " " + ".".repeat(Math.max(1, 34 - nombre.length)) + " ");
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, [path.join(AQUI, carpeta, nombre + ".cjs")], { encoding: "utf8" });
  const segs = Number(process.hrtime.bigint() - t0) / 1e9;
  const ok = r.status === 0;
  console.log((ok ? "✅" : "❌") + "  " + segs.toFixed(1) + "s");
  resultados.push({ carpeta, nombre, ok, segs, salida: (r.stdout || "") + (r.stderr || "") });
}

const fallaron = resultados.filter((x) => !x.ok);

// Solo se imprime lo de las que fallaron. Si todo pasa, el resumen de una línea
// es toda la información que hay; volcar 300 líneas verdes esconde las rojas.
for (const f of fallaron) {
  console.log("\n" + "═".repeat(70));
  console.log(f.carpeta + " / " + f.nombre);
  console.log("═".repeat(70));
  console.log(f.salida.trim());
}

const total = Number(process.hrtime.bigint() - arranque) / 1e9;
console.log("\n" + "═".repeat(70));
if (fallaron.length) {
  console.log("❌ " + fallaron.length + " de " + resultados.length + " fallaron: " +
    fallaron.map((x) => x.carpeta + "/" + x.nombre).join(", "));
} else {
  const porCarpeta = carpetas.map((c) => resultados.filter((r) => r.carpeta === c).length + " de " + c);
  console.log("✅ Las " + resultados.length + " pruebas pasaron  (" + porCarpeta.join(" · ") + ")");
}
console.log("   " + total.toFixed(1) + "s" + (CON_IA ? "" : "  ·  sin las de conversación (--con-ia para incluirlas)"));

process.exit(fallaron.length ? 1 : 0);
