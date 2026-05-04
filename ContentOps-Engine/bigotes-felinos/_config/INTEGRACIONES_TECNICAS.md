# Configuración Técnica: Bigotes Felinos

## 1. WordPress

| Parámetro | Valor |
|-----------|-------|
| URL sitio | `https://bigotesfelinos.com/` |
| URL blog | `https://bigotesfelinos.com/blog-2/` |
| REST API endpoint posts | `https://bigotesfelinos.com/wp-json/wp/v2/posts` |
| REST API endpoint media | `https://bigotesfelinos.com/wp-json/wp/v2/media` |
| Autenticación | Application Password (usuario + contraseña de aplicación) |
| Plugin SEO | Yoast SEO — enviar `yoast_meta` con `title` y `description` |
| Estado de publicación | `publish` (publicación directa, sin revisión) |

**Categorías disponibles y sus slugs:**
| Nombre | Uso recomendado |
|--------|----------------|
| Alimentación del gato | Posts sobre nutrición, dietas, alimentos |
| El mundo del gato | Comportamiento, curiosidades, entretenimiento |
| Noticias | Novedades del sector felino |
| Razas de gatos | Guías por raza |
| Salud del gato | Enfermedades, veterinaria, bienestar |

**Schemas JSON-LD inyectados en cada artículo (AEO — desde Sprint 1+2 / 2026-05-03):**

| Schema | Cuándo se inyecta | Selector / Contenido |
|--------|-------------------|----------------------|
| `FAQPage` | Siempre (si `faq_items.length > 0`) | Las 5-6 Q/A del artículo |
| `WebPage` con `speakable` | Siempre | `cssSelector: ['.respuesta-directa', '.key-takeaways']` para asistentes de voz |
| `WebPage.mentions[]` con `sameAs` Wikipedia | Si GPT genera `entities[]` válidas | 3-8 entidades canónicas (razas, enfermedades, parásitos, organizaciones) |
| `HowTo` con `step[]` | Solo si keyword es procedural y GPT genera `howto_steps[]` con ≥4 pasos | Pasos numerados con `name` y `text` |

**Recursos AEO en raíz del dominio:**
- `https://bigotesfelinos.com/llms.txt` — declaración para crawlers de IA (Anthropic, OpenAI, Perplexity)
- `https://bigotesfelinos.com/equipo-editorial/` — política editorial + fuentes consultadas (E-E-A-T signal)

**Credenciales:** Ver `.env` → `WP_USER`, `WP_APP_PASSWORD`

---

## 2. Google Sheets (Master Sheet)

| Parámetro | Valor |
|-----------|-------|
| Nombre | `Bigotes Felinos — Master Sheet` |
| ID | `1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s` |
| Hojas activas | `Blog` (pipeline) · `Redes Sociales` (copies para publicación) |
| Trigger de workflow | Columna `estado` en hoja `Blog` cambia a `Aprobado` |

**Hoja `Blog` — columnas:**
```
keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M)
```

**Hoja `Redes Sociales` — columnas:**
```
tipo(A) | keyword(B) | url_post(C) | fecha_social(D) | estado(E) | copy_instagram(F) | copy_facebook(G) | guion_tiktok(H) | guion_youtube(I)
```

**Estados del pipeline (hoja Blog):**
- `Pendiente` — keyword registrada, en espera
- `Aprobado` — disparador del workflow
- `En proceso` — n8n está trabajando
- `Publicado` — post live en WordPress
- `Error` — falló en alguna fase (ver log)
- `Canibalismo` — keyword similar a post existente
- `Re-optimizar` — señalado por GSC para revisión

**Credenciales:** Ver `.env` → `GOOGLE_SHEETS_ID`, credencial OAuth en n8n

---

## 3. APIs de Inteligencia Artificial

### OpenAI
| Parámetro | Valor |
|-----------|-------|
| Generación de texto | GPT-4o |
| Estado API Key | ✅ Configurada en n8n |

**Credencial n8n:** `N8N_BigotesFelinos` (tipo `openAiApi`, ID: `sZscccSGx3nfNyOm`)

**Uso por fase:**
- **Fase A:** GPT-4o para análisis de keywords e intención de búsqueda
- **Fase B (Blog):** GPT-4o para generación del artículo completo
- **Fase B (Guiones):** GPT-4o para guión TikTok/Reels + post Meta + Interactivity Asset
- **Fase D:** GPT-4o para propuesta de re-optimización basada en datos GSC

---

### nano banana (Gemini imagen nativa) — Fase B-3

| Parámetro | Valor |
|-----------|-------|
| Modelo base | `gemini-2.5-flash-image` |
| Modelo Pro | `gemini-3-pro-image-preview` |
| Endpoint (base) | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent` |
| Endpoint (Pro) | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent` |
| Método | `POST` |
| Autenticación | Header `x-goog-api-key: {GEMINI_API_KEY}` |
| Formato respuesta | Base64 en `candidates[0].content.parts[0].inlineData.data` |
| Mime type respuesta | `candidates[0].content.parts[0].inlineData.mimeType` |
| Estado | ⏳ API Key pendiente |

**Credencial n8n:** Crear tipo `httpHeaderAuth` con nombre `nano banana`
- Header name: `x-goog-api-key`
- Header value: `{GEMINI_API_KEY}`

