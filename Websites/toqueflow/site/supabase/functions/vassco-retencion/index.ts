// vassco-retencion — Edge Function de Supabase (cerebro tributario de Vassco).
// Recibe los datos de una factura de compra (ya extraídos del XML por el Apps Script)
// y devuelve: concepto, tipo de bien y las RETENCIONES SUGERIDAS (RF / ReteICA) con
// las reglas 2026 congeladas. Claude (Haiku) solo se usa para CLASIFICAR cuando el
// proveedor es nuevo/ambiguo; si ya viene el concepto conocido, no gasta tokens.
//
// Regla de oro: ante cualquier duda, marca `revisar: true` y nunca "inventa" una
// retención en firme — el humano aprueba. (MVP con revisión humana.)
//
// Secretos (Edge Functions → Secrets):
//   ANTHROPIC_API_KEY_VASSCO = sk-ant-...  (key del workspace "Vassco", para costo separado)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ── Parámetros tributarios 2026 (congelados en vassco-retenciones-2026.md) ──
const UVT = 52374; // Res. DIAN 000238 de 2025
const RF = {
  agropecuario_sin_procesar: { baseMin: 92 * UVT, tarifa: 0.015 },        // víveres: carne, pollo, fruver
  compra_general:            { baseMin: 10 * UVT, tarifaDecl: 0.025, tarifaNoDecl: 0.035 }, // desde 1-jul-2026
  servicio:                  { baseMin: 4 * UVT,  tarifaDecl: 0.04,  tarifaNoDecl: 0.06 },
};
const ICA_BASE_MIN = { compra: 27 * UVT, servicio: 4 * UVT };

// Perfil de Vassco confirmado por el RUT (27-oct-2025): Régimen ORDINARIO + agente de
// retención de renta (cód. 07) → SÍ retiene. No gran contribuyente ni autorretenedor.
// Responsable de IVA (48) e INC (33). Agente de ReteICA Bogotá (inferido del historial).
const VASSCO_PERFIL = { es_agente_renta: true, es_agente_ica: true, gran_contribuyente: false, autorretenedor: false };

// Precio Claude Haiku 4.5 (USD/MTok) — mismo criterio que rappi-print.
const PRICE_IN = 1.0, PRICE_OUT = 5.0;

const PROMPT = (nombre: string, items: string[]) => `Eres un asistente contable en Colombia.
Clasifica esta factura de COMPRA de un restaurante según sus ítems.
Proveedor: ${nombre}
Ítems: ${items.slice(0, 30).join("; ")}

Devuelve SOLO un JSON con esta estructura exacta (sin markdown ni explicación):
{
  "concepto": "string – etiqueta corta en MAYÚSCULA del rubro (ej. POLLO, CARNE, FRUVER, ABARROTES, LICOR, LACTEOS, SERVICIOS, PAPELERIA...)",
  "tipo_bien": "uno de: agropecuario_sin_procesar | compra_general | servicio",
  "confianza": "uno de: alta | media | baja"
}
Guía para tipo_bien:
- agropecuario_sin_procesar: frutas, verduras, carne, pollo, pescado, huevos, leche cruda — sin procesamiento industrial.
- compra_general: abarrotes, licores, embutidos, gaseosas, empaques, insumos procesados, papelería.
- servicio: mano de obra, mantenimiento, honorarios, transporte, arrendamiento.`;

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
      company_id: meta.company_id || null, tool: "vassco-retencion",
      model: "claude-haiku-4-5-20251001",
      input_tokens: inTok, output_tokens: outTok, cost_usd: Number(cost.toFixed(6)),
      success: meta.success !== false,
    }),
  }).catch(() => {});
}

// Clasifica con Claude (con reintentos). Devuelve {concepto, tipo_bien, confianza, usage} o null.
async function clasificar(nombre: string, items: string[]): Promise<any> {
  const KEY = Deno.env.get("ANTHROPIC_API_KEY_VASSCO");
  if (!KEY) return null;
  let ai: Response | null = null, lastErr = "";
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      ai = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 200,
          messages: [{ role: "user", content: PROMPT(nombre, items) }] }),
      });
    } catch (e) { ai = null; lastErr = String(e); }
    if (ai && ai.ok) break;
    const status = ai ? ai.status : 0;
    if (ai) lastErr = "HTTP " + status;
    if (!(!ai || status >= 500 || status === 429) || attempt === 4) break;
    await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt - 1)));
  }
  if (!ai || !ai.ok) { console.error("Claude falló:", lastErr); return null; }
  const out = await ai.json();
  let raw = (out.content?.[0]?.text || "").replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  try { const d = JSON.parse(raw); d.usage = out.usage; return d; } catch { return null; }
}

