// ============================================================================
// Que ningún cliente vea el vocabulario de otro
// ----------------------------------------------------------------------------
// La regla de Diego: si es un módulo estándar debe servirle a TODOS los
// sectores. Esta prueba la vigila en el único sitio donde se rompe sin que
// nadie se dé cuenta — el texto de las pantallas compartidas.
//
// El problema real que encontró: `contactos.html` mostraba «Plan», «Clases»,
// «Vence» y un desplegable con karma / beja / uha. Una ferretería entraba a su
// propio panel y leía los productos de un estudio de yoga. Nada fallaba, no
// salía ningún error, y sin embargo el producto estaba diciendo que no es para
// ella.
//
// Por eso es una prueba de texto y no de comportamiento: el daño es que se lee
// mal, no que se caiga.
//
//   node pruebas/nada-de-un-cliente.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const SITE = path.join(__dirname, "..", "site");

// Las pantallas que ve CUALQUIER cliente. Las de la consola de ToqueFlow no
// entran: ahí sí se nombra a los clientes, que es de lo que tratan.
const COMPARTIDAS = ["contactos.html", "campanas.html", "dashboard.html", "login.html"];

// Palabras de un cliente concreto que no deben aparecer en el texto que ve
// otro. Se buscan como palabra suelta para no cazar `clases_restantes`, que es
// un nombre de columna y no se lee en pantalla.
const DE_UN_CLIENTE = [
  { re: /\bkarma\b/i,      que: "un producto de Bejauha" },
  { re: /\bbeja\b/i,       que: "un producto de Bejauha" },
  { re: /\buha\b/i,        que: "un producto de Bejauha" },
  { re: /\balumn[oa]s?\b/i, que: "supone que el negocio enseña" },
  { re: /\bmembres[ií]as?\b/i, que: "supone que el negocio cobra membresías" },
  { re: /\bclases\b/i,     que: "supone que el negocio da clases" },
  { re: /\bgimnasio\b/i,   que: "supone un sector" },
  { re: /\bpacientes?\b/i, que: "supone un sector" },
];

// Lo que sí puede quedarse, y por qué. Nada entra aquí sin una razón escrita.
const PERDONADO = [
  { archivo: "contactos.html", re: /const DISP=\{uja:'uha'\}/,
    porque: "es el dato real de Bejauha, no un texto de pantalla" },
  { archivo: "campanas.html", re: /const DISP = \{ uja: 'uha' \}/,
    porque: "igual que el anterior" },
];

const fallos = [];

// Solo se mira lo que se LEE: el texto entre etiquetas, los placeholder, los
// title y las cadenas del JavaScript. Los comentarios del código no cuentan —
// explicar de dónde viene una decisión es justo lo que hay que hacer.
function sinComentarios(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

console.log("Pantallas que ve cualquier cliente:\n");

for (const archivo of COMPARTIDAS) {
  const p = path.join(SITE, archivo);
  if (!fs.existsSync(p)) { console.log("  ⚠️  " + archivo + " no existe"); continue; }
  const crudo = fs.readFileSync(p, "utf8");
  const texto = sinComentarios(crudo);

  const encontrados = [];
  for (const { re, que } of DE_UN_CLIENTE) {
    const m = texto.match(re);
    if (!m) continue;
    const perdon = PERDONADO.find((x) => x.archivo === archivo && x.re.test(crudo)
      && new RegExp(re.source, "i").test(x.re.source));
    if (perdon) continue;

    // La línea, para que quien lea el fallo sepa dónde mirar.
    const antes = texto.slice(0, texto.search(re));
    const linea = antes.split("\n").length;
    encontrados.push("«" + m[0] + "» en la línea " + linea + " — " + que);
  }

  if (encontrados.length) {
    console.log("  ❌ " + archivo);
    encontrados.forEach((e) => console.log("       " + e));
    fallos.push(archivo);
  } else {
    console.log("  ✅ " + archivo);
  }
}

// El simulador queda fuera a propósito, y conviene decirlo en voz alta en vez
// de que parezca que pasó.
console.log("\n  (modo-prueba.html no se revisa todavía: está escrito alrededor");
console.log("   de las clases de Bejauha. Es la tarea 54 del tablero.)");

console.log("\n═══ " + (fallos.length
  ? fallos.length + " pantalla(s) con vocabulario de un cliente"
  : "Ninguna pantalla compartida habla de un solo sector") + " ═══");
process.exitCode = fallos.length ? 1 : 0;
