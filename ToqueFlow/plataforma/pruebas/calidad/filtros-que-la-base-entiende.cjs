// ============================================================================
// Los filtros que la pantalla arma, ¿los entiende la base?
// ----------------------------------------------------------------------------
// La pantalla de campañas arma un objeto de filtros y se lo manda a
// `tf_campana_destinatarios`. Si la pantalla manda una clave que la función no
// lee, no falla nada: la función la IGNORA y le escribe a más gente de la que
// el negocio creía haber elegido.
//
// Ese es el peor final posible para un filtro — no un error, sino una campaña
// más grande de lo pedido, que es justo como se gana un baneo de WhatsApp.
//
// Esta prueba compara las dos listas y además arma de verdad cada filtro contra
// la base, porque «la clave aparece en el archivo» no dice que haga algo.
//
//   node pruebas/calidad/filtros-que-la-base-entiende.cjs
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

// ── Lo que la pantalla puede mandar ─────────────────────────────────────────
const HTML = fs.readFileSync(path.join(PLAT, "site", "campanas.html"), "utf8");
const cuerpo = HTML.slice(HTML.indexOf("function buildFilters()"));
const fin = cuerpo.indexOf("\n  }");
const build = cuerpo.slice(0, fin);

// `f.algo = ...` y `f.status = ...`
const mandaLaPantalla = Array.from(new Set(
  Array.from(build.matchAll(/\bf\.([a-z_]+)\s*=/g)).map((m) => m[1])
)).sort();

// ── Lo que la base lee ──────────────────────────────────────────────────────
const SQL = fs.readFileSync(path.join(PLAT, "site", "supabase", "schema-segmentar.sql"), "utf8");
const fn = SQL.slice(SQL.indexOf("create or replace function public.tf_campana_destinatarios("));

const leeLaBase = (clave) =>
  new RegExp("v_f\\s*(\\?|->|->>)\\s*'" + clave + "'").test(fn) ||
  new RegExp("v_f->'" + clave + "'").test(fn) ||
  (clave === "campos" && /v_campos/.test(fn));

(async () => {
  console.log("La pantalla puede mandar: " + mandaLaPantalla.join(", ") + "\n");

  const sinLeer = mandaLaPantalla.filter((k) => !leeLaBase(k));
  check(sinLeer.length === 0,
    "cada filtro que la pantalla arma, la base lo lee",
    "la base IGNORA " + sinLeer.join(", ") + " — la campaña saldría más grande de lo pedido");

  // ── Y que además haga algo ────────────────────────────────────────────────
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Filtros", "zz-flt-" + sello])).rows[0].id;

  try {
    const hace = (d) => new Date(Date.now() - d * 86400000).toISOString();
    const alta = async (n, tel, extra) => (await c.query(
      `insert into contacts (company_id, phone, full_name, status, lead_stage, service_type, metadata, last_contact_at)
       values ($1,$2,$3,coalesce($4,'prospecto'),$5,$6,coalesce($7,'{}'::jsonb),$8) returning id`,
      [emp, tel, n, (extra || {}).status, (extra || {}).lead_stage, (extra || {}).service_type,
       (extra || {}).metadata ? JSON.stringify(extra.metadata) : null,
       (extra || {}).last_contact_at || null])).rows[0].id;

    // Dos personas que se diferencian en TODO lo que los filtros miran. Así
    // cada filtro tiene que dejar fuera exactamente a una.
    const elegido = await alta("Sí Elegido", "573001110001", {
      status: "activo", lead_stage: "caliente", service_type: "mensual",
      metadata: { presupuesto_estado: "enviado", presupuesto_fecha: hace(30) },
      last_contact_at: hace(200),
    });
    const otro = await alta("No Elegido", "573001110002", {
      status: "prospecto", lead_stage: "frio", service_type: "suelta",
      metadata: { presupuesto_estado: "aceptado", presupuesto_fecha: hace(1) },
      last_contact_at: new Date().toISOString(),
    });
    // El elegido faltó a una cita; el otro tiene una cita futura.
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'X', now() - interval '10 days', now() - interval '10 days' + interval '1 hour','no_asistio')`,
      [emp, elegido]);
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'X', now() + interval '3 days', now() + interval '3 days' + interval '1 hour','confirmada')`,
      [emp, otro]);

    const quienes = async (f) => (await c.query(
      "select full_name from tf_campana_destinatarios($1,$2::jsonb,null)",
      [emp, JSON.stringify(f)])).rows.map((x) => x.full_name);

    // Exactamente las formas que arma la pantalla, leídas de buildFilters.
    const COMO_LAS_ARMA = {
      status:          { status: ["activo"] },
      lead_stage:      { lead_stage: ["caliente"] },
      service_type:    { service_type: ["mensual"] },
      sin_cita_futura: { status: ["activo", "prospecto"], sin_cita_futura: true },
      no_asistio:      { no_asistio: { hace_menos_de_dias: 60 } },
      ultimo_contacto: { ultimo_contacto: { hace_mas_de_dias: 90 } },
      campos:          { campos: { presupuesto_estado: ["enviado"] } },
      campo_fecha:     { campo_fecha: { clave: "presupuesto_fecha", hace_mas_de_dias: 7 } },
    };

    console.log("\nCada filtro, armado como lo arma la pantalla:");
    for (const clave of mandaLaPantalla) {
      const forma = COMO_LAS_ARMA[clave];
      if (!forma) {
        check(false, "«" + clave + "» está probado",
          "la pantalla lo manda y esta prueba no sabe qué forma tiene — agrégalo a COMO_LAS_ARMA");
        continue;
      }
      const r = await quienes(forma);
      check(r.length === 1 && r[0] === "Sí Elegido",
        "«" + clave + "» filtra de verdad", "devolvió " + JSON.stringify(r));
    }

    // Y el que no está en la lista de la pantalla pero sí en la base, para que
    // se note si alguien lo quita de la función sin querer.
    check(leeLaBase("sin_campo"), "«sin_campo» sigue existiendo en la base aunque la pantalla aún no lo ofrezca", "");

  } finally {
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  // ── Y que la lista de «ver a quiénes» no consulte por su cuenta ───────────
  const verAQuienes = HTML.slice(HTML.indexOf("async function recipientsQuery()"));
  check(/tf_campana_destinatarios/.test(verAQuienes.slice(0, 600)),
    "«ver a quiénes» usa la misma definición que el envío",
    "consulta contacts por su cuenta y no descuenta las bajas");

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Todo lo que la pantalla arma, la base lo lee y lo aplica.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
