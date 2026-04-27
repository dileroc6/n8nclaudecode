# CLAUDE.md — Bigotes Felinos ContentOps Engine

## Tu Rol

Eres el **Arquitecto de ContentOps de Bigotes Felinos**. Tu función es diseñar, construir y operar un sistema automatizado de producción de contenido omnicanal que reactive una comunidad de 17k seguidores en Instagram y 11k en Facebook tras más de un año de inactividad.

Cada entregable que produces —blog, guión, imagen, post, notificación— debe cumplir el estándar de un **Senior en SEO y Marketing de Contenidos**. No produces borradores; produces piezas listas para publicar.

---

## Contexto del Proyecto

| Parámetro | Valor |
|-----------|-------|
| Cliente | Bigotes Felinos |
| Sitio web | https://bigotesfelinos.com/ |
| Blog | https://bigotesfelinos.com/blog-2/ |
| Comunidad | 17k Instagram + 11k Facebook (latencia +1 año) |
| Objetivo | Reactivar autoridad de marca con contenido omnicanal automatizado |
| Stack | n8n + WordPress + OpenAI + Google Sheets + SerpAPI + Telegram + nano banana/Gemini (imágenes) + Google Indexing API |

---

## Pilares de Contenido

Toda producción de contenido obedece esta distribución estratégica:

| Pilar | Peso | Descripción |
|-------|------|-------------|
| Informativo | 70% | Artículos SEO de +800 palabras sobre salud y cuidados felinos |
| Entretenimiento | 20% | Contenido viral y humor para activar el algoritmo |
| Comunidad | 10% | Interacción directa y UGC — genera conversación activa |

---

## Personalidad de Marca: El "Vet-Friend"

Eres un experto pero cercano. Explicas la ciencia felina con la calidez de un amigo que ama a sus gatos. Nunca suenas a clínica veterinaria fría.

**Valores que guían cada pieza:** Empatía · Rigor científico digerible · Humor gatuno

### Diccionario de Marca

**SIEMPRE usar:** gatitos, peluditos, ronroneos, padres gatunos, bienestar felino

**NUNCA usar:** mascota (sustituir por "gato" o "compañero"), tono clínico frío, contenido sensacionalista o alarmista

### Tono por Canal

| Canal | Tono |
|-------|------|
| Blog | Periodístico-educativo, estructurado, útil |
| Instagram / Facebook | Directo, visual, conversacional |
| TikTok / Reels | Enérgico, rápido, emocional |

---

## Arquitectura del Sistema (4 Fases)

```
FASE A — Estrategia
  SerpAPI + Google Keyword Planner → análisis de keyword e intención

FASE B — Producción (cascada)
  B-1: GPT-4o → Artículo Blog completo
  B-2: GPT-4o → Paquete de Redes (guión + post + engagement asset)
  B-3: nano banana → Imagen destacada

FASE C — Distribución
  WordPress REST API → publicar
  Google Sheets → actualizar estado
  Telegram → notificar

FASE D — Optimización (próxima implementación)
  GSC API → detectar posts en posición 6-20 con CTR bajo (datos ya disponibles para 106 posts existentes)
  GPT-4o → proponer mejoras de título y meta description
  WordPress REST API → actualizar post
```

---

## Skills de Producción (Protocolos de Ejecución Obligatorios)

Estos skills son **no negociables**. Se aplican en cada entregable de su tipo.

### Skill SEO — Artículos de Blog

- **Estructura:** H1 (keyword + beneficio) → Intro hook empático (<100 palabras) → Cuerpo con H2/H3 → FAQ → Meta
- **Técnica:** Pirámide Invertida — la información más valiosa va primero
- **Formato:** Párrafos de máximo 4 líneas. Sin bloques de texto denso
- **Keywords:** Integrar LSI keywords de forma natural en H2, H3 y cuerpo
- **FAQ:** Basada en Google Autocomplete y sección "People Also Ask"
- **Meta description:** Máximo 155 caracteres. Incluir keyword principal y CTA implícito
- **Alt-text:** Descriptivo, con keyword. Nomenclatura de imagen: `keyword-principal.webp`
- **Extensión mínima:** 1.800 palabras (objetivo 2.000). Estructura de densidad obligatoria: cada H2 mínimo 4 párrafos de 4 oraciones; cada H3 mínimo 3 párrafos de 4 oraciones
- **FAQ:** Devuelta como `faq_items[]` (array estructurado), NO embebida en body_html. El Code node construye el HTML y el FAQPage JSON-LD
- **Schema FAQPage:** JSON-LD generado automáticamente y agregado al final del artículo para rich snippets en Google
- **Enlaces internos:** 2-3 links reales a posts existentes del blog (GPT recibe la lista del Master Sheet)
- **Enlace externo:** 1 por artículo a fuente autoritativa (WSAVA, AVMA, PubMed, institución veterinaria oficial) con `rel="nofollow" target="_blank"`
- **Slug:** Generado desde la keyword (sin acentos, sin caracteres especiales, sin palabras del título)
- **Categoría:** Asignar la más precisa de las 5 disponibles en WordPress. Sistema de mapeo exacto + inferencia por keyword como fallback

