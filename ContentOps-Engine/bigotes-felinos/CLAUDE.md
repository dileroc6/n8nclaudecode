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
- **ID:** `1dsHuDVuz3XuN9vBGhRuJEN-FZhx5zwZsOj6fvUEaH7s`
- **Hojas activas:** `Blog` (pipeline principal) · `Redes Sociales` (copies para publicación)

#### Hoja `Blog`
- **Trigger:** Columna `estado` = `"Aprobado"`
- **Schedule:** Una vez al día a las 8am (`cron: 0 8 * * 1,3,5`) — L/M/V
- **Estados:** `Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`
- **Columnas:** `keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M)`
- **`fecha_objetivo`:** Columna K. Solo para keywords estacionales. Fecha en que debe publicarse el blog (2 semanas antes del evento). El pipeline la detecta automáticamente y prioriza.
- **`fecha_social`:** Columna L. Fecha en que debe publicarse en redes sociales (= fecha del evento para estacionales, vacío para normales). Usada por WF2.
- **`fecha_reoptimizado`:** Columna M. Fecha en que WF3 re-optimizó este post. Bloquea re-procesamiento por 90 días.
- **Fuente de verdad dual:** actúa como disparador de entrada (filas "Aprobado") e índice de posts publicados (filas "Publicado") para el check de canibalismo y contexto de enlaces internos
- **Populated:** ✅ ~143 keywords (2026-04-25): 106 existentes + 4 publicadas + 27 nuevas + 10 estacionales adicionales

#### Hoja `Redes Sociales`
- **Escrita por:** WF2 (tipo=Blog, diario) · WF4 (tipo=Entretenimiento, sábados)
- **Columnas:** `tipo(A) | keyword(B) | url_post(C) | fecha_social(D) | estado(E) | copy_instagram(F) | copy_facebook(G) | guion_tiktok(H) | guion_youtube(I)`
- **`tipo`:** `Blog` (copia de artículo publicado) o `Entretenimiento` (situación cómica generada por GPT)
- **`estado`:** `Pendiente` → `Publicado` — el equipo lo marca manualmente al publicar en cada plataforma
- **Uso editorial:** filtrar por `tipo` para ver qué publicar; filtrar por `estado=Pendiente` para ver qué está pendiente

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
│   ├── FLUJO_COMPLETO.md              ← documentación técnica detallada de cada workflow
│   ├── RESUMEN_PROYECTO.md            ← resumen ejecutivo del proyecto y los 4 workflows
│   ├── CREDENCIALES_Y_COSTOS.md       ← todas las APIs, claves y estimación de costos
│   ├── ESTRATEGIA_NEGOCIO.md          ← visión, pilares, arquitectura
│   └── auditoria_estrategia.md        ← auditoría digital (2026-04-23)
├── _brandkit/
│   └── IDENTIDAD_VOZ.md               ← personalidad, tono, diccionario
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt       ← estructuras y skills de producción
├── _config/
│   └── INTEGRACIONES_TECNICAS.md      ← endpoints, APIs, flujo de datos, .env
└── _aeo/                              ← Answer Engine Optimization deliverables
    └── sprint-1/
        ├── llms.txt                   ← desplegado en bigotesfelinos.com/llms.txt
        └── equipo-editorial.html       ← desplegado como page ID 2673
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

## Estado del Pipeline (2026-05-03)

**AEO Sprint 1 + 2 desplegados** — los workflows generadores (WF1, WF3) ahora producen artículos con un stack completo de Answer Engine Optimization. Cada artículo nuevo tiene: respuesta directa citable por IAs, key takeaways como blockquote, tabla obligatoria (HARD GATE), bloque de Fuentes consultadas con 3-5 referencias, schemas JSON-LD múltiples (FAQPage + WebPage con Speakable + mentions de entidades canónicas Wikipedia + HowTo condicional), H2/H3 obligatoriamente question-first, y un Quality Gate que evalúa 18 checks sobre 120 puntos. El pipeline también dispone de `/equipo-editorial/` y `/llms.txt` como cimientos de E-E-A-T y AEO crawler signal. Ver sección **AEO upgrades (Sprint 1 + 2)** más abajo para detalle completo.

### WF1 — Blog SEO: `BF - WF1 - Blog SEO: Keyword → Publicar en WordPress`
- **ID n8n:** `IVKelNHLoEaWD92B`
- **Nodos totales:** 33
- **Estado:** ✅ Funcional y en producción — artículos publicados L/M/V 8am Colombia
- **Trigger:** Diario a las 8am Colombia (`0 13 * * *`) — lógica L/M/V delegada a bf-node-003b

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| bf-node-001 | Schedule Trigger | Dispara diariamente a las 8am Colombia (`0 13 * * *`) — lógica L/M/V delegada a bf-node-003b | ✅ |
| bf-node-s1 | Leer Estacionales Pendientes | Lee Sheet filtrando `estado="Pendiente"` — busca con `fecha_objetivo` próxima | ✅ |
| bf-node-s2 | Verificar Estacional Urgente | Code (`runOnceForAllItems`): detecta si hay keyword con `fecha_objetivo` en los próximos 14 días | ✅ |
| bf-node-s3 | IF Estacional Urgente | IF `$json.found === true` → rama de priorización estacional | ✅ |
| bf-node-s4 | Activar Estacional en Sheet | HTTP PUT a Sheets API → cambia `estado` de la keyword estacional a `"Aprobado"` | ✅ |
| bf-node-002 | Leer Keywords Aprobadas | Lee Sheet filtrando `estado="Aprobado"` | ✅ |
| bf-node-003 | Hay keyword | IF: ¿hay keyword para procesar? | ✅ |
| bf-node-003b | Tomar Primera Keyword | Code: toma la primera keyword; estacionales publican cualquier día de la semana; regulares solo en L/M/V (check timezone Colombia) | ✅ |
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

