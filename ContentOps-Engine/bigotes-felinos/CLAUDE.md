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
- **Hojas activas:** `Blog` (pipeline principal) · `Redes Sociales` (copies para publicación) · `AEO_Tracking` (citaciones AIO semanales, escrita por WF7) · `GSC_Tracking` (snapshot semanal sitewide, escrita por WF11) · `GSC_Pages_Tracking` (top 30 páginas con Δ pos vs sem anterior, escrita por WF11)

#### Hoja `Blog`
- **Trigger:** Columna `estado` = `"Aprobado"`
- **Schedule:** Una vez al día a las 8am (`cron: 0 8 * * 1,3,5`) — L/M/V
- **Estados:** `Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`
- **Columnas activas (A-M + R-S):** `keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M) | hub(R) | cluster_parent(S)`
- **Columnas N-Q (huérfanas):** `copy_instagram(N) | copy_facebook(O) | guion_tiktok(P) | guion_youtube(Q)` — datos viejos pre-reestructuración a `Redes Sociales`. **Ningún workflow las usa**. Quedan como referencia histórica.
- **`fecha_objetivo`:** Columna K. Solo para keywords estacionales. Fecha en que debe publicarse el blog (2 semanas antes del evento). El pipeline la detecta automáticamente y prioriza.
- **`fecha_social`:** Columna L. Fecha en que debe publicarse en redes sociales (= fecha del evento para estacionales, vacío para normales). Usada por WF2.
- **`fecha_reoptimizado`:** Columna M. Fecha en que WF3 re-optimizó este post. Bloquea re-procesamiento por 90 días.
- **`hub`:** Columna R. Hub temático del post: `Salud` / `Alimentación` / `Razas` / `Mundo`. Asignada en Sprint 3 (2026-05-04). Usada por WF9 para agrupar clusters por pilar.
- **`cluster_parent`:** Columna S. Slug del pilar correspondiente: `guia-salud-felina` / `guia-alimentacion-gatos` / `guia-razas-gatos` / `guia-comportamiento-felino`. Permite que WF9 sepa a qué pilar enlazar cada cluster.
- **Fuente de verdad dual:** actúa como disparador de entrada (filas "Aprobado") e índice de posts publicados (filas "Publicado") para el check de canibalismo y contexto de enlaces internos
- **Populated:** ✅ 188 keywords clasificadas en 4 hubs (Sprint 3, 2026-05-04): Salud 67 · Mundo 72 · Razas 32 · Alimentación 17. Distribución original: 106 existentes + 4 publicadas + 27 nuevas + 10 estacionales + ideas de WF5 acumuladas.

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
- **Formato imagen:** 16:9 — **NO usar** `generationConfig.aspectRatio` (Gemini 2.5 Flash Image NO lo soporta y rechaza con 400). **Forma correcta:** reforzar `"16:9 horizontal cinematic widescreen aspect ratio"` directamente en el prompt de texto (ver WF6 wf6-007 como referencia).

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
| 14 | **`/razas-de-gatos/razas-de-gatos/` post huérfano con redirect mal apuntado** (WP `redirect_canonical()` automático lo mandaba a `razas-que-no-sueltan-pelo`) | Regla en `.htaccess` (raíz `public_html/`) ANTES del bloque WordPress: `RewriteRule ^razas-de-gatos/razas-de-gatos/?$ /razas-de-gatos/ [R=301,L]` — apunta a la categoría WP. `.htaccess` tiene precedencia sobre `redirect_canonical()` | ✅ Resuelto (2026-05-05) |

### BLOQUE C — Estrategia de Contenido: Integrar al pipeline desde el inicio

| # | Oportunidad perdida | Acción en el pipeline |
|---|--------------------|-----------------------|
| 10 | **WooCommerce sin funnel editorial** — la tienda tiene productos activos ($49k–$270k COP) pero ningún post enlaza a ellos | En posts de Alimentación y Salud, incluir CTA hacia productos relevantes de la tienda como parte del template GPT-4o |
| 11 | **Contenido estacional ausente** — Halloween, Navidad, Día del Animal (4 oct), Día Internacional del Gato (8 ago) no tienen piezas | Priorizar estas keywords en la Master Sheet con flag `estacional` para producir con anticipación de 2 semanas |
| 12 | **Intención transaccional local sin cubrir** — "cuánto cuesta esterilizar un gato Colombia", "veterinario a domicilio gatos" | Incluir modificador de país/ciudad en las keywords de la sheet para capturar tráfico de alta conversión |
| 13 | **106 posts existentes con potencial de re-optimización rápida** — muchos ya están indexados en posiciones 6–20 | Fase D (GSC) priorizará estos posts para mejoras de título y meta que empujen a página 1 con mínimo esfuerzo |

### Score de Salud Digital

| Dimensión | Score Inicial | Score 2026-05-07 | Target a 90 días |
|-----------|--------------|------------------|-----------------|
| Volumen de contenido | 8/10 | 9/10 | 10/10 |
| Calidad técnica SEO | 4/10 | 8/10 | 8/10 |
| Experiencia de usuario | 5/10 | 7/10 | 9/10 |
| Actividad editorial | 1/10 | 8/10 | 8/10 |
| Presencia en redes | 2/10 | 4/10 | 7/10 |
| Monetización (funnel + AdSense) | 5/10 | 8/10 | 8/10 |
| **Global** | **4.2/10** | **7.5/10** | **8.4/10** |

**Avances 2026-05-07** (sesión AdSense optimization):
- **Monetización +3:** AdSense reconfigurado de Auto Ads a 4 slots manuales optimizados (in-article 1, in-article 2, sidebar sticky, pre-FAQ), brand safety con 11 categorías sensibles bloqueadas, banner GDPR Funding Choices configurado con botones Accept/Reject/Manage, 4 páginas legales completas (Privacy + Términos + Aviso Legal + Cookies) cubriendo Ley 1581 + GDPR + ePrivacy. Layout sidebar de Astra activado (Personalizar → Post Types → Posts → Right Sidebar) → habilita slot lateral (slot `7324202730` ya inyectando). Detalle completo en [`_config/adsense/SETUP_COMPLETO.md`](_config/adsense/SETUP_COMPLETO.md).
- **UX +2:** ads con etiqueta "Publicidad", lazy loading nativo de Google (`data-loading-strategy="lazy"`), bordes sutiles, sticky desktop only.
- **Calidad técnica SEO +4:** sumando Sprint 1+2 AEO + páginas legales (señal E-E-A-T para Google).

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
├── _aeo/                              ← Answer Engine Optimization deliverables
│   └── sprint-1/
│       ├── llms.txt                   ← desplegado en bigotesfelinos.com/llms.txt
│       └── equipo-editorial.html       ← desplegado como page ID 2673
└── _recursos/                         ← Recursos interactivos publicados (calculadoras, quizzes, herramientas)
    └── calculadora-costo-anual-gato/  ← Page ID 2878 — costo anual gato Colombia 2026
        ├── calculadora.html            ← bloque HTML+CSS+JS minificado, copy-paste-ready
        ├── post.md                     ← contenido editorial (markdown, 1.080 palabras)
        ├── outreach.md                 ← 30 destinatarios + plantilla pitch + plan social + keywords
        ├── schema.md                   ← JSON-LD WebApplication+FAQPage+Article con justificación
        ├── build-workflow.js           ← genera page-content.html y page-meta.json desde fuentes
        ├── workflow-builder.js         ← genera workflow.json (definición n8n del Publish utility)
        └── webhook-payload.json        ← payload de invocación (no commitear si tiene secrets)
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

## Estado del Pipeline (2026-05-07 — Primera page interactiva publicada)

**AEO Sprint 1+2+3+4 desplegados + cuota Colombia + WF1 anti-canibalismo v2 + 2 nuevos WF-Util (Publish/Update Interactive Page) + primera calculadora interactiva en producción (page ID 2878).** Pipeline omnicanal completo con sistema de hubs/pilares y ahora con capacidad de publicar widgets interactivos versionados desde repo.

**Anti-canibalismo v2 (desplegado 2026-05-05):**
- bf-node-017 reescrito: Jaccard kw threshold bajado 50% → 35% + nuevo Jaccard slug ≥60% + stemming básico (plurales/diminutivos)
- 3 nuevos nodos antes del Internal Linker: `Slug Pre-Check WP` + `Slug Conflict Eval` + `IF Slug Conflict` — consultan WP REST API antes de publicar para detectar slugs ya existentes (previene `-2`)
- bf-node-003b con bypass: ejecuciones manuales (`$execution.mode !== 'trigger'`) saltan filtro de día L/M/V
- Llamar nano banana con `retryOnFail: 3 tries, 5s` para fallos HTTP transitorios
- Preparar Imagen con guard explícito para `finishReason: NO_IMAGE` (Gemini rechazos)
- Limpieza Sheet 188 → 154 filas (eliminados 26 duplicados Pendientes + 8 perdedores tras audit GSC)
- Validado E2E en producción: post `comida-para-gatos-colombia-marcas` publicado el 2026-05-05

**Sprint 3 (clusters + pilares, desplegado 2026-05-04):**
- 188 keywords clasificadas en 4 hubs temáticos (cols R `hub` y S `cluster_parent` en hoja Blog)
- 4 páginas pilar publicadas en WP (pages, no posts) con stack AEO completo
- WF6 generador de pilares (manual, on-demand) — ya cumplió su rol inicial
- WF9 sincronizador diario — refresca enlaces internos cluster ↔ pilar todos los días a las 8:30am

**Stack AEO en cada artículo nuevo** (WF1, WF3): respuesta directa citable por IAs, key takeaways como blockquote, tabla obligatoria (HARD GATE), bloque de Fuentes consultadas con 3-5 referencias **(whitelist estricta de 7 organizaciones)**, schemas JSON-LD múltiples (FAQPage + WebPage con Speakable + mentions de entidades canónicas Wikipedia + HowTo condicional), H2/H3 obligatoriamente question-first, Quality Gate 18 checks/120 puntos.

**WF7 (AEO Monitor)** corre los lunes 9am Colombia y registra en hoja `AEO_Tracking` cuántas keywords citan a Bigotes Felinos en Google AI Overview. WF1 Telegram ahora incluye **deeplink a GSC URL Inspection** para solicitar indexación con un click.