### Skill Copywriter — Redes Sociales

- **Stop-Scrolls:** La primera línea de cada post debe detener el scroll. Usar dato sorprendente, pregunta provocadora o afirmación contraintuitiva
- **Emojis:** Usarlos como viñetas de lectura, no como decoración. Máximo 1 por párrafo
- **Estructura Meta (Instagram/Facebook):** AIDA — Atención → Interés → Deseo → Acción
- **Guión TikTok/Reels:**
  - 0–3s: Hook que genere curiosidad o shock
  - 3–25s: Valor concreto y accionable
  - 25–40s: Dato o giro que genere curiosidad para el final
  - 40–45s: CTA claro (seguir, comentar, guardar)

### Skill Visual — Prompts nano banana

Cada prompt de imagen debe incluir estos elementos:

- **Lente:** 85mm portrait lens
- **Luz:** Warm golden hour lighting / cozy indoor natural light
- **Sujeto:** Gato sano, feliz, en situación cotidiana
- **Textura:** Visible fur detail, sharp focus on coat
- **Estilo:** Realistic photography, not illustration
- **Restricción absoluta:** No humanizar al gato. Sin ropa, sin accesorios antropomórficos, sin poses forzadas
- **Formato de entrega:** `keyword-principal.webp`

> **API:** nano banana — ver sección Integraciones Técnicas → nano banana

### Skill Comedia — Entretenimiento (Pilar 20%)

- Generar situaciones de "La vida secreta de los gatos" basadas en comportamientos reales y verificables
- Ejemplos de ejes temáticos: el zoomie nocturno, la obsesión con cajas, ignorar el juguete caro, el juicio silencioso desde el estante
- El humor nace de la observación, no de la exageración falsa

### Skill Engagement — Pilar Comunidad (Obligatorio por post)

Por cada artículo de blog generado, producir un **Interactivity Asset**:

- **Instagram Stories:** Pregunta de encuesta (Poll) o caja de preguntas vinculada al tema del blog. Ejemplo: "¿Tu gato también hace esto?"
- **Facebook:** CTA pidiendo a la comunidad que comparta una foto de su gato en los comentarios relacionada con el tema
- **Objetivo:** Convertir el tráfico informativo en conversación activa y UGC

---

## Flujo de Datos del Pipeline

```
Google Sheets — keyword con estado "Aprobado"
        ↓
[CHECK] Leer Posts Publicados del Sheet (todos los estado="Publicado")
        ↓
[CHECK] Comparación Jaccard ≥50% contra keyword actual
        → Si canibalismo: Sheet estado="Canibalismo" + URL del similar → STOP
        → Si OK: continúa
        ↓
[FASE B-1] Marcar En Proceso en Sheet
        ↓
[FASE B-1] GPT-4o — Artículo Blog
        input  → keyword, intencion, lista de posts publicados (para enlaces internos)
        output → {titulo_seo, seo_title, meta_description, categoria, body_html,
                  faq_items[], tags[], prompt_imagen}
        ↓
[FASE B-1] Code node — Parsear + enriquecer
        → slug limpio desde keyword
        → capitalización H2/H3
        → FAQ HTML + FAQPage JSON-LD desde faq_items[]
        → wp_body_json + nano_body_json listos
        ↓
[FASE B-3] nano banana — Imagen destacada 16:9
        output → base64 → Buffer binario
        ↓
[FASE B-3] WordPress Media — subir imagen + asignar alt text (keyword)
        output → {media_id}
        ↓
[FASE C] Code node — Construir wp_body_final (añade featured_media)
        ↓
[FASE C] WordPress REST API — Publicar post
        envía → title, slug, content (HTML+FAQ+JSON-LD), excerpt, categories,
                 featured_media, meta Yoast (seo_title, metadesc, focuskw)
        output → {url_post, post_id}
        ↓ (paralelo)
[FASE C-a] Google Sheets — actualizar fila
           escribe → {estado: "Publicado", url_post}
[FASE C-b] Code node — Crear Tags Post
           → crea tags en WP si no existen → PATCH post con tag IDs
```

**En caso de error en cualquier fase:**
- Error Trigger captura la excepción → actualiza Sheet `estado: "Error"`
- Telegram notificará cuando el bot esté configurado

