// ============================================================================
// Auditoría de secretos: qué se publicó sin querer
// ----------------------------------------------------------------------------
// Un secreto filtrado no avisa. No hay error, no hay caída, no hay cliente que
// llame: simplemente alguien tiene la llave y uno no se entera. Por eso esto se
// comprueba en vez de recordarse.
//
// Se mira en los tres sitios donde de verdad se escapan:
//
//   1. EL SITIO PUBLICADO. Se descargan los archivos de toqueflow.com y se
//      buscan las llaves dentro. La llave anon SÍ va ahí —es pública por
//      diseño y RLS es lo que protege— pero la de servicio se salta RLS
//      entera, y la cadena de conexión de Postgres es la base completa.
//
//   2. EL REPOSITORIO. Está en GitHub y es público por decisión de Diego. Todo
//      lo que se commitee se lee desde cualquier parte, para siempre: borrarlo
//      después no lo quita del historial.
//
//   3. LO QUE EL PORTAL DEJA VER. `supabase/` no debe publicarse: ahí están el
//      esquema, las edge functions y los `.local.sql` con secretos.
//
//   node pruebas/auditoria-secretos.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const PLAT = path.join(__dirname, "..");
const RAIZ = path.join(PLAT, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DBURL = process.env.SUPABASE_DB_URL || "";
const ANON = process.env.SUPABASE_ANON_KEY || "";

const hallazgos = [];
const anota = (g, que, detalle) => hallazgos.push({ gravedad: g, que, detalle });
const bloque = (t) => console.log("\n── " + t + " " + "─".repeat(Math.max(0, 62 - t.length)));
const ok = (s) => console.log("  ✅ " + s);
const mal = (s) => console.log("  ❌ " + s);

// La contraseña de la base, suelta. Es lo que hay que buscar: la cadena entera
// no aparece nunca literal, pero la contraseña sí puede.
const CLAVE_BD = (DBURL.match(/:\/\/[^:]+:([^@]+)@/) || [])[1] || null;

const PELIGROS = [
  { nombre: "llave de SERVICIO de Supabase", valor: SERVICE, por: "se salta RLS entero: lee y escribe los datos de todos los clientes" },
  { nombre: "contraseña de Postgres", valor: CLAVE_BD, por: "es la base completa, sin pasar por la API" },
];

(async () => {
  // ── 1. El sitio publicado ────────────────────────────────────────────────
  bloque("El sitio publicado en toqueflow.com");

  const site = path.join(PLAT, "site");
  const paginas = fs.readdirSync(site).filter((f) => /\.(html|js|jsx|css|json)$/.test(f));
  console.log("  Descargando " + paginas.length + " archivos del sitio en vivo…");

  let revisados = 0, caidos = 0;
  for (const p of paginas) {
    let cuerpo;
    try {
      const r = await fetch("https://toqueflow.com/" + encodeURIComponent(p));
      if (!r.ok) { caidos++; continue; }
      cuerpo = await r.text();
    } catch (e) { caidos++; continue; }
    revisados++;

    for (const { nombre, valor, por } of PELIGROS) {
      if (valor && valor.length > 12 && cuerpo.includes(valor)) {
        mal(p + " contiene la " + nombre);
        anota("alta", nombre + " publicada en " + p, por);
      }
    }
  }
  if (!hallazgos.length) ok(revisados + " archivos descargados, ninguno trae una llave que no deba");
  if (caidos) console.log("  ℹ️  " + caidos + " no respondieron (no están publicados, que es lo esperado de varios)");

  // La llave anon SÍ debe estar; si no está, algo se rompió en el deploy.
  try {
    const cfg = await (await fetch("https://toqueflow.com/supabase-config.js")).text();
    if (ANON && cfg.includes(ANON)) ok("la llave pública sí está donde debe (supabase-config.js) — es pública por diseño");
    else console.log("  ⚠️  la llave pública no aparece en supabase-config.js; revisar que el portal siga funcionando");
  } catch (e) { console.log("  ⚠️  no pude leer supabase-config.js"); }

  // ── 2. Lo que no debería estar publicado ─────────────────────────────────
  bloque("Lo que no debe verse desde internet");
  const PROHIBIDO = [
    "supabase/schema.sql",
    "supabase/schema-negocio.sql",
    "supabase/schema-agente-runtime.sql",
    "supabase/functions/admin-users/index.ts",
    "credentials.env",
    ".env",
    ".mcp.json",
  ];
  let expuesto = 0;
  for (const ruta of PROHIBIDO) {
    try {
      const r = await fetch("https://toqueflow.com/" + ruta);
      // Hostinger devuelve la portada con 200 para rutas que no existen, así
      // que un 200 no basta: hay que ver si de verdad es el archivo.
      if (r.ok) {
        const t = await r.text();
        const esElArchivo = /create table|create or replace|SUPABASE_|serve\(|Deno\./i.test(t.slice(0, 4000));
        if (esElArchivo) {
          mal(ruta + " se descarga desde internet");
          anota("alta", "publicado: " + ruta, "El deploy no lo excluyo.");
          expuesto++;
        }
      }
    } catch (e) { /* que no responda es lo correcto */ }
  }
  if (!expuesto) ok(PROHIBIDO.length + " rutas comprobadas, ninguna entrega el archivo");

  // ── 3. El repositorio, que es público ────────────────────────────────────
  bloque("El repositorio (es público)");

  // Lo que git tiene versionado AHORA.
  const versionados = execSync("git ls-files", { cwd: RAIZ, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
    .split("\n").filter(Boolean);

  // Se juzga por CONTENIDO, no por nombre. Un `.mcp.json` con
  // `${HOSTINGER_API_TOKEN}` no filtra nada: la primera version marcaba nueve
  // archivos como graves y los nueve eran referencias a variables de entorno.
  // Lo que importa es si dentro hay un VALOR.
  const PARECE_LLAVE = /"(?:[A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD|PASS)[A-Z_]*)"\s*:\s*"([^"$][^"]{15,})"/;

  const conValor = [];
  for (const f of versionados.filter((x) => /(^|\/)(credentials\.env|\.env|\.mcp\.json)$/.test(x) || /\.local\.(txt|sql|json)$/.test(x))) {
    let s; try { s = fs.readFileSync(path.join(RAIZ, f), "utf8"); } catch (e) { continue; }
    const m = s.match(PARECE_LLAVE);
    if (m) conValor.push({ f, pista: m[1].slice(0, 8) + "…" });
  }
  if (!conValor.length) ok("los archivos de configuración versionados solo tienen referencias a variables, ningún valor");
  for (const { f, pista } of conValor) {
    mal(f + " tiene un valor literal (" + pista + ")");
    anota("alta", "secreto literal versionado: " + f, "El repo es publico: se lee desde cualquier parte.");
  }

  // Y el contenido: la llave de servicio o la contraseña dentro de cualquier
  // archivo versionado, aunque el archivo en sí parezca inocente.
  let conLlave = 0;
  for (const f of versionados) {
    const abs = path.join(RAIZ, f);
    let st; try { st = fs.statSync(abs); } catch (e) { continue; }
    if (!st.isFile() || st.size > 2 * 1024 * 1024) continue;
    let s; try { s = fs.readFileSync(abs, "utf8"); } catch (e) { continue; }
    for (const { nombre, valor, por } of PELIGROS) {
      if (valor && valor.length > 12 && s.includes(valor)) {
        mal(f + " contiene la " + nombre);
        anota("alta", nombre + " en el repo: " + f, por + ". El repo es publico.");
        conLlave++;
      }
    }
  }
  if (!conLlave) ok("ningún archivo versionado contiene la llave de servicio ni la contraseña de la base");

  // El historial: aunque hoy esté limpio, lo que se commiteó una vez sigue ahí.
  try {
    const hist = execSync('git log --all --diff-filter=A --name-only --pretty=format: -- "*credentials.env" "*.mcp.json" "*.local.sql"',
      { cwd: RAIZ, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
      .split("\n").map((x) => x.trim()).filter(Boolean);
    const unicos = Array.from(new Set(hist));
    if (!unicos.length) ok("el historial nunca tuvo un archivo de secretos");
    else {
      console.log("  ⚠️  el historial tuvo archivos de secretos: " + unicos.length + " ruta(s)");
      // Que esten en el historial no dice nada por si solo. Lo que decide la
      // urgencia es si la llave SIGUE SIRVIENDO — asi que se prueba.
      const crudo = execSync('git log --all -p --no-color -- "*.mcp.json"',
        { cwd: RAIZ, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
      // Se buscan los JWT sueltos que aparezcan en el historial de esos
      // archivos. Sin expresiones complicadas: un JWT empieza por `eyJ` y no
      // lleva comillas dentro.
      const llaves = Array.from(new Set(
        (crudo.match(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g) || [])
      ));
      for (const k of llaves) {
        const huella = k.slice(0, 8) + "…" + k.slice(-4);
        const r = await fetch("https://n8n.srv1398596.hstgr.cloud/api/v1/workflows?limit=1",
          { headers: { "X-N8N-API-KEY": k } }).catch(() => null);
        if (r && r.ok) {
          mal("la llave de n8n del historial SIGUE SIRVIENDO (" + huella + ")");
          anota("alta", "llave de n8n filtrada y viva",
            "Esta en el historial de un repo PUBLICO y da control total de n8n: todos los flujos de todos los clientes, y las credenciales que llevan dentro. Hay que ROTARLA, borrarla del historial no basta.");
        } else {
          ok("la llave de n8n del historial ya no sirve (" + huella + ") — se rotó");
        }
      }
    }
  } catch (e) { console.log("  ⚠️  no pude revisar el historial: " + e.message); }

  console.log("\n" + "═".repeat(70));
  if (!hallazgos.length) console.log("✅ Ningún secreto publicado.");
  else {
    const altas = hallazgos.filter((h) => h.gravedad === "alta");
    console.log("❌ " + hallazgos.length + " hallazgo(s), " + altas.length + " grave(s):\n");
    for (const h of hallazgos) {
      console.log("  [" + h.gravedad.toUpperCase() + "] " + h.que);
      console.log("          " + h.detalle);
    }
  }
  process.exitCode = hallazgos.some((h) => h.gravedad === "alta") ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
