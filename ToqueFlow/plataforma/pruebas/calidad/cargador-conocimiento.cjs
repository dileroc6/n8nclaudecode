// ============================================================================
// ¿El cargador de conocimiento le saca algo útil al sitio de un cliente?
// ----------------------------------------------------------------------------
// Lo que hoy cuesta 20–40 horas por cliente no es copiar el texto de su web:
// es ordenarlo. El cargador automatiza eso, y esta prueba mide la mitad que
// decide si sirve — **bajar el sitio y sacarle texto legible**. Si esa parte
// devuelve tres frases, el documento sale vacío por mucho que la IA lo ordene
// bonito, y el agente sale a producción contestando «no tengo esa información»
// a la pregunta más frecuente.
//
// El paso de IA no se prueba aquí: cuesta plata y depende de una llave. Este
// no cuesta nada, así que puede correr siempre.
//
// **Ejecuta el código de la función de verdad**, no una copia. La copia se
// desincroniza y entonces la prueba pasa mientras producción falla. Se lee
// `index.ts`, se le quitan los tipos y se evalúan las funciones del rastreador.
//
//   node pruebas/calidad/cargador-conocimiento.cjs
//   node pruebas/calidad/cargador-conocimiento.cjs https://otro-sitio.com
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");
const FN = path.join(PLAT, "site", "supabase", "functions", "cargar-conocimiento", "index.ts");

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

// ── Sacar el rastreador de la función, sin copiarlo ─────────────────────────
function cargarRastreador() {
  const src = fs.readFileSync(FN, "utf8");

  // Solo las piezas que no dependen de Deno: los límites, las rutas, la
  // limpieza del HTML, los enlaces y las variantes del dominio.
  const trozos = [];
  for (const nombre of ["MAX_PAGINAS", "MAX_BYTES_HTML", "MAX_TEXTO_PAG", "MAX_BYTES_DOC", "TIMEOUT_MS"]) {
    const m = src.match(new RegExp("^const\\s+" + nombre + "\\s*=[^;]+;", "m"));
    if (!m) throw new Error("no encontré la constante " + nombre + " en index.ts");
    trozos.push(m[0]);
  }
  for (const nombre of ["RUTAS_UTILES"]) {
    const i = src.indexOf("const " + nombre);
    if (i < 0) throw new Error("no encontré " + nombre);
    // Termina en `"i");` — la declaración ocupa varias líneas.
    const fin = src.indexOf('"i");', i);
    if (fin < 0) throw new Error("no encontré dónde termina " + nombre);
    trozos.push(src.slice(i, fin + 5));
  }
  for (const nombre of ["textoDesdeHtml", "enlacesInternos", "variantes"]) {
    const i = src.indexOf("function " + nombre);
    if (i < 0) throw new Error("no encontré la función " + nombre);
    // Hasta la línea que cierra la función a nivel cero de indentación.
    const fin = src.indexOf("\n}", i);
    trozos.push(src.slice(i, fin + 2));
  }

  // Quitar los tipos de TypeScript. Son pocos y simples en este archivo.
  const js = trozos.join("\n\n")
    .replace(/:\s*(string|number|boolean|URL)\[\]/g, "")
    .replace(/:\s*(string|number|boolean|URL)\b/g, "")
    .replace(/<string>/g, "")
    .replace(/\bnew Set\(\)/g, "new Set()");

  const mod = {};
  new Function("exports", js + "\nexports.textoDesdeHtml=textoDesdeHtml;exports.enlacesInternos=enlacesInternos;" +
    "exports.variantes=variantes;exports.RUTAS_UTILES=RUTAS_UTILES;exports.MAX_TEXTO_PAG=MAX_TEXTO_PAG;" +
    "exports.MAX_BYTES_HTML=MAX_BYTES_HTML;exports.MAX_PAGINAS=MAX_PAGINAS;")(mod);
  return mod;
}

// ── Los sitios ──────────────────────────────────────────────────────────────
// REALES, de clientes. Probarlo con sitios inventados es lo que hizo que el
// bug de los teléfonos no lo viera ninguna prueba.
const SITIOS = process.argv.slice(2).length ? process.argv.slice(2) : [
  { url: "https://bejauha.com", quien: "Bejauha (el cliente de referencia)" },
  { url: "https://savia-wear.com", quien: "Savia (tienda)" },
  { url: "https://www.zoetantricspa.com", quien: "Zoe — con www, que NO resuelve" },
];

