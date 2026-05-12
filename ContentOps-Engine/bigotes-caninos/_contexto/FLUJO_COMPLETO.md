# Bigotes Caninos — ContentOps Engine: Documentación del Flujo

**Última actualización:** 2026-05-07 — TODOS los 9 workflows desplegados con paridad total al felino

> Este documento describe el flujo de cada workflow desplegado en producción. Cuando se necesite mayor profundidad técnica nodo-por-nodo, consultar el [`FLUJO_COMPLETO.md`](../../bigotes-felinos/_contexto/FLUJO_COMPLETO.md) del felino — la lógica interna es 1:1 (las diferencias se documentan en [`../_config/INTEGRACIONES_TECNICAS.md`](../_config/INTEGRACIONES_TECNICAS.md) §8).
>
> Para Master Sheet, estados y configuración, abrir [`../CLAUDE.md`](../CLAUDE.md). Para credenciales y costos, abrir [`CREDENCIALES_Y_COSTOS.md`](CREDENCIALES_Y_COSTOS.md). Para overview ejecutivo, abrir [`RESUMEN_PROYECTO.md`](RESUMEN_PROYECTO.md). Para gotchas técnicos heredados del felino, abrir [`../_config/INTEGRACIONES_TECNICAS.md`](../_config/INTEGRACIONES_TECNICAS.md) §8.

---

## ¿Qué es este sistema?

ContentOps Engine es un pipeline de automatización que produce artículos de blog optimizados para SEO + AEO de forma semi-automática. El equipo decide qué keywords trabajar; el sistema se encarga de investigar, escribir, generar la imagen y publicar en WordPress sin intervención humana.

El objetivo es publicar 3 artículos por semana (lunes, miércoles y viernes) con calidad editorial consistente, cobertura SEO + AEO completa y sin canibalizar contenido ya existente.

---

## Cómo iniciar una publicación

1. Abrir el Master Sheet (hoja `Blog`)
2. Agregar una fila con la keyword y sus metadatos (col D-G + R-S)
3. Cambiar la columna `estado` a **`Aprobado`**
4. El sistema lo detecta automáticamente en la siguiente ejecución programada y hace todo lo demás

No hay más pasos manuales. El artículo aparecerá publicado en el blog y el Sheet se actualizará solo.

---

## WF1 — Blog SEO: el flujo paso a paso

### Trigger
Diario a las 8am Colombia (`0 8 * * *` con `timezone: America/Bogota`). Por ejecución se procesa **exactamente una keyword**: estacionales con `fecha_objetivo` inminente publican cualquier día; regulares solo martes/jueves/sábado (lógica delegada al Code node de bypass).

### Paso 0 — Auto-priorización estacional
Antes de buscar `Aprobado`, el pipeline lee filas con `estado = "Pendiente"` que tengan `fecha_objetivo` definida. Si alguna está dentro de los próximos 14 días, cambia su estado a `"Aprobado"` automáticamente.

**Ejemplo canino:** si el 12 de julio detecta que "regalos para perros Día Internacional 2026" tiene `fecha_objetivo = 2026-07-12` (14 días antes del 26 jul), cambia su estado a "Aprobado" y ese día se publica.

### Paso 1 — Verificar si hay keyword
Lee el Sheet buscando `estado = "Aprobado"`. Si encuentra alguna, toma la primera (priorizando las que tienen `fecha_objetivo` definida).

### Paso 2 — Anti-canibalismo Capa 1 (Jaccard kw + slug + stem)
Antes de gastar GPT, compara la keyword nueva contra todos los `Publicado`:
- Jaccard sobre keywords con threshold **35%**
- Jaccard sobre slugs (extraídos de URL del post) con threshold **60%**
- Stemming canino: `perros`→`perro`, `perrito`→`perro`, `perritos`→`perro`
- Si match → marca `estado = "Canibalismo"` con URL del similar y termina

