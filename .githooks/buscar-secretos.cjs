// ============================================================================
// Buscar secretos en lo que está a punto de entrar al commit
// ----------------------------------------------------------------------------
// Lo corre el hook `pre-commit`. Mira SOLO lo que se va a commitear —no el
// disco entero— así que es rápido y no molesta.
//
// La regla de fondo: en el repo van REFERENCIAS, nunca VALORES.
//
//     bien   "N8N_API_KEY": "${N8N_API_KEY}"
//     mal    "N8N_API_KEY": "eyJhbGciOiJIUzI1NiIs..."
//
// Y el valor vive en un archivo ignorado: `.claude/settings.local.json` para lo
// de las herramientas, `credentials.env` para lo de la plataforma.
//
// Por qué importa más aquí que en otros repos: este es PÚBLICO. Un secreto que
// entra una vez queda en el historial para siempre.
// ============================================================================
const { execSync } = require("child_process");

// ── Qué se considera un secreto ─────────────────────────────────────────────
// Cada patrón lleva su nombre para que el mensaje diga qué encontró y no solo
// «algo sospechoso», que no ayuda a nadie a las once de la noche.
const PATRONES = [
  { que: "un JWT (llave de Supabase, de n8n o similar)",
    re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { que: "una llave de Anthropic",
    re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { que: "una llave de OpenAI",
    re: /\bsk-[A-Za-z0-9]{32,}\b/ },
  { que: "una cadena de conexión de Postgres con contraseña",
    re: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]{6,}@/ },
  { que: "un token de Hostinger",
    re: /\bhpat_[A-Za-z0-9]{20,}/ },
  { que: "una llave de Google",
    re: /\bAIza[A-Za-z0-9_-]{30,}/ },
  { que: "un token de GitHub",
    re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  // Lo genérico va al final: un campo que se llama KEY/TOKEN/SECRET y trae un
  // valor largo en vez de una referencia `${VARIABLE}`.
  { que: "un campo de llave con un valor literal en vez de una variable",
    re: /"[A-Z_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*"\s*:\s*"(?!\$\{)[^"\s]{20,}"/ },
];

// ── Lo que no se revisa, y por qué ──────────────────────────────────────────
// Este mismo archivo y la auditoría de secretos hablan DE secretos: llevan los
// patrones escritos y se marcarían solos.
const NO_REVISAR = [
  ".githooks/buscar-secretos.cjs",
  "pruebas/auditoria-secretos.cjs",
  "pruebas/seguridad/auditoria-secretos.cjs",
  "package-lock.json",
];

const salida = (s) => process.stdout.write(s + "\n");

let archivos;
try {
  archivos = execSync("git diff --cached --name-only --diff-filter=ACM", { encoding: "utf8" })
    .split("\n").map((x) => x.trim()).filter(Boolean);
} catch (e) {
  salida("No pude leer lo que hay en el commit: " + e.message);
  process.exit(0); // ante la duda no se bloquea: romper los commits es peor
}

const hallazgos = [];

for (const f of archivos) {
  if (NO_REVISAR.some((x) => f.endsWith(x))) continue;
  if (/\.(png|jpe?g|gif|webp|mp4|mov|pdf|zip|woff2?|ico)$/i.test(f)) continue;

  let contenido;
  try {
    // Se lee del ÍNDICE, no del disco: es lo que de verdad va a quedar
    // commiteado, que puede no ser lo mismo que el archivo actual.
    contenido = execSync('git show ":' + f + '"', { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch (e) { continue; }

  const lineas = contenido.split("\n");
  for (let i = 0; i < lineas.length; i++) {
    for (const { que, re } of PATRONES) {
      const m = lineas[i].match(re);
      if (!m) continue;
      hallazgos.push({
        archivo: f,
        linea: i + 1,
        que,
        // Se muestra el principio y el final, nunca el valor entero: el
        // mensaje de un hook acaba en logs y en capturas de pantalla.
        pista: m[0].length > 16 ? m[0].slice(0, 8) + "…" + m[0].slice(-4) : m[0],
      });
    }
  }
}

if (!hallazgos.length) process.exit(0);

salida("");
salida("  ══════════════════════════════════════════════════════════════════");
salida("   COMMIT DETENIDO — esto parece un secreto");
salida("  ══════════════════════════════════════════════════════════════════");
salida("");
for (const h of hallazgos) {
  salida("   " + h.archivo + ":" + h.linea);
  salida("     " + h.que);
  salida("     encontrado: " + h.pista);
  salida("");
}
salida("  Este repositorio es PÚBLICO. Lo que entra al historial se queda ahí:");
salida("  borrarlo en el siguiente commit no lo quita, y la llave sigue viva.");
salida("");
salida("  En el repo van REFERENCIAS, nunca valores:");
salida('     bien   "N8N_API_KEY": "${N8N_API_KEY}"');
salida('     mal    "N8N_API_KEY": "eyJhbGciOi..."');
salida("");
salida("  El valor va en un archivo ignorado:");
salida("     .claude/settings.local.json          las llaves de las herramientas");
salida("     ToqueFlow/plataforma/credentials.env  las de la plataforma");
salida("");
salida("  Si de verdad no es un secreto:  git commit --no-verify");
salida("");

process.exit(1);
