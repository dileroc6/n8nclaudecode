// ============================================================================
// El margen de cada cliente, a la vista — y solo para quien debe verlo
// ----------------------------------------------------------------------------
// Tres funciones existían desde hacía semanas y no las llamaba nadie:
//
//   tf_consumo_alerta()    «las empresas cuya IA se está comiendo más del 20%
//                          de lo que pagan. Al 20% es una conversación de venta;
//                          al 40% es un problema». Había que abrir cliente por
//                          cliente para saberlo
//   tf_mensualidad_lista() lo que costaría al mes lo que un cliente tiene
//                          encendido, a precio de lista
//   tf_puede_encender()    su propio comentario decía «la usan la consola y el
//                          alta». No la llamaba nadie — la consola volvía a
//                          deducir la misma regla en JavaScript
//
// Lo que se prueba aquí no es que calculen bien, sino **quién puede verlo**.
// Estos números son de ToqueFlow, no de los clientes: cuánto paga cada uno y
// cuánto margen deja. Un cliente que pueda leer eso ve lo que pagan los demás.
//
//   node pruebas/seguridad/el-margen-a-la-vista.cjs
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
  return { ok: r.ok, status: r.status, texto: t, data: j };
};
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE,
                          "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, texto: t, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const slug = "zz-mar-" + sello;
  await svc("POST", "/rest/v1/companies", { name: "ZZ Margen " + sello, slug, status: "active" });
  const mia = (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0].id;

  const email = "zz-mar-" + sello + "@toqueflow.com";
  const pass = "Zm" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    // ── Lo que el cliente NO puede ver ─────────────────────────────────────
    console.log("Con sesión de miembro — esto es plata de ToqueFlow, no suya:\n");

    const al = await rest("POST", "/rest/v1/rpc/tf_consumo_alerta", {});
    check(!al.ok || (al.data || []).length === 0,
      "un cliente NO puede sacar la alerta de margen de todos",
      "HTTP " + al.status + " · " + al.texto.slice(0, 200));

    const plan = await rest("GET", "/rest/v1/consumo_vs_plan?select=empresa,mensualidad_cop");
    const ajenas = (plan.data || []).filter((x) => x.empresa && !x.empresa.includes(sello));
    check(ajenas.length === 0,
      "ni lo que pagan las demás empresas",
      "vio " + ajenas.length + ": " + JSON.stringify(ajenas.map((x) => x.empresa)).slice(0, 160));

    // ── Lo que sí ──────────────────────────────────────────────────────────
    console.log("\nY lo que sí:");
    const suyo = await rest("GET", "/rest/v1/empresa_catalogo?select=clave,encender&company_id=eq." + mia + "&limit=3");
    check(suyo.ok, "ve su propio catálogo", "HTTP " + suyo.status + " " + suyo.texto.slice(0, 140));
    check((suyo.data || []).every((x) => x.company_id === undefined || x.company_id === mia),
      "y solo el suyo", JSON.stringify((suyo.data || []).slice(0, 2)));

    const deOtro = await rest("GET", "/rest/v1/empresa_catalogo?select=empresa&limit=50");
    const otras = [...new Set((deOtro.data || []).map((x) => x.empresa))].filter((e) => e && !e.includes(sello));
    check(otras.length === 0,
      "la vista nueva no se convirtió en una puerta: no ve el catálogo de otros",
      "vio: " + JSON.stringify(otras).slice(0, 160));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia);
  }

  // ── Y que la consola de verdad las use ───────────────────────────────────
  console.log("\nY que la consola las use, que era el problema:");
  const admin = fs.readFileSync(path.join(PLAT, "site", "admin.jsx"), "utf8");
  check(/tf_consumo_alerta/.test(admin),
    "la consola llama a `tf_consumo_alerta`",
    "existía desde hacía semanas y no la llamaba nadie");
  check(/mensualidad_lista/.test(admin),
    "y enseña lo que costaría a precio de lista — cuando da $0 y el cliente paga, no es un descuento: es configuración vacía",
    "no usa mensualidad_lista");

  const emp = fs.readFileSync(path.join(PLAT, "site", "admin-empresa.jsx"), "utf8");
  check(/p\.encender/.test(emp),
    "y lee `encender` de la vista en vez de deducir la regla otra vez en JavaScript",
    "sigue deduciéndola: dos copias que el día que alguien cambie una dejan de coincidir");

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ El margen se ve en la consola, y ningún cliente ve lo que pagan los demás.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
