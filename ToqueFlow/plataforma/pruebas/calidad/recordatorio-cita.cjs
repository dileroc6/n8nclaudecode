// ============================================================================
// El recordatorio de cita: que salga una vez, a buena hora, y no tarde
// ----------------------------------------------------------------------------
// Es el argumento de venta más fuerte de Toque Agenda —el que no llega se
// siente en la caja— pero un recordatorio mal hecho hace más daño que ninguno:
//
//   mandado dos veces   molesta, y molestar por WhatsApp es como se gana un baneo
//   mandado de noche    peor que no mandarlo
//   mandado tarde       recordar una cita que ya pasó es ridículo
//
// Los tres se prueban aquí, con relojes movidos a mano para no esperar horas.
//
//   node pruebas/calidad/recordatorio-cita.cjs
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

  const inst = "zz-recu-" + sello;
  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Recordatorios", "zz-recu-" + sello])).rows[0].id;

  const eventos = async () => (await c.query(
    "select payload from n8n_events where company_id=$1 and event='recordatorio_cita' order by created_at", [emp])).rows;

  // Una cita a N horas de ahora, siempre dentro del horario de atención del
  // negocio para que la ventana no sea lo que la frene.
  const citaEn = async (horas, tel) => {
    const ini = new Date(Date.now() + horas * 3600000);
    const ct = (await c.query(
      "insert into contacts (company_id, phone, full_name, status) values ($1,$2,$3,'activo') returning id",
      [emp, tel, "Persona " + tel.slice(-3)])).rows[0].id;
    return (await c.query(
      `insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
       values ($1,$2,'Valoración',$3,$4,'confirmada') returning id`,
      [emp, ct, ini.toISOString(), new Date(ini.getTime() + 3600000).toISOString()])).rows[0].id;
  };

  try {
    await c.query(`insert into agent_config (company_id, nombre, activo, whatsapp_instance, identidad, recordatorios)
      values ($1,'Recepción',true,$2,'{}'::jsonb, jsonb_build_object('horas_antes',24,'desde','00:00','hasta','23:59'))`, [emp, inst]);

    console.log("Un negocio que recuerda 24 horas antes.\n");

    // ── Todavía es pronto ──────────────────────────────────────────────────
    await citaEn(72, "573001110001");
    let n = (await c.query("select public.tf_run_recordatorios() as n")).rows[0].n;
    check((await eventos()).length === 0, "una cita a 3 días todavía no se recuerda", "encoló algo");

    // ── Ya toca ────────────────────────────────────────────────────────────
    const cerca = await citaEn(12, "573001110002");
    await c.query("select public.tf_run_recordatorios()");
    let ev = await eventos();
    check(ev.length === 1, "una cita a 12 horas sí se recuerda", ev.length + " eventos");
    if (ev.length) {
      const p = ev[0].payload;
      check(p.instance === inst, "el evento lleva la instancia del negocio", p.instance);
      check(/valoraci/i.test(p.servicio || ""), "y el servicio", p.servicio);
      check(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(p.cuando || ""),
        "con la fecha escrita en español", p.cuando);
      check(p.pedir_confirmacion === true, "y pidiendo confirmación por defecto", String(p.pedir_confirmacion));
    }

    // ── No se manda dos veces ──────────────────────────────────────────────
    // Es el que más importa: repetir molesta, y molestar por WhatsApp es como
    // se gana un baneo.
    await c.query("select public.tf_run_recordatorios()");
    await c.query("select public.tf_run_recordatorios()");
    check((await eventos()).length === 1, "por más veces que corra el cron, sale UNA sola vez",
      (await eventos()).length + " eventos");

    // ── Fuera del horario no sale, pero no se pierde ───────────────────────
    // Marcarlo como enviado fuera de hora seria perder el recordatorio. Se
    // deja para el siguiente ciclo dentro de la ventana.
    await c.query(`update agent_config set recordatorios = jsonb_build_object('horas_antes',24,'desde','03:00','hasta','03:01')
                   where company_id=$1`, [emp]);
    const nocturna = await citaEn(10, "573001110003");
    await c.query("select public.tf_run_recordatorios()");
    check((await eventos()).length === 1, "fuera del horario del negocio NO se manda", "salió igual");
    const marcada = (await c.query("select recordatorio_enviado_at from appointments where id=$1", [nocturna])).rows[0];
    check(marcada.recordatorio_enviado_at === null,
      "y NO se marca como enviado: se guarda para cuando abra", String(marcada.recordatorio_enviado_at));

    // Al volver la ventana, sale.
    await c.query(`update agent_config set recordatorios = jsonb_build_object('horas_antes',24,'desde','00:00','hasta','23:59')
                   where company_id=$1`, [emp]);
    await c.query("select public.tf_run_recordatorios()");
    check((await eventos()).length === 2, "y sale en cuanto vuelve el horario", (await eventos()).length + " eventos");

    // ── Una cita cancelada no se recuerda ──────────────────────────────────
    const cancelada = await citaEn(10, "573001110004");
    await c.query("update appointments set estado='cancelada' where id=$1", [cancelada]);
    await c.query("select public.tf_run_recordatorios()");
    check((await eventos()).length === 2, "una cita cancelada no se recuerda", (await eventos()).length + " eventos");

    // ── Una que ya pasó tampoco ────────────────────────────────────────────
    const pasada = await citaEn(-3, "573001110005");
    await c.query("select public.tf_run_recordatorios()");
    check((await eventos()).length === 2, "una cita que ya pasó tampoco", (await eventos()).length + " eventos");

    // ── Confirmar ──────────────────────────────────────────────────────────
    console.log("\nCuando la persona contesta:");
    const conf = (await c.query("select public.tf_tool_confirmar_cita($1::jsonb) as r",
      [JSON.stringify({ instance: inst, telefono: "573001110002", viene: true })])).rows[0].r;
    check(conf.ok && conf.confirmada, "confirma que viene", JSON.stringify(conf));
    const est = (await c.query("select confirmada_por_cliente from appointments where id=$1", [cerca])).rows[0];
    check(est.confirmada_por_cliente === true, "y queda marcado en la cita", String(est.confirmada_por_cliente));

    const no = (await c.query("select public.tf_tool_confirmar_cita($1::jsonb) as r",
      [JSON.stringify({ instance: inst, telefono: "573001110003", viene: false })])).rows[0].r;
    check(no.ok && no.cancelada, "si dice que no puede, se cancela y la hora se libera", JSON.stringify(no));

    const nadie = (await c.query("select public.tf_tool_confirmar_cita($1::jsonb) as r",
      [JSON.stringify({ instance: inst, telefono: "573009998888", viene: true })])).rows[0].r;
    check(nadie.ok === false, "y de alguien sin cita, dice que no la encuentra", JSON.stringify(nadie));

  } finally {
    await c.query("delete from n8n_events where company_id=$1", [emp]);
    await c.query("delete from companies where id=$1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ El recordatorio sale una vez, a buena hora, y nunca tarde.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
