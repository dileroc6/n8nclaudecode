// ============================================================================
// El aviso diario de Toque Rescata
// ----------------------------------------------------------------------------
// Las tres pérdidas ya se detectaban, pero el negocio tenía que entrar al portal
// a mirarlas — y un negocio con pacientes en la sala no entra al portal a mirar.
// Esto es lo que convierte una pantalla en un servicio: llega solo.
//
// Lo que se prueba no es que sepa contar (eso ya está probado en
// `toque-rescata.cjs`), sino las tres cosas que deciden si el aviso sirve o se
// aprende a ignorar:
//
//   · que llegue por la MAÑANA DEL NEGOCIO y no de madrugada
//   · que NO se repita si no cambió nada
//   · que si no hay nada que recuperar, se calle
//
// Para probar lo de la mañana no se espera a que sean las 8: se le pone a la
// empresa la zona horaria donde SON las 8 ahora mismo. Y a la empresa de
// control, una donde no lo son.
//
//   node pruebas/calidad/aviso-rescate.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const sello = Date.now().toString(36);

// El perfil cuelga de auth.users, así que el usuario se crea por la API de
// administración — igual que en las demás pruebas.
const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const svc = async (m, ruta, body) => {
  const x = await fetch(URL + ruta, {
    method: m,
    headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await x.text(); try { return JSON.parse(txt); } catch (e) { return txt; }
};
const usuarios = [];

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Una zona donde AHORA son las 8 de la mañana, y otra donde no.
  const zonaA = (await c.query(
    "select name from pg_timezone_names where extract(hour from timezone(name, now()))::int = 8 and name like 'A%/%' limit 1")).rows[0];
  const zonaDormida = (await c.query(
    "select name from pg_timezone_names where extract(hour from timezone(name, now()))::int = 3 limit 1")).rows[0];

  if (!zonaA || !zonaDormida) {
    console.log("No encontré zonas de prueba (raro). Se salta.");
    await c.end(); return;
  }
  console.log("Ahora mismo son las 8 en " + zonaA.name + " y las 3 en " + zonaDormida.name + ".\n");

  const pin = (await c.query("select id from catalogo where clave='paquete-rescata'")).rows[0].id;

  const montar = async (nombre, zona, conDatos) => {
    const emp = (await c.query(
      "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
      [nombre, "zz-av-" + nombre.replace(/[^a-z]/gi, "").toLowerCase() + "-" + sello])).rows[0].id;
    await c.query("select tf_zona_guardar($1,$2)", [emp, zona]);
    await c.query(`insert into flows (company_id, catalogo_id, name, status, type, kind)
                   values ($1,$2,'Toque Rescata','activo','paquete','paquete-rescata')`, [emp, pin]);
    // Alguien del negocio a quien escribirle.
    const correo = "zz-av-" + emp.slice(0, 8) + "@toqueflow.com";
    const u = await svc("POST", "/auth/v1/admin/users",
      { email: correo, password: "Zv" + sello + "!Aa9", email_confirm: true });
    usuarios.push(u.id);
    await c.query("update profiles set company_id=$1, role='member', status='active', full_name='Dueña' where id=$2",
      [emp, u.id]);

    if (conDatos) {
      for (let d = 0; d < 7; d++) {
        await c.query(`insert into agenda_franjas (company_id, dia, desde, hasta, cupos)
                       values ($1,$2,'09:00','17:00',1) on conflict do nothing`, [emp, d]);
      }
      await c.query(`insert into agenda_servicios (company_id, nombre, minutos)
                     values ($1,'Valoración',60) on conflict do nothing`, [emp]);
      const p = (await c.query(
        `insert into contacts (company_id, phone, full_name, status)
         values ($1,'573001110001','Ana Faltó','prospecto') returning id`, [emp])).rows[0].id;
      await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
        values ($1,$2,'Valoración', now() - interval '5 days', now() - interval '5 days' + interval '1 hour','no_asistio')`,
        [emp, p]);
    }
    return emp;
  };

  const correr = async () => (await c.query("select tf_run_aviso_rescate() n")).rows[0].n;
  const avisos = async (emp) => (await c.query(
    "select payload from n8n_events where company_id=$1 and event='aviso_rescate' order by created_at", [emp])).rows;

  const conDatos = await montar("Clinica Despierta", zonaA.name, true);
  const dormida  = await montar("Clinica Dormida",   zonaDormida.name, true);
  const vacia    = await montar("Clinica Vacia",     zonaA.name, false);

  try {
    // ── Primera vuelta ─────────────────────────────────────────────────────
    console.log("Primera vuelta del cron:");
    await correr();

    const a1 = await avisos(conDatos);
    check(a1.length === 1, "a la clínica donde son las 8 le llega el aviso", a1.length + " avisos");

    check((await avisos(dormida)).length === 0,
      "a la que está de madrugada NO: un aviso de «mañana tienes huecos» que llega a las 3 a.m. no sirve de nada", "");

    check((await avisos(vacia)).length === 0,
      "y a la que no tiene nada que recuperar tampoco: el silencio es una respuesta", "");

    // ── Qué dice, y a quién ────────────────────────────────────────────────
    const p = a1[0].payload;
    console.log("\nLo que dice el aviso:");
    console.log("    " + String(p.resumen).split("\n").join("\n    "));
    check(/faltó a su cita/.test(p.resumen || ""),
      "dice qué hay que hacer, no solo un número", JSON.stringify(p.resumen));
    check(p.enlace && /agenda\.html/.test(p.enlace), "y a dónde ir a hacerlo", JSON.stringify(p.enlace));

    check(Array.isArray(p.para) && p.para.length === 1 && /@toqueflow\.com$/.test(p.para[0]),
      "va a la persona del NEGOCIO", JSON.stringify(p.para));

    // Esto es lo que no puede fallar nunca: el aviso es interno, y un teléfono
    // de paciente dentro de él es una fuga esperando a que alguien reenvíe el
    // correo.
    const crudo = JSON.stringify(p);
    check(!/573001110001/.test(crudo) && !/Ana Faltó/.test(crudo),
      "y NO lleva dentro el teléfono ni el nombre de ningún paciente", crudo.slice(0, 200));

    // ── No repetirse ───────────────────────────────────────────────────────
    console.log("\nSegunda vuelta, sin que haya cambiado nada:");
    await correr();
    check((await avisos(conDatos)).length === 1,
      "no vuelve a escribir: un correo diario que dice lo mismo se aprende a ignorar en una semana", "");

    // ── Salvo que cambie ───────────────────────────────────────────────────
    console.log("\nAparece otra persona que faltó:");
    const otro = (await c.query(
      `insert into contacts (company_id, phone, full_name, status)
       values ($1,'573001110002','Beto Faltó','prospecto') returning id`, [conDatos])).rows[0].id;
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'Valoración', now() - interval '4 days', now() - interval '4 days' + interval '1 hour','no_asistio')`,
      [conDatos, otro]);

    await correr();
    const a2 = await avisos(conDatos);
    check(a2.length === 2, "ahora sí vuelve a escribir, porque el número cambió", a2.length + " avisos");
    check(a2[1].payload.plantones === 2, "y dice el número nuevo", JSON.stringify(a2[1].payload.plantones));

    // ── El aviso no dispara envíos ─────────────────────────────────────────
    console.log("\nY el aviso no manda nada a los pacientes:");
    const campanas = (await c.query(
      "select count(*)::int n from n8n_events where company_id=$1 and event='ejecutar_campana'", [conDatos])).rows[0].n;
    check(campanas === 0,
      "no encoló ninguna campaña: avisar y enviar son dos actos distintos a propósito",
      campanas + " campañas encoladas");

  } finally {
    for (const u of usuarios) await svc("DELETE", "/auth/v1/admin/users/" + u);
    await c.query("delete from companies where id in ($1,$2,$3)", [conDatos, dormida, vacia]);
    await c.end();
  }

  // ── ¿Y hay alguien que recoja el evento? ──────────────────────────────────
  // Que la base encole bien no dice que el aviso salga. Entre las dos están el
  // receptor de n8n y su handler, y un evento que nadie recoge se queda en
  // «pending» para siempre: el negocio nunca se entera, que es exactamente el
  // estado del que veníamos.
  try {
    const K = JSON.parse(fs.readFileSync(
      path.join(PLAT, "..", "..", ".claude", "settings.local.json"), "utf8")).env.N8N_API_KEY;
    const B = "https://n8n.srv1398596.hstgr.cloud";
    const n8n = async (ruta) => (await (await fetch(B + "/api/v1" + ruta,
      { headers: { "X-N8N-API-KEY": K } })).json());

    console.log("\nY del otro lado, ¿alguien lo recoge?");
    const rec = await n8n("/workflows/f04pApXeC3bLbR8K");
    const rama = (rec.nodes || []).find((n) =>
      n.type === "n8n-nodes-base.if" &&
      JSON.stringify(n.parameters || {}).includes("aviso_rescate"));
    check(!!rama, "el receptor tiene una rama para «aviso_rescate»",
      "sin ella el evento se queda en pending para siempre");

    const ejec = (rec.nodes || []).find((n) => n.name === "Ejecutar handler aviso");
    const idH = ejec && ejec.parameters && ejec.parameters.workflowId &&
                (ejec.parameters.workflowId.value || ejec.parameters.workflowId);
    check(!!idH, "y llama a un handler", "la rama no lleva a ningún sitio");

    if (idH) {
      const h = await n8n("/workflows/" + idH);
      check(!!h && !h.message, "que existe de verdad", "n8n dice: " + JSON.stringify(h).slice(0, 120));
      check(h && h.active === true, "y está encendido", "está apagado");
      const correo = h && (h.nodes || []).find((n) => /emailSend/i.test(n.type || ""));
      check(!!correo, "y manda un correo", "no tiene nodo de correo");
      // Un destinatario fijo aquí le mandaría los datos de una empresa a otra.
      check(correo && /para/.test(String(correo.parameters.toEmail || "")),
        "a quien diga el evento, no a una lista fija",
        "toEmail = " + JSON.stringify(correo && correo.parameters.toEmail));
    }
  } catch (e) {
    check(false, "se pudo comprobar el lado de n8n", e.message);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ El aviso llega en su mañana, no se repite, y si no hay nada se calla.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