### WF2 — Redes Sociales: `BF - WF2 - Redes Sociales: Generar Copies CapCut`
- **ID n8n:** `3PWQY3biRhOyN1IA`
- **Nodos totales:** 11
- **Estado:** ✅ Activo — inserta filas en la hoja `Redes Sociales` con contenido CapCut-ready. Publicación 100% manual.
- **Trigger:** Diario a las 10am Colombia (15:00 UTC) — cron `0 15 * * *`
- **Flujo activo:** bf2-001 → bf2-002 → bf2-002b → bf2-003 → bf2-004 → bf2-005 → bf2-006 → bf2-010 → bf2-015
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
| bf2-002 | Leer Posts Publicados | HTTP GET a Sheets API `Blog!A:M` — 1 sola request (evita rate limit del nodo nativo que hace ~N requests internos) | ✅ |
| bf2-002b | Leer Redes Sociales | HTTP GET a Sheets API `Redes Sociales!A:B` — solo columnas tipo+keyword, 1 request | ✅ |
| bf2-003 | Filtrar Artículos para Hoy | Code (runOnceForAllItems): parsea formato `values[][]` de Sheets API, cruza `Blog` con `Redes Sociales`, descarta keywords ya procesadas, selecciona **todos** los estacionales con `fecha_social=hoy` + máximo 2 regulares sin `fecha_social` en días L/M/V | ✅ |
| bf2-004 | Construir Prompt GPT Social | Code: solicita 10 campos granulares por plataforma (3 IG + 2 FB + 3 TT + 2 YT). Cada campo es CapCut-ready | ✅ |
| bf2-005 | Generar Paquete Social GPT-4o | HTTP + OpenAI credential — devuelve JSON con 10 campos | ✅ |
| bf2-006 | Parsear JSON Social | Code: mapea 10 campos → 4 columnas formateadas + genera `sheet_append_json` para bf2-010 | ✅ |
| bf2-010 | Actualizar Sheet Social | HTTP append: inserta nueva fila en `Redes Sociales` (`tipo="Blog"`, keyword, url_post, fecha_social, copies) | ✅ |
| bf2-015 | Telegram Notificar Éxito Social | Mensaje con keyword + título indicando nueva fila insertada en Redes Sociales | ✅ |
| bf2-016 | Error Trigger | Captura errores en cualquier nodo | ✅ |
| bf2-017 | Telegram Notificar Error Social | Notifica fase + detalle del error al bot | ✅ |

**Publicación:** 100% manual. El flujo termina cuando se inserta una nueva fila en `Redes Sociales`. El editor usa ese contenido para publicar manualmente en cada plataforma.

> **Nota — Google Indexing API (eliminada 2026-04-25):** Se intentó implementar indexación inmediata via Indexing API con JWT RS256 pure-JS. El JWT funciona correctamente pero la GSC UI no acepta emails de service accounts como Owner (error "correo no encontrado"), y la interfaz antigua (`webmasters/verification`) fue deprecada por Google. El sitemap ping (`google.com/ping`) también fue deprecado en enero 2024. La indexación ocurre de forma natural a través del sitemap de Yoast en 1-3 días.