### Paso 3 — Marcar En Proceso
Actualiza la fila a `"En proceso"` para visibilidad del equipo.

### Paso 4 — Construir body del request GPT (JSON.stringify)
Code node pre-serializa el prompt con `JSON.stringify` para evitar (1) límite de tamaño de item de n8n y (2) corrupción de JSON con saltos de línea.

### Paso 5 — Generar el artículo (GPT-4o)
Prompt extenso con:
- Keyword + intención de búsqueda
- Lista de posts publicados (para enlaces internos)
- Reglas Vet-Friend canino (diccionario obligatorio, frases prohibidas)
- Stack AEO completo (respuesta directa, key takeaways, tabla obligatoria, fuentes whitelist 7, schemas)
- Mini-historias obligatorias
- Question-first headings cuando aplique
- Sentence case
- Whitelist estricta de fuentes científicas

Output esperado (JSON):
```json
{
  "titulo_seo": "...",
  "seo_title": "≤60 chars",
  "meta_description": "≤155 chars",
  "categoria": "Salud|Alimentación|Razas|Educación y Comportamiento|Noticias",
  "respuesta_directa": "40-60 palabras",
  "key_takeaways": ["punto 1", "punto 2", "punto 3"],
  "body_html": "...",
  "tabla_html": "<table>...</table>",
  "faq_items": [{"q": "...", "a": "..."}, ...],
  "fuentes_consultadas": [{"nombre":"...", "url":"...", "org":"WSAVA|AVMA|..."}],
  "entities": [{"name":"Parvovirus", "wikipedia":"https://es.wikipedia.org/wiki/Parvovirus_canino"}],
  "howto_steps": [{"name":"...", "text":"..."}],
  "tags": ["tag1", "tag2", ...],
  "prompt_imagen": "..."
}
```

### Paso 6 — Parsear + enriquecer (Code)
- `slug` limpio desde keyword
- `headingsToSentenceCase()`
- FAQ HTML + FAQPage JSON-LD
- WebPage Speakable JSON-LD
- WebPage.mentions JSON-LD con sameAs Wikipedia (entities)
- HowTo JSON-LD si `howto_steps.length >= 4`
- `strip4Byte()` y `scrubAIWatermarks()`
- Genera `wp_body_json` y emite `slug` en root para Capa 2

### Paso 7 — Anti-canibalismo Capa 2 (Slug Pre-Check WP)
- HTTP GET `/wp-json/wp/v2/posts?slug={slug}&_fields=id,slug,title,link,status&context=edit` con `alwaysOutputData: true`
- Code: si match exacto → emite `cannibalism: true`; si no → propaga con `slug_check_passed: true`
- IF: bifurca a Marcar Canibalismo o sigue al Internal Linker

### Paso 8 — Internal Linker
Valida URLs alucinadas que GPT pudo inventar y suplementa hasta 2 enlaces internos reales del catálogo si GPT generó menos.

### Paso 9 — Quality Gate (15 checks / 120 puntos / threshold 70 / HARD GATE tabla)
Si Quality Score < 70 → throw Error con breakdown completo, no se publica. Telegram notifica al usuario para revisar la keyword.

### Paso 10 — nano banana (imagen)
- HTTP POST a Gemini con `retryOnFail: 3 tries, 5s waitBetweenTries`
- Code: guard explícito para `finishReason !== 'STOP'` y `content?.parts` ausente (NO_IMAGE rejection) → throw Error claro

### Paso 11 — Subir imagen a WP Media
- POST multipart a `/wp-json/wp/v2/media` → recibe `media_id`
- POST a `/wp-json/wp/v2/media/{id}` → asigna `alt_text` (keyword)

### Paso 12 — Publicar post
- POST a `/wp-json/wp/v2/posts` con `status: publish`, `featured_media`, `meta` Yoast
- Recibe `{url_post, post_id}`

