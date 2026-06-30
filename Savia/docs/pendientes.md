# Pendientes — Savia Wear Sales Agent

> Última actualización: 2026-06-06 — instancia Evolution `savia` oficial conectada con +57 3127048911, feature de descuentos end-to-end (migración 005), flow de envío con 6 datos (nombre/apellido/cédula/email/ciudad/dirección), grupo "Verificar Pagos Savia" como destino de comprobantes (cualquier miembro autoriza), follow-up con criterio estricto + wait 15min, OpenAI credencial unificada, catálogo actualizado (TOP Essential + Set Essential + Pack Essential).

---

## 🔴 Bloqueantes para GO-LIVE

| # | Tarea | Responsable | Notas |
|---|---|---|---|
| ~~G1~~ | ~~Conectar instancia Evolution `savia` oficial~~ | Diego | ✅ HECHO 2026-06-06 — instancia recreada limpia, número `+57 3127048911` vinculado, webhook `/webhook/savia/wa` con MESSAGES_UPSERT, `.env` actualizado (`EVOLUTION_INSTANCE_SAVIA=savia`) |
| ~~G2~~ | ~~Crear página `savia-wear.com/politica-privacidad`~~ | Cliente | ✅ HECHO — Diego creó la página con la URL ya existente |
| G3 | Activar WF-03 (alerta tarifa premium) | Diego | ID `mob5ywZ3HCJ9wm6U`. Pendiente: activar desde n8n y bajar threshold para probar |
| ~~G4~~ | ~~Correr WF-S1 1x para poblar `fichas_producto`~~ | Diego | ✅ HECHO 2026-05-21 — WF-S1 estaba **roto** (fallaba cada noche por array-split); corregido + webhook on-demand `/webhook/savia-sync-catalogo` + poblado (8 productos, hoy 10 con Set Essential + Pack) |
| ~~G5~~ | ~~Setear grupo de admin para comprobantes~~ | Diego | ✅ HECHO 2026-06-06 — `SAVIA_ADMIN_GROUP_JID=120363425425251289@g.us` ("Verificar Pagos Savia"). Cualquier miembro del grupo puede autorizar pagos tapeando el link del comprobante |

---

## 🟡 En pausa esperando equipo del cliente (WooCommerce)

| # | Tarea | Por qué |
|---|---|---|
| W1 | Atributo **Color** en cada producto de WC | Bot redirige al catálogo cuando preguntan colores porque WC devuelve `attributes:[]` vacíos. Si el equipo agrega "Color" en WP Admin, el bot lo extrae automáticamente |
| W2 | Corregir variaciones huérfanas de **Leggings Natura** (IDs 1307, 1308) | Tienen `attributes:[]` y `name:""` vacíos |
| W3 | SKU único por variación | Hoy hay 2 variaciones con misma SKU |
| W4 | Llenar `description` y `short_description` de cada producto en WC | El bot lee `descripcion_completa` del tool. Si viene vacío, tiende a inventar |
| W5 | Validar **6 entradas del KB** marcadas `[VALIDAR CON CLIENTE]` | Tallaje, materiales, envíos, cambios, devoluciones, contacto |

---

## 🚦 Tests pendientes

| # | Test | Cómo |
|---|---|---|
| T1 | End-to-end MercadoPago sandbox | Activar MP TEST en WP Admin. Bot → link MP → tarjeta `5031 7557 3453 0604` CVV 123 nombre APRO. WF-02 recibe webhook → actualiza `pago_confirmado` → confirma a clienta |
| T2 | Alerta tarifa premium | Bajar `SAVIA_TARIFA_PREMIUM_THRESHOLD=3`. Generar 3+ contactos únicos. Validar WF-03 dispara 1 vez |
| T3 | ✅ Cierre transferencia (validado 2026-05-15) | Probado end-to-end con BD limpia varias veces. Funciona: datos → pre-pedido WC → envío Envia/fallback → datos pago al cliente → foto → admin sendMedia → admin tapea link → cliente recibe confirmación |
| T4 | Clasificación de `intent` | Verificar `mensajes_logs.metadata->'intent'` se popule con valores correctos |

---

## ✨ Sprint 2 — Mejoras planeadas