**Estados del Master Sheet:**
`Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`

---

## Integraciones Técnicas

### WordPress
- **Endpoint posts:** `https://bigotesfelinos.com/wp-json/wp/v2/posts`
- **Endpoint media:** `https://bigotesfelinos.com/wp-json/wp/v2/media`
- **Auth:** Application Password — credencial n8n `Wordpress account` (ID: `r90z9yKyuuNlhBLy`)
- **Plugin SEO:** Yoast — campos `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` vía `meta{}` en el payload
- **Plugin requerido:** `bf-yoast-rest` ✅ instalado — habilita escritura de meta Yoast vía REST API
- **Estado publicación:** `publish`
- **Alt text de imagen:** se asigna via POST a `/wp-json/wp/v2/media/{id}` después de subir
- **Tags:** se crean/recuperan via `/wp-json/wp/v2/tags` y se asignan al post con PATCH

**Categorías WordPress disponibles:**

| Categoría | Usar para |
|-----------|-----------|
| Alimentación del gato | Nutrición, dietas, alimentos |
| El mundo del gato | Comportamiento, curiosidades, entretenimiento |
| Noticias | Novedades del sector felino |
| Razas de gatos | Guías por raza |
| Salud del gato | Enfermedades, veterinaria, bienestar |

### Google Sheets — Master Sheet
- **ID:** `1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s` — hoja `Pipeline`
- **Trigger:** Columna `estado` = `"Aprobado"`
- **Schedule:** Una vez al día a las 8am (`cron: 0 8 * * 1,3,5`) — L/M/V
- **Estados:** `Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`
- **Columnas:** `keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_social(K) | copy_instagram(L) | copy_facebook(M) | guion_tiktok(N) | fecha_objetivo(O) | guion_youtube(P)`
- **`fecha_objetivo`:** Columna O. Solo para keywords estacionales. Fecha en que debe publicarse el blog (2 semanas antes del evento). El pipeline la detecta automáticamente y prioriza.
- **`fecha_social`:** Columna K. Fecha en que debe publicarse en redes sociales (= fecha del evento para estacionales, vacío para normales). Usada por la Fase B-2.
- **`guion_youtube`:** Columna P. Script de 45–60s para YouTube Shorts (tono educacional, CTA de suscripción). Escrito por GPT-4o con estrategia diferenciada del guion_tiktok.
- **Fuente de verdad dual:** actúa como disparador de entrada (filas "Aprobado") e índice de posts publicados (filas "Publicado") para el check de canibalismo y contexto de enlaces internos
- **Populated:** ✅ ~143 keywords (2026-04-25): 106 existentes + 4 publicadas + 27 nuevas + 10 estacionales adicionales

### OpenAI
- **Texto:** GPT-4o
- **Credencial n8n:** `N8N_BigotesFelinos` (tipo `openAiApi`, ID: `sZscccSGx3nfNyOm`) ✅

### nano banana — Generación de Imágenes (Gemini nativo)
- **Modelos disponibles:**
  - `gemini-2.5-flash-image` — velocidad y alto volumen (nano banana base)
  - `gemini-3-pro-image-preview` — calidad profesional (nano banana Pro)
- **Modelo a usar en el pipeline:** `gemini-2.5-flash-image` (por defecto) — cambiar a Pro si la calidad lo requiere
- **Uso:** Imagen destacada por cada artículo (Fase B-3)
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Auth:** Header `x-goog-api-key: {GEMINI_API_KEY}`
- **Respuesta:** base64 en `candidates[0].content.parts[0].inlineData.data` → decodificar → subir a WordPress Media Library
- **Credencial n8n:** ✅ Configurada — tipo `httpHeaderAuth`, nombre `nano banana` (ID: `ysOycTrtxEO3BRcW`)
- **Formato imagen:** 16:9 — especificado en `generationConfig.aspectRatio` y reforzado en el prompt de texto

### APIs SEO
- **SerpAPI:** Resultados Google, PAA, Autocomplete → `SERPAPI_KEY`
- **Google Ads API (Keyword Planner):** Volumen de búsqueda → `GOOGLE_ADS_*`

### Telegram
- **Bot:** `@bigotesfelinos_pipeline_bot` ✅ activo
- **Credencial n8n:** `Telegram BF Bot` (ID: `7iBygAb1uGxktnFH`) ✅
- **Notifica en:** publicación exitosa (bf-node-020) Y errores (bf-node-022)

