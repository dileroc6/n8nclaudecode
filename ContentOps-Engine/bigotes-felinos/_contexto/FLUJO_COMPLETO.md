# Bigotes Felinos — ContentOps Engine: Documentación del Flujo

**Última actualización:** 2026-05-04

> Este documento es la **explicación narrativa paso-a-paso del flujo** de cada workflow + el historial de cambios. Para Master Sheet, estados, nodos y pendientes, abrir [`../CLAUDE.md`](../CLAUDE.md). Para credenciales y costos, abrir [`CREDENCIALES_Y_COSTOS.md`](CREDENCIALES_Y_COSTOS.md). Para overview ejecutivo, abrir [`RESUMEN_PROYECTO.md`](RESUMEN_PROYECTO.md).

---

## ¿Qué es este sistema?

ContentOps Engine es un pipeline de automatización que produce artículos de blog optimizados para SEO + AEO de forma semi-automática. El equipo decide qué keywords trabajar; el sistema se encarga de investigar, escribir, generar la imagen y publicar en WordPress sin intervención humana.

El objetivo es publicar 3 artículos por semana (lunes, miércoles y viernes) con calidad editorial consistente, cobertura SEO + AEO completa y sin canibalizar contenido ya existente.

---

## Cómo iniciar una publicación

1. Abrir el Master Sheet (hoja `Blog`)
2. Agregar una fila con la keyword y sus metadatos
3. Cambiar la columna `estado` a **`Aprobado`**
4. El sistema lo detecta automáticamente en la siguiente ejecución programada y hace todo lo demás

No hay más pasos manuales. El artículo aparecerá publicado en el blog y el Sheet se actualizará solo.

---

## WF1 — Blog SEO: el flujo paso a paso

### Trigger — ¿Cuándo se ejecuta?

El pipeline corre automáticamente **una vez al día a las 8am Colombia**. Por ejecución se procesa **exactamente una keyword**: estacionales con `fecha_objetivo` inminente publican cualquier día; regulares solo L/M/V (lógica delegada al Code node `bf-node-003b`). Si no hay ninguna candidata, el flujo termina silenciosamente.

### Paso 0 — Auto-priorización estacional

Antes de buscar keywords en estado "Aprobado", el pipeline verifica si hay alguna keyword estacional urgente que debería activarse automáticamente.

**Cómo funciona:**
1. Lee todas las filas del Sheet con `estado = "Pendiente"` que tengan una `fecha_objetivo` definida
2. Verifica si alguna tiene `fecha_objetivo` dentro de los próximos 14 días
3. Si la hay, cambia su estado automáticamente a `"Aprobado"` en el Sheet y la prioriza en la cola de ese día
4. Si no hay ninguna urgente, continúa al siguiente paso normalmente

**Ejemplo:** si el 20 de julio detecta que "gatos negros Halloween mitos" tiene `fecha_objetivo = 2026-10-17` (17 de octubre, 14 días antes de Halloween), cambia su estado a "Aprobado" y ese día se publica ese artículo — aunque haya otras keywords en la cola.

**Columna `fecha_social`:** para keywords estacionales, el blog se publica con anticipación (para SEO), pero las redes sociales se activan el día del evento real. Esta fecha queda registrada en la columna L del Sheet. WF2 la usa para detectar cuándo publicar en Instagram y Facebook.

### Paso 1 — Verificar si hay keyword para procesar

El sistema lee el Sheet buscando filas con `estado = "Aprobado"`. Si encuentra alguna, toma la primera (priorizando las que tienen `fecha_objetivo` definida). Si no hay ninguna, el flujo termina silenciosamente.

### Paso 2 — Check de canibalismo

Antes de escribir una sola palabra, el sistema verifica que no exista ya un artículo sobre el mismo tema.

**Cómo funciona:**
- Lee todas las filas del Sheet donde `estado = "Publicado"` (incluye los 106 artículos importados al iniciar el proyecto y todos los que publique el pipeline)
- Compara la keyword nueva contra cada keyword/título existente usando similitud de palabras (algoritmo Jaccard: si el 50% o más de las palabras significativas coinciden, se considera canibalismo)
- Las palabras vacías (de, la, el, en, y, para...) no se cuentan en la comparación

**Si hay canibalismo:**
- Actualiza el Sheet: `estado = "Canibalismo"`, columna H = URL del artículo similar
- El pipeline para aquí. No se genera nada.

**Si no hay canibalismo:**
- Continúa al Paso 3

### Paso 3 — Marcar en proceso

Actualiza la fila en el Sheet a `"En proceso"`. Esto sirve para que el equipo pueda ver en tiempo real qué está siendo procesado.

### Paso 4 — Construir el body del request GPT (Code node bf-node-023)

Antes de llamar a la API de OpenAI, un Code node pre-serializa el prompt completo con `JSON.stringify`. Esto resuelve dos problemas críticos de n8n: (1) el límite de tamaño de item (~4KB) que descarta campos grandes al interpolarlos en expresiones, y (2) la corrupción del JSON al incluir el contexto de posts publicados (que contiene saltos de línea y comillas).

El output es `{ gpt_body_json: "{ ... }" }` — un string JSON que el siguiente nodo inyecta directamente como body del request HTTP.

### Paso 5 — Generar el artículo (GPT-4o)

Este es el paso central. GPT-4o recibe un prompt extenso con:

