# Bigotes Caninos — Credenciales, APIs y Costos

**Última actualización:** 2026-05-07 (9 workflows desplegados con paridad total felino)

> Fuente única de verdad para credenciales en n8n, APIs externas y estimación de costos. Para Master Sheet y nodos, abrir [`../CLAUDE.md`](../CLAUDE.md). Para flujo de cada workflow, abrir [`FLUJO_COMPLETO.md`](FLUJO_COMPLETO.md).

> **Paridad con felino:** mismo formato que [`CREDENCIALES_Y_COSTOS.md`](../../bigotes-felinos/_contexto/CREDENCIALES_Y_COSTOS.md). Las diferencias son: (a) credenciales independientes para OpenAI, Gemini, WP, Telegram, Sheets, GCP Indexing API; (b) credenciales compartidas con felino para GSC, Google Ads y SerpAPI; (c) sin WF2/WF4 → costos mensuales más bajos (-$0.30/mes).

---

## Credenciales en n8n — Plan de creación

Todas las claves se almacenan en el sistema cifrado de n8n. **Nunca en texto plano ni en el repositorio.**

### Credenciales independientes

| Servicio | Nombre en n8n | ID en n8n | Tipo | Usada en | Estado |
|---------|---------------|-----------|------|----------|--------|
| WordPress | `BC - WordPress account` | `yyhjFRj5iigjQV9y` | wordpressApi (Application Password) | WF1, WF3, WF6, WF8, WF9, WF-Util | ✅ creada 2026-05-06 — username `bigotescaninos.com` |
| OpenAI | `BC - OpenAI` | `ALqgbg5Kq6byqHSI` | openAiApi | WF1, WF3, WF5, WF6, WF8 | ✅ creada 2026-05-06 |
| Gemini / nano banana | ~~`BC - nano banana`~~ → **compartida con felino** (ver tabla siguiente) | ~~`OwYSxprFMVxEb7hm`~~ deprecada | — | — | ❌ deprecada 2026-05-07 — el proyecto Google Cloud asociado a esta cred no tenía billing activado, Gemini devolvía `429 RESOURCE_EXHAUSTED` con limit=0. Decisión: reusar la cred del felino que sí tiene billing |
| Telegram | `BC - Telegram Bot` | `g7wMmmirtuG1Ryu9` | telegramApi (Bot Token) | Todos los workflows | ✅ creada 2026-05-06 — bot `@bigotescaninos_pipeline_bot` (id 8417271073), validado E2E |

### Credenciales compartidas con felino (reusar)

| Servicio | Nombre actual en n8n | ID actual | Tipo | Usada en BC en |
|---------|----------------------|-----------|------|----------------|
| Google Search Console | _(OAuth2 reutilizada)_ | `XWbfIBmitmx1uByl` | googleOAuth2Api | WF3, WF5, WF8, WF11 |
| Google Sheets | `Google Sheets account` | `70heM3IFsNK9Cyak` | googleSheetsOAuth2Api | WF1, WF3, WF5, WF6, WF7, WF8, WF9, WF11 |
| **Gemini / nano banana** | `BF/BC - nano banana (compartida)` | `ysOycTrtxEO3BRcW` | httpHeaderAuth (x-goog-api-key) | WF1, WF6 |
| SerpAPI | `SerpAPI` | `44hTDtjkVRDKJOeU` | serpApi | WF5, WF7 |

> **Nota sobre nano banana:** se decidió compartir con el felino el 2026-05-07 porque el proyecto GCP asociado a la cred dedicada del canino no tenía billing activado (Gemini 2.5 Flash Image requiere billing). La cred del felino ya está pagando billing — incremental ~$0.04/mes por las imágenes del canino. Cuando se decida separar billing, se crea proyecto GCP dedicado para BC y se regenera la cred.