### WF3 — Re-optimización: `BF - WF3 - Re-optimización SEO: Posts GSC posición 6-50`
- **ID n8n:** `T46531TOrPeT6VmS`
- **Nodos totales:** 26
- **Estado:** ✅ Activo — se ejecuta automáticamente el 1° de cada mes + disponible manualmente.
- **Trigger:** Manual (fd-001) + Mensual automático (fd-001c) — ambos conectados al mismo nodo de entrada
- **Notificación "Sin candidatos":** fd-004 emite `{no_candidates: true}` cuando no hay posts a re-optimizar → fd-004b (IF) bifurca: TRUE → fd-015 (Telegram aviso) · FALSE → fd-004c (Guard) → procesamiento normal. El Guard filtra el sentinel para evitar ghost items en `executionOrder: v1`.
- **Internal Linker WF3 (fd-008b)** + **Quality Gate WF3 (fd-008c)**: insertados entre fd-008 (Parsear) y fd-009 (WordPress PATCH Post). Mismas reglas que en WF1 — Linker valida URLs alucinadas y suplementa hasta 2 enlaces internos reales; Gate aplica 15 checks ponderados con threshold 70 y throw Error con breakdown si falla.
- **Prompt fd-006 refactored:** sistema con Vet-Friend reforzado, frases prohibidas, mini-historias obligatorias, AI Search rule. Schema GPT incluye `respuesta_directa` y `key_takeaways[]`. Parser fd-008 inyecta ambos en el HTML re-optimizado igual que WF1.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| fd-001 | Manual Trigger | Permite ejecución manual desde la UI de n8n | ✅ |
| fd-001c | Schedule Trigger Mensual | Cron `0 13 1 * *` (1° de cada mes, 8am Colombia) | ✅ |
| fd-002 | Leer Posts Publicados | GSheets: filas con `estado="Publicado"` — fuente de candidatos + contexto de enlaces internos | ✅ |
| fd-003 | Consultar GSC API | POST a GSC searchAnalytics — posiciones últimos 90 días de `bigotesfelinos.com` | ✅ |
| fd-004 | Filtrar y Priorizar Candidatos | Code (`runOnceForAllItems`): cruza Sheet con GSC, filtra pos 6-50 con ≥5 impresiones, bloqueo 90 días col M (`fecha_reoptimizado`), dedup por URL, máx 10 candidatos ordenados por impresiones desc. Si 0 candidatos → emite `[{no_candidates: true}]` | ✅ |
| fd-004b | IF Sin Candidatos | IF v2: `$json.no_candidates === true` → TRUE: fd-015 (Telegram aviso); FALSE: fd-004c (Guard) | ✅ |
| fd-004c | Guard Sin Candidatos | Code (`runOnceForAllItems`): `items.filter(item => !item.json.no_candidates)`. Bloquea ghost items del IF FALSE en v1 — devuelve `[]` si solo entra el sentinel, cortando la cadena limpiamente | ✅ |
| fd-015 | Telegram Sin Candidatos | Telegram node: aviso "ℹ️ Sin candidatos para re-optimizar" al chat `1591872862` | ✅ |
| fd-005 | Leer Contenido WP Posts | HTTP GET por cada candidato: recupera `content.raw` de WP para reescribir | ✅ |
| fd-005b | Merge | Combina metadata de Sheet/GSC (fd-004) con contenido WP (fd-005) por posición | ✅ |
| fd-006 | Construir Prompt GPT Refresh | Code (`runOnceForAllItems`): builds prompt completo — mismo estándar que pipeline principal. Incluye `currentYear`, posts publicados para enlaces internos, reglas de densidad, `faq_items[]`, enlace externo obligatorio, `tags[]` | ✅ |
| fd-007 | Llamar GPT-4o Refresh | HTTP + OpenAI credential. `max_tokens: 8000`. Devuelve `body_html`, `faq_items`, `seo_title`, `meta_description`, `tags[]` | ✅ |
| fd-008 | Parsear Respuesta GPT | Code (`runOnceForAllItems`): `stripH1()`, `strip4Byte()`, `capitalizarHeadings()`, `limpiarFAQ()`, `buildFAQHtml()`, `buildFAQJsonLD()`, `truncarMeta()`. Genera `wp_patch_json` + `sheet_update_json` + `tags_list` (JSON serializado). Fecha en timezone Colombia (UTC-5) | ✅ |
| fd-009 | WordPress PATCH Post | HTTP Request (wordpressApi): PATCH a `/wp-json/wp/v2/posts/{id}`. URL como expresión completa `={{ 'https://bigotesfelinos.com/wp-json/wp/v2/posts/' + $json.wp_post_id }}` | ✅ |
| fd-010 | Actualizar Sheet | HTTP batchUpdate: columna J (posición GSC) + columna M (fecha_reoptimizado en timezone Colombia) — hoja `Blog` | ✅ |
| fd-021a | Tags Split WF3 | Code (`runOnceForAllItems`): lee `$('Parsear Respuesta GPT').all()`, emite un item por (post, tag) con `{tag_name, wp_post_id}` | ✅ |
| fd-021b | Tags POST Tag WF3 | HTTP Request (wordpressApi, `continueOnFail`): POST `/wp-json/wp/v2/tags` — crea tag si no existe; maneja 409 term_exists transparentemente | ✅ |
| fd-021c | Tags Collect IDs WF3 | Code (`runOnceForAllItems`): cruza respuestas de fd-021b con inputs de fd-021a (por posición) para obtener `wp_post_id`; agrupa tag IDs por post; serializa `tags_patch_json` | ✅ |
| fd-021d | Tags Asignar WF3 | HTTP Request (wordpressApi): PATCH `/wp-json/wp/v2/posts/{id}` con `{tags: [ids]}` — reemplaza tags del post | ✅ |
| fd-011 | Construir Resumen Telegram | Code (`runOnceForAllItems`): agrega todos los ítems de `$('Parsear Respuesta GPT').all()` en un solo mensaje con lista de artículos re-optimizados y sus posiciones | ✅ |
| fd-012 | Telegram Notificar Éxito | Telegram node: envía resumen con count de artículos procesados al chat `1591872862` | ✅ |
| fd-013 | Error Trigger | Captura errores no controlados | ✅ |
| fd-014 | Telegram Notificar Error | Telegram node: notifica fase + detalle del error | ✅ |

**Notas técnicas críticas de Fase D:**
- Todos los Code nodes usan `runOnceForAllItems` — evita bug de `pairedItem` del nodo Merge
- fd-009 (PATCH WP): URL como expresión completa, nunca como `posts/={{ expr }}` (causa literal `=` en la URL)
- fd-010 y fd-011: referencian `$('Parsear Respuesta GPT').all()` porque HTTP Request rewrites el item — `$json` quedaría vacío
- fd-004: deduplica URLs de GSC (GSC puede retornar `page/` y `page/#section` como entradas distintas)
- fd-008: timezone Colombia — `new Date().getTime() + (-5 * 60 - now.getTimezoneOffset()) * 60000`
- fd-021c: cruza por posición `$input.all()[i]` (respuesta WP tags) con `$('Tags Split WF3').all()[i]` (input original con wp_post_id) — el orden está garantizado porque HTTP Request procesa items en secuencia

