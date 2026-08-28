// ============================================================================
// Configura el Agente de Atención de Bejauha en la plataforma.
// ----------------------------------------------------------------------------
// Esto es TODA la implementación de un cliente en el producto estándar: una
// fila. El conocimiento lo carga migrar-kb-bejauha.cjs; aquí va cómo se
// comporta.
//
// El tono no está inventado: sale de Bejauha/prompts/_tono-bejauha.md, que se
// extrajo de conversaciones reales del equipo con clientas en mayo de 2026.
//
// Arranca con `activo = false` a propósito. Se prende cuando el sandbox se vea
// bien, y no antes.
// ============================================================================
const fs = require("fs");
const path = require("path");
const BASE = __dirname;

fs.readFileSync(path.join(BASE, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const BEJAUHA = "3034fa2d-c918-41bb-9eae-84f2e7913db8";

// La instancia de sandbox NO existe en Evolution. Es deliberado: mientras el
// nombre sea este, ningún WhatsApp real puede llegarle al agente aunque el
// workflow esté activo. Se cambia por la instancia de verdad el día del
// go-live, y ese cambio es el interruptor.
const INSTANCIA = process.argv[2] || "bejauha-sandbox";

const CONFIG = {
  identidad: {
    negocio: "Bejauha",
    tono:
      "Amistoso, cercano y honesto. Bejauha es una COMUNIDAD de yoga y bienestar, no una tienda: " +
      "se acompaña, no se vende a presión. Trato de tú, como un amigo que sabe del tema.\n" +
      "Saludo: «Holaa [Nombre]!» con doble a. Emojis suaves, 1 a 3 por mensaje, de esta paleta: " +
      "✨ 🤍 💛 🌿 ☀️ 🙌 🫶 🥺 — nunca 🔥 💰 🚨.\n" +
      "Muletillas cálidas que sí van: «Dale», «fresca», «por fa», «Súper».\n" +
      "Interésate por cómo está la persona (cuerpo, ánimo, estrés), no solo por la venta.\n" +
      "Cierra cálido: «Te mando un abracito grande 🫶💛».\n" +
      "Nada corporativo («Estimado usuario», «le informamos»). Nunca digas «chicos». " +
      "No inventes apodos ni finjas una cercanía que no existe: usa el nombre real."
  },
  captura: {
    campos: [
      { clave: "nombre",     etiqueta: "Su primer nombre",                              obligatorio: true,  tipo: "texto" },
      { clave: "modalidad",  etiqueta: "Si le interesa virtual o presencial",           obligatorio: true,  tipo: "texto" },
      { clave: "experiencia",etiqueta: "Si ya practica yoga o es la primera vez",       obligatorio: false, tipo: "texto" },
      { clave: "como_llego", etiqueta: "Por dónde nos conoció (Instagram, TikTok, referido)", obligatorio: false, tipo: "texto" }
    ]
  },
  enrutamiento: {
    reglas: [
      { si: "quiere comprar, agendar o pagar algo",              accion: "notificar_humano", destino: "equipo de Bejauha" },
      { si: "pregunta por la membresía y quiere suscribirse",     accion: "enviar_link",      destino: "https://bejauha.com/planes" },
      { si: "pregunta por un paquete presencial o clase suelta",  accion: "notificar_humano", destino: "equipo de Bejauha" },
      { si: "reclama por un cobro o por su saldo de clases",      accion: "notificar_humano", destino: "administración" }
    ]
  },
  limites: {
    nunca: [
      "Dar consejo médico, de nutrición o de lesiones. Si preguntan, sugiere consultar con un profesional y ofrece hablar con el equipo.",
      "Prometer resultados físicos, de peso o de salud.",
      "Presionar, inventar urgencia o insistir si la persona dice que no.",
      "Ofrecer paquetes de clases a alguien nuevo: ya no se venden, hoy el producto es la membresía mensual."
    ],
    escalar_si: [
      "la persona se molesta o repite la misma queja",
      "pide algo que no está escrito arriba"
    ]
  },
  // Bejauha no agenda por el bot: el equipo coordina. Es el modo más barato de
  // operar y el que el negocio ya definió — ver el alcance del Agente 3.
  agenda: { modo: "ninguna" },
  recordatorios: {}
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  await c.query(
    `insert into public.agent_config
       (company_id, activo, whatsapp_instance, identidad, captura, enrutamiento, limites, agenda, recordatorios)
     values ($1, false, $2, $3, $4, $5, $6, $7, $8)
     on conflict (company_id) do update set
       whatsapp_instance = excluded.whatsapp_instance,
       identidad         = excluded.identidad,
       captura           = excluded.captura,
       enrutamiento      = excluded.enrutamiento,
       limites           = excluded.limites,
       agenda            = excluded.agenda,
       recordatorios     = excluded.recordatorios`,
    [BEJAUHA, INSTANCIA,
      JSON.stringify(CONFIG.identidad), JSON.stringify(CONFIG.captura),
      JSON.stringify(CONFIG.enrutamiento), JSON.stringify(CONFIG.limites),
      JSON.stringify(CONFIG.agenda), JSON.stringify(CONFIG.recordatorios)]);

  const r = (await c.query(
    `select empresa, activo, whatsapp_instance, conocimiento_bytes, conocimiento_fuentes, conocimiento_estado
     from public.agent_runtime where company_id = $1`, [BEJAUHA])).rows[0];

  console.log("Agente configurado:");
  console.log("  empresa       " + r.empresa);
  console.log("  instancia     " + r.whatsapp_instance);
  console.log("  activo        " + r.activo + (r.activo ? "" : "  ← se prende cuando el sandbox se vea bien"));
  console.log("  conocimiento  " + r.conocimiento_fuentes + " fuentes, " + r.conocimiento_bytes + " bytes, " + r.conocimiento_estado);
  await c.end();
})().catch(e => { console.error("ERROR " + e.message); process.exit(1); });
