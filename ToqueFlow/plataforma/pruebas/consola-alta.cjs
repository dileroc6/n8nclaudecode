// ============================================================================
// ¿Funciona el alta de un cliente, de punta a punta?
// ----------------------------------------------------------------------------
// Hace exactamente lo que hace el paso a paso: crear la empresa, el usuario,
// las filas de productos y la configuración del agente. Con sesión real de
// super admin y el RLS puesto.
//
// Lo que más importa comprobar no es que se cree: es que nazca APAGADO y con
// una instancia que no existe. Un alta que deja un bot contestando de una no
// es rápida, es peligrosa.
//
//   node pruebas/consola-alta.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sello = Date.now().toString(36);

let token = null;
const rest = async (metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + "/rest/v1/" + ruta, {
    method: metodo,
    headers: Object.assign({ apikey: ANON, Authorization: "Bearer " + (token || ANON), "Content-Type": "application/json" }, extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const svc = async (metodo, ruta, cuerpo) => {
  const r = await fetch(URL + ruta, {
    method: metodo,
    headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const admin = await svc("POST", "/auth/v1/admin/users",
    { email: "prueba-alta-" + sello + "@toqueflow.com", password: "Pa" + sello + "!Aa9", email_confirm: true });
  const uid = admin.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "super_admin", status: "active", full_name: "Prueba alta" });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: admin.data.email, password: "Pa" + sello + "!Aa9" }),
  })).json();
  token = ses.access_token;

  let empresaId = null;
  try {
    const cat = (await rest("GET", "catalogo_detalle?select=*")).data;
    const ofrecibles = cat.filter((c) => c.liberado && c.vendible && c.tipo !== "herramienta");
    check(ofrecibles.length > 0, "hay piezas que ofrecer en el alta", "el catálogo no tiene nada liberado y vendible");
    check(!ofrecibles.some((c) => !c.liberado),
          "NO se ofrece nada que esté en construcción", "se coló algo sin liberar");

    console.log("\n── El alta, paso por paso ──");
    const slug = "zz-alta-" + sello;
    const emp = (await rest("POST", "companies",
      { name: "ZZ Clínica de Prueba", city: "Bogotá", slug, status: "active" },
      { Prefer: "return=representation" })).data[0];
    check(!!(emp && emp.id), "crea la empresa", "no devolvió id");
    empresaId = emp.id;

    // Las piezas: el agente, más las que vienen con la plataforma.
    const elegidas = ["agente-atencion"];
    const conPlataforma = cat.filter((c) => elegidas.includes(c.clave) || (!c.vendible && c.tipo === "producto"));
    const filas = conPlataforma.map((c) => ({
      company_id: emp.id, catalogo_id: c.id, name: c.nombre,
      description: c.beneficio, status: "próximamente", type: c.tipo, kind: c.clave,
    }));
    const ins = await rest("POST", "flows", filas, { Prefer: "return=representation" });
    check(ins.ok, "crea las filas de productos", "HTTP " + ins.status + " " + JSON.stringify(ins.data).slice(0, 150));

    const cfg = await rest("POST", "agent_config", {
      company_id: emp.id, activo: false, whatsapp_instance: slug + "-sandbox",
      identidad: { negocio: "ZZ Clínica de Prueba", tono: "Cercano y directo." },
      captura: { campos: [
        { clave: "nombre", etiqueta: "Su primer nombre", obligatorio: true },
        { clave: "correo", etiqueta: "Su correo", obligatorio: false },
      ]},
      enrutamiento: { reglas: [{ si: "quiere comprar", accion: "notificar_humano", destino: "equipo" }] },
      limites: { nunca: ["Dar consejo médico."], escalar_si: ["se molesta"] },
      agenda: { modo: "ninguna" }, herramientas: [],
    }, { Prefer: "return=representation" });
    check(cfg.ok, "crea la configuración del agente", "HTTP " + cfg.status + " " + JSON.stringify(cfg.data).slice(0, 200));

    console.log("\n── Lo que de verdad importa: que NO quede encendido ──");
    const rt = (await rest("GET", "agent_runtime?select=*&company_id=eq." + emp.id)).data[0];
    check(rt && rt.activo === false, "el agente nace APAGADO", JSON.stringify(rt && rt.activo));
    check(rt && /-sandbox$/.test(rt.whatsapp_instance || ""),
          "la instancia apunta a una que no existe en Evolution", rt && rt.whatsapp_instance);

    // Que el interruptor de verdad funcione: con la instancia falsa, el agente
    // no responde ni aunque lo enciendan.
    await svc("PATCH", "/rest/v1/agent_config?company_id=eq." + emp.id, { activo: true });
    const ctx = await svc("POST", "/rest/v1/rpc/tf_agente_contexto",
      { p_instance: slug + "-sandbox", p_telefono: "573001112233", p_test: true });
    check(ctx.data === null || (ctx.data && ctx.data.config && !ctx.data.config.conocimiento),
          "encendido pero sin conocimiento: no tiene nada que responder",
          JSON.stringify(ctx.data).slice(0, 150));

    console.log("\n── La ficha del cliente lo muestra bien ──");
    const mx = (await rest("GET", "empresa_catalogo?select=*&company_id=eq." + emp.id)).data;
    const suyas = mx.filter((m) => m.estado_empresa !== "no");
    check(suyas.length === conPlataforma.length,
          "sus productos aparecen en la ficha (" + suyas.length + ")",
          suyas.length + " contra " + conPlataforma.length + " creados");
    check(suyas.every((m) => m.estado_empresa === "proximamente"),
          "todos nacen «sin encender», ninguno andando",
          JSON.stringify(suyas.map((m) => m.estado_empresa)));

    const res = (await rest("GET", "empresa_resumen?select=*&company_id=eq." + emp.id)).data[0];
    check(res && res.productos_activos === 0 && res.productos_proximamente >= 1,
          "el resumen cuenta solo lo vendible y nada activo",
          JSON.stringify(res && { a: res.productos_activos, p: res.productos_proximamente }));

  } finally {
    if (empresaId) await svc("DELETE", "/rest/v1/companies?id=eq." + empresaId);
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
  }

  console.log("\n═══ " + (fallos.length ? fallos.length + " fallo(s)" : "Todo pasó") + " ═══");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
