// ============================================================================
// cargar-conocimiento — Le da al agente el conocimiento del negocio
// ----------------------------------------------------------------------------
// Recibe la URL del sitio del cliente, recorre unas pocas páginas, limpia el
// HTML y le pide a un modelo que lo ORDENE en un documento de conocimiento:
// servicios, precios, horarios, ubicación, políticas y preguntas frecuentes.
//
// Por qué el paso de la IA: bajar el texto es fácil, pero una web trae menú,
// pie de página, banners de cookies y ruido. Lo que hoy cuesta 20–40 horas por
// cliente no es copiar el texto — es ordenarlo. Eso es lo que se automatiza.
//
// El resultado se guarda en agent_knowledge, que el cliente puede editar desde
// su portal. La vista agent_knowledge_prompt lo entrega listo para el agente.
//
// Deploy: node deploy-edge-fn.cjs cargar-conocimiento
// ============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SB = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SH = { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" };

// ── Límites: acotan costo y respetan el techo del producto estándar ──────────
const MAX_PAGINAS   = 6;
const MAX_BYTES_URL = 120_000;   // por página descargada
const MAX_BYTES_DOC = 40_000;    // el techo del producto estándar (ver schema-agente.sql)
const TIMEOUT_MS    = 12_000;

// Rutas que suelen tener lo que importa. Se buscan en los enlaces del sitio.
const RUTAS_UTILES = /(servicio|precio|tarifa|plan|tratamiento|contacto|ubicacion|horario|faq|pregunta|nosotros|quienes)/i;

function textoDesdeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enlacesInternos(html: string, base: URL): string[] {
  const vistos = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const u = new URL(m[1], base);
      if (u.hostname !== base.hostname) continue;
      if (!/^https?:$/.test(u.protocol)) continue;
      if (/\.(pdf|jpg|jpeg|png|webp|gif|svg|zip|mp4|css|js)$/i.test(u.pathname)) continue;
      if (!RUTAS_UTILES.test(u.pathname)) continue;
      u.hash = ""; u.search = "";
      vistos.add(u.toString());
    } catch (_) { /* enlace inválido, se ignora */ }
  }
  return [...vistos];
}

async function bajar(url: string): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      headers: { "User-Agent": "ToqueFlow/1.0 (+https://toqueflow.com)" },
    });
    if (!r.ok) return "";
    const ct = r.headers.get("content-type") || "";
    if (!/text\/html/i.test(ct)) return "";
    const html = (await r.text()).slice(0, MAX_BYTES_URL);
    return textoDesdeHtml(html);
  } catch (_) {
    return "";
  } finally {
    clearTimeout(t);
  }
}

const PROMPT = (negocio: string, crudo: string) => `Eres un asistente que prepara la base de conocimiento de un negocio para que un agente de WhatsApp pueda atender a sus clientes.

Abajo está el texto extraído del sitio web de "${negocio}". Viene sucio: trae restos de menús, pies de página y texto de relleno.

Escribe un documento de conocimiento limpio, en español, con esta estructura. Omite por completo las secciones para las que no encuentres información — no inventes ni pongas "no disponible".

## Qué es el negocio
Dos o tres frases.

## Servicios
Lista con nombre, descripción breve y precio si aparece. Respeta los precios EXACTOS como están escritos.

## Horarios
Los días y horas de atención.

## Ubicación y contacto
Direcciones, teléfonos, sedes.

## Políticas
Cancelaciones, reprogramaciones, formas de pago, requisitos.

## Preguntas frecuentes
Solo las que se puedan responder con el contenido.

REGLAS:
- No inventes NADA. Si un dato no está en el texto, no lo escribas.
- No copies menús de navegación, botones ni avisos de cookies.
- Los precios y los números van exactos, sin redondear ni convertir.
- Escribe para que lo lea un agente que va a responderle a un cliente, no para una página web.

TEXTO DEL SITIO:
${crudo}`;

