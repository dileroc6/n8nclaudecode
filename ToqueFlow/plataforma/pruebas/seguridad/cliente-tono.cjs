// ============================================================================
// El cliente cambia el tono de su agente — y nada más
// ----------------------------------------------------------------------------
// Esta prueba está en seguridad/ y no en calidad/ a propósito. Lo que se
// comprueba no es que el tono se guarde: es que **esa puerta sea estrecha**.
//
// Darle al cliente un UPDATE sobre `agent_config` habría sido lo cómodo, y
// habría abierto un agujero de aislamiento: podría cambiar `whatsapp_instance`
// y apuntar SU agente a la instancia de otra empresa. Desde ahí lee las
// conversaciones ajenas y responde por ellas, porque **todo el sistema
// resuelve el inquilino por la instancia**.
//
// Con sesión de MIEMBRO, que es lo que de verdad tiene el cliente.
//
//   node pruebas/seguridad/cliente-tono.cjs
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
const rest = async (m, r, b) => {
  const x = await fetch(URL + "/rest/v1/" + r, {
    method: m,
    headers: { apikey: ANON, Authorization: "Bearer " + token, "Content-Type": "application/json", Prefer: "return=representation" },
    body: b ? JSON.stringify(b) : undefined,
  });
  const t = await x.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: x.ok, status: x.status, data: j };
};
const svc = async (m, r, b) => {
  const x = await fetch(URL + r, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
    body: b ? JSON.stringify(b) : undefined,
  });
  const t = await x.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: x.ok, status: x.status, data: j };
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
    return (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0];
  };
  const mia = await crear("ZZ Tono Mia");
  const vecina = await crear("ZZ Tono Vecina");

  const agente = async (empresa, nombre, instancia) => {
    await svc("POST", "/rest/v1/agent_config", {
      company_id: empresa.id, nombre, activo: false, whatsapp_instance: instancia,
      identidad: { tono: "el tono original", negocio: nombre },
    });
    return (await svc("GET", "/rest/v1/agent_config?select=id&whatsapp_instance=eq." + instancia)).data[0];
  };
  const mio = await agente(mia, "Mi agente", "zz-tono-mio-" + sello);
  const suyo = await agente(vecina, "Agente del vecino", "zz-tono-vecino-" + sello);

  const email = "zz-tono-" + sello + "@toqueflow.com";
  const pass = "Zt" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia.id });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  const tonoDe = async (id) =>
    ((await svc("GET", "/rest/v1/agent_config?select=identidad,whatsapp_instance&id=eq." + id)).data[0] || {});

  try {
    console.log("Con sesión de MIEMBRO, que es lo que tiene el cliente:\n");

    // ── Lo que SÍ puede ──────────────────────────────────────────────────────
    const r = await rest("POST", "rpc/tf_agente_tono", { p_agent: mio.id, p_tono: "De usted, sin emojis, directo al grano." });
    check(r.ok && r.data && r.data.ok, "cambia el tono de su propio agente", JSON.stringify(r.data));
    const despues = await tonoDe(mio.id);
    check(despues.identidad && despues.identidad.tono === "De usted, sin emojis, directo al grano.",
      "y el cambio quedó guardado", JSON.stringify(despues.identidad));
    check(despues.identidad && despues.identidad.negocio === "Mi agente",
      "sin pisar el resto de su configuración", JSON.stringify(despues.identidad));

    const ve = await rest("GET", "mis_agentes?select=id,nombre,tono");
    check(Array.isArray(ve.data) && ve.data.length === 1 && ve.data[0].id === mio.id,
      "ve su agente y solo el suyo", JSON.stringify(ve.data));
    check(ve.data && ve.data[0] && !("whatsapp_instance" in ve.data[0]),
      "y la vista NO le entrega la instancia de WhatsApp", JSON.stringify(Object.keys(ve.data[0] || {})));

    // ── Lo que NO puede, que es el punto ─────────────────────────────────────
    console.log("\nY lo que no debe poder:");

    const ajeno = await rest("POST", "rpc/tf_agente_tono", { p_agent: suyo.id, p_tono: "cambiado por un extraño" });
    const suyoDespues = await tonoDe(suyo.id);
    check(suyoDespues.identidad.tono === "el tono original",
      "NO puede cambiarle el tono al agente de otra empresa",
      "quedó: " + suyoDespues.identidad.tono + " (respuesta: " + JSON.stringify(ajeno.data) + ")");

    // El agujero que esta función existe para tapar: mover la instancia.
    const mover = await rest("PATCH", "agent_config?id=eq." + mio.id,
      { whatsapp_instance: suyo ? "zz-tono-vecino-" + sello : "x" });
    const trasMover = await tonoDe(mio.id);
    check(trasMover.whatsapp_instance === "zz-tono-mio-" + sello,
      "NO puede mover su agente a la instancia de otra empresa",
      "quedó apuntando a " + trasMover.whatsapp_instance + " (HTTP " + mover.status + ")");

    const encender = await rest("PATCH", "agent_config?id=eq." + mio.id, { activo: true });
    const trasEncender = (await svc("GET", "/rest/v1/agent_config?select=activo&id=eq." + mio.id)).data[0];
    check(trasEncender.activo === false, "NO puede encender su agente por su cuenta, saltándose el sandbox",
      "quedó activo=" + trasEncender.activo + " (HTTP " + encender.status + ")");

    const herramientas = await rest("PATCH", "agent_config?id=eq." + mio.id, { herramientas: ["recargar-saldo"] });
    const trasHerr = (await svc("GET", "/rest/v1/agent_config?select=herramientas&id=eq." + mio.id)).data[0];
    check(!(trasHerr.herramientas || []).includes("recargar-saldo"),
      "NO puede darse herramientas que no ha contratado",
      JSON.stringify(trasHerr.herramientas) + " (HTTP " + herramientas.status + ")");

    // Un tono enorme se cobra en CADA mensaje: va en el prefijo del prompt.
    const largo = await rest("POST", "rpc/tf_agente_tono", { p_agent: mio.id, p_tono: "x".repeat(5000) });
    check(largo.data && largo.data.ok === false, "NO acepta un tono desmedido — se paga en cada mensaje",
      JSON.stringify(largo.data));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina.id);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s): " + fallos.join(" · ")
    : "✅ El cliente cambia cómo habla su agente, y nada más.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
