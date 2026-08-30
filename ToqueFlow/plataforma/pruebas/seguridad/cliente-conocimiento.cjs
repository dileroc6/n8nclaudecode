// ============================================================================
// El cliente edita lo que su asistente sabe — y solo lo suyo
// ----------------------------------------------------------------------------
// Va en seguridad/ por lo mismo que la del tono: lo que hay que comprobar no
// es que se guarde, sino que **la puerta sea del tamaño correcto**.
//
// Aquí el riesgo es distinto y peor que en el tono: el conocimiento es lo que
// el agente le RESPONDE a la gente. Quien pueda escribir en el documento de
// otra empresa decide lo que el agente de esa empresa le dice a sus clientes —
// precios incluidos.
//
// Con sesión de MIEMBRO, que es lo que tiene el cliente.
//
//   node pruebas/seguridad/cliente-conocimiento.cjs
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
  const mia = await crear("ZZ Saber Mia");
  const vecina = await crear("ZZ Saber Vecina");

  await svc("POST", "/rest/v1/agent_knowledge", {
    company_id: vecina.id, tipo: "manual", origen: "prueba",
    titulo: "Precios del vecino", contenido: "La membresía del vecino vale 200.000 al mes.", activo: true,
  });
  const delVecino = (await svc("GET", "/rest/v1/agent_knowledge?select=id&company_id=eq." + vecina.id)).data[0];

  const email = "zz-saber-" + sello + "@toqueflow.com";
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

    // ── Lo que SÍ puede ──────────────────────────────────────────────────────
    const nuevo = await rest("POST", "agent_knowledge", {
      company_id: mia.id, tipo: "manual", origen: "portal",
      titulo: "Precios", contenido: "El plan mensual vale 79.900. El anual, 799.000.", activo: true,
    });
    check(nuevo.ok, "escribe un documento nuevo", "HTTP " + nuevo.status + " " + JSON.stringify(nuevo.data).slice(0, 140));
    const id = (nuevo.data || [])[0] && nuevo.data[0].id;

    const bytes = (await svc("GET", "/rest/v1/agent_knowledge?select=bytes&id=eq." + id)).data[0];
    check(bytes && bytes.bytes > 0, "el tamaño se calcula solo — el medidor no depende de que nadie lo ponga",
      JSON.stringify(bytes));

    const edit = await rest("PATCH", "agent_knowledge?id=eq." + id, { contenido: "El plan mensual vale 89.900." });
    check(edit.ok, "corrige un precio", "HTTP " + edit.status);

    const apagar = await rest("PATCH", "agent_knowledge?id=eq." + id, { activo: false });
    check(apagar.ok, "apaga un documento sin borrarlo — una promoción vieja se vuelve a encender", "HTTP " + apagar.status);

    const borrar = await rest("DELETE", "agent_knowledge?id=eq." + id);
    const quedo = await svc("GET", "/rest/v1/agent_knowledge?select=id&id=eq." + id);
    check(borrar.ok && (quedo.data || []).length === 0, "y lo borra si quiere", "HTTP " + borrar.status);

    // ── Lo que NO puede ──────────────────────────────────────────────────────
    console.log("\nY lo que no debe poder:");

    const ve = await rest("GET", "agent_knowledge?select=company_id,titulo");
    const ajenos = (ve.data || []).filter((x) => x.company_id !== mia.id);
    check(ajenos.length === 0, "no ve el conocimiento de otra empresa", JSON.stringify(ajenos));

    // El riesgo de verdad: escribir en el documento de otro es decidir lo que
    // el agente de otro le responde a SUS clientes.
    const colar = await rest("POST", "agent_knowledge", {
      company_id: vecina.id, tipo: "manual", origen: "portal",
      titulo: "Colado", contenido: "Todo gratis.", activo: true,
    });
    check(!colar.ok, "NO puede escribir en el conocimiento de otra empresa", "lo dejó: HTTP " + colar.status);

    const pisar = await rest("PATCH", "agent_knowledge?id=eq." + delVecino.id, { contenido: "Ahora vale 1 peso." });
    const vecinoAhora = (await svc("GET", "/rest/v1/agent_knowledge?select=contenido&id=eq." + delVecino.id)).data[0];
    check(/200\.000/.test(vecinoAhora.contenido),
      "NO puede cambiarle los precios al agente de otra empresa",
      "quedó: " + vecinoAhora.contenido + " (HTTP " + pisar.status + ")");

    const borrarAjeno = await rest("DELETE", "agent_knowledge?id=eq." + delVecino.id);
    const sigue = await svc("GET", "/rest/v1/agent_knowledge?select=id&id=eq." + delVecino.id);
    check((sigue.data || []).length === 1, "NO puede borrarle el conocimiento a otra empresa",
      "HTTP " + borrarAjeno.status);

    // Meter una fila con el company_id de otro es el intento obvio.
    const suplantar = await rest("POST", "agent_knowledge", {
      company_id: vecina.id, tipo: "manual", origen: "portal", titulo: "x", contenido: "y", activo: true,
    });
    const cuantos = (await svc("GET", "/rest/v1/agent_knowledge?select=id&company_id=eq." + vecina.id)).data;
    check(cuantos.length === 1, "ni pasándole el company_id ajeno en la fila", cuantos.length + " filas (HTTP " + suplantar.status + ")");

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina.id);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s): " + fallos.join(" · ")
    : "✅ El cliente maneja lo que su asistente sabe, y solo lo suyo.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
