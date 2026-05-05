# Configuración Técnica: Ferretería Ya

## 1. WordPress

| Parámetro | Valor |
|-----------|-------|
| URL sitio | `https://ferreteriaya.com.co/` |
| URL blog | `https://ferreteriaya.com.co/blog/` |
| REST API endpoint posts | `https://ferreteriaya.com.co/wp-json/wp/v2/posts` |
| REST API endpoint media | `https://ferreteriaya.com.co/wp-json/wp/v2/media` |
| REST API endpoint tags | `https://ferreteriaya.com.co/wp-json/wp/v2/tags` |
| Autenticación | Application Password (usuario + contraseña de aplicación) |
| Plugin SEO | Yoast SEO — enviar `meta{}` con `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` |
| Plugin auxiliar requerido | `fy-yoast-rest` — habilita escritura de meta Yoast vía REST API |
| Estado de publicación | `publish` (publicación directa, sin revisión) |

**Categorías disponibles (5, SEO-optimizadas):**

| Nombre | ID WP | Slug | Usar para |
|--------|-------|------|-----------|
| Herramientas y equipos | `331` | `herramientas-y-equipos` | Taladros, sierras, escaleras, equipos de medición |
| Materiales y acabados | `332` | `materiales-y-acabados` | Cemento, pintura, drywall, pisos, impermeabilizantes |
| Plomería y Sanitarios | `333` | `plomeria-y-sanitarios` | Llaves, tuberías, sanitarios, calentadores, fugas |
| Electricidad e Iluminación | `334` | `electricidad-e-iluminacion` | Interruptores, lámparas, instalaciones eléctricas |
| Jardín y Exteriores | `335` | `jardin-y-exteriores` | Jardinería, fachadas, terrazas, impermeabilización exterior |

**Credencial n8n:** `Ferre_WordPress` (tipo `wordpressApi`, ID: `tSY0QM8DwewkbOvJ`) — usuario `feruroc@gmail.com`

---

## 2. Google Sheets (Master Sheet)

| Parámetro | Valor |
|-----------|-------|
| Nombre | `Ferretería Ya — Master Sheet` |
| ID | `1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM` |
| Hoja activa | `Blog` |
| Trigger del workflow | Columna `estado` en hoja `Blog` = `"Aprobado"` |

**Hoja `Blog` — columnas:**
```
keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M)
```

**Estados del pipeline:**
- `Pendiente` — keyword registrada, en espera de aprobación
- `Aprobado` — disparador del workflow
- `En proceso` — n8n está trabajando
- `Publicado` — post live en WordPress
- `Error` — falló en alguna fase
- `Canibalismo` — keyword similar a post existente (Jaccard ≥50%)
- `Re-optimizar` — señalado para revisión futura

**Credencial n8n:** `Ferre Google Sheets account` (tipo `googleSheetsOAuth2Api`, ID: `uonq78tDtE28NMdx`) — OAuth con `feruroc@gmail.com`

---

## 3. OpenAI

| Parámetro | Valor |
|-----------|-------|
| Modelo de texto | GPT-4o |
| Estado | ✅ Configurada en n8n |

**Credencial n8n:** `Ferre_Blog_OpenAi` (tipo `openAiApi`, ID: `5Rvr3r9lUss9Vb5j`)

**Uso en el pipeline:**
- GPT-4o genera artículo completo: `titulo_seo`, `seo_title`, `meta_description`, `categoria`, `body_html`, `faq_items[]`, `tags[]`, `prompt_imagen`

---

## 4. nano banana (Gemini imagen nativa) — Fase B-3

| Parámetro | Valor |
|-----------|-------|
| Modelo | `gemini-2.5-flash-image` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent` |
| Método | `POST` |
| Autenticación | Header `x-goog-api-key: {GEMINI_API_KEY}` |
| Formato respuesta | Base64 en `candidates[0].content.parts[0].inlineData.data` |
| Mime type | `candidates[0].content.parts[0].inlineData.mimeType` |
| Aspect ratio | 16:9 — especificado en `generationConfig` y reforzado en el prompt |
| Estado | ✅ Configurada en n8n |

**Credencial n8n:** `Ferre_Blog_NanoBanana` (tipo `httpHeaderAuth`, ID: `RTWfgCqeObrVs9Pk`)

**Body del request:**
```json
{
  "contents": [
    { "parts": [{ "text": "{{prompt_imagen}}" }] }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "candidateCount": 1
  }
}
```

**Flujo Fase B-3 en n8n:**
1. GPT-4o genera `prompt_imagen` siguiendo el Skill Visual
2. HTTP Request → nano banana → recibe base64
3. Code node → decodifica base64 → Buffer binario con mime type
4. HTTP Request → WordPress `/wp-json/wp/v2/media` (multipart) → obtiene `media_id`
5. PATCH `/wp-json/wp/v2/media/{id}` → asigna alt text (keyword)
6. `media_id` se incluye en el payload del post como `featured_media`

---

## 5. SerpAPI

| Parámetro | Valor |
|-----------|-------|
| Uso | PAA, autocomplete Google Colombia |
| Endpoint | `https://serpapi.com/search` |
| Parámetros | `q`, `gl=co` (Colombia), `hl=es`, `engine: google` |
| Estado | ✅ Configurada en n8n |

**Credencial n8n:** `Ferre_SerpApi` (tipo `serpApi`, ID: `IHe5FCEzs9GC5BlE`)

---

## 6. Telegram (Notificaciones — canal activo)

