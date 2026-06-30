# WF-01 — Savia · Bot de Ventas WhatsApp

**Propósito:** workflow principal. Recibe cada mensaje entrante de WhatsApp Cloud API, persiste, clasifica intención, invoca al AI Agent con tools y responde.

**Trigger:** Webhook público (`/webhook/savia/wa`) configurado en Meta Cloud API.

**Etapas que cubre:** 1, 2, 3 y 4 del flujo de negocio.

---

## Diagrama lógico

```
[Webhook Meta WA Cloud]
   │
   ▼
[1. Verificar firma X-Hub-Signature-256]  ── falla ──► [Respond 401]
   │ ok
   ▼
[2. Normalizar payload]
   - extraer: telefono (E.164 sin '+'), mensaje, tipo (text/image/audio), media_id si aplica
   - filtrar status updates (delivered, read) → Respond 200 OK sin procesar
   │
   ▼
[3. UPSERT cliente]                              ─► retorna {cliente_nuevo, idioma}
   INSERT savia.clientes (telefono) ON CONFLICT
     DO UPDATE SET ultimo_contacto = now()
   │
   ▼
[4. Registrar contacto del día + contador atómico]
   helper (A) — ver 001_schema.sql
   ─► retorna {contactos_unicos, tarifa_premium_activada_ts}
   │
   ▼
[5. INSERT mensajes_logs (direccion='in')]
   │
   ▼
[6. ¿tarifa_premium acaba de cruzar el umbral?]
   IF contactos_unicos = 51 AND tarifa_premium_activada_ts IS NULL
     ─► [Execute WF-03 (async, no esperar)]
   │
   ▼
[7. Cargar historial conversación]
   SELECT últimos 20 mensajes de savia.mensajes_logs
   WHERE telefono = $1 ORDER BY ts DESC LIMIT 20
   ─► armar array de mensajes para el AI Agent
   │
   ▼
[8. AI Agent (Claude)]
   - system prompt: prompts/system_vendedor.md
   - tools: woocommerce_buscar_productos, kb_consultar,
            wompi_generar_payment_link, escalar_a_admin
   - context: { cliente_nuevo, idioma, historial }
   - max_iterations: 5
   │
   ▼
[9. Enviar respuesta a WhatsApp Cloud API]
   POST graph.facebook.com/v18.0/{phone_number_id}/messages
   - texto, o imagen si el agente decidió enviar foto de producto
   │
   ▼
[10. INSERT mensajes_logs (direccion='out')]
    metadata: { intent, tools_used, model, latency_ms }
   │
   ▼
[Respond 200 OK al webhook Meta]
```

---

## Detalle de los tools (HTTP Tool nodes en n8n)

### Tool 1: `woocommerce_buscar_productos`

Tipo: HTTP Request → WooCommerce REST API + filtro local.

```
GET {{$env.WOO_BASE_URL}}/wp-json/wc/v3/products
  ?stock_status=instock
  &per_page=10
  &search={{query}}
  &category={{categoria_id}}    (si aplica)
Auth: Basic (Consumer Key / Consumer Secret)
```

**Post-procesamiento (Code node JS):**
- Filtrar `stock_quantity > 0`.
- Si `talla` viene en params, filtrar variaciones donde `attributes.talla === talla && stock_quantity > 0`.
- Acortar a top 3 (criterio: mayor `stock_quantity`, luego precio menor).
- Retornar formato:
  ```json
  [{
    "woo_product_id": 1210,
    "nombre": "Legging Terra",
    "precio_cop": 159900,
    "tallas_disponibles": ["S","M","L"],
    "materiales": "Poliéster 78% / Elastano 22%",
    "url_imagen": "https://savia-wear.com/wp-content/uploads/...",
    "url_producto": "https://savia-wear.com/product/legging-terra/",
    "variaciones": [{"id":1211, "talla":"M", "stock":4}]
  }]
  ```

**Importante:** este tool prioriza datos vivos de Woo. Si Woo no responde en 5s, fallback a `savia.fichas_producto` con un warning en `metadata`.

---

### Tool 2: `kb_consultar`

Tipo: PostgreSQL query.

```sql
SELECT titulo, contenido
FROM savia.kb_documentos
WHERE activo = TRUE
  AND (topico = $1 OR $1 IS NULL)
  AND (
    keywords && string_to_array(lower($2), ' ')
    OR titulo ILIKE '%' || $2 || '%'
  )
LIMIT 3;
```

Si no hay match, retornar array vacío — el agente debe escalar.

