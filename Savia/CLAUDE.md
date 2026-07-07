# CLAUDE.md — Savia Wear Sales Agent
### Proyecto N8N-ClaudeCode | Activewear femenino | Agente de Ventas Autónomo (WhatsApp + WooCommerce + Mercado Pago)

> Este archivo es la fuente de verdad del proyecto Savia para Claude Code.
> Contiene toda la lógica de negocio, decisiones de arquitectura, restricciones críticas
> y el contexto necesario para construir, modificar o depurar cualquier workflow del cliente.
> No repetir este contexto en los prompts de cada sesión.

---

## 1. Identidad del cliente

| Campo | Valor |
|---|---|
| **Marca** | Savia Wear |
| **Sitio** | https://savia-wear.com/ |
| **Industria** | Ropa deportiva / activewear femenino |
| **Mercado** | Colombia (COP) |
| **Catálogo** | Colección **Essential** — Tops, Leggings, Sets (one-piece). Líneas: Terra, Natura, Esencia, Equilibrio |
| **Ticket promedio** | $90.000 – $250.000 COP |
| **Tono de marca** | "No sigas rutinas, sigue tu energía" — aspiracional, cálido, dual entreno+casual. Sin jerga fitness técnica |
| **Idioma del bot** | Español neutro (CO) |
| **Canal cliente** | WhatsApp Business — número `[COMPLETAR ANTES DE DEPLOY]` |
| **Redes** | IG `@saviawear` · TikTok `@saviawear` |
| **Responsable técnico** | `[COMPLETAR]` |

---

## 2. Misión del agente

**Venta activa, no atención al cliente.** El agente debe:

1. Saludar y calificar la intención del lead (consulta general vs. interés de compra).
2. Recomendar productos del catálogo en función del uso, talla y estilo.
3. Gestionar objeciones de **tallas, estilo, comodidad, materiales** con información real (nunca inventar).
4. Generar **pedido WooCommerce con link de pago Mercado Pago** cuando hay intención de compra concreta.
5. Notificar al cliente la confirmación del pago al recibir el webhook de WooCommerce.
6. Loguear cada interacción con su `intent` clasificada para optimización del embudo.

**Lo que el agente NO hace:**
- No valida transferencias bancarias (no existe ese flujo en Sprint 1).
- No promete despachos ni fechas que no estén documentadas en el KB.
- No habla de precios o stock sin consultar la WooCommerce REST API en vivo.
- No envía mensajes proactivos fuera de la ventana 24h sin template Meta aprobado.

---

## 3. Stack técnico

| Componente | Detalle |
|---|---|
| **Canal cliente + admin** | WhatsApp vía **Evolution API v2** (instancia única `savia`, mismo patrón que Zoe) — admin se filtra por `SAVIA_ADMIN_PHONES` |
| **Idempotencia** | Tabla `mensajes_logs.metadata->'evolution_message_id'` con SELECT pre-INSERT |
| **Orquestador** | n8n self-hosted (VPS Hostinger) |
| **IA** | OpenAI GPT-4o — AI Agent nativo de n8n con tools |
| **Catálogo + stock** | **WooCommerce REST API** (`/wp-json/wc/v3/`) con Consumer Key/Secret |
| **Pagos online** | **WooCommerce + plugin Mercado Pago del sitio** — el bot crea un pedido vía `POST /wp-json/wc/v3/orders` (payment_method=mercadopago, status=pending) y envía la `checkout_payment_url` que devuelve WC. Mercado Pago se gestiona desde el sitio, NO desde n8n. |
| **Base de datos** | PostgreSQL del VPS — schema dedicado `savia` (aislamiento por cliente, misma DB `leadai`) |
| **KB de marca** | Tabla `savia.kb_documentos` (tallas, materiales, política de cambios, FAQ) — consultable por el AI Agent vía tool |

---

## 4. Flujo de negocio (Sprint 1)

### ETAPA 1 — Captación + clasificación
- Lead escribe al WhatsApp Business de Savia.
- Webhook de WhatsApp Cloud API → n8n WF-01.
- **Aviso de privacidad inicial** (Ley 1581 CO) en el primer mensaje de la sesión si el `telefono` no existe en `savia.clientes`.
- AI Agent clasifica `intent` en uno de: `saludo`, `consulta_general`, `consulta_producto`, `consulta_talla`, `objecion_estilo`, `intencion_compra`, `pago_pregunta`, `queja`, `otro`.
- INSERT idempotente en `savia.contactos_dia` → checkpoint del contador.
- INSERT en `savia.mensajes_logs`.

### ETAPA 2 — Consulta de catálogo (tool calling)
- Cuando `intent ∈ {consulta_producto, consulta_talla, intencion_compra}` el agente invoca el tool `woocommerce_buscar_productos(query, atributos)`.
- El tool retorna **solo productos con `stock_status = instock` y `stock_quantity > 0`**, máx. 3 resultados, con: nombre, precio, tallas disponibles, materiales, URL imagen, ID producto.
- Si no hay match → tool `kb_consultar(pregunta)` para FAQ general (tallaje, envíos, cambios).

### ETAPA 3 — Gestión de objeciones
- Tallas: el agente consulta `savia.fichas_producto.guia_tallas_json` (sincronizado desde atributos Woo).
- Estilo: el agente sugiere alternativas dentro del mismo rango de precio y línea.
- Materiales: respuesta extraída de `savia.fichas_producto.materiales`.
- **Restricción crítica**: si el agente no tiene la respuesta documentada, debe decir "déjame consultarlo con el equipo" y NO inventar — escalar a admin vía WF-04.

### ETAPA 4 — Cierre + Pedido WooCommerce
- Cuando el lead confirma producto + talla + intención de pago → AI Agent invoca tool `crear_pedido_woo(producto_id, variante_id, talla, cantidad, telefono, nombre)`.
- El tool:
  1. **Re-valida stock en vivo** consultando Woo (no confía en la cotización anterior).
  2. Si stock OK → `POST /wp-json/wc/v3/orders` con `payment_method=mercadopago`, `status=pending`, `line_items`, `billing`.
  3. WooCommerce crea el pedido y devuelve `checkout_payment_url` — URL de pago con Mercado Pago integrado.
  4. INSERT en `savia.pedidos` con estado `link_generado`, guarda `woo_order_id` y `pago_url`.
  5. Retorna la `pago_url` al agente para enviar al cliente.
- El agente envía al lead: link + recordatorio de talla + nota sobre tiempos de despacho.

### ETAPA 5 — Confirmación de pago (WF-02)
- Webhook `Order updated` de WooCommerce → n8n WF-02 con verificación HMAC (`X-WC-Webhook-Signature`).
- Si `status = processing` (Mercado Pago aprobó el pago):
  - UPDATE `savia.pedidos.estado = 'pago_confirmado'`, set `mp_transaction_id`, `pago_at`.
  - Mensaje al cliente vía Evolution: confirmación + próximos pasos (despacho + tracking).