| # | Funcionalidad | Detalle |
|---|---|---|
| S0 | **PHP snippet en mu-plugin** para multi-carrier real | Endpoint `/wp-json/savia/v1/shipping-rates` que reusa plugin Envia via `WC()->cart->calculate_shipping()`. Devuelve Coordinadora/ServiEntrega/DHL en lugar de solo TCC. Código YA escrito (ver chat). Solo falta subirlo a Hostinger File Manager + definir `SAVIA_SHIPPING_SECRET` en wp-config.php |
| S1 | Recuperación de carrito abandonado | Templates Meta aprobados + cron que detecta `pendiente_comprobante` sin foto tras 24h y envía recordatorio |
| S2 | Escalamiento bidireccional admin | Admin responde por WhatsApp personal y el bot reenvía a la clienta |
| S3 | OCR de comprobantes | GPT-4o Vision: monto + fecha + cuenta destino → auto-confirma si match con pedido. Ahorra trabajo manual del admin |
| S4 | Dashboard de conversión Metabase | Métricas: leads/día, % conversión, ticket promedio, intent más común, productos más consultados |
| S5 | Tool `enviar_catalogo_pdf` con sendMedia | Si el cliente prefiere PDF físico vs link `wa.me/c/` |

---

## ⚠️ Riesgos abiertos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | GPT-4o inventa info pese al prompt | Ejemplos explícitos + instrucciones anti-invento. Sigue ocurriendo ocasionalmente con palabras tipo "premium", "acabados de calidad". Validar lista negra con cliente |
| R2 | Cliente cambia código de descuento sin actualizar KB | Documentar proceso de update en `database/003_*.sql` |
| R3 | Variaciones huérfanas en WC | Cliente W2 |
| R4 | Envío Envia API solo cubre TCC | Sprint 2: snippet PHP para multi-carrier real |
| R5 | Coordinadora WS errores intermitentes (api.envia.com) | TCC funciona como fallback automático |
| R6 | Bot puede generar mensajes largos | "Mensajes cortos, una idea por mensaje" reforzado en prompt |

---

## ✅ Hecho — Sesión 2026-06-06 (Evolution oficial + descuentos + 6-datos + grupo admin)

### Evolution: instancia `savia` oficial conectada
- Instancia anterior estaba corrupta (`state:open` pero `sendText` daba `Connection Closed` y luego `Cannot read properties of undefined (reading 'find')`). Se borró y recreó vía API.
- Número nuevo `+57 3127048911` vinculado al QR de la nueva instancia.
- Webhook configurado: `/webhook/savia/wa` con evento único `MESSAGES_UPSERT`.
- `.env` actualizado: `EVOLUTION_INSTANCE_SAVIA=savia`. WA Router queda obsoleto para Savia.
- **Gotcha env vars**: en `/docker/n8n/docker-compose.yml` no se forwardean automáticamente desde `.env` — hay una lista explícita en `environment:`. Para variables nuevas, agregar `- VAR=${VAR}` y usar `docker compose up -d --force-recreate n8n` (un `restart` NO relee el compose).

### Feature de DESCUENTOS end-to-end
- **Migración 005**: 4 columnas en `fichas_producto` (`en_oferta`, `precio_regular`, `precio_oferta`, `oferta_hasta`).
- **Tool `woocommerce_buscar_productos`**: devuelve `precio_display` ya formateado (`"antes $109.900 ahora $89.900 (18% OFF)"` o `"$89.900"`). El AI Agent lo pega LITERAL — cero formato propio, cero precios hardcoded.
- **WF-S1**: actualizado el `Enriquecer con variaciones` para sincronizar los 4 campos de oferta desde WC. UPSERT extendido a 16 columnas.
- **Rama de fotos**: `Query Fotos Productos` lee los nuevos campos. `Build Fotos Items` formatea el caption "Este es el X, antes $A ahora $B (% OFF)" cuando hay oferta.
- **Prompt** del AI Agent reforzado: ejemplo de lista CON descuento + regla explícita de usar `precio_display` literal.
- **Cap del tool**: subido de 3 a 10 productos para que entren los 4 sets en la lista.

### Catálogo actualizado
- TOP Esencia renombrado a **TOP Essential** en WC. Patrones del Guardian aceptan ambos (`esencia` / `essential`) por inercia del usuario.
- Nuevos productos: **Set Essential** (ID 1360) y **Pack completo - Colección Essential** (ID 1369). Añadidos a `CAT_LINE_IDS`, `CAT_PRODUCTS_FOTOS`, `PRODUCT_PATTERNS`.

