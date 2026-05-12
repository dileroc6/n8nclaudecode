# Configuración Técnica: Bigotes Caninos

> **Paridad con felino:** este documento sigue al [`INTEGRACIONES_TECNICAS.md`](../../bigotes-felinos/_config/INTEGRACIONES_TECNICAS.md) del proyecto hermano. Todas las **gotchas técnicas** del felino aplican idénticas — el canino las hereda sin re-descubrir.

---

## 1. WordPress

| Parámetro | Valor |
|-----------|-------|
| URL sitio | `https://bigotescaninos.com/` |
| URL blog | `https://bigotescaninos.com/blog/` |
| Tema | Kadence v1.2.16 |
| REST API endpoint posts | `https://bigotescaninos.com/wp-json/wp/v2/posts` |
| REST API endpoint pages | `https://bigotescaninos.com/wp-json/wp/v2/pages` |
| REST API endpoint media | `https://bigotescaninos.com/wp-json/wp/v2/media` |
| REST API endpoint tags | `https://bigotescaninos.com/wp-json/wp/v2/tags` |
| Autenticación | Application Password (a crear — credencial n8n `BC - WordPress account`) |
| Plugin SEO | Yoast SEO — campos `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` vía `meta{}` en payload |
| Plugin equivalente a `bf-yoast-rest` | ✅ instalado (C10 confirmado por usuario, validar runtime) |
| Estado de publicación | `publish` (publicación directa, sin revisión) |
| Alt text de imagen | POST a `/wp-json/wp/v2/media/{id}` después de subir |

### Categorías WordPress disponibles

| ID | Nombre | Slug | Posts hoy | Acción |
|----|--------|------|-----------|--------|
| 41 | Salud | `salud` | 32 | ✅ Sin cambios |
| 42 | Alimentación | `alimentacion` | 22 | ✅ Sin cambios |
| 43 | Educación → **Educación y Comportamiento** | `educacion` | 5 | ⚠️ Renombrar (decisión B7) |
| 45 | Razas | `razas` | 18 | ✅ Sin cambios |
| 157 | Noticias | `noticias` | 12 | ✅ Sin cambios |
| 1 | Blog2 | `blog2` | 0 | ❌ Eliminar (decisión B8) |

### Mapeo Hub interno → Categoría WP

```
Hub "Salud canina"                         → categoría "Salud"
Hub "Alimentación canina"                  → categoría "Alimentación"
Hub "Razas de perros"                      → categoría "Razas"
Hub "Comportamiento y Adiestramiento"      → categoría "Educación y Comportamiento" (renombrar)
[transversal]                              → categoría "Noticias"
```

### Schemas JSON-LD inyectados en cada artículo (AEO desde Sprint 1)

| Schema | Cuándo se inyecta | Selector / Contenido |
|--------|-------------------|----------------------|
| `FAQPage` | Siempre (si `faq_items.length > 0`) | Las 5-6 Q/A del artículo |
| `WebPage` con `speakable` | Siempre | `cssSelector: ['.respuesta-directa', '.key-takeaways']` para asistentes de voz |
| `WebPage.mentions[]` con `sameAs` Wikipedia | Si GPT genera `entities[]` válidas | 3-8 entidades canónicas (razas, enfermedades, parásitos, organizaciones veterinarias) |
| `HowTo` con `step[]` | Solo si keyword es procedural y GPT genera `howto_steps[]` con ≥4 pasos | Pasos numerados con `name` y `text` |

### Recursos AEO en raíz del dominio (a desplegar en Sprint 1)

- `https://bigotescaninos.com/llms.txt` — declaración para crawlers de IA (Anthropic, OpenAI, Perplexity)
- `https://bigotescaninos.com/equipo-editorial/` — política editorial + fuentes consultadas (E-E-A-T signal)

---

## 2. Google Sheets — Master Sheet

| Parámetro | Valor |
|-----------|-------|
| Nombre | `Bigotes Caninos — Master Sheet` |
| ID | ⏳ pendiente crear |
| Hojas activas | `Blog` (pipeline) · `AEO_Tracking` · `GSC_Tracking` · `GSC_Pages_Tracking` |
| Trigger de workflow | Columna `estado` en hoja `Blog` cambia a `Aprobado` |