- Si `status = cancelled` o `failed`: UPDATE estado `pago_rechazado` + mensaje al cliente ofreciendo link nuevo.

### ETAPA 6 — Alerta de Tarifa Premium (WF-03)
- Cuando `contactos_unicos` del día cruza `> 50` por primera vez → trigger.
- WF-03 envía mensaje al admin vía Evolution API (instancia `savia-admin`) con el resumen del día:
  ```
  🔔 SAVIA — Tarifa Premium activada
  Hoy: 51 contactos únicos
  Mensajes totales: 312
  Pedidos generados (link enviado): 18
  Pedidos confirmados: 11
  Conversión hoy: 21.5%
  ```
- UPDATE `savia.metricas_dia.tarifa_premium_activada_ts = now()` para idempotencia.

---

## 5. Workflows en n8n

| ID | Nombre en n8n | Cubre | Estado |
|---|---|---|---|
| WF-01 | `Savia — Bot Ventas WhatsApp (WF-01)` | Etapas 1–4 + comprobante transferencia + fotos | 🟢 ID `JkW5xEbusWOJKI1R` · **57 nodos** · **activo** (vía `dev-router`) — Hybrid Guardian + AI Parse autoritativo + Chain A (Nequi) + Chain B (comprobante) + Chain MP + **Rama de fotos determinística** (Guardian detecta estado "ofreció fotos" → mini-IA selecciona ids → Query `fichas_producto` → envío múltiple con `Send Momento` + delays escalonados) + trigger follow-up |
| WF-02 | `Savia — Webhook WooCommerce Order (WF-02)` | Etapa 5 (MP) | 🟢 ID `qOwllAj32Pwo5l5g` · 15 nodos · **activo** — ignora pedidos transferencia (los maneja WF-04) |
| WF-03 | `Savia — Alerta Tarifa Premium (WF-03)` | Etapa 6 | 🟡 ID `mob5ywZ3HCJ9wm6U` · 6 nodos · **inactivo** (invoca Evolution savia-admin) |
| WF-04 | `Savia — Confirmar Transferencia (WF-04)` | Admin valida pago transferencia | 🟢 ID `1zkSdcF3dn1K0kpd` · 15 nodos · **activo** — webhook `/savia/confirmar-transfer?id=X&token=Y`, 2-step confirmación (anti link-preview WA), PUT WC `processing`, notifica cliente y admin |
| WF-S1 | `Savia — Sync Catálogo WC` | Sync `fichas_producto` | 🟢 ID `gjBMsSnFRefCpIiP` · 6 nodos · **activo** (cron 3am Bogotá **+ webhook on-demand** `/webhook/savia-sync-catalogo`) — **fix 2026-05-21**: fallaba todas las noches (`$input.first()` en vez de `$input.all()` por el array-split de WC); ya pobla los 8 productos con fotos |
| WF-06 | `Savia — Follow-up Fotos` | Re-engagement contextual por silencio | 🟢 ID `iJ7mwdB80RM9VcEP` · 9 nodos · **activo** — webhook `/webhook/savia/followup-fotos`, espera 75s, si el cliente no respondió lee historial y una mini-IA genera un nudge acorde a la fase (o decide no insistir) |
| WF-05 | `Savia — Recuperación Carrito` | Templates Meta + cron | ⏳ Sprint 2 |

**Workflow auxiliar compartido:**
- `WA Router — Dev Multi-Proyecto` (id `IxpEmIZCHPPp4sC7`) — recibe Evolution webhook en `/webhook/wa-router`, detecta prefijo `SAVIA` (texto) o image sin prefijo (default Savia), reenvía a `/webhook/savia/wa` (entrada WF-01).

---

## 6. PostgreSQL — schema `savia`

### Convención
Mismo patrón que el resto del proyecto: schema aislado dentro de la DB `leadai` del VPS.
DDL completo en [database/001_schema.sql](database/001_schema.sql).

### Tablas

| Tabla | Función |
|---|---|
| `savia.clientes` | Identidad estable del lead (PK `telefono`). Idioma, primer contacto, opt-in habeas data |
| `savia.mensajes_logs` | Log append-only de toda la conversación (in/out), con `intent` y `metadata JSONB` |
| `savia.contactos_dia` | Índice de contactos únicos por día (PK compuesta `(fecha, telefono)`) — base del contador |
| `savia.metricas_dia` | Métricas agregadas: contactos_unicos, mensajes_total, pedidos, conversión, flag tarifa premium |
| `savia.pedidos` | Pedidos con estado (`link_generado` → `pago_confirmado` / `pago_rechazado` / `expirado`) |
| `savia.fichas_producto` | Cache curado de atributos Woo (tallas, materiales, guía de tallas) para evitar alucinaciones |
| `savia.kb_documentos` | KB de marca: política de cambios, tiempos de despacho, FAQ — vector search opcional |

### Estados válidos de pedido

```
link_generado                  (MP — link enviado, esperando pago)
  ├─► pago_confirmado          (MP aprobó vía webhook WF-02) ✅
  ├─► pago_rechazado           (MP cancelled / failed)
  └─► expirado                 (sin pago tras 48h)

pendiente_comprobante          (transferencia — pre-pedido WC on-hold, esperando foto del comprobante)
  └─► pendiente_admin_validar  (cliente envió foto → reenviada al admin con link)
        └─► pago_confirmado    (admin tapeó link → WF-04 actualiza WC a 'processing') ✅
```

**Metadata JSONB en `pedidos`** (flujo transferencia):
- `confirmacion_token` (UUID para validar link admin)
- `nombre_cliente`, `ciudad_envio`, `direccion_envio`
- `envio_cop`, `envio_fuente` (`envia_api`, `wc_envia_plugin`, `tabla_fallback`), `envio_carrier`
- `total_cop`
- `metodo_pago` (`'nequi'`)
- `instance` (Evolution instance — para responder al cliente por la misma)
- `comprobante_at`, `comprobante_mimetype`
- `confirmado_at` (admin)

---

## 7. Contador diario sin saturar PG (decisión de arquitectura)

**El contador NO se calcula con `COUNT(*)` sobre `mensajes_logs`** (caro a escala).

Patrón usado:

1. Por cada mensaje entrante, n8n ejecuta:
   ```sql
   INSERT INTO savia.contactos_dia (fecha, telefono)
   VALUES (CURRENT_DATE, $1)
   ON CONFLICT DO NOTHING
   RETURNING telefono;
   ```
2. Si retorna fila → es un **contacto nuevo del día** → incrementar contador en `savia.metricas_dia`:
   ```sql
   INSERT INTO savia.metricas_dia (fecha, contactos_unicos, mensajes_total)
   VALUES (CURRENT_DATE, 1, 1)
   ON CONFLICT (fecha) DO UPDATE
     SET contactos_unicos = savia.metricas_dia.contactos_unicos + 1,
         mensajes_total   = savia.metricas_dia.mensajes_total + 1
   RETURNING contactos_unicos, tarifa_premium_activada_ts;
   ```