**WF8 (Bulk AEO Migrator)** activo: 10 posts viejos migrados con AEO completo. ~120 pendientes (~12 runs más, 1/semana).

**Baseline AEO Monitor 4 may:** 0/17 citas reales con AIO. **Análisis competitivo:** YouTube/TikTok dominan (~50% de citaciones), Tiendanimal/Purina/Hill's marcan retailers/marcas, queries colombianas locales tienen gap (sólo aseguradoras/marketplaces compiten ahí — ventana abierta para BF). Ver sección **AEO upgrades** más abajo para detalle.

### WF1 — Blog SEO: `BF - WF1 - Blog SEO: Keyword → Publicar en WordPress`
- **ID n8n:** `IVKelNHLoEaWD92B`
- **Nodos totales:** 36 (sumados 3 del slug pre-check WP el 2026-05-05)
- **Estado:** ✅ Funcional y en producción — artículos publicados L/M/V 8am Colombia
- **Trigger:** Diario a las 8am Colombia (`0 13 * * *`) — lógica L/M/V delegada a bf-node-003b
- **Anti-canibalismo v2:** Capa 1 (bf-node-017) Jaccard kw≥35% / slug≥60% con stem; Capa 2 (bf-node-006sg/sgc/sgi) consulta WP `/posts?slug=` para detectar slug ya existente

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| bf-node-001 | Schedule Trigger | Dispara diariamente a las 8am Colombia (`0 13 * * *`) — lógica L/M/V delegada a bf-node-003b | ✅ |
| bf-node-s1 | Leer Estacionales Pendientes | Lee Sheet filtrando `estado="Pendiente"` — busca con `fecha_objetivo` próxima | ✅ |
| bf-node-s2 | Verificar Estacional Urgente | Code (`runOnceForAllItems`): detecta si hay keyword con `fecha_objetivo` en los próximos 14 días | ✅ |
| bf-node-s3 | IF Estacional Urgente | IF `$json.found === true` → rama de priorización estacional | ✅ |
| bf-node-s4 | Activar Estacional en Sheet | HTTP PUT a Sheets API → cambia `estado` de la keyword estacional a `"Aprobado"` | ✅ |
| bf-node-002 | Leer Keywords Aprobadas | Lee Sheet filtrando `estado="Aprobado"` | ✅ |
| bf-node-003 | Hay keyword | IF: ¿hay keyword para procesar? | ✅ |
| bf-node-003b | Tomar Primera Keyword | Code: toma la primera keyword; estacionales publican cualquier día; regulares solo L/M/V en cron real; **bypass de día si `$execution.mode !== 'trigger'`** (manual/test desde UI siempre procesa) | ✅ |
| bf-node-016 | Leer Posts Publicados | Lee Sheet filtrando `estado="Publicado"` | ✅ |
| bf-node-017 | Formatear Posts Publicados | Check canibalismo dual: Jaccard kw≥35% + Jaccard slug (extraído de URL)≥60%, con stem básico (plurales/diminutivos: gatos→gato, gatito→gato). Emite `match_reason` (kw_NNpct/slug_NNpct). Formatea contexto para GPT | ✅ |
| bf-node-018 | IF Canibalismo | Bifurca si hay o no canibalismo | ✅ |
| bf-node-019 | Marcar Canibalismo en Sheet | Actualiza Sheet: "Canibalismo" + URL del similar. Lee `$json.similar_url` directamente (sirve para canibalismo de kw/slug O de slug pre-check WP) | ✅ |
| bf-node-004 | Marcar En Proceso | Actualiza Sheet: "En proceso" | ✅ |
| bf-node-023 | Construir Body GPT | Serializa prompt + contexto de posts con `JSON.stringify` para evitar caracteres especiales | ✅ |
| bf-node-005 | Generar Articulo GPT-4o | Llama OpenAI con `gpt_body_json` pre-serializado | ✅ |
| bf-node-006 | Parsear JSON articulo | Slug, capitalización, FAQ HTML + FAQPage JSON-LD, `wp_body_json`, strip4Byte. **Emite `slug` en root** del json (además de dentro de `wp_body_json`) para el slug pre-check WP | ✅ |
| bf-node-006sg | Slug Pre-Check WP | HTTP GET `/wp-json/wp/v2/posts?slug={slug}` con `alwaysOutputData: true` (necesario porque WP devuelve `[]` cuando no hay match) | ✅ |
| bf-node-006sgc | Slug Conflict Eval | Code: evalúa respuesta WP. Si match exacto → emite `cannibalism: true` con datos del post existente. Si no → propaga el item original con `slug_check_passed: true` | ✅ |
| bf-node-006sgi | IF Slug Conflict | IF `cannibalism === true`: TRUE → bf-node-019 (Marcar Canibalismo); FALSE → Internal Linker (continúa flujo normal) | ✅ |
| bf-node-010 | Llamar nano banana | Genera imagen 16:9 vía Gemini. `retryOnFail: 3 tries, 5s entre tries` para fallos HTTP transitorios | ✅ |
| bf-node-011 | Preparar Imagen | Convierte base64 → Buffer binario. **Guard explícito**: si `finishReason !== 'STOP'` o `content.parts` ausente (NO_IMAGE rejection de Gemini) → throw Error claro pidiendo re-aprobar la kw | ✅ |
| bf-node-012 | Subir a WP Media | Sube imagen a WordPress Media Library | ✅ |
| bf-node-015 | Set Alt Text Imagen | Asigna alt text (keyword) al media item | ✅ |
| bf-node-013 | Construir wp_body_final | Añade `featured_media` al payload | ✅ |
| bf-node-007 | Publicar en WordPress | Publica post con todos los campos SEO | ✅ |
| bf-node-008 | Actualizar Sheet Publicado | batchUpdate: columna B (Publicado) + H (url) + M (fecha_reoptimizado en timezone Colombia) — el M previene que WF8 Bulk reprocese posts recién publicados | ✅ |
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
- **Trigger:** Manual (fd-001) + Mensual automático (fd-001c, cron `0 8 1 * *` con `timezone: America/Bogota` = día 1 de cada mes a las 8am Colombia) — ambos conectados al mismo nodo de entrada
- **Notificación "Sin candidatos":** fd-004 emite `{no_candidates: true}` cuando no hay posts a re-optimizar → fd-004b (IF) bifurca: TRUE → fd-015 (Telegram aviso) · FALSE → fd-004c (Guard) → procesamiento normal. El Guard filtra el sentinel para evitar ghost items en `executionOrder: v1`.
- **Internal Linker WF3 (fd-008b)** + **Quality Gate WF3 (fd-008c)**: insertados entre fd-008 (Parsear) y fd-009 (WordPress PATCH Post). Mismas reglas que en WF1 — Linker valida URLs alucinadas y suplementa hasta 2 enlaces internos reales; Gate aplica 15 checks ponderados con threshold 70 y throw Error con breakdown si falla.
- **Prompt fd-006 refactored:** sistema con Vet-Friend reforzado, frases prohibidas, mini-historias obligatorias, AI Search rule. Schema GPT incluye `respuesta_directa` y `key_takeaways[]`. Parser fd-008 inyecta ambos en el HTML re-optimizado igual que WF1.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| fd-001 | Manual Trigger | Permite ejecución manual desde la UI de n8n | ✅ |
| fd-001c | Schedule Trigger Mensual | Cron `0 8 1 * *` con timezone Bogotá (1° de cada mes, 8am Colombia) | ✅ |
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

### WF7 — AEO Monitor: `BF - WF7 - AEO Monitor: Detectar citas en Google AI Overview`
- **ID n8n:** `73UFpj4m2vke6IPk`
- **Nodos totales:** 12
- **Estado:** ✅ Activo — Schedule semanal lunes 9am Colombia
- **Trigger:** Schedule `0 9 * * 1` (lunes 9am hora Colombia, porque `settings.timezone: America/Bogota` interpreta el cron en hora local) + Manual Trigger
- **Hoja:** Append a `AEO_Tracking!A:H` del Master Sheet (creada 4 may)

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| aeo-001 | Schedule Trigger Lunes 9am | Cron `0 14 * * 1` (lunes 9am Colombia) | ✅ |
| aeo-001b | Manual Trigger | Test/recovery manual | ✅ |
| aeo-002 | Leer Master Sheet | HTTP GET `Blog!A:M` con cred googleSheetsOAuth2Api `70heM3IFsNK9Cyak` | ✅ |
| aeo-003 | Pick Top 20 Keywords | Code `runOnceForAllItems`: filtra estado=Publicado + url_post + length≤55 + sin `:` ni "guía completa" → orden por prioridad Alta→Media→Baja, luego por posicion_gsc ASC → top 20 | ✅ |
| aeo-004 | SerpAPI Query | HTTP GET `engine=google&q={kw}&gl=co&hl=es&num=10` con cred serpApi `44hTDtjkVRDKJOeU`. Devuelve `ai_overview.page_token` cuando hay AIO | ✅ |
| aeo-004b | SerpAPI Async Fetch | HTTP GET `engine=google_ai_overview&page_token={...}` para obtener el contenido real del AIO (Google lo entrega async). `continueOnFail: true` | ✅ |
| aeo-005 | Parse AI Overview | Code `runOnceForEachItem`: detecta `search_information.ai_overview_state="Fully empty"`, parsea `references[]`, busca `bigotesfelinos.com`, extrae top 3 competitors | ✅ |
| aeo-006 | Aggregate Results | Code `runOnceForAllItems`: cuenta citados/total/sin_AIO, build sheet payload + Telegram summary | ✅ |
| aeo-007 | Append AEO_Tracking | HTTP POST `AEO_Tracking!A:H:append` (todas las filas en un batch) | ✅ |
| aeo-008 | Telegram Resumen Semanal | Mensaje formato Markdown con citados/with_aio/total + lista de keywords citadas | ✅ |
| aeo-009 | Error Trigger | Captura errores no controlados | ✅ |
| aeo-010 | Telegram Error AEO | Notifica fase + detalle al chat `1591872862` | ✅ |

**Costo SerpAPI:** ~80 credits/mes (20 keywords × 2 calls × 4 sem). Plan free 100/mes — suficiente con margen 20%.

