// ============================================================================
// Auditoría de n8n: qué puertas hay abiertas hacia afuera
// ----------------------------------------------------------------------------
// n8n es el worker: recibe eventos, habla con WhatsApp, con Claude y con la
// base. Cada webhook activo es una puerta con una URL adivinable —el nombre del
// flujo suele estar en la ruta— y sin autenticación, cualquiera que la adivine
// entra.
//
// Ya pasó una vez en este proyecto: el receptor del agente estaba abierto, y
// eso significaba que un extraño podía inyectar mensajes y hacer que el
// WhatsApp de un cliente le escribiera a números arbitrarios. Se arregló con
// `X-Toque-Signature`. Esto comprueba que no haya quedado ninguno más, y que
// los que están cerrados de verdad rechacen.
//
// Cómo obtiene la llave: de `N8N_API_KEY` del entorno. Si no está, la busca en
// los `.mcp.json`. NO la imprime nunca.
//
//   node pruebas/auditoria-n8n.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const RAIZ = path.join(__dirname, "..", "..", "..", "..");
const BASE = "https://n8n.srv1398596.hstgr.cloud";

// ── La llave ────────────────────────────────────────────────────────────────
function llave() {
  if (process.env.N8N_API_KEY && /^eyJ/.test(process.env.N8N_API_KEY)) return process.env.N8N_API_KEY;
  for (const d of [".", "Bejauha", "Savia", "LuxeSmile", "Zoe"]) {
    const p = path.join(RAIZ, d, ".mcp.json");
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, "utf8").match(/"N8N_API_KEY"\s*:\s*"(eyJ[^"]+)"/);
    if (m) return m[1];
  }
  return null;
}
const K = llave();

const hallazgos = [];
const anota = (g, que, detalle) => hallazgos.push({ gravedad: g, que, detalle });
const bloque = (t) => console.log("\n── " + t + " " + "─".repeat(Math.max(0, 62 - t.length)));
const ok = (s) => console.log("  ✅ " + s);
const mal = (s) => console.log("  ❌ " + s);

const api = async (p) => {
  const r = await fetch(BASE + "/api/v1" + p, { headers: { "X-N8N-API-KEY": K } });
  if (!r.ok) throw new Error("HTTP " + r.status + " en " + p);
  return r.json();
};

