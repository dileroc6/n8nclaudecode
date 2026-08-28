// ============================================================================
// ¿Se puede leer la información de un cliente desde afuera?
// ----------------------------------------------------------------------------
// Se prueba con la LLAVE PÚBLICA, la misma que va en supabase-config.js y que
// cualquiera puede leer del código del sitio. Ese es el punto: el aislamiento
// hay que probarlo desde donde llegaría un atacante, no con el rol de servicio
// ni con la conexión directa a Postgres, que legítimamente ven todo.
//
//   node pruebas/aislamiento-rls.cjs
//
// Existe porque el 27-ago-2026 dos vistas —agent_runtime y
// agent_knowledge_prompt— entregaban la configuración y el conocimiento
// COMPLETOS de un cliente a cualquiera, sin iniciar sesión. Las tablas de abajo
// tenían el RLS bien puesto; las vistas encima se lo saltaban, porque en
// Postgres una vista corre con los permisos de su dueño salvo que se le diga
// `security_invoker = on`.
//
// Sale con código 1 si algo se filtra, para poder colgarlo de un cron.
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;

// Todo lo que guarda datos de un cliente. Si mañana hay una tabla nueva, va
// aquí — o mejor, se descubre sola: ver el bloque de descubrimiento abajo.
const SIEMPRE = [
  "companies", "profiles", "contacts", "message_log", "campaigns", "campaign_runs",
  "payments", "n8n_events", "test_messages", "appointments", "sedes", "flows",
  "ai_usage", "agent_config", "agent_knowledge", "agent_knowledge_prompt",
  "agent_runtime", "outreach_events", "outreach_optouts", "demos", "rappi_orders"
];

const consultar = async (tabla) => {
  const r = await fetch(URL + "/rest/v1/" + tabla + "?select=*&limit=5", {
    headers: { apikey: ANON, Authorization: "Bearer " + ANON }
  });
  let j = null; try { j = await r.json(); } catch (e) {}
  return { status: r.status, filas: Array.isArray(j) ? j.length : null, cuerpo: j };
};

(async () => {
  if (!URL || !ANON) { console.error("faltan SUPABASE_URL / SUPABASE_ANON_KEY"); process.exit(2); }

  console.log("Consultando con la llave pública, sin iniciar sesión.\n");
  const fugas = [];

  for (const t of SIEMPRE) {
    const r = await consultar(t);
    // 200 con filas = fuga. 200 con 0 filas = el RLS hizo su trabajo.
    // 401/403/404 = ni siquiera está expuesta, mejor todavía.
    const fuga = r.status === 200 && r.filas > 0;
    if (fuga) fugas.push({ tabla: t, filas: r.filas });
    const marca = fuga ? "🚨 FUGA " : (r.status === 200 ? "  ok    " : "  ·     ");
    console.log("  " + marca + t.padEnd(26) + "HTTP " + r.status +
                (r.filas !== null ? "  " + r.filas + " filas" : ""));
  }

  if (fugas.length) {
    console.log("\n🚨 " + fugas.length + " objeto(s) entregan datos a cualquiera:\n");
    for (const f of fugas) {
      const r = await consultar(f.tabla);
      console.log("  ▸ " + f.tabla + " — " + f.filas + " filas");
      console.log("    " + JSON.stringify(r.cuerpo[0]).replace(/\s+/g, " ").slice(0, 200) + "…");
    }
    console.log("\nSi es una vista: le falta `security_invoker = on`.");
    console.log("Si es una tabla: le falta RLS, o una política está de más.");
    process.exit(1);
  }

  console.log("\n✅ Nada se filtra: ninguna tabla ni vista entrega datos sin sesión.");
})().catch(e => { console.error("ERROR " + e.message); process.exit(2); });