### Flow de TRANSFERENCIA con 6 datos
Antes: 3 datos (nombre completo, ciudad, dirección). Ahora: **6 datos** (nombre, apellido, cédula, email, ciudad, dirección). Cambios coordinados en:
- **Prompt**: nuevo mensaje de pedido + ejemplo con 6 datos.
- **AI Parse Address**: schema strict de 6 campos (con descripciones de cédula = solo dígitos, email = con `@`).
- **Merge AI Parse**: pick + clean por los 6 campos, faltantes acumulados con labels de UX.
- **Build WC Pre-Order**: `billing.first_name/last_name/email/address_1/city` reales + `meta_data._billing_cedula` (para WC admin).
- **INSERT Pedido**: los 6 campos persisten en `pedidos.metadata` JSONB.
- **Build Admin Media Caption**: caption incluye Cédula y Email visibles para el admin.

### Grupo de admin como destino
- Nueva env var `SAVIA_ADMIN_GROUP_JID` (JID `120363425425251289@g.us` = grupo "Verificar Pagos Savia").
- Lógica de fallback en `Build Admin Media Caption` (WF-01) y `Build WA Admin Confirm` (WF-04): `adminDestination = SAVIA_ADMIN_GROUP_JID || SAVIA_ADMIN_PHONES`.
- **Cualquiera del grupo puede autorizar**: WF-04 valida solo el token del pedido, no la identidad de quien tapea el link.

### Follow-up más conservador (WF-06)
- **Wait 75s → 15 min**: el nudge a los 75s se sentía pushy.
- **Criterio estricto**: solo `enviar=true` si el cliente mostró interés real (preguntó por productos/precios/tallas/material/envío/pago, pidió/vio fotos, eligió producto/método, dio datos de envío, mandó comprobante, dijo "me interesa"/"quiero"). Si solo dijo "hola" o pregunta off-topic → `enviar=false`. Temp 0.6 → 0.4.

### OpenAI credencial unificada
- Los 4 nodos que llaman a OpenAI (AI Agent langchain, AI Parse Address, AI Parse Foto Sel, AI Nudge) apuntan a la credencial `2VcuaBfAaHcbxuEF`.
- Los HTTP usan `authentication: predefinedCredentialType + nodeCredentialType: openAiApi` en vez del `Authorization: Bearer {{ $env.OPENAI_API_KEY }}`.

### Tono y ritmo refinados
- Floor del delay para mensajes cortos: **5s → 8s** (saludos más humanos).
- Variantes de saludo posterior: 3 → 6 (estructura más diversa para forzar variación que GPT-4o no aplicaba).
- Trigger del follow-up movido a puntos single-item (`Detect Media in Output` + `Send Momento`) en vez de `Log mensaje OUT` (que con N items disparaba N triggers → N nudges duplicados, bug del 21/05).

---

## ✅ Hecho — Sesión 2026-05-21 (fotos determinísticas + follow-up + fixes)

### Rama de FOTOS determinística (WF-01)
- El AI ya NO envía fotos (siempre fallaba). El bot lista productos y ofrece fotos; al pedirlas, interviene **código**: `Guardian` detecta estado "ofreció fotos" → **mini-IA `AI Parse Foto Sel`** (gpt-4o-mini) entiende cuáles quiere tolerando typos/colores/posición → `Query Fotos Productos` (lee `fichas_producto`) → `Build Fotos Items` → envío múltiple.
- `Send Momento` (mensaje variado "dame un momento" antes de las fotos) + **delays escalonados** (6/11/16s) para orden y ritmo humano.
- **Agotados**: se avisa "El X está agotado" en vez de omitir; además `woocommerce_buscar_productos` ya filtra `stock_quantity>0` (no los lista).

### WF-06 — Follow-up contextual por silencio (nuevo, activo)
- Tras cada turno del bot, si el cliente no responde en **75s**, una mini-IA lee el historial y manda un nudge **acorde a la fase** (viendo opciones / ya eligió / dando datos / cerrada → no insiste). Mensaje corto, saludo simple, no re-ofrece lo ya enviado.

### Fix WF-S1 (catálogo)
- Fallaba TODAS las noches (`$input.first()` vs `$input.all()` por array-split de WC). Corregido + webhook on-demand. `fichas_producto` poblado.

### Tono + ritmo
- `humanizeTone()` determinístico en `Detect Media` (mayúscula inicial + sin `¿¡` + sin viñetas). Saludo inicial con delay ~8s. Saludo POSTERIOR con 6 variantes (rota).

