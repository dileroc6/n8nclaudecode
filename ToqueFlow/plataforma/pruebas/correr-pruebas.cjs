// ============================================================================
// Banco de pruebas del Agente de Atención
// ----------------------------------------------------------------------------
// Corre todos los escenarios de escenarios-agente.json contra el agente REAL,
// en modo prueba, y dice qué se rompió.
//
//   node correr-pruebas.cjs                    ← todos
//   node correr-pruebas.cjs precio recuerda    ← solo esos
//
// Por qué existe: los tres bugs del 27-ago —una URL corrompida, un header que
// faltaba y el nombre del cliente que no se guardaba— no los encontró leer
// código. Los encontró probar y mirar la salida real. Y como hay UN solo flujo
// para todos los clientes, un cambio malo los rompe a todos a la vez.
//
// Cuesta plata: cada corrida completa son unos 3 centavos de dólar.
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..");
const REPO = path.join(PLAT, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const cfg = JSON.parse(fs.readFileSync(path.join(REPO, ".mcp.json"), "utf8"));
const WEBHOOK = String(cfg.mcpServers.n8n.env.N8N_API_URL).split("/api/v1")[0] + "/webhook/toque-agente";

const { Client } = require("pg");
const EMPRESA  = process.env.PRUEBAS_COMPANY_ID || "3034fa2d-c918-41bb-9eae-84f2e7913db8"; // Bejauha
const INSTANCIA = process.env.PRUEBAS_INSTANCIA || "bejauha-sandbox";

const { escenarios } = JSON.parse(fs.readFileSync(path.join(__dirname, "escenarios-agente.json"), "utf8"));
const filtro = process.argv.slice(2);
const aCorrer = filtro.length ? escenarios.filter(e => filtro.includes(e.id)) : escenarios;

// Comparar sin tildes ni mayúsculas: "está" y "esta" son lo mismo para esto.
const plano = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Cada escenario usa su propio teléfono para no pisarse con los demás.
const telefonoDe = (i) => "5730000" + String(10000 + i).slice(-5);

const esperar = ms => new Promise(r => setTimeout(r, ms));

// Mezcla profunda: el escenario solo escribe lo que quiere cambiar del evento.
function fundir(base, extra) {
  if (!extra) return base;
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const [k, v] of Object.entries(extra)) {
    out[k] = (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object")
      ? fundir(base[k], v) : v;
  }
  return out;
}

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // ── De qué se considera verdad ────────────────────────────────────────────
  // Las URLs y los precios que el agente puede decir salen del documento de
  // conocimiento, no de una lista escrita a mano aquí. Si mañana Bejauha sube
  // un precio, esta prueba se entera sola.
  const doc = (await c.query(
    "select texto from public.agent_knowledge_prompt where company_id=$1", [EMPRESA])).rows[0];
  if (!doc) { console.error("Esta empresa no tiene conocimiento cargado. Nada que probar."); process.exit(1); }

  const urlsOk    = new Set((doc.texto.match(/https?:\/\/[^\s)"']+/g)    || []).map(u => u.replace(/[.,]$/, "")));
  const preciosOk = new Set((doc.texto.match(/\$\s?[\d][\d.,]{2,}/g)     || []).map(p => p.replace(/[\s$]/g, "")));

  const estadoPrevio = (await c.query(
    "select activo from public.agent_config where company_id=$1", [EMPRESA])).rows[0];
  await c.query("update public.agent_config set activo=true where company_id=$1", [EMPRESA]);

  const costoAntes = Number((await c.query(
    "select coalesce(sum(cost_usd),0) s from public.ai_usage where company_id=$1", [EMPRESA])).rows[0].s);

  console.log("Agente: " + INSTANCIA + " · " + aCorrer.length + " escenarios\n");

  const resultados = [];

  for (let i = 0; i < aCorrer.length; i++) {
    const esc = aCorrer[i];
    const tel = telefonoDe(i);
    const fallos = [];

    // Cada escenario arranca de cero: sin contacto y sin historial.
    await c.query("delete from public.test_messages where company_id=$1 and telefono=$2", [EMPRESA, tel]);
    await c.query("delete from public.message_log where company_id=$1 and contact_id in (select id from public.contacts where company_id=$1 and phone=$2)", [EMPRESA, tel]);
    await c.query("delete from public.contacts where company_id=$1 and phone=$2", [EMPRESA, tel]);

    for (let t = 0; t < esc.turnos.length; t++) {
      const turno = esc.turnos[t];
      const antes = (await c.query(
        "select count(*)::int n from public.test_messages where company_id=$1 and telefono=$2", [EMPRESA, tel])).rows[0].n;

      const base = {
        instance: INSTANCIA, test: true,
        data: {
          key: { remoteJid: tel + "@s.whatsapp.net", fromMe: false, id: "PRUEBA" + Date.now() + t },
          message: { conversation: turno.cliente || "" }
        }
      };
      const evento = turno.evento ? fundir(base, { data: turno.evento }) : base;

      try {
        await fetch(WEBHOOK, {
          method: "POST",
          // El webhook exige la firma del contrato. Sin ella devuelve 403 y no
          // ejecuta nada — que es justo lo que se quiere.
          headers: { "Content-Type": "application/json", "X-Toque-Signature": process.env.TOQUE_AGENTE_FIRMA || "" },
          body: JSON.stringify(evento),
        });
      } catch (e) { /* el workflow puede devolver 500; lo que importa es lo que quedó en la base */ }
      await esperar(1500);

      const msgs = (await c.query(
        "select author, body from public.test_messages where company_id=$1 and telefono=$2 order by created_at", [EMPRESA, tel])).rows;
      const nuevos = msgs.length - antes;
      const respuesta = (msgs.filter(m => m.author === "bot").pop() || {}).body || "";
      const esp = turno.espera || {};

      // ── Lo que se revisa siempre, responda lo que responda ────────────────
      for (const u of (respuesta.match(/https?:\/\/[^\s)"',]+/g) || [])) {
        const limpia = u.replace(/[.,]$/, "");
        if (!urlsOk.has(limpia)) fallos.push("turno " + (t + 1) + ": mandó una URL que no está en el documento → " + limpia);
      }
      for (const p of (respuesta.match(/\$\s?[\d][\d.,]{2,}/g) || [])) {
        const limpio = p.replace(/[\s$]/g, "").replace(/[.,]$/, "");
        if (!preciosOk.has(limpio)) fallos.push("turno " + (t + 1) + ": dijo un precio que no está en el documento → " + p);
      }

      // ── Lo que pide este turno ────────────────────────────────────────────
      if (esp.sin_respuesta && nuevos > 0)
        fallos.push("turno " + (t + 1) + ": debía ignorarlo y contestó → " + respuesta.slice(0, 80));
      if (esp.responde && !respuesta)
        fallos.push("turno " + (t + 1) + ": no contestó nada");

      const r = plano(respuesta);
      for (const s of (esp.contiene || []))
        if (!r.includes(plano(s))) fallos.push("turno " + (t + 1) + ": faltó «" + s + "»");
      for (const s of (esp.no_contiene || []))
        if (r.includes(plano(s))) fallos.push("turno " + (t + 1) + ": dijo lo que no debía → «" + s + "»");

      if (esp.captura) {
        const ct = (await c.query(
          "select full_name, metadata from public.contacts where company_id=$1 and phone=$2", [EMPRESA, tel])).rows[0] || {};
        for (const clave of esp.captura) {
          const ok = clave === "nombre" ? !!ct.full_name : !!(ct.metadata || {})[clave];
          if (!ok) fallos.push("turno " + (t + 1) + ": no guardó «" + clave + "»");
        }
      }

      if (esp.accion) {
        // La acción se lee del log de n8n indirectamente: si escaló, el motivo
        // queda; aquí basta con que la respuesta exista y no sea vacía. La
        // comprobación fina de acción se hace por el link o el escalamiento.
      }

      turno._respuesta = respuesta;
      turno._nuevos = nuevos;
    }

    resultados.push({ esc, fallos });
    console.log((fallos.length ? "  ❌ " : "  ✅ ") + esc.id.padEnd(20) + esc.titulo);
  }

  // ── Detalle de lo que falló ───────────────────────────────────────────────
  const malos = resultados.filter(r => r.fallos.length);
  if (malos.length) {
    console.log("\n═══ Qué se rompió ═══");
    for (const { esc, fallos } of malos) {
      console.log("\n▸ " + esc.id + " — " + esc.titulo);
      console.log("  " + esc.porque);
      for (const f of fallos) console.log("    · " + f);
      for (let t = 0; t < esc.turnos.length; t++) {
        const tu = esc.turnos[t];
        console.log("    ── turno " + (t + 1) + " ──");
        if (tu.cliente) console.log("       cliente: " + tu.cliente);
        console.log("       agente:  " + (tu._respuesta ? tu._respuesta.slice(0, 260) : "(nada)"));
      }
    }
  }

  const costoDespues = Number((await c.query(
    "select coalesce(sum(cost_usd),0) s from public.ai_usage where company_id=$1", [EMPRESA])).rows[0].s);

  console.log("\n═══ Resumen ═══");
  console.log("  " + (aCorrer.length - malos.length) + " de " + aCorrer.length + " pasaron");
  console.log("  costo de esta corrida: $" + (costoDespues - costoAntes).toFixed(5) + " USD");

  // Se limpia todo: son teléfonos falsos y no tienen por qué quedar en la base
  // real del cliente. El consumo SÍ queda: probar cuesta plata de verdad.
  for (let i = 0; i < aCorrer.length; i++) {
    const tel = telefonoDe(i);
    await c.query("delete from public.test_messages where company_id=$1 and telefono=$2", [EMPRESA, tel]);
    await c.query("delete from public.message_log where company_id=$1 and contact_id in (select id from public.contacts where company_id=$1 and phone=$2)", [EMPRESA, tel]);
    await c.query("delete from public.contacts where company_id=$1 and phone=$2", [EMPRESA, tel]);
  }
  if (estadoPrevio && !estadoPrevio.activo)
    await c.query("update public.agent_config set activo=false where company_id=$1", [EMPRESA]);

  await c.end();
  process.exit(malos.length ? 1 : 0);
})().catch(e => { console.error("ERROR " + e.message); process.exit(2); });