### Paso 13 — Actualizar Sheet
batchUpdate: `estado = "Publicado"` (B), `url_post` (H), `fecha_reoptimizado = now()` Bogotá (M). El M previene que WF8 reprocese posts recién publicados.

### Paso 14 — Tags pipeline
Split → POST tag (uno por uno, con `neverError:true` para 409 term_exists) → Collect IDs → PATCH post con `{tags: [ids]}`.

### Paso 15 — Telegram éxito
Mensaje con título + URL + keyword + deeplink a GSC URL Inspection para solicitar indexación con un click.

### Manejo de errores
- Error Trigger captura excepciones → Marcar `estado = "Error"` en Sheet
- Telegram notifica fase + detalle del error

### Bypass de día (testing manual)
`if ($execution?.mode !== 'trigger') return [items[0]];` antes del filtro martes/jueves/sábado → permite ejecutar manualmente cualquier día desde la UI sin esperar al cron real.

---

## WF3 — Re-optimización SEO

### Trigger
Manual + Schedule mensual (cron `0 8 1 * *` con `timezone: America/Bogota` = 1° de cada mes 8am Bogotá). Ambos triggers conectados al mismo nodo de entrada.

### Lógica
1. Lee Sheet `Blog!A:M` (filas Publicado)
2. Consulta GSC API para los últimos 90 días: `searchAnalytics/query` con dimensions=`["page"]` y siteUrl `https://bigotescaninos.com/`
3. Filtra: pos 6-50 con ≥5 impresiones, sin bloqueo de 90 días en col M, dedup por URL
4. Ordena por impresiones desc, máx 10 candidatos por run
5. Si 0 candidatos → emite sentinel `{no_candidates: true}` → IF Sin Candidatos → Telegram "Sin candidatos" + Guard que filtra ghost items

### Para cada candidato
1. HTTP GET a WP `/posts/{id}?context=edit` → obtiene `content.raw`
2. Merge con metadata GSC + Sheet
3. Construir prompt GPT Refresh (verbatim de WF1 con stack AEO completo)
4. GPT-4o con `max_tokens: 8000`, batching `batchSize: 1, batchInterval: 25000` (rate limit Tier 1)
5. Parser: scrubAIWatermarks + strip4Byte + FAQ HTML + JSON-LD múltiples + Internal Linker + Quality Gate
6. PATCH a `/wp-json/wp/v2/posts/{id}` con URL como expresión completa
7. batchUpdate Sheet: col J (posición GSC) + col M (`fecha_reoptimizado` Bogotá)
8. Tags pipeline (mismo que WF1)
9. Telegram resumen al final

### Prioridad post-GSC para canino
**Pocos targets reales** — solo 25 pages en pos 6-50, y de esos solo 2 con impresiones significativas:
- `/salud/popo-verde-en-perros/` (pos 15.4, 10.274 imp)
- `/razas/cuales-son-las-razas-de-perros-mas-grandes/` (pos 85.3, 11.351 imp — query mismatch grave, candidato a reescritura completa)

### Tratamiento especial: `/salud/gonorrea-en-perros/`
NO entra en el flujo automático de WF3. Ejecutar manualmente vía **WF-Util Force Re-optimize Post** con el `post_id` específico para:
- Aclarar el mito desde el H1
- Mejorar CTR (4.48% → objetivo 15%+)
- Preservar ranking (URL, keyword principal en H1, longitud)

---

## WF5 — Generador de Ideas (solo blog)

### Trigger
Manual ÚNICAMENTE. Sin schedule — el equipo lo ejecuta cuando el Sheet tiene poco backlog.