**Baseline 4 may (primer test):** 0/14 keywords citadas, 14 con AIO real, 6 sin AIO. Sprint 4 está específicamente diseñado para detectar movimiento desde este 0 → primera cita en algún momento como evidencia de impacto del stack AEO.

---

### WF8 — Bulk AEO Migrator: `BF - WF8 - Bulk AEO Migrator: AEO en posts existentes (sin GSC)`
- **ID n8n:** `vB8ya9OSUyLsQuLg` (importado 2026-05-04 21:33 UTC)
- **Nodos totales:** 23
- **Estado:** ✅ En producción — primera batch de 10 posts migrados exitosamente. ~120 posts pendientes (~12 runs más).
- **Rate limit batching (`GPT-4o Optimizar Artículo`):** `batchSize: 1, batchInterval: 25000` (25s entre items). Necesario porque OpenAI Tier 1 = 30K TPM y cada request consume ~9.300 tokens (prompt+max_tokens reservado). 10 items × 25s ≈ 4 min runtime. Mismo patch aplicado a WF3.
- **Patches WF8 vs WF3 originales (aplicados 2026-05-04 PM tras 1er fail):**
  - **Quality Gate más permisivo** que WF1/WF3 — HARD GATE de tabla **removido** (posts narrativos/Q&A no siempre admiten tabla); threshold bajado **70 → 60**. Razón: el catálogo histórico tiene artículos más cortos y de formatos variados; ser estrictos haría que la mayoría falle. Para artículos NUEVOS (WF1) y re-optimizaciones SEO (WF3) el rigor original se mantiene.
  - **Regex `^<p>` → `^<p[^>]*>`** para detectar correctamente `<p class="respuesta-directa">` en el chequeo de Respuesta directa. Bug pre-existente; corregido aquí.
  - **Prompt fd-006: "TABLA OBLIGATORIA" → "TABLA RECOMENDADA cuando aplique"** para no forzar tablas artificiales en contenido narrativo.
- **JSON fuente:** [`_aeo/sprint-4/WF8_Bulk_AEO_Migrator.json`](_aeo/sprint-4/WF8_Bulk_AEO_Migrator.json) (versionado en repo)
- **Trigger:** Manual Trigger ÚNICAMENTE (sin schedule). El usuario ejecuta cuando quiere procesar el siguiente batch.
- **Diferencia clave con WF3:** WF8 ignora GSC. Procesa posts ordenados cronológicamente (row_number ASC) cuya `fecha_reoptimizado` esté vacía. Esto permite migrar AEO a TODO el catálogo histórico sin esperar a que ganen posición en GSC.
- **Cobertura:** 130 posts × 10 por run = 13 runs para migrar todo. Costo ~$3 GPT-4o por run = ~$30 total.
- **Cadencia recomendada:** 1 run/semana o más espaciado, decisión del usuario.
- **Interacción con WF3:** WF8 escribe en Blog!M (`fecha_reoptimizado`) → WF3 ve el post como "ya re-optimizado" y respeta el bloqueo de 90 días. Después de 90 días si tiene mal posicionamiento GSC, WF3 puede tomarlo. **Concertación limpia.**
- **Reusa lógica de WF3:** mismo prompt (fd-006), mismo parser (fd-008) con scrubAIWatermarks + buildSpeakableJsonLD + buildHowToJsonLD + Internal Linker + Quality Gate. Solo cambia el filtro de candidatos (fd-004 reemplazado).
- **Pendiente activación:** importar JSON, asignar credenciales (las mismas de WF3 — Sheets, WP, OpenAI, Telegram), test manual con 10 posts, escalar.

---

### WF6 — Pillar Generator: `BF - WF6 - Pillar Generator: Crear Página Pilar por Hub`
- **ID n8n:** `cE3mJkzcKmJrWg4z`
- **Nodos totales:** 17
- **Estado:** ✅ Activo (manual). Ya generó los 4 pilares iniciales el 2026-05-04. Queda dormido hasta que se decida regenerar uno o crear un 5to hub.
- **Trigger:** Manual ÚNICAMENTE
- **Output:** Página WP (no post) con stack AEO completo + featured image. Status `publish` directo.
- **Selección de hub:** Constante `HUB_SELECCIONADO` editable en el Code node `wf6-002 Definir Hub`. Valores válidos: `'Salud'`, `'Alimentación'`, `'Razas'`, `'Mundo'`. El usuario edita la línea, guarda, ejecuta.
- **Ya publicado (4 pilares):**
  - Salud → page ID 2700 → https://bigotesfelinos.com/guia-salud-felina/
  - Alimentación → page ID 2702 → https://bigotesfelinos.com/guia-alimentacion-gatos/
  - Razas → page ID 2704 → https://bigotesfelinos.com/guia-razas-gatos/
  - Mundo → page ID 2706 → https://bigotesfelinos.com/guia-comportamiento-felino/
- **Salvaguarda imagen:** nodo `wf6-008 Llamar nano banana` tiene `retryOnFail: true, maxTries: 3, waitBetweenTries: 2000ms` + `onError: continueRegularOutput`. Si Gemini falla 3 veces, el pilar se publica **sin imagen destacada** y Telegram avisa para añadirla manualmente. **Nunca se pierde el contenido GPT.**
- **Fix slug attachment vs page:** `image_filename` usa prefijo `pilar-img-{slug}.webp` (no solo `{slug}.webp`) para evitar que el slug del attachment ocupe el slug de la page. Lección aprendida cuando los 4 pilares iniciales se publicaron como `/guia-salud-felina-2/` (con `-2` añadido por WP) — corregido manualmente vía PATCH y workflow utility (ya eliminado).
- **Sentence case rule:** los títulos en `wf6-002` están en sentence case (solo primera letra mayúscula + nombres propios). El prompt (`wf6-005`) tiene regla #3 explícita pidiendo a GPT mantener sentence case en H2/H3. Parser (`wf6-007`) tiene función `headingsToSentenceCase()` defensiva que normaliza H2-H6 si GPT genera Title Case (preserva nombres propios: Colombia, Bogotá, WSAVA, Royal Canin, Bigotes Felinos, etc.).

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| wf6-001 | Manual Trigger | Ejecución manual desde UI | ✅ |
| wf6-002 | Definir Hub | Code: `HUB_SELECCIONADO` editable; mapea a slug, título, seo_title, descripción, prompt imagen | ✅ |
| wf6-003 | Leer Blog Sheet | HTTP GET `Blog!A:S` (incluye col R = hub) | ✅ |
| wf6-004 | Filtrar Clusters del Hub | Code: filtra publicados con `hub === ctx.hub`. Devuelve lista de clusters publicados + pendientes para enriquecer el prompt GPT | ✅ |
| wf6-005 | Construir Prompt GPT | Code: prompt extenso con reglas SEO+AEO, tabla obligatoria, sentence case, frases prohibidas, JSON schema esperado | ✅ |
| wf6-006 | GPT-4o Generar Pilar | HTTP POST OpenAI `max_tokens: 12000, timeout: 180s`. Devuelve respuesta_directa, key_takeaways, intro_html, secciones_html, tabla_html, faq_items, fuentes_consultadas, entities, prompt_imagen | ✅ |
| wf6-007 | Parsear y Construir HTML | Code: scrubAIWatermarks, strip4Byte, headingsToSentenceCase, FAQ HTML + FAQPage JSON-LD, fuentes HTML, CollectionPage+Speakable+mentions JSON-LD. Valida tabla (HARD GATE), FAQ ≥5, fuentes ≥3 | ✅ |
| wf6-008 | Llamar nano banana | HTTP POST Gemini con retry 3x | ✅ |
| wf6-009 | Detectar Imagen Disponible | Code: si la respuesta tiene imagen → image_available=true + binary buffer; si falla → image_available=false (publica sin imagen) | ✅ |
| wf6-010 | IF Imagen Disponible | Bifurca: TRUE → upload+alt; FALSE → directo a build wp_body | ✅ |
| wf6-011 | Subir a WP Media | HTTP POST WP Media | ✅ |
| wf6-012 | Set Alt Text Imagen | HTTP POST WP Media `{id}` con alt_text=título | ✅ |
| wf6-013 | Construir wp_body_final | Code: añade featured_media si hubo imagen, mantiene null si no | ✅ |
| wf6-014 | Publicar Pilar como Page WP | HTTP POST `/wp-json/wp/v2/pages` (NO `/posts`) | ✅ |
| wf6-015 | Telegram Notificar Éxito | Mensaje con stats: palabras, FAQ, fuentes, entities, internal links, status imagen | ✅ |
| wf6-016 | Error Trigger | Captura excepciones | ✅ |
| wf6-017 | Telegram Error | Notifica error al chat | ✅ |

---

### WF9 — Pilares Auto-Sync: `BF - WF9 - Pilares Auto-Sync (cluster injection diaria)`
- **ID n8n:** `XvMhI97WVqj49U9f`
- **Nodos totales:** 11
- **Estado:** ✅ Activo — backfill inicial ejecutado 2026-05-04 (~129 clusters distribuidos). Auto-refresh diario.
- **Trigger:** Manual + Schedule Trigger Diario (cron `30 8 * * *` con `timezone: America/Bogota` = 8:30am Colombia local)
- **Idempotencia:** strippea cualquier `<section class="cluster-list">` previa antes de regenerar. Re-ejecutar 100 veces da el mismo resultado.
- **Costo:** $0 GPT (no usa GPT). Solo 4 GET + 4 PATCH al WP por ejecución.
- **Por qué 8:30am:** 30 min después de WF1 (que publica clusters a las 8am L/M/V). Un cluster nuevo aparece en su pilar máximo 25 horas después.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| wf9-001 | Manual Trigger | Ejecución manual a demanda | ✅ |
| wf9-001b | Schedule Trigger Diario | Cron `30 8 * * *` con timezone Bogotá = 8:30am Colombia local | ✅ |
| wf9-002 | Leer Blog Sheet | HTTP GET `Blog!A:S` | ✅ |
| wf9-003 | Agrupar Clusters por Hub | Code: filtra `estado=Publicado` con `url_post` válido y `hub` asignado. Agrupa en 4 items (uno por hub) con array de clusters | ✅ |
| wf9-004 | GET Pilar por Slug | HTTP GET `/wp-json/wp/v2/pages?slug={pilar_slug}&context=edit` para obtener `content.raw` | ✅ |
| wf9-005 | Construir HTML Inyectado | Code (`runOnceForEachItem`): regenera `<section class="cluster-list">` con todos los clusters del hub. Inserta antes del primer `<script>` JSON-LD para preservar schemas. Idempotente. | ✅ |
| wf9-006 | PATCH Pilar | HTTP POST `/wp-json/wp/v2/pages/{id}` con nuevo content | ✅ |
| wf9-007 | Resumen Final | Code: agrega resultados de los 4 hubs en mensaje Markdown | ✅ |
| wf9-008 | Telegram Notificar | Mensaje resumen con cluster_count por hub | ✅ |
| wf9-009 | Error Trigger | Captura excepciones | ✅ |
| wf9-010 | Telegram Error | Notifica error al chat | ✅ |