- La keyword y la intención de búsqueda
- La lista completa de posts ya publicados (para crear enlaces internos reales)
- Las reglas de la marca Bigotes Felinos (tono Vet-Friend, vocabulario obligatorio y prohibido)
- Los criterios SEO + AEO técnicos obligatorios

**GPT-4o devuelve un JSON estructurado con:**

| Campo | Contenido |
|-------|-----------|
| `titulo_seo` | H1 conversacional para el usuario |
| `seo_title` | Título para Google (máx. 60 caracteres, optimizado para CTR) |
| `meta_description` | Descripción para el SERP (130-145 caracteres) |
| `categoria` | Una de las 5 categorías de WordPress |
| `body_html` | El artículo completo en HTML (mínimo 1.800 palabras) |
| `respuesta_directa` | 1-2 oraciones citables por IAs (Featured Snippet target) |
| `key_takeaways` | Array de 3-5 conclusiones (Featured Snippet target) |
| `faq_items` | Array de 4-6 preguntas y respuestas (para schema FAQ) |
| `fuentes_consultadas` | Array de 3-5 fuentes científicas (WSAVA, AVMA, PubMed...) |
| `entities` | Array de razas/enfermedades/etc. con Wikipedia URL |
| `howto_steps` | Array de pasos numerados (solo si keyword procedural) |
| `tags` | Array de 4-6 tags para WordPress |
| `prompt_imagen` | Instrucciones en inglés para generar la imagen |

**Qué incluye el artículo generado:**
- Keyword principal en los primeros 100 caracteres
- Mínimo 6 secciones H2, cada una con al menos 4 párrafos
- Al menos 3 H2 con 2 subsecciones H3
- ≥70% de H2/H3 question-first (¿Por qué...? ¿Cómo...?)
- Mínimo 1 tabla `<table>` o `<dl>` (HARD GATE — sin tabla, no se publica)
- 2-3 enlaces internos reales a artículos existentes del blog
- 1 enlace externo a fuente autoritativa (WSAVA, AVMA, PubMed u organización veterinaria oficial)
- Vocabulario de marca consistente (gatitos, peluditos, padres gatunos...)

### Paso 6 — Procesar el artículo (Code node bf-node-006)

Un nodo de código procesa la respuesta de GPT y prepara los datos para los siguientes pasos:

- Capitaliza la primera letra del título y de todos los H2/H3
- Aplica `aplicarInterrogacion()` para auto-añadir signos de interrogación españoles (¿?) en headings que empiezan con palabra interrogativa
- Detecta y asigna el ID de categoría correcto de WordPress
- Genera el slug limpio desde la keyword (sin acentos, sin caracteres especiales)
- Trunca la meta description a máximo 145 caracteres
- Envuelve `respuesta_directa` con `<p class="respuesta-directa">` (target Speakable)
- Inyecta `key_takeaways` como `<blockquote class="key-takeaways">` antes del primer H2
- Construye el HTML de la sección FAQ desde `faq_items`
- Construye el bloque `<section class="fuentes-consultadas">` con `<a rel="nofollow noopener" target="_blank">` para cada fuente
- Genera el **FAQPage JSON-LD** (schema de Google para rich snippets en el SERP) y lo agrega al final del artículo
- Genera el **WebPage JSON-LD con Speakable** apuntando a `.respuesta-directa` y `.key-takeaways` + `mentions[]` con Wikipedia `sameAs` para cada entidad
- Genera el **HowTo JSON-LD** condicional (solo si GPT identifica keyword procedural y devuelve ≥4 `howto_steps[]`)
- Aplica `strip4Byte()` para eliminar caracteres Unicode 4-byte que rompen MySQL utf8
- Aplica `scrubAIWatermarks()` para eliminar 15 caracteres Unicode invisibles + em-dashes contextuales + whitespace artifacts (reduce señales de detección IA)
- Prepara el payload para WordPress y el payload para Gemini

### Paso 6a — Internal Linker (Code node bf-node-006a)

Valida cada `<a href="bigotesfelinos.com/...">` contra la lista real de posts publicados (de bf-node-016) y strippea URLs alucinadas por GPT (404s evitados). Si quedan menos de 2 enlaces internos válidos, inyecta automáticamente buscando coincidencias de keyword del post-objetivo en el body, sin re-enlazar texto que ya está dentro de un `<a>`.

### Paso 6b — Quality Gate (Code node bf-node-006b)

Calcula score 0-120 con 18 checks ponderados: word count, H2 count, keyword density, internal/external links, Yoast meta, respuesta_directa, key_takeaways, FAQ+JSON-LD, frases prohibidas, mini-historias, sentence length, tags, fuentes consultadas, tabla, H2 question-first ratio. Si `score < 70` → `throw new Error()` con breakdown completo → Error Trigger → Sheet "Error" + Telegram con detalle de qué falló.

**HARD GATE adicional:** sin tabla `<table>` ni `<dl>` → `throw Error` independiente del score. Las IAs extraen tablas con prioridad sobre prosa.

### Paso 7 — Generar la imagen (Gemini / nano banana)

Llama a la API de Google Gemini (`gemini-2.5-flash-image`) con el prompt generado por GPT-4o.

