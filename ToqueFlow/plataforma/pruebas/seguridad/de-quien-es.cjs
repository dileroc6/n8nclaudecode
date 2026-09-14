// ============================================================================
// De quién es esta empresa — y qué pasa cuando la respuesta es «no se sabe»
// ----------------------------------------------------------------------------
// Varias funciones son SECURITY DEFINER y reciben el `company_id` como
// PARÁMETRO. Cada una comprueba de quién es la empresa antes de mirar nada, y
// esa comprobación estaba copiada en cada función con dos errores que se
// tapaban entre sí:
//
//   1. `current_user = 'n8n_worker'` dentro de una SECURITY DEFINER nunca es
//      cierto: ahí `current_user` es el dueño de la función, no quien llamó.
//   2. Cuando nada casaba el resultado no era `false` sino NULL — y
//      `if not NULL then return; end if;` NO SE EJECUTA.
//
// O sea que quien no casaba con nada **pasaba**. Esta prueba monta el caso
// exacto: una sesión autenticada SIN perfil, que es la que daba NULL.
//
//   node pruebas/seguridad/de-quien-es.cjs
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
const rpc = async (fn, args) => {
  const r = await fetch(URL + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json", Authorization: "Bearer " + token },
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
  const slug = "zz-dqe-" + sello;
  await svc("POST", "/rest/v1/companies", { name: "ZZ De quién es", slug, status: "active" });
  const emp = (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0].id;

  await svc("POST", "/rest/v1/contacts",
    { company_id: emp, phone: "573001112222", full_name: "Paciente ajeno", status: "prospecto" });

  // Una sesión autenticada SIN perfil. No es un caso rebuscado: un usuario que
  // se dio de alta y al que todavía nadie le asignó empresa está exactamente
  // así, y es el que devolvía NULL.
  const email = "zz-dqe-" + sello + "@toqueflow.com";
  const pass = "Zd" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("DELETE", "/rest/v1/profiles?id=eq." + uid);

  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    console.log("Sesión autenticada SIN perfil, mandando el id de una empresa ajena:\n");

    const mia = await rpc("tf_es_mia", { p_company: emp });
    check(mia.data === false,
      "«¿es tuya?» contesta que NO, y no «no sé»",
      "devolvió " + JSON.stringify(mia.data) + " — un NULL no dispara el «if not ...» y deja pasar");

    const dest = await rpc("tf_campana_destinatarios",
      { p_company: emp, p_filtros: { status: ["prospecto"] }, p_cantidad: null });
    check((dest.data || []).length === 0,
      "no le entrega la lista de contactos de esa empresa",
      JSON.stringify(dest.data).slice(0, 200));

    const marcar = await rpc("tf_citas_por_marcar", { p_company: emp, p_dias: 30 });
    check((marcar.data || []).length === 0,
      "ni las citas que tiene por marcar", JSON.stringify(marcar.data).slice(0, 200));

    const huecos = await rpc("tf_huecos_pronto", { p_company: emp, p_dias: 3, p_servicio: null });
    check(huecos.data && huecos.data.ok === false,
      "ni los huecos de su agenda", JSON.stringify(huecos.data).slice(0, 200));

    const zona = await rpc("tf_zona_guardar", { p_company: emp, p_zona: "Europe/Madrid" });
    check(zona.data && zona.data.ok === false,
      "y no puede cambiarle la zona horaria", JSON.stringify(zona.data).slice(0, 200));

    const dueno = (await svc("GET", "/rest/v1/companies?select=metadata&id=eq." + emp)).data[0];
    check(!(dueno.metadata || {}).zona_horaria,
      "la empresa quedó como estaba", JSON.stringify(dueno.metadata));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + emp);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Sin perfil no se pasa. La respuesta es «no», nunca «no sé».");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