### Gotchas documentados (ver CLAUDE.md §13)
- `delay` (Evolution) ≥ `timeout` del nodo → aborta envío → rompe logging (cascada de re-listados). Fix: timeout 45s.
- `queryReplacement` parte strings con comas en varios parámetros. Fix: envolver en array `[$json.x]`.
- `ultimoBot` solo tomaba 1ª línea del mensaje multilínea del bot → no detectaba "fotos". Fix: reconstruir bloque completo.
- Trigger de follow-up desde `Log mensaje OUT` (N items en fotos) → N nudges duplicados. Fix: disparar desde `Detect Media` + `Send Momento` (1 item).

### Pendiente menor (opcional)
- Si el **saludo** sigue repitiéndose pese a las 6 variantes (lo genera GPT, no garantizado), convertirlo a **determinístico** (nodo que elige al azar sin pasar por GPT, como `Send Momento`).

---

## ✅ Hecho — Sesión 2026-05-15 (parte 2: política envío + escalación)

### Política de envío FIJA
- Decisión del cliente: **$12.000 nacional / GRATIS desde $200.000**
- Removidos 4 nodos Store API que no funcionaban (Prepare Store Cart Data, Bootstrap, Add to Cart, Set Address)
- `Calc Shipping & Total` simplificado: hardcoded $12k o $0 según umbral
- `Build Pay Info Message` muestra "Envío GRATIS 🎉" cuando aplica
- Sub-workflow `kb_consultar` topic `envios` actualizado
- Prompt CATÁLOGO y lista preguntas-comunes actualizadas con la nueva política
- Bot ahora puede mencionar naturalmente "si llevas algo más superas $200k y envío gratis" sin presionar

### Fix escalación "problema técnico"
- Bot escalaba a admin cuando preguntaban envíos/pagos pese a tener info inline
- Agregada lista explícita de preguntas comunes que NUNCA se escalan (envíos, pagos, sede, tallaje, catálogo, material)
- `escalar_a_admin` queda solo para info realmente específica (descuentos especiales, mayoreo, próxima colección)

---

## ✅ Hecho — Sesión 2026-05-15 (parte 1: refactor masivo)

### Arquitectura
- **WF-04 nuevo** (`Savia — Confirmar Transferencia`, id `1zkSdcF3dn1K0kpd`, 15 nodos, activo): webhook `/webhook/savia/confirmar-transfer?id=X&token=Y` con **2-step confirmación** (anti link-preview de WhatsApp), PUT WC order a `processing`, notifica cliente y admin
- **WF-01 expandido** de 25 → 54 nodos:
  - Hybrid Guardian Cierre + AI Parse Address (gpt-4o-mini autoritativo)
  - Chain A nueva: nequi_pedir_pago → POST WC Pre-Order on-hold → GET WC Product → Prepare Envia → Get Envia Rate → Calc Shipping → PUT WC Order Add Shipping → INSERT pedido pendiente_comprobante → Build Pay Info Message
  - Chain B nueva: comprobante_received → Get Comprobante Base64 → UPDATE Pedido → Build Admin Caption → POST sendMedia Admin → Format Reply
  - Detect Media in Output + ¿Tiene Media? + Send WA Media (sendMedia para imágenes producto)
  - Resolve Bot Text (Code node) reemplaza expresión ternaria compleja para Log mensaje OUT

### Migraciones SQL
- `004_pedidos_transferencia.sql`: nuevos estados `pendiente_comprobante` + `pendiente_admin_validar`, columna `estado` ampliada VARCHAR(20)→40, índice en token

### Workflow auxiliar WA Router
- Actualizado `Extraer Prefijo` para detectar imageMessage. Si imagen sin caption → route default a Savia