### Lógica
1. **Preparar Fechas GSC:** rango de 90 días
2. **GSC Query:** `searchAnalytics/query` con `dimensions=["query"]`, queries con ≥3 impresiones
3. **SerpAPI:** `engine=google_paa` y `engine=google_autocomplete` para temas caninos (`gl=co`, `hl=es`). `continueOnFail: true` por si la credencial no está
4. **Leer Blog Sheet** (`Blog!A:A` — solo columna keyword, 1 read request vs 60+)
5. **Construir Prompt GPT** que sintetiza GSC + SerpAPI + existentes
6. **GPT-4o:** genera 15 ideas blog con metadatos completos
7. **Parsear + filtrar:** dedup Jaccard ≥50% contra existentes; **valida cuota Colombia 6/15** (si no se alcanza, emite warning pero no rechaza)
8. **Append Blog Ideas** con `estado="Pendiente"`
9. **Telegram:** resumen con N ideas insertadas + cuota Colombia alcanzada (X/15)

### Diferencia vs WF5 felino
- Sin rama de entretenimiento (no hay WF4 que consuma ideas de entretenimiento)
- Output 100% en hoja `Blog`
- Cuota Colombia obligatoria 6/15 (paridad con felino)

### Prioridad post-GSC para canino
**Crítico** — el catálogo no tiene tráfico real. WF5 alimenta WF1 con keywords que vienen de:
1. Demand signals no capturados detectados en GSC (diarrea, hepatitis canina, cushing, perros más grandes del mundo, estreñimiento, caca/heces verdes)
2. PAA + autocomplete colombiano vía SerpAPI
3. Síntesis GPT con prompts específicos para hub Comportamiento (100% virgen)

---

## WF6 — Pillar Generator

### Trigger
Manual ÚNICAMENTE. Selección de hub vía constante editable `HUB_SELECCIONADO` en Code node `wf6-002`.

### Hubs disponibles para canino
- `'Salud'`
- `'Alimentación'`
- `'Razas'`
- `'Comportamiento'` (renombrado vs felino que usa `'Mundo'`)

### Lógica
1. Definir Hub: mapea HUB → slug pilar + título + seo_title + descripción + prompt imagen
2. Leer Blog Sheet `Blog!A:S` (incluye col R = hub)
3. Filtrar Clusters del Hub: publicados con `hub === ctx.hub`. Devuelve lista para enriquecer prompt
4. Construir Prompt GPT extenso (3.500-4.000 palabras objetivo)
5. GPT-4o con `max_tokens: 12000, timeout: 180s`
6. Parser AEO completo + headingsToSentenceCase
7. Salvaguarda imagen: `retryOnFail 3x` + `onError: continueRegularOutput`. Si Gemini falla 3 veces, el pilar se publica **sin imagen destacada** y Telegram avisa
8. Fix slug attachment vs page: `image_filename = 'pilar-img-{slug}.webp'` para evitar que el slug del attachment ocupe el slug de la page (lección aprendida del felino — page se publica como `/guia-X-2/` con `-2` añadido por WP)
9. POST a `/wp-json/wp/v2/pages` (NO `/posts`)
10. Telegram con stats: palabras, FAQ, fuentes, entities, internal links, status imagen

### Pilares a publicar (Sprint 3)
| Hub | Slug | URL |
|-----|------|-----|
| Salud | `guia-salud-canina` | https://bigotescaninos.com/guia-salud-canina/ |
| Alimentación | `guia-alimentacion-perros` | https://bigotescaninos.com/guia-alimentacion-perros/ |
| Razas | `guia-razas-perros` | https://bigotescaninos.com/guia-razas-perros/ |
| Comportamiento | `guia-comportamiento-canino` | https://bigotescaninos.com/guia-comportamiento-canino/ |

---

## WF7 — AEO Monitor

### Trigger
Schedule lunes 9am (`0 9 * * 1` con `timezone: America/Bogota`) + Manual.