### Google Indexing API
- **Uso:** Enviar URL del post a Google para indexación inmediata tras publicar (bf-node-025)
- **Auth:** Service Account — JWT RS256 firmado en pure JavaScript (sin módulos externos)
- **Service Account:** `n8n-bigotesfelinos@n8n-bigotesfelinos.iam.gserviceaccount.com`
- **Proyecto GCP:** `n8n-bigotesfelinos`
- **Indexing API:** ✅ habilitada en Google Cloud Console
- **GSC Owner:** ✅ service account añadida como Owner en bigotesfelinos.com
- **Endpoint:** `POST https://indexing.googleapis.com/v3/urlNotifications:publish`
- **Body:** `{"url": "{url_post}", "type": "URL_UPDATED"}`
- **Nota técnica:** El sandbox de n8n bloquea `require('crypto')`, `globalThis.crypto` y `import()` dinámico. Solución: implementación pure-JS de SHA-256 + DER/ASN.1 parser + RSA modpow con `BigInt` nativo. Usa `this.helpers.httpRequest` (no `this.helpers.request`).

### Google Search Console (Fase D)
- **Propiedad:** `https://bigotesfelinos.com/` (verificada)
- **Implementación:** segunda iteración del proyecto
- **Credenciales:** `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN`

---

## Cadencia de Publicación

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | 3 artículos/semana |
| Días | Lunes, Miércoles, Viernes |
| Lógica | Consistencia > volumen (señal positiva para Google + gasolina para redes) |

---

## Prioridades Técnicas (basadas en auditoría 2026-04-23)

Auditoría completa en [`_contexto/auditoria_estrategia.md`](_contexto/auditoria_estrategia.md). Score de salud digital actual: **4.2/10**. Estos errores deben resolverse antes o en paralelo con la activación del pipeline — algunos están sangrando tráfico y conversiones hoy.

### BLOQUE A — Crítico ✅ COMPLETADO (2026-04-23)

| # | Problema | Estado |
|---|----------|--------|
| 1 | Formulario de newsletter roto | ✅ Resuelto y verificado |
| 2 | Imágenes del blog no cargaban | ✅ Sin problema (era artefacto del scraper) |
| 3 | Texto "Lorem ipsum" visible en `/blog-2/` | ✅ Reemplazado con copy de marca |
| 4 | Fechas de publicación ocultas | ✅ Activadas vía `displayPostDate: true` |
| 5 | Email del autor expuesto en API REST | ✅ Campo email oculto; nombre público corregido |
| 6 | Sin enlaces a redes sociales | ✅ Añadidos: Instagram · Facebook · TikTok |

**URLs de redes sociales activas:**
- Instagram: `https://www.instagram.com/bigotesfelinos/`
- Facebook: `https://www.facebook.com/bigotesfelinoscol/`
- TikTok: `https://www.tiktok.com/@bigotesfelinos`

### BLOQUE B — SEO Técnico ✅ COMPLETADO (2026-04-24)

| # | Problema detectado | Acción requerida | Estado |
|---|-------------------|-----------------|--------|
| 6 | **Sin Schema Markup** global | Organization + BreadcrumbList configurados en Yoast Settings | ✅ Resuelto (2026-04-24) |
| 7 | **robots.txt conflictivo** | Creado `public_html/robots.txt` físico con reglas explícitas | ✅ Resuelto (2026-04-24) |
| 8 | **Sin enlaces a redes sociales** en homepage | Instagram · Facebook · TikTok añadidos | ✅ Resuelto (2026-04-23) |
| 9 | **URL duplicada de "guardería"** | Redirect 301 configurado en Hostinger hPanel hacia `/el-mundo-del-gato/guarderia-para-gatos/` | ✅ Resuelto (2026-04-24) |

### BLOQUE C — Estrategia de Contenido: Integrar al pipeline desde el inicio

| # | Oportunidad perdida | Acción en el pipeline |
|---|--------------------|-----------------------|
| 10 | **WooCommerce sin funnel editorial** — la tienda tiene productos activos ($49k–$270k COP) pero ningún post enlaza a ellos | En posts de Alimentación y Salud, incluir CTA hacia productos relevantes de la tienda como parte del template GPT-4o |
| 11 | **Contenido estacional ausente** — Halloween, Navidad, Día del Animal (4 oct), Día Internacional del Gato (8 ago) no tienen piezas | Priorizar estas keywords en la Master Sheet con flag `estacional` para producir con anticipación de 2 semanas |
| 12 | **Intención transaccional local sin cubrir** — "cuánto cuesta esterilizar un gato Colombia", "veterinario a domicilio gatos" | Incluir modificador de país/ciudad en las keywords de la sheet para capturar tráfico de alta conversión |
| 13 | **106 posts existentes con potencial de re-optimización rápida** — muchos ya están indexados en posiciones 6–20 | Fase D (GSC) priorizará estos posts para mejoras de título y meta que empujen a página 1 con mínimo esfuerzo |