### WF4 — Entretenimiento: `BF - WF4 - Entretenimiento Viral: Contenido Humor`
- **ID n8n:** `ylPUrgrgbL1wLnQ2`
- **Nodos totales:** 11
- **Estado:** ✅ Activo — sábados 10am Colombia. Publicación manual.
- **Trigger:** Cron `0 15 * * 6` (sábados 15:00 UTC = 10am Colombia)
- **Fuente:** Si hay filas con `tipo="Entretenimiento"` + `estado="Idea"` (generadas por WF5), desarrolla la primera. Si no hay ideas, GPT elige autónomamente una situación nueva.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| ent-001 | Schedule Trigger Sábado | Cron `0 15 * * 6` (sábados 15:00 UTC = 10am Colombia) | ✅ |
| ent-002b | Leer Redes Sociales | GSheets: todas las filas de la hoja `Redes Sociales` — detecta Ideas pendientes y situaciones ya publicadas | ✅ |
| ent-005 | Construir Prompt GPT | Code (`runOnceForAllItems`): detecta `estado="Idea"`; si hay idea → prompt específico; si no → GPT elige autónomamente. Pasa `has_idea`, `idea_situation`, `idea_row_idx` | ✅ |
| ent-006 | Generar Contenido GPT-4o | HTTP + OpenAI credential — devuelve JSON con 6 campos (con idea) o 7 campos (autónomo, incluye `situacion`) | ✅ |
| ent-007 | Parsear JSON Entretenimiento | Code: construye `rowData`, genera `sheet_append_json` + `sheet_update_json`, pasa `has_idea` e `idea_row_number` | ✅ |
| ent-007b | IF Tiene Idea | IF `has_idea === true` → rama PUT (actualizar fila existente); FALSE → rama append (nueva fila) | ✅ |
| ent-008b | Actualizar Fila Idea | HTTP PUT: actualiza fila `idea_row_number` en `Redes Sociales` con contenido generado (estado: Pendiente) | ✅ |
| ent-008 | Actualizar Sheet Entretenimiento | HTTP append: inserta nueva fila en `Redes Sociales` (`tipo="Entretenimiento"`, situacion, copies) | ✅ |
| ent-009 | Telegram Notificar Éxito | Mensaje con situación + indica si fue idea procesada o nueva generación | ✅ |
| ent-010 | Error Trigger | Captura errores en cualquier nodo | ✅ |
| ent-011 | Telegram Notificar Error | Notifica fase + detalle del error al bot | ✅ |

### WF5 — Generador de Ideas: `BF - WF5 - Generador de Ideas: Blog + Entretenimiento`
- **ID n8n:** `yRbv29Y6FiQHn1Qg`
- **Nodos totales:** 16
- **Estado:** ⏳ Activo (ejecución manual) — requiere configurar credencial SerpAPI
- **Trigger:** Manual
- **Fuente de datos:** GSC API (queries reales ≥3 impresiones) + SerpAPI (PAA + autocomplete) + GPT-4o (síntesis + enriquecimiento)

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| w5-001 | Manual Trigger | Ejecución manual desde UI de n8n | ✅ |
| w5-002 | Preparar Fechas GSC | Code: calcula rango de fechas para consulta GSC (últimos 90 días) | ✅ |
| w5-003 | GSC Query | HTTP POST a GSC searchAnalytics — obtiene queries con ≥3 impresiones | ✅ (cred `XWbfIBmitmx1uByl`) |
| w5-004 | SerpAPI | HTTP GET: PAA + autocomplete de Google para temas del nicho felino | ⏳ (cred `SerpAPI` pendiente) |
| w5-005 | Leer Blog Sheet | HTTP GET Sheets API `Blog!A:A` — solo columna keyword (1 read request vs 60+) | ✅ |
| w5-006 | Leer Redes Sociales | HTTP GET Sheets API `Redes Sociales!A:B` — solo columnas tipo+keyword (1 read request vs 60+) | ✅ |
| w5-007 | Construir Prompt GPT | Code (`runOnceForAllItems`): sintetiza GSC + SerpAPI + existentes, construye prompt GPT con contexto completo | ✅ |
| w5-008 | GPT-4o Generar Ideas | HTTP + OpenAI — genera ideas blog (keyword + metadatos) + ideas entretenimiento (situaciones nuevas) | ✅ |
| w5-009 | Parsear y Filtrar Ideas | Code (`runOnceForAllItems`): dedup Jaccard ≥50% contra existentes, separa blog vs entretenimiento, genera payloads para append | ✅ |
| w5-010 | IF Blog Ideas | IF `blog_count > 0` → append ideas de blog | ✅ |
| w5-011 | Append Blog Ideas | HTTP POST: inserta filas en hoja `Blog` con `estado="Pendiente"` | ✅ |
| w5-012 | IF Ent Ideas | IF `ent_count > 0` → append ideas de entretenimiento | ✅ |
| w5-013 | Append Ent Ideas | HTTP POST: inserta filas en hoja `Redes Sociales` con `tipo="Entretenimiento"`, `estado="Idea"` | ✅ |
| w5-014 | Telegram Notificar | Mensaje con resumen: N ideas blog + M ideas entretenimiento insertadas | ✅ |
| w5-015 | Error Trigger | Captura errores no controlados | ✅ |
| w5-016 | Telegram Error | Notifica error al bot | ✅ |

**Credencial SerpAPI:** Crear en n8n → Credentials → New → **HTTP Query Auth**, nombre `SerpAPI`, query param `api_key` = tu SerpAPI key. El nodo w5-004 tiene `continueOnFail: true` — el workflow no falla si la credencial no está configurada.