| Parámetro | Valor |
|-----------|-------|
| Integración | Telegram Bot API (gratis ilimitado) |
| Nodo n8n | Telegram (`n8n-nodes-base.telegram`) |
| Estado | 🟡 Pendiente solo el bot token |

**Pasos para configurar:**
1. En Telegram → buscar `@BotFather` → `/newbot`
2. Definir nombre + username (debe terminar en `bot`)
3. BotFather devuelve el Bot Token
4. Mandarle un `/start` al bot desde tu cuenta personal
5. Abrir `https://api.telegram.org/bot<TOKEN>/getUpdates` → copiar `chat.id`
6. En n8n → Credentials → New → `telegramApi` → nombre `Ferre_Telegram` → pegar token

**Credencial n8n:** `Ferre_Telegram` (tipo `telegramApi`, ID: `qoDPp0fY5sJ8AmbE`)
**Bot activo:** `@Ferreteriaya_pipeline_bot` ([abrir chat](https://t.me/Ferreteriaya_pipeline_bot))
**Chat ID:** `1591872862` (Diego Rojas)

**Configuración detallada de los 2 nodos:** ver `_config/CONFIG_TELEGRAM.md`

**Formato notificación éxito (Markdown Telegram):**
```
✅ *Nuevo post publicado en Ferretería Ya*

📌 *Título:* {titulo}
🔗 *URL:* {url_post}
🔑 *Keyword:* {keyword}
```

**Formato notificación error (Markdown Telegram):**
```
❌ *Error en pipeline Ferretería Ya - WF-1 - Blog SEO*

🔑 *Keyword:* {keyword}
⚠️ *Fase:* {fase}
📝 *Detalle:* {mensaje_error}
```

> **Nota:** WhatsApp Business Cloud está reservado como **migración futura** — ver `_config/CONFIG_WHATSAPP.md` para el plan.

---

## 7. Cadencia y Triggers

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | 3 posts/semana |
| Días | Lunes, Miércoles, Viernes |
| Hora | 8am Colombia (`0 13 * * *` UTC) |
| Trigger | Schedule diario — Code node verifica día de semana en timezone Colombia (UTC-5) |

---

## 8. Flujo de Datos entre Fases

```
Google Sheets (keyword "Aprobado")
        ↓
[CHECK] Leer Posts Publicados → Jaccard ≥50%
        → Canibalismo: actualizar Sheet → STOP
        → OK: continúa
        ↓
[FASE B-1] Marcar "En proceso" en Sheet
        ↓
[FASE B-1] GPT-4o → Artículo completo
        → {titulo_seo, seo_title, meta_description, categoria, body_html,
            faq_items[], tags[], prompt_imagen}
        ↓
[FASE B-1] Code node → Parsear + slug + FAQ HTML + FAQPage JSON-LD + wp_body_json
        ↓
[FASE B-3] nano banana → base64 → Buffer → WP Media → media_id
        ↓
[FASE C] Construir wp_body_final (+ featured_media)
        ↓
[FASE C] WordPress REST API → Publicar post
        ↓ (paralelo)
[C-a] Google Sheets → estado "Publicado" + url_post
[C-b] Tags → crear/recuperar en WP → PATCH post
[C-c] Telegram → notificar éxito
```

---

## 9. Variables de Entorno (.env)

```env
# Ferretería Ya — ContentOps Engine
# NUNCA commitear este archivo

# WordPress
WP_URL=https://ferreteriaya.com.co
WP_USER=feruroc@gmail.com
WP_APP_PASSWORD=<en .env>

# Google Sheets
GOOGLE_SHEETS_ID=1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM

# Telegram (canal activo)
TELEGRAM_BOT_TOKEN=<PENDIENTE — @BotFather>
TELEGRAM_CHAT_ID=<PENDIENTE — getUpdates>

# WhatsApp Business Cloud (migración futura — comentadas)
# WHATSAPP_ACCESS_TOKEN=
# WHATSAPP_PHONE_NUMBER_ID=
# WHATSAPP_TO_NUMBER=

# nano banana / Gemini (configurada en n8n como Ferre_Blog_NanoBanana)
GEMINI_API_KEY=

# SerpAPI (configurada en n8n como Ferre_SerpApi)
SERPAPI_KEY=
```

---

## 10. Credenciales n8n — Resumen

| Servicio | Nombre en n8n | Tipo | ID | Estado |
|---------|---------------|------|----|--------|
| Google Sheets | `Ferre Google Sheets account` | `googleSheetsOAuth2Api` | `uonq78tDtE28NMdx` | ✅ Activa |
| Gemini / nano banana | `Ferre_Blog_NanoBanana` | `httpHeaderAuth` | `RTWfgCqeObrVs9Pk` | ✅ Activa |
| OpenAI | `Ferre_Blog_OpenAi` | `openAiApi` | `5Rvr3r9lUss9Vb5j` | ✅ Activa |
| SerpAPI | `Ferre_SerpApi` | `serpApi` | `IHe5FCEzs9GC5BlE` | ✅ Activa (reservada para futuro WF de ideas) |
| WordPress | `Ferre_WordPress` | `wordpressApi` | `tSY0QM8DwewkbOvJ` | ✅ Activa (usuario `feruroc@gmail.com`) |
| Telegram (canal actual) | `Ferre_Telegram` | `telegramApi` | `qoDPp0fY5sJ8AmbE` | ✅ Activa, asignada al WF1 |
| WhatsApp (migración futura) | `Ferre_WhatsApp` | `whatsAppApi` | — | ⏸️ Reservado para más adelante |