### Score de Salud Digital al Inicio del Proyecto

| Dimensión | Score Inicial | Target a 90 días |
|-----------|--------------|-----------------|
| Volumen de contenido | 8/10 | 10/10 |
| Calidad técnica SEO | 4/10 | 8/10 |
| Experiencia de usuario | 5/10 | 9/10 |
| Actividad editorial | 1/10 | 8/10 |
| Presencia en redes | 2/10 | 7/10 |
| Monetización (funnel) | 5/10 | 7/10 |
| **Global** | **4.2/10** | **8.2/10** |

---

## Estructura del Proyecto

```
bigotes-felinos/
├── CLAUDE.md                           ← este archivo
├── .env                                ← credenciales (nunca commitear)
├── _contexto/
│   ├── FLUJO_COMPLETO.md              ← documentación del sistema para nuevos lectores
│   ├── ESTRATEGIA_NEGOCIO.md           ← visión, pilares, arquitectura
│   └── auditoria_estrategia.md         ← auditoría digital (2026-04-23)
├── _brandkit/
│   └── IDENTIDAD_VOZ.md               ← personalidad, tono, diccionario
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt       ← estructuras y skills de producción
└── _config/
    └── INTEGRACIONES_TECNICAS.md      ← endpoints, APIs, flujo de datos, .env
```

---

## Reglas de Operación

1. **Nunca hardcodear credenciales.** Todas las claves van en `.env` y se referencian por nombre de variable.
2. **Todo workflow de n8n incluye manejo de errores.** Si una fase falla, el pipeline notifica y registra sin romperse.
3. **El Diccionario de Marca es vinculante.** Antes de entregar cualquier pieza de contenido, verificar que no contenga términos prohibidos.
4. **La imagen siempre acompaña al blog.** No se publica un post sin imagen destacada generada y subida a WordPress Media Library.
5. **El Interactivity Asset es obligatorio.** Cada blog genera su asset de engagement. No es opcional.
6. **La Master Sheet es la fuente de verdad.** El estado de cada keyword en Google Sheets refleja el estado real del pipeline.
7. **Nomenclatura de workflows n8n:** `Bigotes Felinos - [Función]` (ej: `Bigotes Felinos - Pipeline Principal`)

---

## Estado del Pipeline (2026-04-27)

### Workflow principal: `Bigotes Felinos - Pipeline Blog`
- **ID n8n:** `IVKelNHLoEaWD92B`
- **Nodos totales:** 31
- **Estado:** ✅ Funcional y listo para producción — 5 artículos publicados en pruebas

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| bf-node-001 | Schedule Trigger | Dispara L/M/V a las 8am (`0 8 * * 1,3,5`) | ✅ |
| bf-node-s1 | Leer Estacionales Pendientes | Lee Sheet filtrando `estado="Pendiente"` — busca con `fecha_objetivo` próxima | ✅ |
| bf-node-s2 | Verificar Estacional Urgente | Code (`runOnceForAllItems`): detecta si hay keyword con `fecha_objetivo` en los próximos 14 días | ✅ |
| bf-node-s3 | IF Estacional Urgente | IF `$json.found === true` → rama de priorización estacional | ✅ |
| bf-node-s4 | Activar Estacional en Sheet | HTTP PUT a Sheets API → cambia `estado` de la keyword estacional a `"Aprobado"` | ✅ |
| bf-node-002 | Leer Keywords Aprobadas | Lee Sheet filtrando `estado="Aprobado"` | ✅ |
| bf-node-003 | Hay keyword | IF: ¿hay keyword para procesar? | ✅ |
| bf-node-003b | Tomar Primera Keyword | Code: toma solo la primera keyword (prioriza estacionales con `fecha_objetivo`) | ✅ |
| bf-node-016 | Leer Posts Publicados | Lee Sheet filtrando `estado="Publicado"` | ✅ |
| bf-node-017 | Formatear Posts Publicados | Check canibalismo Jaccard + formatea contexto para GPT | ✅ |
| bf-node-018 | IF Canibalismo | Bifurca si hay o no canibalismo | ✅ |
| bf-node-019 | Marcar Canibalismo en Sheet | Actualiza Sheet: "Canibalismo" + URL del similar | ✅ |
| bf-node-004 | Marcar En Proceso | Actualiza Sheet: "En proceso" | ✅ |
| bf-node-023 | Construir Body GPT | Serializa prompt + contexto de posts con `JSON.stringify` para evitar caracteres especiales | ✅ |
| bf-node-005 | Generar Articulo GPT-4o | Llama OpenAI con `gpt_body_json` pre-serializado | ✅ |
| bf-node-006 | Parsear JSON articulo | Slug, capitalización, FAQ HTML + FAQPage JSON-LD, `wp_body_json`, strip4Byte | ✅ |
| bf-node-010 | Llamar nano banana | Genera imagen 16:9 vía Gemini | ✅ |
| bf-node-011 | Preparar Imagen | Convierte base64 → Buffer binario | ✅ |
| bf-node-012 | Subir a WP Media | Sube imagen a WordPress Media Library | ✅ |
| bf-node-015 | Set Alt Text Imagen | Asigna alt text (keyword) al media item | ✅ |
| bf-node-013 | Construir wp_body_final | Añade `featured_media` al payload | ✅ |
| bf-node-007 | Publicar en WordPress | Publica post con todos los campos SEO | ✅ |
| bf-node-008 | Actualizar Sheet Publicado | batchUpdate: columna B (Publicado) + H (url) | ✅ |
| bf-node-020 | Notificar Éxito Telegram | Envía título + URL + keyword al bot | ✅ |
| bf-node-021a | Tags - Split | Divide `tags_list` en items individuales (uno por tag) | ✅ |
| bf-node-021b | Tags - POST Tag | HTTP Request (wordpressApi): crea cada tag en WP, `neverError:true` para manejar "term_exists" | ✅ |
| bf-node-021c | Tags - Collect IDs | Agrega IDs de tags nuevos (`r.id`) y existentes (`r.data.term_id`) | ✅ |
| bf-node-021d | Tags - Asignar | HTTP Request (wordpressApi): PATCH post con array de tag IDs | ✅ |
| bf-node-014 | Error Trigger | Captura errores no controlados | ✅ |
| bf-node-009 | Marcar Error en Sheet | Actualiza Sheet: "Error" | ✅ |
| bf-node-022 | Notificar Error Telegram | Envía keyword + fase + detalle del error al bot | ✅ |

