// ============================================================================
// El cliente configura SU agenda, y solo la suya
// ----------------------------------------------------------------------------
// Toque Agenda se vendía como listo por $250.000/mes y **no había ninguna
// pantalla** que llenara `agenda_franjas`: solo las pruebas la tocaban. Un
// cliente nuevo compraba la agenda y quedaba vacía hasta que alguien entrara a
// la base a mano — lo contrario de un producto estándar.
//
// Ahora la llena él desde Ajustes. Y como la llena él, hay que comprobar lo de
// siempre: que no pueda tocar la del vecino. La agenda es la tabla donde eso
// duele distinto — no es ver un dato ajeno, es **poder cerrarle el negocio a
// otro** metiéndole un bloqueo, o abrirle horas que no atiende.
//
// Se prueba desde afuera, con la llave pública y sesión de miembro, que es por
// donde llegaría.
//
//   node pruebas/seguridad/cliente-configura-su-agenda.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sello = Date.now().toString(36);

let token = null;
const rest = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m,
    headers: {
      apikey: ANON, Authorization: "Bearer " + (token || ANON),
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const rpc = (fn, args) => rest("POST", "/rest/v1/rpc/" + fn, args);
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m,
    headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const crear = async (n) => {
    const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello;
    await svc("POST", "/rest/v1/companies", { name: n, slug, status: "active" });
    return (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0].id;
  };
  const mia = await crear("ZZ Agenda Mia");
  const vecina = await crear("ZZ Agenda Vecina");

  // El vecino ya tiene su agenda puesta.
  await svc("POST", "/rest/v1/agenda_franjas",
    { company_id: vecina, dia: 1, desde: "09:00", hasta: "18:00", cupos: 1, activa: true });
  const franjaVecina = (await svc("GET", "/rest/v1/agenda_franjas?select=id&company_id=eq." + vecina)).data[0].id;

  // Y un agente, para lo del recordatorio.
  await svc("POST", "/rest/v1/agent_config",
    { company_id: vecina, whatsapp_instance: "zz-vecina-" + sello, activo: false });
  const agenteVecino = (await svc("GET", "/rest/v1/agent_config?select=id&company_id=eq." + vecina)).data[0].id;

  const email = "zz-ag-" + sello + "@toqueflow.com";
  const pass = "Za" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    console.log("Con sesión de miembro, que es lo que tiene el cliente:\n");
    console.log("Lo suyo:");

    // ── Puede montar su agenda entera ──────────────────────────────────────
    const f = await rest("POST", "/rest/v1/agenda_franjas",
      { company_id: mia, dia: 1, desde: "09:00", hasta: "13:00", cupos: 2, activa: true });
    check(f.ok && (f.data || []).length === 1, "pone sus horarios", "HTTP " + f.status + " " + JSON.stringify(f.data).slice(0, 140));
    const miFranja = f.ok && f.data[0] ? f.data[0].id : null;

    // Dos tramos el mismo día: cerrar al mediodía es lo normal, no un caso raro.
    const f2 = await rest("POST", "/rest/v1/agenda_franjas",
      { company_id: mia, dia: 1, desde: "15:00", hasta: "19:00", cupos: 2, activa: true });
    check(f2.ok, "y puede partir el día en dos tramos", "HTTP " + f2.status);

    const s = await rest("POST", "/rest/v1/agenda_servicios",
      { company_id: mia, nombre: "Valoración", minutos: 45, ocupa: 1, activo: true, orden: 10 });
    check(s.ok, "crea sus servicios", "HTTP " + s.status + " " + JSON.stringify(s.data).slice(0, 140));

    const b = await rest("POST", "/rest/v1/agenda_bloqueos",
      { company_id: mia, desde: "2026-12-24T00:00:00", hasta: "2026-12-25T23:59:59", motivo: "Navidad" });
    check(b.ok, "y bloquea los días que no atiende", "HTTP " + b.status);

    if (miFranja) {
      const up = await rest("PATCH", "/rest/v1/agenda_franjas?id=eq." + miFranja, { cupos: 3 });
      check(up.ok, "cambia lo suyo", "HTTP " + up.status);
      const del = await rest("DELETE", "/rest/v1/agenda_franjas?id=eq." + miFranja);
      check(del.ok, "y lo quita", "HTTP " + del.status);
    }

    // ── Y eso ya sirve para agendar ────────────────────────────────────────
    const libre = await rpc("tf_agenda_libre",
      { p_company: mia, p_servicio: "Valoración", p_dias: 7, p_desde: null });
    check(libre.ok && libre.data && libre.data.ok === true && (libre.data.huecos || []).length > 0,
      "y con eso su asistente YA tiene horas que ofrecer — que es el punto de todo esto",
      JSON.stringify(libre.data).slice(0, 180));

    // ── Lo del vecino ──────────────────────────────────────────────────────
    console.log("\nLo del vecino:");

    const ve = await rest("GET", "/rest/v1/agenda_franjas?select=id&company_id=eq." + vecina);
    check((ve.data || []).length === 0, "no ve su horario", JSON.stringify(ve.data).slice(0, 140));

    // Lo que duele de verdad: meterle un bloqueo es cerrarle el negocio.
    const meter = await rest("POST", "/rest/v1/agenda_bloqueos",
      { company_id: vecina, desde: "2026-10-01T00:00:00", hasta: "2026-12-31T23:59:59", motivo: "cerrado" });
    const quedo = (await svc("GET", "/rest/v1/agenda_bloqueos?select=id&company_id=eq." + vecina)).data || [];
    check(quedo.length === 0,
      "NO puede meterle un bloqueo — eso sería cerrarle el negocio tres meses",
      "HTTP " + meter.status + ", quedaron " + quedo.length + " bloqueos");

    const abrir = await rest("PATCH", "/rest/v1/agenda_franjas?id=eq." + franjaVecina, { hasta: "23:59", cupos: 99 });
    const tras = (await svc("GET", "/rest/v1/agenda_franjas?select=hasta,cupos&id=eq." + franjaVecina)).data[0];
    check(String(tras.hasta).slice(0, 5) === "18:00" && tras.cupos === 1,
      "ni abrirle horas que no atiende", "quedó " + tras.hasta + " con " + tras.cupos + " cupos");

    const borrar = await rest("DELETE", "/rest/v1/agenda_franjas?id=eq." + franjaVecina);
    const sigue = (await svc("GET", "/rest/v1/agenda_franjas?select=id&id=eq." + franjaVecina)).data || [];
    check(sigue.length === 1, "ni borrarle el suyo", "HTTP " + borrar.status + ", quedan " + sigue.length);

    const serv = await rest("POST", "/rest/v1/agenda_servicios",
      { company_id: vecina, nombre: "Colado", minutos: 60, ocupa: 1, activo: true, orden: 1 });
    const svs = (await svc("GET", "/rest/v1/agenda_servicios?select=id&company_id=eq." + vecina)).data || [];
    check(svs.length === 0, "ni colarle un servicio", "HTTP " + serv.status + ", quedaron " + svs.length);

    // ── El recordatorio ────────────────────────────────────────────────────
    console.log("\nEl recordatorio:");
    const malAgente = await rpc("tf_agente_recordatorios", {
      p_agent: agenteVecino, p_horas_antes: 1, p_pedir_confirmacion: false,
      p_desde: "00:00", p_hasta: "23:59",
    });
    check(malAgente.data && malAgente.data.ok === false,
      "no puede cambiarle el recordatorio al agente del vecino", JSON.stringify(malAgente.data).slice(0, 140));

    const leer = await rpc("tf_mi_recordatorio", { p_agent: agenteVecino });
    check(leer.data === null,
      "ni leerlo: `tf_recordatorio_config` no comprobaba de quién era el agente porque solo la llamaba el cron",
      JSON.stringify(leer.data).slice(0, 140));

    // Y los topes, que no son burocracia.
    await svc("POST", "/rest/v1/agent_config", { company_id: mia, whatsapp_instance: "zz-mia-" + sello, activo: false });
    const miAgente = (await svc("GET", "/rest/v1/agent_config?select=id&company_id=eq." + mia)).data[0].id;

    const raro = await rpc("tf_agente_recordatorios", {
      p_agent: miAgente, p_horas_antes: 900, p_pedir_confirmacion: true, p_desde: "08:00", p_hasta: "20:00" });
    check(raro.data && raro.data.ok === false, "y no acepta avisar con 900 horas de antelación", JSON.stringify(raro.data));

    const horaMala = await rpc("tf_agente_recordatorios", {
      p_agent: miAgente, p_horas_antes: 24, p_pedir_confirmacion: true, p_desde: "8am", p_hasta: "20:00" });
    check(horaMala.data && horaMala.data.ok === false,
      "ni una hora escrita como «8am»: el cron no la sabe comparar y el recordatorio no saldría nunca, en silencio",
      JSON.stringify(horaMala.data));

    const bien = await rpc("tf_agente_recordatorios", {
      p_agent: miAgente, p_horas_antes: 48, p_pedir_confirmacion: false, p_desde: "09:00", p_hasta: "19:00" });
    check(bien.data && bien.data.ok === true && bien.data.horas_antes === 48,
      "y sí acepta el suyo", JSON.stringify(bien.data));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Monta su agenda solo, y no toca la del vecino.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