> **Diferencia vs felino:** SIN hoja `Redes Sociales` (no aplica) y SIN columnas N-Q huérfanas (vienen limpias desde el inicio).

### Hoja `Blog` — columnas

```
keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M) | hub(R) | cluster_parent(S)
```

> Las columnas N-Q se dejan en blanco (no se usan). Mantener el offset hasta R-S preserva paridad de fórmulas/scripts con el felino.

### Hoja `AEO_Tracking` — columnas

```
fecha(A) | keyword(B) | url_post(C) | citado_AIO(D) | competidores_top3(E) | snippet_citado(F) | pais(G) | notas(H)
```

### Hoja `GSC_Tracking` — columnas

```
sem_inicio(A) | sem_fin(B) | impresiones(C) | clicks(D) | ctr(E) | pos_promedio(F) | delta_imp(G) | delta_clicks(H) | delta_pos(I)
```

### Hoja `GSC_Pages_Tracking` — columnas

```
sem_inicio(A) | url(B) | impresiones(C) | clicks(D) | ctr(E) | pos(F) | delta_pos_vs_prev(G) | delta_clicks_vs_prev(H)
```

### Estados del pipeline (hoja Blog)

- `Pendiente` — keyword registrada, en espera (también la generan las ideas de WF5)
- `Aprobado` — disparador del workflow
- `En proceso` — n8n está trabajando
- `Publicado` — post live en WordPress
- `Error` — falló en alguna fase
- `Canibalismo` — keyword similar a post existente (con URL del similar en H)
- `Re-optimizar` — señalado por GSC para revisión

---

## 3. APIs de Inteligencia Artificial

### OpenAI — GPT-4o
| Parámetro | Valor |
|-----------|-------|
| Modelo | `gpt-4o` |
| Credencial n8n | `BC - OpenAI` (independiente del felino) |

**Uso por workflow:**
- WF1 — generación del artículo completo (8.000-10.000 tokens output incluyendo AEO + tabla + FAQ)
- WF3 — re-optimización con stack AEO sobre posts existentes
- WF5 — síntesis de GSC + SerpAPI para generar ideas
- WF6 — generación de páginas pilar (12.000 tokens output)
- WF8 — re-optimización bulk con Quality Gate más permisivo (threshold 60, sin HARD GATE de tabla)

### nano banana (Gemini imagen) — Fase B-3 de WF1 y WF6

| Parámetro | Valor |
|-----------|-------|
| Modelo base | `gemini-2.5-flash-image` |
| Endpoint | `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent` |
| Método | `POST` |
| Auth | Header `x-goog-api-key: {GEMINI_API_KEY}` |
| Credencial n8n | `BC - nano banana` (httpHeaderAuth) |
| Formato respuesta | Base64 en `candidates[0].content.parts[0].inlineData.data` |
| Mime type | `candidates[0].content.parts[0].inlineData.mimeType` |

**Body del request (idéntico al felino):**
```json
{
  "contents": [
    { "parts": [ { "text": "{{prompt_imagen}}" } ] }
  ],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "candidateCount": 1
  }
}
```

**Gotchas heredadas del felino — aplicar idénticas:**
1. **NO usar** `generationConfig.aspectRatio` — Gemini 2.5 Flash Image rechaza con HTTP 400. Reforzar `"16:9 horizontal cinematic widescreen aspect ratio"` directamente en el prompt de texto.
2. **Detectar `finishReason: NO_IMAGE`** — Gemini puede devolver HTTP 200 OK sin `content.parts` (rechazo de generación). Implementar guard explícito en Code node después del HTTP Request: `if (finishReason !== 'STOP' || !content?.parts) throw Error...`
3. **`retryOnFail: 3 tries, 5s waitBetweenTries`** — para fallos HTTP transitorios 5xx/timeouts.

### Flujo Fase B-3 (idéntico al felino)
1. GPT-4o genera el `prompt_imagen` siguiendo el Skill Visual canino (lente 85mm, golden hour, perro real, no humanizar)
2. HTTP Request → nano banana → recibe base64
3. Code node → decodifica base64 → Buffer binario con mime type
4. HTTP Request → WordPress `/wp-json/wp/v2/media` (multipart) → sube imagen → obtiene `media_id`
5. POST a `/wp-json/wp/v2/media/{id}` → asigna alt text (keyword)
6. El `media_id` se incluye en el body del post como `featured_media`

