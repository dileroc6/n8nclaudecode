// ============================================================================
// ¿Puede el cliente decidir qué guarda de su gente?
// ----------------------------------------------------------------------------
// Diego lo pidió así: «Toque Atiende debe tener incluida la herramienta de
// guardar clientes con campos personalizados que puedan ser cargados, editados
// y borrados por el mismo cliente. El cliente decide qué campos incluir.»
//
// Eso son cuatro cosas que probar con sesión de MIEMBRO —no de admin, porque
// el punto es justamente que no tenga que pedírselo a nadie— y dos que NO debe
// poder: ver ni tocar los campos de otra empresa.
//
// Y una quinta que es la que de verdad conecta las dos mitades: que un campo
// marcado `capturar` llegue al agente, y uno sin marcar no. Sin eso, el portal
// sería una pantalla bonita que no cambia nada.
//
//   node pruebas/cliente-campos.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
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
    headers: Object.assign(
      { apikey: ANON, Authorization: "Bearer " + token, "Content-Type": "application/json" },
      extra || {}
    ),
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
  const crear = async (n) => {
    const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello;
    await svc("POST", "/rest/v1/companies", { name: n, slug, status: "active" });
    return (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0];
  };
  const mia = await crear("ZZ Campos Mia");
  const vecina = await crear("ZZ Campos Vecina");

  // La vecina define un campo suyo. No debería verlo nadie más.
  await svc("POST", "/rest/v1/contact_campos",
    { company_id: vecina.id, clave: "secreto_vecino", etiqueta: "Secreto del vecino" });

  const email = "zz-campos-" + sello + "@toqueflow.com";
  const pass = "Zc" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia.id });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    console.log("Con sesión de MIEMBRO, que es lo que tiene el cliente:\n");

    // ── Crear ────────────────────────────────────────────────────────────────
    // Una tienda que quiere guardar la talla. Nada que ver con clases ni
    // membresías: es justo el caso que rompía el modelo viejo.
    const talla = await rest("POST", "contact_campos", {
      company_id: mia.id, clave: "talla", etiqueta: "Talla",
      tipo: "opciones", opciones: ["S", "M", "L", "XL"], capturar: true, orden: 10,
    }, { Prefer: "return=representation" });
    check(talla.ok, "crea un campo con lista de opciones",
      "HTTP " + talla.status + " " + JSON.stringify(talla.data).slice(0, 160));
    const idTalla = (talla.data || [])[0] && talla.data[0].id;

    const placa = await rest("POST", "contact_campos", {
      company_id: mia.id, clave: "placa", etiqueta: "Placa del carro", capturar: false, orden: 20,
    }, { Prefer: "return=representation" });
    check(placa.ok, "crea un campo que el agente NO pregunta", "HTTP " + placa.status);
    const idPlaca = (placa.data || [])[0] && placa.data[0].id;

    // ── Editar ───────────────────────────────────────────────────────────────
    const edit = await rest("PATCH", "contact_campos?id=eq." + idTalla,
      { etiqueta: "Talla de camiseta", opciones: ["S", "M", "L"] });
    check(edit.ok, "edita un campo suyo", "HTTP " + edit.status);
    const releida = await rest("GET", "contact_campos?select=etiqueta,opciones&id=eq." + idTalla);
    check((releida.data || [])[0] && releida.data[0].opciones.length === 3,
      "y el cambio quedó guardado", JSON.stringify(releida.data));

    // ── No se puede repetir la clave ─────────────────────────────────────────
    const repe = await rest("POST", "contact_campos",
      { company_id: mia.id, clave: "talla", etiqueta: "Otra talla" });
    check(!repe.ok, "no deja dos campos con la misma clave", "lo dejó: HTTP " + repe.status);

    // ── El agente recibe solo los marcados ───────────────────────────────────
    // Esta es la prueba que importa: que definir un campo en el portal cambie
    // de verdad lo que el agente pregunta, sin que nadie toque su configuración.
    const inst = "zz-campos-" + sello;
    await svc("POST", "/rest/v1/agent_config", {
      company_id: mia.id, nombre: "Agente de prueba", activo: true,
      whatsapp_instance: inst, identidad: { tono: "neutro" },
    });
    const ctx = await svc("POST", "/rest/v1/rpc/tf_agente_contexto",
      { p_instance: inst, p_telefono: "573001234567", p_test: true });
    const captura = ((ctx.data || {}).config || {}).captura || {};
    const claves = (captura.campos || []).map((c) => c.clave);
    check(claves.includes("talla"), "el agente recibe el campo marcado", JSON.stringify(claves));
    check(!claves.includes("placa"), "y NO recibe el que no está marcado", JSON.stringify(claves));
    const conOpciones = (captura.campos || []).find((c) => c.clave === "talla");
    check(conOpciones && (conOpciones.opciones || []).length === 3,
      "y le llegan las opciones cerradas, no texto libre", JSON.stringify(conOpciones));

    // ── El candado al guardar ────────────────────────────────────────────────
    // Que el agente OFREZCA la lista cerrada en el prompt no basta: un prompt
    // no es un candado. Lo que decide es la validacion en la base, que es la
    // misma para el agente y para el portal.
    const valida = async (datos) => (await svc('POST', '/rest/v1/rpc/tf_validar_campos',
      { p_company: mia.id, p_datos: datos })).data;

    const v1 = await valida({ talla: 'M' });
    check(v1 && v1.datos && v1.datos.talla === 'M', 'guarda un valor que SI esta en la lista', JSON.stringify(v1));

    const v2 = await valida({ talla: 'XXXL' });
    check(v2 && Object.keys(v2.datos || {}).length === 0 && (v2.ignorado || []).length === 1,
      'NO guarda un valor fuera de la lista cerrada', JSON.stringify(v2));

    const v3 = await valida({ inventado: 'lo que sea' });
    check(v3 && Object.keys(v3.datos || {}).length === 0,
      'NO guarda un campo que esta empresa nunca definio', JSON.stringify(v3));

    const v4 = await valida({ nombre: 'Ana', email: 'ana@x.com' });
    check(v4 && v4.datos && v4.datos.nombre === 'Ana' && v4.datos.email === 'ana@x.com',
      'el nombre y el correo pasan sin tener que declararlos', JSON.stringify(v4));

    // Y el caso que de verdad se da: el modelo contesta con media frase.
    await rest('PATCH', 'contact_campos?id=eq.' + idTalla, { opciones: ['Talla S', 'Talla M', 'Talla L'] });
    const v5 = await valida({ talla: 'M' });
    check(v5 && v5.datos && v5.datos.talla === 'Talla M',
      'entiende «M» cuando la opcion es «Talla M» (coincidencia unica)', JSON.stringify(v5));
    const v6 = await valida({ talla: 'Talla' });
    check(v6 && Object.keys(v6.datos || {}).length === 0,
      'pero NO adivina cuando casa con varias', JSON.stringify(v6));
    await rest('PATCH', 'contact_campos?id=eq.' + idTalla, { opciones: ['S', 'M', 'L'] });

    // ── Borrar ───────────────────────────────────────────────────────────────
    const del = await rest("DELETE", "contact_campos?id=eq." + idPlaca);
    check(del.ok, "borra un campo suyo", "HTTP " + del.status);
    const quedo = await rest("GET", "contact_campos?select=id&id=eq." + idPlaca);
    check((quedo.data || []).length === 0, "y de verdad se fue", JSON.stringify(quedo.data));

    // ── Lo que NO puede ──────────────────────────────────────────────────────
    console.log("\nY lo que no debe poder:");
    const todos = await rest("GET", "contact_campos?select=company_id,clave");
    const ajenos = (todos.data || []).filter((x) => x.company_id !== mia.id);
    check(ajenos.length === 0, "no ve los campos de otra empresa", JSON.stringify(ajenos));

    const colado = await rest("POST", "contact_campos",
      { company_id: vecina.id, clave: "colado", etiqueta: "Colado" }, { Prefer: "return=representation" });
    check(!colado.ok, "no puede crear campos en otra empresa", "lo dejó: HTTP " + colado.status);

    const borrarAjeno = await rest("DELETE", "contact_campos?clave=eq.secreto_vecino");
    const sigue = await svc("GET", "/rest/v1/contact_campos?select=id&company_id=eq." + vecina.id);
    check((sigue.data || []).length === 1, "no puede borrar los campos de otra empresa",
      "quedaron " + (sigue.data || []).length + " (HTTP " + borrarAjeno.status + ")");

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina.id);
  }

  console.log("\n═══ " + (fallos.length ? fallos.length + " fallo(s)" : "Todo pasó") + " ═══");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