**Flujo de datos WF5:**
```
Manual Trigger
    ↓
Preparar Fechas GSC → GSC Query → SerpAPI (continueOnFail)
    ↓           ↓           ↓
    └───────────┴───────────┘
Leer Blog Sheet + Leer Redes Sociales
    ↓
Construir Prompt GPT → GPT-4o → Parsear y Filtrar Ideas
    ↓                                       ↓                    ↓
IF Blog Ideas → Append Blog!A:M      IF Ent Ideas → Append RS!A:I    Telegram
(estado=Pendiente)                   (tipo=Entretenimiento, estado=Idea)
```

**Integración WF5 → WF4:**
Las ideas de entretenimiento que WF5 inserta con `estado="Idea"` son consumidas por WF4 el siguiente sábado. WF4 detecta la primera fila con `tipo="Entretenimiento"` + `estado="Idea"`, genera el contenido viral para esa situación específica, y actualiza la fila (estado: `Pendiente`, contenido completo).

---

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

**scrubAIWatermarks en bf-node-006 y fd-008 (Anti-AI watermark):**
Pipeline estándar después de `strip4Byte()`. Limpia tres categorías de marcas que GPT inserta y que herramientas como GPTZero / Originality.ai usan para detectar contenido IA:
1. **15 caracteres Unicode invisibles** — zero-width space (U+200B), BOM (U+FEFF), zero-width joiners (U+200C/D), word joiner (U+2060), soft hyphen (U+00AD), narrow no-break space (U+202F), etc. + categoría completa `\p{Cf}` (format-control).
2. **Em-dashes contextuales** — Reemplazo prioritizado: (a) `frase — Nombre` → `frase, Nombre` (atribución), (b) `frase — Mayúscula` → `frase. Mayúscula` (cláusulas independientes), (c) resto → coma.
3. **Whitespace artifacts** — espacios múltiples → 1, espacios antes de puntuación → eliminados, 3+ saltos de línea → 2.

Aplicado a `body_html` (post-ensamblaje con FAQ + JSON-LD), `seo_title`, `meta_description`, campos Yoast, y a las preguntas/respuestas dentro de `buildFAQHtml`/`buildFAQJsonLD`. Idempotente.

**Una sola keyword por ejecución:**
`bf-node-003b` toma solo el primer item del array de keywords Aprobadas. Si hay varias en cola, se procesan de a una por día (L/M/V). Prioriza keywords con `fecha_objetivo` presente sobre las normales.

**bf2-006 genera sheet_append_json — append en lugar de batchUpdate:**
`Parsear JSON Social` (bf2-006) construye las 4 columnas formateadas y serializa `sheet_append_json` como un array de values para la Sheets API `values:append`. `bf2-010` inserta una fila nueva en `Redes Sociales` con los campos `[tipo, keyword, url_post, fecha_social, estado, col_instagram, col_facebook, col_tiktok, col_youtube]`. Este patrón elimina la necesidad de conocer el número de fila — la API hace el append al final de los datos existentes.

**WF4 — Dual mode: procesa Ideas de WF5 o genera autónomamente:**
`ent-005` (modo `runOnceForAllItems`) detecta primero si hay filas con `tipo="Entretenimiento"` + `estado="Idea"` en `Redes Sociales`. Si hay al menos una, toma la primera y construye un prompt específico para esa situación (devuelve 6 campos, sin `situacion`). Si no hay ideas, GPT elige autónomamente y devuelve 7 campos (incluyendo `situacion`). `ent-007b` bifurca: `has_idea=true` → HTTP PUT actualiza la fila existente (ent-008b); `has_idea=false` → HTTP POST append nueva fila (ent-008).

**fd-008 / fd-010 — fecha_reoptimizado ahora en columna M (hoja Blog):**
La columna `fecha_reoptimizado` se movió de la antigua Pipeline!Q a Blog!M al reestructurar las hojas. El batchUpdate de fd-010 escribe en Blog!J (posicion_gsc) y Blog!M (fecha_reoptimizado).

---

## AEO upgrades (Sprint 1 + 2 — desplegado 2026-05-03)

Sistema de optimización para Answer Engines (ChatGPT, Perplexity, Google AI Overviews, Alexa, Google Home, Siri) además de SEO clásico. Aplicado a WF1 (artículos nuevos) y replicado en WF3 (re-optimización mensual).

### Estructura del HTML que cada artículo nuevo publica

```html
<p class="respuesta-directa">[1-2 oraciones citables por IA]</p>
[intro empático]
<blockquote class="key-takeaways">[3-5 conclusiones]</blockquote>
[H2/H3 question-first con cuerpo + mini-historias + 2 enlaces internos + 1 enlace externo]
<table>[mínimo 1 tabla con datos estructurados — HARD GATE]</table>
[más cuerpo]
<h2>Preguntas frecuentes</h2>[5-6 FAQ items]
<section class="fuentes-consultadas">[3-5 fuentes WSAVA/AVMA/MSD/PubMed/etc.]</section>
<script>[FAQPage JSON-LD]</script>
<script>[WebPage + Speakable + mentions JSON-LD]</script>
<script>[HowTo JSON-LD — solo si keyword procedural]</script>
```

### Sprint 1 — Cimientos AEO (Día 1-5)

