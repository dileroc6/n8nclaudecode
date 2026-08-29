// ============================================================================
// ¿Qué alcanza alguien que se registra solo?
// ----------------------------------------------------------------------------
// El registro del proyecto está abierto: cualquiera con la llave pública —que
// está en el HTML del portal— puede crearse una cuenta sin que nadie lo invite.
//
// Eso no es automáticamente un fallo: si el que entra no pertenece a ninguna
// empresa, RLS no le devuelve nada y da igual. Pero eso hay que COMPROBARLO,
// no suponerlo, porque toda la seguridad del portal descansa en la misma idea:
// «solo ves lo de tu empresa». Si hubiera una sola política que trate a un
// `company_id` nulo como comodín, un extraño lo veria todo.
//
// Esta prueba se registra de verdad, mira qué alcanza, y borra la cuenta.
//
//   node pruebas/auditoria-registro-abierto.cjs
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

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};
const svc = async (m, r, b) => {
  const x = await fetch(URL + r, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
    body: b ? JSON.stringify(b) : undefined,
  });
  const t = await x.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: x.ok, status: x.status, data: j };
};

(async () => {
  // ── Registrarse, como cualquiera ─────────────────────────────────────────
  const email = "zz-colado-" + sello + "@toqueflow.com";
  const pass = "Zc" + sello + "!Aa9";

  const alta = await fetch(URL + "/auth/v1/signup", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  });
  const cuenta = await alta.json();

  if (!alta.ok) {
    console.log("El registro está cerrado: HTTP " + alta.status + " " + JSON.stringify(cuenta).slice(0, 120));
    console.log("\n═══ Nada que revisar ═══");
    return;
  }

  console.log("Me registré desde fuera, sin invitación de nadie.\n");
  const uid = cuenta.user && cuenta.user.id;
  let token = cuenta.access_token;

  // Si hace falta confirmar el correo no hay sesión: se pide una con la llave
  // de servicio solo para poder MEDIR qué alcanzaría. Es lo que veria alguien
  // que sí confirmara su correo — cosa que puede hacer cualquiera.
  if (!token) {
    console.log("  (pide confirmar el correo; se confirma para medir qué alcanzaría después)");
    await svc("PUT", "/auth/v1/admin/users/" + uid, { email_confirm: true });
    const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    })).json();
    token = ses.access_token;
  }

  try {
    const como = async (ruta) => {
      const r = await fetch(URL + "/rest/v1/" + ruta, { headers: { apikey: ANON, Authorization: "Bearer " + token } });
      const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
      return { ok: r.ok, status: r.status, data: j };
    };

    // ── Qué perfil le quedó ────────────────────────────────────────────────
    const perfil = (await svc("GET", "/rest/v1/profiles?select=role,status,company_id&id=eq." + uid)).data[0] || {};
    console.log("  Su perfil quedó como: role=" + perfil.role + " · status=" + perfil.status +
                " · empresa=" + (perfil.company_id || "ninguna"));

    check(perfil.role !== "super_admin", "no nace como super admin", "role=" + perfil.role);
    check(!perfil.company_id, "no nace dentro de ninguna empresa", "company_id=" + perfil.company_id);
    check(perfil.status !== "active", "no nace activo — alguien tiene que aprobarlo",
          "status=" + perfil.status + " (entra al portal sin que nadie lo invite)");

    // ── Y qué alcanza de verdad ────────────────────────────────────────────
    console.log("\n  Lo que ve con esa sesión:");
    for (const [t, ruta] of [
      ["empresas", "companies?select=id,name"],
      ["contactos", "contacts?select=id"],
      ["conversaciones", "message_log?select=id"],
      ["campañas", "campaigns?select=id"],
      ["configuración de agentes", "agent_config?select=id"],
      ["conocimiento cargado", "agent_knowledge?select=id"],
      ["consumo de IA", "ai_usage?select=id"],
      ["perfiles de otros", "profiles?select=id,email"],
    ]) {
      const r = await como(ruta);
      const n = Array.isArray(r.data) ? r.data.length : 0;
      check(n === 0, "no ve " + t, n + " fila(s): " + JSON.stringify(r.data).slice(0, 100));
    }

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
  }

  console.log("\n" + "═".repeat(70));
  if (!fallos.length) {
    console.log("✅ Un colado no alcanza nada. El registro abierto no le sirve de puerta.");
    console.log("   (Aun así conviene cerrarlo: cada cuenta consume cupo y ensucia la lista.)");
  } else {
    console.log("❌ " + fallos.length + " cosa(s) que sí alcanza alguien que se registra solo:");
    fallos.forEach((f) => console.log("   · " + f));
  }
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