**Mapeo Hub → Pilar (hardcoded en wf9-003):**
| Hub | Slug | Título sección |
|-----|------|----------------|
| Salud | `guia-salud-felina` | "Más artículos sobre salud felina" |
| Alimentación | `guia-alimentacion-gatos` | "Más artículos sobre alimentación felina" |
| Razas | `guia-razas-gatos` | "Más artículos sobre razas de gatos" |
| Mundo | `guia-comportamiento-felino` | "Más artículos sobre comportamiento felino" |

---

### WF11 — GSC Weekly Dashboard: `BF - WF11 - GSC Weekly Dashboard`
- **ID n8n:** `luUL1h3EVmzeUFCQ`
- **Nodos totales:** 10
- **Estado:** ✅ Activo — primer reporte ejecutado 2026-05-05 (sem 27 abr - 3 may)
- **Trigger:** Schedule lunes 9am Colombia (cron `0 9 * * 1` con `timezone: America/Bogota`) + Manual Trigger
- **Costo:** $0 — solo GSC API + Sheets, sin GPT
- **Hojas escritas:** `GSC_Tracking` (snapshot semanal sitewide) y `GSC_Pages_Tracking` (top 30 páginas con Δ pos vs sem anterior)

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| wf11-001 | Schedule Lunes 9am | Cron `0 9 * * 1` con timezone Bogotá | ✅ |
| wf11-001b | Manual Trigger | Test/recovery manual | ✅ |
| wf11-002 | Build Queries | Code: emite 6 query items (last_7d_total, prior_7d_total, last_28d_total, top_pages_7d, top_pages_prior, top_queries_7d) | ✅ |
| wf11-003 | GSC Query | HTTP POST a GSC searchAnalytics, una request por query item con cred `googleOAuth2Api` (XWbfIBmitmx1uByl) | ✅ |
| wf11-004 | Aggregate Snapshot | Code: agrega responses, computa WoW deltas, top 3 ganadores/perdedores por Δ pos, top queries semana, alerta concentración (>25% de imp en 1 página). Genera telegram_message + payloads para Sheets | ✅ |
| wf11-005 | Append GSC_Tracking | HTTP POST `values:append` con 1 fila: sem_inicio, sem_fin, impresiones, clicks, ctr, pos_promedio, deltas | ✅ |
| wf11-006 | Append GSC_Pages_Tracking | HTTP POST `values:append` con top 30 páginas: sem_inicio, url, imp, clk, ctr, pos, delta_pos_vs_prev, delta_clicks_vs_prev | ✅ |
| wf11-007 | Telegram Weekly Report | Mensaje Markdown al chat `1591872862` | ✅ |
| wf11-008 | Error Trigger | Captura excepciones | ✅ |
| wf11-009 | Telegram Error | Notifica error al chat | ✅ |

**Estructura del mensaje Telegram (formato real del primer reporte):**

```
📊 GSC Weekly — 2026-04-27 a 2026-05-03

WoW (vs sem anterior):
   Impresiones: 523 → 393 (-25%)
   Clicks: 1 → 1 (+0)
   CTR: 0.19% → 0.25%
   Pos avg: 62.4 → 58.7 (+3.7)

Últimos 28d (contexto): 2003 imp, 2 clk, pos 61.5

🏆 Top ganadores (Δ pos): ...
🔻 Top perdedores: ...
🆕 Top queries semana: ...
⚠️ Concentración: top page 27% de impresiones (...)
```

**Hojas creadas (2026-05-05) en Master Sheet:**
- `GSC_Tracking` — columnas A-I: `sem_inicio | sem_fin | impresiones | clicks | ctr | pos_promedio | delta_impresiones | delta_clicks | delta_pos`
- `GSC_Pages_Tracking` — columnas A-H: `sem_inicio | url | impresiones | clicks | ctr | pos | delta_pos_vs_prev | delta_clicks_vs_prev`

**Análisis de gráficos:** Las hojas son fuente para gráficos nativos de Google Sheets (Insertar → Gráfico → Línea). No requiere dashboard externo.

---

### WF-Util — Force Re-optimize Post: `BF - WF-Util - Force Re-optimize Post`
- **ID n8n:** `gu2XtRkhfEVDsyai`
- **Nodos totales:** 22
- **Estado:** ✅ Activo — primera ejecución exitosa 2026-05-05 sobre post DPL (233): score 100/120
- **Trigger:** Webhook POST `/force-reopt-post` con body `{"post_id": <num>, "keyword": "<override opcional>"}`
- **Propósito:** Re-optimizar UN post específico a demanda con el stack AEO completo (mismo prompt + parser + Linker + Quality Gate de WF3), saltando los filtros GSC y el bloqueo de 90d. Útil cuando un post está cerca de top 10 y queremos empujarlo manualmente, o cuando WF3 dejó de tomarlo por bloqueo de fecha_reoptimizado.
- **Diferencia con WF3:** WF3 procesa N posts elegidos por GSC (pos 6-50, ≥5 imp, sin bloqueo 90d). WF-Util procesa 1 post arbitrario por ID, sin filtros.
- **Concertación con WF3:** Al actualizar `fecha_reoptimizado` en Blog!M, WF-Util "consume" el bloqueo de 90d. Si el post sigue mal posicionado después, WF3 lo retomará en 90 días.
- **Keyword override:** El Master Sheet a veces tiene títulos completos como "keyword" en posts viejos del catálogo (ej: "Raza DPL en gatos: Características, origen y cuidados clave"). El parámetro `keyword` del webhook permite forzar la keyword SEO real (ej: "raza dpl en gatos") sin tener que editar el Sheet.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| fwf-001 | Webhook Force Reopt | POST `/force-reopt-post` con `{post_id, keyword?}` | ✅ |
| fwf-002 | Validate Input | Code: valida post_id numérico + extrae keyword_override opcional | ✅ |
| fwf-003 | WP GET Post | HTTP GET `/wp-json/wp/v2/posts/{id}?context=edit` con cred `wordpressApi` | ✅ |
| fwf-004 | Read Master Sheet | HTTP GET `Blog!A:M` con cred `googleSheetsOAuth2Api` (70heM3IFsNK9Cyak) — NO con `googleOAuth2Api` (esa es para GSC) | ✅ |
| fwf-005 | Leer Posts Publicados | Code: parsea Sheet response, emite 1 item por fila Publicado para contexto de enlaces internos. **Nombre obligatorio** porque fd-006 reutilizado lo referencia con `$('Leer Posts Publicados').all()` | ✅ |
| fwf-006 | Build Single Candidate | Code: cruza WP post con Sheet para encontrar la fila por url match (link o slug), aplica keyword_override si fue provisto, emite 1 candidato con shape esperado por fd-006 | ✅ |
| fwf-007 | Construir Prompt GPT Refresh | Code (verbatim de fd-006 WF3): mismo prompt completo Vet-Friend + AEO + tabla + question-first + entities + fuentes 7-whitelist | ✅ |
| fwf-008 | GPT-4o Optimizar Artículo | HTTP POST OpenAI gpt-4o (sin batching — 1 item) | ✅ |
| fwf-009 | Parsear Respuesta GPT | Code (verbatim de fd-008 WF3): scrubAIWatermarks + strip4Byte + FAQ HTML + JSON-LD + Speakable + HowTo condicional + headings sentence case + question marks auto | ✅ |
| fwf-010 | Internal Linker WF3 | Code (verbatim de fd-008b): valida URLs alucinadas + inyecta hasta 2 enlaces internos reales | ✅ |
| fwf-011 | Quality Gate WF3 | Code (verbatim de fd-008c): 18 checks /120, threshold 70, HARD GATE para tabla | ✅ |
| fwf-012 | WordPress PATCH Post | HTTP PATCH `/wp-json/wp/v2/posts/{id}` con content + meta Yoast | ✅ |
| fwf-013 | Sheet Update fecha_reoptimizado | HTTP `values:batchUpdate` Blog!J + Blog!M con cred `googleSheetsOAuth2Api` | ✅ |
| fwf-014..017 | Tags chain | Split → POST tag → Collect IDs → Asignar (mismo patrón de WF3) | ✅ |
| fwf-018 | Build Telegram Message | Code: arma resumen con score + Δ links + GSC inspection deeplink | ✅ |
| fwf-019 | Telegram Notificar Éxito | Mensaje Markdown al chat | ✅ |
| fwf-020 | Respond Success | Devuelve `summary` JSON al webhook caller | ✅ |
| fwf-021 | Error Trigger | Captura excepciones | ✅ |
| fwf-022 | Telegram Notificar Error | Notifica fase + detalle al chat | ✅ |

**Cómo invocarlo:**

```bash
curl -X POST "https://n8n.srv1398596.hstgr.cloud/webhook/force-reopt-post" \
  -H "Content-Type: application/json" \
  -d '{"post_id": 233, "keyword": "raza dpl en gatos"}'
```

Respuesta: `{"post_id":"233","keyword":"raza dpl en gatos","score":100,"url":"..."}`. Telegram también notifica.

**Costo:** ~1× GPT-4o request (~$0.05 por ejecución). Sin batching porque procesa 1 item.

---

