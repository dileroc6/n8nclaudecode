// ============================================================================
// ¿Puede un cliente manejar su propia base de contactos?
// ----------------------------------------------------------------------------
// Con sesión de MIEMBRO, no de admin: es lo que de verdad tiene el cliente.
// Comprueba las cuatro cosas que pidió Diego —agregar uno, agregar muchos,
// editar y borrar— y la que más importa: que solo pueda tocar los suyos.
//
//   node pruebas/cliente-contactos.cjs
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
    headers: Object.assign({ apikey: ANON, Authorization: "Bearer " + token, "Content-Type": "application/json" }, extra || {}),
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
  // Dos empresas: la del cliente y una vecina, para comprobar el aislamiento.
  const crear = async (n) => (await svc("POST", "/rest/v1/companies",
    { name: n, slug: n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello, status: "active" })).ok
    && (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello)).data[0];
  const mia = await crear("ZZ Contactos Mia");
  const vecina = await crear("ZZ Contactos Vecina");
  await svc("POST", "/rest/v1/contacts", { company_id: vecina.id, phone: "573009998888", full_name: "Contacto del vecino" });

  const email = "zz-cli-" + sello + "@toqueflow.com";
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

    // ── Uno por uno ──────────────────────────────────────────────────────────
    const uno = await rest("POST", "contacts",
      { company_id: mia.id, phone: "573001110001", full_name: "Ana Uno", email: "ana@x.com", status: "prospecto" },
      { Prefer: "return=representation" });
    check(uno.ok, "agrega un contacto", "HTTP " + uno.status + " " + JSON.stringify(uno.data).slice(0, 160));
    const id = (uno.data || [])[0] && uno.data[0].id;

    const edit = await rest("PATCH", "contacts?id=eq." + id, { full_name: "Ana Editada", lead_stage: "caliente" });
    check(edit.ok, "edita un contacto", "HTTP " + edit.status + " " + JSON.stringify(edit.data).slice(0, 160));

    // ── Masivo ───────────────────────────────────────────────────────────────
    const muchos = Array.from({ length: 25 }, (_, i) => ({
      company_id: mia.id, phone: "5730011200" + String(i).padStart(2, "0"),
      full_name: "Importado " + i, status: "prospecto",
    }));
    const imp = await rest("POST", "contacts", muchos, { Prefer: "return=representation" });
    check(imp.ok && (imp.data || []).length === 25, "importa 25 de una vez",
          "HTTP " + imp.status + " " + JSON.stringify(imp.data).slice(0, 160));

    // ── Borrar ───────────────────────────────────────────────────────────────
    const del = await rest("DELETE", "contacts?id=eq." + id);
    check(del.ok, "borra un contacto", "HTTP " + del.status);
    const quedo = await rest("GET", "contacts?select=id&id=eq." + id);
    check((quedo.data || []).length === 0, "y de verdad se fue", JSON.stringify(quedo.data));

    // ── Lo que NO puede ──────────────────────────────────────────────────────
    console.log("\nY lo que no debe poder:");
    const todos = await rest("GET", "contacts?select=company_id");
    const ajenos = (todos.data || []).filter((x) => x.company_id !== mia.id);
    check(ajenos.length === 0, "no ve los contactos de otra empresa", ajenos.length + " ajenos");

    const intruso = await rest("POST", "contacts",
      { company_id: vecina.id, phone: "573007770000", full_name: "Colado" }, { Prefer: "return=representation" });
    check(!intruso.ok, "no puede crear contactos en otra empresa", "lo dejó: HTTP " + intruso.status);

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina.id);
  }

  console.log("\n═══ " + (fallos.length ? fallos.length + " fallo(s)" : "Todo pasó") + " ═══");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
