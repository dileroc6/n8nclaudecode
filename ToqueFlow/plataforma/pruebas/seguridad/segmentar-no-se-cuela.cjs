// ============================================================================
// Segmentar no deja ver los contactos de otra empresa
// ----------------------------------------------------------------------------
// `tf_campana_destinatarios` tiene que ser SECURITY DEFINER —lee las bajas y
// las citas— y recibe el `company_id` como parámetro. Esa combinación es la
// forma exacta del agujero que ya apareció dos veces en este proyecto: una
// función con permisos elevados que se fía del parámetro.
//
// Aquí un cliente autenticado pasaría el id de otra empresa y recibiría su
// lista de contactos **con nombre y teléfono**. Se prueba desde afuera, con la
// llave pública y una sesión de miembro, que es por donde llegaría.
//
//   node pruebas/seguridad/segmentar-no-se-cuela.cjs
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
const rpc = async (fn, args, conSesion) => {
  const r = await fetch(URL + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json",
               Authorization: "Bearer " + (conSesion === false ? ANON : token) },
    body: JSON.stringify(args),
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
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
  const mia = await crear("ZZ Seg Mia");
  const vecina = await crear("ZZ Seg Vecina");

  await svc("POST", "/rest/v1/contacts",
    { company_id: mia.id, phone: "573001110001", full_name: "Cliente mío", status: "prospecto" });
  await svc("POST", "/rest/v1/contacts",
    { company_id: vecina.id, phone: "573009990001", full_name: "Cliente del vecino", status: "prospecto" });

  const email = "zz-seg-" + sello + "@toqueflow.com";
  const pass = "Zs" + sello + "!Aa9";
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

    const mios = await rpc("tf_campana_destinatarios",
      { p_company: mia.id, p_filtros: { status: ["prospecto"] }, p_cantidad: null });
    check(mios.ok && (mios.data || []).length === 1 && mios.data[0].full_name === "Cliente mío",
      "ve a los suyos", JSON.stringify(mios.data).slice(0, 160));

    // El intento obvio: pasar el id del vecino.
    const ajenos = await rpc("tf_campana_destinatarios",
      { p_company: vecina.id, p_filtros: { status: ["prospecto"] }, p_cantidad: null });
    check((ajenos.data || []).length === 0,
      "NO ve los de otra empresa aunque le pase su company_id",
      JSON.stringify(ajenos.data).slice(0, 200));

    // Y sin sesión, nadie.
    const anon = await rpc("tf_campana_destinatarios",
      { p_company: mia.id, p_filtros: { status: ["prospecto"] }, p_cantidad: null }, false);
    check(!anon.ok || (anon.data || []).length === 0,
      "y sin ninguna sesión tampoco", "HTTP " + anon.status + " " + JSON.stringify(anon.data).slice(0, 160));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina.id);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s): " + fallos.join(" · ")
    : "✅ Segmentar respeta de quién es cada contacto.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
