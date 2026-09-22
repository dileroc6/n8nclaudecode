// ============================================================================
// El negocio aprueba sus recargas, y solo las suyas
// ----------------------------------------------------------------------------
// Toque Recargas se vende a $250.000/mes. La regla que define el pin es
// «matricular y recargar SIEMPRE los confirma una persona», y el agente se lo
// promete al cliente final: «alguien del negocio la revisa y te confirma».
//
// `saldo_solicitudes` y `tf_saldo_resolver` existían desde el primer día. Lo que
// no existía era **la pantalla donde esa persona confirma**: ningún archivo del
// portal tocaba esas tablas, solo las pruebas. El negocio prometía algo y no
// tenía dónde cumplirlo.
//
// Ahora están en `pedidos.html`. Y como aprobar una recarga **suma saldo de
// verdad**, hay que comprobar lo de siempre desde afuera: que un cliente no
// pueda aprobar —ni ver— las de otro. Regalarle clases al vecino es un daño
// distinto a leerle un dato.
//
//   node pruebas/seguridad/aprobar-recargas.cjs
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
    headers: { apikey: ANON, Authorization: "Bearer " + (token || ANON),
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const rpc = (fn, args) => rest("POST", "/rest/v1/rpc/" + fn, args);
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE,
                          "Content-Type": "application/json", Prefer: "return=representation" },
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
  const mia = await crear("ZZ Recargas Mia");
  const vecina = await crear("ZZ Recargas Vecina");

  const contacto = async (emp, nombre, tel) => (await svc("POST", "/rest/v1/contacts",
    { company_id: emp, full_name: nombre, phone: tel, status: "activo" })).data[0].id;
  const ana = await contacto(mia, "Ana Alumna", "573001110001");
  const vec = await contacto(vecina, "Vecino Ajeno", "573009990001");

  const pedir = async (emp, cont, tipo, unidades, dicho) => (await svc("POST", "/rest/v1/saldo_solicitudes",
    { company_id: emp, contact_id: cont, tipo, unidades, dicho, estado: "pendiente" })).data[0].id;
  const miSol = await pedir(mia, ana, "recarga", 10, "dice que consignó ayer al Nequi");
  const solVecina = await pedir(vecina, vec, "recarga", 99, "la del vecino");

  const email = "zz-rec-" + sello + "@toqueflow.com";
  const pass = "Zr" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    console.log("Con sesión de miembro, que es lo que tiene el negocio:\n");
    console.log("Lo suyo:");

    const pend = await rest("GET", "/rest/v1/saldo_pendientes?select=*");
    const filas = pend.data || [];
    check(pend.ok && filas.length === 1 && filas[0].persona === "Ana Alumna",
      "ve la recarga que tiene por aprobar", "HTTP " + pend.status + " " + JSON.stringify(filas).slice(0, 160));

    // Sin esto la pantalla no puede decidir: aprobar una recarga sin ver el
    // saldo de hoy es como se duplica una que ya se aprobó por WhatsApp.
    check(filas[0] && filas[0].saldo_actual !== undefined && filas[0].dicho,
      "y con el contexto para decidir: lo que dijo y cuánto tiene hoy",
      JSON.stringify(filas[0]).slice(0, 200));

    // ── Lo del vecino ──────────────────────────────────────────────────────
    console.log("\nLo del vecino:");
    check(!filas.some((f) => f.persona === "Vecino Ajeno"),
      "no ve las suyas", JSON.stringify(filas.map((f) => f.persona)));

    const colar = await rpc("tf_saldo_resolver", { p_solicitud: solVecina, p_aprobar: true, p_nota: "colada" });
    const trasVecina = (await svc("GET", "/rest/v1/saldo_solicitudes?select=estado&id=eq." + solVecina)).data[0];
    check(trasVecina.estado === "pendiente",
      "NO puede aprobarle una — eso le regalaría saldo a un cliente del vecino",
      "quedó en «" + trasVecina.estado + "» · respuesta " + JSON.stringify(colar.data).slice(0, 120));

    // ── Aprobar la suya suma de verdad ─────────────────────────────────────
    console.log("\nAprobar la suya:");
    const antes = (await svc("GET", "/rest/v1/contact_saldo?select=unidades&contact_id=eq." + ana)).data;
    const saldoAntes = (antes && antes[0] && antes[0].unidades) || 0;

    const ok = await rpc("tf_saldo_resolver", { p_solicitud: miSol, p_aprobar: true, p_nota: "verificado en el banco" });
    check(ok.ok && ok.data && ok.data.ok !== false, "la aprueba", JSON.stringify(ok.data).slice(0, 160));

    const despues = (await svc("GET", "/rest/v1/contact_saldo?select=unidades&contact_id=eq." + ana)).data;
    const saldoDespues = (despues && despues[0] && despues[0].unidades) || 0;
    check(saldoDespues === saldoAntes + 10,
      "y el saldo SUBE de verdad, no solo cambia de estado",
      "antes " + saldoAntes + ", después " + saldoDespues);

    const yaNo = await rest("GET", "/rest/v1/saldo_pendientes?select=id");
    check((yaNo.data || []).length === 0, "y deja de aparecer como pendiente",
      JSON.stringify(yaNo.data).slice(0, 120));

    // Aprobar dos veces la misma es como alguien se queda con el doble.
    const otraVez = await rpc("tf_saldo_resolver", { p_solicitud: miSol, p_aprobar: true, p_nota: "otra vez" });
    const saldoFinal = ((await svc("GET", "/rest/v1/contact_saldo?select=unidades&contact_id=eq." + ana)).data[0] || {}).unidades;
    check(saldoFinal === saldoDespues,
      "y aprobarla dos veces no suma dos veces",
      "quedó en " + saldoFinal + " · respuesta " + JSON.stringify(otraVez.data).slice(0, 120));

    // ── Y que la pantalla exista de verdad ─────────────────────────────────
    console.log("\nY la pantalla:");
    const html = fs.readFileSync(path.join(PLAT, "site", "pedidos.html"), "utf8");
    check(/saldo_pendientes/.test(html), "pedidos.html lee las recargas por aprobar",
      "la función existe en la base y no la llama nadie — que era el problema");
    check(/tf_saldo_resolver/.test(html), "y las resuelve desde ahí", "no llama a tf_saldo_resolver");

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Aprueba las suyas, el saldo sube, y no toca las del vecino.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
