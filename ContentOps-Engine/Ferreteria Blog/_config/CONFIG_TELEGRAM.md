# Configuración nodos Telegram — Ferretería Ya (canal actual)

> **Decisión activa:** Telegram es el canal de notificaciones del WF1 mientras se prepara la migración a WhatsApp Business Cloud. Ver [CONFIG_WHATSAPP.md](CONFIG_WHATSAPP.md) para el plan de migración futura.

---

## Nodo n8n a usar

| Item | Valor |
|------|-------|
| Display name | **Telegram** |
| Tipo interno | `n8n-nodes-base.telegram` |
| Operación | `sendMessage` (operation por defecto del recurso `message`) |
| Paquete | `n8n-nodes-base` (nativo) |

---

## Credencial requerida

| Campo | Valor |
|-------|-------|
| Nombre en n8n | `Ferre_Telegram` |
| Tipo | `telegramApi` |
| ID | `qoDPp0fY5sJ8AmbE` ✅ Activa |
| Único campo | `accessToken` (Bot Token de @BotFather) |
| Bot | `@Ferreteriaya_pipeline_bot` ([abrir chat](https://t.me/Ferreteriaya_pipeline_bot)) |
| Chat ID destinatario | `1591872862` |

> El **chat ID** NO es parte de la credencial — se especifica en cada nodo. Esto permite que el mismo bot mande mensajes a distintos chats si en el futuro hace falta.

---

## Parámetros comunes a los 2 nodos

| Parámetro | Valor |
|-----------|-------|
| `chatId` | `1591872862` (hardcodeado en los 2 nodos — n8n proceso no comparte el `.env` del proyecto) |
| `additionalFields.parse_mode` | `Markdown` |

> Telegram Markdown soporta: `*negrita*`, `_cursiva_`, `` `monospace` ``, `[texto](url)`. Todos los caracteres especiales `_*[]()~`>#+-=|{}.!` deben escaparse con `\` si se usan literalmente.

---

## Nodo `fy-node-020` — Notificar Éxito Telegram

**Reemplaza directamente:** `bf-node-020 Notificar Éxito Telegram` (mismo tipo de nodo, solo cambia el texto).

**Parámetro `text`** (pegar tal cual con las expresiones n8n, incluido el `=` inicial que indica expresión):

```
=✅ *Nuevo post publicado en Ferretería Ya*

📌 *Título:* {{ $('Parsear JSON articulo').item.json.titulo_seo }}
🔗 *URL:* {{ $('Publicar en WordPress').item.json.link }}
🔑 *Keyword:* {{ $('Leer Keywords Aprobadas').item.json.keyword }}
```

**Conexión:** mantener entrada desde `Actualizar Sheet Publicado`.

---

## Nodo `fy-node-022` — Notificar Error Telegram

**Reemplaza directamente:** `bf-node-022 Notificar Error Telegram`.

**Parámetro `text`** (pegar tal cual):

```
=❌ *Error en pipeline Ferretería Ya - WF-1 - Blog SEO*

🔑 *Keyword:* {{ $('Leer Keywords Aprobadas').item.json.keyword || 'desconocida' }}
⚠️ *Fase:* {{ $('Error Trigger').item.json.execution.lastNodeExecuted }}
📝 *Detalle:* {{ $('Error Trigger').item.json.execution.error.message }}
```

**Conexión:** mantener entrada desde `Marcar Error en Sheet`.

---

## Variables de entorno

```env
# Telegram (canal activo de notificaciones)
TELEGRAM_BOT_TOKEN=        # Bot Token de @BotFather
TELEGRAM_CHAT_ID=          # Tu chat personal con el bot (numérico)
```

El `TELEGRAM_BOT_TOKEN` se carga dentro de la credencial `Ferre_Telegram` en n8n. El `TELEGRAM_CHAT_ID` se referencia en el campo `chatId` de cada nodo (o se hardcodea si es un único destino estable).

---

## Costos

| Item | Valor |
|------|-------|
| Telegram Bot API | 100% gratis, sin límite de mensajes |
| Free tier | No aplica — todo gratis |

> Comparación con WhatsApp: Meta cobra mensajes después de 1.000 conversaciones únicas/mes. Para notificaciones internas a 1 persona del equipo, Telegram tiene cero fricción y cero costo.

---

## Pasos para cuando llegue el Bot Token

1. Crear credencial `Ferre_Telegram` en n8n vía MCP:
   ```
   action: create
   name: Ferre_Telegram
   type: telegramApi
   data: { "accessToken": "<TOKEN_DE_BOTFATHER>" }
   ```
2. Asignar credencial a los 2 nodos `fy-node-020` y `fy-node-022` del WF1 clonado
3. Test rápido: ejecutar manualmente uno de los 2 nodos y verificar que llega el mensaje al chat
