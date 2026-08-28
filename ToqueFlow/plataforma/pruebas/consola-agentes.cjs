// ============================================================================
// ¿Funciona la pestaña Agentes de la consola, de verdad?
// ----------------------------------------------------------------------------
// Corre EXACTAMENTE las consultas que hace la pantalla, con una sesión real de
// super admin y el RLS puesto — no con el rol de servicio, que ve todo y por
// tanto no prueba nada.
//
// Importa especialmente después del arreglo de `security_invoker`: ahora las
// vistas respetan al que pregunta, así que si las políticas del super admin no
// lo cubren, la consola se ve vacía y nadie sabría por qué.
//
// Crea una empresa de prueba, la configura, le carga conocimiento, comprueba el
// medidor y la borra. No toca ningún cliente real.
//
//   node pruebas/consola-agentes.cjs
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

// La prueba se crea su PROPIO super admin temporal y lo borra al final.
// Antes usaba el de credentials.env, pero esa contraseña quedó desactualizada —
// y de todas formas una prueba no debería depender de la cuenta real de nadie:
// si alguien la cambia, la prueba se cae por un motivo que no tiene que ver con
// lo que quiere probar.
const EMAIL = 'prueba-consola-' + Date.now().toString(36) + '@toqueflow.com';
const PASS = 'Pr' + Math.random().toString(36).slice(2) + '!Aa9';

let token = null;
const cab = () => ({
  apikey: ANON,
  Authorization: "Bearer " + (token || ANON),
  "Content-Type": "application/json",
});

