// ============================================================================
// ¿Puede un cliente ver los datos de otro?
// ----------------------------------------------------------------------------
// `aislamiento-rls.cjs` prueba al desconocido: alguien sin sesión. Esto prueba
// al VECINO, que es el caso realista — dos pymes en la misma plataforma, las
// dos con usuario válido.
//
// Monta dos empresas de verdad, cada una con su agente y su conocimiento, crea
// un usuario miembro de la primera, y comprueba que no alcance NADA de la
// segunda. Al terminar borra todo.
//
//   node pruebas/aislamiento-entre-clientes.cjs
//
// Existe porque el 27-ago-2026 dos vistas entregaban la configuración y el
// conocimiento completos de cualquier empresa. Se arregló, pero la prueba que
// lo habría detectado no existía — y con un solo cliente en la plataforma,
// nadie la habría echado de menos hasta que fuera tarde.
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

// Con el rol de servicio solo se MONTA el escenario. Nunca se comprueba con él:
// ve todo por diseño y por tanto no probaría nada.
const svc = async (metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + ruta, {
    method: metodo,
    headers: Object.assign(
      { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
      extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

(async () => {
  if (!URL || !ANON || !SERVICE) { console.error("faltan credenciales"); process.exit(2); }

  const sello = Date.now().toString(36);
  const crearEmpresa = async (nombre) => {
    const r = await svc("POST", "/rest/v1/companies",
      { name: nombre, slug: nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello, status: "active" },
      { Prefer: "return=representation" });
    if (!r.ok) { console.error("no pude crear " + nombre + ": " + JSON.stringify(r.data).slice(0, 200)); process.exit(2); }
    return r.data[0];
  };

  console.log("Montando dos empresas, cada una con su agente y su conocimiento…\n");
  const A = await crearEmpresa("ZZ Aislamiento A");
  const B = await crearEmpresa("ZZ Aislamiento B");
  let uid = null;

  const limpiar = async () => {
    if (uid) await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + A.id);
    await svc("DELETE", "/rest/v1/companies?id=eq." + B.id);
  };

  let fugas = 0;
  try {
    for (const [co, tono, secreto] of [
      [A, "Tono de A", "Plan de A: $11.111 al mes."],
      [B, "Tono de B", "SECRETO DE B: el plan vale $22.222 y el margen es del 60%."],
    ]) {
      await svc("POST", "/rest/v1/agent_config", {
        company_id: co.id, activo: false,
        whatsapp_instance: "zz-" + co.id.slice(0, 8),
        identidad: { negocio: co.name, tono },
      });
      await svc("POST", "/rest/v1/agent_knowledge", {
        company_id: co.id, tipo: "manual", titulo: "Precios",
        contenido: secreto, activo: true, orden: 1,
      });
    }

    // Un usuario MIEMBRO de A. No super admin: un cliente cualquiera.
    const email = "zz-vecino-" + sello + "@toqueflow.com";
    const pass = "Zz" + Math.random().toString(36).slice(2) + "!Aa9";
    const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
    if (!u.ok || !u.data.id) { console.error("no pude crear el usuario: " + JSON.stringify(u.data).slice(0, 200)); process.exit(2); }
    uid = u.data.id;
    await svc("PATCH", "/rest/v1/profiles?id=eq." + uid,
      { role: "member", status: "active", company_id: A.id, full_name: "Vecino de prueba" });

    const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    })).json();
    if (!ses.access_token) { console.error("no pude iniciar sesión: " + JSON.stringify(ses).slice(0, 200)); process.exit(2); }

    const comoVecino = async (ruta) => {
      const r = await fetch(URL + "/rest/v1/" + ruta, {
        headers: { apikey: ANON, Authorization: "Bearer " + ses.access_token },
      });
      const j = await r.json().catch(() => null);
      return Array.isArray(j) ? j : [];
    };

    console.log("Consultando como un usuario de la empresa A:\n");
    const pruebas = [
      ["agent_runtime?select=*",          "la configuración de otras empresas"],
      ["agent_knowledge_prompt?select=*", "el conocimiento de otras empresas"],
      ["agent_config?select=*",           "la tabla de configuración"],
      ["agent_knowledge?select=*",        "los documentos de otras empresas"],
      ["companies?select=*",              "otras empresas"],
      ["contacts?select=*",               "contactos de otras empresas"],
      ["ai_usage?select=*",               "el consumo de otras empresas"],
      ["message_log?select=*",            "las conversaciones de otras empresas"],
    ];

    for (const [ruta, que] of pruebas) {
      const filas = await comoVecino(ruta);
      // `companies` se identifica por `id`; el resto por `company_id`.
      const ajenas = filas.filter((f) => (f.company_id || f.id) !== A.id);
      const ok = ajenas.length === 0;
      if (!ok) fugas++;
      console.log("  " + (ok ? "✅" : "🚨") + " no ve " + que.padEnd(40) +
                  filas.length + " filas · " + ajenas.length + " ajenas");
      if (!ok) console.log("       ↳ " + JSON.stringify(ajenas[0]).replace(/\s+/g, " ").slice(0, 180) + "…");
    }
  } finally {
    await limpiar();
  }

  if (fugas) {
    console.log("\n🚨 " + fugas + " consulta(s) dejan que un cliente vea a otro.");
    console.log("Si el objeto es una vista, le falta `security_invoker = on`.");
    console.log("Si es una tabla, revisar sus políticas de RLS.");
    process.exitCode = 1;
  } else {
    console.log("\n✅ Un cliente autenticado solo ve lo suyo.");
  }
})().catch(e => { console.error("ERROR " + e.message); process.exit(2); });
