# Bigotes Felinos — Credenciales, APIs y Costos

**Última actualización:** 2026-05-04 (Sprint 3 desplegado: WF6 + WF9)

> Esta es la **fuente única de verdad** para credenciales en n8n, APIs externas y estimación de costos. Para Master Sheet y nodos, abrir [`../CLAUDE.md`](../CLAUDE.md). Para flujo de cada workflow, abrir [`FLUJO_COMPLETO.md`](FLUJO_COMPLETO.md).

---

## Credenciales en n8n

Todas las claves están almacenadas en el sistema cifrado de n8n. **Nunca en texto plano ni en el repositorio.**

| Servicio | Nombre en n8n | ID en n8n | Tipo | Usada en |
|---------|--------------|-----------|------|---------|
| WordPress | `Wordpress account` | `r90z9yKyuuNlhBLy` | Application Password | WF1, WF3, WF6, WF8, WF9 |
| OpenAI | `N8N_BigotesFelinos` | `sZscccSGx3nfNyOm` | API Key | WF1, WF2, WF3, WF4, WF5, WF6, WF8 |
| Google Sheets | `Google Sheets account` | `70heM3IFsNK9Cyak` | OAuth2 | WF1, WF2, WF3, WF4, WF5, WF6, WF7, WF8, WF9 |
| Gemini / nano banana | `nano banana` | `ysOycTrtxEO3BRcW` | HTTP Header Auth (x-goog-api-key) | WF1, WF6 |
| Telegram | `Telegram BF Bot` | `7iBygAb1uGxktnFH` | Bot Token | WF1, WF2, WF3, WF4, WF5, WF6, WF7, WF8, WF9 |
| Google Search Console | _(OAuth2 reutilizada)_ | `XWbfIBmitmx1uByl` | OAuth2 (googleOAuth2Api) | WF3, WF5, WF8 |
| SerpAPI | `SerpAPI` | `44hTDtjkVRDKJOeU` | serpApi | WF5, WF7 |

**Workflows:** WF1 Blog SEO · WF2 Redes Sociales · WF3 Re-optimización GSC · WF4 Entretenimiento · WF5 Generador de Ideas · WF6 Pillar Generator · WF7 AEO Monitor · WF8 Bulk AEO Migrator · WF9 Pilares Auto-Sync

---

## Variables de entorno de referencia (`.env`)

```
# OpenAI
OPENAI_API_KEY=sk-...

# Google (Sheets + GSC)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...

# Gemini
GEMINI_API_KEY=...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=1591872862

# WordPress
WP_URL=https://bigotesfelinos.com
WP_USER=...
WP_APP_PASSWORD=...

# Google Sheets
SHEET_ID=1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s
```

---

## APIs y sus costos

### OpenAI — GPT-4o
**Modelo:** `gpt-4o`
**Precios:** $2.50 / 1M tokens entrada · $10.00 / 1M tokens salida

| Workflow | Uso por ejecución | Costo estimado |
|---------|------------------|---------------|
| WF1 — Blog (por artículo) | ~3.000 input + ~5.000 output | ~$0.06 |
| WF2 — Redes (por artículo) | ~2.000 input + ~2.000 output | ~$0.025 |
| WF3 — Re-opt. (por artículo) | ~6.000 input + ~5.000 output | ~$0.065 |
| WF4 — Entretenimiento (por situación) | ~1.000 input + ~1.500 output | ~$0.02 |
| WF5 — Generador de Ideas (por run) | ~4.000 input + ~3.000 output | ~$0.04 |
| WF6 — Pillar Generator (por pilar) | ~5.000 input + ~12.000 output | ~$0.13 |
| WF8 — Bulk AEO Migrator (10 posts/run) | ~6.000 input + ~5.000 output × 10 | ~$0.65 |
| WF9 — Pilares Auto-Sync | $0 (no usa GPT, solo WP REST) | **$0** |
| WF7 — AEO Monitor | $0 (no usa GPT, solo SerpAPI) | **$0** |