---

### Tool 3: `wompi_generar_payment_link`

Tipo: subflujo (Execute Workflow) o secuencia de nodos.

**Lógica:**

1. **Re-validar stock** (HTTP a Woo, igual que Tool 1 pero solo para el `woo_product_id` y `talla` específicos).
2. Si stock = 0 → retornar:
   ```json
   { "error": "out_of_stock", "talla": "M",
     "alternativas": [<top 2 talas/productos similares>] }
   ```
3. Si stock OK → generar referencia interna: `SAVIA-{telefono}-{timestamp}`.
4. Llamar Wompi:
   ```
   POST {{$env.WOMPI_BASE_URL}}/payment_links
   Authorization: Bearer {{$env.WOMPI_PRIVATE_KEY}}
   Content-Type: application/json
   {
     "name": "Savia — {producto.nombre} talla {talla}",
     "description": "Compra en Savia Wear",
     "single_use": true,
     "collect_shipping": true,
     "currency": "COP",
     "amount_in_cents": {{precio_cop * 100}},
     "redirect_url": "{{$env.WOMPI_REDIRECT_URL}}",
     "customer_data": {
       "customer_references": [
         { "label": "reference", "value": "{{reference}}" },
         { "label": "telefono", "value": "{{telefono}}" }
       ]
     }
   }
   ```
5. INSERT en `savia.pedidos`:
   ```sql
   INSERT INTO savia.pedidos
     (telefono, woo_product_id, woo_variation_id, producto_nombre,
      talla, precio_cop, wompi_payment_link_id, wompi_payment_url,
      wompi_reference, estado)
   VALUES (...) RETURNING id;
   ```
6. UPDATE `savia.metricas_dia.pedidos_link_generado += 1`.
7. Retornar al agente:
   ```json
   { "url": "https://checkout.wompi.co/l/abc123",
     "pedido_id": 87,
     "expira_en_horas": 48 }
   ```

---

### Tool 4: `escalar_a_admin`

Tipo: PostgreSQL INSERT + HTTP Evolution API.

1. INSERT en `mensajes_logs` con `intent = 'escalamiento'` y metadata.motivo.
2. POST a Evolution API `savia-admin`:
   ```
   POST {{$env.EVOLUTION_API_URL}}/message/sendText/{{$env.EVOLUTION_INSTANCE_SAVIA_ADMIN}}
   Header: apikey {{$env.EVOLUTION_API_KEY}}
   {
     "number": "{{$env.ADMIN_PHONES.split(',')[0]}}",
     "text": "🚨 SAVIA — Escalamiento\nMotivo: {{motivo}}\nLead: {{telefono}}\nResumen:\n{{resumen}}"
   }
   ```
3. Retornar `{ ok: true }` al agente.

---

## Manejo de errores

- **Wompi 5xx**: reintento 1 vez con backoff 2s. Si falla, retornar al agente `{ error: "wompi_unavailable" }` y el agente avisa: *"Tuvimos un problemita con el sistema de pagos, en un momento te paso el link. Si prefieres te llamamos del equipo, dime."*
- **Woo 5xx o timeout**: fallback a `savia.fichas_producto` (cache).
- **PG caído**: WhatsApp recibe respuesta canned: *"Tenemos un inconveniente técnico, escríbenos en un ratito 🙏"*. n8n log error a Sentry/Telegram.
- **AI Agent error (rate limit, refusal)**: fallback genérico + INSERT en logs con `intent='error_agente'`.

---

## Idempotencia

WhatsApp Cloud reenvía mensajes si no respondes 200 OK en <20s. Para evitar dobles INSERT:

- Usar `messages[0].id` de Meta como `dedup_key` en `metadata` de `mensajes_logs`.
- Antes del INSERT, `SELECT 1 FROM savia.mensajes_logs WHERE metadata->>'meta_message_id' = $1 LIMIT 1`. Si existe, responder 200 y salir.

---

## Variables n8n usadas

`META_WA_PHONE_NUMBER_ID`, `META_WA_TOKEN`, `META_WA_VERIFY_TOKEN`, `META_WA_APP_SECRET`, `WOO_BASE_URL`, `WOO_CONSUMER_KEY`, `WOO_CONSUMER_SECRET`, `WOMPI_BASE_URL`, `WOMPI_PRIVATE_KEY`, `WOMPI_REDIRECT_URL`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_SAVIA_ADMIN`, `ADMIN_PHONES`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `SAVIA_PEDIDO_EXPIRA_HORAS`.
