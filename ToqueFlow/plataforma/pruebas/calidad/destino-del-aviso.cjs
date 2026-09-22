// ============================================================================
// ¿El validador del destino sabe fallar?
// ----------------------------------------------------------------------------
// Cuando el agente no sabe algo, deja de responder y avisa a una persona. La
// mitad que se calla funciona siempre; la que avisa depende de que el destino
// sea algo a lo que de verdad se pueda escribir.
//
// En Bejauha estaba escrito en PALABRAS —«equipo de Bejauha», «administración»—
// y el flujo manda ese texto como si fuera un número. Evolution lo rechaza, el
// aviso no llega, y la persona que quería comprar queda esperando en silencio.
//
// Y no era descuido de ese cliente: el alta grababa `destino: 'equipo'` fijo,
// sin preguntarlo. El defecto salía de fábrica.
//
// Esto prueba el validador de las DOS formas —que cace lo que no sirve y que no
// rechace lo que sí— porque un validador que estorba se acaba desactivando, y
// entonces da igual lo bien que cace.
//
//   node pruebas/calidad/destino-del-aviso.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

// El archivo se escribió para el navegador: se le da un `window` y se lee.
const src = fs.readFileSync(path.join(PLAT, "site", "destino-aviso.js"), "utf8");
const window = {};
new Function("window", src)(window);
const D = window.TF_DESTINO;

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

// Lo que TIENE que rechazar. Los dos primeros son los de Bejauha, tal cual.
const NO_SIRVEN = [
  ["«equipo de Bejauha», tal como está hoy", "equipo de Bejauha"],
  ["«administración», tal como está hoy", "administración"],
  ["lo que grababa el alta", "equipo"],
  ["lo que sugería la consola", "grupo de ventas"],
  ["un cargo", "el gerente"],
  ["un correo, que no es WhatsApp", "ventas@clinica.com"],
  ["un número sin indicativo", "3001234567"],
  ["vacío", ""],
  ["solo espacios", "   "],
  ["una URL sin cifrar", "http://miweb.com/aviso"],
];

// Lo que NO puede rechazar: son las formas correctas.
const SI_SIRVEN = [
  ["un número colombiano", "573001234567"],
  ["con el más adelante", "+573001234567"],
  ["escrito con espacios y guiones", "+57 300 123-4567"],
  ["un número español", "34600111222"],
  ["un grupo de WhatsApp", "120363041234567890@g.us"],
  ["un webhook propio", "https://miweb.com/avisos/toque"],
];

console.log("Lo que NO puede pasar (el aviso no llegaría a nadie):");
for (const [que, valor] of NO_SIRVEN) {
  check(!D.valido(valor), que, "lo dio por bueno");
}

console.log("\nLo que SÍ tiene que aceptar:");
for (const [que, valor] of SI_SIRVEN) {
  check(D.valido(valor), que, "lo rechazó, y es correcto");
}

// Un «valor inválido» no ayuda: quien lo escribió puso un nombre porque creyó
// que servía, y hay que decirle qué sí sirve.
console.log("\nY cuando rechaza, explica por qué:");
check(/nombre/i.test(D.porQueNoSirve("equipo de Bejauha") || ""),
  "a un nombre le dice que es un nombre", D.porQueNoSirve("equipo de Bejauha"));
check(/indicativo/i.test(D.porQueNoSirve("3001234567") || ""),
  "a un número corto le dice que le falta el indicativo", D.porQueNoSirve("3001234567"));
check(D.porQueNoSirve("573001234567") === null,
  "y a uno bueno no le dice nada", String(D.porQueNoSirve("573001234567")));

// Y que las dos pantallas lo usen de verdad. Tener el validador y no llamarlo
// es exactamente el estado del que veníamos.
console.log("\nY las pantallas lo usan:");
for (const [archivo, que] of [["admin-alta.jsx", "el alta"], ["admin-agente.jsx", "la consola"]]) {
  const t = fs.readFileSync(path.join(PLAT, "site", archivo), "utf8");
  check(/TF_DESTINO\.valido/.test(t), que + " comprueba el destino antes de guardar",
    archivo + " no llama a TF_DESTINO.valido");
}
const html = fs.readFileSync(path.join(PLAT, "site", "admin.html"), "utf8");
check(/destino-aviso\.js/.test(html), "y admin.html carga el validador",
  "sin esto TF_DESTINO no existe y la pantalla revienta al guardar");

console.log("\n" + "═".repeat(70));
console.log(fallos.length
  ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
  : "✅ Caza los nombres, acepta los números, y las dos pantallas lo usan.");
process.exitCode = fallos.length ? 1 : 0;