**Estimación mensual OpenAI:**
- WF1: 12 artículos × $0.06 = **$0.72**
- WF2: 12 artículos × $0.025 = **$0.30**
- WF3: 10 artículos × $0.065 = **$0.65** (1 run mensual)
- WF4: 4 situaciones × $0.02 = **$0.08**
- WF5: ~2 runs/mes × $0.04 = **$0.08**
- WF8: 4 runs/mes × $0.65 = **$2.60** (mientras dura la migración del catálogo histórico, ~3 meses)
- **Total OpenAI: ~$4.43 / mes durante migración WF8 · ~$1.83 / mes después**

**Sprint 3 (one-shot, ya pagado):**
- WF6 × 4 pilares = ~$0.50 una sola vez
- Clasificador one-shot = ~$0.005 (188 keywords con dedup determinístico)
- **Total Sprint 3: ~$0.50** (no recurrente)

---

### Google Gemini — Imagen destacada
**Modelo:** `gemini-2.5-flash-image`
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
**Auth:** Header `x-goog-api-key`

| Uso | Costo |
|-----|-------|
| 1 imagen 16:9 por artículo (WF1) | ~$0.003 |
| 1 imagen por pilar (WF6, one-shot) | ~$0.003 |
| 12 artículos/mes | ~$0.04 / mes |

**Nota técnica:** NO usar `generationConfig.aspectRatio` — Gemini 2.5 Flash Image NO lo soporta y rechaza con HTTP 400. Reforzar `"16:9 horizontal cinematic widescreen aspect ratio"` directamente en el prompt de texto (ya implementado en WF1 y WF6).

---

### Google Sheets API
**Auth:** OAuth2
**Costo:** Gratuito (quota generosa: 300 requests/min por proyecto)
**Usada en:** Lectura de keywords, escritura de estados y copies en todos los workflows.

---

### Google Search Console API
**Auth:** OAuth2 (misma cuenta Google del sitio)
**Endpoint:** `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query`
**Costo:** Gratuito
**Usada en:** WF3 (posiciones últimos 90 días para re-optimización) · WF5 (queries reales con ≥3 impresiones para generación de ideas).

---

### SerpAPI
**Auth:** Tipo `serpApi` (predefinedCredentialType de n8n — NO `httpQueryAuth`)
**Endpoint:** `https://serpapi.com/search`
**Costo:** Free tier (100 búsquedas/mes). Uso actual: ~80 credits/mes (WF5 ~10 + WF7 ~70)
**Usada en:**
- WF5 — PAA (People Also Ask) + autocomplete de Google para ideas felinas
- WF7 — AI Overview detection con 2-step async fetch (primer call obtiene `page_token`, segundo call recupera el contenido del AIO)

---