---

## 4. APIs de Investigación SEO (Fase A)

### SerpAPI
| Parámetro | Valor |
|-----------|-------|
| Tipo de credencial n8n | `serpApi` (predefinedCredentialType — NO `httpQueryAuth`) |
| Credencial reusada | `SerpAPI` (ID `44hTDtjkVRDKJOeU`, compartida con felino) |
| Endpoint | `https://serpapi.com/search` |
| Parámetros clave | `q`, `gl=co`, `hl=es`, `engine=google` |

### Google Keyword Planner (Ads API)
| Parámetro | Valor |
|-----------|-------|
| Uso | Volumen de búsqueda y keywords relacionadas |
| Acceso | Google Ads API (cuenta compartida con felino) |
| Credenciales | `.env` — todas con prefijo `GOOGLE_ADS_*` |

---

## 5. Telegram (Notificaciones)

| Parámetro | Valor |
|-----------|-------|
| Bot | `@bigotescaninos_pipeline_bot` (a crear en @BotFather) |
| Credencial n8n | `BC - Telegram Bot` |
| Chat ID destinatario | `1591872862` (mismo que felino — mismo destinatario humano) |

**Formato notificación éxito (paridad con felino, ajustado para canino):**
```
✅ BC — Nuevo post publicado
📌 Título: [titulo]
🔗 URL: [url_post]
🐶 Keyword: [keyword]
📊 GSC Inspection: [deeplink]
```

**Formato notificación error:**
```
❌ BC — Error en pipeline
📌 Keyword: [keyword]
⚠️ Fase: [fase_donde_falló]
📝 Detalle: [mensaje_error]
```

---

## 6. Google Search Console — Fase D (Re-optimización)

| Parámetro | Valor |
|-----------|-------|
| Propiedad verificada | `https://bigotescaninos.com/` (URL prefix, NO sc-domain) |
| Permission level | siteOwner ✅ (validado 2026-05-06) |
| Credencial n8n | `XWbfIBmitmx1uByl` (googleOAuth2Api compartida con felino) |
| Endpoint | `POST https://searchconsole.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query` |

**Site URL en queries (CRÍTICO):**
```javascript
// Correcto:
const siteUrl = encodeURIComponent('https://bigotescaninos.com/');
// Incorrecto (devuelve 403):
const siteUrl = encodeURIComponent('sc-domain:bigotescaninos.com');
```

**Usada en:**
- WF3 — posiciones últimos 90 días para detectar candidatos pos 6-50
- WF5 — queries reales con ≥3 impresiones para generación de ideas
- WF11 — snapshot semanal sitewide + top 30 páginas

---

## 7. Cadencia y Triggers

| Workflow | Cron | Hora local |
|----------|------|------------|
| WF1 — Blog SEO | `0 8 * * *` (con `timezone: America/Bogota`) | 8am Colombia (lógica martes/jueves/sábado en bypass code node `bc-node-003b`) |
| WF3 — Re-optimización | `0 8 1 * *` (timezone Bogotá) + Manual | 1° de cada mes 8am |
| WF7 — AEO Monitor | `0 9 * * 1` (timezone Bogotá) + Manual | Lunes 9am |
| WF9 — Pilares Sync | `30 8 * * *` (timezone Bogotá) + Manual | Diario 8:30am |
| WF11 — GSC Dashboard | `0 9 * * 1` (timezone Bogotá) + Manual | Lunes 9am |
| WF5, WF6, WF8 | Manual ÚNICAMENTE | A demanda |
| WF-Util | Webhook POST `/force-reopt-post` | A demanda |

**Importante (gotcha n8n heredada):** poner `timezone: America/Bogota` en `settings` del workflow → el cron se interpreta en hora local. Sin timezone, usar UTC: 8am Bogotá = `0 13 * * *`.

---

## 8. Gotchas técnicas heredadas del felino — aplicar todas idénticas

### 8.1 — `$execution.mode === 'test'` en Manual Execution
Cuando se ejecuta vía "Execute Workflow" desde la UI con un Schedule Trigger, `$execution.mode` es **`'test'`** (NO `'manual'`). Para distinguir cron real de ejecución manual de testing, usar:
```javascript
if ($execution?.mode !== 'trigger') {
  // bypass del filtro martes/jueves/sábado — esto es testing manual
  return [items[0]];
}
```