3. Si `contactos_unicos = 51` y `tarifa_premium_activada_ts IS NULL` → disparar WF-03.

**Costo por mensaje:** 2 escrituras O(1) con índices PK + 1 INSERT en `mensajes_logs`. A 1.000 msg/día = trivial para PG local.

**Cleanup:** cron mensual particiona `mensajes_logs` por mes; `contactos_dia` se archiva >90 días.

---

## 8. Variables de entorno (`.env`)

Plantilla completa en `.env.example`. Resumen:

```env
# Evolution API (instancia única savia — clientes + admin)
EVOLUTION_API_URL=https://evolution.srv1398596.hstgr.cloud
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_SAVIA=savia
SAVIA_WHATSAPP_BUSINESS=57[NUMERO]
SAVIA_ADMIN_PHONES=+57[ADMIN]

# WooCommerce REST API
WOO_BASE_URL=https://savia-wear.com
WOO_CONSUMER_KEY=
WOO_CONSUMER_SECRET=

# WooCommerce webhook (Order updated) — para verificar HMAC en WF-02
WC_WEBHOOK_SECRET=
WOO_PAYMENT_METHOD=woo-mercado-pago-basic

# PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DB=leadai
PG_SCHEMA=savia
PG_USER=leadai_user
PG_PASSWORD=

# OpenAI API
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o

# Envia API (cotización envíos vía carrier TCC)
ENVIA_API_KEY=
ENVIA_ORIGIN_POSTAL=111221
ENVIA_ORIGIN_CITY=Bogotá

# Lógica de negocio
SAVIA_TARIFA_PREMIUM_THRESHOLD=50
SAVIA_PEDIDO_EXPIRA_HORAS=48
```

---

## 9. Estructura del proyecto

```
Savia/
├── CLAUDE.md                       ← este archivo
├── .env                            ← variables reales (NUNCA en git)
├── .env.example                    ← plantilla
│
├── database/
│   ├── 001_schema.sql              ← DDL completo schema savia (8 tablas)
│   ├── 002_seed_kb.sql             ← seed inicial del knowledge base
│   ├── 003_update_kb_from_real_conversations.sql  ← KB con conversaciones reales del equipo
│   ├── 004_pedidos_transferencia.sql              ← estados pendiente_comprobante + pendiente_admin_validar
│   └── README.md                   ← instrucciones de despliegue
│
├── prompts/
│   └── system_vendedor.md          ← system prompt del AI Agent (rol + reglas + tools)
│
├── workflows-n8n/
│   ├── 01-bot-ventas-whatsapp.md   ← WF-01 lógica + nodos
│   ├── 02-webhook-woo-order.md     ← WF-02 verificación HMAC WC + update pedido MP
│   └── 03-alerta-tarifa-premium.md ← WF-03 trigger + Evolution API
│
└── docs/                           ← (Sprint 2) manuales operativos
```

---

## 10. Restricciones críticas (no negociables)

1. **El agente nunca inventa datos de producto.** Si la información no viene de Woo o de la KB, dice "déjame consultarlo con el equipo" y escala.

2. **El stock se re-valida en el momento de generar el Payment Link**, no al cotizar. Entre ambas pueden pasar minutos y otra venta puede agotar la talla.

3. **Pagos: 2 métodos soportados.** (a) **MercadoPago** vía WooCommerce → bot llama `crear_pedido_woo`, recibe link MP, lo pasa al cliente. (b) **Transferencia directa** (Nequi/DaviPlata/llave Bre-B/cuenta Bancolombia) → flow automático: bot pide nombre+ciudad+dirección → sistema crea pre-pedido WC (on-hold) + calcula envío con Envia TCC + envía total + datos de pago al cliente → cliente manda foto del comprobante → sistema reenvía al admin vía sendMedia con link de validación → admin tapea link → WF-04 actualiza pedido a `processing` + notifica cliente. NUNCA el agente IA llama tools para transferencia: el sistema lo hace deterministicamente.

4. **Aviso de Ley 1581 (habeas data) en el primer contacto** con cualquier número nuevo. Queda registrado el opt-in en `savia.clientes.habeas_data_at`.

5. **Webhook WooCommerce verifica HMAC** del header `X-WC-Webhook-Signature`. Sin verificación, no se actualiza el pedido (evita confirmaciones falsas).

6. **El flag `tarifa_premium_activada_ts` es idempotente**: una sola alerta por día por más que se sigan contando contactos.

7. **Nunca enviar mensajes proactivos fuera de la ventana 24h** sin template Meta aprobado. Eso queda para Sprint 2.

8. **El canal admin (Evolution) es solo outbound**: alertas hacia el admin. No procesa comandos del admin en Sprint 1.

9. **Tono de marca:** cálido, cercano, sin emojis excesivos, sin jerga fitness técnica, sin presión agresiva de venta. El cierre es por valor, no por urgencia.

10. **Cada mensaje del agente debe terminar abriendo conversación** (pregunta concreta) hasta llegar al link de pago. Después del link, esperar acción del cliente.

---

## 11. Credenciales requeridas en n8n

- `Savia — Evolution` (HTTP Header Auth `apikey`) — instancia única `savia`
- `WooCommerce — Savia` (Basic Auth con Consumer Key/Secret)
- `PostgreSQL — LeadAI` (reutilizar la existente, configurar `search_path = savia`)
- `OpenAI API — Savia` (modelo `gpt-4o`)

---

## 12. Checklist de go-live