### WF-Util — Publish Interactive Page: `BF - WF-Util - Publish Interactive Page (Calculadora)`
- **ID n8n:** `bWYAwFDRlU7bIYRH`
- **Nodos totales:** 9
- **Estado:** ✅ Activo — primera ejecución 2026-05-07 publicó la calculadora del costo anual de gatos en Colombia (page ID 2878)
- **Trigger:** Webhook POST `/publish-calc-bf` con body `{title, slug, content, excerpt, yoast_title, yoast_metadesc, yoast_focuskw, image_prompt, image_filename}`
- **Propósito:** Pipeline end-to-end para publicar una **page WP** (no post) con widget interactivo embebido, imagen destacada generada por nano banana, alt text, Yoast meta y notificación Telegram. Reutilizable para futuras herramientas (calculadoras, quizzes, comparadores).
- **Diferencia con WF6 (Pillar Generator):** WF6 genera contenido vía GPT-4o on-demand para hubs temáticos; WF-Util-Publish recibe el contenido pre-fabricado vía webhook (sin GPT) y solo se encarga del pipeline de publicación. Útil cuando el contenido está versionado en repo y el editor humano lo prepara fuera de n8n.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| wfp-001 | Webhook | POST `/publish-calc-bf` con payload completo en body | ✅ |
| wfp-002 | Generate Image | HTTP POST nano banana con `$json.body.image_prompt`, retry 3x | ✅ |
| wfp-003 | Process Image | Code: detecta `finishReason !== 'STOP'`, decode base64 → binary buffer vía `this.helpers.prepareBinaryData` | ✅ |
| wfp-004 | Upload to WP Media | HTTP POST `/wp-json/wp/v2/media` con `contentType: binaryData` + headers `Content-Disposition` y `Content-Type` desde Process Image | ✅ |
| wfp-005 | Set Alt Text | HTTP POST `/wp-json/wp/v2/media/{id}` con `{alt_text, caption}` | ✅ |
| wfp-006 | Build wp_body | Code: arma payload `{title, slug, status: 'publish', content, excerpt, featured_media, meta: {Yoast}}` y serializa a `wp_body_json` | ✅ |
| wfp-007 | Create WP Page | HTTP POST `/wp-json/wp/v2/pages` con `jsonBody: $json.wp_body_json` | ✅ |
| wfp-008 | Telegram Notify | Mensaje Markdown con título + URL + page_id + status | ✅ |
| wfp-009 | Build Response | Code: agrupa `{success, page_id, page_url, page_status, slug, media_id, title}` para webhook response | ✅ |

**Cómo invocarlo:**

```bash
curl -X POST "https://n8n.srv1398596.hstgr.cloud/webhook/publish-calc-bf" \
  -H "Content-Type: application/json" \
  --data-binary @webhook-payload.json
```

**Costo:** 1× nano banana (~$0.04 imagen 16:9) + 3 calls WP REST. ~13 s wall time.

---

### WF-Util — Update Page Content: `BF - WF-Util - Update Page Content`
- **ID n8n:** `v5WWkwGvXSnTGnRO`
- **Nodos totales:** 5
- **Estado:** ✅ Activo — usado el 2026-05-07 para PATCH iterativo de la calculadora (recalibración de precios + bulletproof JS contra LiteSpeed JS Delay)
- **Trigger:** Webhook POST `/update-page-bf` con body `{page_id, content?, title?, slug?, excerpt?, yoast_title?, yoast_metadesc?, yoast_focuskw?}`
- **Propósito:** PATCH parcial a una page existente sin re-generar imagen. El Code node (wfu-002) construye un payload solo con los campos provistos — todos opcionales excepto `page_id`. Complemento natural de WF-Util-Publish.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| wfu-001 | Webhook | POST `/update-page-bf` con `page_id` requerido | ✅ |
| wfu-002 | Build PATCH Body | Code: filtra solo campos presentes en payload + arma `meta: {Yoast}` solo si hay alguno; serializa `wp_patch_json` | ✅ |
| wfu-003 | PATCH WP Page | HTTP POST (WP usa POST para update) `/wp-json/wp/v2/pages/{page_id}` con `jsonBody: $json.wp_patch_json` | ✅ |
| wfu-004 | Telegram Notify | Mensaje con título + URL + modified timestamp | ✅ |
| wfu-005 | Build Response | Code: `{success, page_id, page_url, modified, title}` | ✅ |

**Cómo invocarlo:**

```bash
curl -X POST "https://n8n.srv1398596.hstgr.cloud/webhook/update-page-bf" \
  -H "Content-Type: application/json" \
  -d '{"page_id": 2878, "content": "<p>...</p>", "yoast_title": "..."}'
```

**Costo:** $0 (sin GPT, sin imagen). ~2 s wall time.

---

### WF-Util — Publicar Páginas Legales: `BF - WF-Util - Publicar Páginas Legales`
- **ID n8n:** `fmdlcPbN8juFuCMN`
- **Nodos totales:** 7
- **Estado:** ✅ Ejecutado 2026-05-07 — publicó las 3 páginas legales del sitio (Términos, Aviso Legal, Política de Cookies)
- **Trigger:** Manual
- **Propósito:** Publicar las páginas legales versionadas en `_legal/*.md` como WP Pages, con email/ciudad/fecha rellenados. Diseñado para correr UNA vez al inicio del proyecto. Se mantiene como referencia versionada y para regenerar si las leyes cambian.

| ID | Nodo | Función | Estado |
|----|------|---------|--------|
| leg-001 | Manual Trigger | Disparador manual desde n8n UI | ✅ |
| leg-002 | Build Pages | Code (`runOnceForAllItems`): emite 3 items con `{title, slug, content, excerpt}` con HTML embebido como template literals | ✅ |
| leg-003 | Publish Page | HTTP POST `/wp-json/wp/v2/pages` con cred `wordpressApi`, status=publish | ✅ |
| leg-004 | Collect Results | Code: agrega responses, construye summary con título + ID + URL | ✅ |
| leg-005 | Notify Success | Telegram con summary y count | ✅ |
| leg-006 | Error Trigger | Captura excepciones | ✅ |
| leg-007 | Notify Error | Telegram con fase + detalle del error | ✅ |

**Páginas publicadas:**
- `/terminos-y-condiciones/` (Ley colombiana, AdSense, afiliados, propiedad intelectual)
- `/aviso-legal/` (Ley 1581 + Decreto 1377 + GDPR + HABEAS DATA)
- `/politica-de-cookies/` (cookies AdSense + GA4 + Site Kit + IAB TCF v2.2)

**Workflow N8N de regeneración:**
1. Editar markdown en [`_legal/*.md`](_legal/)
2. Convertir a HTML: `node /tmp/md2html.mjs` (script de conversión markdown→HTML con placeholder replacement de email/ciudad/fecha)
3. Patch del workflow vía `mcp__n8n__n8n_update_partial_workflow` con 3 patchNodeField operations (find: PLACEHOLDER_*, replace: HTML envuelto en backticks)
4. Click Execute Workflow desde n8n UI

**Costo:** $0 (solo WP API + Telegram, sin GPT). ~3 s wall time.

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

**Bug regex U+2028/U+2029 en `scrubAIWatermarks` (resuelto 4 may):**
La función tenía un regex literal `const invisible = /[chars]/g;` con caracteres U+2028 (Line Separator) y U+2029 (Paragraph Separator) en su clase de caracteres. Estos chars son tratados por JS como saltos de línea inside regex literals → `SyntaxError: Invalid regular expression: missing /`. Bug latente desde inicio del proyecto, surfaceó cuando Sprint 1 expandió el camino de ejecución llevándolo finalmente al regex. Fix: regex literal eliminado de bf-node-006 y fd-008; la línea siguiente `/\p{Cf}/gu` ya cubre los watermarks Cf que importan (zero-widths, BOM, soft-hyphen, word-joiner). Detectado por error en Telegram a las 6am Colombia + recovery manual de la keyword "gato persa precio Colombia".

**SerpAPI credential type — `serpApi`, NO `httpQueryAuth` (resuelto 4 may):**
La credencial `BF - SerpAPI` (ID `44hTDtjkVRDKJOeU`) es de tipo `serpApi`, no `httpQueryAuth`. HTTP Request nodes que usan SerpAPI deben configurarse con:
```json
"authentication": "predefinedCredentialType",
"nodeCredentialType": "serpApi",
"credentials": { "serpApi": { "id": "44hTDtjkVRDKJOeU" } }
```
Bug latente desde abr 29 en WF5/w5-004 (silenciado por `continueOnFail: true` — el workflow no fallaba pero SerpAPI nunca era invocado realmente, solo PAA/autocomplete vacíos). Detectado al construir WF7 y arreglado en ambos workflows.

**SerpAPI Async pattern para Google AI Overview:**
SerpAPI devuelve AI Overview en 2 pasos: (1) primer call `engine=google&q={kw}` retorna `ai_overview.page_token`; (2) segundo call `engine=google_ai_overview&page_token={...}` retorna el contenido real (`references[]`, `text_blocks[]`). WF7 hace ambos secuencialmente. Detectar `search_information.ai_overview_state="Fully empty"` para distinguir "Google no generó AIO" (estado válido, no error) de errores reales.

**Cron + timezone — gotcha del 4 may:**
Cuando un workflow tiene `settings.timezone: America/Bogota` (configuración común para BF), las expresiones cron se interpretan en hora local de Bogotá, NO en UTC. Ejemplo: `0 9 * * 1` con timezone Bogota = lunes 9am Colombia (no 9am UTC = 4am Colombia). Confusión inicial al setear WF7 con `0 14 * * 1` esperando 9am Colombia (UTC math) cuando en realidad disparó a las 2pm Colombia (interpretación local). Regla: si `timezone` está configurado, escribir el cron en hora local del timezone.

**Refinamientos Sprint 1+2 del 4 may (post-validación primer artículo AEO):**
- bf-node-023 / fd-006 (prompt fuentes): whitelist exclusiva de 7 organizaciones (WSAVA, AVMA, ICatCare, AAFP, MSD, Cornell, PubMed). Rechaza acrónimos inventados (AFIP, ASOCFEL, etc.).
- bf-node-006b / fd-008c (Quality Gate H2 ratio): `bodyH2` filter excluye H2 estructurales fijos ("Conclusión", "Preguntas frecuentes", "Fuentes consultadas") del cálculo del ratio question-first. Antes el gato persa marcaba 5/8=62%; ahora marcaría 5/5=100%.