### WordPress REST API
**Auth:** Application Password (usuario + contraseña de aplicación generada en WP)
**Endpoints principales:**
- `POST /wp-json/wp/v2/posts` — crear post (WF1)
- `POST /wp-json/wp/v2/posts/{id}` — actualizar post / PATCH (WF3, WF8)
- `POST /wp-json/wp/v2/pages` — crear page (WF6, pilares)
- `POST /wp-json/wp/v2/pages/{id}` — actualizar page / PATCH (WF9, sync diario)
- `GET /wp-json/wp/v2/pages?slug={slug}&context=edit` — obtener page con `content.raw` (WF9)
- `POST /wp-json/wp/v2/media` — subir imagen (WF1, WF6)
- `POST /wp-json/wp/v2/tags` — crear tag (WF1, WF3, WF8)
**Costo:** Gratuito (API nativa de WordPress)
**Plugin requerido:** `bf-yoast-rest` — habilita escritura de campos Yoast (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`) vía REST.

---

### Telegram Bot API
**Bot:** `@bigotesfelinos_pipeline_bot`
**Chat ID:** `1591872862`
**Costo:** Gratuito
**Usada en:** Notificaciones de éxito y error en todos los workflows.

---

## Infraestructura n8n

| Ítem | Detalle |
|------|---------|
| Tipo | Self-hosted en Hostinger VPS |
| URL | `https://n8n.srv1398596.hstgr.cloud/` |
| Contenedor | Docker |
| Costo | Incluido en el plan de hosting de Hostinger |

---

## Resumen de costos mensuales

| Servicio | Costo mensual | ¿Tiene free tier? |
|---------|--------------|------------------|
| OpenAI GPT-4o (sin migración WF8) | ~$1.83 | No (pay per use) |
| OpenAI GPT-4o (durante migración WF8, ~3 meses) | ~$4.43 | No (pay per use) |
| Google Gemini | ~$0.04 | Sí (límite generoso) |
| Google Sheets API | $0 | ✅ Gratuito |
| Google Search Console API | $0 | ✅ Gratuito |
| SerpAPI | $0 | ✅ Free tier 100/mes |
| WordPress REST API | $0 | ✅ Gratuito |
| Telegram Bot API | $0 | ✅ Gratuito |
| n8n (self-hosted) | $0 extra | ✅ Incluido en hosting |
| **TOTAL APIs (estado estable)** | **~$1.87 / mes** | |
| **TOTAL APIs (durante WF8 migración)** | **~$4.47 / mes** | |

**Costos one-shot ya pagados:**
- Sprint 3 completo (4 pilares + clasificador): **~$0.50** una sola vez

> **Nota:** El costo puede variar si se aumenta la frecuencia de WF3 (más de 10 artículos/mes), si el blog escala a más de 3 artículos/semana, o si WF5 se ejecuta más de 2 veces/mes. La variable de mayor impacto es el uso de GPT-4o. Después de migrar los 130 posts viejos con WF8 (~3 meses), el costo vuelve al estado estable de ~$1.87/mes.

---

## IDs de recursos importantes

| Recurso | ID / Valor |
|---------|-----------|
| Google Sheet (Master) | `1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s` |
| Hoja del pipeline blog | `Blog` (cols activas A-M + R-S; N-Q huérfanas) |
| Hoja redes sociales | `Redes Sociales` (cols A-I) |
| Hoja AEO tracking | `AEO_Tracking` (cols A-H) |
| WordPress URL base | `https://bigotesfelinos.com` |
| Telegram Chat ID | `1591872862` |
| WF1 Blog SEO (n8n ID) | `IVKelNHLoEaWD92B` |
| WF2 Redes Sociales (n8n ID) | `3PWQY3biRhOyN1IA` |
| WF3 Re-optimización GSC (n8n ID) | `T46531TOrPeT6VmS` |
| WF4 Entretenimiento (n8n ID) | `ylPUrgrgbL1wLnQ2` |
| WF5 Generador de Ideas (n8n ID) | `yRbv29Y6FiQHn1Qg` |
| WF6 Pillar Generator (n8n ID) | `cE3mJkzcKmJrWg4z` |
| WF7 AEO Monitor (n8n ID) | `73UFpj4m2vke6IPk` |
| WF8 Bulk AEO Migrator (n8n ID) | `vB8ya9OSUyLsQuLg` |
| WF9 Pilares Auto-Sync (n8n ID) | `XvMhI97WVqj49U9f` |

**Pilares publicados (Sprint 3):**

| Hub | Page ID WP | URL pública |
|-----|-----------|-------------|
| Salud | 2700 | https://bigotesfelinos.com/guia-salud-felina/ |
| Alimentación | 2702 | https://bigotesfelinos.com/guia-alimentacion-gatos/ |
| Razas | 2704 | https://bigotesfelinos.com/guia-razas-gatos/ |
| Mundo | 2706 | https://bigotesfelinos.com/guia-comportamiento-felino/ |