### Bugs resueltos esta sesión
- ✅ `Log mensaje OUT` guardaba texto NULL (queryReplacement con `$json.output` después de Send WA)
- ✅ Switch Cierre fallback estaba conectado al idx incorrecto (no llegaba al AI Agent)
- ✅ Old chain Nequi corría en paralelo con Chain A nueva (msg duplicado "ya pasé tu pedido")
- ✅ POST Evolution Admin Direct usaba env var `EVOLUTION_INSTANCE_SAVIA` hardcodeado (`savia` no conectado) → ahora usa instance del payload del cliente
- ✅ Multi-producto: tool devolvía items separados, langchain solo leía el primero → fix: 1 item con array `productos[]`
- ✅ Bot saltaba al cierre sin presentar producto cuando user decía "quiero comprar" → R2 precondición obligatoria
- ✅ Bot llamaba al cliente "Bogotá" (Guardian parseaba ciudad como nombre) → AI Parse autoritativo + safety check de ciudades
- ✅ Total WC sin envío → PUT shipping_lines después del cálculo
- ✅ "transferncia" (typo) no detectado → regex `\btransfer\w*`
- ✅ Image inline funcionando aún cuando AI omite https:// del URL (regex flexible)
- ✅ WC Store API auth (Nonce + Cart-Token via Bootstrap GET) — aunque no se usa en producción (plugin Envia no se engancha), código documentado

### Mejoras de tono
- Saludo más cálido aspiracional (sin "holi/sip/hey")
- Variación de pregunta método pago (no plantilla fija)
- Claridad: transferencia incluye Nequi/DaviPlata/llave Bre-B/cuenta Bancolombia
- AI normaliza typos antes de llamar tool (no synonym tables)

---

## ✅ Hecho — Sesiones anteriores

### Sesión 2026-05-14 (parser inteligente + foto comprobante)
- ✅ Parser inteligente nombre/ciudad/dirección con lista de ciudades CO + keywords calle
- ✅ Detección de imágenes en Normalizar payload
- ✅ Forward imagen al admin via sendMedia
- ✅ Sub-workflow `consultar_descuento_vigente` con cupones WC live

### Sesión 2026-05-13 (afinado con conversaciones reales)
- ✅ KB cargado con info real (8 tópicos)
- ✅ Sub-workflow `woocommerce_buscar_productos` simplificado
- ✅ `escalar_a_admin` HTTP 400 arreglado
- ✅ Saludo + aviso privacidad sutil
- ✅ Tono español colombiano explícito
- ✅ Anti-Markdown reforzado

### Sesión 2026-05-12 (cimientos)
- ✅ Schema PG `savia` desplegado
- ✅ WF-01, WF-02, WF-03, WF-S1 creados
- ✅ Credenciales OpenAI, WC, PG configuradas
- ✅ WC Webhook `Order updated` configurado

---

## 📐 Decisiones técnicas tomadas (referencia)

| # | Decisión | Por qué |
|---|---|---|
| D1 | Sub-workflow buscar productos retorna 1 item con array `productos[]` | LangChain solo lee el primer item del tool output. Crítico para multi-producto |
| D2 | AI Agent autoritativo sobre Guardian regex en parser direcciones | Evitar bugs tipo nombre="Bogotá" sin hardcodear listas; AI razona |
| D3 | Tool input documentado como TEXTO PLANO + AI normaliza typos | Más escalable que synonym tables; el AI ya sabe inferir |
| D4 | 2 métodos de pago: MP via tool + Transferencia automática (sin tool) | Cliente acepta ambos. Transferencia con flow determinístico Chain A + B |
| D5 | sendMedia para imagen producto inline | Mucho mejor UX en WhatsApp vs URL pelada |
| D6 | sendMedia comprobante con caption al admin + link confirmación | Admin tiene foto y datos en 1 mensaje |
| D7 | 2-step confirmación en WF-04 (anti link-preview WA) | WhatsApp pre-fetcha URLs, dispararía confirmación sin click humano |
| D8 | Envia API directa (TCC) en lugar de WC Store API | Plugin Envia no se engancha en contexto Store API |
| D9 | PUT shipping_lines a WC order tras calcular envío | Total WC debe matchear lo que el bot le mostró al cliente |
| D10 | WC Store API auth: Bootstrap GET previo para obtener Nonce + Cart-Token | Documentado por si en el futuro el plugin Envia agrega soporte Store API |
| D11 | WF-02 ignora pedidos con metadata `_savia_metodo_pago=transferencia` | WF-04 ya maneja confirmación; evita mensaje duplicado |
| D12 | Productos TALLA ÚNICA, material poliéster+elastano | No hay variaciones reales de talla en WC |
| D13 | Tono español colombiano explícito (sin "vos") | GPT-4o por default usa argentinismos |
| D14 | Sin Markdown en respuestas | WhatsApp no renderiza |
| D15 | Precio AL FINAL del mensaje | Técnica de venta: valor primero, costo después |