- [x] Instancia Evolution `savia` conectada con `+57 3127048911` (recreada limpia desde API + QR escaneado)
- [x] WooCommerce Consumer Key/Secret generados con scope `Read/Write`
- [x] WC Webhook `Order updated` creado en WP Admin (`/webhook/savia/woo-order`, secreto configurado)
- [x] Schema `savia` creado, **5 migraciones aplicadas** (001-005, última: campos de oferta en `fichas_producto`)
- [x] KB cargado con conversaciones reales (8 tópicos)
- [x] Envia API key configurada (carrier TCC operativo)
- [x] `savia.fichas_producto` sincronizado con campos de oferta (10 productos, 9 con stock). Webhook on-demand disponible
- [x] Página `politica-privacidad` creada en WP
- [x] `SAVIA_ADMIN_GROUP_JID` configurado (`120363425425251289@g.us` "Verificar Pagos Savia") — comprobantes y confirmaciones van al grupo
- [x] Catálogo actualizado en Guardian/prompt (TOP Essential, Set Essential 1360, Pack Essential 1369)
- [x] Feature de descuentos end-to-end (tool `precio_display` + cache + captions de fotos con "antes/ahora")
- [x] Flow de transferencia con 6 datos (nombre, apellido, cédula, email, ciudad, dirección)
- [x] OpenAI credencial unificada (`2VcuaBfAaHcbxuEF`) en los 4 nodos (AI Agent, AI Parse Address, AI Parse Foto Sel, AI Nudge)
- [ ] KB validado con cliente (6 entradas con `[VALIDAR CON CLIENTE]`)
- [ ] Atributo Color en productos WC + variaciones huérfanas de Leggings Natura corregidas
- [x] `woocommerce_buscar_productos` filtra agotados (excluye `stock_quantity=0` aunque WC marque `stock_status=instock`)
- [x] WF-01 activo (57 nodos, hybrid Guardian+AI, 3 chains cierre, comprobante chain, rama fotos determinística, follow-up)
- [x] WF-02 activo (filtra transferencia)
- [x] WF-04 activo (confirmar transferencia 2-step, ahora con destino grupo)
- [x] WF-S1 activo (cron 3am + webhook on-demand) — bug array-split corregido
- [x] WF-06 activo (follow-up con criterio estricto + wait 15 min)
- [ ] WF-03 activar (alerta tarifa premium)
- [x] System prompt validado con tests reales: multi-producto, typos, cierre MP, cierre transferencia, comprobante
- [x] Flow transferencia end-to-end probado y funcionando
- [ ] Test end-to-end MP sandbox
- [ ] Test alerta tarifa premium con threshold=3
- [ ] (Opcional Sprint 2) Snippet PHP mu-plugin para multi-carrier real

---

## 13. Estado del proyecto (actualizado por Claude Code)

> Última actualización: 2026-06-10 — **auditoría con cliente** sobre conversaciones reales de los últimos 4 días (audio + screenshots). 7 bugs corregidos en una sola sesión: B1 `escalar_a_admin` no notificaba a nadie tras borrar `SAVIA_ADMIN_PHONES` (ahora usa `SAVIA_ADMIN_GROUP_JID`), B2 sesgo a Terra por ejemplos hardcoded en el prompt (ahora rotados a Natura + regla anti-sesgo), B3 tela del Equilibrio Body Sculpt One Piece dice nylon (NO poliéster como el resto), B4 "liquidación/rebajas/promos" listan productos `en_oferta=true` (antes el bot decía "no tenemos liquidación" cuando había 22% OFF), B6 "ok/listo/vale" tras "déjame consultar" NO es confirmación de compra (era saltarse al cierre), B7 `humanizeTone` ahora strippea markdown `![alt](url)` y `[text](url)` (WhatsApp no renderiza), B8 filtro anti-gibberish en `Normalizar payload` (mensajes tipo "ssdfguioppvjkl" se saltan sin invocar AI — antes saturaba el TPM de OpenAI en 30K).
>
> Última actualización 2026-06-06: feature de descuentos end-to-end (migración 005 + tool con precio_display + fichas_producto cacheada + captions de fotos con "antes/ahora (% OFF)"), flow de envío con 6 datos (nombre/apellido/cédula/email/ciudad/dirección), instancia Evolution `savia` oficial conectada con `+57 3127048911`, grupo "Verificar Pagos Savia" como destino de comprobantes (cualquiera del grupo autoriza), follow-up con criterio estricto (solo si hubo interés real) y wait 75s→15min, OpenAI credencial unificada (`2VcuaBfAaHcbxuEF`), tono determinístico (floor delay 8s para saludos), catálogo renombrado (TOP Esencia→TOP Essential, +Set Essential, +Pack completo).

Documentos relacionados:
- [`docs/testing_flujo.md`](docs/testing_flujo.md) — 18 escenarios de testing manual
- [`docs/pendientes.md`](docs/pendientes.md) — tabla completa de pendientes y decisiones

### Decisiones técnicas importantes
- **Slug de pago MP**: plugin de Mercado Pago para WooCommerce registra el método como `woo-mercado-pago-basic`. `WOO_PAYMENT_METHOD=woo-mercado-pago-basic` en docker-compose.
- **UPSERT fichas_producto via n8n**: el `queryReplacement` del nodo Postgres `executeQuery` acepta una expresión que devuelve un array `={{ [...] }}`. Formato `={{ $json.x }},={{ $json.y }}` es inválido.
- **HTTP Request node array behavior** (corregido 2026-05-13): cuando la API devuelve un array JSON, el nodo **sí splittea** los items (uno por elemento). Usar `$input.all().map(i => i.json)` en Code nodes que consumen ese output.
- **toolWorkflow v2.2 con `source:"parameter"`**: expone al AI un único parámetro `input:string`. Documentar el input como TEXTO PLANO. Parse Input defensivo maneja string/JSON-string/objeto.
- **Task runner sandboxing**: Code nodes corren en VM sandboxed que bloquea `$helpers.httpRequest`, `fetch`, `require('https')`. Solo `Buffer`, `$env`, `$input`, JS puro. Para HTTP: usar nodo HTTP Request nativo.
- **Productos son TALLA ÚNICA elástica**: TODO el catálogo es talla única. Adapta cuerpos S-M (algunas L). No hay variaciones de talla reales en WC.
- **Material**: poliéster + elastano para TOPS, Leggings y Sets. **EXCEPCIÓN: el Equilibrio Body Sculpt One Piece (enterizo) usa NYLON + elastano** (decisión del cliente 2026-06-10 — se corrigió porque el bot decía poliéster).
- **WhatsApp NO renderiza Markdown**: el bot NUNCA debe usar `![alt](url)`, `**bold**`, `# headers`, ni listas con `*`/`-`. Texto plano siempre.
- **Tono español COLOMBIANO**: GPT-4o por default tiende al voseo argentino. Reforzar en el prompt: "tú/usted, NUNCA vos".

### Auditoría con cliente (2026-06-10) — 7 bugs corregidos
> Cliente compartió un audio + screenshots + transcripciones de conversaciones reales de los últimos 4 días. Se identificaron 7 bugs y 1 diferido a sprint 2. Cada uno con evidencia en conversaciones reales (SQL `savia.mensajes_logs WHERE ts > NOW() - INTERVAL '4 days'`).