**`$execution.mode === 'test'` — gotcha del 5 may:**
Cuando se ejecuta un workflow vía "Execute Workflow" desde la UI de n8n con un Schedule Trigger, dentro de un Code node `$execution.mode === 'test'` (NO `'manual'` como muestra `executions/list` en la API). Modos posibles en runtime: `'trigger'` (cron), `'test'` (UI Execute), `'manual'`, `'webhook'`, `'integrated'`, `'retry'`, `'error'`. Para distinguir cron real vs cualquier ejecución manual, usar `$execution.mode !== 'trigger'` (más robusto que `=== 'manual'`). Bug detectado al implementar bypass del filtro L/M/V en bf-node-003b — la condición `=== 'manual'` nunca se cumplía.

**HTTP Request con response array vacío — gotcha del 5 may:**
Cuando un HTTP Request recibe `[]` como respuesta JSON válida (caso del slug pre-check WP cuando NO hay conflicto), n8n NO emite items y el flujo se corta silenciosamente. Solución: configurar `alwaysOutputData: true` en el HTTP Request. Aplicado a bf-node-006sg (Slug Pre-Check WP). Sin este flag, todos los posts nuevos sin conflicto fallaban silenciosamente al pasar por el slug check.

**Gemini `finishReason: NO_IMAGE` — gotcha del 5 may:**
Gemini puede responder HTTP 200 OK pero con `candidates[0].finishReason: "NO_IMAGE"` y SIN `content.parts` cuando rechaza generar imagen (filtros de seguridad, glitch del modelo). El Code node Preparar Imagen debe detectar esto explícitamente: chequear `finishReason !== 'STOP'` y `content?.parts` antes de acceder a `parts[0].inlineData.data`. El `retryOnFail` del HTTP Request NO ayuda porque la respuesta es 200 OK; solo ayuda con 5xx/timeouts.

**WP+LiteSpeed+Astra widget interactivo — gotcha del 7 may:**
Tres trampas combinadas al embeber HTML+JS interactivo (calculadora, quiz, comparador) en pages/posts WP del stack Hostinger + LiteSpeed Cache + Astra. Detectadas al desplegar la calculadora del costo anual (page 2878):
1. **wpautop manglea scripts multilínea**: WP convierte `\n\n` dentro de `<script>` en `</p><p>` literales → SyntaxError silencioso → JS no ejecuta. **Fix:** minificar todo el `<script>` y `<style>` a una sola línea (sin newlines fuera de strings).
2. **LiteSpeed Cache JS Delay**: por defecto difiere todos los `<script>` reescribiéndolos como `type="litespeed/javascript"` y solo ejecuta tras la primera interacción del usuario (mouseover/click/keydown). Si el primer clic es en submit, el form se envía como GET sin que el listener esté registrado. **Fix:** añadir `data-no-optimize="1" data-cfasync="false"` al tag `<script>` — LiteSpeed los excluye y el script carga inmediato.
3. **Bumper defensivo en forms**: aún con todo lo anterior, agregar `onsubmit="event.preventDefault();if(window.fn)window.fn();return false;"` en el `<form>` Y `onclick="..."` en el botón `type="submit"`. Definir la lógica como `window.fn = ...` (función global). Garantiza que el form NUNCA se envía aunque el script aún no haya cargado — peor caso: el usuario hace 2 clicks.

**Aplicar siempre que se despliegue un widget interactivo nuevo en bigotesfelinos.com.** El workflow `BF - WF-Util - Publish Interactive Page` ya espera contenido pre-minificado.

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
| Google Search Console | `BF - Google OAuth` (OAuth2 reutilizada para GSC + Sheets API HTTP) | `XWbfIBmitmx1uByl` | ✅ |
| SerpAPI | `BF - SerpAPI` (tipo `serpApi`, NO `httpQueryAuth`) | `44hTDtjkVRDKJOeU` | ✅ |
**Nota:** Todas las claves viven en el sistema cifrado de n8n. El `.env` del proyecto es solo documentación de referencia.

---

