# Configuración nodos WhatsApp Business Cloud — Ferretería Ya (PLAN DE MIGRACIÓN FUTURA)

> ⚠️ **Estado:** Este documento describe el plan de migración a WhatsApp. **El canal activo actualmente es Telegram** — ver [CONFIG_TELEGRAM.md](CONFIG_TELEGRAM.md). Este doc se conserva para cuando se decida migrar (ej: cuando el equipo crezca y necesite notificar a clientes en WhatsApp además del equipo interno).

> Cuando se haga la migración: reemplaza los 2 nodos `Telegram` del WF1 por `WhatsApp Business Cloud`. La lógica de cuándo notificar (éxito o error) se mantiene; solo cambia el canal y el formato del payload.

---

## Nodo n8n a usar

| Item | Valor |
|------|-------|
| Display name | **WhatsApp Business Cloud** |
| Tipo interno | `n8n-nodes-base.whatsApp` |
| Categoría | output |
| Paquete | `n8n-nodes-base` (nativo, no community) |

> ⚠️ NO confundir con `WhatsApp Trigger` (nodos-base.whatsAppTrigger) — ese es para recibir webhooks, no para enviar.

---

## Credencial requerida

| Campo | Valor |
|-------|-------|
| Nombre en n8n | `Ferre_WhatsApp` |
| Tipo | `whatsAppApi` |
| ID | `[PENDIENTE — crear en n8n]` |
| Requiere | Meta Business Account + número verificado + Access Token de larga duración |

**Pasos para crear en Meta:**
1. https://developers.facebook.com → Mis apps → Crear app → tipo "Business"
2. Agregar producto **WhatsApp** → Setup
3. Copiar el **Phone number ID** del dropdown del número de prueba (o agregar el número productivo verificado)
4. Generar **System User Access Token** (no usar el token temporal de 24h del setup) — debe tener permisos `whatsapp_business_messaging` y `whatsapp_business_management`
5. En n8n → Credentials → Add → "WhatsApp API" → pegar Access Token + Phone Number ID

---

## Parámetros de los 2 nodos a configurar

Estos valores son comunes a ambos nodos (`fy-node-020` éxito y `fy-node-022` error):

| Parámetro | Valor |
|-----------|-------|
| `resource` | `message` |
| `operation` | `send` |
| `phoneNumberId` | seleccionar desde dropdown (lo provee la credencial) |
| `recipientPhoneNumber` | `{{ $env.WHATSAPP_TO_NUMBER }}` (o hardcodear el número con código país, ej `573001234567`) |
| `messageType` | `text` |
| `options.appendAttribution` | `false` (NO queremos que añada "Sent automatically with n8n") |
| `additionalFields.previewUrl` | `true` (para que el link al post se muestre con preview) |

---

## Nodo `fy-node-020` — Notificar Éxito WhatsApp

**Reemplaza:** `bf-node-020 Notificar Éxito Telegram` (`n8n-nodes-base.telegram`)

**Parámetro `textBody`** (pegar tal cual con las expresiones n8n):

```
✅ *Nuevo post publicado en Ferretería Ya*

📌 *Título:* {{ $('Parsear JSON articulo').item.json.titulo_seo }}
🔗 *URL:* {{ $('Publicar en WordPress').item.json.link }}
🔑 *Keyword:* {{ $('Leer Keywords Aprobadas').item.json.keyword }}
```

**Conexión:** mantener entrada desde `Actualizar Sheet Publicado` (igual que en BF).

---

## Nodo `fy-node-022` — Notificar Error WhatsApp

**Reemplaza:** `bf-node-022 Notificar Error Telegram` (`n8n-nodes-base.telegram`)

**Parámetro `textBody`** (pegar tal cual):

```
❌ *Error en pipeline Ferretería Ya - WF-1 - Blog SEO*

🔑 *Keyword:* {{ $('Leer Keywords Aprobadas').item.json.keyword || 'desconocida' }}
⚠️ *Fase:* {{ $('Error Trigger').item.json.execution.lastNodeExecuted }}
📝 *Detalle:* {{ $('Error Trigger').item.json.execution.error.message }}
```

**Conexión:** mantener entrada desde `Marcar Error en Sheet` (igual que en BF).

---

## Notas de formato WhatsApp

WhatsApp acepta sintaxis de formato similar a Telegram pero con diferencias:

| Estilo | WhatsApp | Telegram (BF) |
|--------|----------|---------------|
| Negrita | `*texto*` | `*texto*` (Markdown) |
| Cursiva | `_texto_` | `_texto_` |
| Tachado | `~texto~` | `~texto~` |
| Monospace | `` `texto` `` | `` `texto` `` |

Los mensajes que escribimos arriba (`*Título:*`) funcionan idénticamente en ambos. **No requieren adaptación de sintaxis** — solo cambia el canal de envío.

⚠️ **WhatsApp Cloud limita mensajes de servicio** a 1.000 conversaciones únicas/mes en plan free. Para notificaciones internas a un único número del equipo, sobra ampliamente.

---

## Variables de entorno

Asegurarse de que `.env` tenga:

```
WHATSAPP_ACCESS_TOKEN=     # System User Token de Meta
WHATSAPP_PHONE_NUMBER_ID=  # ID del número emisor (no el número en sí)
WHATSAPP_TO_NUMBER=        # Número destino con código país, ej 573001234567
```

El Access Token y Phone Number ID se cargan dentro de la credencial `Ferre_WhatsApp` en n8n; el `WHATSAPP_TO_NUMBER` se referencia en el campo `recipientPhoneNumber` del nodo (o se hardcodea si es un único destino estable).