- **B1 — `escalar_a_admin` no notificaba a nadie**: tras borrar `SAVIA_ADMIN_PHONES` del docker-compose (el usuario no quería recibir notifs en su WA personal), el sub-workflow `escalar_a_admin` (workflowJson inline en WF-01, sub-workflow real `wwEqT9bHFb7VZCuB`) fallaba con `"SAVIA_ADMIN_PHONES no configurado"` → cuando el bot decía "te paso al equipo" nadie se enteraba. Fix: el `Build Payload` ahora prioriza `SAVIA_ADMIN_GROUP_JID` y solo cae a `SAVIA_ADMIN_PHONES` como fallback. **Evidencia**: ejecución `31825` del 9-jun. **Nota**: el sub-workflow real `wwEqT9bHFb7VZCuB` tiene `$helpers.httpRequest` que está bloqueado en el sandbox — por eso WF-01 usa `workflowJson` inline con un HTTP Request nativo separado. El JSON inline es el que ejecuta n8n (gana sobre `workflowId`).
- **B2 — Sesgo a Terra ("siempre impulsa Terra")**: el único ejemplo de ficha de UN producto en el prompt estaba hardcoded con "Leggings Terra palo de rosa", y GPT-4o replicaba ese patrón cuando hablaba de cualquier producto → fijación sistemática. **Evidencia**: conv 3 del 10-jun (573003484224): cliente pregunta general sobre tela/talla/celulitis, bot responde 3 veces hablando solo del Leggings Terra. Fix: ejemplos rotados a TOP Natura + bloque "🔥 ANTI-SESGO: NUNCA digas Leggings/TOP Terra por defecto cuando no es lo que el cliente pidió" + ejemplo de regla de precios cambiado a placeholder `<NombreProducto>`.
- **B3 — Tela del Equilibrio Body Sculpt One Piece**: el prompt decía "MATERIAL: poliéster + elastano" como regla general aplicada a TODOS los productos. Pero el enterizo (Equilibrio One Piece) usa **nylon + elastano**. Cliente quejó porque "hay gente que no le gusta el poliéster". Fix: regla del material ahora dice "🔥 EXCEPCIÓN CRÍTICA: el Equilibrio Body Sculpt One Piece está hecho de NYLON + elastano (NO poliéster). NUNCA digas poliéster para el enterizo."
- **B4 — "Liquidación/rebajas/promos" → bot decía "no tenemos"**: cuando una clienta preguntaba por "liquidación", el bot respondía "no tenemos productos en liquidación" cuando había hasta 22% OFF activo. La regla del prompt sobre descuentos mencionaba "ofertas" pero no estos sinónimos, y GPT no generalizaba. Fix: agregada lista explícita ("descuentos / promos / ofertas / liquidación / rebajas / ahorros — TODAS significan lo mismo") + prohibición explícita ("PROHIBIDO responder 'no tenemos ofertas' sin antes verificar con el tool"). **Evidencia**: screenshot del cliente con "No tenemos productos en liquidación".
- **B5 — Doble/triple respuesta del bot (DIFERIDO a sprint 2)**: cuando el cliente manda 2-3 mensajes seguidos rápido ("Enterisos" + "Largos" + "Como el de esta foto"), el bot procesa cada uno como turno independiente y manda 2-3 respuestas distintas, a veces contradictorias. Requiere implementar un **buffer/debounce** (esperar N segundos antes de responder, agregar todos los msgs nuevos al contexto, responder UNA vez). Patrón "Chat Buffer" estilo Twilio+Redis. No se hace en esta auditoría porque es estructural. **Evidencia**: conv 1 (573153273525) del 9-jun, conv 4 (573148453738) del 9-jun.
- **B6 — Bot saltaba al cierre tras "déjame consultar" + "ok"**: cuando el bot decía "déjame consultar con el equipo" y el cliente respondía "ok" / "vale" / "listo" (acknowledge de espera), el Guardian Cierre / AI lo interpretaba como confirmación de compra → saltaba directo a "perfecto, vamos por X, cómo prefieres pagar?". Fix: bloque explícito al inicio del prompt: "🔥 OK/LISTO/VALE/DALE TRAS 'DÉJAME CONSULTAR': eso NO es confirmación de compra. Es acknowledge de espera. PROHIBIDO saltar al cierre." **Evidencia**: conv 2 (573104868943) del 7-jun.
- **B7 — Markdown `![alt](url)` y `[text](url)` en mensajes WA**: el AI Agent, pese a la regla del prompt, seguía emitiendo markdown para imágenes y links → WhatsApp lo muestra literal. Fix programático en `Detect Media in Output / humanizeTone()`: regex `/!\[[^\]]*\]\([^)]+\)/g → ""` (la imagen ya va vía sendMedia, esto es ruido) y `/\[([^\]]+)\]\(([^)]+)\)/g → text+url` (o solo url si text==url). **Evidencia**: conv 1 y 2 con URL `![Equilibrio Body Sculpt One Piece](https://...)`.
- **B8 — Rate limit OpenAI 30K TPM por cascada de gibberish**: cliente 573212606210 mandó "Ssdfguuiiopppxxvjklñzxcbnk" varias veces seguidas el 7-jun. El bot invocó el AI Agent para cada uno → consumió todo el cupo de tokens/minuto → 7 ejecuciones erróneas en cascada (`429 Rate limit reached for gpt-4o ... TPM: Limit 30000, Used 27207`). Fix: función `isGibberish()` en `Normalizar payload` detecta input de palabra única ≥8 chars con vocales <20% o runs largos de mismo caracter → marca `skip:true, reason:'gibberish'`. El cliente que escribe gibberish NO recibe respuesta (en vez de saturar tokens). Criterios: longitud ≥8, sin espacios, vocales <20% del total de letras O sin vocales O runs largos sin vocales. **Evidencia**: ejecuciones `29669`-`29676` del 7-jun.

