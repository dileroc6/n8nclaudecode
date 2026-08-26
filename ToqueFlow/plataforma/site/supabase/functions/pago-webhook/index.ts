// pago-webhook — Edge Function de Supabase (receptor de la pasarela de pagos).
// Pasarela de Bejauha = ePayco (también soporta Wompi y genérico). La pasarela hace
// POST aquí (URL de confirmación) cuando cambia el estado de una transacción.
// Flujo del contrato Toque↔n8n:
//   1) Verifica la firma de la pasarela (rechaza lo no firmado).
//   2) Normaliza el evento a {provider, external_ref, status, amount, currency, ref}.
//   3) Resuelve el tenant (company_slug→company_id) y el contacto (phone→contact_id + service_type).
//   4) UPSERT en `payments` (idempotente por provider+external_ref) — es el estado/histórico.
//   5) Si status='failed' → inserta en el outbox `n8n_events` el evento `pago_fallido`
//      con aplica_deudor = (service_type === 'paquete').  n8n hace el resto.
//
// Deudor SOLO aplica a paquetes: se manda service_type + aplica_deudor precalculado
// para que n8n no re-derive la regla de negocio.
//
// Secretos (Edge Functions → Secrets):
//   EPAYCO_P_CUST_ID  = P_CUST_ID_CLIENTE de ePayco (público).   ← pasarela de Bejauha
//   EPAYCO_P_KEY      = P_KEY de ePayco (privada, secreta). Se usa para validar x_signature.
//   WOMPI_EVENTS_SECRET = (opcional) secreto de eventos de Wompi, si la pasarela fuera Wompi.
//   PAGO_WEBHOOK_SECRET = (opcional) secreto compartido genérico (HMAC del body).
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
//
// ePayco → configurar la "URL de Respuesta/Confirmación" apuntando a esta función, y
// mandar en la compra: x_extra1 = company_slug (ej. "bejauha"), x_extra2 = teléfono E.164.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-toque-signature, x-event-checksum",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SB = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SH = { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" };

// ── Verificación de firma ─────────────────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Comparación en tiempo constante (evita timing attacks).
function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

// Devuelve true si la firma es válida (o si no hay secreto configurado → modo abierto de dev).
async function verify(req: Request, rawBody: string, parsed: any): Promise<boolean> {
  const wompiSecret = Deno.env.get("WOMPI_EVENTS_SECRET");
  const shared = Deno.env.get("PAGO_WEBHOOK_SECRET");
  const epaycoKey = Deno.env.get("EPAYCO_P_KEY");
  const epaycoCust = Deno.env.get("EPAYCO_P_CUST_ID");

  // 0) ePayco: x_signature = SHA256( p_cust_id_cliente ^ p_key ^ x_ref_payco ^ x_transaction_id ^ x_amount ^ x_currency_code )
  if (epaycoKey && epaycoCust && parsed?.x_signature) {
    try {
      const concat = [epaycoCust, epaycoKey, parsed.x_ref_payco, parsed.x_transaction_id, parsed.x_amount, parsed.x_currency_code].join("^");
      const expected = await sha256Hex(concat);
      return safeEq(expected.toLowerCase(), String(parsed.x_signature).toLowerCase());
    } catch { return false; }
  }

  // 1) Wompi: checksum SHA256 de (propiedades ++ timestamp ++ secret).
  if (wompiSecret && parsed?.signature?.checksum) {
    try {
      const props: string[] = parsed.signature.properties || [];
      const tx = parsed.data?.transaction || {};
      const concat = props.map((p: string) => p.split(".").reduce((o: any, k: string) => (o ? o[k] : undefined), { transaction: tx }))
        .join("") + String(parsed.timestamp ?? "") + wompiSecret;
      const expected = await sha256Hex(concat);
      return safeEq(expected.toLowerCase(), String(parsed.signature.checksum).toLowerCase());
    } catch { return false; }
  }

  // 2) Secreto compartido genérico: HMAC-SHA256 del body crudo en header X-Toque-Signature.
  if (shared) {
    const header = (req.headers.get("x-toque-signature") || "").replace(/^sha256=/i, "").trim();
    if (!header) return false;
    const expected = await hmacHex(shared, rawBody);
    return safeEq(expected.toLowerCase(), header.toLowerCase());
  }

  // 3) Sin secreto configurado → dev abierto (loguea advertencia).
  console.warn("pago-webhook: sin secreto configurado, aceptando sin verificar firma (solo dev).");
  return true;
}

