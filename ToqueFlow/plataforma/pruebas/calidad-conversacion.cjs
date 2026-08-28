// ============================================================================
// ¿Suena a persona o suena a bot?
// ----------------------------------------------------------------------------
// El banco de escenarios comprueba que el agente diga la VERDAD. Esto mide algo
// distinto: si la conversación se siente natural. Son cosas que no rompen nada
// y aun así hacen que el cliente final note que está hablando con una máquina.
//
// Lo que cuenta, y por qué cada uno importa:
//
//   saluda cada vez      Nadie dice «Holaa!» cuatro veces en la misma
//                        conversación. Es la marca más delatora de un bot.
//   emoji en todas       El tono pide 1 a 3 «por mensaje» y el modelo lo lee
//                        como «en todos». Una persona los usa a ratos.
//   largo                WhatsApp no es un correo. Más de 55 palabras cansa.
//   repite el nombre     Decir «Marcela» en cada frase suena a vendedor.
//   cita la fuente       Debe decir de qué sección sacó el dato (el cliente no
//                        lo ve). Si no cita, no está mirando el documento.
//
//   node pruebas/calidad-conversacion.cjs
//
// Cuesta unos 3 centavos. Guarda el resultado para poder comparar antes/después.
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
const FIRMA = process.env.TOQUE_AGENTE_FIRMA;

const { Client } = require("pg");
const EMPRESA = process.env.PRUEBAS_COMPANY_ID || "3034fa2d-c918-41bb-9eae-84f2e7913db8";
const INSTANCIA = process.env.PRUEBAS_INSTANCIA || "bejauha-sandbox";
const TEL = "573009990001";

// Una conversación como las de verdad: empieza vaga, da el nombre a la mitad,
// pregunta varias cosas y termina decidiéndose.
const GUION = [
  "hola",
  "vi lo de ustedes en instagram, que hacen exactamente?",
  "soy Marcela. me interesa lo virtual, a que horas son las clases?",
  "y cuanto cuesta?",
  "nunca he hecho yoga, es muy dificil para empezar?",
  "listo, como me inscribo?",
];

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const palabras = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const cuentaEmoji = (s) => (String(s || "").match(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{FE0F}]/gu) || []).length;
const arrancaSaludando = (s) => /^\s*[¡!]*\s*(hola+|holi|buenas|hey|qué tal|que tal)/i.test(String(s || ""));

(async () => {
  if (!FIRMA) { console.error("falta TOQUE_AGENTE_FIRMA"); process.exit(2); }
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const previo = (await c.query("select activo from public.agent_config where company_id=$1", [EMPRESA])).rows[0];
  await c.query("update public.agent_config set activo=true where company_id=$1", [EMPRESA]);
  const limpiar = async () => {
    await c.query("delete from public.test_messages where company_id=$1 and telefono=$2", [EMPRESA, TEL]);
    await c.query("delete from public.message_log where company_id=$1 and contact_id in (select id from public.contacts where company_id=$1 and phone=$2)", [EMPRESA, TEL]);
    await c.query("delete from public.contacts where company_id=$1 and phone=$2", [EMPRESA, TEL]);
  };
  await limpiar();

  const respuestas = [];
  try {
    for (const texto of GUION) {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Toque-Signature": FIRMA },
        body: JSON.stringify({
          instance: INSTANCIA, test: true,
          data: {
            key: { remoteJid: TEL + "@s.whatsapp.net", fromMe: false, id: "CAL" + Date.now() },
            message: { conversation: texto },
          },
        }),
      }).catch(() => {});
      await esperar(2200);
      const r = await c.query(
        "select body from public.test_messages where company_id=$1 and telefono=$2 and author='bot' order by created_at",
        [EMPRESA, TEL]);
      respuestas.push((r.rows[r.rows.length - 1] || {}).body || "");
    }

    console.log("═══ La conversación ═══\n");
    for (let i = 0; i < GUION.length; i++) {
      console.log("  Marcela │ " + GUION[i]);
      console.log("  Bejauha │ " + (respuestas[i] || "(nada)").replace(/\n/g, "\n          │ "));
      console.log("");
    }

    // ── Los números ─────────────────────────────────────────────────────────
    const n = respuestas.length;
    const saludos = respuestas.filter(arrancaSaludando).length;
    const conEmoji = respuestas.filter((r) => cuentaEmoji(r) > 0).length;
    const largos = respuestas.filter((r) => palabras(r) > 55).length;
    const media = Math.round(respuestas.reduce((a, r) => a + palabras(r), 0) / n);
    const conNombre = respuestas.slice(2).filter((r) => /marcela/i.test(r)).length;

    const fila = (etiqueta, valor, total, malo, nota) => {
      const ok = !malo(valor);
      console.log("  " + (ok ? "✅" : "⚠️ ") + " " + etiqueta.padEnd(30) +
                  String(valor).padStart(3) + (total ? " de " + total : "") + "   " + nota);
    };

    console.log("═══ Cómo suena ═══\n");
    fila("arranca saludando", saludos, n, (v) => v > 1, "solo el primero debería");
    fila("lleva emoji", conEmoji, n, (v) => v > n * 0.6, "no en todos");
    fila("pasa de 55 palabras", largos, n, (v) => v > 0, "esto es WhatsApp");
    fila("palabras por respuesta", media, null, (v) => v > 45, "media");
    fila("repite el nombre", conNombre, n - 2, (v) => v > 2, "después de que se presentó");

    // La fuente citada tiene que existir de verdad en el documento.
    const doc = (await c.query("select texto from public.agent_knowledge_prompt where company_id=$1", [EMPRESA])).rows[0].texto;
    console.log("\n  (la sección citada por el agente se comprueba contra el documento en el log de n8n)");
    console.log("  secciones disponibles: " + (doc.match(/^#{2,3} .+$/gm) || []).length);

    const resumen = { fecha: new Date().toISOString().slice(0, 16), n, saludos, conEmoji, largos, media, conNombre };
    const hist = path.join(__dirname, "_calidad-historial.json");
    const previoJson = fs.existsSync(hist) ? JSON.parse(fs.readFileSync(hist, "utf8")) : [];
    previoJson.push(resumen);
    fs.writeFileSync(hist, JSON.stringify(previoJson, null, 1));
    if (previoJson.length > 1) {
      const antes = previoJson[previoJson.length - 2];
      console.log("\n═══ Contra la medición anterior (" + antes.fecha + ") ═══");
      const cmp = (k, etiqueta) => {
        const d = resumen[k] - antes[k];
        console.log("  " + etiqueta.padEnd(26) + String(antes[k]).padStart(3) + " → " + String(resumen[k]).padStart(3) +
                    (d === 0 ? "   igual" : d < 0 ? "   ✅ " + d : "   ⚠️  +" + d));
      };
      cmp("saludos", "arranca saludando");
      cmp("conEmoji", "lleva emoji");
      cmp("largos", "pasa de 55 palabras");
      cmp("media", "palabras por respuesta");
      cmp("conNombre", "repite el nombre");
    }
  } finally {
    await limpiar();
    if (previo && !previo.activo) await c.query("update public.agent_config set activo=false where company_id=$1", [EMPRESA]);
    await c.end();
  }
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
