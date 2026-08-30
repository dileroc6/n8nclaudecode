// ============================================================================
// ¿El agente sabe USAR las herramientas de agenda? (hueco 108a)
// ----------------------------------------------------------------------------
// `agendar-cita.cjs` prueba que las herramientas funcionan cuando alguien las
// llama. Esta prueba es otra cosa y es la que faltaba: **que el AGENTE sepa
// cuándo llamarlas**, con qué fecha, y qué contesta cuando la hora se ocupó.
//
// Es donde falla un modelo. Una función que devuelve el JSON correcto no
// sirve de nada si el agente no la llama, o la llama con la fecha del año
// pasado, o le dice al cliente «ya quedó agendado» cuando la herramienta
// respondió que no.
//
// Corre contra el agente REAL en n8n, en modo prueba, sobre un negocio de
// mentira creado y borrado por la propia prueba — **nunca contra Bejauha**:
// meterle horarios y citas a un cliente que paga, para correr una prueba, no.
//
//   node pruebas/calidad/agente-agenda.cjs
//   node pruebas/calidad/agente-agenda.cjs --ver    ← imprime la conversación
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const VER = process.argv.includes("--ver");
const WEBHOOK = "https://n8n.srv1398596.hstgr.cloud/webhook/toque-agente";
const sello = Date.now().toString(36);
const INSTANCIA = "zz-agenda-" + sello;
const TEL = "573009" + String(Date.now()).slice(-6);

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const plano = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// El próximo miércoles, para que la conversación tenga siempre horas por
// delante y la prueba dé lo mismo hoy que en tres semanas.
function proximoMiercoles() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 3);
  return d;
}
const DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Estética de prueba", "zz-agenda-" + sello])).rows[0].id;

  try {
    // ── El negocio de mentira ──────────────────────────────────────────────
    await c.query(`insert into agent_config (company_id, nombre, activo, whatsapp_instance, identidad, herramientas)
      values ($1, 'Recepción', true, $2,
        jsonb_build_object('negocio','Estética Aurora','tono','Cercano y directo, de tú. Sin emojis.'),
        array['ver-disponibilidad','agendar-cita'])`, [emp, INSTANCIA]);

    await c.query(`insert into agent_knowledge (company_id, tipo, origen, titulo, contenido, activo, orden)
      values ($1,'manual','prueba','Qué hacemos y cuánto vale',
        'Estética Aurora. Hacemos limpieza facial ($120.000, 60 minutos) y depilación láser ($200.000, 30 minutos). Atendemos con cita previa. Estamos en la carrera 11 con 93.', true, 1)`, [emp]);

    // Miércoles de 9 a 12, dos cabinas.
    await c.query("insert into agenda_franjas (company_id, dia, desde, hasta, cupos) values ($1,3,'09:00','12:00',2)", [emp]);
    await c.query("insert into agenda_servicios (company_id, nombre, minutos) values ($1,'Limpieza facial',60)", [emp]);
    await c.query("insert into agenda_servicios (company_id, nombre, minutos) values ($1,'Depilación láser',30)", [emp]);

    const mie = proximoMiercoles();
    const cuando = DIA[mie.getDay()] + " " + mie.getDate() + " de " + MES[mie.getMonth()];

    console.log("Estética Aurora: miércoles de 9 a 12, dos cabinas.");
    console.log("Se le habla al agente REAL, en modo prueba.\n");

    // ── Hablarle ───────────────────────────────────────────────────────────
    const decir = async (texto) => {
      const antes = (await c.query(
        "select count(*)::int n from test_messages where company_id=$1", [emp])).rows[0].n;
      try {
        await fetch(WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Toque-Signature": process.env.TOQUE_AGENTE_FIRMA || "" },
          body: JSON.stringify({
            instance: INSTANCIA, test: true,
            data: {
              key: { remoteJid: TEL + "@s.whatsapp.net", fromMe: false, id: "AG" + Date.now() },
              message: { conversation: texto },
            },
          }),
        });
      } catch (e) { /* lo que importa es lo que quedó en la base */ }

      // Con herramienta de por medio son dos vueltas a Claude más una llamada
      // al webhook de la herramienta: hay que darle más margen que a una
      // respuesta normal.
      for (let i = 0; i < 20; i++) {
        await esperar(1200);
        const n = (await c.query("select count(*)::int n from test_messages where company_id=$1", [emp])).rows[0].n;
        if (n > antes) break;
      }
      const r = (await c.query(
        "select body from test_messages where company_id=$1 and author='bot' order by created_at desc limit 1", [emp])).rows[0];
      const dicho = (r && r.body) || "";
      if (VER) console.log("     tú:     " + texto + "\n     agente: " + dicho + "\n");
      return dicho;
    };

    // ── 1. Pregunta por horas ──────────────────────────────────────────────
    const r1 = await decir("hola, quiero una limpieza facial. que horas tienen el " + cuando + "?");
    check(!!r1, "contesta cuando le preguntan por horas", "no contestó nada");

    const llamo = (await c.query(
      "select count(*)::int n from ai_usage where company_id=$1", [emp])).rows[0].n;
    check(llamo > 0, "el turno consumió IA (o sea que el agente sí corrió)", llamo + " llamadas");

    // Lo que importa: que ofrezca horas que existen y no se las invente.
    // La franja es de 9 a 12 con limpiezas de 60 min → 9, 10 y 11.
    const dice = plano(r1);
    const ofrece = ["9", "10", "11"].filter((h) => new RegExp("\\b" + h + "(:00)?\\s?(a\\.?\\s?m|am|de la ma)", "i").test(dice) || dice.includes(h + ":00"));
    check(ofrece.length >= 1, "ofrece horas concretas de la franja (9, 10 u 11)", "dijo: " + r1.slice(0, 160));
    check(!/\b(1|2|3|4|5|6|7|8)\s?(p\.?\s?m|pm|de la tarde)/i.test(dice),
      "y NO ofrece horas de la tarde, que el negocio no atiende", r1.slice(0, 160));

    // ── 2. Elegir una y que quede agendada ─────────────────────────────────
    const r2 = await decir("perfecto, agendame a las 10 de la mañana. me llamo Marcela Ríos");
    const cita = (await c.query(
      `select a.inicio, a.servicio, a.estado, c.full_name
         from appointments a left join contacts c on c.id = a.contact_id
        where a.company_id=$1 order by a.created_at desc limit 1`, [emp])).rows[0];

    check(!!cita, "la cita queda REALMENTE en la base, no solo dicha en el chat", "no hay ninguna cita");
    if (cita) {
      const hora = new Date(cita.inicio).toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", hour12: false });
      check(hora === "10:00", "a la hora que pidió el cliente, no a otra", "quedó a las " + hora);
      check(/limpieza/i.test(cita.servicio || ""), "con el servicio correcto", cita.servicio);
      check(/marcela/i.test(cita.full_name || ""), "y con el nombre que dio", String(cita.full_name));
    }
    check(/10/.test(r2) && !/no pud|no fue posible|error/i.test(plano(r2)),
      "y se lo confirma al cliente", r2.slice(0, 160));

    // ── 3. La hora se llena mientras conversan ─────────────────────────────
    // Es el caso que más importa: la herramienta dice que no, y hay que ver
    // qué hace el agente con esa respuesta. Decir «listo, quedaste agendada»
    // cuando la herramienta contestó que no es el peor final posible.
    const diez = new Date(mie); diez.setHours(10, 0, 0, 0);
    await c.query(`insert into appointments (company_id, servicio, inicio, fin, estado)
      values ($1,'Limpieza facial',$2,$3,'confirmada')`,
      [emp, diez.toISOString(), new Date(diez.getTime() + 3600000).toISOString()]);

    const r3 = await decir("mi hermana también quiere, agéndala a las 10 igual. se llama Paula Ríos");
    const cuantas = (await c.query(
      "select count(*)::int n from appointments where company_id=$1 and inicio=$2 and estado<>'cancelada'",
      [emp, diez.toISOString()])).rows[0].n;

    check(cuantas === 2, "no mete una tercera cita en una hora de dos cupos", cuantas + " citas a las 10");
    const t3 = plano(r3);
    check(!/quedaste agendada|ya quedo|listo, agendad|confirmada a las 10/.test(t3),
      "y NO le dice al cliente que quedó agendada cuando no quedó", r3.slice(0, 200));
    check(/9|11|otra hora|disponible|libre|ocupad|lleno|no hay/.test(t3),
      "le ofrece otra hora o le dice que esa se llenó", r3.slice(0, 200));

    // ── 4. Un servicio que no existe ───────────────────────────────────────
    const r4 = await decir("y hacen masajes descontracturantes? me agendas uno el miércoles");
    const t4 = plano(r4);
    check(!/masaje.*(agendad|quedo|listo)/.test(t4), "no agenda un servicio que el negocio no ofrece", r4.slice(0, 200));
    check(/limpieza|depilaci|no (lo )?(ofrec|tenemos|hacemos)|no manejamos/.test(t4),
      "y dice qué SÍ ofrece en vez de solo negar", r4.slice(0, 200));

  } finally {
    // Se borra todo: la empresa arrastra agente, conocimiento, agenda, citas y
    // mensajes de prueba por las llaves foráneas.
    await c.query("delete from companies where id=$1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ") +
      "\n\n   (correr con --ver para leer la conversación entera)"
    : "✅ El agente sabe cuándo usar la agenda, y qué decir cuando no se puede.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