// ── Normalización del payload de la pasarela → forma canónica ─────────────────
// Adaptar aquí cada pasarela. Incluye adaptador Wompi + passthrough genérico.
function normalize(p: any): {
  provider: string; external_ref: string; status: "paid" | "failed" | "pending" | "refunded";
  amount: number | null; currency: string; company_slug: string | null; phone: string | null; reason: string;
} {
  // ePayco: campos x_... (form). x_cod_respuesta: 1=Aceptada, 2=Rechazada, 3=Pendiente, 4=Fallida.
  // Convención: x_extra1 = company_slug, x_extra2 = teléfono E.164 del cliente.
  if (p.x_ref_payco || p.x_cod_respuesta) {
    const cod = String(p.x_cod_respuesta || "");
    const status = cod === "1" ? "paid" : (cod === "2" || cod === "4") ? "failed" : "pending";
    return {
      provider: "epayco",
      external_ref: String(p.x_ref_payco || p.x_transaction_id || ""),
      status,
      amount: p.x_amount != null ? Number(p.x_amount) : null,
      currency: String(p.x_currency_code || "COP"),
      company_slug: (p.x_extra1 || p.company_slug || null),
      phone: (p.x_extra2 || p.telefono || null),
      reason: String(p.x_response_reason_text || p.x_respuesta || ""),
    };
  }

  // Wompi: p.data.transaction.{id,status,amount_in_cents,currency,reference,customer_data...}
  const tx = p?.data?.transaction;
  if (tx) {
    const st = String(tx.status || "").toUpperCase();
    const status = st === "APPROVED" ? "paid" : st === "DECLINED" || st === "ERROR" || st === "VOIDED" ? "failed" : "pending";
    // reference se usa como canal para el tenant: "bejauha:+573001112233:..." o un JSON en metadata.
    const ref = String(tx.reference || "");
    const parts = ref.split(":");
    return {
      provider: "wompi",
      external_ref: String(tx.id || ref),
      status,
      amount: tx.amount_in_cents != null ? Number(tx.amount_in_cents) / 100 : null,
      currency: String(tx.currency || "COP"),
      company_slug: (p?.company_slug || parts[0] || null),
      phone: (p?.telefono || tx?.customer_data?.phone_number || parts[1] || null),
      reason: String(tx.status_message || tx.status || ""),
    };
  }

  // Genérico: la plataforma/pasarela ya manda la forma canónica.
  const st = String(p.status || "").toLowerCase();
  const status = ["paid", "failed", "pending", "refunded"].includes(st) ? st : "pending";
  return {
    provider: String(p.provider || "generico"),
    external_ref: String(p.external_ref || p.reference || p.id || ""),
    status: status as any,
    amount: p.amount != null ? Number(p.amount) : null,
    currency: String(p.currency || "COP"),
    company_slug: p.company_slug || null,
    phone: p.telefono || p.phone || null,
    reason: String(p.reason || p.motivo || ""),
  };
}

// ── Helpers REST (service role) ───────────────────────────────────────────────
const rest = (path: string, opts: RequestInit = {}) =>
  fetch(SB + "/rest/v1/" + path, { ...opts, headers: { ...SH, ...(opts.headers || {}) } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const rawBody = await req.text();
  // ePayco manda form-urlencoded (x_...); Wompi/otros mandan JSON.
  let p: any = {};
  try {
    p = JSON.parse(rawBody);
  } catch {
    p = {};
    for (const [k, v] of new URLSearchParams(rawBody)) p[k] = v;
    if (!Object.keys(p).length) return json({ error: "Body ilegible" }, 400);
  }

  // 1) Firma
  if (!(await verify(req, rawBody, p))) return json({ error: "Firma inválida" }, 401);

  // 2) Normalizar
  const n = normalize(p);
  if (!n.external_ref) return json({ error: "Sin referencia de transacción" }, 400);

  // 3) Resolver tenant (company_slug → company_id) y contacto (phone → id + service_type)
  let company_id: string | null = null;
  if (n.company_slug) {
    const c = await rest("companies?slug=eq." + encodeURIComponent(n.company_slug) + "&select=id").then((r) => r.json());
    company_id = Array.isArray(c) && c[0] ? c[0].id : null;
  }
  if (!company_id) return json({ error: "No se pudo resolver el tenant (company_slug)" }, 422);

  let contact_id: string | null = null, service_type: string | null = null;
  if (n.phone) {
    const q = "contacts?company_id=eq." + company_id + "&phone=eq." + encodeURIComponent(n.phone) + "&select=id,service_type";
    const ct = await rest(q).then((r) => r.json());
    if (Array.isArray(ct) && ct[0]) { contact_id = ct[0].id; service_type = ct[0].service_type; }
  }

  // 4) UPSERT payments (idempotente por provider+external_ref)
  const row = {
    company_id, contact_id, amount: n.amount, currency: n.currency, status: n.status,
    provider: n.provider, external_ref: n.external_ref, reason: n.reason, raw: p,
  };
  const up = await rest("payments?on_conflict=company_id,provider,external_ref", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(row),
  });
  if (!up.ok) return json({ error: "No se pudo guardar el pago: " + (await up.text()).slice(0, 200) }, 502);
  const saved = (await up.json())[0] || {};

  // 5) Si falló → encolar pago_fallido en el outbox
  let enqueued = false;
  if (n.status === "failed") {
    const aplica_deudor = service_type === "paquete";
    const evt = {
      company_id,
      event: "pago_fallido",
      payload: {
        company_id,
        company_slug: n.company_slug,
        contact_id,
        telefono: n.phone,
        service_type,
        aplica_deudor,
        payment: {
          payment_id: saved.id || null,
          monto: n.amount,
          moneda: n.currency,
          referencia: n.external_ref,
          proveedor: n.provider,
          motivo: n.reason,
          intento: saved.attempt || 1,
          fecha: saved.created_at || new Date().toISOString(),
        },
      },
    };
    const e = await rest("n8n_events", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(evt) });
    enqueued = e.ok;
    if (!e.ok) console.error("pago-webhook: no se pudo encolar pago_fallido:", (await e.text()).slice(0, 200));
  }

  return json({ ok: true, status: n.status, payment_id: saved.id || null, pago_fallido_encolado: enqueued });
});
