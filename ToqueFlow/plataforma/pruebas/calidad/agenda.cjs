// ============================================================================
// La agenda: ¿ofrece horas que de verdad están libres?
// ----------------------------------------------------------------------------
// Es la pieza sobre la que se van a montar `ver-disponibilidad` y
// `agendar-cita`, y el error que más caro sale es ofrecer una hora que ya
// estaba tomada: el cliente llega y no lo pueden atender. Por eso se comprueba
// con un caso pequeño que se puede verificar contando con los dedos, no con
// datos reales donde nadie sabe cuál era la respuesta correcta.
//
// El caso: una peluquería que atiende los miércoles de 9 a 12, con 2 sillas,
// y corta el pelo en 60 minutos. Eso son 3 horas × 2 sillas = 6 cupos.
//
//   node pruebas/calidad/agenda.cjs
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

const hhmm = (v) => new Date(v).toLocaleTimeString("es-CO", {
  timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false,
});

// El próximo miércoles, a las 00:00 en hora de Bogotá. Se ancla a un día
// concreto para que la prueba dé lo mismo hoy que dentro de un mes.
function proximoMiercoles() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 3);
  return d;
}

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const slug = "zz-agenda-" + sello;
  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Peluquería de prueba", slug])).rows[0].id;

  try {
    console.log("Una peluquería: miércoles de 9 a 12, 2 sillas, corte de 60 minutos.\n");

    // Miércoles = 3. De 9 a 12, dos sillas.
    await c.query("insert into agenda_franjas (company_id, dia, desde, hasta, cupos) values ($1, 3, '09:00', '12:00', 2)", [emp]);
    await c.query("insert into agenda_servicios (company_id, nombre, minutos) values ($1, 'Corte', 60)", [emp]);

    const mie = proximoMiercoles();
    const desde = new Date(mie); // desde las 00:00 de ese miércoles
    const libre = async (servicio, dias) =>
      (await c.query("select public.tf_agenda_libre($1,$2,$3,$4) as r", [emp, servicio || null, dias || 2, desde])).rows[0].r;

    // ── Lo básico: 3 horas × 2 sillas ──────────────────────────────────────
    let r = await libre("Corte", 1);
    check(r.ok, "responde", JSON.stringify(r).slice(0, 120));
    check(r.huecos.length === 3, "ofrece 3 horas (9, 10 y 11)", r.huecos.length + " horas: " +
      r.huecos.map((h) => hhmm(h.inicio)).join(", "));
    check(r.huecos.every((h) => h.libres === 2), "cada hora con las 2 sillas libres",
      JSON.stringify(r.huecos.map((h) => h.libres)));

    // No ofrece las 12: la cita terminaría a la 1 y cierran a las 12.
    const horas = r.huecos.map((h) => hhmm(h.inicio));
    check(!horas.includes("12:00"), "NO ofrece las 12:00 — la cita se saldría del horario", horas.join(", "));

    // ── Una cita ocupa una silla, no la hora entera ────────────────────────
    const nueve = new Date(mie); nueve.setHours(9, 0, 0, 0);
    const diez = new Date(mie); diez.setHours(10, 0, 0, 0);
    await c.query("insert into appointments (company_id, servicio, inicio, fin, estado) values ($1,'Corte',$2,$3,'confirmada')",
      [emp, nueve.toISOString(), diez.toISOString()]);

    r = await libre("Corte", 1);
    const alas9 = r.huecos.find((h) => hhmm(h.inicio) === "09:00");
    check(alas9 && alas9.libres === 1, "con una cita a las 9, queda 1 silla — no desaparece la hora",
      JSON.stringify(alas9));

    // ── Dos citas la llenan ────────────────────────────────────────────────
    await c.query("insert into appointments (company_id, servicio, inicio, fin, estado) values ($1,'Corte',$2,$3,'confirmada')",
      [emp, nueve.toISOString(), diez.toISOString()]);
    r = await libre("Corte", 1);
    check(!r.huecos.some((h) => hhmm(h.inicio) === "09:00"),
      "con las 2 sillas ocupadas, las 9 ya no se ofrecen",
      r.huecos.map((h) => hhmm(h.inicio)).join(", "));

    // ── Una cancelada no ocupa ─────────────────────────────────────────────
    // UNA sola, no las dos. El `where inicio = ...` cancelaba las dos citas de
    // las 9 y entonces la prueba medía otra cosa.
    await c.query(
      "update appointments set estado='cancelada' where id = (select id from appointments where company_id=$1 and inicio=$2 and estado<>'cancelada' limit 1)",
      [emp, nueve.toISOString()]);
    r = await libre("Corte", 1);
    const de9 = r.huecos.find((h) => hhmm(h.inicio) === "09:00");
    check(de9 && de9.libres === 1, "al cancelar una, la silla vuelve a estar libre", JSON.stringify(de9));

    // ── Un bloqueo tapa la mañana ──────────────────────────────────────────
    const once = new Date(mie); once.setHours(11, 0, 0, 0);
    const doce = new Date(mie); doce.setHours(12, 0, 0, 0);
    await c.query("insert into agenda_bloqueos (company_id, desde, hasta, motivo) values ($1,$2,$3,'reunión')",
      [emp, once.toISOString(), doce.toISOString()]);
    r = await libre("Corte", 1);
    check(!r.huecos.some((h) => hhmm(h.inicio) === "11:00"),
      "un bloqueo quita esa hora aunque sea horario de atención",
      r.huecos.map((h) => hhmm(h.inicio)).join(", "));

    // ── Un servicio que no existe ──────────────────────────────────────────
    const noHay = await libre("Masaje tailandés", 1);
    check(noHay.ok === false, "un servicio que no ofrece devuelve que no, no una lista vacía",
      JSON.stringify(noHay).slice(0, 120));
    check(Array.isArray(noHay.servicios) && noHay.servicios.includes("Corte"),
      "y dice cuáles SÍ ofrece, para que el agente pueda repreguntar",
      JSON.stringify(noHay.servicios));

    // ── Un jueves no hay nada ──────────────────────────────────────────────
    const jue = new Date(mie); jue.setDate(jue.getDate() + 1);
    const soloJueves = (await c.query("select public.tf_agenda_libre($1,'Corte',1,$2) as r", [emp, jue.toISOString()])).rows[0].r;
    check(soloJueves.huecos.length === 0, "el jueves no ofrece nada: solo atiende miércoles",
      soloJueves.huecos.length + " huecos");

  } finally {
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length ? "❌ " + fallos.length + " fallo(s)" : "✅ La agenda solo ofrece horas que de verdad están libres.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