**Body del request:**
```json
{
  "contents": [
    {
      "parts": [
        { "text": "{{prompt_imagen}}" }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "candidateCount": 1
  }
}
```

**Flujo Fase B-3 en n8n:**
1. GPT-4o genera el `prompt_imagen` siguiendo el Skill Visual (lente 85mm, golden hour, etc.)
2. HTTP Request → nano banana (`gemini-2.5-flash-image`) → recibe base64
3. Code node → decodifica base64 → Buffer binario con mime type
4. HTTP Request → WordPress `/wp-json/wp/v2/media` (multipart) → sube imagen → obtiene `media_id`
5. El `media_id` se incluye en el body del post como `featured_media`

**Credenciales:** Ver `.env` → `GEMINI_API_KEY`

---

## 4. APIs de Investigación SEO (Fase A)

### SerpAPI
| Parámetro | Valor |
|-----------|-------|
| Uso | Obtener resultados de Google (competencia, PAA, autocomplete) |
| Endpoint principal | `https://serpapi.com/search` |
| Parámetros clave | `q`, `gl` (país), `hl` (idioma), `engine: google` |

**Credenciales:** Ver `.env` → `SERPAPI_KEY`

### Google Keyword Planner (Ads API)
| Parámetro | Valor |
|-----------|-------|
| Uso | Volumen de búsqueda y keywords relacionadas |
| Acceso | vía Google Ads API (requiere cuenta Ads activa o en modo Test) |
| Librería | `google-ads-api` o nodo HTTP en n8n |

**Credenciales:** Ver `.env` → `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`

---

## 5. Telegram (Notificaciones)

| Parámetro | Valor |
|-----------|-------|
| Bot | **PENDIENTE** — crear en @BotFather |
| Destino | Cuenta personal del usuario |
| Notificar en | Publicación exitosa Y errores del pipeline |

**Formato notificación éxito:**
```
✅ Nuevo post publicado
📌 Título: [titulo]
🔗 URL: [url_post]
📊 Keywords: [keyword]
```

**Formato notificación error:**
```
❌ Error en pipeline
📌 Keyword: [keyword]
⚠️ Fase: [fase_donde_falló]
📝 Detalle: [mensaje_error]
```

**Credenciales:** Ver `.env` → `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

---

## 6. Google Search Console (Fase D — Re-optimización)

| Parámetro | Valor |
|-----------|-------|
| Propiedad verificada | `https://bigotesfelinos.com/` |
| Estado | Activo y verificado |
| Implementación | Al final de la Fase actual del proyecto |

**Lógica de re-optimización:**
- Consulta mensual vía GSC API (`searchanalytics.query`)
- Filtro: posts con `posicion_gsc` entre 6 y 20 (página 1 alcanzable)
- Filtro adicional: `ctr` bajo para la posición (oportunidad de mejora de título/meta)
- Acción: GPT-4o propone nuevos H1, meta description y secciones a expandir
- Resultado: n8n actualiza el post en WordPress vía REST API y registra en Master Sheet

**Credenciales:** Ver `.env` → `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN`

---

## 7. Cadencia y Triggers

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | 3 posts/semana |
| Días de publicación | Lunes, Miércoles y Viernes |
| Trigger | Cambio de estado en Google Sheets: `Pendiente` → `Aprobado` |
| Polling de la sheet | Cada hora en días hábiles (cron: `0 * * * 1,3,5`) |

---

## 8. Flujo de Datos entre Fases

```
Google Sheets (keyword "Aprobado")
        ↓
[FASE A] SerpAPI + Keyword Planner
        → output: {keyword, intencion, lsi_keywords, competencia_top3, paa_questions}
        ↓
[FASE B-1] GPT-4o → Artículo Blog
        → output: {titulo, h1, meta_description, body_html, faq_html, categoria, tags}
        ↓
[FASE B-2] GPT-4o → Paquete de Redes
        → output: {guion_tiktok, post_meta_aida, interactivity_asset}
        ↓
[FASE B-3] Google Imagen 3 (nano banana) → Imagen destacada
        → output: {base64} → decodificar → sube a WordPress Media Library → {media_id}
        ↓
[FASE C] WordPress REST API → Publicar post
        → output: {url_post, post_id}
        ↓
[FASE C] Google Sheets → Actualizar fila (estado: "Publicado", url_post, wordcount)
        ↓
[FASE C] Telegram → Notificación de éxito
```

---

## 9. Variables de Entorno (.env)

```env
# WordPress
WP_URL=https://bigotesfelinos.com
WP_USER=
WP_APP_PASSWORD=

# OpenAI
OPENAI_API_KEY=              # ✅ Configurada en n8n (no se necesita aquí)

# nano banana (Gemini imagen nativa)
GEMINI_API_KEY=              # PENDIENTE — obtener en Google AI Studio (aistudio.google.com)

# SEO APIs
SERPAPI_KEY=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=

# Google Sheets
GOOGLE_SHEETS_ID=            # PENDIENTE (crear sheet primero)

# Telegram
TELEGRAM_BOT_TOKEN=          # PENDIENTE (crear bot en @BotFather)
TELEGRAM_CHAT_ID=            # PENDIENTE

# Google Search Console
GSC_CLIENT_ID=
GSC_CLIENT_SECRET=
GSC_REFRESH_TOKEN=
```
