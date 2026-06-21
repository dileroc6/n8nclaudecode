// rappi-print — Edge Function de Supabase.
// 1) Parsea el texto de un pedido Rappi con Claude Haiku.
// 2) Lo manda al Apps Script del Google Sheet "Backup Recibos Rappi" (append).
// 3) Devuelve el pedido en JSON para que la página arme el recibo 80mm.
//
// Secretos (Edge Functions → Secrets):
//   ANTHROPIC_API_KEY    = sk-ant-...
//   RAPPI_SHEET_WEBHOOK  = URL del Web App de Apps Script (termina en /exec)
//   RAPPI_SHEET_TOKEN    = un token secreto compartido con el Apps Script

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const PROMPT = (texto: string) => `El siguiente texto fue copiado de una página de pedidos de Rappi.
Contiene información irrelevante (nombre del repartidor, texto de botones, etiquetas de sección, etc.).
Extrae SOLO estos datos y devuelve un JSON con esta estructura exacta:
{
  "order_id": "string – ID numérico de la orden (busca 'ID de la orden' o similar)",
  "customer_name": "string – nombre del cliente (busca 'Cliente')",
  "customer_cedula": "string – cédula o NIT del cliente si aparece, sino null",
  "tipo": "string – tipo de pedido si aparece (domicilio, recoge en tienda...), sino null",
  "items": [
    {"qty": number, "name": "string – nombre completo del producto", "price": number}
  ],
  "subtotal": number,
  "discount": number,
  "total": number,
  "timestamp": "string – fecha y hora del pedido si aparece, sino null"
}
Reglas:
- Puede haber 1 o muchos productos — extrae TODOS los que encuentres
- Los precios son COP; elimina puntos de miles y símbolos ($, .)
- discount es positivo (luego se muestra como negativo en el recibo)
- Si un campo no aparece, usa null
- Responde SOLO con el JSON, sin explicaciones ni markdown

Texto del pedido:
${texto}`;

// Precio aprox. de Claude Haiku 4.5 (USD por millón de tokens). Ajustable.
const PRICE_IN = 1.0;   // input  $/MTok
const PRICE_OUT = 5.0;  // output $/MTok

// Backup: manda el pedido al Apps Script del Sheet (best-effort). `tab` = pestaña por sede.
async function appendToSheet(data: any, tab: string | null): Promise<void> {
  const url = Deno.env.get("RAPPI_SHEET_WEBHOOK");
  if (!url) return; // sin webhook → no se hace backup (no rompe la impresión)
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: Deno.env.get("RAPPI_SHEET_TOKEN") || "", tab: tab || "", ...data }),
  });
}

// Registra cada ejecución (tokens, costo USD, éxito/fallo) en ai_usage (best-effort).
async function logUsage(usage: any, meta: any): Promise<void> {
  const SB = Deno.env.get("SUPABASE_URL");
  const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SB || !KEY) return;
  const inTok = usage ? (usage.input_tokens || 0) : 0;
  const outTok = usage ? (usage.output_tokens || 0) : 0;
  const cost = (inTok / 1e6) * PRICE_IN + (outTok / 1e6) * PRICE_OUT;
  await fetch(SB.replace(/\/+$/, "") + "/rest/v1/ai_usage", {
    method: "POST",
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      company_id: meta.company_id || null, sede: meta.sede || null, sede_id: meta.sede_id || null,
      tool: "rappi-print", model: "claude-haiku-4-5-20251001",
      input_tokens: inTok, output_tokens: outTok, cost_usd: Number(cost.toFixed(6)),
      success: meta.success !== false,
    }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!KEY) return json({ error: "Falta ANTHROPIC_API_KEY en los secretos de la función." }, 500);

  let payload: any = {};
  try { payload = await req.json(); } catch (_) { /* noop */ }
  const pedido = payload.pedido || "";
  const meta = { company_id: payload.company_id, sede: payload.sede, sede_id: payload.sede_id };
  if (!pedido.trim()) return json({ error: "Pega el texto del pedido." }, 400);

  const ai = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 700, messages: [{ role: "user", content: PROMPT(pedido) }] }),
  });
  if (!ai.ok) {
    try { await logUsage(null, { ...meta, success: false }); } catch (_) {}
    return json({ error: "Error de Claude: " + (await ai.text()).slice(0, 200) }, 502);
  }

  const out = await ai.json();
  let raw = (out.content && out.content[0] && out.content[0].text) || "";
  raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let data: any;
  try { data = JSON.parse(raw); }
  catch (_) {
    try { await logUsage(out.usage, { ...meta, success: false }); } catch (_e) {}
    return json({ error: "No pude interpretar el pedido. Revisa el texto pegado." }, 422);
  }

  // Backup al Sheet (pestaña por sede) + registro de consumo (best-effort).
  try { await appendToSheet(data, payload.tab || null); } catch (e) { console.error("Sheet backup falló:", e); }
  try { await logUsage(out.usage, { ...meta, success: true }); } catch (e) { console.error("logUsage falló:", e); }

  return json(data);
});
