# Ferretería Ya — Credenciales, APIs y Costos

**Última actualización:** 2026-05-01

---

## Credenciales en n8n

Todas las claves están almacenadas en el sistema cifrado de n8n. **Nunca en texto plano ni en el repositorio.**

| Servicio | Nombre en n8n | ID en n8n | Tipo | Usada en |
|---------|--------------|-----------|------|---------|
| WordPress | `Ferre_WordPress` | `tSY0QM8DwewkbOvJ` | Application Password (`wordpressApi`) — usuario `feruroc@gmail.com` | WF1 |
| OpenAI | `Ferre_Blog_OpenAi` | `5Rvr3r9lUss9Vb5j` | `openAiApi` | WF1 |
| Google Sheets | `Ferre Google Sheets account` | `uonq78tDtE28NMdx` | `googleSheetsOAuth2Api` | WF1 |
| Gemini / nano banana | `Ferre_Blog_NanoBanana` | `RTWfgCqeObrVs9Pk` | `httpHeaderAuth` (`x-goog-api-key`) | WF1 |
| Telegram (canal activo) | `Ferre_Telegram` | `qoDPp0fY5sJ8AmbE` | `telegramApi` — bot `@Ferreteriaya_pipeline_bot` | WF1 |
| WhatsApp Business Cloud (migración futura) | `Ferre_WhatsApp` | — | `whatsAppApi` | reservado |
| SerpAPI | `Ferre_SerpApi` | `IHe5FCEzs9GC5BlE` | `serpApi` | _(reservado para futuro WF de ideas)_ |

> ✅ **Nota:** Se decidió reusar la credencial `uonq78tDtE28NMdx` (originalmente `Google Sheets account`) renombrándola a `Ferre Google Sheets account`. Es del tipo correcto y está OAuth-eada con `feruroc@gmail.com`. La credencial vieja `LvqgRgxnk4BolESc` (`googleOAuth2Api`) queda obsoleta.

**WF1** = Blog SEO (`Ferretería Ya - WF-1 - Blog SEO`)

---

## Variables de entorno de referencia (`.env`)

```
# WordPress
WP_URL=https://ferreteriaya.com.co
WP_USER=
WP_APP_PASSWORD=         # WP Admin → Usuarios → Perfil → Contraseñas de aplicación → "n8n"

# Google Sheets
GOOGLE_SHEETS_ID=        # PENDIENTE — crear sheet y copiar el ID de la URL

# WhatsApp Business Cloud API (Meta)
WHATSAPP_ACCESS_TOKEN=   # Meta for Developers → app → WhatsApp → Access Token
WHATSAPP_PHONE_NUMBER_ID=  # Meta for Developers → app → WhatsApp → Phone Number ID
WHATSAPP_TO_NUMBER=      # Número destino con código de país (ej: 573001234567)

# nano banana / Gemini
GEMINI_API_KEY=

# SerpAPI
SERPAPI_KEY=
```

---

## APIs y sus costos

### OpenAI — GPT-4o
**Modelo:** `gpt-4o`
**Precios:** $2.50 / 1M tokens entrada · $10.00 / 1M tokens salida

| Workflow | Uso por ejecución | Costo estimado |
|---------|------------------|---------------|
| WF1 — Blog (por artículo) | ~3.000 input + ~5.000 output | ~$0.06 |

**Estimación mensual OpenAI:**
- WF1: 12 artículos/mes × $0.06 = **~$0.72 / mes**

> Cadencia base: 3 artículos/semana (L/M/V) ≈ 12 artículos/mes.

---

### Google Gemini — Imagen destacada
**Modelo:** `gemini-2.5-flash-image`
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
**Auth:** Header `x-goog-api-key`

| Uso | Costo |
|-----|-------|
| 1 imagen 16:9 por artículo | ~$0.003 |
| 12 artículos/mes | ~$0.04 / mes |

---

### Google Sheets API
**Auth:** OAuth2
**Costo:** Gratuito (quota generosa: 300 requests/min por proyecto)
**Usada en:** Lectura de keywords aprobadas, escritura de estados, índice de posts publicados.

---

