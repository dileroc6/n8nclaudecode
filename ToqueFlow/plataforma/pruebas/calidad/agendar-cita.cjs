// ============================================================================
// Agendar dentro de la conversación — sin pisar a nadie
// ----------------------------------------------------------------------------
// El fallo que de verdad importa aquí no es un error en pantalla: es que dos
// personas queden citadas en el mismo cupo y una llegue y no la puedan
// atender. Eso lo ve el cliente del cliente, en la cara, y es el tipo de cosa
// por la que un negocio apaga el agente.
//
// Y no es un caso raro: dos conversaciones a la vez es lo normal en un negocio
// que funciona. Por eso la prueba **lanza dos citas simultáneas de verdad**,
// no una detrás de otra.
//
//   node pruebas/calidad/agendar-cita.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client, Pool } = require("pg");
const sello = Date.now().toString(36);
const CONN = { connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } };

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

function proximoMiercoles() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 3);
  return d;
}

(async () => {
  const c = new Client(CONN);
  await c.connect();

  const inst = "zz-cita-" + sello;
  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Clínica de prueba", "zz-cita-" + sello])).rows[0].id;

  try {
    await c.query("insert into agent_config (company_id, nombre, activo, whatsapp_instance, identidad) values ($1,'Agente',true,$2,'{}'::jsonb)", [emp, inst]);
    // Miércoles de 9 a 11, UNA silla. Con un solo cupo la carrera se ve limpia.
    await c.query("insert into agenda_franjas (company_id, dia, desde, hasta, cupos) values ($1,3,'09:00','11:00',1)", [emp]);
    await c.query("insert into agenda_servicios (company_id, nombre, minutos) values ($1,'Valoración',60)", [emp]);

    console.log("Una clínica: miércoles de 9 a 11, UNA silla, valoración de 60 minutos.\n");

    // ── Ver disponibilidad ─────────────────────────────────────────────────
    const disp = (await c.query("select public.tf_tool_ver_disponibilidad($1,'Valoración',14) as r", [inst])).rows[0].r;
    check(disp.ok, "ver-disponibilidad responde", JSON.stringify(disp).slice(0, 140));
    check(disp.horas_libres.length >= 2, "ofrece horas libres", disp.horas_libres.length + " horas");
    // En español y en la hora del negocio. Con `TMDay` salía «Wednesday 02 de
    // September»: el formato dependía de la configuración regional del
    // servidor, y cómo le habla el agente a la gente no puede depender de eso.
    const enEspanol = /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i;
    check(disp.horas_libres.every((h) => enEspanol.test(h.cuando) && /a\. m\.|p\. m\./.test(h.cuando)),
      "las escribe en español y en la hora del negocio, no en UTC ni en inglés",
      JSON.stringify(disp.horas_libres[0]));
    console.log("     ej: «" + (disp.horas_libres[0] || {}).cuando + "»");

    const sinServicio = (await c.query("select public.tf_tool_ver_disponibilidad($1,'Masaje',14) as r", [inst])).rows[0].r;
    check(sinServicio.ok === false && Array.isArray(sinServicio.servicios),
      "un servicio que no existe devuelve la lista de los que sí", JSON.stringify(sinServicio).slice(0, 120));

    // ── Agendar ────────────────────────────────────────────────────────────
    const mie = proximoMiercoles();
    const nueve = new Date(mie); nueve.setHours(9, 0, 0, 0);
    const pedir = (tel, nombre, cuando) => ({
      instance: inst, telefono: tel, nombre, servicio: "Valoración", inicio: (cuando || nueve).toISOString(),
    });

    const uno = (await c.query("select public.tf_tool_agendar_cita($1::jsonb) as r", [JSON.stringify(pedir("573001110001", "Ana"))])).rows[0].r;
    check(uno.ok, "agenda la cita", JSON.stringify(uno).slice(0, 140));
    check(enEspanol.test(uno.cuando || ""), "y devuelve cuándo, en español", uno.cuando);
    console.log("     «" + uno.cuando + "»");

    const creado = (await c.query("select full_name, status from contacts where company_id=$1 and phone=$2", [emp, "573001110001"])).rows[0];
    check(creado && creado.full_name === "Ana", "crea a la persona si no estaba", JSON.stringify(creado));

    // ── Y la hora ya no se ofrece ──────────────────────────────────────────
    const disp2 = (await c.query("select public.tf_tool_ver_disponibilidad($1,'Valoración',14) as r", [inst])).rows[0].r;
    const sigue = disp2.horas_libres.some((h) => new Date(h.inicio).getTime() === nueve.getTime());
    check(!sigue, "esa hora deja de ofrecerse", "todavía la ofrece");

    // ── Segunda persona a la misma hora ────────────────────────────────────
    const dos = (await c.query("select public.tf_tool_agendar_cita($1::jsonb) as r", [JSON.stringify(pedir("573001110002", "Luis"))])).rows[0].r;
    check(dos.ok === false, "una segunda persona a esa hora NO entra", JSON.stringify(dos).slice(0, 140));

    // ── La carrera de verdad: dos a la vez ─────────────────────────────────
    // Es el caso que el candado existe para tapar, y solo se ve lanzándolas
    // en paralelo con conexiones distintas.
    const diez = new Date(mie); diez.setHours(10, 0, 0, 0);
    const pool = new Pool({ ...CONN, max: 6 });
    const intentos = await Promise.all(
      [1, 2, 3, 4].map((i) =>
        pool.query("select public.tf_tool_agendar_cita($1::jsonb) as r",
          [JSON.stringify(pedir("57300222000" + i, "Simultáneo " + i, diez))])
          .then((x) => x.rows[0].r).catch((e) => ({ ok: false, motivo: "error: " + e.message }))));
    await pool.end();

    const entraron = intentos.filter((x) => x.ok).length;
    check(entraron === 1, "de 4 intentos simultáneos por el mismo cupo, entra UNO",
      "entraron " + entraron + ": " + JSON.stringify(intentos.map((x) => x.ok ? "sí" : x.motivo)));

    const enBase = (await c.query(
      "select count(*)::int n from appointments where company_id=$1 and inicio=$2 and estado<>'cancelada'",
      [emp, diez.toISOString()])).rows[0].n;
    check(enBase === 1, "y en la base queda UNA sola cita a esa hora", enBase + " citas");

    // ── Lo que no debe dejar ───────────────────────────────────────────────
    console.log("\nY lo que no debe dejar:");
    const domingo = new Date(mie); domingo.setDate(domingo.getDate() + 4); domingo.setHours(10, 0, 0, 0);
    const fuera = (await c.query("select public.tf_tool_agendar_cita($1::jsonb) as r", [JSON.stringify(pedir("573003330001", "Fuera", domingo))])).rows[0].r;
    check(fuera.ok === false, "no agenda un día que el negocio no atiende", JSON.stringify(fuera).slice(0, 120));

    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    const pasado = (await c.query("select public.tf_tool_agendar_cita($1::jsonb) as r", [JSON.stringify(pedir("573003330002", "Pasado", ayer))])).rows[0].r;
    check(pasado.ok === false, "no agenda en el pasado", JSON.stringify(pasado).slice(0, 120));

    const otra = (await c.query("select public.tf_tool_agendar_cita($1::jsonb) as r",
      [JSON.stringify({ instance: "no-existe-" + sello, telefono: "573004440001", servicio: "Valoración", inicio: nueve.toISOString() })])).rows[0].r;
    check(otra.ok === false, "no agenda desde una instancia desconocida", JSON.stringify(otra).slice(0, 120));

  } finally {
    await c.query("delete from companies where id=$1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s): " + fallos.join(" · ")
    : "✅ Agenda dentro de la conversación, y nunca dos personas en el mismo cupo.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