### Lógica
1. Leer Master Sheet (`Blog!A:M`)
2. **Pick Top 20 Keywords:** filtra `estado=Publicado` + `url_post` + `length ≤ 55` + sin `:` ni "guía completa" → orden por prioridad ASC, luego por `posicion_gsc` ASC → top 20
3. **SerpAPI Query:** `engine=google&q={kw}&gl=co&hl=es&num=10`. Devuelve `ai_overview.page_token` cuando hay AIO
4. **SerpAPI Async Fetch:** `engine=google_ai_overview&page_token={...}` para obtener el contenido del AIO. `continueOnFail: true`
5. **Parse AI Overview:** detecta `search_information.ai_overview_state="Fully empty"`, parsea `references[]`, busca `bigotescaninos.com`, extrae top 3 competidores
6. **Aggregate Results:** cuenta citados/total/sin_AIO, build sheet payload + Telegram summary
7. **Append AEO_Tracking:** todas las filas en un batch
8. **Telegram Resumen Semanal**

### Costo SerpAPI
~80 credits/mes (20 keywords × 2 calls × 4 sem). Combinado con felino podría exceder free tier 100/mes — vigilar.

### Baseline esperado al inicio del canino
0/N citas reales con AIO (igual que el baseline del felino al inicio). Sprint 4 está específicamente diseñado para detectar movimiento desde 0 → primera cita.

---

## WF8 — Bulk AEO Migrator

### Trigger
Manual ÚNICAMENTE.

### Lógica
1. Leer Sheet `Blog!A:M` filtrando `estado=Publicado` con `fecha_reoptimizado` vacía
2. Ordenar por `row_number` ASC (cronológico)
3. Tomar 10 posts por run
4. Para cada post: misma lógica que WF3 (HTTP GET WP, prompt GPT Refresh AEO, parser, Internal Linker, Quality Gate, PATCH WP, batchUpdate Sheet col M, tags pipeline)

### Diferencias vs WF3 (heredadas del felino)
- **Quality Gate más permisivo:** threshold 60 (vs 70), HARD GATE de tabla **removido** (catálogo histórico tiene formatos variados — narrativos, Q&A — donde forzar tabla rompería)
- **Prompt:** "TABLA OBLIGATORIA" → "TABLA RECOMENDADA cuando aplique"
- **Regex `^<p>` → `^<p[^>]*>`** para detectar `<p class="respuesta-directa">`
- **Sin filtro GSC:** procesa por orden cronológico, no por posición
- **Rate limit batching:** `batchSize: 1, batchInterval: 25000`. 10 items × 25s ≈ 4 min runtime
- **Interacción con WF3:** WF8 escribe en Blog!M → WF3 ve el post como "ya re-optimizado" y respeta bloqueo de 90 días. Después de 90 días si tiene mal posicionamiento GSC, WF3 lo retoma

### Cobertura
77 posts × 10 por run = ~9 runs. Costo ~$3 GPT-4o por run = ~$27 total.

### Cadencia recomendada para canino
1 run/semana o más espaciado. **Prioridad BAJA en el roadmap canino** — el catálogo no genera tráfico que justifique la migración como bandera principal.

---

## WF9 — Pilares Auto-Sync

### Trigger
Manual + Schedule diario (cron `30 8 * * *` con `timezone: America/Bogota` = 8:30am Colombia).

### Lógica
1. Leer Blog Sheet `Blog!A:S`
2. **Agrupar Clusters por Hub:** filtra `estado=Publicado` con `url_post` válido y `hub` asignado. Agrupa en 4 items (uno por hub) con array de clusters
3. **GET Pilar por Slug:** HTTP GET `/wp-json/wp/v2/pages?slug={pilar_slug}&context=edit` → `content.raw`
4. **Construir HTML Inyectado:** regenera `<section class="cluster-list">` con todos los clusters del hub. Inserta antes del primer `<script>` JSON-LD para preservar schemas. **Idempotente:** strippea cualquier `<section class="cluster-list">` previa antes de regenerar
5. **PATCH Pilar:** HTTP POST `/wp-json/wp/v2/pages/{id}` con nuevo content
6. **Telegram resumen** con cluster_count por hub

### Costo
**$0 GPT** (no usa GPT). Solo 4 GET + 4 PATCH al WP por ejecución.

### Mapeo Hub → Pilar (hardcoded en Code)