// Aplica las reglas 2026 → retenciones sugeridas (determinístico).
function calcularRetenciones(tipoBien: string, base: number, fecha: string, prov: any, vassco: any) {
  const notas: string[] = [];
  const declarante = prov?.declarante !== false;        // por defecto declarante
  const provSimple = prov?.regimen_simple === true;     // proveedor en Régimen Simple → NO se le retiene
  const esAgenteRenta = vassco?.es_agente_renta;        // del RUT de Vassco
  const esAgenteIca = vassco?.es_agente_ica;

  // Base de compras generales cambió a mitad de 2026 (10 UVT desde 1-jul; 27 UVT durante la suspensión).
  const antesDeJulio = fecha && fecha < "2026-07-01";
  const baseMinCompra = antesDeJulio ? 27 * UVT : RF.compra_general.baseMin;

  let rf = { valor: 0, tarifa: 0, base_min: 0, aplica: false, motivo: "" };
  if (esAgenteRenta === false) { rf.motivo = "Vassco no es agente de retención de renta"; }
  else if (provSimple) { rf.motivo = "proveedor en Régimen Simple → no se practica retefuente"; }
  else {
    if (esAgenteRenta === undefined) notas.push("Régimen de Vassco sin confirmar (RUT pendiente)");
    if (tipoBien === "agropecuario_sin_procesar") {
      const r = RF.agropecuario_sin_procesar; rf.tarifa = r.tarifa; rf.base_min = r.baseMin;
      rf.aplica = base >= r.baseMin; rf.valor = rf.aplica ? Math.round(base * r.tarifa) : 0;
      rf.motivo = rf.aplica ? "víveres 1,5%" : "base < 92 UVT (" + Math.round(r.baseMin).toLocaleString("es-CO") + ")";
    } else if (tipoBien === "servicio") {
      const r = RF.servicio; rf.tarifa = declarante ? r.tarifaDecl : r.tarifaNoDecl; rf.base_min = r.baseMin;
      rf.aplica = base >= r.baseMin; rf.valor = rf.aplica ? Math.round(base * rf.tarifa) : 0;
      rf.motivo = rf.aplica ? "servicios" : "base < 4 UVT";
    } else { // compra_general
      const r = RF.compra_general; rf.tarifa = declarante ? r.tarifaDecl : r.tarifaNoDecl; rf.base_min = baseMinCompra;
      rf.aplica = base >= baseMinCompra; rf.valor = rf.aplica ? Math.round(base * rf.tarifa) : 0;
      rf.motivo = rf.aplica ? "compras generales" : "base < " + (antesDeJulio ? "27" : "10") + " UVT";
    }
  }

  // ReteICA: requiere actividad CIIU del proveedor (tarifa por mil) → por ahora se marca a revisar.
  let ica = { valor: 0, aplica: false, motivo: "" };
  if (esAgenteIca === false) ica.motivo = "Vassco no es agente de retención de ICA";
  else { ica.motivo = "pendiente: tarifa por mil según actividad del proveedor (RUT/cartilla Bogotá)"; notas.push("ReteICA sin calcular"); }

  return { rf, ica, notas };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let p: any = {};
  try { p = await req.json(); } catch { /* noop */ }
  const total = Number(p.total || 0);
  const base = Number(p.base_gravada || 0) + Number(p.base_no_gravada || 0) || total;
  const items: string[] = Array.isArray(p.items) ? p.items : [];

  // 1) Clasificar (usa el concepto conocido si viene; si no, pide a Claude).
  let concepto = p.concepto_conocido || "";
  let tipoBien = p.tipo_bien || "";
  let usage: any = null, revisarClasif = false;
  if (!concepto || !tipoBien) {
    const c = await clasificar(p.emisor_nombre || "", items);
    if (c) {
      concepto = concepto || c.concepto || "";
      tipoBien = tipoBien || c.tipo_bien || "compra_general";
      usage = c.usage;
      revisarClasif = c.confianza !== "alta";
    } else {
      tipoBien = tipoBien || "compra_general";
      revisarClasif = true; // sin clasificación → a revisar
    }
  }

  // 2) Reglas 2026 → retenciones sugeridas (perfil de Vassco confirmado por RUT, overridable).
  const vassco = { ...VASSCO_PERFIL, ...(p.vassco || {}) };
  const { rf, ica, notas } = calcularRetenciones(tipoBien, base, p.fecha || "", p.proveedor, vassco);
  const revisar = revisarClasif || rf.aplica || ica.aplica || notas.length > 0;
  const vrPagar = Math.round(total - rf.valor - ica.valor);

  await logUsage(usage, { company_id: p.company_id, success: true });

  return json({
    concepto, tipo_bien: tipoBien,
    rf, ica, vr_total: total, vr_pagar: vrPagar,
    revisar, notas,
  });
});
