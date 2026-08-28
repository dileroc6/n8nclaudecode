// ============================================================================
// ToqueFlow — Que el navegador se entere de que el sitio cambió
// ----------------------------------------------------------------------------
// El portal no tiene paso de build: los .jsx y el .css se sirven tal cual, y
// los navegadores los guardan con ganas. Resultado: se despliega un arreglo,
// el usuario abre la página y ve la versión de ayer. Ha pasado varias veces —
// «encendí y no salió nada» era eso, no un error del código.
//
// La solución estándar es ponerle una versión a cada referencia. Aquí la
// versión es un hash del CONTENIDO del archivo, no la fecha: así solo cambia
// la de los archivos que de verdad cambiaron, y el navegador conserva en caché
// todo lo demás. Poner la fecha en todos obligaría a bajarlo todo cada vez.
//
//   node sellar-version.cjs        ← sella (lo corre el deploy)
//   node sellar-version.cjs --ver  ← solo muestra qué cambiaría
// ============================================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SITE = path.join(__dirname, "site");
const SOLO_VER = process.argv.includes("--ver");

const huella = (rel) => {
  const p = path.join(SITE, rel);
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0, 8);
};

let tocados = 0, referencias = 0;

for (const archivo of fs.readdirSync(SITE).filter((f) => f.endsWith(".html"))) {
  const p = path.join(SITE, archivo);
  const antes = fs.readFileSync(p, "utf8");

  // Solo lo local: los CDN traen su propia versión en la ruta.
  const despues = antes.replace(
    /((?:src|href)=")([^"?]+\.(?:jsx|js|css))(?:\?v=[a-f0-9]+)?(")/g,
    (todo, ini, ruta, fin) => {
      if (/^https?:|^\/\//.test(ruta)) return todo;
      const h = huella(ruta);
      if (!h) return todo;
      referencias++;
      return ini + ruta + "?v=" + h + fin;
    }
  );

  if (despues !== antes) {
    tocados++;
    if (!SOLO_VER) fs.writeFileSync(p, despues);
  }
}

console.log(
  (SOLO_VER ? "cambiarían " : "sellados ") + tocados + " HTML · " +
  referencias + " referencias con su huella de contenido"
);