| Hub | Slug | Título sección |
|-----|------|----------------|
| Salud | `guia-salud-canina` | "Más artículos sobre salud canina" |
| Alimentación | `guia-alimentacion-perros` | "Más artículos sobre alimentación perruna" |
| Razas | `guia-razas-perros` | "Más artículos sobre razas de perros" |
| Comportamiento | `guia-comportamiento-canino` | "Más artículos sobre comportamiento canino" |

### Por qué 8:30am
30 min después de WF1 (8am martes/jueves/sábado). Un cluster nuevo aparece en su pilar máximo 25 horas después de publicarse.

---

## WF11 — GSC Weekly Dashboard

### Trigger
Schedule lunes 9am (`0 9 * * 1` con `timezone: America/Bogota`) + Manual.

### Lógica
1. **Build Queries:** Code node emite 6 query items:
   - `last_7d_total` (sitewide totals)
   - `prior_7d_total` (sem anterior para WoW)
   - `last_28d_total` (contexto)
   - `top_pages_7d`
   - `top_pages_prior` (para Δ pos)
   - `top_queries_7d`
2. **GSC Query:** una request HTTP por query item con cred `googleOAuth2Api` (XWbfIBmitmx1uByl)
3. **Aggregate Snapshot:** Code agrega responses, computa WoW deltas, top 3 ganadores/perdedores por Δ pos, top queries semana, alerta concentración (>25% imp en 1 página). Genera telegram_message + payloads para Sheets
4. **Append GSC_Tracking:** 1 fila con totales + deltas
5. **Append GSC_Pages_Tracking:** top 30 páginas con Δ pos vs sem anterior
6. **Telegram Weekly Report**

### Particularidad para canino — alerta de concentración
Dado que `/salud/gonorrea-en-perros/` representa 97.5% del tráfico, el sistema detectará permanentemente **concentración crítica >25%** hasta que el resto del catálogo crezca. La alerta es informativa, no error.

### Estructura del mensaje Telegram (formato esperado)
```
📊 BC GSC Weekly — 2026-MM-DD a 2026-MM-DD

WoW (vs sem anterior):
   Impresiones: X → Y (+Δ%)
   Clicks: X → Y
   CTR: X% → Y%
   Pos avg: X → Y

Últimos 28d (contexto): N imp, N clk, pos N

🏆 Top ganadores (Δ pos): ...
🔻 Top perdedores: ...
🆕 Top queries semana: ...
⚠️ Concentración: top page N% de impresiones (gonorrea-en-perros)
```

---

## WF-Util — Force Re-optimize Post

### Trigger
Webhook POST `/force-reopt-post` con body `{"post_id": <num>, "keyword": "<override opcional>"}`.

### Propósito
Re-optimizar UN post específico a demanda con el stack AEO completo (mismo prompt + parser + Linker + Quality Gate de WF3), saltando filtros GSC y bloqueo de 90 días.

### Casos de uso para canino

**Caso 1 — Re-optimizar `/salud/gonorrea-en-perros/`:**
```bash
curl -X POST https://n8n.srv1398596.hstgr.cloud/webhook/force-reopt-post \
  -d '{"post_id": <ID>, "keyword": "gonorrea en perros"}'
```
Objetivo: arreglar contenido (aclarar mito), preservar ranking, mejorar CTR.

**Caso 2 — Empujar un post cerca de top 10:**
Si WF11 detecta una página en pos 11-12 con momentum, ejecutar WF-Util manualmente para empujar a top 10 con AEO fresco.

**Caso 3 — Reset de bloqueo 90d:**
Si WF3 dejó de tomar un post por bloqueo de fecha_reoptimizado pero el equipo decide reprocesarlo, WF-Util salta el bloqueo.