async function registrarUso(usage: any, meta: any) {
  const ent = usage?.input_tokens ?? 0, sal = usage?.output_tokens ?? 0;
  // Haiku 4.5: 1 USD por millón de entrada, 5 por millón de salida (aprox.)
  const costo = (ent / 1e6) * 1 + (sal / 1e6) * 5;
  await fetch(SB + "/rest/v1/ai_usage", {
    method: "POST",
    headers: { ...SH, Prefer: "return=minimal" },
    body: JSON.stringify({
      company_id: meta.company_id, tool: "cargar-conocimiento",
      model: "claude-haiku-4-5-20251001",
      input_tokens: ent, output_tokens: sal, cost_usd: Number(costo.toFixed(6)),
    }),
  }).catch(() => {});
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ── ¿Quién llama? El company_id sale del PERFIL, nunca del payload ─────────
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sin sesión." }, 401);
  const meRes = await fetch(SB + "/auth/v1/user", { headers: { apikey: SERVICE, Authorization: "Bearer " + token } });
  if (!meRes.ok) return json({ error: "Sesión inválida." }, 401);
  const me = await meRes.json();
  const prof = await fetch(SB + "/rest/v1/profiles?id=eq." + me.id + "&select=company_id,status,role", { headers: SH })
    .then((r) => r.json()).catch(() => null);
  if (!Array.isArray(prof) || !prof[0] || prof[0].status !== "active") return json({ error: "Usuario sin acceso." }, 403);

  const body = await req.json().catch(() => ({} as any));
  // Un super admin puede cargar para cualquier empresa; un member solo la suya.
  const companyId = (prof[0].role === "super_admin" && body.company_id) ? body.company_id : prof[0].company_id;
  if (!companyId) return json({ error: "El usuario no tiene empresa asignada." }, 400);

  let base: URL;
  try { base = new URL(body.url); } catch (_) { return json({ error: "URL inválida." }, 400); }
  if (!/^https?:$/.test(base.protocol)) return json({ error: "La URL debe ser http o https." }, 400);

  // ── 1. Recorrer el sitio ──────────────────────────────────────────────────
  const portadaHtml = await fetch(base.toString(), { headers: { "User-Agent": "ToqueFlow/1.0" } })
    .then((r) => r.ok ? r.text() : "").catch(() => "");
  if (!portadaHtml) return json({ error: "No se pudo acceder al sitio. Revisa la URL." }, 422);

  const paginas = [base.toString(), ...enlacesInternos(portadaHtml, base)].slice(0, MAX_PAGINAS);
  const partes: string[] = [textoDesdeHtml(portadaHtml.slice(0, MAX_BYTES_URL))];
  for (const u of paginas.slice(1)) {
    const t = await bajar(u);
    if (t.length > 200) partes.push("\n\n--- " + u + " ---\n" + t);
  }

  const crudo = partes.join("\n").slice(0, MAX_BYTES_DOC * 3);
  if (crudo.length < 300) {
    return json({ error: "El sitio tiene muy poco texto legible. Puede estar hecho en JavaScript; carga la información en un PDF o a mano." }, 422);
  }

  // ── 2. Ordenarlo con IA ───────────────────────────────────────────────────
  const KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!KEY) return json({ error: "Falta ANTHROPIC_API_KEY en los secretos de la función." }, 500);

  const negocio = body.negocio || base.hostname;
  let ai: Response | null = null, ultimoErr = "";
  for (let intento = 1; intento <= 3; intento++) {
    try {
      ai = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 8000,
          messages: [{ role: "user", content: PROMPT(negocio, crudo) }],
        }),
      });
    } catch (e) { ai = null; ultimoErr = String(e); }
    if (ai && ai.ok) break;
    if (ai) ultimoErr = "HTTP " + ai.status;
    if (ai && ai.status < 500 && ai.status !== 429) break;
    await new Promise((r) => setTimeout(r, 500 * intento));
  }
  if (!ai || !ai.ok) return json({ error: "El servicio de IA no respondió. Intenta de nuevo en un momento. (" + ultimoErr + ")" }, 502);

  const out = await ai.json();
  const documento = (out.content?.[0]?.text || "").trim();
  if (!documento) return json({ error: "No se pudo ordenar el contenido del sitio." }, 422);
  await registrarUso(out.usage, { company_id: companyId });

  if (documento.length > MAX_BYTES_DOC) {
    return json({
      error: "El contenido del sitio supera el límite del producto estándar (" + Math.round(MAX_BYTES_DOC / 1000) + " KB). " +
             "Un catálogo de ese tamaño necesita otro enfoque; se cotiza aparte.",
      bytes: documento.length,
    }, 413);
  }

  // ── 3. Guardar ────────────────────────────────────────────────────────────
  const hash = [...documento].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16);

  // Si ya existía una fuente para esta misma URL, se reemplaza en vez de duplicar
  const previas = await fetch(
    SB + "/rest/v1/agent_knowledge?company_id=eq." + companyId + "&origen=eq." + encodeURIComponent(base.toString()) + "&select=id,hash_origen",
    { headers: SH },
  ).then((r) => r.json()).catch(() => []);

  if (Array.isArray(previas) && previas[0]?.hash_origen === hash) {
    return json({ ok: true, sin_cambios: true, bytes: documento.length, paginas: paginas.length,
                  mensaje: "El sitio no ha cambiado desde la última carga." });
  }

  if (Array.isArray(previas) && previas.length) {
    await fetch(SB + "/rest/v1/agent_knowledge?id=eq." + previas[0].id, {
      method: "PATCH", headers: { ...SH, Prefer: "return=minimal" },
      body: JSON.stringify({ contenido: documento, hash_origen: hash, titulo: "Sitio web — " + base.hostname, actualizado_por: me.id }),
    });
  } else {
    await fetch(SB + "/rest/v1/agent_knowledge", {
      method: "POST", headers: { ...SH, Prefer: "return=minimal" },
      body: JSON.stringify({
        company_id: companyId, tipo: "web", origen: base.toString(),
        titulo: "Sitio web — " + base.hostname, contenido: documento,
        hash_origen: hash, orden: 0, actualizado_por: me.id,
      }),
    });
  }

  return json({
    ok: true,
    paginas: paginas.length,
    paginas_leidas: paginas,
    bytes: documento.length,
    vista_previa: documento.slice(0, 600),
  });
});
