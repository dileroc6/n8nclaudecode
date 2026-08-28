// ============================================================================
// Migra la base de conocimiento de Bejauha del Postgres viejo a la plataforma.
// ----------------------------------------------------------------------------
// El contenido es real y curado —levantamiento de mayo 2026— y vive hoy en
// `bejauha.knowledge_base`, en el sistema viejo. No se transcribe a mano: se
// ejecutan los tres SQL (002 → 009 → 010) en orden contra un esquema temporal,
// se lee el resultado y el esquema se descarta. Así el resultado es exactamente
// lo que el sistema viejo tiene, sin margen para un dedazo.
//
//   node migrar-kb-bejauha.cjs           ← muestra qué haría, sin escribir
//   node migrar-kb-bejauha.cjs --aplicar ← escribe en agent_knowledge
// ============================================================================
const fs = require("fs");
const path = require("path");
const BASE = __dirname;
const SQL_VIEJO = path.join(BASE, "..", "..", "Bejauha", "database");

fs.readFileSync(path.join(BASE, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const BEJAUHA = "3034fa2d-c918-41bb-9eae-84f2e7913db8";
const APLICAR = process.argv.includes("--aplicar");

// Los archivos traen meta-comandos de psql y toques a tablas que aquí no
// existen. Se quedan solo con lo que construye la KB.
function limpiar(sql) {
  return sql
    .split("\n")
    .filter(l => !l.trim().startsWith("\\echo"))
    .join("\n")
    // OJO: reemplazar "bejauha." a secas destroza las URLs del contenido.
    // https://bejauha.com/planes se volvía https://kb_import.com/planes, y el
    // agente salía mandando a los clientes a un sitio que no existe. Solo se
    // renombra la tabla, por su nombre completo.
    .split("bejauha.knowledge_base").join("kb_import.knowledge_base")
    // Los UPDATE a plantillas_seguimiento y los SELECT de verificación sobran.
    .split(/;\s*\n/)
    .filter(s => !/plantillas_seguimiento/.test(s))
    .filter(s => !/^\s*SELECT/i.test(s.trim()))
    .filter(s => !/^\s*SET search_path/i.test(s.trim()))
    .join(";\n");
}

// Cómo se agrupan las categorías del sistema viejo en documentos de la
// plataforma. Un documento por tema y no uno por fila: el agente lee mejor
// tres bloques con título que veinte fragmentos sueltos.
const GRUPOS = [
  { titulo: "Qué es Bejauha y qué ofrece", cats: ["general", "servicio"], orden: 1 },
  { titulo: "Horarios",                    cats: ["horario"],             orden: 2 },
  { titulo: "Precios y cómo se paga",      cats: ["precio", "pago"],      orden: 3 },
  { titulo: "Preguntas frecuentes",        cats: ["faq"],                 orden: 4 },
  { titulo: "Contacto",                    cats: ["contacto"],            orden: 5 }
];

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // ── Reconstruir la KB vieja en un esquema desechable ──────────────────────
  await c.query("begin");
  await c.query("drop schema if exists kb_import cascade; create schema kb_import;");
  for (const f of ["002_kb.sql", "009_kb_update.sql", "010_kb_paquetes_legacy.sql"]) {
    await c.query(limpiar(fs.readFileSync(path.join(SQL_VIEJO, f), "utf8")));
    console.log("aplicado: " + f);
  }
  const kb = (await c.query(
    "select clave, categoria, titulo, contenido from kb_import.knowledge_base where activo order by categoria, clave"
  )).rows;
  await c.query("rollback");
  console.log("\n" + kb.length + " entradas reconstruidas del sistema viejo\n");

  // ── Agrupar en documentos ─────────────────────────────────────────────────
  const docs = [];
  for (const g of GRUPOS) {
    const filas = kb.filter(r => g.cats.includes(r.categoria));
    if (!filas.length) continue;
    const cuerpo = filas.map(r => "### " + r.titulo + "\n" + r.contenido.trim()).join("\n\n");
    docs.push({ titulo: g.titulo, contenido: cuerpo, orden: g.orden, entradas: filas.length });
  }

  let total = 0;
  for (const d of docs) {
    console.log("  " + String(d.contenido.length).padStart(5) + " B  " +
                d.titulo.padEnd(32) + "(" + d.entradas + " entradas)");
    total += d.contenido.length;
  }
  const limite = (await c.query("select public.tf_limite_conocimiento_bytes() l")).rows[0].l;
  console.log("  " + String(total).padStart(5) + " B  TOTAL — " +
              Math.round(total * 100 / limite) + "% del límite de " + limite + " B");

  const sinUbicar = kb.filter(r => !GRUPOS.some(g => g.cats.includes(r.categoria)));
  if (sinUbicar.length) console.log("\n⚠ categorías sin grupo: " + sinUbicar.map(r => r.categoria).join(", "));

  if (!APLICAR) {
    console.log("\n(simulación — nada se escribió. Correr con --aplicar para migrar)");
    await c.end();
    return;
  }

  await c.query("begin");
  // Se borra lo anterior de esta empresa: la migración es idempotente y no debe
  // dejar dos versiones del mismo documento conviviendo.
  await c.query("delete from public.agent_knowledge where company_id=$1 and tipo='manual'", [BEJAUHA]);
  for (const d of docs) {
    await c.query(
      `insert into public.agent_knowledge (company_id, tipo, titulo, contenido, activo, orden, hash_origen)
       values ($1, 'manual', $2, $3, true, $4, $5)`,
      [BEJAUHA, d.titulo, d.contenido, d.orden, "migracion-kb-vieja-002-009-010"]);
  }
  await c.query("commit");

  const v = (await c.query(
    "select fuentes, bytes_total, bytes_limite, pct_usado, estado from public.agent_knowledge_prompt where company_id=$1",
    [BEJAUHA])).rows[0];
  console.log("\nmigrado. La vista que lee el agente reporta:");
  console.log("  " + v.fuentes + " fuentes · " + v.bytes_total + " de " + v.bytes_limite +
              " bytes · " + v.pct_usado + "% · estado: " + v.estado);
  await c.end();
})().catch(e => { console.error("ERROR " + e.message); process.exit(1); });
