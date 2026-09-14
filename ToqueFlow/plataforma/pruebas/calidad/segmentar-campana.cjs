// ============================================================================
// ¿A quién le llega una campaña?
// ----------------------------------------------------------------------------
// La regla vivía en dos sitios —un nodo de n8n y la pantalla— y dos
// implementaciones de lo mismo se separan solas. Cuando se separan, el negocio
// ve «40 destinatarios» en la vista previa y salen 35, y nadie sabe por qué.
//
// Ahora hay una sola, en la base, y esto la prueba con el caso que pidió el
// lead de clínicas: **presupuestos enviados hace más de una semana sin
// respuesta**. Con lo que había —estado, temperatura y qué compró— eso no se
// podía armar.
//
// Y lo que no se negocia: sin filtros no entra nadie, y las bajas se excluyen
// siempre.
//
//   node pruebas/calidad/segmentar-campana.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const sello = Date.now().toString(36);

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Clínica segmentar", "zz-seg-" + sello])).rows[0].id;

  // Se piden los nombres, no los ids: un fallo que dice «salió Ana y no debía»
  // se entiende; uno que dice «salió 8f3c-…» hay que ir a buscarlo.
  const quienes = async (filtros, cantidad) =>
    (await c.query("select full_name from tf_campana_destinatarios($1,$2::jsonb,$3) order by full_name",
      [emp, JSON.stringify(filtros), cantidad || null])).rows.map((x) => x.full_name);

  const hace = (dias) => new Date(Date.now() - dias * 86400000).toISOString();

  try {
    const alta = async (nombre, tel, extra) => {
      const { status, lead_stage, metadata, last_contact_at, created_at } = extra || {};
      return (await c.query(
        `insert into contacts (company_id, phone, full_name, status, lead_stage, metadata, last_contact_at, created_at)
         values ($1,$2,$3,coalesce($4,'prospecto'),$5,coalesce($6,'{}'::jsonb),$7,coalesce($8, now())) returning id`,
        [emp, tel, nombre, status, lead_stage, metadata ? JSON.stringify(metadata) : null,
         last_contact_at || null, created_at || null])).rows[0].id;
    };

    console.log("Una clínica con cuatro pacientes y presupuestos en distintos estados.\n");

    // El caso del lead: presupuesto enviado hace 10 días, sin respuesta.
    await alta("Ana Frío", "573001110001", {
      metadata: { presupuesto_estado: "enviado", presupuesto_fecha: hace(10), tratamiento: "Ortodoncia" } });
    // Enviado ayer: todavía no toca insistirle.
    await alta("Beto Reciente", "573001110002", {
      metadata: { presupuesto_estado: "enviado", presupuesto_fecha: hace(1), tratamiento: "Ortodoncia" } });
    // Ya lo aceptó: insistirle sería una molestia.
    await alta("Carla Aceptó", "573001110003", {
      metadata: { presupuesto_estado: "aceptado", presupuesto_fecha: hace(20), tratamiento: "Blanqueamiento" } });
    // Nunca recibió presupuesto.
    await alta("Dani Sin Nada", "573001110004", {});

    // ── Lo que NO se negocia ───────────────────────────────────────────────
    console.log("Lo que no se negocia:");
    check((await quienes({})).length === 0,
      "con el filtro vacío no entra NADIE", "le escribió a alguien");
    check((await quienes({ status: [] })).length === 0,
      "ni con filtros presentes pero vacíos", "le escribió a alguien");

    const sinTel = await alta("Sin teléfono", "", { status: "activo" });
    await c.query("update contacts set phone = null where id = $1", [sinTel]);
    check(!(await quienes({ status: ["prospecto", "activo"] })).includes("Sin teléfono"),
      "quien no tiene teléfono no cuenta como destinatario", "lo incluyó");

    // ── El caso del cliente ────────────────────────────────────────────────
    console.log("\nPresupuestos que llevan más de una semana sin respuesta:");
    const rescatar = {
      campos: { presupuesto_estado: ["enviado"] },
      campo_fecha: { clave: "presupuesto_fecha", hace_mas_de_dias: 7 },
    };
    const r = await quienes(rescatar);
    check(r.length === 1 && r[0] === "Ana Frío",
      "sale Ana, la del presupuesto de hace 10 días", JSON.stringify(r));
    check(!r.includes("Beto Reciente"), "y NO Beto, que lo recibió ayer", JSON.stringify(r));
    check(!r.includes("Carla Aceptó"), "ni Carla, que ya lo aceptó", JSON.stringify(r));
    check(!r.includes("Dani Sin Nada"), "ni Dani, que nunca recibió uno", JSON.stringify(r));

    // ── Los que nunca dijeron algo ─────────────────────────────────────────
    const nunca = await quienes({ sin_campo: ["presupuesto_estado"] });
    check(nunca.includes("Dani Sin Nada") && !nunca.includes("Ana Frío"),
      "se puede segmentar a los que NO tienen ese dato", JSON.stringify(nunca));

    // ── Por cuánto llevan sin hablar ───────────────────────────────────────
    console.log("\nPor cuánto llevan sin hablar con el negocio:");
    await c.query("update contacts set last_contact_at = $2 where company_id=$1 and full_name='Ana Frío'", [emp, hace(60)]);
    await c.query("update contacts set last_contact_at = now() where company_id=$1 and full_name='Beto Reciente'", [emp]);
    const dormidos = await quienes({ ultimo_contacto: { hace_mas_de_dias: 30 } });
    check(dormidos.includes("Ana Frío") && !dormidos.includes("Beto Reciente"),
      "salen los de hace más de 30 días y no los de ayer", JSON.stringify(dormidos));
    check(dormidos.includes("Dani Sin Nada"),
      "y el que nunca habló cuenta como «hace mucho», que es a quien se quiere reactivar",
      JSON.stringify(dormidos));

    // ── Los que no tienen cita: la mitad de «llenar los huecos» ─────────────
    console.log("\nLos que no tienen cita agendada:");
    const idAna = (await c.query("select id from contacts where company_id=$1 and full_name='Ana Frío'", [emp])).rows[0].id;
    const manana = new Date(Date.now() + 86400000);
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'Valoración',$3,$4,'confirmada')`,
      [emp, idAna, manana.toISOString(), new Date(manana.getTime() + 3600000).toISOString()]);

    const sinCita = await quienes({ status: ["prospecto"], sin_cita_futura: true });
    check(!sinCita.includes("Ana Frío"), "Ana queda fuera: ya tiene cita", JSON.stringify(sinCita));
    check(sinCita.includes("Dani Sin Nada"), "y Dani entra: no tiene", JSON.stringify(sinCita));

    // ── Las bajas ──────────────────────────────────────────────────────────
    console.log("\nLas bajas:");
    await c.query("insert into outreach_optouts (company_id, phone, reason, source) values ($1,$2,'pidió no recibir','prueba')",
      [emp, "573001110004"]);
    const trasBaja = await quienes({ status: ["prospecto"] });
    check(!trasBaja.includes("Dani Sin Nada"),
      "quien pidió no recibir queda fuera aunque el filtro lo incluya", JSON.stringify(trasBaja));

    // Y no se puede desactivar: no es una opción del filtro.
    const forzando = await quienes({ status: ["prospecto"], incluir_bajas: true });
    check(!forzando.includes("Dani Sin Nada"),
      "y no hay forma de meterlo desde el filtro", JSON.stringify(forzando));

    // ── El tope ────────────────────────────────────────────────────────────
    const dos = await quienes({ status: ["prospecto", "activo"] }, 2);
    check(dos.length <= 2, "respeta la cantidad máxima pedida", dos.length + " destinatarios");

    // ── Y de otra empresa, nadie ───────────────────────────────────────────
    const otra = (await c.query(
      "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
      ["ZZ Vecina", "zz-seg-v-" + sello])).rows[0].id;
    await c.query("insert into contacts (company_id, phone, full_name, status) values ($1,'573009990000','Del vecino','prospecto')", [otra]);
    const mios = await quienes({ status: ["prospecto"] });
    check(!mios.includes("Del vecino"), "nunca entra un contacto de otra empresa", JSON.stringify(mios));
    await c.query("delete from companies where id = $1", [otra]);

  } finally {
    await c.query("delete from outreach_optouts where company_id = $1", [emp]);
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Una sola definición de a quién le llega, y las bajas siempre fuera.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