### Lógica
1. **Validate Input:** post_id numérico + extrae keyword_override opcional
2. **WP GET Post:** HTTP GET `/wp-json/wp/v2/posts/{id}?context=edit` con cred `wordpressApi`
3. **Read Master Sheet:** HTTP GET `Blog!A:M` con cred `googleSheetsOAuth2Api` (NO `googleOAuth2Api` — esa es para GSC)
4. **Build Single Candidate:** cruza WP post con Sheet por url match (link o slug); aplica keyword_override si fue provisto; emite 1 candidato con shape esperado por prompt fd-006
5. **Construir Prompt GPT Refresh** (verbatim del WF3)
6. **GPT-4o** (sin batching — 1 item)
7. **Parser** (verbatim del WF3)
8. **Internal Linker + Quality Gate**
9. **WP PATCH**
10. **batchUpdate Sheet** col M
11. **Tags pipeline**
12. **Telegram éxito**

### Concertación con WF3
Al actualizar `fecha_reoptimizado`, WF-Util "consume" el bloqueo de 90 días. Si el post sigue mal posicionado después, WF3 lo retomará en 90 días.

---

## Notas técnicas operativas (heredadas del felino)

Ver [`../_config/INTEGRACIONES_TECNICAS.md`](../_config/INTEGRACIONES_TECNICAS.md) §8 — todas las gotchas aplican idénticas:

- §8.1 — `$execution.mode === 'test'` en Manual Execution
- §8.2 — `JSON.stringify` para bodies grandes
- §8.3 — `alwaysOutputData: true` en HTTP Request que puede devolver `[]`
- §8.4 — `runOnceForAllItems` después de Merge
- §8.5 — `strip4Byte()` siempre antes de POST a WP
- §8.6 — `scrubAIWatermarks()` en parsers
- §8.7 — URL completa en HTTP Request URL field
- §8.8 — Anti-canibalismo dual (Capa 1 + Capa 2)
- §8.9 — HARD GATE de tabla (WF1, WF6) / Permisivo (WF8)
- §8.10 — Whitelist estricta de 7 fuentes científicas caninas
- §8.11 — Sentence case en headings (con `headingsToSentenceCase()` defensivo)
- §8.12 — Question-first headings (AEO)

Ningún punto se "redescubre" en el canino — todos heredan del felino y se aplican desde el primer commit del workflow correspondiente.

---

## Roadmap de despliegue (TODO COMPLETADO 2026-05-07)

| Sprint | Workflow | n8n ID | Estado |
|--------|----------|--------|--------|
| 0 (2026-05-06) | Bootstrap del proyecto | — | ✅ |
| 1 (2026-05-06) | Correcciones técnicas Bloque A/B + Master Sheet + 5 credenciales | — | ✅ |
| 1 | `_aeo/sprint-1/` (llms.txt + equipo-editorial post 1966) | — | ✅ |
| 2 (2026-05-07) | WF1 — Blog SEO (Mar/Jue/Sáb, post 1973 publicado E2E) | `vQJ5gCIDbNq2zqd8` | ✅ Active |
| 3 | WF5 — Generador de Ideas | (otro chat) | ✅ |
| 3 | WF6 — Pillar Generator + 4 pilares publicados (1979/1981/1983/1985) | `37ZMWhzGb3ObewQ6` | ✅ Cumplió |
| 3 | WF9 — Pilares Auto-Sync (79 clusters distribuidos en 2s) | `VUA4Rnm3hYWVqcE5` | ✅ Active |
| 4 | WF3 — Re-optimización GSC (dormido hasta WF8 termine) | `PloVJdTP2G8lKMNo` | ✅ Creado (inactivo) |
| 4 | WF7 — AEO Monitor | `RYhnbWPasSKE5HL6` | ✅ Active |
| 4 | WF11 — GSC Weekly Dashboard | `39sEBfGprwCtVKOD` | ✅ Active |
| 4 | WF8 — Bulk AEO Migrator (en ejecución gradual usuario) | `4vPCym417t5nO9ru` | ✅ Operativo |
| 4 | WF-Util — Force Re-optimize Post (post 25 gonorrea Quality 107) | `n3j1DIxnMIJ5Xahw` | ✅ Active |

