// ============================================================================
// ¿Compila el JSX del sitio?
// ----------------------------------------------------------------------------
// El portal no tiene paso de build: Babel transforma el JSX en el navegador del
// usuario. Eso significa que un error de sintaxis NO se ve al desplegar — se ve
// cuando alguien abre la página y encuentra un panel en blanco.
//
// Esto corre el mismo Babel, aquí, antes de subir nada.
//
//   node pruebas/compila-jsx.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const SITE = path.join(__dirname, "..", "site");

let babel;
try {
  babel = require(path.join(__dirname, "..", "node_modules", "@babel", "standalone"));
} catch (e) {
  try { babel = require("@babel/standalone"); }
  catch (e2) { console.error("Falta @babel/standalone: npm i --no-save @babel/standalone"); process.exit(2); }
}

const archivos = fs.readdirSync(SITE).filter((f) => f.endsWith(".jsx")).sort();
let malos = 0;

for (const f of archivos) {
  const codigo = fs.readFileSync(path.join(SITE, f), "utf8");
  try {
    // Los mismos presets que usa el navegador con babel standalone.
    babel.transform(codigo, { presets: ["react"], filename: f });
    console.log("  ✅ " + f);
  } catch (e) {
    malos++;
    console.log("  ❌ " + f);
    console.log("     " + String(e.message).split("\n")[0]);
  }
}

// El HTML tiene que cargar todo lo que existe, y no cargar lo que no.
console.log("\nReferencias desde el HTML:");
for (const h of fs.readdirSync(SITE).filter((f) => f.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(SITE, h), "utf8");
  for (const m of html.matchAll(/src="([^"]+\.(?:jsx|js))"/g)) {
    const ref = m[1];
    if (/^https?:/.test(ref)) continue;
    if (!fs.existsSync(path.join(SITE, ref))) {
      malos++;
      console.log("  ❌ " + h + " carga " + ref + " y ese archivo no existe");
    }
  }
}
if (!malos) console.log("  ✅ todas las rutas existen");

process.exit(malos ? 1 : 0);
