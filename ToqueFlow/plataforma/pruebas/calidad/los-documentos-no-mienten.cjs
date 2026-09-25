// ============================================================================
// Los documentos que se leen al abrir sesión, ¿siguen siendo ciertos?
// ----------------------------------------------------------------------------
// `CLAUDE.md`, `MEMORY.md` y `TASK.md` existen para no tener que releer el repo
// entero cada vez. Eso los hace útiles y peligrosos a la vez: **un documento que
// se lee primero y miente cuesta más que no tenerlo**, porque se actúa sobre él
// sin comprobar.
//
// Y este repo ya sabe cómo se pudren: hubo filas del tablero abiertas estando
// hechas tres días, una fila referenciada que nunca se guardó, y dos filas
// describiendo la misma tarea.
//
// Esto comprueba tres cosas que se rompen solas:
//
//   1. que los archivos y comandos que mencionan existan
//   2. que `TASK.md` esté al día con el tablero — es generado, así que
//      regenerarlo tiene que dar exactamente lo mismo
//   3. que las pruebas que citan como vigilantes existan de verdad
//
//   node pruebas/calidad/los-documentos-no-mienten.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const RAIZ = path.join(__dirname, "..", "..", "..", "..");

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

const DOCS = ["CLAUDE.md", "MEMORY.md", "TASK.md"];

// ── 1. Existen ──────────────────────────────────────────────────────────────
console.log("Los tres se leen al abrir sesión:");
for (const d of DOCS) {
  check(fs.existsSync(path.join(RAIZ, d)), d + " existe", "no está en la raíz");
}
if (fallos.length) { console.log("\n❌ Falta alguno; lo demás no se puede comprobar."); process.exit(1); }

// ── 2. Lo que mencionan existe ──────────────────────────────────────────────
console.log("\nTodo lo que mencionan existe:");
const rotas = [];
for (const d of DOCS) {
  const t = fs.readFileSync(path.join(RAIZ, d), "utf8");

  // Enlaces markdown a archivos del repo (no URLs, no anclas).
  const enlaces = [...t.matchAll(/\]\(([^)#]+?)\)/g)].map((m) => m[1]);
  for (const e of enlaces) {
    if (/^https?:|^mailto:/.test(e)) continue;
    const p = path.join(RAIZ, decodeURIComponent(e));
    if (!fs.existsSync(p)) rotas.push(d + " → " + e);
  }

  // Rutas sueltas dentro de comillas invertidas que parezcan archivos del repo.
  const sueltas = [...t.matchAll(/`([A-Za-z0-9_./-]+\.(?:cjs|sql|md|ps1|jsx|html|js|json))`/g)].map((m) => m[1]);
  for (const s of sueltas) {
    if (s.includes("/")) {
      const cands = [path.join(RAIZ, s), path.join(RAIZ, "ToqueFlow", "plataforma", s)];
      if (!cands.some((c) => fs.existsSync(c))) rotas.push(d + " → " + s);
    } else {
      // Solo el nombre: basta con que exista en algún sitio del repo.
      //
      // Se mira el DISCO además de git: un archivo recién creado y todavía sin
      // commitear existe igual, y marcarlo como roto sería decirle a alguien
      // que arregle algo que acaba de escribir bien.
      const enRaiz = fs.existsSync(path.join(RAIZ, s));
      const enGit = cp.execSync('git ls-files -z -- "*' + s + '"', { cwd: RAIZ, encoding: "buffer" })
        .toString("utf8").split("\0").filter(Boolean).length > 0;
      if (!enRaiz && !enGit) rotas.push(d + " → " + s);
    }
  }
}
check(rotas.length === 0,
  "ningún archivo ni prueba que citan se ha movido o borrado",
  rotas.slice(0, 6).join(" · ") + (rotas.length > 6 ? " · y " + (rotas.length - 6) + " más" : ""));

// ── 3. TASK.md está al día ──────────────────────────────────────────────────
// Es generado. Si regenerarlo cambia algo, es que el tablero se movió y nadie
// volvió a correr el generador — y entonces la lista que se lee al abrir sesión
// está diciendo tareas que ya no son.
console.log("\nY `TASK.md` dice lo mismo que el tablero:");
const antes = fs.readFileSync(path.join(RAIZ, "TASK.md"), "utf8");
try {
  cp.execSync("node " + JSON.stringify(path.join(RAIZ, "ToqueFlow", "render-task.cjs")),
    { cwd: RAIZ, encoding: "utf8", stdio: "pipe" });
} catch (e) {
  check(false, "el generador de TASK.md corre", String(e.message).slice(0, 160));
}
const despues = fs.readFileSync(path.join(RAIZ, "TASK.md"), "utf8");

// La fecha cambia sola cada día; no cuenta como desfase.
const sinFecha = (s) => s.replace(/Al \d{4}-\d{2}-\d{2}:/, "Al <fecha>:");
check(sinFecha(antes) === sinFecha(despues),
  "está regenerado contra el tablero de hoy",
  "el tablero se movió y nadie corrió `node ToqueFlow/render-task.cjs` — " +
  "la lista que se lee al abrir sesión está desactualizada");

// ── 4. Los comandos que promete CLAUDE.md ───────────────────────────────────
console.log("\nY los comandos que promete existen:");
const claude = fs.readFileSync(path.join(RAIZ, "CLAUDE.md"), "utf8");
const PLAT = path.join(RAIZ, "ToqueFlow", "plataforma");
const comandos = [
  ["pruebas/todo.cjs", path.join(PLAT, "pruebas", "todo.cjs")],
  ["pruebas/aplicar.cjs", path.join(PLAT, "pruebas", "aplicar.cjs")],
  ["sellar-version.cjs", path.join(PLAT, "sellar-version.cjs")],
  ["deploy-safe.ps1", path.join(PLAT, "deploy-safe.ps1")],
  ["deploy-edge-fn.cjs", path.join(PLAT, "deploy-edge-fn.cjs")],
  ["render-tablero.cjs", path.join(RAIZ, "ToqueFlow", "render-tablero.cjs")],
  ["render-task.cjs", path.join(RAIZ, "ToqueFlow", "render-task.cjs")],
];
for (const [nombre, ruta] of comandos) {
  if (!claude.includes(nombre)) continue;
  check(fs.existsSync(ruta), "`" + nombre + "` existe donde dice", "no está en " + ruta);
}

console.log("\n" + "═".repeat(70));
console.log(fallos.length
  ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
  : "✅ Los tres documentos siguen siendo ciertos.");
process.exitCode = fallos.length ? 1 : 0;