(async () => {
  let R;
  try { R = cargarRastreador(); }
  catch (e) {
    console.log("❌ No pude leer el rastreador de index.ts: " + e.message);
    console.log("   (si la función cambió de forma, hay que ajustar esta prueba —");
    console.log("    a propósito: es la señal de que el código real se movió)");
    process.exit(1);
  }
  console.log("Rastreador leído de la función de verdad.\n");

  const bajar = async (u) => {
    const ctl = new AbortController();
    const reloj = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await fetch(u, { signal: ctl.signal, headers: { "User-Agent": "ToqueFlow/1.0 (+https://toqueflow.com)" }, redirect: "follow" });
      if (!r.ok) return { error: "HTTP " + r.status };
      return { html: (await r.text()).slice(0, R.MAX_BYTES_HTML), url: r.url || u };
    } catch (e) {
      return { error: e.name === "AbortError" ? "tardó demasiado" : (e.cause && e.cause.code) || e.message };
    } finally { clearTimeout(reloj); }
  };

  for (const s of (typeof SITIOS[0] === "string" ? SITIOS.map((u) => ({ url: u, quien: u })) : SITIOS)) {
    console.log("── " + s.quien);

    // Se prueban las dos variantes del dominio, como hace la función.
    let portada = null, usada = null;
    for (const u of R.variantes(new URL(s.url))) {
      const r = await bajar(u);
      if (r.html) { portada = r; usada = u; break; }
    }

    if (!portada) {
      check(false, "entra al sitio", "ninguna variante del dominio respondió");
      console.log("");
      continue;
    }
    if (usada !== s.url) console.log("     (con " + s.url + " no; se entró por " + usada + ")");

    const texto = R.textoDesdeHtml(portada.html).slice(0, R.MAX_TEXTO_PAG);
    const enlaces = R.enlacesInternos(portada.html, new URL(portada.url)).slice(0, R.MAX_PAGINAS - 1);

    // Un documento por debajo de esto no le sirve al agente: son dos párrafos.
    check(texto.length >= 800, "saca texto legible de la portada", texto.length + " caracteres");

    // Encontrar páginas es lo que trae los precios: casi nunca están en la
    // portada. Cero enlaces significa que el documento sale con lo del hero.
    check(enlaces.length >= 1, "encuentra páginas internas útiles",
      "0 enlaces casaron con las rutas conocidas");
    if (enlaces.length) {
      console.log("     páginas: " + enlaces.map((u) => new URL(u).pathname).slice(0, 5).join("  ") +
        (enlaces.length > 5 ? "  …" : ""));
    }

    // Se bajan también las internas: es lo que la función manda al modelo, y
    // medir solo la portada mide menos de lo que hace el código. El contacto de
    // una tienda suele estar en /contacto, no en el hero.
    let completo = texto;
    for (const u of enlaces) {
      const r = await bajar(u);
      if (r.html) completo += "\n" + R.textoDesdeHtml(r.html).slice(0, R.MAX_TEXTO_PAG);
    }
    console.log("     texto que se le mandaría al modelo: " + completo.length + " caracteres");

    check(completo.length >= 2000, "junta material suficiente para un documento",
      completo.length + " caracteres — con menos, el documento sale con dos párrafos");

    const todo = completo.toLowerCase();
    check(/servicio|producto|tratamiento|plan|clase|curso|habitaci[oó]n/.test(todo),
      "aparece algo que el negocio vende", "no aparece en ninguna página");

    // El contacto NO es un fallo si no está: hay sitios que de verdad no lo
    // publican. Es un aviso, porque el documento saldrá sin la sección
    // «Ubicación y contacto» y conviene saberlo antes de encender el agente.
    const hayContacto = /whatsapp|tel[eé]fono|\d{3}\s?\d{3}\s?\d{4}|@[a-z0-9.-]+\.[a-z]{2,}/.test(todo);
    console.log("     " + (hayContacto ? "✅" : "⚠️ ") + " forma de contacto" +
      (hayContacto ? "" : " — este sitio no la publica; el documento saldrá sin esa sección"));

    console.log("");
  }

  console.log("═".repeat(70));
  if (!fallos.length) console.log("✅ El rastreador saca material utilizable de los sitios reales.");
  else {
    console.log("❌ " + fallos.length + " comprobación(es) fallaron:");
    for (const f of Array.from(new Set(fallos))) console.log("   · " + f);
    console.log("\n   Ojo: que falle puede ser del SITIO y no del código —un cliente");
    console.log("   con la web caída o hecha con JavaScript da esto mismo. Lo que");
    console.log("   no puede pasar es que el cargador se lo calle.");
  }
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