**Configuración de la imagen:**
- Formato: 16:9 (horizontal, ideal para header de blog)
- Estilo: fotografía realista, lente 85mm, luz cálida de golden hour
- Sin humanización del gato (sin ropa, sin accesorios, sin poses forzadas)

La API devuelve la imagen en formato base64.

### Paso 8 — Preparar y subir la imagen a WordPress

Un nodo de código convierte el base64 en un buffer binario con el mime type correcto. Luego se sube a la Media Library de WordPress vía REST API.

Inmediatamente después, se hace un segundo llamado a WordPress para asignarle el **alt text** a la imagen (la keyword del artículo), que es un campo SEO importante.

El resultado es el `media_id` (ID interno de WordPress) que se usará como imagen destacada del post.

### Paso 9 — Publicar el post en WordPress

Se hace una llamada a la REST API de WordPress con el artículo completo:

| Campo WordPress | Valor |
|----------------|-------|
| `title` | Título capitalizado |
| `slug` | Keyword convertida a slug limpio (ej: `cuanto-cuesta-esterilizar-un-gato`) |
| `content` | HTML del artículo + FAQ HTML + FAQPage JSON-LD + WebPage+Speakable+mentions JSON-LD + HowTo JSON-LD condicional |
| `excerpt` | Meta description |
| `status` | `publish` (se publica directamente, sin revisión) |
| `categories` | ID de la categoría correcta en WordPress |
| `featured_media` | ID de la imagen generada en el paso anterior |
| `meta._yoast_wpseo_title` | Título SEO para Yoast |
| `meta._yoast_wpseo_metadesc` | Meta description para Yoast |
| `meta._yoast_wpseo_focuskw` | Keyword principal para Yoast |

### Paso 10 — Tags y actualización del Sheet (en paralelo con la notificación)

Dos operaciones corren al mismo tiempo:

**Tags en WordPress — cadena de 4 nodos HTTP:**
El pipeline usa 4 nodos encadenados (en lugar de un Code node) porque n8n elimina las credenciales de los Code nodes al guardar via API, pero los HTTP Request nodes sí las retienen.

1. **Tags - Split** (Code node): divide el array `tags_list` en items individuales, uno por tag
2. **Tags - POST Tag** (HTTP Request, wordpressApi): crea cada tag en WP; si ya existe, la respuesta incluye `data.term_id` en vez de `id` — se usa `neverError: true` para que ambos casos lleguen como output normal
3. **Tags - Collect IDs** (Code node, `runOnceForAllItems`): recoge todos los IDs (nuevos y existentes) en un solo array
4. **Tags - Asignar** (HTTP Request, wordpressApi): hace PATCH al post recién publicado con el array de tag IDs

**Actualización del Sheet:**
- `estado` → `"Publicado"`
- `url_post` → URL del artículo publicado en WordPress

A partir de este momento, el artículo es visible en el blog y el Sheet refleja el estado correcto. En la próxima ejecución, este artículo estará disponible como referencia para enlaces internos y el check de canibalismo.

### Paso 11 — Notificación Telegram

Tras publicar e indexar, el bot `@bigotesfelinos_pipeline_bot` envía un mensaje con el título, la URL y la keyword al chat del equipo. Si cualquier paso anterior falla, el **Error Trigger** captura la excepción, actualiza el Sheet a `"Error"` y envía una notificación de error con el detalle de qué fase falló.

### Si algo falla en cualquier paso

El nodo **Error Trigger** (bf-node-014) captura cualquier excepción no controlada. Ejecuta en paralelo:
- Actualiza el Sheet a `"Error"`
- Envía notificación Telegram con keyword + fase + detalle del error

---

## Diagrama del flujo completo de WF1

```
┌──────────────────────────────────────────────────────────────────┐
│  Schedule Trigger: 8am — diario (lógica L/M/V en código)          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
             ┌─────────────────────────────────┐
             │  bf-node-s1: Leer Estacionales   │
             │  Pendiente con fecha_objetivo     │
             └─────────────────────────────────┘
                              │
                              ▼
             ┌─────────────────────────────────┐
             │  bf-node-s2: ¿Alguna tiene       │
             │  fecha_objetivo en ≤14 días?     │
             └─────────────────────────────────┘
                    │               │
                  SÍ → urgente    NO → sin estacional urgente
                    │               │
                    ▼               │
  bf-node-s4: Marcar "Aprobado"    │
  en Sheet (estacional urgente)    │
                    │               │
                    └───────┬───────┘
                            ▼
             ┌────────────────────────────┐
             │  Leer Keywords Aprobadas   │
             └────────────────────────────┘
                            │
                            ▼
             ┌────────────────────────────┐
             │  ¿Hay keyword Aprobada?    │
             └────────────────────────────┘
                    │               │
                   SÍ               NO → Fin (silencioso)
                    │
                    ▼
        Tomar PRIMERA keyword
        (prioriza la que tiene fecha_objetivo)
                    │
                    ▼
     ┌──────────────────────────────────┐
     │  Check canibalismo               │
     │  (compara contra Sheet Publicado)│
     └──────────────────────────────────┘
              │              │
         Canibalismo    Sin canibalismo
              │              │
              ▼              ▼
     Sheet: "Canibalismo"   Sheet: "En proceso"
     + URL similar               │
                                 ▼
                    ┌────────────────────────┐
                    │  Construir body GPT    │
                    │  (pre-serializa JSON)  │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  GPT-4o genera         │
                    │  artículo + AEO + FAQ +│
                    │  fuentes + entities    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Code node Parse:      │
                    │  - Capitalización + ¿? │
                    │  - Slug limpio         │
                    │  - FAQ HTML + JSON-LD  │
                    │  - Speakable + mentions│
                    │  - HowTo (condicional) │
                    │  - scrubAIWatermarks   │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Internal Linker       │
                    │  (valida + inyecta)    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Quality Gate /120     │
                    │  HARD GATE: tabla      │
                    │  Threshold: 70 pts     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Gemini genera imagen  │
                    │  16:9 fotorrealista    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Subir imagen a WP     │
                    │  + asignar alt text    │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Publicar post en WP   │
                    │  (con Yoast meta +     │
                    │  imagen destacada)     │
                    └────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
  │  Tags WP        │  │ Sheet: "Publicado"│  │ Telegram:        │
  │  (4 HTTP nodes) │  │ + url_post       │  │ notificación ✅  │
  └─────────────────┘  └──────────────────┘  └──────────────────┘

  (Indexación en Google: natural via sitemap Yoast en 1-3 días)
```

