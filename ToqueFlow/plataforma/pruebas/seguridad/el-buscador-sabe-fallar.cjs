// ============================================================================
// El buscador de secretos, ¿sabe fallar?
// ----------------------------------------------------------------------------
// El hook que revisa los commits llevaba semanas en verde mientras el secreto
// del receptor de n8n —`const SECRET='tqf-…'`— viajaba dentro de un workflow
// exportado a un repo PÚBLICO. No lo veía porque no tiene forma de llave: no
// empieza por `sk-`, ni por `eyJ`, ni por `hpat_`.
//
// Un chequeo que nunca ha marcado nada no es un chequeo probado: es un chequeo
// sin probar. Por eso esto lo prueba de las DOS formas —que cace lo malo y que
// no marque lo bueno— porque un chequeo que grita lobo se acaba ignorando, y
// entonces da igual lo bien que cace.
//
//   node pruebas/seguridad/el-buscador-sabe-fallar.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const HOOK = path.join(__dirname, "..", "..", "..", "..", ".githooks", "buscar-secretos.cjs");

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

const src = fs.readFileSync(HOOK, "utf8");
const m = src.match(/const PATRONES = \[([\s\S]*?)\n\];/);
if (!m) { console.error("No encontré la lista de patrones en el hook."); process.exit(2); }
const PATRONES = eval("[" + m[1] + "]");   // eslint-disable-line no-eval

const caza = (texto) => PATRONES.some((p) => p.re.test(texto));

// Lo que TIENE que cazar. Cada línea es algo que de verdad se escapó o que se
// escaparía igual de fácil.
// Ninguno es real. El del receptor va con la MISMA forma que tenía el de
// verdad pero con otro valor: una prueba que lleve dentro el secreto auténtico
// lo vuelve a publicar cada vez que alguien lee el repo, que es justo lo que
// esta prueba existe para evitar.
const MALO = [
  ["el secreto del receptor, con la forma que tenía", "const SECRET='tqf-ejemplo-n8n-0000-falso1'; // TODO mover a variable"],
  ["y dentro de un workflow exportado", '"jsCode": "const SECRET=\'tqf-ejemplo-n8n-0000-falso1\';\\nconst root=..."'],
  ["una llave de API a mano", 'const API_KEY = "abcdefghijklmnopqrstuvwx"'],
  ["una contraseña a mano", "password: 'SuperSecreta12345'"],
  ["un JWT", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.abcdefghijklmnop"],
  ["una llave de Anthropic", "sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
  ["una URL de Postgres con contraseña", "postgresql://postgres:LaClaveDeVerdad@db.supabase.co:5432/postgres"],
  ["un token de Hostinger", "hpat_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
];

// Lo que NO puede marcar. Son las formas CORRECTAS de escribir lo mismo: si
// las marcara, la gente aprendería a saltarse el hook con --no-verify, y
// entonces ya no protege de nada.
const BUENO = [
  ["leído de una variable de entorno", "const SECRET = process.env.TOQUE_EVENTS_SECRET;"],
  ["una referencia sin resolver", "const SECRET='${TOQUE_EVENTS_SECRET}';"],
  ["un .mcp.json bien escrito", '"N8N_API_KEY": "${N8N_API_KEY}"'],
  ["la forma de n8n", "const secret = $env.TOQUE_EVENTS_SECRET;"],
  ["hablar del tema", "// el secreto va en una variable de entorno, nunca aquí"],
  ["un ejemplo recortado", "token: '…'"],
  ["un marcador de plantilla", "password: '<tu contraseña>'"],
];

console.log("Lo que TIENE que cazar:");
for (const [que, texto] of MALO) check(caza(texto), que, "pasó sin marcar");

console.log("\nLo que NO puede marcar:");
for (const [que, texto] of BUENO) check(!caza(texto), que, "lo marcó, y es correcto");

// Y que el hook siga instalado. Un hook perfecto que nadie corre es un hook
// que no existe.
console.log("\nY que esté puesto:");
const { execSync } = require("child_process");
let ruta = "";
try { ruta = execSync("git config core.hooksPath", { encoding: "utf8" }).trim(); } catch (e) { ruta = ""; }
check(ruta === ".githooks", "git corre los hooks de .githooks",
  ruta ? "apunta a «" + ruta + "»" : "no hay core.hooksPath: el hook no se ejecuta");

console.log("\n" + "═".repeat(70));
console.log(fallos.length
  ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
  : "✅ Caza lo malo, deja pasar lo bueno, y está puesto.");
process.exitCode = fallos.length ? 1 : 0;