(async () => {
  if (!K) {
    console.log("No encontré la llave de n8n. Pon N8N_API_KEY en el entorno.");
    process.exit(2);
  }

  // ── 1. Todos los webhooks activos ────────────────────────────────────────
  bloque("Webhooks activos: cuáles piden autenticación");

  let todos = [], cursor = null;
  do {
    const j = await api("/workflows?limit=100" + (cursor ? "&cursor=" + cursor : ""));
    todos = todos.concat(j.data || []);
    cursor = j.nextCursor;
  } while (cursor);

  const activos = todos.filter((w) => w.active);
  console.log("  " + todos.length + " workflows, " + activos.length + " activos\n");

  // Señales de que el flujo comprueba quién llama, aunque el nodo no lo haga.
  // Se busca en el JSON entero: nodos de código, condiciones y expresiones.
  // Validar al que ENTRA no es lo mismo que usar una llave al SALIR. La
  // primera version buscaba "apikey" y casaba con cada llamada a Evolution,
  // asi que daba por cerrados flujos que no comprueban nada.
  //
  // La senal correcta es que el flujo LEA LAS CABECERAS de la peticion y las
  // compare con algo. Sin eso, no valida a quien llama por mucha llave que use
  // despues.
  // Se buscan trozos literales en vez de una expresión: es más fácil de leer y
  // no hay que pelear con las barras invertidas.
  const LEE_CABECERAS = ["headers[", "headers.", "headers ", "$json.headers", "getHeaderData"];
  const COMPARA_SECRETO = ["x-toque-signature", "toque_agente_firma", "x-signature",
                           "hmac", "firma", "secret", "authorization", "bearer"];
  // La otra forma legítima de comprobar quién llama: recibir un token en el
  // cuerpo y preguntarle a Supabase de quién es. Así está hecho
  // `admin-evolution`, y darlo por abierto era un falso positivo — el token no
  // viaja en una cabecera sino en el body, que es lo normal cuando quien llama
  // es el navegador del portal.
  const PREGUNTA_QUIEN_ES = ["super_admin", "no autorizado", "role !==", "rest/v1/profiles"];

  const contiene = (texto, trozos) => trozos.some((x) => texto.toLowerCase().includes(x.toLowerCase()));

  const cerrados = [], porDentro = [], abiertos = [];

  for (const w of activos) {
    const full = await api("/workflows/" + w.id);
    // Solo las ENTRADAS. `respondToWebhook` también lleva «webhook» en el tipo y
    // no es una puerta: es el nodo que contesta. Contarlo daba un hallazgo
    // grave por cada flujo que responde algo, y eso es ruido que tapa lo real.
    const entradas = (full.nodes || []).filter(
      (n) => !n.disabled && /^n8n-nodes-base.(webhook|formTrigger)$/i.test(n.type));
    if (!entradas.length) continue;

    // Se mira el flujo completo una vez, no por nodo: la comprobacion puede
    // estar tres nodos mas adelante.
    const cuerpo = JSON.stringify(full.nodes || []);
    const validaPorDentro = (contiene(cuerpo, LEE_CABECERAS) && contiene(cuerpo, COMPARA_SECRETO))
                            || contiene(cuerpo, PREGUNTA_QUIEN_ES);

    for (const n of entradas) {
      const auth = (n.parameters || {}).authentication;
      // Un webhook de formulario o de respuesta no lleva `path`; se le pone el
      // nombre del nodo para que la fila diga algo.
      const ruta = (n.parameters || {}).path || ("(" + n.name + ")");
      const fila = { wf: w.name, ruta, auth: auth || null, mio: /^(ToqueFlow|Toque) /.test(w.name) };
      if (auth && auth !== "none") cerrados.push(fila);
      else if (validaPorDentro) porDentro.push(fila);
      else abiertos.push(fila);
    }
  }

  const linea = (x) => String(x.ruta).slice(0, 30).padEnd(32) + x.wf;
  for (const x of cerrados)  console.log("  ✅ " + String(x.ruta).slice(0, 30).padEnd(32) + x.auth.padEnd(14) + x.wf);
  for (const x of porDentro) console.log("  ✅ " + String(x.ruta).slice(0, 30).padEnd(32) + "lee la cabecera y la compara   " + x.wf);

  // ToqueFlow primero: es la plataforma que se esta vendiendo hoy.
  const mios = abiertos.filter((x) => x.mio);
  const heredados = abiertos.filter((x) => !x.mio);

  if (mios.length) {
    console.log("\n  Abiertos, y son de la PLATAFORMA:");
    for (const x of mios) {
      mal(linea(x));
      anota("alta", "webhook sin comprobar quien llama: " + x.ruta,
        "En " + x.wf + ". El flujo no lee ninguna cabecera para validar al que entra, y la URL es adivinable.");
    }
  }

  if (heredados.length) {
    console.log("\n  Abiertos, heredados de flujos de clientes (anteriores al estándar):");
    for (const x of heredados) console.log("     · " + linea(x));
    anota("media", heredados.length + " webhooks abiertos en flujos viejos de clientes",
      "Uno por uno: los de WhatsApp dejan inyectar mensajes falsos, que es el bug que ya se arreglo en el agente nuevo. Los de formularios y paginas puede que esten bien abiertos.");
  }

  if (!abiertos.length) ok("los " + (cerrados.length + porDentro.length) + " webhooks activos comprueban quién llama");
  else console.log("\n  Resumen: " + cerrados.length + " cerrados en el nodo · " + porDentro.length +
    " validan por dentro · " + abiertos.length + " abiertos (" + mios.length + " de la plataforma)");

  // ── 2. Y los cerrados, ¿de verdad rechazan? ──────────────────────────────
  // Que el nodo diga «headerAuth» no prueba que la instancia la exija. Se
  // llama sin credencial y se mira que responda 401/403.
  bloque("Los cerrados, probándolos sin credencial");
  let coló = 0;
  for (const x of cerrados) {
    let r;
    try {
      r = await fetch(BASE + "/webhook/" + x.ruta, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
    } catch (e) { console.log("  ⚠️  " + x.ruta + ": no respondió (" + e.message + ")"); continue; }

    if (r.status === 401 || r.status === 403) {
      ok(String(x.ruta).slice(0, 30).padEnd(32) + "rechaza (HTTP " + r.status + ")");
    } else if (r.status === 404) {
      console.log("  ℹ️  " + String(x.ruta).slice(0, 30).padEnd(32) + "404 — la ruta de producción es otra");
    } else {
      mal(String(x.ruta).slice(0, 30).padEnd(32) + "ACEPTÓ sin credencial (HTTP " + r.status + ")");
      anota("alta", "webhook que dice pedir auth pero no la exige: " + x.ruta,
        "En " + x.wf + ". El nodo esta configurado con auth pero la llamada paso igual.");
      coló++;
    }
  }
  if (!coló) ok("ninguno de los cerrados aceptó una llamada sin credencial");

  // ── 3. ¿La interfaz de n8n está abierta? ─────────────────────────────────
  bloque("La interfaz de n8n");
  const ui = await fetch(BASE + "/rest/login", { method: "GET" }).catch(() => null);
  if (ui && ui.status === 200) {
    const t = await ui.text();
    if (/"id"\s*:/.test(t) && /email/.test(t)) {
      mal("/rest/login devuelve una sesión sin credenciales");
      anota("alta", "n8n sin autenticación", "Cualquiera entra a la interfaz y ve todos los flujos y credenciales.");
    } else ok("la interfaz pide sesión");
  } else {
    ok("la interfaz pide sesión (HTTP " + (ui ? ui.status : "sin respuesta") + ")");
  }

  // ── 4. Flujos sin manejo de errores ──────────────────────────────────────
  // No es seguridad, pero es de la misma familia: un flujo que falla en
  // silencio es un flujo que nadie sabe que dejó de funcionar. FerreteríaYa
  // lleva días con el WhatsApp caído y nadie se enteró.
  bloque("Flujos activos sin aviso de error");
  const sinError = [];
  for (const w of activos) {
    const full = await api("/workflows/" + w.id);
    const tieneTrigger = (full.nodes || []).some((n) => /errorTrigger/i.test(n.type));
    const tieneWorkflow = full.settings && full.settings.errorWorkflow;
    if (!tieneTrigger && !tieneWorkflow) sinError.push(w.name);
  }
  if (!sinError.length) ok("todos los flujos activos avisan si fallan");
  else {
    console.log("  ⚠️  " + sinError.length + " de " + activos.length + " flujos activos no avisan si fallan:");
    sinError.slice(0, 12).forEach((n) => console.log("       · " + n));
    if (sinError.length > 12) console.log("       … y " + (sinError.length - 12) + " más");
    anota("media", sinError.length + " flujos activos sin aviso de error",
      "Fallan en silencio. Asi lleva dias caido el WhatsApp de FerreteriaYa sin que nadie lo supiera.");
  }

  // ── 5. Secretos escritos a mano dentro de los flujos ─────────────────────
  // La firma que protege al agente estaba en texto plano DENTRO de `wa-router`,
  // y el receptor de eventos tiene la suya igual con un «TODO mover a variable
  // de entorno» de julio. Un secreto ahi dentro lo ve cualquiera que entre a
  // n8n o que exporte el flujo — y es la llave que abre el agente.
  //
  // Se comprueba la FORMA, no el valor: no hay que traerse el secreto aqui
  // para saber que esta donde no debe.
  bloque("Secretos escritos a mano en los flujos");
  const CABECERAS = ["x-toque-signature", "x-signature", "apikey", "authorization"];
  const conSecreto = [];
  for (const w of activos) {
    const full = await api("/workflows/" + w.id);
    for (const n of (full.nodes || [])) {
      const params = JSON.stringify(n.parameters || {});
      // Un valor pegado a una cabecera de autenticacion que NO sea una
      // expresion de n8n (`{{ $env... }}`) ni una credencial.
      for (const c of CABECERAS) {
        const re = new RegExp('"name"\\s*:\\s*"' + c + '"\\s*,\\s*"value"\\s*:\\s*"([^"]{16,})"', "i");
        const m = params.match(re);
        if (m && m[1].indexOf("{{") === -1) {
          conSecreto.push({ wf: w.name, nodo: n.name, cabecera: c, pista: m[1].slice(0, 6) + "…" });
        }
      }
    }
  }
  if (!conSecreto.length) ok("ningun flujo activo lleva un secreto escrito a mano");
  else {
    for (const x of conSecreto)
      mal(x.wf.slice(0, 34).padEnd(36) + x.nodo.slice(0, 22).padEnd(24) + x.cabecera + " = " + x.pista);
    anota("alta", conSecreto.length + " secreto(s) escritos a mano dentro de flujos de n8n",
      "Lo ve cualquiera que entre a n8n o exporte el flujo. Van en una variable de entorno del VPS y se leen con {{ $env.NOMBRE }}.");
  }
  console.log("\n" + "═".repeat(70));
  if (!hallazgos.length) console.log("✅ n8n no tiene puertas abiertas.");
  else {
    const altas = hallazgos.filter((h) => h.gravedad === "alta");
    console.log("❌ " + hallazgos.length + " hallazgo(s), " + altas.length + " grave(s):\n");
    for (const h of hallazgos) {
      console.log("  [" + h.gravedad.toUpperCase() + "] " + h.que);
      console.log("          " + h.detalle);
    }
  }
  process.exitCode = hallazgos.some((h) => h.gravedad === "alta") ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
