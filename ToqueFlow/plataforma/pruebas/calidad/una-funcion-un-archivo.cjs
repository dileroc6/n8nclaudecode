// ============================================================================
// Una función, un archivo
// ----------------------------------------------------------------------------
// `tf_tool_agendar_cita` estaba definida en DOS archivos, con cuerpos
// distintos: uno pedía un timestamp ISO y el otro fecha y hora por separado.
// Ninguno de los dos estaba mal — el segundo era el arreglo del primero.
//
// El problema es que reaplicar los esquemas en un orden u otro decide EN
// SILENCIO cuál de las dos versiones corre. Un día el agente empezó a contestar
// «no se pudo agendar por un error técnico» sin que ningún archivo hubiera
// cambiado: solo se habían aplicado en otro orden.
//
// No es la primera vez. Ya pasó con `incluye` del catálogo (re-aplicar un
// esquema borró una herramienta del agente) y con `tf_agente_contexto`, que
// llegó a estar en NUEVE archivos.
//
// Esto lo convierte en un error que salta.
//
// LA LISTA DE PENDIENTES NO PUEDE CRECER
//
// Quedan duplicados de antes. Están abajo con nombre y apellido, y la prueba
// falla si aparece uno NUEVO o si uno de la lista ya se arregló y nadie lo
// quitó de aquí. Una lista de excepciones que nadie actualiza deja de ser una
// lista de pendientes y pasa a ser un permiso.
//
//   node pruebas/calidad/una-funcion-un-archivo.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "..", "site", "supabase");

// Lo que ya estaba roto antes de que esto existiera. Cada línea es una bomba
// que espera a que alguien reaplique los esquemas en otro orden.
// Estuvo llena. El 24-sep se consolidaron las seis que quedaban, y la lista
// quedo VACIA por primera vez.
//
// Se deja el mecanismo, no el contenido: el dia que alguien agregue una
// funcion en dos archivos, esta prueba lo dice antes de que decida sola cual
// version corre. Vaciarla no es cerrarla — es el estado en el que tiene que
// mantenerse.
const PENDIENTES = [];

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

// Se compara por FIRMA, no por nombre: dos funciones con el mismo nombre y
// distintos parámetros son una sobrecarga legítima —`tf_tool_ver_disponibilidad`
// tiene una versión jsonb y una de tres parámetros a propósito— y marcarlas
// sería ruido que enseña a ignorar la prueba.
const firma = (texto, desde) => {
  const abre = texto.indexOf("(", desde);
  if (abre < 0) return "()";
  let prof = 0, i = abre;
  for (; i < texto.length; i++) {
    if (texto[i] === "(") prof++;
    else if (texto[i] === ")") { prof--; if (prof === 0) break; }
  }
  return texto.slice(abre, i + 1)
    // Solo los TIPOS: `p_payload jsonb` y `p_datos jsonb` son la misma firma.
    .replace(/\bp_[a-z_]+\s+/g, "")
    .replace(/\s+/g, " ")
    .replace(/default\s+[^,)]+/gi, "")
    .trim();
};

const donde = new Map();   // "nombre(firma)" -> [archivos]

for (const archivo of fs.readdirSync(DIR).filter((f) => f.endsWith(".sql"))) {
  const t = fs.readFileSync(path.join(DIR, archivo), "utf8");
  const re = /create\s+or\s+replace\s+function\s+public\.([a-z0-9_]+)\s*\(/gi;
  let m;
  while ((m = re.exec(t)) !== null) {
    const clave = m[1] + firma(t, m.index + m[0].length - 1);
    if (!donde.has(clave)) donde.set(clave, []);
    donde.get(clave).push(archivo);
  }
}

const duplicadas = [];
for (const [clave, archivos] of donde) {
  if (archivos.length > 1) duplicadas.push({ nombre: clave.split("(")[0], clave, archivos });
}

console.log("Funciones definidas en más de un sitio, por firma:\n");

const nuevas = duplicadas.filter((d) => !PENDIENTES.includes(d.nombre));
check(nuevas.length === 0,
  "ninguna función NUEVA quedó definida en dos sitios",
  nuevas.map((d) => d.clave + " → " + d.archivos.join(" y ")).join(" · "));

const yaArregladas = PENDIENTES.filter((n) => !duplicadas.some((d) => d.nombre === n));
check(yaArregladas.length === 0,
  "y la lista de pendientes no tiene sobrantes",
  "ya no están duplicadas, hay que quitarlas de PENDIENTES: " + yaArregladas.join(", "));

if (duplicadas.length) {
  console.log("\n  Lo que queda por consolidar:");
  for (const d of duplicadas.sort((a, b) => b.archivos.length - a.archivos.length)) {
    console.log("    · " + d.nombre + " — " + d.archivos.length + " definiciones: " +
      Array.from(new Set(d.archivos)).join(", "));
  }
}

console.log("\n" + "═".repeat(70));
console.log(fallos.length
  ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
  : "✅ Ninguna función nueva se define en dos sitios. Quedan " +
    duplicadas.length + " de antes, todas declaradas.");
process.exitCode = fallos.length ? 1 : 0;