### 8.2 — `JSON.stringify` para bodies grandes en HTTP Request
n8n tiene límite de tamaño de item (~4KB) que descarta campos grandes al interpolarlos en expresiones, y corrompe JSON al incluir saltos de línea + comillas. Solución: pre-serializar en un Code node anterior:
```javascript
return [{ json: { gpt_body_json: JSON.stringify({ model, messages, ...etc }) } }];
```
Y en el HTTP Request usar `={{ $json.gpt_body_json }}` directo.

### 8.3 — `alwaysOutputData: true` en HTTP Request que puede devolver `[]`
WordPress devuelve `[]` cuando no hay match en `?slug=` queries. Sin `alwaysOutputData: true`, el flujo se corta silenciosamente. Aplicar en bf-node-006sg (Slug Pre-Check WP) y en cualquier query similar.

### 8.4 — `runOnceForAllItems` en Code nodes después de Merge
El nodo Merge tiene un bug conocido con `pairedItem` que rompe el contexto. Solución: en cualquier Code node downstream usar `mode: runOnceForAllItems` y manejar items con `$input.all()` y `$('NodoX').all()`.

### 8.5 — Cleanup de unicode 4-byte (`strip4Byte`)
GPT-4o ocasionalmente devuelve caracteres 4-byte que MySQL `utf8mb3` rechaza (`Incorrect string value: '\xF0\x9F...' for column ...`). Aplicar siempre antes de POST a WP:
```javascript
function strip4Byte(s) {
  return String(s).replace(/[\u{10000}-\u{10FFFF}]/gu, '');
}
```

### 8.6 — Cleanup de marcas de IA (`scrubAIWatermarks`)
GPT inyecta a veces frases como "como modelo de IA…", "no soy veterinario…", "consulta a un profesional…". Implementar regex de remoción en parsers WF1, WF3, WF6, WF8.

### 8.7 — URL completa en HTTP Request URL field
Para PATCH a `/wp-json/wp/v2/posts/{id}` con expresión, usar URL completa:
```javascript
// Correcto:
"={{ 'https://bigotescaninos.com/wp-json/wp/v2/posts/' + $json.wp_post_id }}"
// Incorrecto (mete literal '=' en la URL):
"posts/={{ $json.wp_post_id }}"
```

### 8.8 — Anti-canibalismo dual (Capa 1 + Capa 2)

**Capa 1** (en bc-node-017 — equivalente a bf-node-017):
- Jaccard sobre keywords con threshold **35%**
- Jaccard sobre slugs (extraídos de URL del post publicado) con threshold **60%**
- Stemming básico canino: `perros`→`perro`, `perrito`→`perro`, `perritos`→`perro` (regex `it([oa])s?$` y quita `s` final si len>4)
- Stop words extendidas con "guia", "completa" (genéricos que sesgaban Jaccard)
- Output incluye `match_reason` (`kw_NNpct` o `slug_NNpct`)

**Capa 2** (Slug Pre-Check WP — 3 nodos antes de Internal Linker):
- HTTP GET `/wp-json/wp/v2/posts?slug={slug}&_fields=id,slug,title,link,status&context=edit` con `alwaysOutputData: true`
- Code node: si la respuesta WP contiene un post con slug exactamente igual → emite `cannibalism: true` con `similar_keyword`, `similar_url`, `similarity_pct: 100`, `match_reason: 'slug_wp_conflict'`
- IF: bifurca a Marcar Canibalismo o continúa flujo normal

### 8.9 — HARD GATE de tabla en Quality Gate (WF1, WF6) / Permisivo (WF8)
- WF1 y WF6: Quality Score 70+ con HARD GATE de tabla (sin tabla → fail)
- WF8: Quality Score 60+ SIN HARD GATE (catálogo histórico tiene formatos variados)
- WF3: igual que WF1 (rigor original) en re-optimizaciones SEO frescas

### 8.10 — Whitelist estricta de 7 fuentes científicas caninas
En el prompt GPT de WF1, WF3, WF6, WF8 — solo aceptar URLs de:
1. WSAVA (wsava.org)
2. AVMA (avma.org)
3. AAHA (aaha.org)
4. Merck Veterinary Manual (merckvetmanual.com)
5. Cornell Vet Med (vet.cornell.edu)
6. RVC — Royal Veterinary College (rvc.ac.uk)
7. PubMed (pubmed.ncbi.nlm.nih.gov)