## Lecciones técnicas críticas registradas durante el despliegue

Estas gotchas surgieron durante el bootstrap y NO estaban en el `FLUJO_COMPLETO.md` original. Aplican a cualquier futura adaptación BF→BC (o clonado de cliente):

### L1 — Adaptación BF→BC requiere traducir IDs numéricos, no solo strings

Mi script Python inicial traducía strings ("gato"→"perro") pero NO IDs de categorías WP. Resultado: WF1 publicó el primer post en "Sin categoría" porque el `categoriaMap` apuntaba a IDs felinos (21/18/19/20/40) que no existen en el WP del canino.

**Fix permanente aplicado:** `categoriaMap` con IDs caninos correctos (41/42/45/43/157) + `inferirCategoria` con fallback al `hub` del Sheet (col R). Documentado en `bc-node-006`.

### L2 — `alwaysOutputData: true` en TODOS los Sheets read nodes que filtran

Cuando un nodo Sheets lee con filtro y devuelve 0 filas, los nodos downstream NO se ejecutan. WF1 BC se cortaba silenciosamente en "Leer Posts Publicados" porque inicialmente el Sheet no tenía Publicados (catálogo vacío).

**Fix permanente:** los 3 nodos Sheet read del WF1 (`Leer Keywords Aprobadas`, `Leer Posts Publicados`, `Leer Estacionales Pendientes`) tienen `alwaysOutputData: true`.

### L3 — Webhook paths deben ser únicos por instancia n8n

Si BF y BC están en la misma instancia n8n y dos workflows tienen el mismo webhook path, solo uno puede estar activo a la vez (n8n da error "There is a conflict with one of the webhooks"). 

**Fix permanente:** el WF-Util BC usa path `/webhook/bc-force-reopt-post` (con prefijo `bc-`) mientras el felino mantiene `/webhook/force-reopt-post`.

### L4 — Gemini 2.5 Flash Image requiere billing activo en GCP

Cuando se crea una API key de Gemini en un proyecto GCP sin billing, el modelo `gemini-2.5-flash-image` retorna `429 RESOURCE_EXHAUSTED, limit: 0`. Aunque haya tier "free", sin billing el límite es 0.

**Fix arquitectónico aplicado:** la cred Gemini de BC se cambió a la del felino (`ysOycTrtxEO3BRcW`), que sí tiene billing. Costo incremental ~$0.04/mes. Documentado en `CREDENCIALES_Y_COSTOS.md`.

### L5 — Verificar `post_id` antes de disparar WF-Util sobre post crítico

WF-Util acepta `post_id` arbitrario sin validación de coherencia con el `keyword`. Si se le pasa un ID incorrecto, re-optimiza el post equivocado con el keyword pasado, generando mismatch tema vs título.

**Mitigación operativa:** antes de disparar WF-Util, verificar el ID via `GET /wp-json/wp/v2/posts?slug={slug}`. Si por error se re-optimiza el post equivocado, el contenido viejo está cacheado en la ejecución de n8n y se puede recuperar.

### L6 — siteUrl GSC: URL prefix vs sc-domain

La propiedad GSC del canino se creó como **URL prefix** (`https://bigotescaninos.com/`), no como Domain (`sc-domain:bigotescaninos.com`). Si los workflows usan el formato incorrecto, GSC devuelve 403 Forbidden.

**Aplicado en todos los workflows:** GSC API URL es `https%3A%2F%2Fbigotescaninos.com%2F` (URL prefix encoded).

### L7 — SerpAPI free tier compartido con felino

WF7 BC + WF7 BF consumen ~160 credits/mes vs free tier 100/mes. Vigilar en producción.

**Mitigaciones disponibles:** bajar cadencia BC a quincenal, bajar # keywords a 10 (vs 20), o upgrade SerpAPI plan pago ($50/mes).