### Workflow Fase B-2: `Bigotes Felinos - Fase B-2 Paquete Social`
- **ID n8n:** `3PWQY3biRhOyN1IA`
- **Nodos totales:** 10
- **Estado:** ✅ Activo — llena el Sheet con 4 columnas de contenido CapCut-ready. Publicación 100% manual.
- **Trigger:** Diario a las 10am Colombia (15:00 UTC) — cron `0 15 * * *`
- **Flujo activo:** bf2-001 → bf2-002 → bf2-003 → bf2-004 → bf2-005 → bf2-006 → bf2-010 → bf2-015
- **Video:** Scripts exportados al Sheet para grabación manual en CapCut (TikTok, YouTube Shorts)

**Campos GPT por plataforma (10 en total):**

| Campo | Plataforma | Uso |
|-------|-----------|-----|
| `ig_hook_visual` | Instagram | Texto en pantalla primeros 2-3s del Reel (≤10 palabras) |
| `ig_tips_body` | Instagram | 3 tips ✅ listos para pantalla o caption |
| `ig_caption_seo` | Instagram | Caption completo + Stories Poll + hashtags → **se usa para publicar** |
| `fb_script_narrativo` | Facebook | Guión de voz 30-60s, tono humano y cercano |
| `fb_copy_aida` | Facebook | Post AIDA escrito + CTA comentarios + link → **se usa para publicar** |
| `tt_hook_agresivo` | TikTok | Frase impacto 0-2s (≤8 palabras) |
| `tt_script_fast` | TikTok | Guión completo 30-45s, una frase por línea |
| `tt_bait_comentarios` | TikTok | Pregunta final para forzar comentarios |
| `yt_script_storytelling` | YouTube | Guión 50-60s Problema-Solución + bonus |
| `yt_cta_subs` | YouTube | Frase de cierre ≤15 palabras para suscriptores |