Cualquier fuente fuera de esta lista → reject + retry o fail con razón.

### 8.11 — Sentence case en headings
Los H1, H2, H3 de pilares deben estar en sentence case (solo primera letra mayúscula + nombres propios). Implementar `headingsToSentenceCase()` defensiva en parser que normaliza si GPT devuelve Title Case (preservar nombres propios: Colombia, Bogotá, WSAVA, Royal Canin, Bigotes Caninos, etc.).

### 8.12 — Question-first headings (AEO)
H2/H3 obligatoriamente en formato pregunta cuando aplique: "¿Cuándo vacunar a mi cachorro?" en vez de "Vacunación de cachorros". Mejora citaciones en AI Overview.

### 8.13 — Adaptación BF→BC: traducir IDs numéricos (lección 2026-05-07)

Cuando se clona un workflow del felino al canino, las sustituciones de strings (`gato`→`perro`, `Bigotes Felinos`→`Bigotes Caninos`) NO cubren los IDs numéricos hardcoded. Específicamente:

- **IDs categorías WP** (en `categoriaMap` de WF1):
  - Felino: 21=Salud, 18=Alimentación, 19=El mundo del gato, 20=Razas, 40=Noticias
  - Canino: **41=Salud, 42=Alimentación, 43=Educación y Comportamiento, 45=Razas, 157=Noticias, 1=Sin categoría**
- **Page IDs de pilares** (no aplica BC porque WF6 los crea desde cero):
  - Felino: 2700/2702/2704/2706
  - Canino: **1979/1981/1983/1985**

**Bug histórico:** WF1 BC al inicio publicó el primer post en "Sin categoría" (ID 1) porque `inferirCategoria` retornaba 21 (Salud felino) y al WP del canino la categoría 21 no existe → fallback a 1.

**Fix permanente aplicado:** `categoriaMap` y `inferirCategoria` con IDs caninos + fallback al `hub` del Sheet (col R) para casos donde la inferencia regex no matchee. Si todo falla, `return 41` (Salud) en vez de `return 19` (que en BC sería Sin categoría).

### 8.14 — `alwaysOutputData: true` en TODOS los Sheet read nodes con filtro

Cuando un nodo Sheets lee con `filtersUI` y devuelve 0 filas, los nodos downstream NO se ejecutan por defecto — el flujo se corta silenciosamente. Esto pasó en WF1 BC al inicio porque el Sheet no tenía Publicados todavía.

**Fix permanente:** los nodos `Leer Keywords Aprobadas`, `Leer Posts Publicados` y `Leer Estacionales Pendientes` tienen `alwaysOutputData: true` para que emitan un item vacío `{}` cuando no hay match → flujo continúa y los nodos Code (especialmente Formatear Posts Publicados) manejan correctamente el caso vacío.

### 8.15 — Webhook paths únicos por instancia n8n

n8n no permite que dos workflows activos compartan el mismo webhook path. Si BF y BC corren en la misma instancia y ambos definen `force-reopt-post`, solo uno puede activarse — el otro da error "There is a conflict with one of the webhooks".

**Convención BC:** webhooks BC usan prefijo `bc-` para evitar colisiones:
- BF: `/webhook/force-reopt-post`
- BC: `/webhook/bc-force-reopt-post`

### 8.16 — Gemini 2.5 Flash Image requiere billing GCP activo

API keys creadas en proyectos GCP sin billing devuelven `429 RESOURCE_EXHAUSTED, limit: 0` para `gemini-2.5-flash-image`. Aunque tier "free" exista, sin billing el límite efectivo es 0.

**Mitigación arquitectónica BC:** la cred Gemini de BC fue retirada de uso (estaba en proyecto GCP del usuario sin billing). En su lugar, BC usa la cred Gemini del felino (`ysOycTrtxEO3BRcW`) que sí tiene billing. Costo incremental ~$0.04/mes — trivial. Cred BC vacía (`OwYSxprFMVxEb7hm`) deprecada. Cuando se decida separar billing, crear nuevo proyecto GCP para BC y regenerar cred.

### 8.17 — siteUrl GSC: URL prefix vs sc-domain