### Decisiones arquitectónicas (2026-06-06)
- **Instancia Evolution `savia` oficial conectada** con el número `+57 3127048911`. Webhook apunta a `/webhook/savia/wa` (evento único: `MESSAGES_UPSERT`). Se borró y recreó la instancia desde cero porque la sesión quedó en estado zombie (`state:open` pero `sendText` daba `Connection Closed` y luego `Cannot read properties of undefined (reading 'find')`). El reset fue: `DELETE /instance/delete/savia` → `POST /instance/create` con webhook pre-configurado → escanear QR. `.env` actualizado: `EVOLUTION_INSTANCE_SAVIA=savia`. WA Router queda obsoleto para Savia (la instancia tiene número propio).
- **Grupo de comprobantes como destino del admin**: nueva env var `SAVIA_ADMIN_GROUP_JID` (JID `120363425425251289@g.us` para grupo "Verificar Pagos Savia"). En `Build Admin Media Caption` (WF-01) y `Build WA Admin Confirm` (WF-04): `adminDestination = SAVIA_ADMIN_GROUP_JID || SAVIA_ADMIN_PHONES`. El grupo gana si está seteado; `SAVIA_ADMIN_PHONES` queda como fallback opcional. **Cualquiera del grupo puede autorizar el pago** porque WF-04 valida solo el token del pedido, no la identidad de quien tapea el link.
- **⚠️ Gotcha env vars en docker-compose**: con `n8n` en `/docker/n8n/docker-compose.yml`, las variables del `.env` NO se forwardean automáticamente al contenedor — hay una lista explícita en `environment:`. Para una variable nueva, agregar `- VAR=${VAR}` en `environment:` y usar `docker compose up -d --force-recreate n8n` (un `restart` no relee el compose). Esto pasó dos veces: con `SAVIA_WHATSAPP_BUSINESS` (cosmético, no afectó) y con `SAVIA_ADMIN_GROUP_JID` (sí afectó).
- **Feature de DESCUENTOS end-to-end**: cuando WC marca `on_sale=true`, el bot lo anuncia explícitamente. **Tool `woocommerce_buscar_productos`** ahora devuelve `precio_display` ya formateado (`"antes $109.900 ahora $89.900 (18% OFF)"` o `"$89.900"`) — el AI Agent lo pega LITERAL en la lista (cero formato propio). **Migración 005** agregó 4 columnas a `fichas_producto` (`en_oferta`, `precio_regular`, `precio_oferta`, `oferta_hasta`); **WF-S1** sincroniza esos campos cada noche; **`Build Fotos Items`** formatea el caption "Este es el X, antes $A ahora $B (% OFF)" cuando hay oferta, o "$X" cuando no. Todo cero hardcoded: precios vivos de WC vía API + cache de 24h en PG.
- **Flow de envío de TRANSFERENCIA con 6 datos**: cambió de 3 (nombre completo, ciudad, dirección) a **6 (nombre, apellido, cédula, email, ciudad, dirección)**. Cambios coordinados en: (a) **prompt** (nuevo mensaje de pedido + ejemplo con 6 datos); (b) **AI Parse Address** (gpt-4o-mini con schema strict de 6 propiedades + descripciones por campo, e.g. cédula = solo dígitos, email = con `@`); (c) **Merge AI Parse** (pick + clean por los 6 campos, faltantes acumulados con labels de UX); (d) **Build WC Pre-Order** (`billing.first_name`/`last_name`/`email`/`address_1`/`city` reales + `meta_data._billing_cedula` para WC admin); (e) **INSERT Pedido Pendiente Comprobante** (los 6 campos persisten en `pedidos.metadata` JSONB); (f) **Build Admin Media Caption** (caption incluye Cédula y Email visibles). Reaprovecha el patrón Guardian + AI Parse autoritativo (AI gana sobre regex).
- **Cap del tool y catálogo**: subido `lista.slice(0, 3)` → `lista.slice(0, 10)` para que entren los 4 sets en la lista (antes se cortaba uno). Catálogo: **TOP Esencia → TOP Essential** (renombre en WC), añadidos **Set Essential** (ID 1360) y **Pack completo - Colección Essential** (ID 1369) a los mapas hardcoded del Guardian (`CAT_LINE_IDS`, `CAT_PRODUCTS_FOTOS`, `PRODUCT_PATTERNS`). Patterns tolerantes a ambos nombres (`esencia` / `essential`) por inercia del usuario.
- **Follow-up (WF-06) más conservador**:
  - **Wait 75s → 15 min**: el nudge a los 75s se sentía pushy; ahora espera 15 minutos antes de evaluar.
  - **Criterio estricto en el AI Nudge**: solo `enviar=true` si el cliente mostró interés real (preguntó por productos/precios/tallas/colores/material/envío/pago, pidió/vio fotos, eligió producto/método, dio datos de envío, mandó comprobante, dijo "me interesa/quiero/me lo llevo"). `enviar=false` si solo dijo "hola", pregunta off-topic, conversación cerrada, o el bot ya respondió todo sin hilo abierto. Temp bajada de 0.6 → 0.4 para más conservadurismo binario.
- **OpenAI credencial unificada** (`2VcuaBfAaHcbxuEF`): los 4 nodos que llaman a OpenAI (AI Agent langchain, AI Parse Address HTTP, AI Parse Foto Sel HTTP, AI Nudge HTTP) apuntan ahora a la misma credencial. Los HTTP usan `authentication: predefinedCredentialType + nodeCredentialType: openAiApi` en vez del `Authorization: Bearer {{ $env.OPENAI_API_KEY }}` que tenían antes. Cambiar la API key en n8n credentials se refleja en todo el sistema.
- **Tono determinístico, capítulo 2**: floor del delay para mensajes cortos subido **5s → 8s** (el saludo se sentía muy rápido). Variantes de saludo posterior subidas de 3 a 6 (estructura más diversa) para forzar variación que GPT-4o no aplicaba por sí solo.
- **Trigger del follow-up movido a puntos single-item**: era `Log mensaje OUT` → con turnos de fotos (N items) disparaba N triggers → **N nudges duplicados** (bug encontrado el 21/05). Fix: ahora se dispara desde `Detect Media in Output` (turnos AI/pago/comprobante, siempre 1 item) **Y** `Send Momento` (turno de fotos, 1 item). Garantiza exactamente 1 trigger por turno.

### Decisiones arquitectónicas (2026-05-21)
- **Tono determinístico en `Detect Media in Output`**: GPT-4o ignora de forma consistente las instrucciones de tono del prompt (capitaliza la primera letra, mete `¿`/`¡` iniciales, usa viñetas markdown). En vez de pelear con el prompt, se añadió un post-procesado JS en el nodo `Detect Media in Output` (chokepoint por donde pasa TODO mensaje saliente, AI y system messages): `humanizeTone()` baja la primera letra (salvo nombre propio/acrónimo/URL — whitelist Savia/Nequi/etc.), elimina `¿`/`¡`, quita viñetas `- * •` al inicio de línea y `**`. `Resolve Bot Text` ahora loguea el texto YA normalizado (lee de `Detect Media`) para que la DB refleje lo que el cliente realmente vio.
- **Loop de confirmación arreglado (R2)**: la precondición R2 exigía producto "CON PRECIO Y FOTO" para entrar al flow de cierre; como en listas multi-producto la foto solo se manda al elegir, el bot se quedaba en loop pidiendo confirmar un "si" ya dado. Fix: foto NO es requisito para avanzar + regla explícita "CONFIRMACIÓN = AVANZAR" (cualquier afirmativo tras presentar/elegir producto → confirmar en 1 línea + preguntar método de pago, nunca re-preguntar).
- **Ficha completa al elegir de lista**: cuando el cliente elige uno de una lista multi-producto, el bot manda la ficha COMPLETA de ESE (sensación + característica + foto inline obligatoria + precio + cierre). Lista en texto plano sin guiones; wording específico "te mando la foto y el detalle de la prenda".