> **Nota sobre Google Sheets:** se reusa la credencial OAuth2 ya existente del felino. El Sheet del canino (`1RCiUGZ_AasUDoPs2uxSeUGd_7ptd4KpELrSubTdVAQo`) es propiedad de la misma cuenta Google que autorizó esa credencial — no requiere crear una nueva ni gestionar Client ID/Secret separados. Los workflows del canino usan la credencial `70heM3IFsNK9Cyak` apuntando al `SHEET_ID` distinto.

> **Validación realizada 2026-05-06:** el refresh token GSC actual (ID `XWbfIBmitmx1uByl`) tiene `siteOwner` sobre `https://bigotescaninos.com/` (URL prefix). No requiere regenerar.

> **Nota técnica importante:** la propiedad GSC del canino está como **URL prefix** (`https://bigotescaninos.com/`), NO como Domain (`sc-domain:bigotescaninos.com`). Este detalle es crítico al construir las queries GSC en WF3, WF5, WF8 y WF11 — usar `encodeURIComponent('https://bigotescaninos.com/')` en el path.

---

## Variables de entorno de referencia (`.env`)

Ver [`../.env`](../.env) — plantilla con todas las variables agrupadas en "compartidas con felino" e "independientes de canino".

```
# Compartidas con BF
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
SERPAPI_KEY=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# Independientes de BC
OPENAI_API_KEY=
GEMINI_API_KEY=
WP_URL=https://bigotescaninos.com
WP_USER=
WP_APP_PASSWORD=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=1591872862
SHEET_ID=
GCP_PROJECT_ID=n8n-bigotescaninos
GCP_SERVICE_ACCOUNT_EMAIL=
GCP_SERVICE_ACCOUNT_KEY=
```

---

## APIs y sus costos

### OpenAI — GPT-4o
**Modelo:** `gpt-4o`
**Precios:** $2.50 / 1M tokens entrada · $10.00 / 1M tokens salida

| Workflow | Uso por ejecución | Costo estimado |
|---------|------------------|---------------|
| WF1 — Blog (por artículo) | ~3.000 input + ~5.000 output | ~$0.06 |
| WF3 — Re-opt. (por artículo) | ~6.000 input + ~5.000 output | ~$0.065 |
| WF5 — Generador de Ideas (por run) | ~4.000 input + ~3.000 output | ~$0.04 |
| WF6 — Pillar Generator (por pilar) | ~5.000 input + ~12.000 output | ~$0.13 |
| WF8 — Bulk AEO Migrator (10 posts/run) | ~6.000 input + ~5.000 output × 10 | ~$0.65 |
| WF9 — Pilares Auto-Sync | $0 (no usa GPT) | **$0** |
| WF7 — AEO Monitor | $0 (solo SerpAPI) | **$0** |
| WF11 — GSC Dashboard | $0 (no usa GPT) | **$0** |

**Estimación mensual OpenAI:**
- WF1: 12 artículos × $0.06 = **$0.72**
- WF3: ~5 artículos × $0.065 = **$0.33** (1 run mensual con pocos targets — ver auditoría §11)
- WF5: ~2 runs/mes × $0.04 = **$0.08**
- WF8: 4 runs/mes × $0.65 = **$2.60** (durante migración del catálogo, ~2-3 meses)
- **Total OpenAI: ~$3.73 / mes durante migración WF8 · ~$1.13 / mes después**

**One-shot Sprint 3 (4 pilares + clasificador):**
- WF6 × 4 pilares = ~$0.50
- Clasificador hubs en Sheet existente = ~$0.005
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

**Nota técnica heredada del felino:** NO usar `generationConfig.aspectRatio` — Gemini 2.5 Flash Image NO lo soporta y rechaza con HTTP 400. Reforzar `"16:9 horizontal cinematic widescreen aspect ratio"` directamente en el prompt de texto.

---

### Google Sheets API
**Auth:** OAuth2 (credencial independiente del canino)
**Costo:** Gratuito (300 requests/min por proyecto)
**Usada en:** Lectura de keywords, escritura de estados y AEO/GSC tracking en todos los workflows.