### WordPress REST API
**Auth:** Application Password (usuario + contraseña de aplicación generada en WP Admin)
**Endpoints principales:**
- `POST /wp-json/wp/v2/posts` — crear post
- `POST /wp-json/wp/v2/posts/{id}` — actualizar post (PATCH lógico)
- `POST /wp-json/wp/v2/media` — subir imagen
- `POST /wp-json/wp/v2/media/{id}` — asignar alt text
- `POST /wp-json/wp/v2/tags` — crear tag (con `continueOnFail` para tags ya existentes)
**Costo:** Gratuito (API nativa de WordPress)
**Plugin requerido:** `fy-yoast-rest` — habilita escritura de campos Yoast (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`) vía REST.

---

### Telegram Bot API (canal activo)
**Endpoint:** `https://api.telegram.org/bot<TOKEN>/sendMessage`
**Auth:** Bot Token (creado vía @BotFather)
**Costo:** 100% gratis, sin límite de mensajes.
**Usada en:** Notificaciones de éxito (fy-node-020) y error (fy-node-022).
**Requiere:** Bot creado en Telegram + Chat ID del receptor.

### WhatsApp Business Cloud API (Meta) — migración futura
**Endpoint:** `https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages`
**Auth:** Bearer Token (Access Token de Meta)
**Costo:** Gratuito hasta 1.000 conversaciones de servicio/mes.
**Estado en este proyecto:** Documentado en `_config/CONFIG_WHATSAPP.md`. Migración planeada para cuando se necesite notificar a clientes externos además del equipo.
**Requiere:** Meta Business Account + número verificado + Access Token de larga duración.

---

### SerpAPI
**Auth:** API Key
**Costo:** Plan gratuito 100 búsquedas/mes; paid desde $50/mes (5.000 búsquedas).
**Estado en este proyecto:** Configurada pero no consumida por WF1. Reservada para un futuro workflow de generación de ideas.

---

## Infraestructura n8n

| Ítem | Detalle |
|------|---------|
| Tipo | Self-hosted en Hostinger VPS |
| URL | `https://n8n.srv1398596.hstgr.cloud/` |
| Contenedor | Docker |
| Costo | Incluido en el plan de hosting de Hostinger (compartido con bigotes-felinos) |

---

## Resumen de costos mensuales

| Servicio | Costo mensual | ¿Tiene free tier? |
|---------|--------------|------------------|
| OpenAI GPT-4o | ~$0.72 | No (pay per use) |
| Google Gemini | ~$0.04 | Sí (límite generoso) |
| Google Sheets API | $0 | ✅ Gratuito |
| WordPress REST API | $0 | ✅ Gratuito |
| Telegram Bot API | $0 | ✅ Gratis ilimitado |
| SerpAPI | $0 | ✅ 100 búsquedas/mes (no consumidas en WF1) |
| n8n (self-hosted) | $0 extra | ✅ Incluido en hosting |
| **TOTAL APIs** | **~$0.76 / mes** | |

> **Nota:** El costo escala linealmente con la cadencia de publicación. Pasar a 5 artículos/semana (~20/mes) llevaría OpenAI a ~$1.20/mes. La variable de mayor impacto es el uso de GPT-4o.

---

## IDs de recursos importantes

| Recurso | ID / Valor |
|---------|-----------|
| Google Sheet (Master) | `1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM` |
| Hoja del pipeline | `Blog` |
| WordPress URL base | `https://ferreteriaya.com.co` |
| WhatsApp Phone Number ID | `[PENDIENTE — Meta for Developers]` |
| WhatsApp número destino | `[PENDIENTE]` |
| WF1 Blog (n8n ID) | `[PENDIENTE — asignado al importar]` |

---

## Comparación con bigotes-felinos

Las credenciales `Ferre_Blog_OpenAi`, `Ferre_Blog_NanoBanana`, `Ferre`, `Ferre_SerpApi` son **independientes** de las de bigotes-felinos. Aunque comparten infraestructura n8n, cada cliente mantiene sus propias claves para aislamiento de costos y permisos.

| Aspecto | bigotes-felinos | Ferretería Ya |
|---------|----------------|---------------|
| Workflows activos | 5 (Blog, Redes, Re-opt, Entret., Ideas) | 1 (Blog SEO) |
| Costo mensual APIs | ~$1.79 | ~$0.76 |
| Notificaciones | Telegram | Telegram (canal activo); WhatsApp planeado como migración futura |
| Plugin Yoast REST | `bf-yoast-rest` | `fy-yoast-rest` |