## Pendientes

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| **Migrar credencial Google Sheets de OAuth a Service Account** | 🔴 Alta | Reemplaza `BF - Google Sheets` (ID `70heM3IFsNK9Cyak`, OAuth2) por una credencial tipo `googleSheetsServiceAccount` que use la SA `n8n-bigotesfelinos@n8n-bigotesfelinos.iam.gserviceaccount.com` (la misma que ya hace JWT para Indexing API). **Por qué:** las SA NO usan refresh tokens — auth con private key que dura años. Elimina de raíz incidentes como el del 2026-05-09 (refresh token revoked → WF1/WF2/WF9 caídos hasta reauth manual). **Pasos:** (1) compartir Master Sheet con el email de la SA con permiso Editor; (2) crear cred n8n tipo `googleSheetsServiceAccount` apuntando a la JSON key existente; (3) refactor todos los nodos que usan `googleSheetsOAuth2Api: 70heM3IFsNK9Cyak` → SA cred. Afecta WF1, WF2, WF3, WF7, WF9, WF11, WF5, WF8, y todos los WF-Util que tocan Sheet. |
| **WF-Diag — Credential Health Monitor** | 🟠 Media | Workflow nuevo con cron `0 */12 * * *` (cada 12h) que hace 1 read trivial al Master Sheet + 1 GET a GSC API + 1 GET a WP REST. Si alguno falla → Telegram con alerta inmediata. **Por qué:** detectar credenciales caídas en 12h máximo en lugar de 36h+ (que fue el delay del incidente del 2026-05-09 — la cred se cayó en algún momento entre 8 may y 9 may 6am). 1 alerta proactiva > esperar al cron crítico del lunes. Costo $0 (3 calls cada 12h). |
| **Documentar regla operativa: no revocar app n8n desde Google Account** | 🟡 Baja | Anotar en `CLAUDE.md` y `_contexto/CREDENCIALES_Y_COSTOS.md` que `myaccount.google.com/permissions` no debe usarse para "limpiar" la app n8n a menos que sea estrictamente necesario, porque revoca todos los refresh tokens del proyecto BF (Sheets, GSC, Drive). Si se revoca, listar el procedimiento de reauth de las 2-3 credenciales afectadas en orden. |
| **Cuenta Google secundaria con OAuth alternativo (failover)** | 🟢 Opcional | Configurar credenciales OAuth duplicadas en n8n vinculadas a una segunda cuenta Google con acceso al Master Sheet. Si la primaria falla, intercambias el ID de credencial en los nodos críticos como hotfix de 5 min vs. esperar a reauth. Solo vale la pena si Service Account no se hace (que es la solución superior). |
| **AdSense reconfiguración completa — Auto Ads → 4 slots manuales + brand safety + 4 páginas legales + banner GDPR + sidebar Astra activado + CCPA mensaje + decisión arquitectónica sin CMP plugin (2026-05-11)** | ✅ 2026-05-11 | Migración full de monetización: (a) Auto Ads apagado, **4 slots manuales** (in-article #1 párrafo 3, in-article #2 párrafo 10, **sidebar sticky desktop**, pre-FAQ párrafo 20) con `data-loading-strategy="lazy"` nativo; (b) brand safety: 11 categorías estándar + 2 restringidas bloqueadas en AdSense; (c) banner GDPR Funding Choices con botones Accept/Reject/Manage activos (TCF v2.2) — publicado y verificado vía marcadores `__tcfapi`; (d) 4 páginas legales publicadas (`/privacy-policy/` preexistente + `/terminos-y-condiciones/` + `/aviso-legal/` + `/politica-de-cookies/`) cubriendo Ley 1581 + Decreto 1377 + GDPR + ePrivacy; (e) footer con enlaces a las 4 páginas vía bloque HTML personalizado en Pie de página 1; (f) CSS branded (.bf-ad-*) con etiqueta "Publicidad" + bordes sutiles + sticky desktop only; (g) **layout sidebar de Astra activado** vía Personalizar → Post Types → Posts → Right Sidebar — posts ahora renderizan `ast-right-sidebar` + `ast-two-container`, slot `7324202730` inyectando en columna lateral. **Workflow:** `BF - WF-Util - Publicar Páginas Legales` (`fmdlcPbN8juFuCMN`) construido y ejecutado para crear las 3 pages. **Plugin:** Ad Inserter Free 2.8.15. **Slot IDs:** in-article-1 `6261282948`, in-article-2 `8251391154`, sidebar `7324202730` (✅ ACTIVO), pre-FAQ `1211888823`. Documentación completa en [`_config/adsense/SETUP_COMPLETO.md`](_config/adsense/SETUP_COMPLETO.md). Score Monetización 5/10 → 8/10. **Decisión arquitectónica 2026-05-11 (sesión follow-up):** se probó instalar Complianz Free como CMP para tráfico Colombia/LATAM (configuración completa vía wizard, Google Consent Mode v2, registros de consent, traducción ES-CO con menciones Ley 1581). Auditoría en vivo reveló que Complianz interceptaba el `__tcfapi` de Funding Choices nativo de Google → script real de FC no cargaba → pierdes TCF v2.2 EU premium inventory sin ganar nada para LATAM (porque las páginas legales ya cumplen Ley 1581 técnicamente). **Resolución final:** desinstalar Complianz. CookieYes también descartado. Setup final: 4 slots AdSense + Funding Choices nativo (TCF v2.2) + mensaje CCPA en AdSense Privacy & messaging + 4 páginas legales como cumplimiento Ley 1581. Cero plugins CMP adicionales. **Pendientes derivados:** bloquear endpoint `/wp-json/wp/v2/users` para no autenticados; probar Funding Choices con VPN europea. |
| **Calculadora interactiva del costo anual de un gato en Colombia — publicada como page WP** | ✅ 2026-05-07 | Page ID 2878 en `/cuanto-cuesta-tener-un-gato-en-colombia/`. Stack completo: HTML+CSS+JS vanilla embebido, imagen destacada generada por nano banana, 3 schemas JSON-LD (WebApplication + FAQPage + Article), Yoast meta. Entregables versionados en `_recursos/calculadora-costo-anual-gato/` (calculadora.html, post.md, outreach.md de 30 destinatarios + plan social, schema.md con justificación). Es un backlink-bait y la primera **page** (no post) interactiva del catálogo. |
| **WF-Util — Publish Interactive Page (Calculadora)** | ✅ 2026-05-07 | Workflow `bWYAwFDRlU7bIYRH` (9 nodos). Webhook POST `/publish-calc-bf` con payload completo (title, slug, content, excerpt, yoast_*, image_prompt, image_filename) → genera imagen → sube a WP Media → set alt text → crea page → Telegram. Reusable para futuros widgets interactivos. ~13 s wall time, ~$0.04/ejecución. |
| **WF-Util — Update Page Content** | ✅ 2026-05-07 | Workflow `v5WWkwGvXSnTGnRO` (5 nodos). Webhook POST `/update-page-bf` con `{page_id, content?, yoast_*, ...}`. PATCH parcial: solo aplica los campos presentes en el payload. Útil para iterar contenido sin re-generar imagen. ~2 s wall time, $0/ejecución. |
| **Recalibración precios reales Colombia 2026 (calculadora)** | ✅ 2026-05-07 | Primera versión publicada con bases ~2.5× infladas (estilo USD). Usuario corrigió con caso real: $200K/mes para 3 gatos en Bogotá perfil económico (D1/Ara + Member's Selection PriceSmart). Bases nuevas: alimento $50K/$95K/$230K, arena $20K/$55K/$110K, antiparasitarios $15K, vacunas $8K, juguetes $8K, esterilización Bogotá $150K. Rango anual realista típico: $2.0-$2.8M Bogotá. Validado: cálculo económico Bogotá 1 gato = $116K/mes; × 1.7 (2 gatos) o × 2.4 (3 gatos) → coincide con caso real del usuario. |
| **Fix LiteSpeed JS Delay + wpautop scripts mangling** | ✅ 2026-05-07 | Calculadora no botaba resultado tras publicar. Diagnóstico: (1) wpautop insertaba `</p><p>` dentro del `<script>` multilínea → SyntaxError; (2) LiteSpeed Cache reescribía script a `type="litespeed/javascript"` difiriéndolo hasta primera interacción → form se enviaba como GET sin listener attachado. **Fix triple:** script en una sola línea + atributos `data-no-optimize="1" data-cfasync="false"` + bumper defensivo `onsubmit="event.preventDefault();if(window.fn)window.fn();return false;"` en form Y `onclick` en botón submit. Validado en producción. Documentado en sección "Notas técnicas críticas" para futuros widgets interactivos. |
| **WF1 + WF3 — endurecimiento de prompt y bug fix Quality Gate respuesta-directa** | ✅ 2026-05-06 | Tras el primer post post-patch (2868 Maine Coon) marcó score 81/120 con warnings: "frases prohibidas: cuando se trata de" detectada (-3), density 0%, respuesta directa 0 chars. **Patches al prompt (bf-node-023 + fd-006):** (1) `respuesta_directa` ahora exige ENTRE 80 y 280 chars + frase exacta de keyword textual; (2) bloque DENSIDAD reforzado con regla "KEYWORD EXACTA EN BODY ≥5 apariciones literales" + "KEYWORD EN PRIMEROS 200 CHARS" + lista de frases prohibidas con ✗; (3) CHECKLIST FINAL al final del user prompt (último contexto que GPT lee) con 11 items `[ ]` para auto-revisión. Estructura primacy+recency: blacklist ahora aparece 3 veces. **Bug fix Quality Gate (bf-node-006b + fd-008c línea 63/51):** regex `^<p>([^<]+)<\\/p>/` no matcheaba `<p class="respuesta-directa">` por los atributos. Corregido a `^<p[^>]*>([\\s\\S]*?)<\\/p>/`. La respuesta_directa SÍ existía pero el Quality Gate la marcaba como 0 chars. **Validado con post 2871** (Bengalí Colombia 2026): score 95/120 (+14 vs 81), frases prohibidas CLEAN (10/10 vs 7/10), density 0.11% (5/10 vs 0/10), word count 1903 (10/10 vs 8/10), H2 question-first 100% (vs 80%). Bug regex verificado pero el run 4809 corrió ANTES del fix — el siguiente run mostrará el efecto en el score de respuesta_directa. Nota: GPT aún no respeta 100% la regla "kw exacta en respuesta_directa" — usa equivalentes semánticos ("El costo de un gato Bengalí" en lugar de "cuánto cuesta un Bengalí"). |
| **WF1 — refusal guard en bf-node-006 + error path paralelo** | ✅ 2026-05-06 | Cron 8am Col del 6 may falló con `Cannot read properties of null (reading 'categoria')` porque GPT-4o rehusó la kw "cuánto cuesta un Maine Coon en Colombia 2026" (`content: null`, `refusal: "I'm sorry, I can't assist with that request."`). Telegram nunca notificó porque el path Error Trigger → Marcar Error en Sheet → Telegram serial estaba roto: bf-node-009 usaba `$('Leer Keywords Aprobadas').item.json.row_number` que tira `pairedItemNoConnection` desde el contexto del Error Trigger. **Patches aplicados:** (1) bf-node-006 guard explícito al inicio: `if (raw === null \|\| refusalMsg) throw new Error('OpenAI rehusó la keyword "X". Refusal: ...')`; (2) bf-node-009 URL y bf-node-022 text cambiados de `.item.json.X` a `.first().json.X` (no requiere paired item lineage); (3) Error Trigger reordenado a fan-out paralelo: `Error Trigger → [Marcar Error en Sheet, Notificar Error Telegram]` — antes serial, ahora cada rama independiente; (4) bf-node-009 con `onError: continueRegularOutput` defensivo. **Validado:** kw reescrita a "precio Maine Coon Colombia", ejecución manual 4807 publicó post ID 2868 (Quality Score 81/120). Nota: Error Trigger NO dispara en ejecuciones manuales (n8n behavior) — solo en cron real. |
| **Lecciones aprendidas hoy (gotchas n8n)** | 📌 2026-05-06 | (a) En cualquier nodo descendiente del Error Trigger, usar `$('X').first()` no `$('X').item` — el segundo requiere paired item lineage que no existe desde Error Trigger. (b) Error Trigger paths deben fan-out (paralelo) sus acciones, no encadenarlas — si el primer nodo falla, los siguientes no corren. (c) OpenAI puede devolver `{content: null, refusal: "..."}` con HTTP 200 cuando filtros de moderación rechazan; `JSON.parse(null)` no throwea, devuelve `null` → crash diferido. Patrón análogo al `finishReason: NO_IMAGE` de Gemini. (d) Calidad del prompt: GPT-4o ignoró parcialmente blacklist de frases prohibidas ("cuando se trata de" detected) — endurecer system prompt de bf-node-023 en próxima sesión. |
| **WF1 anti-canibalismo v2 — Capa 1: bf-node-017 reforzado** | ✅ 2026-05-05 | Threshold kw bajado 50% → 35%; nuevo Jaccard sobre slugs ≥60% (extraídos de URL); stem básico (`replace(/it([oa])s?$/, '$1')` para diminutivos + quita 's' final si len>4 para plurales). Stop words extendidas con "guia", "completa". Nuevo campo `match_reason` (kw_NNpct/slug_NNpct) en output. Validado con dry-run sobre 121 publicados: 6/8 casos test detectan correctamente. |
| **WF1 anti-canibalismo v2 — Capa 2: Slug Pre-Check WP (3 nodos)** | ✅ 2026-05-05 | Insertados entre bf-node-006 (Parsear) y bf-node-006a (Internal Linker): `bf-node-006sg` HTTP GET `/wp-json/wp/v2/posts?slug={slug}` con `alwaysOutputData: true`; `bf-node-006sgc` Code que detecta match exacto y emite `cannibalism: true` con datos del post conflictivo; `bf-node-006sgi` IF que bif a Marcar Canibalismo o Internal Linker. bf-node-019 modificado para usar `$json.similar_url` (sirve para ambos paths). bf-node-006 ahora emite `slug` en root del json. WF1 pasó de 33 → 36 nodos. Validado E2E en producción. |
| **WF1 — bypass de filtro L/M/V en ejecuciones manuales** | ✅ 2026-05-05 | bf-node-003b: `if ($execution?.mode !== 'trigger') return [items[0]];` antes del filtro de día. Permite testing/manual desde la UI cualquier día. Cron real (`mode === 'trigger'`) sigue respetando L/M/V. Hallazgo importante: la UI "Execute Workflow" expone `mode === 'test'` (no 'manual') en runtime. |
| **WF1 — robustez de imagen y retry** | ✅ 2026-05-05 | Llamar nano banana ahora `retryOnFail: true, maxTries: 3, waitBetweenTries: 5000` para fallos HTTP transitorios. Preparar Imagen ahora detecta `finishReason !== 'STOP'` y `content?.parts` ausente → throw Error claro pidiendo re-aprobar la kw (caso NO_IMAGE de Gemini). |
| **Limpieza canibalismo histórico (Sheet + WP)** | ✅ 2026-05-05 | Audit de la hoja Blog reveló: 26 filas Pendientes que duplicaban Aprobadas/Publicadas/Pendientes (basura de carga inicial); 8 pares con doble URL publicada (suplementos `-2`, guardera typo, vacunas, comida húmeda, bañar, embarazo, nombres, razas-de-gatos genérico). GSC audit de los 8 perdedores: 1 click en 90 días entre todos → no justificaba fusión. Acciones: borradas las 26 filas Pendientes; 7 posts perdedores movidos a papelera WP via DELETE REST API; 8 filas correspondientes borradas del Sheet; redirect 301 en `.htaccess` para `razas-de-gatos/razas-de-gatos/` → categoría `/razas-de-gatos/` (corrige el `redirect_canonical` automático de WP que apuntaba mal). Sheet pasó de 188 → 154 filas. |
| **Edición preventiva 2 keywords razas-Colombia** | ✅ 2026-05-05 | `gato bengalí precio Colombia` → `cuánto cuesta un Bengalí en Colombia 2026` (Jaccard contra "gato persa precio Colombia": 60% → 13%); `gato Maine Coon precio Colombia` → `cuánto cuesta un Maine Coon en Colombia 2026` (50% → 12%). Evita falsos positivos del nuevo threshold 35% al procesar el backlog. |
| **Validación E2E en producción del WF1 fortificado** | ✅ 2026-05-05 | Disparé manual desde UI varias veces: confirmó cada fix iterativamente. Run final 4667 (51s) pasó los 31 nodos: cannibalism=false, slug_check_passed=true, Quality Score 82/120 con tabla incluida, post publicado en `/alimentacion-del-gato/comida-para-gatos-colombia-marcas/`, 5 tags asignados, Telegram con deeplink GSC enviado. Primer post publicado oficialmente con la nueva arquitectura. |
| **WF11 — GSC Weekly Dashboard** | ✅ 2026-05-05 | Workflow `luUL1h3EVmzeUFCQ` (10 nodos). Schedule lunes 9am Colombia. 6 queries a GSC (last_7d/prior_7d/last_28d totales + top_pages_7d/prior + top_queries_7d). Computa WoW deltas, top 3 ganadores/perdedores por Δ pos, top queries semana, alerta concentración (>25% imp en 1 página). Append a hojas nuevas `GSC_Tracking` (snapshot semanal) y `GSC_Pages_Tracking` (top 30 páginas con Δ). Telegram Markdown. **Primer reporte:** sem 27 abr-3 may → impresiones 523→393 (-25%), pos 62.4→58.7 (+3.7), DPL 27% concentración. Costo $0 (sin GPT). |
| **WF-Util — Force Re-optimize Post** | ✅ 2026-05-05 | Workflow `gu2XtRkhfEVDsyai` (22 nodos). Webhook POST `/force-reopt-post` con `{post_id, keyword?}`. Reusa fd-006/fd-008/fd-008b/fd-008c de WF3 verbatim para mantener consistencia AEO. Salta filtros GSC + bloqueo 90d para forzar re-optimización on-demand. **Primera ejecución:** post DPL (233) con keyword override "raza dpl en gatos" → score 100/120, 1966 palabras, tabla + respuesta_directa + key_takeaways + fuentes + Speakable + FAQPage JSON-LD inyectados. Costo ~$0.05 por ejecución. |
| **Re-optimización del post DPL (pos 6.5)** | ✅ 2026-05-05 | Post id 233 (`/razas-de-gatos/raza-dpl-en-gatos/`) re-optimizado vía WF-Util. Era el único post en top 10 (430 imp/28d, 21% del total del site). Estrategia: empujar de pos 6 → pos 3 multiplica clicks 5-10×. AEO stack completo aplicado. Pendiente: solicitar indexación en GSC (deeplink en Telegram), verificar Δ pos en próximo reporte semanal. |
| **WF7 enriquecido — country split + top dominios + insight rotativo** | ✅ 2026-05-04 (PM) | aeo-006 reescrito: detecta keywords colombianas (regex modificadores), cuenta competidores top en `competitors_top3`, genera mensaje Telegram con `🇨🇴 Colombianas: X/Y` + `🌎 Generales: X/Y` + Top 3 dominios + insight contextual (4 ramas: 3+ citas colombianas → bajar cuota; 0 citas + video domina → tip video; 0 citas + blogs SEO domina → tip diferenciación; primera cita → celebración). Testeado live. |
| **WF1 Telegram con GSC deeplink** | ✅ 2026-05-04 (PM) | bf-node-020: nueva línea `⚡ [Solicitar indexación en Google](https://search.google.com/search-console/inspect?resource_id=...&id={{ encodeURIComponent(url) }})`. Click directo a GSC URL Inspection prerellenado. Reduce indexación de días a horas. |
| **WF3 Telegram error fix** | ✅ 2026-05-04 (PM) | fd-014 text faltaba `=` prefijo → expresiones `{{ ... }}` se mostraban literales. Corregido con `=❌ *Fase D Error (WF3)*\n\nNodo: {{ $json.execution?.lastNodeExecuted }}\n...` + parse_mode Markdown. |
| **WF3 manual run — descubrimiento sin candidatos** | ⚠️ 2026-05-04 (PM) | Disparé WF3 manual: devolvió "Sin candidatos" porque filtros estrictos (pos 6-50 + ≥5 imp + bloqueo 90d). Los 9 posts del 28 abril están bloqueados, los demás no cumplen filtros GSC. **Conclusión:** WF3 no es para migrar AEO masivamente al catálogo, es para mejorar SEO de lo que ya rankea. → motivó la creación de WF8. |
| **`/equipo-editorial/` con links a 7 fuentes** | ✅ 2026-05-04 (PM) | PATCH a page ID 2673: cada fuente científica ahora es `<a href rel="nofollow noopener" target="_blank">`. WSAVA, AVMA, MSD Vet Manual, PubMed/NCBI, iCatCare, AAFP, Cornell. Verificado live. Archivo local actualizado. |
| **Análisis competitivo AEO realizado** | ✅ 2026-05-04 (PM) | Lectura de hoja `AEO_Tracking`. Findings: ~50% de citaciones AIO en español-LATAM son video (YouTube + TikTok + Instagram); marcas de pet-food (Purina, Hill's) dominan informacionales; AniCura España + Mayo Clinic dominan queries de salud (con sesgo humano vs felino); queries colombianos locales (Compensar, SURA, Mercado Libre) sin competencia editorial felina — gap de oportunidad. |
| **WF8 Bulk AEO Migrator** | ✅ 2026-05-04 (PM) | Workflow `vB8ya9OSUyLsQuLg` (23 nodos) en producción. Primera batch de 10 posts migrada exitosamente tras 3 iteraciones de batchInterval (8s ❌ → 12s ❌ → 25s ✅). Cuello: ~9.300 tokens/request × Tier 1 (30K TPM) = máx 3.2 reqs/min → interval mínimo 20s, usado 25s con 26% margen. Runtime ~4 min para 10 items. ~120 posts pendientes (~12 runs más, manual cuando el usuario quiera). |
| **WF8/WF3 rate limit batching OpenAI Tier 1** | ✅ 2026-05-04 (PM) | `GPT-4o Optimizar Artículo`: `batching: { batch: { batchSize: 1, batchInterval: 25000 } }`. Razón: prompt enorme (lista de 130 posts publicados + system prompt AEO) consume ~9.300 tokens/request. 30K TPM ÷ 9.300 = 3.2 items/min máx → 60/3 = 20s mínimo entre items. 25s da 26% margen. Aplicado a WF8 (`vB8ya9OSUyLsQuLg`) y WF3 (`T46531TOrPeT6VmS`) por consistencia. |
| **AEO Sprint 4 — AEO Monitor (WF7)** | ✅ 2026-05-04 | Workflow nuevo `73UFpj4m2vke6IPk` (12 nodos). Schedule lunes 9am Colombia. Hace 2 calls a SerpAPI por keyword (regular search + async AI Overview fetch via page_token). Filtra top 20 keywords naturales (length ≤55, sin `:`/"guía completa"). Detecta `bigotesfelinos.com` en `references[]` del AIO. Append a hoja `AEO_Tracking`. Telegram resumen semanal. **Baseline 4 may: 0/14 citados.** |
| **Hotfix bug regex U+2028/U+2029** | ✅ 2026-05-04 | Latente desde inicio del proyecto. Resuelto removiendo `const invisible = /[...]/g;` de bf-node-006 y fd-008 — `/\p{Cf}/gu` ya cubre los watermarks típicos. Recovery manual de keyword "gato persa precio Colombia" (post 2667 → 2670). |
| **Refinamientos AEO** | ✅ 2026-05-04 | (1) Whitelist estricta de 7 fuentes en bf-node-023/fd-006 (rechaza AFIP, ASOCFEL); (2) Quality Gate `bodyH2` excluye H2 estructurales del cálculo question-first ratio en bf-node-006b/fd-008c. |
| **Fix latente SerpAPI credential WF5** | ✅ 2026-05-04 | w5-004 usaba `httpQueryAuth` cuando la credencial es tipo `serpApi`. Silenciado por `continueOnFail`. Arreglado a `predefinedCredentialType`/`serpApi`. |
| **WF5 COLOMBIA-FIRST QUOTA** | ✅ 2026-05-04 | w5-007 (Construir Prompt GPT): mínimo 6 de 15 ideas blog deben tener modificador colombiano (Colombia, Bogotá, Medellín, Cali, COP). Razón estratégica: en queries colombianos los competidores AIO son marketplaces/aseguradoras (Mercado Libre, Compensar, SURA), no blogs felinos. Cuota fija hasta nueva indicación; subir/bajar editando el `MÍNIMO 6` en el prompt. |
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
| 2026-05-05 | — | comida para gatos Colombia marcas | /alimentacion-del-gato/comida-para-gatos-colombia-marcas/ | Auto ✅ (5 tags) | — |
| 2026-05-06 | 2868 | precio Maine Coon Colombia | /razas-de-gatos/precio-maine-coon-colombia/ | Auto ✅ (5 tags) | — |
| 2026-05-06 | 2871 | cuánto cuesta un Bengalí en Colombia 2026 | /razas-de-gatos/cuanto-cuesta-un-bengali-en-colombia-2026/ | Auto ✅ (5 tags) | — |

## Páginas y recursos interactivos publicados

| Fecha | Tipo | ID WP | Slug / URL | Descripción |
|-------|------|-------|------------|-------------|
| 2026-05-03 | Page | 2673 | `/equipo-editorial/` | Equipo editorial — soft E-E-A-T (AEO Sprint 1) |
| 2026-05-04 | Page | 2700 | `/guia-salud-felina/` | Pilar Salud — generado por WF6 |
| 2026-05-04 | Page | 2702 | `/guia-alimentacion-gatos/` | Pilar Alimentación — generado por WF6 |
| 2026-05-04 | Page | 2704 | `/guia-razas-gatos/` | Pilar Razas — generado por WF6 |
| 2026-05-04 | Page | 2706 | `/guia-comportamiento-felino/` | Pilar Mundo del gato — generado por WF6 |
| 2026-05-07 | Page | 2878 | `/cuanto-cuesta-tener-un-gato-en-colombia/` | **Calculadora interactiva del costo anual** — primera page con widget JS embebido (HTML+CSS+JS vanilla, 3 schemas JSON-LD, imagen destacada nano banana). Fuente versionada en `_recursos/calculadora-costo-anual-gato/`. Backlink-bait. Publicada vía WF-Util-Publish. |