La propiedad GSC del canino es de tipo **URL prefix** (`https://bigotescaninos.com/`), NO Domain (`sc-domain:bigotescaninos.com`). Si los workflows GSC usan el formato incorrecto, GSC devuelve 403 Forbidden ("User does not have sufficient permission").

**Convención aplicada:** todos los workflows GSC del canino usan URL encoded:
```
https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fbigotescaninos.com%2F/searchAnalytics/query
```

Para verificar el tipo de propiedad GSC: hacer `GET /webmasters/v3/sites` con la cred OAuth y revisar el campo `siteUrl` de cada entrada — el formato exacto de ese string es el que hay que usar.

### 8.18 — Verificar `post_id` antes de WF-Util en posts críticos

WF-Util acepta `post_id` arbitrario sin validar coherencia con la `keyword` pasada. Si se pasa un ID incorrecto:

1. WF-Util hace GET al post incorrecto
2. GPT-4o re-escribe ese post usando la keyword del request
3. PATCH actualiza el post incorrecto

**Caso real (2026-05-07):** se disparó WF-Util con `{post_id: 591, keyword: "gonorrea en perros"}` pensando que el post 591 era gonorrea. En realidad 591 era `popo-verde-en-perros`. El post de popo-verde quedó con 3 menciones erróneas de "gonorrea". Fix: re-disparar WF-Util sobre 591 con keyword correcta para sobreescribir limpio.

**Mitigación operativa:** antes de disparar WF-Util sobre un post crítico, verificar el ID:
```bash
curl "https://bigotescaninos.com/wp-json/wp/v2/posts?slug={slug}&_fields=id,slug,title.rendered" | jq '.[0]'
```

**Recovery rápido si se re-optimiza el post incorrecto:** el contenido viejo está cacheado en la ejecución de n8n (nodo `WP GET Post`). Recuperarlo via `GET /api/v1/executions/{id}?includeData=true` y hacer PATCH manual al post para restaurar.

---

## 9. Flujo de Datos entre Fases (resumen)

```
Google Sheets (keyword "Aprobado")
        ↓
[FASE A] SerpAPI + Keyword Planner (en WF5 previo, no en WF1 directamente)
        → output: contexto en Sheet
        ↓
[FASE B-1] Construir Body GPT (Code, JSON.stringify)
        → output: { gpt_body_json }
        ↓
[FASE B-1] GPT-4o → Artículo Blog AEO
        → output: { titulo_seo, seo_title, meta_description, categoria, body_html,
                     respuesta_directa, key_takeaways[], faq_items[], tabla_html,
                     fuentes_consultadas[], entities[], howto_steps[]?, tags[],
                     prompt_imagen }
        ↓
[FASE B-1] Parsear + enriquecer (Code)
        → slug limpio desde keyword
        → capitalización H2/H3 sentence case
        → FAQ HTML + FAQPage JSON-LD
        → WebPage Speakable JSON-LD
        → WebPage.mentions[] con entities → Wikipedia sameAs
        → HowTo JSON-LD (si aplica)
        → strip4Byte + scrubAIWatermarks
        → wp_body_json listo
        ↓
[Anti-canibalismo Capa 2] Slug Pre-Check WP → IF Slug Conflict
        ↓
[FASE B-2] Internal Linker (valida URLs alucinadas, suplementa hasta 2 enlaces reales)
        ↓
[FASE B-2] Quality Gate (15 checks / 120 puntos / threshold 70 / HARD GATE tabla)
        ↓
[FASE B-3] nano banana → Imagen destacada 16:9 (con retry 3x + guard NO_IMAGE)
        → output: base64 → Buffer binario
        ↓
[FASE B-3] WordPress Media → subir + asignar alt text (keyword)
        → output: { media_id }
        ↓
[FASE C] Code → wp_body_final (añade featured_media)
        ↓
[FASE C] WordPress REST → Publicar post
        → output: { url_post, post_id }
        ↓ (paralelo)
[FASE C-a] Google Sheets → actualizar fila ({ estado: "Publicado", url_post, fecha_reoptimizado })
[FASE C-b] Tags Pipeline (Split → POST → Collect IDs → PATCH post)
[FASE C-c] Telegram → Notificación éxito con deeplink GSC URL Inspection
```

---

## 10. Variables de Entorno (.env)

Ver [`../.env`](../.env) — plantilla completa.
