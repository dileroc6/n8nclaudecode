// ============================================================================
// Quién no vino, y qué horas van a quedar vacías
// ----------------------------------------------------------------------------
// Dos cosas que la plataforma tenía a medias:
//
//   · `appointments` acepta 'asistio' y 'no_asistio' desde que existe y NADIE
//     los ponía nunca. Sin eso no hay forma de saber quién dejó plantado al
//     negocio, y por tanto no hay a quién escribirle.
//   · una hora libre en la agenda no se vende dos veces. Si mañana a las 4 no
//     entra nadie, esa hora no se recupera — y no aparece en ningún informe,
//     porque nadie factura un hueco.
//
// Se monta una CLÍNICA EN MADRID a propósito: hasta hoy la zona horaria estaba
// escrita a mano como 'America/Bogota' en nueve sitios, y toda la agenda se
// calcula en la hora de pared del negocio. Un cliente fuera de Colombia es el
// caso que lo rompía.
//
//   node pruebas/calidad/asistencia-y-huecos.cjs
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
    ["ZZ Clínica Madrid", "zz-ah-" + sello])).rows[0].id;

  try {
    // ── La clínica está en España ──────────────────────────────────────────
    console.log("Una clínica en Madrid, no en Bogotá:\n");
    await c.query("select tf_zona_guardar($1, 'Europe/Madrid')", [emp]);
    const z = (await c.query("select tf_zona($1) z", [emp])).rows[0].z;
    check(z === "Europe/Madrid", "la agenda se calcula en su hora, no en la de Colombia", z);

    // Atiende todos los días de 9 a 17, una silla.
    for (let d = 0; d < 7; d++) {
      await c.query(`insert into agenda_franjas (company_id, dia, desde, hasta, cupos)
                     values ($1,$2,'09:00','17:00',1) on conflict do nothing`, [emp, d]);
    }
    await c.query(`insert into agenda_servicios (company_id, nombre, minutos)
                   values ($1,'Valoración',60) on conflict do nothing`, [emp]);

    const alta = async (nombre, tel) => (await c.query(
      `insert into contacts (company_id, phone, full_name, status)
       values ($1,$2,$3,'prospecto') returning id`, [emp, tel, nombre])).rows[0].id;

    const cita = async (contacto, haceDias, estado) => {
      const ini = new Date(Date.now() - haceDias * 86400000);
      return (await c.query(
        `insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
         values ($1,$2,'Valoración',$3,$4,$5) returning id`,
        [emp, contacto, ini.toISOString(), new Date(ini.getTime() + 3600000).toISOString(), estado])).rows[0].id;
    };

    const ana  = await alta("Ana Plantón",  "34600110001");
    const beto = await alta("Beto Sí Vino", "34600110002");
    const cris = await alta("Cris Canceló", "34600110003");
    const dani = await alta("Dani Futuro",  "34600110004");

    const cAna  = await cita(ana,  3, "confirmada");
    const cBeto = await cita(beto, 2, "confirmada");
    const cCris = await cita(cris, 1, "cancelada");
    const cDani = await cita(dani, -5, "confirmada");   // dentro de 5 días

    // ── Lo que ya pasó y nadie ha dicho si vino ────────────────────────────
    console.log("\nLo que ya pasó y nadie ha dicho si vino:");
    const porMarcar = async () => (await c.query(
      "select id, contacto, cuando from tf_citas_por_marcar($1,$2) order by contacto", [emp, 14])).rows;

    let pm = await porMarcar();
    check(pm.length === 2 && pm.map((x) => x.contacto).join(", ") === "Ana Plantón, Beto Sí Vino",
      "pregunta por las dos que pasaron", JSON.stringify(pm.map((x) => x.contacto)));
    check(!pm.some((x) => x.contacto === "Cris Canceló"),
      "no pregunta por la cancelada: nadie faltó, se avisó", JSON.stringify(pm.map((x) => x.contacto)));
    check(!pm.some((x) => x.contacto === "Dani Futuro"),
      "ni por la que todavía no ha pasado", JSON.stringify(pm.map((x) => x.contacto)));

    // La hora que muestra tiene que ser la de Madrid, que es la única que el
    // negocio reconoce al mirar su propia agenda.
    const horaMadrid = new Date((await c.query("select inicio from appointments where id=$1", [cAna])).rows[0].inicio)
      .toLocaleTimeString("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false });
    const mostrada = pm.find((x) => x.contacto === "Ana Plantón").cuando.split(" ")[1];
    check(mostrada === horaMadrid,
      "y la muestra en hora de Madrid", "muestra " + mostrada + " y allá son las " + horaMadrid);

    // ── Marcar ─────────────────────────────────────────────────────────────
    console.log("\nMarcar:");
    const marcar = async (id, vino) => (await c.query("select tf_marcar_asistencia($1,$2) r", [id, vino])).rows[0].r;

    check((await marcar(cAna, false)).estado === "no_asistio", "se puede decir que no vino", "");
    check((await marcar(cBeto, true)).estado === "asistio", "y que sí vino", "");

    const traCancelada = await marcar(cCris, false);
    check(traCancelada.ok === false,
      "una cancelada NO se marca como plantón: mezclarlas hace que «me dejan plantado el 20%» no signifique nada",
      JSON.stringify(traCancelada));

    const traFutura = await marcar(cDani, true);
    check(traFutura.ok === false, "ni una que todavía no ha pasado: marcarla es adivinar", JSON.stringify(traFutura));

    pm = await porMarcar();
    check(pm.length === 0, "y ya no quedan pendientes de marcar", JSON.stringify(pm.map((x) => x.contacto)));

    // ── Lo que le cuesta al negocio ────────────────────────────────────────
    console.log("\nLo que le cuesta al negocio:");
    const res = (await c.query("select tf_asistencia_resumen($1,30) r", [emp])).rows[0].r;
    check(res.asistio === 1 && res.falto === 1, "cuenta uno y uno", JSON.stringify(res));
    check(res.porcentaje_planton === 50,
      "y el porcentaje sale solo de las marcadas: contar las sin marcar como asistidas mejora el número justo cuando el negocio deja de marcar",
      JSON.stringify(res));

    // ── A quién escribirle ─────────────────────────────────────────────────
    console.log("\nA quién escribirle:");
    const quienes = async (f) => (await c.query(
      "select full_name from tf_campana_destinatarios($1,$2::jsonb,null) order by full_name",
      [emp, JSON.stringify(f)])).rows.map((x) => x.full_name);

    const plantones = await quienes({ no_asistio: { hace_menos_de_dias: 30 }, sin_cita_futura: true });
    check(plantones.length === 1 && plantones[0] === "Ana Plantón",
      "sale Ana, que faltó y no ha vuelto a agendar", JSON.stringify(plantones));
    check(!plantones.includes("Beto Sí Vino"), "y no Beto, que sí vino", JSON.stringify(plantones));

    // La ventana importa: perseguir a quien faltó hace dos años es una molestia.
    await c.query("update appointments set inicio = now() - interval '400 days', fin = now() - interval '399 days' where id=$1", [cAna]);
    const recientes = await quienes({ no_asistio: { hace_menos_de_dias: 30 }, sin_cita_futura: true });
    check(recientes.length === 0,
      "y el que faltó hace más de un año ya no entra en el seguimiento", JSON.stringify(recientes));

    // ── Los huecos ─────────────────────────────────────────────────────────
    console.log("\nLas horas que van a quedar vacías:");
    const h = (await c.query("select tf_huecos_pronto($1,3,'Valoración') r", [emp])).rows[0].r;
    check(h.ok === true && h.zona === "Europe/Madrid", "los mira en la hora del negocio", JSON.stringify(h.zona));
    check(Array.isArray(h.dias) && h.dias.length > 0, "encuentra días con huecos", JSON.stringify(h.dias || []).slice(0, 200));
    check((h.dias || []).every((d) => /^(domingo|lunes|martes|miércoles|jueves|viernes|sábado)$/.test(d.dia)),
      "y dice qué día es, en español", JSON.stringify((h.dias || []).map((d) => d.dia)));
    check(h.a_quien_ofrecer >= 3,
      "y a cuánta gente se le podría ofrecer: sin ese número «tienes 6 huecos» no dice si se puede hacer algo",
      "dice " + h.a_quien_ofrecer);

    // Una hora que ya está tomada no puede aparecer como hueco: es la forma
    // más fácil de ofrecerle a alguien una hora que no existe.
    const manana = (await c.query(
      "select (timezone(tf_zona($1), now()) + interval '1 day')::date::text d", [emp])).rows[0].d;
    const antes = ((h.dias || []).find((d) => d.fecha === manana) || {}).huecos || 0;
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'Valoración', timezone(tf_zona($1), $3::timestamp), timezone(tf_zona($1), $3::timestamp) + interval '1 hour', 'confirmada')`,
      [emp, dani, manana + " 10:00:00"]);
    const h2 = (await c.query("select tf_huecos_pronto($1,3,'Valoración') r", [emp])).rows[0].r;
    const despues = ((h2.dias || []).find((d) => d.fecha === manana) || {}).huecos || 0;
    check(antes > 0 && despues === antes - 1,
      "y una hora ya tomada deja de contar como hueco",
      "antes " + antes + ", después " + despues);

  } finally {
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Se sabe quién no vino y qué horas van a quedar vacías.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
