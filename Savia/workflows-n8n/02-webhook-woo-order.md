# WF-02 — Savia · Webhook WooCommerce Order (confirmación de pago Mercado Pago)

**Propósito:** recibir los eventos `Order updated` de WooCommerce cuando Mercado Pago aprueba o rechaza el pago, verificar autenticidad HMAC, actualizar el pedido en DB y notificar a la clienta vía WhatsApp (Evolution).

**Trigger:** Webhook público (`/webhook/savia/woo-order`) registrado en WP Admin → WooCommerce → Settings → Advanced → Webhooks.
- Topic: `Order updated`
- Delivery URL: `https://n8n.srv1398596.hstgr.cloud/webhook/savia/woo-order`
- Secret: valor de `WC_WEBHOOK_SECRET`
- API version: WP REST API Integration v3

**Crear este webhook SOLO cuando WF-02 esté activo** — un webhook sobre un path inactivo devuelve 404 y WC marca el webhook como fallido después de 5 intentos.

---

## Diagrama lógico

```
[Webhook WooCommerce POST /webhook/savia/woo-order]
   │  body: { id, status, date_paid, total, billing, line_items, payment_method, transaction_id, ... }
   │  header: X-WC-Webhook-Signature: <base64_hmac_sha256>
   │           X-WC-Webhook-Delivery-ID: <uuid>
   ▼
[1. Verificar HMAC — Code JS]
   - HMAC-SHA256(rawBody, WC_WEBHOOK_SECRET) → base64
   - comparar con header X-WC-Webhook-Signature
   - si no coincide → INSERT eventos_pago (signature_ok=false) + Respond 401
   │ ok
   ▼
[2. Idempotencia — Postgres]
   INSERT INTO savia.eventos_pago (evento_id, woo_order_id, woo_status, ...)
   ON CONFLICT (evento_id) DO NOTHING
   RETURNING id
   - si NO retorna fila (ya procesado) → Respond 200 OK y salir
   │ es nuevo
   ▼
[3. Buscar pedido por woo_order_id — Postgres]
   SELECT id, telefono, producto_nombre, talla, precio_cop, estado
   FROM savia.pedidos
   WHERE woo_order_id = $1
   - si no encontramos → Respond 200 (pedido externo / directo en WC)
   │ encontrado
   ▼
[4. Switch por status del pedido WC]
   │
   ├─► "processing"  (Mercado Pago aprobó el pago)
   │     ├─► UPDATE pedidos SET estado='pago_confirmado',
   │     │        mp_transaction_id=$1, pago_at=now()
   │     │     WHERE woo_order_id=$2 AND estado='link_generado'
   │     ├─► UPDATE metricas_dia.pedidos_pago_confirmado += 1
   │     └─► Enviar WhatsApp vía Evolution (instancia `savia`):
   │           "pago aprobado! 🌿
   │            quedó registrado tu {producto} talla {talla}
   │            te avisamos cuando salga con guía de seguimiento"
   │
   ├─► "cancelled" / "failed"  (pago rechazado o cancelado en MP)
   │     ├─► UPDATE pedidos SET estado='pago_rechazado'
   │     ├─► UPDATE metricas_dia.pedidos_pago_rechazado += 1
   │     └─► Enviar WhatsApp vía Evolution:
   │           "el pago de {producto} no pudo procesarse
   │            ¿quieres que te genero un link nuevo para intentar de nuevo?"
   │
   └─► "on-hold" / otros → log + no hacer nada (MP puede poner on-hold para revisión)
   │
   ▼
[5. INSERT mensajes_logs + Respond 200 OK]
```

---

## Verificación HMAC (WooCommerce)

WooCommerce firma el body con HMAC-SHA256 usando el `WC_WEBHOOK_SECRET` y envía el hash en **base64** en el header `X-WC-Webhook-Signature`.

**Code node JS:**

```javascript
const crypto = require('crypto');
const secret = $env.WC_WEBHOOK_SECRET;
const signature = $request.headers['x-wc-webhook-signature'];
const rawBody = $request.rawBody;  // string sin parsear

if (!signature || !rawBody) {
  return [{ json: { valid: false, reason: 'missing_header_or_body' } }];
}

const expected = crypto
  .createHmac('sha256', secret)
  .update(rawBody, 'utf8')
  .digest('base64');

const parsedBody = JSON.parse(rawBody);
const valid = expected === signature;
return [{ json: { valid, woo_order_id: parsedBody.id, woo_status: parsedBody.status } }];
```

> En n8n, el nodo Webhook debe tener activada la opción **"Raw Body"** para que `$request.rawBody` esté disponible.

---

## Payload típico WooCommerce (Order updated → status: processing)

```json
{
  "id": 1042,
  "status": "processing",
  "date_paid": "2026-05-13T18:30:00",
  "total": "159900.00",
  "currency": "COP",
  "payment_method": "mercadopago",
  "payment_method_title": "Mercado Pago",
  "transaction_id": "1234567890",
  "billing": {
    "first_name": "Ana",
    "last_name": "",
    "email": "whatsapp@savia-wear.com",
    "phone": "3001234567"
  },
  "line_items": [
    {
      "name": "Legging Terra — S",
      "product_id": 88,
      "variation_id": 112,
      "quantity": 1,
      "total": "159900.00"
    }
  ],
  "meta_data": [
    { "key": "_savia_whatsapp", "value": "573001234567" }
  ]
}
```

---

## Mensajes al cliente — formato Evolution (texto plano WhatsApp)

**Pago aprobado (`processing`):**
```
pago aprobado! 🌿
quedó registrado tu {producto_nombre} talla {talla}
te avisamos cuando salga con el número de guía
```

**Pago rechazado (`cancelled` / `failed`):**
```
el pago de {producto_nombre} no pudo procesarse esta vez
¿quieres que te genero un link nuevo para intentar de nuevo?
```

---

## Queries SQL usados

**INSERT idempotente:**
```sql
INSERT INTO savia.eventos_pago
  (evento_id, woo_order_id, woo_status, mp_transaction_id, monto_cop, payload, signature_ok)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
ON CONFLICT (evento_id) DO NOTHING
RETURNING id;
```

**Buscar pedido por woo_order_id:**
```sql
SELECT id, telefono, producto_nombre, talla, precio_cop, estado
FROM savia.pedidos
WHERE woo_order_id = $1
LIMIT 1;
```

**Confirmar pago:**
```sql
UPDATE savia.pedidos
SET estado = 'pago_confirmado', mp_transaction_id = $1, pago_at = now()
WHERE woo_order_id = $2 AND estado = 'link_generado'
RETURNING id, telefono;
```

**Rechazar pago:**
```sql
UPDATE savia.pedidos
SET estado = 'pago_rechazado'
WHERE woo_order_id = $1 AND estado = 'link_generado'
RETURNING id, telefono;
```

---

## Variables n8n usadas

`WC_WEBHOOK_SECRET`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_SAVIA`.

---

## Manejo de errores

- **HMAC inválido**: INSERT `signature_ok=false` + Respond 401. Nunca procesar sin verificar.
- **Pedido no encontrado**: log + Respond 200 (evita reintentos infinitos — WC reintenta hasta 5 veces con backoff).
- **Doble webhook**: cubierto por `eventos_pago.evento_id UNIQUE` (WC reenvía si no recibe 200).
- **Evolution falla al enviar**: pedido ya actualizado en DB; reintento manual hasta Sprint 2.
- **`on-hold`**: MP puede poner en espera por revisión antifraude — no notificar, esperar `processing`.