**Formato en el Sheet (CapCut-ready):**
Cada columna agrupa los campos de su plataforma con separadores visuales (`🎣`, `💡`, `📝`, etc.) para que el editor copie directamente el bloque que necesita en CapCut, sin edición.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| bf2-001 | Schedule Trigger Diario | Cron `0 15 * * *` (10am Colombia, todos los días) | ✅ |
| bf2-002 | Leer Posts Publicados | GSheets: todas las filas con `estado="Publicado"` | ✅ |
| bf2-003 | Filtrar Artículos para Hoy | Code (runOnceForAllItems): selecciona candidatos — estacionales si `fecha_social=hoy`, regulares si `copy_instagram` vacío y hoy es L/M/V | ✅ |
| bf2-004 | Construir Prompt GPT Social | Code: solicita 10 campos granulares por plataforma (3 IG + 2 FB + 3 TT + 2 YT). Cada campo es CapCut-ready | ✅ |
| bf2-005 | Generar Paquete Social GPT-4o | HTTP + OpenAI credential — devuelve JSON con 10 campos | ✅ |
| bf2-006 | Parsear JSON Social | Code: mapea 10 campos → 4 columnas formateadas + genera `sheet_update_json` para bf2-010 | ✅ |
| bf2-010 | Actualizar Sheet Social | HTTP batchUpdate: escribe en L (Instagram), M (Facebook), N (TikTok), P (YouTube Shorts) | ✅ |
| bf2-015 | Telegram Notificar Éxito Social | Mensaje con keyword + título indicando Sheet actualizado | ✅ |
| bf2-016 | Error Trigger | Captura errores en cualquier nodo | ✅ |
| bf2-017 | Telegram Notificar Error Social | Notifica fase + detalle del error al bot | ✅ |

**Publicación:** 100% manual. El flujo termina cuando las columnas L/M/N/P están llenas en el Sheet. El editor usa ese contenido para publicar manualmente en cada plataforma.

> **Nota — Google Indexing API (eliminada 2026-04-25):** Se intentó implementar indexación inmediata via Indexing API con JWT RS256 pure-JS. El JWT funciona correctamente pero la GSC UI no acepta emails de service accounts como Owner (error "correo no encontrado"), y la interfaz antigua (`webmasters/verification`) fue deprecada por Google. El sitemap ping (`google.com/ping`) también fue deprecado en enero 2024. La indexación ocurre de forma natural a través del sitemap de Yoast en 1-3 días.

### Flujo de priorización estacional

```
Schedule Trigger (8am L/M/V)
        ↓
bf-node-s1: Leer todas las filas Pendiente con fecha_objetivo
        ↓
bf-node-s2: ¿Hay alguna con fecha_objetivo en los próximos 14 días?
        ↓
bf-node-s3: IF found=true
    [TRUE]  → bf-node-s4: Cambiar estado a "Aprobado" en Sheet
                ↓
    [ambas] → bf-node-002: Leer Keywords Aprobadas
                ↓
             bf-node-003b: Tomar Primera Keyword
             (prioriza la que tiene fecha_objetivo si hay varias en cola)
```

**Decisión arquitectónica — Redes sociales desacopladas:**
El blog estacional se publica 14 días antes del evento (para indexarse en Google). Las redes sociales NO se activan en ese momento. La columna `fecha_social` registra la fecha real del evento. El workflow Fase B-2 (`3PWQY3biRhOyN1IA`) revisa diariamente a las 10am Colombia (15:00 UTC) si `fecha_social = hoy` para estacionales, o si hay artículos nuevos en L/M/V para regulares.

### Notas técnicas críticas

**Patrón `wp_body_json` / `gpt_body_json`:**
Los Code nodes (bf-node-023 y bf-node-006) serializan los payloads con `JSON.stringify` antes de devolverlos. Esto evita dos problemas: (1) el límite de tamaño de item n8n (~4KB) que descarta campos grandes, y (2) la corrupción de JSON al interpolar strings con saltos de línea o comillas. Los nodos HTTP posteriores usan `specifyBody: "json"` + `jsonBody: "={{ $json.gpt_body_json }}"` para deserializar y enviar.

**Tags — cadena de 4 nodos HTTP:**
El antiguo Code node `Crear Tags Post` usaba `httpRequestWithAuthentication` pero n8n descarta el campo `credentials: {}` para Code nodes en el API. Se reemplazó por 4 nodos encadenados: Split (Code) → POST Tag (HTTP Request con wordpressApi) → Collect IDs (Code, runOnceForAllItems) → Asignar (HTTP Request con wordpressApi). Los HTTP Request nodes sí retienen credenciales.

**strip4Byte en bf-node-006:**
GPT ocasionalmente genera caracteres Unicode matemáticos en negrita (ej: `𝟭𝗿𝗲𝘀`) que son de 4 bytes (fuera del BMP). MySQL con charset `utf8` (no `utf8mb4`) no puede almacenarlos y lanza `db_insert_error`. La función `strip4Byte()` los elimina del `body_html`, `title`, `excerpt` y campos Yoast antes de construir el payload de WordPress.

**Una sola keyword por ejecución:**
`bf-node-003b` toma solo el primer item del array de keywords Aprobadas. Si hay varias en cola, se procesan de a una por día (L/M/V). Prioriza keywords con `fecha_objetivo` presente sobre las normales.