---

## Optimizaciones SEO + AEO implementadas

### SEO clásico (Sprint 0)

| Optimización | Cómo se implementa |
|-------------|-------------------|
| Title tag (máx. 60 chars) | GPT genera `seo_title` con fórmula de alto CTR |
| Meta description (130-145 chars) | GPT genera + Code node trunca si excede |
| Slug corto y limpio | Se genera desde la keyword, sin acentos ni caracteres especiales |
| H1 único | El `<h1>` lo gestiona WordPress con el campo `title`. GPT no lo incluye en el body |
| Keyword en primer párrafo | Instrucción explícita en el prompt: keyword en los primeros 100 caracteres |
| Keyword en al menos un H2 | Instrucción explícita en el prompt |
| Estructura H2/H3 | Mínimo 6 H2, al menos 3 con 2 H3 cada uno |
| LSI keywords | GPT las integra de forma natural en el cuerpo |
| FAQ con schema JSON-LD | `faq_items` → HTML + `<script type="application/ld+json">` FAQPage |
| Enlace externo autoritativo | 1 por artículo a WSAVA, AVMA, PubMed u organización veterinaria oficial |
| 2-3 enlaces internos reales | GPT recibe la lista de posts publicados y embebe links naturales |
| Tags WordPress | 4-6 tags generados por GPT, creados en WP automáticamente |
| Imagen alt text | Keyword del artículo asignada al media item |
| Imagen en 16:9 / WebP | Configurado en el payload de Gemini |
| Yoast seo_title, metadesc, focuskw | Enviados vía REST API (requiere plugin `bf-yoast-rest` activo) |
| Categoría correcta | Sistema de mapeo + inferencia por keyword como fallback |
| Anticanibalismo | Comparación Jaccard contra todos los posts del Sheet antes de generar |

### AEO — Answer Engine Optimization (Sprint 1 + 2, desplegado 2026-05-03)

Optimización para ChatGPT, Perplexity, Google AI Overviews, Alexa, Google Home y Siri. Aplicado a WF1 y WF3.

| Optimización | Cómo se implementa | Sprint |
|-------------|-------------------|--------|
| `bigotesfelinos.com/llms.txt` | Estándar emergente. Crawlers de Anthropic/OpenAI/Perplexity respetan. Declara categorías y políticas de citación | 1-D1 |
| Página `/equipo-editorial/` | Soft E-E-A-T sin veterinario en nómina. Metodología de investigación + lista de fuentes científicas + disclaimer médico. Yoast meta optimizado | 1-D1 |
| `<p class="respuesta-directa">` (al inicio del body) | GPT genera `respuesta_directa` (1-2 oraciones citables). Parser la envuelve con clase para que Speakable apunte a ella | 1-D3 |
| `<blockquote class="key-takeaways">` (después de intro) | GPT genera `key_takeaways[]` (3-5 conclusiones). Featured Snippet target | 1-D3 |
| `<section class="fuentes-consultadas">` (cerca del final) | GPT genera `fuentes_consultadas[]` (3-5 fuentes con nombre/URL/descripción). Parser construye `<a rel="nofollow noopener" target="_blank">` | 1-D2 |
| Schema `WebPage` con `Speakable` | JSON-LD con `cssSelector: ['.respuesta-directa', '.key-takeaways']`. Asistentes de voz leen estos bloques | 1-D3 |
| Schema `HowTo` (condicional) | Solo si GPT identifica keyword procedural y devuelve ≥4 `howto_steps[]`. Google muestra rich result con pasos numerados | 1-D4 |
| Schema `WebPage.mentions[]` con Wikipedia `sameAs` | GPT genera `entities[]` con razas/enfermedades/etc. + Wikipedia URL → señal Knowledge Graph para Google | 2-D3 |
| H2/H3 question-first | Prompt obliga ≥70% de H2/H3 como preguntas reales. `aplicarInterrogacion()` auto-añade `¿?` cuando heading empieza con palabra interrogativa | 2-D1 |
| Tabla obligatoria (HARD GATE) | Mínimo 1 `<table>` o `<dl>` por artículo. Quality Gate `throw Error` si falta. Las IAs extraen tablas con prioridad sobre prosa | 1-D5 |
| Quality Gate 18 checks / 120 pts | Threshold 70 pts. Checks #16 fuentes, #17 tabla (HARD), #18 H2 question-first ratio | 1-2 |
| Anti-AI watermark scrubber | Función `scrubAIWatermarks()` elimina invisibles Unicode + em-dashes + `\p{Cf}` antes de publicar. Reduce señales de detección IA | 0 |