const rest = async (metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + "/rest/v1/" + ruta, {
    method: metodo,
    headers: Object.assign(cab(), extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que + " — " + detalle);
};

(async () => {
  // ── Crear el super admin de prueba ────────────────────────────────────────
  const admin = async (metodo, ruta, cuerpo) => {
    const r = await fetch(URL + '/auth/v1/admin/' + ruta, {
      method: metodo,
      headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const t = await r.text();
    let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
    return { ok: r.ok, status: r.status, data: j };
  };

  const creado = await admin('POST', 'users', { email: EMAIL, password: PASS, email_confirm: true });
  if (!creado.ok || !creado.data || !creado.data.id) {
    console.error('No pude crear el usuario de prueba: ' + JSON.stringify(creado.data).slice(0, 250));
    process.exit(2);
  }
  const uid = creado.data.id;
  const borrarUsuario = async () => { await admin('DELETE', 'users/' + uid); };

  // El perfil lo crea un trigger; hay que ascenderlo a super_admin con el rol
  // de servicio, porque él todavía no puede ascenderse a sí mismo.
  await fetch(URL + '/rest/v1/profiles?id=eq.' + uid, {
    method: 'PATCH',
    headers: { apikey: SERVICE, Authorization: 'Bearer ' + SERVICE, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'super_admin', status: 'active', full_name: 'Prueba consola' }),
  });

  // ── Iniciar sesión como lo hace el navegador ──────────────────────────────
  const login = await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const sesion = await login.json();
  if (!sesion.access_token) { console.error("No pude iniciar sesión: " + JSON.stringify(sesion).slice(0, 200)); process.exit(2); }
  token = sesion.access_token;
  console.log("Sesión iniciada como " + EMAIL + "\n");

  console.log("── Lo que lee la pantalla al abrir ──");
  const rt = await rest("GET", "agent_runtime?select=*");
  check(rt.ok, "puede leer agent_runtime", "HTTP " + rt.status + " " + JSON.stringify(rt.data).slice(0, 120));
  check(Array.isArray(rt.data) && rt.data.length > 0,
        "ve los agentes que existen (el `security_invoker` no dejó ciego al admin)",
        "devolvió " + (Array.isArray(rt.data) ? rt.data.length : "?") + " filas");

  const co = await rest("GET", "companies?select=*");
  check(Array.isArray(co.data) && co.data.length > 0, "puede leer las empresas", "HTTP " + co.status);

  // ── Crear una empresa de prueba ───────────────────────────────────────────
  console.log("\n── El flujo completo, sobre una empresa de prueba ──");
  const nueva = await rest("POST", "companies",
    { name: "ZZ Prueba Consola", slug: "zz-prueba-consola-" + Date.now().toString(36), status: "active" },
    { Prefer: "return=representation" });
  const emp = Array.isArray(nueva.data) ? nueva.data[0] : nueva.data;
  check(!!(emp && emp.id), "crea una empresa", "HTTP " + nueva.status + " " + JSON.stringify(nueva.data).slice(0, 150));
  if (!emp || !emp.id) { process.exit(1); }

  const limpiar = async () => { await rest("DELETE", "companies?id=eq." + emp.id); };

  try {
    // ── Guardar la configuración, tal cual la manda el formulario ───────────
    const fila = {
      company_id: emp.id,
      activo: false,
      whatsapp_instance: "zz-prueba-" + Date.now().toString(36),
      identidad: { negocio: "ZZ Prueba", tono: "Cercano y breve." },
      captura: { campos: [{ clave: "nombre", etiqueta: "Su primer nombre", obligatorio: true }] },
      enrutamiento: { reglas: [{ si: "quiere comprar", accion: "notificar_humano", destino: "ventas" }] },
      limites: { nunca: ["Dar consejo médico."], escalar_si: ["se molesta"] },
      agenda: { modo: "ninguna" },
      actualizado_at: new Date().toISOString(),
    };
    const up = await rest("POST", "agent_config", fila,
      { Prefer: "return=representation" });
    check(up.ok, "guarda la configuración del agente", "HTTP " + up.status + " " + JSON.stringify(up.data).slice(0, 200));

    // Volver a guardar: el formulario hace upsert cada vez que se pulsa Guardar.
    // Aquí es donde reventaba el trigger de `actualizado_at`.
    // Antes esto era un upsert. Ya no: la empresa dejo de ser unica en
    // agent_config porque puede tener VARIOS agentes, asi que el segundo
    // guardado actualiza el agente creado en vez de chocar con el.
    const agenteId = (Array.isArray(up.data) ? up.data[0] : up.data).id;
    fila.identidad.tono = "Cercano, breve y con emojis suaves.";
    const up2 = await rest("PATCH", "agent_config?id=eq." + agenteId,
      { identidad: fila.identidad }, { Prefer: "return=representation" });
    check(up2.ok, "vuelve a guardar sobre lo ya guardado (el UPDATE no revienta)",
          "HTTP " + up2.status + " " + JSON.stringify(up2.data).slice(0, 200));

    // ── Cargar conocimiento ─────────────────────────────────────────────────
    const doc = await rest("POST", "agent_knowledge",
      { company_id: emp.id, tipo: "manual", titulo: "Precios", contenido: "Plan mensual: $100.000. Incluye todo.", activo: true, orden: 1 },
      { Prefer: "return=representation" });
    check(doc.ok, "carga un documento de conocimiento", "HTTP " + doc.status + " " + JSON.stringify(doc.data).slice(0, 200));
    const docId = (Array.isArray(doc.data) ? doc.data[0] : doc.data || {}).id;

    // ── El medidor ──────────────────────────────────────────────────────────
    const uso = await rest("GET", "agent_knowledge_prompt?select=*&company_id=eq." + emp.id);
    const u = Array.isArray(uso.data) ? uso.data[0] : null;
    check(!!u, "el medidor lee agent_knowledge_prompt", "HTTP " + uso.status + " " + JSON.stringify(uso.data).slice(0, 150));
    if (u) {
      check(u.bytes_total > 0 && u.bytes_limite === 40000 && typeof u.pct_usado === "number" && u.estado === "ok",
            "el medidor trae bytes, límite, porcentaje y estado",
            JSON.stringify({ b: u.bytes_total, l: u.bytes_limite, p: u.pct_usado, e: u.estado }));
    }

    // ── Desactivar y borrar, como los botones de la tarjeta ─────────────────
    if (docId) {
      const off = await rest("PATCH", "agent_knowledge?id=eq." + docId, { activo: false });
      check(off.ok, "desactiva un documento", "HTTP " + off.status);
      const del = await rest("DELETE", "agent_knowledge?id=eq." + docId);
      check(del.ok, "borra un documento", "HTTP " + del.status);
    }

    // ── La tarjeta de la pestaña ────────────────────────────────────────────
    const rt2 = await rest("GET", "agent_runtime?select=*&company_id=eq." + emp.id);
    const r2 = Array.isArray(rt2.data) ? rt2.data[0] : null;
    check(!!r2, "la empresa nueva aparece en la pestaña", "no salió en agent_runtime");
    if (r2) {
      check(r2.activo === false && r2.conocimiento_estado === "vacio",
            "la tarjeta la muestra apagada y sin conocimiento",
            JSON.stringify({ activo: r2.activo, estado: r2.conocimiento_estado }));
      check(obj(r2.identidad).tono === "Cercano, breve y con emojis suaves.",
            "la vista devuelve el último tono guardado", JSON.stringify(r2.identidad));
    }
  } finally {
    await limpiar();
    const queda = await rest("GET", "agent_config?select=company_id&company_id=eq." + emp.id);
    check(Array.isArray(queda.data) && queda.data.length === 0,
          "al borrar la empresa se lleva su agente (cascade)", JSON.stringify(queda.data));
  }

  console.log("\n═══ " + (fallos.length ? fallos.length + " fallo(s)" : "Todo pasó") + " ═══");
  for (const f of fallos) console.log("  · " + f);
  process.exit(fallos.length ? 1 : 0);
})().catch(e => { console.error("ERROR " + e.message); process.exit(2); });

function obj(v) { return (v && typeof v === "object" && !Array.isArray(v)) ? v : {}; }