| Día | Entregable | Función |
|-----|-----------|---------|
| D1 | `bigotesfelinos.com/llms.txt` | Estándar emergente — declara qué páginas son confiables para IA crawlers (Anthropic, OpenAI, Perplexity respetan). En `_aeo/sprint-1/llms.txt` |
| D1 | Página `/equipo-editorial/` (page ID 2673) | Soft E-E-A-T sin veterinario en nómina: metodología, fuentes, disclaimer médico, política editorial. Yoast meta optimizado vía PATCH posterior. En `_aeo/sprint-1/equipo-editorial.html` |
| D2 | Bloque `<section class="fuentes-consultadas">` | GPT genera `fuentes_consultadas[]` (3-5 fuentes con nombre/url/descripción). bf-node-006 / fd-008 construyen el bloque con `<a rel="nofollow noopener" target="_blank">`. Quality Gate check #16 (5 pts si ≥3 fuentes) |
| D3-4 | Schema upgrade — `Speakable` + `HowTo` | bf-node-006 / fd-008: nuevas funciones `buildSpeakableJsonLD(entities)` y `buildHowToJsonLD(steps, name)`. Speakable apunta a `.respuesta-directa` y `.key-takeaways` (asistentes de voz). HowTo solo si GPT identifica keyword procedural. Wrap automático: `<p class="respuesta-directa">` |
| D5 | Tabla obligatoria + HARD GATE | Prompt obliga incluir mínimo 1 `<table>` o `<dl>` en body_html. Quality Gate check #17 (10 pts) + HARD GATE: si `!hasTable` → `throw new Error()` independiente del score → Telegram con breakdown |

### Sprint 2 — Question-first + Capa de entidades (Día 1-3)

| Día | Entregable | Función |
|-----|-----------|---------|
| D1-2 | H2/H3 question-first | Prompt obliga 70%+ de H2/H3 como preguntas reales (¿Por qué...? ¿Cómo...? ¿Cuál es...?). `aplicarInterrogacion()` ahora se aplica también dentro de `capitalizarHeadings()` → auto-añade `¿?` cuando heading empieza con palabra interrogativa |
| D3 | Capa de entidades (`entities[]`) | GPT genera `entities[]` con razas, enfermedades, parásitos, organizaciones mencionadas. Cada entidad tiene `{nombre, tipo, wikipedia_url}`. `buildSpeakableJsonLD(entities)` extiende WebPage con `mentions[]` apuntando a Wikipedia `sameAs` → señal Knowledge Graph para Google |
| — | Quality Gate check #18 | H2 question-first ratio: 5 pts si ≥60% de H2 empiezan con `¿`, 3 pts si ≥40%, 1 pt si ≥20%, 0 si menos |

### Quality Gate WF1/WF3 — 18 checks sobre 120 puntos

| # | Check | Puntos | Notas |
|---|-------|--------|-------|
| 1-15 | Checks Sprint 0 (originales) | 100 pts | Word count, H2 count, keyword density, internal/external links, Yoast meta, respuesta directa, key takeaways, FAQ+JSON-LD, frases prohibidas, mini-historias, sentence length, tags |
| 16 | Fuentes consultadas (≥3) | 5 pts | Sprint 1 D2 |
| 17 | Tabla/data-box (HARD GATE) | 10 pts | Sprint 1 D5 — `throw Error` si no hay `<table>` ni `<dl>` |
| 18 | H2 question-first ratio | 5 pts | Sprint 2 — proporcional |

**Threshold:** 70/120 → si menos, throw Error → Sheet "Error" + Telegram con breakdown completo. **HARD GATE adicional:** sin tabla, no se publica (independiente del score).

### Nodos modificados (Sprint 1 + 2)

| Workflow | Nodo | Cambios acumulados |
|----------|------|---------------------|
| WF1 | bf-node-023 (prompt builder) | Schema GPT añade campos `fuentes_consultadas[]`, `howto_steps[]`, `entities[]`. Reglas nuevas: TABLA OBLIGATORIA INNEGOCIABLE, FORMATO H2/H3 QUESTION-FIRST. `prompt_imagen` renumerado a campo #13 |
| WF1 | bf-node-006 (parser) | Funciones nuevas: `buildFuentesHtml()`, `buildSpeakableJsonLD(entities)`, `buildHowToJsonLD(steps, name)`. `capitalizarHeadings()` ahora aplica `aplicarInterrogacion()`. `respuesta_directa` envuelto con `class="respuesta-directa"`. Reordenamiento del scrub final (antes del bloque fuentes que usa em-dashes literales) |
| WF1 | bf-node-006b (Quality Gate) | Checks #16, #17, #18 añadidos. HARD GATE para tabla. Total max: 100 → 120. Threshold 70 mantenido |
| WF3 | fd-006 (prompt builder) | Schema GPT añade `fuentes_consultadas[]`, `howto_steps[]`, `entities[]`. Mismas reglas TABLA + QUESTION-FIRST |
| WF3 | fd-008 (parser) | Mismas funciones + wrap + reordenamiento que bf-node-006 |
| WF3 | fd-008c (Quality Gate) | Mismos 3 checks adicionales + HARD GATE tabla + threshold /120 |

### Archivos generados por Sprint 1

```
_aeo/
└── sprint-1/
    ├── llms.txt                  ← desplegado en bigotesfelinos.com/llms.txt
    └── equipo-editorial.html      ← desplegado como page ID 2673
```

### Pendiente (siguientes Sprints)

- **Sprint 3 (clusters + pillares):** Refactor Master Sheet con columnas `hub` + `cluster_parent`. Asignar 143 keywords a 4 hubs (matching categorías WP). Construir WF6 "Pillar Generator" (3.500-4.000 palabras). Producir 4 pillares. Extender WF1 con PATCH al pillar al publicar cada cluster post.
- **Sprint 4 (medición):** WF7 "AEO Monitor" — consulta semanal a Perplexity API + scraping de Google AI Overviews para 20 keywords clave. Detecta si nos citan, qué snippet usan, qué competidor está antes. Hoja `AEO_Tracking` en el Master Sheet.