---

## WF2 — Paquete de Redes Sociales (Fase B-2)

**Workflow:** `WF2 - BF - Redes Sociales: Generar Copies CapCut` (ID: `3PWQY3biRhOyN1IA`) · **11 nodos** · ✅ Activo — publicación **manual**

### ¿Cuándo se ejecuta?

Corre **todos los días a las 10am Colombia (15:00 UTC)**. Detecta automáticamente qué artículos generar:

- **Estacionales:** filas de la hoja `Blog` donde `fecha_social = hoy` (cualquier día de la semana), siempre que no exista ya una fila con esa keyword en `Redes Sociales`
- **Regulares:** filas `Publicado` de `Blog` sin copies existentes en `Redes Sociales`, cuando hoy es L/M/V

Si no hay candidatos, el workflow termina silenciosamente.

### Estrategia de contenido por plataforma

Cada artículo genera **4 piezas distintas**, no el mismo texto reformateado. Cada una está optimizada para la señal que premia su algoritmo. GPT-4o genera **10 campos granulares** por artículo. Cada campo es inmediatamente usable en CapCut sin edición adicional.

| Campo GPT | Plataforma | Descripción | Señal |
|-----------|-----------|-------------|-------|
| `ig_hook_visual` | Instagram | Texto en pantalla 0-3s, ≤10 palabras, genera shock | Guardados |
| `ig_tips_body` | Instagram | 3 tips ✅ listos para pantalla o caption | Guardados |
| `ig_caption_seo` | Instagram | Caption completo + Stories Poll + hashtags | Guardados |
| `fb_script_narrativo` | Facebook | Guión de voz 30-60s, tono humano | Comentarios |
| `fb_copy_aida` | Facebook | Post AIDA + pregunta + link | Comentarios |
| `tt_hook_agresivo` | TikTok | Frase de impacto 0-2s, ≤8 palabras | Completado |
| `tt_script_fast` | TikTok | Guión 30-45s, una frase por línea | Completado |
| `tt_bait_comentarios` | TikTok | Pregunta final para forzar comentarios | Completado |
| `yt_script_storytelling` | YouTube Shorts | Guión 50-60s Problema-Solución + bonus | Suscripciones |
| `yt_cta_subs` | YouTube Shorts | Cierre ≤15 palabras para conversión a suscriptores | Suscripciones |

Los 10 campos se consolidan en las 4 columnas de `Redes Sociales` con separadores visuales (🎣 💡 📝 etc.) para facilitar el uso directo en CapCut. **La publicación en todas las plataformas es manual** — el equipo usa los scripts del Sheet para grabar y publicar.

### Flujo de cada artículo

```
Blog: fila "Publicado" candidata para hoy
        ↓
Redes Sociales: verificar que la keyword no exista ya (tipo="Blog")
        ↓
GPT-4o → 10 campos granulares (3 IG + 2 FB + 3 TT + 2 YT)
        ↓
Redes Sociales: append nueva fila [tipo="Blog", keyword, url_post, fecha_social, estado, copies]
        ↓
Telegram → notificación con keyword + título
```

---

## WF3 — Re-optimización SEO (Fase D)

**Workflow:** `WF3 - BF - Re-optimización SEO: Posts GSC posición 6-50` (ID: `T46531TOrPeT6VmS`) · **26 nodos** · ✅ Activo — automático el 1° de cada mes + manual

### ¿Qué hace?

Detecta los artículos del blog que Google ya está mostrando en posición 6-50 pero que no llegaron al top 5. Los reescribe completamente con GPT-4o (mismo estándar SEO + AEO que artículos nuevos) y actualiza WordPress directamente.

### ¿Cuándo se ejecuta?

Automático el 1° de cada mes a las 8am Colombia + disponible para ejecución manual. Procesa hasta **10 artículos por run**. Los artículos procesados quedan bloqueados 90 días (columna M de la hoja `Blog`) para no reescribirse con datos insuficientes.

### Criterios de selección de candidatos

| Criterio | Valor |
|---------|-------|
| Posición en Google | Entre 6 y 50 |
| Impresiones mínimas (90 días) | ≥ 5 |
| Bloqueo por re-optimización reciente | 90 días desde última re-optimización |
| Ordenamiento | Por impresiones descendente (más impresiones = más volumen real) |
| URLs excluidas | Homepage, páginas de autor, productos, imágenes, fragmentos `#anchor` |

### Qué produce por artículo

- `body_html` reescrito completo (mínimo 1.800 palabras, misma densidad y stack AEO que artículos nuevos)
- `respuesta_directa` + `key_takeaways[]` inyectados al inicio
- `faq_items[]` con 5-6 preguntas frecuentes → FAQ HTML + FAQPage JSON-LD
- `fuentes_consultadas[]` + `entities[]` con Wikipedia URLs
- Schemas WebPage+Speakable+mentions + HowTo condicional
- `seo_title` optimizado (50-60 chars exactos, año actual, power words)
- `meta_description` optimizada (130-145 chars exactos)
- Yoast meta actualizado (`_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw`)
- Tags reasignados via cadena de 4 nodos HTTP (fd-021a→b→c→d)
- `fecha_reoptimizado` escrita en columna M de la hoja `Blog`