---

### Google Search Console API
**Auth:** OAuth2 (credencial reusada del felino — `XWbfIBmitmx1uByl`)
**Endpoint:** `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query`
**Costo:** Gratuito
**Usada en:**
- WF3 — posiciones últimos 90 días para re-optimización
- WF5 — queries reales con ≥3 impresiones para generación de ideas
- WF8 — sin filtro GSC (procesa por orden cronológico)
- WF11 — snapshot semanal sitewide + top 30 páginas

**Site URL canónico:** `https://bigotescaninos.com/` (URL prefix), no `sc-domain:bigotescaninos.com`.

---

### SerpAPI
**Auth:** Tipo `serpApi` (predefinedCredentialType de n8n — NO `httpQueryAuth`). Credencial compartida con felino.
**Endpoint:** `https://serpapi.com/search`
**Costo:** Free tier (100 búsquedas/mes). El felino usa ~80/mes hoy. **Atención:** sumar uso de canino podría exceder 100 → considerar upgrade a plan pago si ambos proyectos lo necesitan en producción.
**Usada en:**
- WF5 — PAA (People Also Ask) + autocomplete de Google para temas caninos
- WF7 — AI Overview detection con 2-step async fetch (engine=google + engine=google_ai_overview)

---

### WordPress REST API
**Auth:** Application Password (independiente del canino)
**Endpoints principales:**
- `POST /wp-json/wp/v2/posts` — crear post (WF1)
- `POST /wp-json/wp/v2/posts/{id}` — actualizar post / PATCH (WF3, WF8, WF-Util)
- `POST /wp-json/wp/v2/pages` — crear page (WF6, pilares)
- `POST /wp-json/wp/v2/pages/{id}` — actualizar page / PATCH (WF9)
- `GET /wp-json/wp/v2/pages?slug={slug}&context=edit` — obtener page con `content.raw` (WF9)
- `POST /wp-json/wp/v2/media` — subir imagen (WF1, WF6)
- `POST /wp-json/wp/v2/tags` — crear tag (WF1, WF3, WF8)
- `GET /wp-json/wp/v2/posts?slug={slug}` — slug pre-check anti-canibalismo (WF1)
**Costo:** Gratuito.
**Plugin requerido:** `bc-yoast-rest` (equivalente al `bf-yoast-rest` del felino) — expone los campos Yoast (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`) vía REST API. ✅ Instalado y activado 2026-05-06 desde `wp-content/plugins/bc-yoast-rest/`. Validado E2E: PATCH a página 1966 escribió los 3 campos correctamente y Yoast los renderiza en `yoast_head_json`. Fuente: [`_config/wp-plugins/bc-yoast-rest.zip`](../_config/wp-plugins/bc-yoast-rest.zip).

---

### Telegram Bot API
**Bot:** `@bigotescaninos_pipeline_bot` (a crear)
**Chat ID destinatario:** `1591872862` (mismo que felino — mismo destinatario humano)
**Costo:** Gratuito.
**Usada en:** Notificaciones de éxito y error en los 9 workflows.

---

### Google Indexing API (opcional)
**Estado en felino:** eliminada el 2026-04-25 — la GSC UI no acepta emails de service accounts como Owner; el ping de sitemap fue deprecado por Google en enero 2024.
**Decisión para canino:** **NO implementar inicialmente.** La indexación natural vía sitemap de Yoast en 1-3 días es suficiente. Reabrir solo si el sitio gana autoridad y tiene picos editoriales que requieran indexación inmediata.
**Variables `.env` reservadas** (`GCP_PROJECT_ID`, `GCP_SERVICE_ACCOUNT_*`) por si se decide implementar más adelante.

---

## Infraestructura n8n

| Ítem | Detalle |
|------|---------|
| Tipo | Self-hosted en Hostinger VPS (compartido con felino) |
| URL | `https://n8n.srv1398596.hstgr.cloud/` |
| API URL | `https://n8n.srv1398596.hstgr.cloud/api/v1` |
| Contenedor | Docker |
| Costo extra para canino | $0 (misma instancia) |

---

## Resumen de costos mensuales

| Servicio | Costo mensual | ¿Tiene free tier? |
|---------|--------------|------------------|
| OpenAI GPT-4o (estado estable, sin WF8) | ~$1.13 | No (pay per use) |
| OpenAI GPT-4o (durante migración WF8, ~3 meses) | ~$3.73 | No (pay per use) |
| Google Gemini | ~$0.04 | Sí (límite generoso) |
| Google Sheets API | $0 | ✅ Gratuito |
| Google Search Console API | $0 | ✅ Gratuito |
| SerpAPI | $0 | ✅ Free tier 100/mes (compartido con BF — vigilar uso combinado) |
| WordPress REST API | $0 | ✅ Gratuito |
| Telegram Bot API | $0 | ✅ Gratuito |
| n8n (self-hosted) | $0 extra | ✅ Compartido con BF |
| **TOTAL APIs (estado estable)** | **~$1.17 / mes** | |
| **TOTAL APIs (durante WF8 migración)** | **~$3.77 / mes** | |

**Costos one-shot:**
- Sprint 3 completo (4 pilares + clasificador): **~$0.50** una sola vez

**Comparativa con felino:**
- Felino estado estable: ~$1.87/mes
- Canino estado estable: ~$1.17/mes
- Diferencia: **-$0.70/mes** (canino más barato porque no tiene WF2 ni WF4)

---

## IDs de recursos importantes (a llenar conforme se creen)

| Recurso | ID / Valor |
|---------|-----------|
| Google Sheet (Master) | `1RCiUGZ_AasUDoPs2uxSeUGd_7ptd4KpELrSubTdVAQo` ✅ |
| Hoja del pipeline blog | `Blog` (cols A-M + R-S — sin N-Q huérfanas del felino) |
| Hoja AEO tracking | `AEO_Tracking` (cols A-H) |
| Hoja GSC tracking sitewide | `GSC_Tracking` (cols A-I) |
| Hoja GSC tracking pages | `GSC_Pages_Tracking` (cols A-H) |
| WordPress URL base | `https://bigotescaninos.com` |
| Telegram Chat ID | `1591872862` |
| WF1 Blog SEO (n8n ID) | `vQJ5gCIDbNq2zqd8` ✅ desplegado 2026-05-06. **Validado E2E con primera publicación: post 1973 `/salud/cuanto-cuesta-esterilizar-un-perro-en-colombia/`**. Cron `0 8 * * *` con timezone `America/Bogota` = 8am Bogotá local. **Días activos: martes/jueves/sábado** (decisión 2026-05-07, vs martes/jueves/sábado del felino). Bug fixes aplicados: categoriaMap canino + inferirCategoria con fallback al hub Sheet + wordcount calculado. Snapshot: [`_tmp/BC_WF1_snapshot.json`](../_tmp/BC_WF1_snapshot.json) |
| WF6 Pillar Generator (n8n ID) | `37ZMWhzGb3ObewQ6` ✅ desplegado 2026-05-07. **4 pilares creados exitosamente** (Salud 1979, Alimentación 1981, Razas 1983, Comportamiento 1985). Manual ÚNICAMENTE. Snapshot: [`_tmp/BC_WF6_snapshot.json`](../_tmp/BC_WF6_snapshot.json) |
| WF9 Pilares Auto-Sync (n8n ID) | `VUA4Rnm3hYWVqcE5` ✅ desplegado y **activo** 2026-05-07. Cron `30 8 * * *` (8:30am Bogotá diario). Backfill validado E2E: 79 clusters distribuidos en 4 pilares en 2 segundos. Snapshot: [`_tmp/BC_WF9_snapshot.json`](../_tmp/BC_WF9_snapshot.json) |
| WF8 Bulk AEO Migrator (n8n ID) | `4vPCym417t5nO9ru` ✅ creado 2026-05-07 (inactivo, manual). 23 nodos. Manual ÚNICAMENTE. Procesa 10 posts viejos por run con stack AEO completo. Quality Gate threshold 60 (vs 70 de WF1) sin HARD GATE de tabla. Rate limit batching (25s entre items, ~4 min/run). En ejecución gradual por usuario. Snapshot: [`_tmp/BC_WF8_snapshot.json`](../_tmp/BC_WF8_snapshot.json) |
| WF-Util Force Re-optimize Post (n8n ID) | `n3j1DIxnMIJ5Xahw` ✅ desplegado y **activo** 2026-05-07. 22 nodos. Webhook POST `/webhook/bc-force-reopt-post` (path distinto del felino para evitar conflicto). Body: `{"post_id": <num>, "keyword": "<override>"}`. Validado E2E: post 591 (popo-verde) Quality 105 + post 25 (gonorrea) Quality 107. Snapshot: [`_tmp/BC_WFUtil_snapshot.json`](../_tmp/BC_WFUtil_snapshot.json) |
| WF11 GSC Weekly Dashboard (n8n ID) | `39sEBfGprwCtVKOD` ✅ desplegado y **activo** 2026-05-07. 10 nodos. Cron `0 9 * * 1` con timezone Bogotá = lunes 9am local + Manual. Costo $0 (no usa GPT). Snapshot: [`_tmp/BC_WF11_snapshot.json`](../_tmp/BC_WF11_snapshot.json) |
| WF7 AEO Monitor (n8n ID) | `RYhnbWPasSKE5HL6` ✅ desplegado y **activo** 2026-05-07. 12 nodos. Cron `0 9 * * 1` lunes 9am Bogotá + Manual. Detecta citas en Google AI Overview de top 20 keywords. Costo SerpAPI ~80 credits/mes (vigilar combinado con felino — total ~160/mes vs free tier 100). Snapshot: [`_tmp/BC_WF7_snapshot.json`](../_tmp/BC_WF7_snapshot.json) |
| WF3 Re-optimización SEO (n8n ID) | `PloVJdTP2G8lKMNo` ✅ creado 2026-05-07 (**inactivo intencional**). 26 nodos. Cron `0 8 1 * *` (1° de cada mes 8am Bogotá) + Manual. **Razón inactivo:** WF3 necesita posts en posición GSC 6-50 con ≥5 imp; el catálogo BC actual tiene poca distribución útil ahí. Activar después de que WF8 migre el catálogo a AEO completo (~2-3 meses) y los posts hayan tenido tiempo de re-rankear. Snapshot: [`_tmp/BC_WF3_snapshot.json`](../_tmp/BC_WF3_snapshot.json) |
| WF3 Re-optimización (n8n ID) | ⏳ pendiente |
| WF5 Generador de Ideas (n8n ID) | ⏳ pendiente |
| WF6 Pillar Generator (n8n ID) | ⏳ pendiente |
| WF7 AEO Monitor (n8n ID) | ⏳ pendiente |
| WF8 Bulk AEO Migrator (n8n ID) | ⏳ pendiente |
| WF9 Pilares Auto-Sync (n8n ID) | ⏳ pendiente |
| WF11 GSC Weekly Dashboard (n8n ID) | ⏳ pendiente |
| WF-Util Force Re-optimize Post (n8n ID) | ⏳ pendiente |

**Pilares publicados (Sprint 3 desplegado 2026-05-07):**

| Hub | Page ID WP | URL pública |
|-----|-----------|-------------|
| Salud | **1979** | https://bigotescaninos.com/guia-salud-canina/ |
| Alimentación | **1981** | https://bigotescaninos.com/guia-alimentacion-perros/ |
| Razas | **1983** | https://bigotescaninos.com/guia-razas-perros/ |
| Comportamiento y Adiestramiento | **1985** | https://bigotescaninos.com/guia-comportamiento-canino/ |
