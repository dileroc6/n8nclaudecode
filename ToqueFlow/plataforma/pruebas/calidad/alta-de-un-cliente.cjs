// ============================================================================
// Dar de alta un cliente, de punta a punta, y cronometrarlo
// ----------------------------------------------------------------------------
// Todo el plan comercial se apoya en un número: **11 a 14 horas por cliente**.
// Nadie lo ha medido. Esta prueba recorre el camino completo —de «el cliente
// firma» a «el asistente contesta bien y agenda»— haciendo exactamente las
// mismas llamadas que hacen la consola y el portal, con sesiones de verdad.
//
// LO QUE MIDE Y LO QUE NO
//
// No mide cuánto tarda una persona en teclear: mide **cuántos actos distintos
// hacen falta y si alguno necesita entrar a la base a mano.** Eso es lo que
// decide si el producto es estándar. Un paso que exige `service_role` no lo
// puede dar Ferney ni el cliente: lo tiene que dar Diego, y ahí se van las
// horas que el plan dice que no se van.
//
// Por eso la regla de esta prueba: **todo con sesión de persona.** La llave de
// servicio solo se usa para limpiar al final.
//
//   node pruebas/calidad/alta-de-un-cliente.cjs
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

// ── Quién hace cada cosa ────────────────────────────────────────────────────
const sesion = async (email, pass) => {
  const r = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  return r.access_token || null;
};
const como = (tok) => async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m,
    headers: { apikey: ANON, Authorization: "Bearer " + tok, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

const fallos = [];
const pasos = [];
let t0 = Date.now();
const paso = (quien, que, ok, detalle) => {
  const seg = (Date.now() - t0) / 1000; t0 = Date.now();
  pasos.push({ quien, que, ok, seg });
  console.log("  " + (ok ? "✅" : "❌") + " " + quien.padEnd(10) + que.padEnd(52) +
    seg.toFixed(1) + "s" + (ok ? "" : "\n       ← " + detalle));
  if (!ok) fallos.push(que);
};
const check = (cond, que, detalle) => {
  console.log("     " + (cond ? "✅ " : "❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

const slugDe = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// La prueba se crea SU PROPIO super admin y lo borra al terminar.
//
// No usa el de `credentials.env` a propósito: esa contraseña puede cambiar —de
// hecho cambió— y una prueba que se cae porque alguien rotó una clave no está
// midiendo lo que dice medir. Y tampoco puede quedarse viva: aquí llegaron a
// haber 23 super admins de prueba, que es una puerta abierta por cada uno.
let admUid = null;
const nacerSuperAdmin = async () => {
  const email = "zz-alta-adm-" + sello + "@toqueflow.com";
  const pass = "Zs" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  admUid = u.data && u.data.id;
  if (!admUid) { console.error("  no se creó el usuario: HTTP " + u.status + " " + JSON.stringify(u.data).slice(0, 200)); return null; }
  await svc("PATCH", "/rest/v1/profiles?id=eq." + admUid, { role: "super_admin", status: "active" });
  return await sesion(email, pass);
};

(async () => {
  const admTok = await nacerSuperAdmin();
  if (!admTok) { console.error("No pude montar el super admin de prueba."); process.exit(2); }
  const adm = como(admTok);

  const nombre = "ZZ Clinica Nueva " + sello;
  const slug = slugDe(nombre);
  const correo = "zz-alta-" + sello + "@toqueflow.com";
  let empresa = null, usuario = null, cliTok = null, cli = null, agente = null;

  const arranque = Date.now();

  try {
    // ══ LO QUE HACE LA CONSOLA ═════════════════════════════════════════════
    console.log("\n── La consola de ToqueFlow (super admin) ──\n");
    t0 = Date.now();

    const cat = (await adm("GET", "/rest/v1/catalogo?select=*&activo=eq.true&order=orden")).data || [];
    paso("consola", "lee el catálogo", cat.length > 0, "vino vacío");

    const e = await adm("POST", "/rest/v1/companies",
      { name: nombre, city: "Madrid", slug, status: "active", metadata: { zona_horaria: "Europe/Madrid" } });
    empresa = (e.data || [])[0];
    paso("consola", "crea la empresa (con su zona horaria)", !!empresa, "HTTP " + e.status + " " + JSON.stringify(e.data).slice(0, 120));
    if (!empresa) throw new Error("sin empresa no hay nada que medir");

    // El usuario va por la edge function porque necesita service_role, y ahí es
    // donde se comprueba que quien lo pide sea super admin. Que la consola no
    // tenga la llave de servicio es la razón de que exista.
    const r = await fetch(URL + "/functions/v1/admin-users", {
      method: "POST",
      headers: { Authorization: "Bearer " + admTok, apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", email: correo, full_name: "Dueña de la clínica", company_id: empresa.id, role: "member" }),
    });
    const body = await r.json().catch(() => ({}));
    usuario = body.user || body;
    paso("consola", "crea el usuario del cliente", r.ok && !body.error, JSON.stringify(body).slice(0, 160));
    check(!!body.link,
      "y le devuelve el enlace para que entre y ponga su clave",
      "sin enlace hay que generarlo aparte, o dictarle una contraseña temporal — " +
      "que es como quedan dos sin cambiar en el tablero");

    // Lo que contrata: el agente + la agenda + rescata.
    const elegidas = { "agente-atencion": true, "paquete-agenda": true, "paquete-rescata": true };
    const conPlataforma = { ...elegidas };
    for (const c of cat) {
      if (c.vendible || c.tipo !== "producto") continue;
      if (c.requiere && !elegidas[c.requiere]) continue;
      conPlataforma[c.clave] = true;
    }
    const filas = cat.filter((c) => conPlataforma[c.clave]).map((c) => ({
      company_id: empresa.id, catalogo_id: c.id, name: c.nombre,
      description: c.beneficio || c.descripcion,
      status: "próximamente", type: c.tipo, kind: c.clave, tool_url: c.tool_url || null,
    }));
    const fl = await adm("POST", "/rest/v1/flows", filas);
    paso("consola", "le deja sus " + filas.length + " tarjetas en el panel", fl.ok, "HTTP " + fl.status);

    // ── El agente, tal como lo crea la consola hoy ─────────────────────────
    // Exactamente lo que calcula `admin-alta.jsx`. Si esto se copia mal, la
    // prueba mide un alta que no existe.
    const herramientas = Array.from(new Set([
      ...((cat.find((c) => c.clave === "agente-atencion") || {}).incluye || []),
      ...cat.filter((c) => elegidas[c.clave] && (c.tipo === "paquete" || c.tipo === "herramienta")).map((c) => c.clave),
    ]));
    const ac = await adm("POST", "/rest/v1/agent_config", {
      company_id: empresa.id, activo: false,
      whatsapp_instance: slug + "-sandbox",
      identidad: { negocio: "Clínica dental en Madrid", tono: "cercano y claro, sin tecnicismos" },
      captura: { campos: [{ clave: "nombre", etiqueta: "Su primer nombre", obligatorio: true }] },
      enrutamiento: { reglas: [{ si: "quiere comprar, agendar o pagar algo", accion: "notificar_humano", destino: "equipo" }] },
      limites: { nunca: [], escalar_si: ["se molesta o repite la misma queja"] },
      agenda: { modo: "ninguna" },
      herramientas,
    });
    agente = (ac.data || [])[0];
    paso("consola", "crea el agente, apagado", !!agente, "HTTP " + ac.status + " " + JSON.stringify(ac.data).slice(0, 120));

    // ── LO QUE DE VERDAD IMPORTA ──────────────────────────────────────────
    // El asistente sin herramientas no puede hacer NADA de lo que se le vendió.
    console.log("\n     ¿Con qué se queda el asistente?");
    check(herramientas.length > 0,
      "el alta le deja herramientas al agente",
      "le dejó CERO. El asistente puede hablar pero no agendar, ni consultar, ni escalar — " +
      "y el cliente pagó por la agenda. `herramientas` solo guarda piezas de tipo `herramienta`, " +
      "y el asistente del alta solo ofrece PAQUETES, así que la lista sale siempre vacía");

    const piezas = await adm("POST", "/rest/v1/rpc/tf_piezas_del_agente", { p_claves: herramientas });
    check((piezas.data || []).length > 0,
      "y al expandirlas hay piezas de verdad", "expandió a " + JSON.stringify(piezas.data));

    // ══ LO QUE HACE EL CLIENTE, DESDE SU PORTAL ════════════════════════════
    console.log("\n── El cliente, desde su portal ──\n");
    t0 = Date.now();

    // El cliente entra por el enlace que devolvió el alta. Aquí no se puede
    // navegar ese enlace, así que se le pone una clave para seguir midiendo —
    // pero lo que importa se comprueba arriba: que el enlace venga.
    await svc("PUT", "/auth/v1/admin/users/" + (usuario.id || usuario.user_id), { password: "Zn" + sello + "!Aa9" });
    cliTok = await sesion(correo, "Zn" + sello + "!Aa9");
    cli = como(cliTok);
    paso("cliente", "entra a su portal", !!cliTok, "no pudo iniciar sesión");
    if (!cliTok) throw new Error("sin sesión de cliente no se puede seguir");

    const cn = await cli("POST", "/rest/v1/agent_knowledge", {
      company_id: empresa.id, titulo: "Servicios y precios",
      contenido: "Hacemos limpieza dental por 60 euros, empastes por 90 y ortodoncia desde 2.500. " +
                 "Estamos en la calle Mayor 12, Madrid. No atendemos urgencias por la noche.",
      // Lo mismo que manda la pantalla de Ajustes al guardar.
      tipo: "manual", origen: "portal", activo: true,
    });
    paso("cliente", "carga lo que su asistente tiene que saber", cn.ok, "HTTP " + cn.status + " " + JSON.stringify(cn.data).slice(0, 140));

    const tono = await cli("POST", "/rest/v1/rpc/tf_agente_tono",
      { p_agent: agente.id, p_tono: "Cercano y claro. Trata de tú. Nada de tecnicismos." });
    paso("cliente", "ajusta cómo habla", tono.ok && tono.data && tono.data.ok !== false, JSON.stringify(tono.data).slice(0, 140));

    const campo = await cli("POST", "/rest/v1/contact_campos",
      { company_id: empresa.id, clave: "presupuesto_fecha", etiqueta: "Fecha del presupuesto", tipo: "fecha", orden: 10 });
    paso("cliente", "crea el dato propio que quiere guardar", campo.ok, "HTTP " + campo.status);

    // ── La agenda: lo que hasta el 17-sep no se podía ─────────────────────
    const franjas = [];
    for (let d = 1; d <= 5; d++) {
      franjas.push({ company_id: empresa.id, dia: d, desde: "09:00", hasta: "14:00", cupos: 1, activa: true });
      franjas.push({ company_id: empresa.id, dia: d, desde: "16:00", hasta: "20:00", cupos: 1, activa: true });
    }
    const fr = await cli("POST", "/rest/v1/agenda_franjas", franjas);
    paso("cliente", "pone sus horarios (5 días, con pausa al mediodía)", fr.ok, "HTTP " + fr.status + " " + JSON.stringify(fr.data).slice(0, 140));

    const sv = await cli("POST", "/rest/v1/agenda_servicios", [
      { company_id: empresa.id, nombre: "Limpieza dental", minutos: 45, ocupa: 1, activo: true, orden: 10 },
      { company_id: empresa.id, nombre: "Valoración", minutos: 30, ocupa: 1, activo: true, orden: 20 },
    ]);
    paso("cliente", "crea sus servicios", sv.ok, "HTTP " + sv.status);

    const bl = await cli("POST", "/rest/v1/agenda_bloqueos",
      { company_id: empresa.id, desde: "2026-12-24T00:00:00", hasta: "2026-12-26T23:59:59", motivo: "Navidad" });
    paso("cliente", "bloquea los días que cierra", bl.ok, "HTTP " + bl.status);

    const rc = await cli("POST", "/rest/v1/rpc/tf_agente_recordatorios",
      { p_agent: agente.id, p_horas_antes: 48, p_pedir_confirmacion: true, p_desde: "09:00", p_hasta: "20:00" });
    paso("cliente", "decide cuándo sale su recordatorio", rc.data && rc.data.ok === true, JSON.stringify(rc.data).slice(0, 140));

    const rs = await cli("POST", "/rest/v1/rpc/tf_rescate_config",
      { p_company: empresa.id, p_campo_fecha: "presupuesto_fecha", p_dias: 7 });
    paso("cliente", "dice dónde guarda la fecha de sus propuestas", rs.data && rs.data.ok === true, JSON.stringify(rs.data).slice(0, 140));

    // ── ¿Y con todo eso, funciona? ────────────────────────────────────────
    console.log("\n── ¿Y ya funciona? ──\n");
    t0 = Date.now();

    const libre = await cli("POST", "/rest/v1/rpc/tf_agenda_libre",
      { p_company: empresa.id, p_servicio: "Limpieza dental", p_dias: 7, p_desde: null });
    const huecos = (libre.data && libre.data.huecos) || [];
    paso("plataforma", "su agenda ya tiene horas que ofrecer", huecos.length > 0, JSON.stringify(libre.data).slice(0, 140));
    check(libre.data && libre.data.zona === "Europe/Madrid",
      "y las calcula en la hora de Madrid, no en la de Bogotá", JSON.stringify(libre.data && libre.data.zona));

    // En modo prueba, que es como se estrena un cliente: el agente nace
    // apagado justamente para probarlo antes de encenderlo.
    const ctx = await svc("POST", "/rest/v1/rpc/tf_agente_contexto",
      { p_instance: slug + "-sandbox", p_telefono: "34600111222", p_test: true });
    check(ctx.data !== null,
      "el sandbox le responde aunque el agente esté apagado",
      "sin esto no hay forma de probarlo antes de encenderlo, que es lo que el alta promete");
    check(ctx.data && (ctx.data.config || {}).conocimiento,
      "y le llega lo que el cliente le enseñó",
      "el conocimiento no aparece en el contexto");
    // Las herramientas viven DENTRO de `config`, no al primer nivel. Leerlas
    // donde no están da cero y parece que el agente quedó sin nada — me pasó al
    // escribir esta prueba, y es la forma más fácil de reportar una avería que
    // no existe.
    const tools = (ctx.data && ctx.data.config && ctx.data.config.herramientas) || [];
    paso("plataforma", "el asistente sabe qué puede hacer", tools.length > 0,
      "le llegan CERO herramientas: puede conversar, pero no agendar ni consultar nada");
    check(tools.some((x) => x.clave === "agendar-cita"),
      "y entre ellas la de agendar, que es por la que pagó",
      "le llegaron: " + JSON.stringify(tools.map((x) => x.clave)));

    const resc = await cli("POST", "/rest/v1/rpc/tf_rescate_pendiente", { p_company: empresa.id, p_dias: 3 });
    paso("plataforma", "Toque Rescata ya mira su agenda",
      resc.data && resc.data.ok === true && resc.data.huecos && resc.data.huecos.hay_agenda === true,
      JSON.stringify(resc.data).slice(0, 160));
    check(resc.data && resc.data.propuestas && resc.data.propuestas.configurado === true,
      "y sabe dónde están sus propuestas", JSON.stringify(resc.data && resc.data.propuestas));

    // ══ El resumen ═════════════════════════════════════════════════════════
    const total = (Date.now() - arranque) / 1000;
    console.log("\n" + "═".repeat(70));
    console.log("El alta completa, sin tocar la base a mano:\n");
    console.log("  " + pasos.length + " actos distintos");
    console.log("  " + total.toFixed(1) + "s de máquina  (lo que tarda una persona en decidir y teclear va aparte)");
    console.log("  " + pasos.filter((p) => p.quien === "consola").length + " los hace ToqueFlow · " +
                pasos.filter((p) => p.quien === "cliente").length + " los hace el cliente solo");
    const lento = pasos.slice().sort((a, b) => b.seg - a.seg)[0];
    if (lento) console.log("  el más lento: «" + lento.que + "» (" + lento.seg.toFixed(1) + "s)");

  } finally {
    if (empresa) await svc("DELETE", "/rest/v1/companies?id=eq." + empresa.id);
    const uid = usuario && (usuario.id || usuario.user_id);
    if (uid) await svc("DELETE", "/auth/v1/admin/users/" + uid);
    if (admUid) await svc("DELETE", "/auth/v1/admin/users/" + admUid);

    // Y se comprueba que se fue. Un super admin de prueba que sobrevive no es
    // basura: es una cuenta con permisos sobre todos los clientes.
    const quedan = (await svc("GET", "/rest/v1/profiles?select=email&role=eq.super_admin")).data || [];
    const sobrante = quedan.filter((p) => String(p.email).startsWith("zz-"));
    if (sobrante.length) {
      console.log("\n  ⚠️  quedaron " + sobrante.length + " super admin(s) de prueba vivos: " +
        sobrante.map((p) => p.email).join(", "));
      fallos.push("la prueba dejó super admins de prueba vivos");
    }
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " cosa(s) que el alta NO deja listas:\n   · " + fallos.join("\n   · ")
    : "✅ Un cliente nuevo queda listo sin que nadie entre a la base.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