### Flujo de cada artículo

```
GSC API → posiciones últimos 90 días
        ↓
Sheet "Publicado" → filtrar candidatos pos 6-50, ≥5 imp, no bloqueados
        ↓
WordPress GET Post → leer contenido actual completo
        ↓
GPT-4o → reescribir con prompt completo del pipeline principal
        (preserva enlaces, actualiza año, expande secciones, añade FAQ + AEO)
        ↓
Internal Linker WF3 → valida + inyecta enlaces internos reales
        ↓
Quality Gate WF3 → 18 checks /120 + HARD GATE tabla
        ↓
WordPress PATCH Post → actualizar content + Yoast meta
        ↓
Tags WF3 (4 HTTP nodes) → reasignar tags
        ↓
Blog batchUpdate → columna J (posición GSC) + columna M (fecha_reoptimizado)
        ↓
Telegram → notificación con resumen de artículos procesados
```

### Notas técnicas críticas

- Todos los Code nodes usan `runOnceForAllItems` para evitar el bug de `pairedItem` de n8n con nodos Merge
- El Merge node combina datos del Sheet con el contenido de WordPress (by position)
- `$('Construir Prompt GPT Refresh').all()` indexado por posición en el Parse node
- `stripH1()` elimina el `<h1>` del HTML que GPT puede incluir aunque se le pida que no
- `limpiarFAQ()` elimina blockquotes markdown que GPT genera ocasionalmente
- `strip4Byte()` con flag `u` elimina caracteres Unicode matemáticos que rompen MySQL utf8
- Timezone Colombia (UTC-5) para la fecha en columna M (Blog)
- fd-009 (PATCH WP): URL como expresión completa, nunca como `posts/={{ expr }}` (causa literal `=` en la URL)
- fd-004: deduplica URLs de GSC (fragmentos #anchor) y emite `{no_candidates: true}` cuando 0 candidatos → fd-004b (IF) bifurca a Telegram aviso o Guard que filtra ghost items en v1

---

## WF4 — Pilar Entretenimiento

**Workflow:** `WF4 - BF - Entretenimiento Viral: Contenido Humor` (ID: `ylPUrgrgbL1wLnQ2`) · **11 nodos** · ✅ Activo

### ¿Qué es?

Cubre el 20% de la estrategia editorial (Entretenimiento). Genera contenido viral/humor semanal sin depender del pipeline de blog. El contenido nace de observaciones reales del comportamiento felino — el humor es reconocimiento, no exageración.

**Dual mode desde 2026-04-29:** si WF5 dejó filas con `tipo="Entretenimiento"` + `estado="Idea"` en `Redes Sociales`, WF4 desarrolla la primera idea disponible (situación específica) y actualiza esa fila (PUT). Si no hay ideas pendientes, GPT-4o elige autónomamente una situación nueva y la inserta como fila nueva (append).

### ¿Cuándo se ejecuta?

Cada **sábado a las 10am Colombia (15:00 UTC)**, cron `0 15 * * 6`.

### Estructura viral (3 pasos)

Cada pieza de entretenimiento sigue la mecánica de viralización:
1. **Reconocimiento** — "Sí, mi gato también hace eso"
2. **Identificación** — compartir para que otros digan lo mismo
3. **Impulso de compartir** — el contenido les representa, lo reenvían

### Flujo

```
Redes Sociales: leer todas las filas (situaciones previas + Ideas pendientes)
        ↓
ent-005 (runOnceForAllItems): ¿hay tipo="Entretenimiento" + estado="Idea"?
    [SÍ] → prompt específico para esa situación (6 campos, sin "situacion")
    [NO] → prompt autónomo (7 campos, GPT elige situación)
        ↓
GPT-4o: genera contenido viral (6 o 7 campos según modo)
        ↓
ent-007: construye rowData + sheet_update_json + sheet_append_json + idea_row_number
        ↓
ent-007b IF has_idea:
    [TRUE]  → ent-008b HTTP PUT  → actualiza fila existente (estado: Pendiente + contenido)
    [FALSE] → ent-008 HTTP POST  → append nueva fila en Redes Sociales
        ↓
ent-009 Telegram → notificación con situación + modo (idea procesada / nueva generación)
```

---

## WF5 — Generador de Ideas

**Workflow:** `WF5 - BF - Generador de Ideas: Blog + Entretenimiento` (ID: `yRbv29Y6FiQHn1Qg`) · **16 nodos** · ✅ Activo (ejecución manual)

### ¿Qué hace?

Genera automáticamente ideas nuevas para el pipeline, extrayendo señales reales de demanda y evitando duplicar lo que ya existe. Alimenta dos hojas: `Blog` (keywords nuevas con metadatos) y `Redes Sociales` (situaciones de entretenimiento para WF4).

### Fuentes de datos

| Fuente | Qué aporta |
|--------|-----------|
| **GSC API** | Queries reales con ≥3 impresiones que no están en el Blog sheet → ideas con demanda probada |
| **SerpAPI** | PAA (People Also Ask) + autocomplete de Google para temas felinos → intención de búsqueda real |
| **GPT-4o** | Sintetiza las fuentes, descarta ideas débiles, asigna metadatos (nicho, audiencia, intención, prioridad) |

### Deduplicación

Jaccard ≥50% (stopwords excluidas) contra todas las keywords existentes en `Blog` y situaciones en `Redes Sociales`. Una idea nueva con ≥50% de solapamiento de términos con algo existente se descarta.

### Outputs

- **Hoja `Blog`**: filas nuevas con `keyword`, `estado="Pendiente"`, `prioridad`, `nicho`, `país`, `audiencia`, `intención`
- **Hoja `Redes Sociales`**: filas nuevas con `tipo="Entretenimiento"`, `keyword` (la situación), `estado="Idea"`

### Flujo

```
Manual Trigger
        ↓
Preparar Fechas GSC → GSC Query (últimos 90 días, ≥3 impresiones)
SerpAPI (PAA + autocomplete) [continueOnFail: true]
Leer Blog Sheet + Leer Redes Sociales (contexto de existentes)
        ↓
Construir Prompt GPT (runOnceForAllItems)
→ GPT-4o genera N ideas blog + M ideas entretenimiento
        ↓
Parsear y Filtrar Ideas (runOnceForAllItems)
→ dedup Jaccard ≥50% → separa blog vs entretenimiento
        ↓
IF blog_count > 0  → Append Blog!A:M  (estado="Pendiente")
IF ent_count > 0   → Append Redes Sociales!A:I  (tipo="Entretenimiento", estado="Idea")
Telegram → resumen: N ideas blog + M ideas entretenimiento
```

### Integración con otros workflows

- Las ideas de `Blog` (estado=Pendiente) son visibles en la hoja y se activan manualmente cambiando estado a `Aprobado` → dispara WF1.
- Las ideas de `Redes Sociales` (estado=Idea) son consumidas por WF4 el siguiente sábado.

---

## Historial de cambios

| Fecha | Cambio |
|-------|--------|
| 2026-04-23 | Auditoría digital del sitio. Score inicial: 4.2/10 |
| 2026-04-23 | Correcciones Bloque A: newsletter, Lorem ipsum, fechas, email autor, redes sociales |
| 2026-04-23 | Pipeline principal funcional: keyword → GPT-4o → WordPress |
| 2026-04-24 | Imagen 16:9, categorías correctas, slug desde keyword, alt text en imagen |
| 2026-04-24 | Yoast meta via REST API (plugin bf-yoast-rest instalado en WP) |
| 2026-04-24 | FAQPage JSON-LD, tags, enlaces internos, enlace externo autoritativo |
| 2026-04-24 | Check de canibalismo (Jaccard 50%) contra Master Sheet |
| 2026-04-24 | Importación de 106 posts existentes al Master Sheet |
| 2026-04-24 | Tags: reemplazado Code node por cadena de 4 HTTP Request nodes (wordpressApi) |
| 2026-04-24 | Título SEO dinámico: se inyecta `currentYear` en el prompt para evitar años desactualizados |
| 2026-04-24 | Telegram: bot `@bigotesfelinos_pipeline_bot` activo — nodos bf-node-020 y bf-node-022 |
| 2026-04-24 | Bloque B técnico: robots.txt físico, redirect 301, Schema Organization+BreadcrumbList en Yoast |
| 2026-04-24 | bf-node-023 (Construir Body GPT): pre-serialización con JSON.stringify para evitar corrupción |
| 2026-04-25 | Schedule cambiado de cada hora a una vez al día a las 8am (cron: `0 8 * * 1,3,5`) |
| 2026-04-25 | bf-node-003b: una sola keyword por ejecución, prioriza estacionales con fecha_objetivo |
| 2026-04-25 | Auto-priorización estacional: bf-node-s1…s4 detectan keywords estacionales con fecha_objetivo en ≤14 días y las marcan "Aprobado" automáticamente |
| 2026-04-25 | Master Sheet: columnas fecha_objetivo (K) y fecha_social (L) añadidas. ~143 keywords cargadas incluyendo 10 estacionales con fechas |
| 2026-04-25 | Decisión arquitectónica: blog estacional publica antes (SEO), redes sociales publican en fecha real del evento (fecha_social) — desacoplados |
| 2026-04-25 | strip4Byte en bf-node-006: GPT genera caracteres Unicode 4-byte (math bold) que MySQL utf8 no soporta → db_insert_error. Función strip4Byte() añadida |
| 2026-04-25 | Google Indexing API eliminada del pipeline: JWT RS256 pure-JS funciona (token OK), pero GSC UI no acepta service accounts como Owner. Sitemap ping (/ping) deprecado ene/2024. Indexación natural via sitemap Yoast |
| 2026-04-25 | Pipeline validado end-to-end: 5 artículos publicados sin errores. Listo para producción autónoma |
| 2026-04-26 | Fase B-2 creada: WF2 (17 nodos). GPT genera 4 copies diferenciados: Instagram (guardados), Facebook (comentarios), TikTok (completado), YouTube Shorts (suscripciones) |
| 2026-04-27 | Fase B-2 reestructurada: publicación 100% manual. Nodos bf2-007 a bf2-014 (Meta) eliminados. GPT genera 10 campos granulares CapCut-ready (3 IG + 2 FB + 3 TT + 2 YT) |
| 2026-04-27 | Vocabulario: "michi/michis" eliminado de todos los prompts y documentación |
| 2026-04-27 | Imagen del blog: arquitectura dos pasos — GPT escribe descripción de escena (≤20 palabras, inglés), bf-node-006 añade specs técnicas fijas de fotografía (85mm, bokeh, 16:9) |
| 2026-04-27 | Pilar Entretenimiento: WF4 creado (10 nodos). Sábados 10am Colombia |
| 2026-04-28 | Fase D (Re-optimización GSC) implementada completa: WF3 (16 nodos). GSC → filtro pos 6-50 con ≥5 impresiones → GPT-4o reescribe completo → WP PATCH → Sheet actualizado |
| 2026-04-28 | Fase D ejecutada exitosamente: 9 artículos re-optimizados en el primer run de producción |
| 2026-04-28 | Workflows renombrados para mayor claridad: WF1=`Blog SEO`, WF2=`Redes Sociales`, WF3=`Re-optimización SEO`, WF4=`Entretenimiento Viral` |
| 2026-04-28 | Reestructuración hojas del Sheet: Pipeline→Blog (cols A-M), Entretenimiento→Redes Sociales (cols A-I). WF2 pasa de batchUpdate a append en Redes Sociales. WF4 elimina banco manual: GPT elige situación, inserta fila en Redes Sociales |
| 2026-04-29 | WF5 (Generador de Ideas) creado: `yRbv29Y6FiQHn1Qg` (16 nodos). GSC + SerpAPI + GPT-4o → ideas blog + ideas entretenimiento. Dedup Jaccard ≥50% |
| 2026-04-29 | WF1: trigger cambiado de `0 8 * * 1,3,5` (L/M/V) a `0 13 * * *` (diario). Lógica L/M/V movida a bf-node-003b — estacionales publican cualquier día |
| 2026-04-29 | WF3: fd-001c (Schedule Trigger Mensual, cron `0 13 1 * *`) añadido. WF3 ejecuta automáticamente el 1° de cada mes |
| 2026-04-29 | WF4: ent-007b (IF Tiene Idea) + ent-008b (HTTP PUT) añadidos. Procesa `estado="Idea"` de WF5 o GPT autónomo si no hay ideas |
| 2026-05-01 | Anti-AI watermark scrubber: `scrubAIWatermarks()` agregada a bf-node-006 + fd-008. Remueve 15 Unicode invisibles + categoría `\p{Cf}` + em-dashes contextuales + whitespace artifacts |
| 2026-05-01 | Refactor prompt blog WF1: tono Vet-Friend reforzado, frases prohibidas, mini-historias obligatorias, AI Search rule. Nuevos campos `respuesta_directa` + `key_takeaways` inyectados al HTML |
| 2026-05-01 | Quality Gate WF1 (bf-node-006b): score 0-100 con 15 checks. Threshold 70 → throw Error con breakdown si falla |
| 2026-05-01 | Internal Linker WF1 (bf-node-006a): valida URLs alucinadas + suplementa hasta 2 enlaces internos reales |
| 2026-05-01 | Replicación a WF3: prompt refactored + `respuesta_directa` + `key_takeaways` + Internal Linker (fd-008b) + Quality Gate (fd-008c). 26 nodos total |
| 2026-05-01 | WF2: scrubber + frases prohibidas aplicados a los 10 campos GPT |
| 2026-05-01 | WF5: rate limit Sheets 429 — `Leer Blog Sheet` + `Leer Redes Sociales` convertidos a HTTP GET leyendo solo A:A y A:B (2 read requests vs 60+) |
| 2026-05-01 | WF3: filtrar candidatos "Unknown error" — early exit cuando 0 posts publicados. Notificación "Sin candidatos" via fd-004b/c/015 |
| 2026-05-01 | WF3: tags en re-optimización — fd-006 pide `tags[]`, cadena fd-021a→b→c→d asigna tags por post |
| 2026-05-01 | OAuth2 Google publicado en producción — tokens ya no expiran cada 7 días |
| 2026-05-01 | Credencial SerpAPI creada (ID `44hTDtjkVRDKJOeU`). w5-004 actualizado |
| 2026-05-03 | WF2: rate limit Sheets 429 (re-fix definitivo) — `bf2-002` y `bf2-002b` convertidos a HTTP GET a Sheets API. 11 nodos total |
| 2026-05-03 | **AEO Sprint 1 desplegado** — Cimientos de Answer Engine Optimization. (D1) `llms.txt` en raíz + página `/equipo-editorial/` con Yoast meta. (D2) Bloque `<section class="fuentes-consultadas">` con 3-5 referencias científicas. (D3-4) Schema upgrade: `WebPage` con `Speakable` + `HowTo` condicional. (D5) Tabla `<table>` o `<dl>` obligatoria con HARD GATE. WF1 (33 nodos) y WF3 (26 nodos) replicados |
| 2026-05-03 | **AEO Sprint 2 desplegado** — Question-first + capa de entidades. Prompt obliga ≥70% de H2/H3 como preguntas. `aplicarInterrogacion()` en `capitalizarHeadings()`. GPT genera `entities[]` con Wikipedia URLs → WebPage `mentions[]` con `sameAs`. Quality Gate check #18. Threshold ahora 70/120 |