---

## Credenciales configuradas

| Servicio | Nombre en n8n | ID | Estado |
|---------|---------------|----|--------|
| WordPress | `Wordpress account` | `r90z9yKyuuNlhBLy` | ✅ |
| OpenAI | `N8N_BigotesFelinos` | `sZscccSGx3nfNyOm` | ✅ |
| Google Sheets | `Google Sheets account` | `70heM3IFsNK9Cyak` | ✅ |
| Gemini (imágenes) | `nano banana` | `ysOycTrtxEO3BRcW` | ✅ |
| Telegram | `Telegram BF Bot` | `7iBygAb1uGxktnFH` | ✅ |
| Google Search Console | `Google Sheets account` (OAuth2 reutilizada) | `XWbfIBmitmx1uByl` | ✅ |
**Nota:** Todas las claves viven en el sistema cifrado de n8n. El `.env` del proyecto es solo documentación de referencia.

---

## Pendientes

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| **AEO Sprint 1 — Cimientos AEO** | ✅ 2026-05-03 | `llms.txt` desplegado en raíz + página `/equipo-editorial/` (page ID 2673) con Yoast meta optimizado vía PATCH. Bloque `<section class="fuentes-consultadas">` en cada artículo (3-5 fuentes científicas). Schema upgrade: WebPage+Speakable+mentions, HowTo condicional. Tabla obligatoria con HARD GATE en Quality Gate. WF1 (33 nodos) + WF3 (26 nodos) replicados. |
| **AEO Sprint 2 — Question-first + Entidades** | ✅ 2026-05-03 | Prompt obliga H2/H3 question-first (≥70%). `aplicarInterrogacion()` aplicado en `capitalizarHeadings()` para auto-`¿?`. GPT genera `entities[]` con Wikipedia URLs → WebPage `mentions[]` con `sameAs` (Knowledge Graph signal). Quality Gate check #18 H2 question-first ratio. Threshold ahora /120 con 18 checks. WF1 + WF3 replicados. |
| **OAuth2 Google — Publicar app en producción** | ✅ 2026-05-01 | App OAuth2 publicada en producción en Google Cloud Console — tokens ya no expiran cada 7 días |
| **Credencial SerpAPI** | ✅ 2026-05-01 | Credencial creada (ID `44hTDtjkVRDKJOeU`). w5-004 actualizado de placeholder al ID real |
| **Test WF5 + WF4 con Idea** | ✅ 2026-05-01 | Validado en producción — WF5 inserta Ideas, WF4 las detecta y procesa correctamente |
| **WF3 — Tags en re-optimización** | ✅ 2026-05-01 | fd-006 ahora pide `tags[]` a GPT. fd-008 parsea `tags_list`. Cadena fd-021a→b→c→d asigna tags por post (soporta múltiples posts simultáneos). 21 nodos total. |
| **WF5 — Rate limit Sheets 429** | ✅ 2026-05-01 | `Leer Blog Sheet` y `Leer Redes Sociales` convertidos a HTTP GET leyendo solo A:A y A:B (2 read requests en lugar de 60+). Sin Sleep/Wait. 16 nodos total. |
| **WF2 — Rate limit Sheets 429 (re-fix)** | ✅ 2026-05-03 | El parche con `bf2-wait01` (Wait 65s) falló en producción el 2026-05-03: el Wait nativo solo esperó 2ms (bug en el umbral 65s entre in-memory wait y resume-via-webhook). Solución definitiva: replicar el patrón de WF5 — `bf2-002` y `bf2-002b` convertidos a HTTP GET a Sheets API leyendo `Blog!A:M` y `Redes Sociales!A:B` respectivamente (1 request por nodo en lugar de ~N). Wait eliminado. `bf2-003` adaptado para parsear formato `values[][]`. 11 nodos total. |
| **WF2 — Rate limit Sheets 429 (intento 1)** | ❌ 2026-05-01 | `bf2-wait01` (Wait 65s) insertado entre `Leer Posts Publicados` y `Leer Redes Sociales`. No funcionó — ver fix definitivo arriba. |
| **WF3 — Filtrar y Priorizar Candidatos "Unknown error"** | ✅ 2026-05-01 | Causa raíz: cuando `$input.all()` retorna 0 items (no hay posts publicados con URL), n8n lanza "Unknown error" al intentar `$('GSC Query').first()` con contexto vacío. Fix: early exit `if (!inputItems.length) return []` antes de acceder GSC Query. Además: slim down de items + `$('GSC Query').all()[0]` más robusto. |
| **WF3 — Notificación "Sin candidatos"** | ✅ 2026-05-01 | fd-004 ahora emite `{no_candidates: true}` cuando 0 candidatos. fd-004b (IF) bifurca a fd-015 (Telegram aviso) o fd-004c (Guard que filtra ghost items en v1). 24 nodos total. Validado en producción. |
| **Anti-AI watermark scrubber (bf-node-006 + fd-008)** | ✅ 2026-05-01 | Función `scrubAIWatermarks()` agregada a los Code nodes que escriben a WordPress (WF1 y WF3). Remueve 15 Unicode invisibles + categoría `\p{Cf}` + em-dashes contextuales + whitespace artifacts. Aplicado a body, title, meta y FAQ. Reduce señales de detección IA (GPTZero/Originality.ai). Inspirado en el comando `/scrub` de SEOMachine. |
| **Refactor prompt blog WF1 (Direct-Answer + Key-Takeaways + Mini-historias)** | ✅ 2026-05-01 | bf-node-023: system message reforzado con tono Vet-Friend, lista negra de frases prohibidas ("En el mundo de…", "Cuando se trata de…", etc.), mini-historias obligatorias (2 por artículo con nombre/edad/ciudad/resultado), AI Search optimization rule. Nuevos campos del JSON: `respuesta_directa` (1-2 oraciones citables por ChatGPT/Perplexity) y `key_takeaways` (3-5 conclusiones). bf-node-006: inyecta `respuesta_directa` como primer `<p>` y `key_takeaways` como `<blockquote class="key-takeaways">` antes del primer H2 (Featured Snippet target). |
| **Quality Gate WF1 (bf-node-006b)** | ✅ 2026-05-01 | Code node `Quality Gate` insertado entre bf-node-006 y bf-node-010. Calcula score 0-100 con 15 checks ponderados: word count, H2, keyword density, internal/external links, meta lengths, respuesta_directa, key_takeaways, FAQ+JSON-LD, frases prohibidas, mini-historias, sentence length, tags. Si `score < 70` → `throw new Error()` con breakdown completo → Error Trigger → Sheet "Error" + Telegram con detalle de qué falló. Previene publicación de artículos pobres y ahorra costo de nano banana. |
| **Internal Linker WF1 (bf-node-006a)** | ✅ 2026-05-01 | Code node `Internal Linker` insertado entre bf-node-006 (Parsear) y bf-node-006b (Quality Gate). (1) Valida cada `<a href="bigotesfelinos.com/...">` contra la lista real de posts publicados (de bf-node-016) y strippea URLs alucinadas por GPT (404s evitados). (2) Si quedan <2 enlaces internos válidos, inyecta automáticamente buscando coincidencias de keyword del post-objetivo en el body, sin re-enlazar texto que ya está dentro de un `<a>`. Output: `linker_stripped`, `linker_injected`, `linker_total_internal`. WF1 ahora tiene 33 nodos. |
| **Replicación a WF3 (Linker + Gate + prompt refactor)** | ✅ 2026-05-01 | fd-006 prompt refactored con sistema Vet-Friend reforzado + schema con `respuesta_directa` + `key_takeaways`. fd-008 parser inyecta ambos campos en el HTML re-optimizado. Nuevos nodos fd-008b (Internal Linker WF3, runOnceForEachItem) y fd-008c (Quality Gate WF3, runOnceForEachItem) entre Parsear y WP PATCH. Conexiones: fd-008 → fd-008b → fd-008c → fd-009. WF3 ahora tiene 26 nodos. Mismo threshold 70, mismo error path (Error Trigger → Sheet "Error" + Telegram). |
| **Replicación a WF2 (scrubber + frases prohibidas)** | ✅ 2026-05-01 | bf2-004 (Construir Prompt GPT Social): system message extendido con bloque "FRASES PROHIBIDAS" (las mismas que WF1: "En el mundo de…", "Cuando se trata de…", "Cabe destacar…", "Hoy en día…", verbos corporativos). bf2-006 (Parsear JSON Social): añade función `scrub()` y la aplica a los 10 campos de GPT (ig_hook_visual, ig_tips_body, ig_caption_seo, fb_script_narrativo, fb_copy_aida, tt_hook_agresivo, tt_script_fast, tt_bait_comentarios, yt_script_storytelling, yt_cta_subs) antes de armar las columnas del Sheet. Sin nuevos nodos — sigue siendo 12 nodos. |
| **WF5 — Generador de Ideas** | ✅ 2026-04-29 | Workflow `yRbv29Y6FiQHn1Qg` (17 nodos). GSC + SerpAPI + GPT-4o → inserta ideas en Blog (estado=Pendiente) y Redes Sociales (tipo=Entretenimiento, estado=Idea). Dedup Jaccard ≥50%. Credencial SerpAPI pendiente de crear. |
| **WF4 — Integración Ideas WF5** | ✅ 2026-04-29 | ent-007b (IF) + ent-008b (HTTP PUT). Detecta `estado="Idea"` → procesa situación específica + actualiza fila. Sin ideas → GPT autónomo + append. 11 nodos total. |
| **WF3 — Trigger mensual automático** | ✅ 2026-04-29 | fd-001c (Schedule Trigger Mensual, cron `0 13 1 * *`) añadido en paralelo con fd-001 (Manual). WF3 activo. |
| **WF1 — Trigger diario + lógica L/M/V** | ✅ 2026-04-29 | Cron cambiado a `0 13 * * *` (diario). bf-node-003b revisa día Colombia: estacionales publican cualquier día; regulares solo L/M/V. |
| **Fase D — Re-optimización GSC** | ✅ 2026-04-28 | Workflow `T46531TOrPeT6VmS` (17 nodos). GSC pos 6-50, ≥5 imp, bloqueo 90 días. GPT-4o reescribe completo con FAQ + 1800 palabras. Ejecutado exitosamente: 9 candidatos procesados |
| **Reestructuración hojas Sheet** | ✅ 2026-04-28 | Pipeline→Blog, Entretenimiento→Redes Sociales. WF2 y WF4 insertan filas en Redes Sociales (append). WF3 actualiza Blog!M. 4 workflows actualizados vía API. |
| **Fase B-2 Sheet-filling activa** | ✅ 2026-04-27 | Flujo bf2-001→bf2-002b→bf2-003→bf2-006→bf2-010→bf2-015 activo (11 nodos). Inserta filas en hoja `Redes Sociales` con tipo="Blog". Publicación manual. |
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