### Rama de fotos DETERMINÍSTICA + follow-up (2026-05-21 tarde)
> Tras varios intentos de que el AI Agent mandara N fotos (siempre fallaba: no llamaba al tool, olvidaba marcadores, repetía la lista en loop), se decidió **sacar el envío de fotos del AI** y hacerlo en código. **Patrón: IA para entender, código para ejecutar.**
- **Flujo nuevo**: el bot lista productos (nombre + detalle corto + precio) y cierra ofreciendo fotos (frase variada que SIEMPRE contiene la palabra "foto" — es el disparador). Cuando el cliente responde, NO lo maneja el AI Agent: lo intercepta `Guardian Cierre`.
- **Guardian detecta el ESTADO "ofreció fotos"** (no la selección): `botOfrecioFotos = /foto|imagen/.test(ultimoBotFull)` + categoría activa (leggings/tops/sets) detectada del historial → `tipo_cierre='enviar_fotos'` → `Switch Cierre` caso 3.
- **🔥 BUG multilínea de `ultimoBot`** (causaba que NUNCA disparara): los mensajes del bot son multilínea; en `historial_resumen` solo la 1ª línea lleva el prefijo `[assistant]`, y "puedo enviarte las fotos" queda en la última línea. El detector tomaba solo la 1ª línea → no veía "fotos". Fix: reconstruir el **bloque completo** del último mensaje del bot (`ultimoBotFull`) y detectar ahí.
- **Mini-IA de selección** (`AI Parse Foto Sel`, gpt-4o-mini, JSON schema `{es_seleccion, ids}`): recibe los candidatos de la categoría + el último mensaje del bot (con colores) + el mensaje del cliente. Entiende typos ("esencai"), colores ("el rosado"), posición ("el primero"), "los 3/todos". Si el cliente NO está eligiendo (pregunta envío/precio) → `es_seleccion=false` → va al AI Agent normal. Ruta: `Switch[3] → AI Parse Foto Sel → Eval Foto Sel → ¿Es selección fotos? → (true) Query Fotos / (false) AI Agent`.
- **Envío múltiple por items**: `Query Fotos Productos` (lee de `fichas_producto` por ids) → `Build Fotos Items` devuelve N items → `¿Tiene Media?` → `Send WA Media` corre 1×item → N mensajes. `Resolve Bot Text` loguea `full_log_text` (combinado) en 1 fila.
- **`Send Momento`**: antes de las fotos, un mensaje variado ("De una, ya te las paso" — 7 frases random) para que se sienta humano. Va ANTES de `Query` en la rama. ⚠️ Como es un HTTP node, reemplaza `$json`; por eso `Query Fotos` lee `fotos_ids` de `$('Eval Foto Sel')` explícitamente, NO de `$json`.
- **Delays escalonados + orden**: cada foto lleva un `delay` creciente (6s, 11s, 16s) en `Build Fotos Items`; `Send WA Media` usa `$json.delay`. Esto da ritmo humano Y arregla el desorden (con delays iguales las fotos llegaban casi simultáneas y en orden aleatorio).
- **Agotados**: `Query Fotos` NO filtra stock; `Build Fotos Items` manda foto si `stock>0 && url_imagen`, o un texto "El X desafortunadamente está agotado en este momento" si no. Además `woocommerce_buscar_productos` filtra `stock_quantity>0` (el `stock_status=instock` de WC NO basta: puede quedar 'instock' con cantidad 0) → los agotados no aparecen ni en la lista inicial.
- **Descuentos/Ofertas** (migración 005, 2026-06-04): cuando WC marca `on_sale=true`, el bot lo anuncia explícitamente ("antes $X ahora $Y (oferta!)") tanto en la lista del AI Agent como en los captions de las fotos. Tool `woocommerce_buscar_productos` expone `en_oferta`, `precio_regular`, `precio_oferta`, `oferta_hasta`. `fichas_producto` cachea los mismos campos vía WF-S1. `Build Fotos Items` formatea el caption con el descuento cuando `en_oferta=true && precio_oferta < precio_regular`.
- **Catálogo (2026-06-04)**: TOP Esencia renombrado a **TOP Essential** en WC. Añadido nuevo producto **Set Essential** (ID 1360) a los mapas estáticos (CAT_LINE_IDS/CAT_PRODUCTS_FOTOS/PRODUCT_PATTERNS). Los patterns aceptan tanto "esencia" como "essential" para tolerar el hábito viejo.
- **Selección por línea/color = intención de compra** (regla en prompt): si el bot mostró una categoría (ej. tops) y el cliente dice "me interesa los Terra" / "el rosado", se refiere al producto de ESA categoría (TOP Terra), NO a la línea Terra en otras categorías. NO re-busca; pasa a preguntar método de pago.
- **Follow-up contextual (WF-06)**: `Trigger Follow-up` (fire-and-forget) → webhook de WF-06 con `{telefono, instance, sent_at}` UNA vez por turno. ⚠️ Se dispara desde `Detect Media in Output` (turnos AI/pago/comprobante) **y** `Send Momento` (turno de fotos) — ambos puntos de 1 solo item. NO desde `Log mensaje OUT`: el turno de fotos llega ahí con N items y disparaba el trigger N veces → **N nudges duplicados** (bug encontrado 2026-05-21). WF-06 espera 75s, revisa si hubo inbound posterior; si el cliente está en silencio, lee el historial y una mini-IA genera un nudge **acorde a la fase** (viendo opciones → "cuál te interesó?"; ya eligió → "cómo prefieres pagar?"; cerrada → no insiste). Es 1 nudge por silencio (sólo el último turno callado lo dispara; los anteriores ven que el cliente respondió). El prompt exige UNA frase, saludo simple "Hola" (no formal) y reconocer lo ya enviado (NO re-ofrecer fotos que el cliente ya tiene). `Eval Nudge` aplica limpieza determinística (quita `¿¡` + mayúscula inicial) porque el nudge se manda directo sin pasar por `Detect Media`.
- **Gotcha `delay` vs `timeout` (Send Evolution)**: Evolution retiene la respuesta HTTP durante `delay`. Si `delay >= timeout` del nodo, la petición aborta → la ejecución muere antes de `Log mensaje OUT` → el mensaje no se loguea → se rompe la detección del siguiente turno (cascada de re-listados). Fix: `timeout` de los Send = 45000, muy por encima del `delay` máx (15000).
- **Gotcha Postgres `queryReplacement` con comas**: pasar un string `"1210,1189,1182"` a `$1` hace que n8n lo **parta en varios parámetros** ($1,$2,$3). `string_to_array($1,',')` recibe solo "1210" → 1 producto. Fix: envolver en array `={{ [$json.x] }}` → 1 solo parámetro.

### WF-S1 fix + sync on-demand (2026-05-21)
- **WF-S1 fallaba TODAS las noches** desde su creación (`status: error` en cada cron). Causa: `Enriquecer con variaciones` hacía `const productos = $input.first().json` y exigía un array, pero el HTTP Request **splittea** el array de WC en items → recibía un objeto → throw "WC no devolvió array". Fix: `$input.all().map(i => i.json)`. Por esto `fichas_producto` estaba vacía y las fotos no salían.
- Se agregó un **trigger webhook** (`/webhook/savia-sync-catalogo`) además del cron 3am, para poblar/re-sincronizar on-demand sin abrir la UI. Catálogo actual: 8 productos, 7 con stock (Leggings Natura en 0).