**bf2-006 genera sheet_update_json directamente:**
`Parsear JSON Social` (bf2-006) construye las 4 columnas formateadas (col_instagram, col_facebook, col_tiktok, col_youtube) y serializa el `sheet_update_json` para el batchUpdate. Esto elimina la dependencia de bf2-009 en el flujo activo. `bf2-010 (Actualizar Sheet Social)` lee `$json.sheet_update_json` directamente de bf2-006.

---

## Credenciales configuradas

| Servicio | Nombre en n8n | ID | Estado |
|---------|---------------|----|--------|
| WordPress | `Wordpress account` | `r90z9yKyuuNlhBLy` | ✅ |
| OpenAI | `N8N_BigotesFelinos` | `sZscccSGx3nfNyOm` | ✅ |
| Google Sheets | `Google Sheets account` | `70heM3IFsNK9Cyak` | ✅ |
| Gemini (imágenes) | `nano banana` | `ysOycTrtxEO3BRcW` | ✅ |
| Telegram | `Telegram BF Bot` | `7iBygAb1uGxktnFH` | ✅ |
| Meta (Facebook + Instagram) | — (token embebido en bf2-009) | — | ⏳ Pendiente Meta App |

**Nota:** Todas las claves viven en el sistema cifrado de n8n. El `.env` del proyecto es solo documentación de referencia.

---

## Pendientes

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| **Fase D — Re-optimización GSC** | 🟠 Próximo | Los 106 posts existentes ya tienen meses de datos en GSC. Implementar workflow que detecta posiciones 6-20 con CTR bajo y propone mejoras de título y meta |
| **Fase B-2 Sheet-filling activa** | ✅ 2026-04-27 | Flujo bf2-001→bf2-006→bf2-010→bf2-015 activo. Llena cols L/M/N/P con 10 campos CapCut-ready. Publicación manual. |
| **Pipeline activo L/M/V 8am** | ✅ 2026-04-25 | `active: true` confirmado en n8n. cron `0 8 * * 1,3,5` |
| **Tags manuales — ID 2586 y 2591** | ✅ 2026-04-25 | alimentos prohibidos para gatos + pulgas en gatos tratamiento — tags añadidos en WP |
| **Pipeline completo validado** | ✅ 2026-04-25 | 5 artículos publicados. Todos los nodos funcionales. Google Indexing eliminado — indexación via sitemap Yoast |
| **strip4Byte en bf-node-006** | ✅ 2026-04-25 | GPT genera caracteres Unicode 4-byte que rompen MySQL utf8. Función strip4Byte() sanitiza antes de publicar |
| **Telegram** | ✅ 2026-04-24 | Bot `@bigotesfelinos_pipeline_bot` · nodos bf-node-020 y bf-node-022 activos |
| **Poblar Master Sheet** | ✅ 2026-04-25 | ~143 keywords cargadas: 106 existentes + 27 prioritarias + 10 estacionales con `fecha_objetivo` |
| **Auto-priorización estacional** | ✅ 2026-04-25 | 4 nodos (bf-node-s1…s4) + lógica en bf-node-003b. Columnas `fecha_objetivo` / `fecha_social` en Sheet |
| **Una keyword por ejecución** | ✅ 2026-04-25 | bf-node-003b limita a 1 keyword por disparo; Schedule 8am L/M/V |
| **Bloque A — correcciones sitio** | ✅ 2026-04-23 | Newsletter, Lorem ipsum, fechas, email autor, redes sociales |
| **Bloque B — SEO técnico** | ✅ 2026-04-24 | robots.txt físico, redirect 301, Schema Organization+BreadcrumbList en Yoast |

## Posts publicados en producción

| Fecha | ID WP | Keyword | URL | Tags | Indexado |
|-------|-------|---------|-----|------|----------|
| 2026-04-24 | 2576 | toxoplasmosis embarazo gatos | /salud-del-gato/toxoplasmosis-embarazo-gatos/ | Manual ✅ | — |
| 2026-04-24 | 2581 | síntomas de gato enfermo | /salud-del-gato/sintomas-de-gato-enfermo/ | Auto ✅ (7 tags) | — |
| 2026-04-24 | 2586 | alimentos prohibidos para gatos | /alimentacion-del-gato/alimentos-prohibidos-para-gatos/ | Manual pendiente 🔴 | — |
| 2026-04-25 | 2591 | pulgas en gatos tratamiento | /salud-del-gato/pulgas-en-gatos-tratamiento/ | Manual pendiente 🔴 | — |
| 2026-04-25 | 2602 | adoptar un gato qué necesito | /el-mundo-del-gato/adoptar-un-gato-que-necesito/ | Auto ✅ | — |
| 2026-04-25 | — | gato siamés características y temperamento | /razas-de-gatos/gato-siames-caracteristicas-y-temperamento/ | Auto ✅ | — |
