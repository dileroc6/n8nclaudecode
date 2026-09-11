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
const PLAT = path.join(__dirname, "..", "..");
const REPO = path.join(PLAT, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const cfg = JSON.parse(fs.readFileSync(path.join(REPO, ".mcp.json"), "utf8"));
const WEBHOOK = String(cfg.mcpServers.n8n.env.N8N_API_URL).split("/api/v1")[0] + "/webhook/toque-agente";

const { Client } = require("pg");
const EMPRESA  = process.env.PRUEBAS_COMPANY_ID || "3034fa2d-c918-41bb-9eae-84f2e7913db8"; // Bejauha
const INSTANCIA = process.env.PRUEBAS_INSTANCIA || "bejauha-sandbox";

// Que archivo de escenarios. Por defecto los de Bejauha; con PRUEBAS_ESCENARIOS
// se le corren a otro negocio — la tienda de prueba, por ejemplo. Los escenarios
// son datos, asi que un negocio nuevo no necesita otro corredor.
const ARCHIVO = process.env.PRUEBAS_ESCENARIOS || "escenarios-agente.json";
const { escenarios } = JSON.parse(fs.readFileSync(path.join(__dirname, ARCHIVO), "utf8"));
// --ver imprime la conversación aunque el escenario pase. Hace falta para los
// de inyección: que la respuesta no contenga una palabra prohibida no prueba
// que el agente se haya portado bien, y eso solo lo juzga alguien leyéndola.
const VER = process.argv.includes("--ver");
const filtro = process.argv.slice(2).filter((a) => !a.startsWith("--"));
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
  const abrir = async () => {
    const cl = new Client({ connectionString: process.env.SUPABASE_DB_URL,
                            ssl: { rejectUnauthorized: false }, keepAlive: true });
    // Sin esto, una conexión cortada emite un evento 'error' sin dueño y node
    // se cae. Se cae ENTERO, a mitad de los escenarios, y el que mira la
    // salida ve quince ✅ y cree que pasó todo.
    cl.on('error', () => {});
    await cl.connect();
    return cl;
  };
  let c = await abrir();

  // Si la conexión se murió mientras esperábamos a Claude, se abre otra y se
  // reintenta una vez. Una prueba que falla porque se aburrió el socket no
  // dice nada del producto.
  const query = async (...a) => {
    try { return await c.query(...a); }
    catch (e) {
      if (!/terminated|ECONNRESET|Connection|closed/i.test(e.message)) throw e;
      try { await c.end(); } catch (_) {}
      c = await abrir();
      return await c.query(...a);
    }
  };

  // ── De qué se considera verdad ────────────────────────────────────────────
  // Las URLs y los precios que el agente puede decir salen del documento de
  // conocimiento, no de una lista escrita a mano aquí. Si mañana Bejauha sube
  // un precio, esta prueba se entera sola.
  const doc = (await query(
    "select texto from public.agent_knowledge_prompt where company_id=$1", [EMPRESA])).rows[0];
  if (!doc) { console.error("Esta empresa no tiene conocimiento cargado. Nada que probar."); process.exit(1); }

  const urlsOk    = new Set((doc.texto.match(/https?:\/\/[^\s)"']+/g)    || []).map(u => u.replace(/[.,]$/, "")));
  const preciosOk = new Set((doc.texto.match(/\$\s?[\d][\d.,]{2,}/g)     || []).map(p => p.replace(/[\s$]/g, "")));

  // El documento no es la única fuente de precios. Un negocio con catálogo los
  // tiene ahí —y a propósito NO en el documento, para que el agente no los diga
  // de memoria—, así que un precio del catálogo NO es un precio inventado.
  // Sin esto, probar una tienda sería imposible: toda respuesta correcta
  // saldría marcada como alucinación.
  const cat = (await query(
    "select distinct precio_cop from public.productos where company_id=$1 and activo and precio_cop is not null",
    [EMPRESA])).rows;
  for (const r of cat) {
    const n = Number(r.precio_cop);
    // Las formas en que un precio se escribe de verdad: 45000, 45.000, 45,000.
    preciosOk.add(String(n));
    preciosOk.add(n.toLocaleString('es-CO'));
    preciosOk.add(n.toLocaleString('en-US'));
  }
  if (cat.length) console.log('  (' + cat.length + ' precios del catálogo cuentan como verdad, además del documento)');

  const estadoPrevio = (await query(
    "select whatsapp_instance, activo from public.agent_config where company_id=$1", [EMPRESA])).rows;
  await query("update public.agent_config set activo=true where company_id=$1", [EMPRESA]);

  const costoAntes = Number((await query(
    "select coalesce(sum(cost_usd),0) s from public.ai_usage where company_id=$1", [EMPRESA])).rows[0].s);

  console.log("Agente: " + INSTANCIA + " · " + aCorrer.length + " escenarios\n");

  const resultados = [];

  for (let i = 0; i < aCorrer.length; i++) {
    const esc = aCorrer[i];
    // Un escenario puede fijar su telefono para correr contra un contacto REAL.
    // Los demas usan uno generado, que no existe en la base.
    const tel = esc.telefono || telefonoDe(i);
    const esReal = !!esc.telefono;
    const fallos = [];

    // Cada escenario arranca de cero: sin contacto y sin historial.
    await query("delete from public.test_messages where company_id=$1 and public.tf_telefono(telefono)=public.tf_telefono($2)", [EMPRESA, tel]);
    if (!esReal) {
      // Solo se borra lo inventado. Un contacto real es de un cliente de
      // verdad y borrarlo por correr una prueba seria imperdonable.
      await query("delete from public.message_log where company_id=$1 and contact_id in (select id from public.contacts where company_id=$1 and public.tf_telefono(phone)=public.tf_telefono($2))", [EMPRESA, tel]);
      await query("delete from public.contacts where company_id=$1 and public.tf_telefono(phone)=public.tf_telefono($2)", [EMPRESA, tel]);
    }

    for (let t = 0; t < esc.turnos.length; t++) {
      const turno = esc.turnos[t];
      const antes = (await query(
        "select count(*)::int n from public.test_messages where company_id=$1 and public.tf_telefono(telefono)=public.tf_telefono($2)", [EMPRESA, tel])).rows[0].n;

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

      const msgs = (await query(
        "select author, body from public.test_messages where company_id=$1 and public.tf_telefono(telefono)=public.tf_telefono($2) order by created_at", [EMPRESA, tel])).rows;
      const nuevos = msgs.length - antes;
      const respuesta = (msgs.filter(m => m.author === "bot").pop() || {}).body || "";
      const esp = turno.espera || {};

      // ── Lo que se revisa siempre, responda lo que responda ────────────────
      for (const u of (respuesta.match(/https?:\/\/[^\s)"',]+/g) || [])) {
        const limpia = u.replace(/[.,]$/, "");
        if (!urlsOk.has(limpia)) fallos.push("turno " + (t + 1) + ": mandó una URL que no está en el documento → " + limpia);
      }
      // El total de un pedido no es un precio inventado: lo calculó la
      // herramienta, no el modelo. Se leen los que existen de verdad en vez de
      // aceptar múltiplos «que suenan bien» — un múltiplo aceptado a ojo le
      // abriría la puerta justo a lo que esta comprobación existe para cazar.
      for (const r of (await query(
        "select distinct total_cop from public.pedidos where company_id=$1 and total_cop is not null",
        [EMPRESA])).rows) {
        const n = Number(r.total_cop);
        preciosOk.add(String(n));
        preciosOk.add(n.toLocaleString("es-CO"));
        preciosOk.add(n.toLocaleString("en-US"));
      }
      for (const p of (respuesta.match(/\$\s?[\d][\d.,]{2,}/g) || [])) {
        const limpio = p.replace(/[\s$]/g, "").replace(/[.,]$/, "");
        if (!preciosOk.has(limpio)) fallos.push("turno " + (t + 1) + ": dijo un precio que no está ni en el documento ni en el catálogo → " + p);
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
        const ct = (await query(
          "select full_name, metadata from public.contacts where company_id=$1 and public.tf_telefono(phone)=public.tf_telefono($2)", [EMPRESA, tel])).rows[0] || {};
        for (const clave of esp.captura) {
          const ok = clave === "nombre" ? !!ct.full_name : !!(ct.metadata || {})[clave];
          if (!ok) fallos.push("turno " + (t + 1) + ": no guardó «" + clave + "»");
        }
      }

      // ── Y lo que tiene que haber quedado EN LA BASE ────────────────────────
      // Sin esto, un escenario solo comprueba que el agente haya escrito bonito.
      // Pasó justo eso: el agente contestaba «pedido confirmado, son 90.000»,
      // el escenario pasaba en verde, y no había ningún pedido — nunca llamó a
      // la herramienta, lo NARRÓ. Una conversación que suena perfecta y no dejó
      // nada es el peor fallo posible, porque nadie se entera.
      //
      // La consulta recibe $1 = empresa y $2 = el teléfono de este escenario.
      if (esp.en_la_base) {
        const b = esp.en_la_base;
        let n = null;
        try {
          n = Number((await query(b.consulta, [EMPRESA, tel])).rows[0].n);
        } catch (e) {
          fallos.push("turno " + (t + 1) + ": la comprobación en la base falló → " + e.message);
        }
        if (n !== null && b.al_menos !== undefined && n < b.al_menos)
          fallos.push("turno " + (t + 1) + ": " + (b.que || "lo esperado") +
                      " — esperaba al menos " + b.al_menos + " y hay " + n +
                      " (puede que lo haya dicho sin hacerlo)");
        if (n !== null && b.exacto !== undefined && n !== b.exacto)
          fallos.push("turno " + (t + 1) + ": " + (b.que || "lo esperado") +
                      " — esperaba " + b.exacto + " y hay " + n);
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
  const malos = VER ? resultados : resultados.filter(r => r.fallos.length);
  if (malos.length) {
    console.log(VER ? "\n═══ Las conversaciones ═══" : "\n═══ Qué se rompió ═══");
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

  const costoDespues = Number((await query(
    "select coalesce(sum(cost_usd),0) s from public.ai_usage where company_id=$1", [EMPRESA])).rows[0].s);

  console.log("\n═══ Resumen ═══");
  // Se cuenta sobre los fallos de verdad, no sobre lo que se imprimió: con
  // --ver se imprimen todos y el conteo decía «0 de 4 pasaron» con las cuatro
  // en verde.
  const fallaron = resultados.filter((r) => r.fallos.length).length;
  console.log("  " + (aCorrer.length - fallaron) + " de " + aCorrer.length + " pasaron");
  console.log("  costo de esta corrida: $" + (costoDespues - costoAntes).toFixed(5) + " USD");

  // Se limpia todo: son teléfonos falsos y no tienen por qué quedar en la base
  // real del cliente. El consumo SÍ queda: probar cuesta plata de verdad.
  for (let i = 0; i < aCorrer.length; i++) {
    if (aCorrer[i].telefono) continue;   // los reales no se tocan
    const tel = telefonoDe(i);
    // Aquí ya se saltaron los reales con el `continue` de arriba: todo lo que
    // llega a esta línea es un teléfono inventado por la prueba.
    await query("delete from public.test_messages where company_id=$1 and public.tf_telefono(telefono)=public.tf_telefono($2)", [EMPRESA, tel]);
    await query("delete from public.message_log where company_id=$1 and contact_id in (select id from public.contacts where company_id=$1 and public.tf_telefono(phone)=public.tf_telefono($2))", [EMPRESA, tel]);
    await query("delete from public.contacts where company_id=$1 and public.tf_telefono(phone)=public.tf_telefono($2)", [EMPRESA, tel]);
  }

  // De los reales solo se borran los mensajes de prueba: el contacto es de un
  // cliente de verdad y borrarlo por correr una prueba sería imperdonable.
  for (const esc of aCorrer.filter((e) => e.telefono)) {
    await query("delete from public.test_messages where company_id=$1 and public.tf_telefono(telefono)=public.tf_telefono($2)", [EMPRESA, esc.telefono]);
  }
  for (const e of estadoPrevio)
    if (!e.activo)
      await query("update public.agent_config set activo=false where company_id=$1 and whatsapp_instance=$2",
        [EMPRESA, e.whatsapp_instance]);

  await c.end();
  process.exit(malos.length ? 1 : 0);
})().catch(e => {
  // Código 2, no 0. Un banco de pruebas que se cae y sale en verde es peor que
  // no tener banco: el cron semanal lo reporta como que todo está bien.
  console.error("\n*** LA CORRIDA SE CAYÓ — los escenarios que faltaban NO se probaron ***");
  console.error("ERROR " + e.message);
  process.exit(2);
});