### Decisiones arquitectónicas (2026-05-15)
- **Hybrid Guardian + AI Parse autoritativo**: en el flujo de cierre por transferencia, hay un nodo `Guardian Cierre` (JS regex rápido para detectar método pago + parsear nombre/ciudad/dirección) seguido de `AI Parse Address` (gpt-4o-mini con JSON schema). **El AI Parse corre SIEMPRE** en momento de recolección de datos Nequi y es **autoritativo** sobre Guardian: si el AI devuelve valor no-null, gana sobre el regex. Esto soluciona problemas como nombre="Bogotá" (ciudad confundida con nombre), typos ("transferncia"), formatos no estándar (manzana/conjunto), sin tablas hardcodeadas.
- **Multi-producto via output único**: `toolWorkflow` con LangChain SOLO pasa al AI el PRIMER item del output del sub-workflow. Si retornás múltiples items por separado (formato n8n estándar), el AI solo ve el primero y presenta UN producto. **Fix**: el sub-workflow debe devolver UN solo item con `{ total, productos: [...], instruccion_al_agente }`. Aplicado en `woocommerce_buscar_productos`.
- **AI normaliza queries antes de tool, NO synonym tables**: para typos ("legjins", "set deportivo", "topes") el AI Agent normaliza la palabra antes de pasarla al tool. Más escalable que mantener una tabla de synonyms en el sub-workflow.
- **Image inline via sendMedia**: cuando el output del bot contiene URL de imagen `.jpg/.png/.webp`, un nodo `Detect Media in Output` extrae la URL y limpia el texto, luego un IF rutea entre `sendText` (sin imagen) y `sendMedia` (con imagen inline + caption). Mucho mejor UX en WhatsApp.
- **Anti link-preview en confirm-transfer (WF-04)**: WhatsApp pre-fetcha URLs en mensajes que envía. Sin 2-step, ese fetch disparaba la confirmación del pedido automáticamente. **Fix**: WF-04 requiere query param `?confirmar=yes`. Primer click (preview) muestra página HTML con botón "Confirmar". Solo cuando admin tapea ESE botón se ejecuta la confirmación real.
- **Política de envío FIJA (decidida 2026-05-15 sesión tarde)**: $12.000 fijo nacional, GRATIS por compras ≥ $200.000. Decisión de negocio del cliente. Reemplaza el intento previo con Envia API (solo TCC funcionaba via raw API; Coordinadora/ServiEntrega/DHL solo accesibles vía plugin en checkout WC). Por simplicidad operativa el cliente decidió tarifa única.
- **PUT shipping_lines en WC order**: después de Calc Shipping, hacemos PUT al WC order para que el total en WP Admin coincida con lo que el bot le mostró al cliente.
- **Histórico Envia API**: probamos integración directa (TCC funciona, otros requieren config compleja en cuenta Envia o snippet PHP que reuse plugin de WC). Codigo retirado. ENV vars `ENVIA_API_KEY` quedan en docker-compose por si en futuro se reactiva.

### Sprint 1 — Cimientos (COMPLETO)
- ✅ Schema PG `savia` (8 tablas) + 4 migraciones SQL
- ✅ WF-01 (54 nodos, activo vía dev-router): pipeline + Guardian Cierre + AI Parse + 2 Chains de cierre (MP / transferencia) + Chain comprobante + sendMedia detector
- ✅ WF-02 (15 nodos, activo) — ignora pedidos transferencia
- ✅ WF-03 (6 nodos, inactivo) — alerta tarifa premium
- ✅ WF-04 (15 nodos, activo) — confirmar transferencia con 2-step anti link-preview
- ✅ WF-S1 (5 nodos, activo) — sync catálogo
- ✅ 5 sub-workflows: woocommerce_buscar_productos, crear_pedido_woo, escalar_a_admin, kb_consultar, consultar_descuento_vigente
- ✅ KB cargado con contenido REAL del equipo humano (8 tópicos)
- ✅ Variables de entorno: OpenAI, WC, PG, Evolution, ENVIA_API_KEY
- ✅ WC Webhook `Order updated` configurado con HMAC
- ✅ Integración Envia API (TCC) + fallback table flat
- ✅ Detección imagen + sendMedia para foto producto inline
- ✅ Forward comprobante via getBase64FromMediaMessage + sendMedia al admin
- ✅ Multi-producto: tool devuelve `productos: [...]` en 1 item + instrucción explícita al AI
- ✅ Normalización de typos delegada al AI Agent (no synonym tables)
- ✅ Rama de fotos determinística (Guardian + mini-IA selección + envío múltiple + Send Momento + delays escalonados + manejo agotados)
- ✅ WF-S1 corregido (bug array-split) + webhook on-demand; `fichas_producto` poblado
- ✅ WF-06 follow-up contextual por silencio (mini-IA por fase)
- ✅ Tono determinístico (capitalización + sin signos `¿¡` + sin viñetas) en `Detect Media`
- ✅ Instancia Evolution `savia` oficial CONECTADA con `+57 3127048911` (2026-06-06)
- ✅ `woocommerce_buscar_productos` filtra agotados (`stock_quantity>0`) — no se listan productos en 0
- ✅ Página `politica-privacidad` creada (link del aviso de habeas data ya válido)
- ✅ Feature de descuentos end-to-end (tool + cache + captions)
- ✅ Flow transferencia con 6 datos: nombre, apellido, cédula, email, ciudad, dirección
- ✅ Grupo "Verificar Pagos Savia" como destino del admin — cualquier miembro autoriza
- ✅ OpenAI credencial unificada (`2VcuaBfAaHcbxuEF`)
- ⏳ Test end-to-end con MP sandbox (tarjeta de prueba)
- ⏳ Test alerta tarifa premium (WF-03)
- ⏳ KB validado con cliente (entradas con `[VALIDAR CON CLIENTE]`)
- ⏳ Pendientes en WP: atributo Color, variaciones huérfanas Leggings Natura, descripciones de producto, SKUs únicos

### Sprint 2 — Planeado
- **Snippet PHP en WP** (`mu-plugins/savia-shipping-rates.php`) — endpoint custom que reusa plugin Envia para obtener Coordinadora/ServiEntrega/DHL/etc en lugar de solo TCC raw
- Recuperación de carrito abandonado (templates Meta + cron sobre `pendiente_comprobante` > 24h)
- Escalamiento bidireccional admin (Evolution inbound, admin responde y el bot reenvía)
- OCR de comprobantes (GPT-4o Vision: monto + fecha + cuenta destino → auto-confirma si match)
- Dashboard de conversión Metabase sobre PG schema `savia`
- Tool `enviar_catalogo_pdf` con sendMedia (PDF físico vs link wa.me/c)
