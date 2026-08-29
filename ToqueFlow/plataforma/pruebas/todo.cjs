// ============================================================================
// Correr todas las pruebas de una
// ----------------------------------------------------------------------------
// Hasta hoy cada prueba se corría a mano, y eso significa que en la práctica se
// corren las que uno recuerda. Esto las corre todas y da un solo veredicto.
//
// Las de conversación quedan aparte porque cuestan plata (le hablan de verdad a
// Claude, ~$0.08 la corrida) y tardan. Las demás son gratis y rápidas, así que
// son las que hay que correr antes de tocar nada.
//
//   node pruebas/todo.cjs          ← las gratis
//   node pruebas/todo.cjs --con-ia ← también las de conversación
// ============================================================================
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AQUI = __dirname;
const CON_IA = process.argv.includes("--con-ia");

// El orden importa para leerlo, no para que funcione: primero lo que se rompe
// solo (compilar), después lo que se rompe con datos (aislamiento), al final lo
// que cuesta plata.
const ORDEN = [
  "compila-jsx",
  "aislamiento-rls",
  "aislamiento-entre-clientes",
  "canario-entre-agentes",
  "consola-agentes",
  "consola-catalogo",
  "consola-alta",
  "cliente-contactos",
  "cliente-campos",
];
// El canario SÍ va en las de siempre aunque le hable a Claude: es la que
// detecta fugas entre agentes, y una prueba de seguridad que se corre "cuando
// hay tiempo" no es una prueba de seguridad. Cuesta centavos.
const CUESTAN = ["correr-pruebas", "calidad-conversacion"];

// Si alguien agrega una prueba nueva y se le olvida ponerla en la lista, que se
// corra igual. Es preferible correr de más que dejar una prueba muerta.
const todas = fs.readdirSync(AQUI)
  .filter((f) => f.endsWith(".cjs") && f !== "todo.cjs")
  .map((f) => f.replace(/\.cjs$/, ""));
const sueltas = todas.filter((n) => !ORDEN.includes(n) && !CUESTAN.includes(n));

const lista = ORDEN.filter((n) => todas.includes(n))
  .concat(sueltas)
  .concat(CON_IA ? CUESTAN.filter((n) => todas.includes(n)) : []);

if (sueltas.length) console.log("(pruebas nuevas, sin ordenar: " + sueltas.join(", ") + ")\n");

const arranque = process.hrtime.bigint();
const resultados = [];

for (const nombre of lista) {
  process.stdout.write("── " + nombre + " ".padEnd(Math.max(1, 34 - nombre.length), "─") + " ");
  const t0 = process.hrtime.bigint();
  const r = spawnSync(process.execPath, [path.join(AQUI, nombre + ".cjs")], { encoding: "utf8" });
  const segs = Number(process.hrtime.bigint() - t0) / 1e9;
  const ok = r.status === 0;
  console.log((ok ? "✅" : "❌") + "  " + segs.toFixed(1) + "s");
  resultados.push({ nombre, ok, segs, salida: (r.stdout || "") + (r.stderr || "") });
}

const fallaron = resultados.filter((x) => !x.ok);

// Solo se imprime lo de las que fallaron. Si todo pasa, el resumen de una línea
// es toda la información que hay; volcar 300 líneas verdes esconde las rojas.
for (const f of fallaron) {
  console.log("\n" + "═".repeat(70) + "\n" + f.nombre + "\n" + "═".repeat(70));
  console.log(f.salida.trim());
}

const total = Number(process.hrtime.bigint() - arranque) / 1e9;
console.log("\n" + "═".repeat(70));
console.log(
  fallaron.length
    ? "❌ " + fallaron.length + " de " + resultados.length + " fallaron: " + fallaron.map((x) => x.nombre).join(", ")
    : "✅ Las " + resultados.length + " pruebas pasaron."
);
console.log("   " + total.toFixed(1) + "s" + (CON_IA ? "" : "  ·  sin las de conversación (--con-ia para incluirlas)"));

process.exit(fallaron.length ? 1 : 0);
