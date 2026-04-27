# Bigotes Felinos — ContentOps Engine: Documentación del Flujo Completo

**Última actualización:** 2026-04-27 (sesión 6)
**Estado del sistema:** ✅ Pipeline Blog activo (31 nodos). ✅ Fase B-2 activa (10 nodos) — publicación manual. ✅ Pilar Entretenimiento activo (10 nodos).

---

## ¿Qué es este sistema?

ContentOps Engine es un pipeline de automatización que produce artículos de blog optimizados para SEO de forma semi-automática. El equipo decide qué keywords trabajar; el sistema se encarga de investigar, escribir, generar la imagen y publicar en WordPress sin intervención humana.

El objetivo es publicar 3 artículos por semana (lunes, miércoles y viernes) con calidad editorial consistente, cobertura SEO completa y sin canibalizar contenido ya existente.

---

## Componentes del sistema

| Componente | Rol |
|-----------|-----|
| **Google Sheets** | Panel de control. Aprobación de keywords, estado del pipeline, almacenamiento de copies de redes |
| **n8n** | Motor de automatización. Orquesta todos los pasos del pipeline |
| **OpenAI GPT-4o** | Redacta artículos, genera FAQ/tags/enlaces, y produce los 4 copies de redes con estrategia diferenciada |
| **Google Gemini (nano banana)** | Genera la imagen destacada del artículo en formato 16:9 (blog) |
| **WordPress** | CMS donde se publica el resultado final (bigotesfelinos.com) |
| **Yoast SEO** | Plugin de WordPress que gestiona los metadatos SEO del post |
| **Telegram** | Notificaciones de éxito y error — bot `@bigotesfelinos_pipeline_bot` ✅ activo |
| **Pilar Entretenimiento** | Workflow semanal (sábados) — genera contenido viral/humor para 4 plataformas desde un banco de situaciones |
| **Yoast SEO sitemap** | Indexación natural en Google (1-3 días) via sitemap generado automáticamente por Yoast |

---

## El Master Sheet — Panel de control

Archivo: `Bigotes Felinos — Master Sheet` → hoja `Pipeline`

### Estructura de columnas

| Columna | Campo | Descripción |
|---------|-------|-------------|
| A | `keyword` | La keyword o tema del artículo |
| B | `estado` | Estado actual en el pipeline (ver tabla de estados) |
| C | `prioridad` | Alta / Media / Baja |
| D | `nicho` | Subcategoría temática |
| E | `país` | País objetivo si es contenido local (ej: Colombia). Vacío = hispanohablante general |
| F | `audiencia` | Perfil del lector objetivo |
| G | `intencion` | Intención de búsqueda (informacional, transaccional, comercial) |
| H | `url_post` | URL del post publicado. También se usa para marcar el artículo similar si hay canibalismo |
| I | `wordcount` | Cantidad de palabras del artículo publicado |
| J | `posicion_gsc` | Posición en Google Search Console (se actualiza manualmente en Fase D) |
| K | `fecha_social` | Fecha en que debe publicarse en redes sociales (= fecha del evento real). Para estacionales el blog publica antes (SEO); las redes publican el día del evento. Vacío para keywords regulares |
| L | `copy_instagram` | Caption para Instagram: stop-scroll + AIDA + Stories Poll + hashtags. Optimizado para GUARDADOS |
| M | `copy_facebook` | Post de comunidad para Facebook: AIDA + CTA de comentarios + link. Optimizado para COMENTARIOS |
| N | `guion_tiktok` | Script 15–45s para TikTok: hook agresivo + tips rápidos + giro + bait de comentario |
| O | `fecha_objetivo` | Solo para keywords estacionales: fecha límite de publicación del blog (2 semanas antes del evento). El pipeline la detecta automáticamente y prioriza la keyword |
| P | `guion_youtube` | Script 45–60s para YouTube Shorts: tono educacional, historia + solución, CTA de suscripción |

### Estados del pipeline

| Estado | Significado | Quién lo asigna |
|--------|------------|-----------------|
| `Pendiente` | Keyword registrada, esperando aprobación | El equipo |
| `Aprobado` | **Dispara el pipeline.** Keyword lista para producción | El equipo |
| `En proceso` | El pipeline está trabajando en este artículo ahora mismo | Sistema automático |
| `Publicado` | Artículo live en WordPress. La URL está en la columna H | Sistema automático |
| `Error` | El pipeline falló en alguna fase. Ver log en n8n | Sistema automático |
| `Canibalismo` | La keyword es demasiado similar a un artículo existente. La columna H indica cuál | Sistema automático |
| `Re-optimizar` | Post identificado por GSC como candidato a mejora (Fase D — próxima implementación) | Sistema automático |

---

## Cómo iniciar una publicación

1. Abrir el Master Sheet
2. Agregar una fila con la keyword y sus metadatos
3. Cambiar la columna `estado` a **`Aprobado`**
4. El sistema lo detecta automáticamente en la siguiente ejecución programada y hace todo lo demás

No hay más pasos manuales. El artículo aparecerá publicado en el blog y el Sheet se actualizará solo.

---

## El flujo paso a paso

### Trigger — ¿Cuándo se ejecuta?

El pipeline corre automáticamente **una vez al día a las 8am, los días lunes, miércoles y viernes**. Por ejecución se procesa **exactamente una keyword** — si hay varias en estado "Aprobado", se publica una por día en orden de prioridad. Si no hay ninguna, el flujo termina silenciosamente.

---

### Paso 0 — Auto-priorización estacional (antes de buscar "Aprobadas")

Antes de buscar keywords en estado "Aprobado", el pipeline verifica si hay alguna keyword estacional urgente que debería activarse automáticamente.

**Cómo funciona:**
1. Lee todas las filas del Sheet con `estado = "Pendiente"` que tengan una `fecha_objetivo` definida
2. Verifica si alguna tiene `fecha_objetivo` dentro de los próximos 14 días
3. Si la hay, cambia su estado automáticamente a `"Aprobado"` en el Sheet y la prioriza en la cola de ese día
4. Si no hay ninguna urgente, continúa al siguiente paso normalmente

**Ejemplo:** Si el 20 de julio detecta que "gatos negros Halloween mitos" tiene `fecha_objetivo = 2026-10-17` (17 de octubre, 14 días antes de Halloween), cambia su estado a "Aprobado" y ese día se publica ese artículo — aunque haya otras keywords en la cola.

**Columna `fecha_social`:** Para keywords estacionales, el blog se publica con anticipación (para SEO), pero las redes sociales se activan el día del evento real. Esta fecha queda registrada en la columna K del Sheet. La Fase B-2 la usa para detectar cuándo publicar en Instagram y Facebook.

---

### Paso 1 — Verificar si hay keyword para procesar

El sistema lee el Sheet buscando filas con `estado = "Aprobado"`. Si encuentra alguna, toma la primera (priorizando las que tienen `fecha_objetivo` definida). Si no hay ninguna, el flujo termina silenciosamente.

---

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

---

### Paso 3 — Marcar en proceso

Actualiza la fila en el Sheet a `"En proceso"`. Esto sirve para que el equipo pueda ver en tiempo real qué está siendo procesado.

---

### Paso 4 — Construir el body del request GPT (Code node bf-node-023)

Antes de llamar a la API de OpenAI, un Code node pre-serializa el prompt completo con `JSON.stringify`. Esto resuelve dos problemas críticos de n8n: (1) el límite de tamaño de item (~4KB) que descarta campos grandes al interpolarlos en expresiones, y (2) la corrupción del JSON al incluir el contexto de posts publicados (que contiene saltos de línea y comillas).

El output es `{ gpt_body_json: "{ ... }" }` — un string JSON que el siguiente nodo inyecta directamente como body del request HTTP.

---

### Paso 5 — Generar el artículo (GPT-4o)

Este es el paso central. GPT-4o recibe un prompt extenso con:

- La keyword y la intención de búsqueda
- La lista completa de posts ya publicados (para crear enlaces internos reales)
- Las reglas de la marca Bigotes Felinos (tono Vet-Friend, vocabulario obligatorio y prohibido)
- Los criterios SEO técnicos obligatorios

**GPT-4o devuelve un JSON estructurado con:**

| Campo | Contenido |
|-------|-----------|
| `titulo_seo` | H1 conversacional para el usuario |
| `seo_title` | Título para Google (máx. 60 caracteres, optimizado para CTR) |
| `meta_description` | Descripción para el SERP (130-145 caracteres) |
| `categoria` | Una de las 5 categorías de WordPress |
| `body_html` | El artículo completo en HTML (mínimo 1.800 palabras) |
| `faq_items` | Array de 4-6 preguntas y respuestas (para schema FAQ) |
| `tags` | Array de 4-6 tags para WordPress |
| `prompt_imagen` | Instrucciones en inglés para generar la imagen |

**Qué incluye el artículo generado:**
- Keyword principal en los primeros 100 caracteres
- Mínimo 6 secciones H2, cada una con al menos 4 párrafos
- Al menos 3 H2 con 2 subsecciones H3
- 2-3 enlaces internos reales a artículos existentes del blog
- 1 enlace externo a fuente autoritativa (WSAVA, AVMA, PubMed u organización veterinaria oficial)
- Sección FAQ generada desde los campos `faq_items` (no embebida en el HTML, sino procesada por separado para el schema)
- Vocabulario de marca consistente (gatitos, peluditos, padres gatunos...)

---

### Paso 5 — Procesar el artículo (Code node)

Un nodo de código procesa la respuesta de GPT y prepara los datos para los siguientes pasos:

- Capitaliza la primera letra del título y de todos los H2/H3
- Añade los signos de interrogación españoles (¿?) donde corresponde
- Detecta y asigna el ID de categoría correcto de WordPress
- Genera el slug limpio desde la keyword (sin acentos, sin caracteres especiales)
- Trunca la meta description a máximo 145 caracteres
- Construye el HTML de la sección FAQ desde `faq_items`
- Genera el **FAQPage JSON-LD** (schema de Google para rich snippets en el SERP) y lo agrega al final del artículo
- Prepara el payload para WordPress y el payload para Gemini

---

### Paso 6 — Generar la imagen (Gemini / nano banana)

Llama a la API de Google Gemini (`gemini-2.5-flash-image`) con el prompt generado por GPT-4o.

**Configuración de la imagen:**
- Formato: 16:9 (horizontal, ideal para header de blog)
- Estilo: fotografía realista, lente 85mm, luz cálida de golden hour
- Sin humanización del gato (sin ropa, sin accesorios, sin poses forzadas)

La API devuelve la imagen en formato base64.

---

### Paso 7 — Preparar y subir la imagen a WordPress

Un nodo de código convierte el base64 en un buffer binario con el mime type correcto. Luego se sube a la Media Library de WordPress vía REST API.

Inmediatamente después, se hace un segundo llamado a WordPress para asignarle el **alt text** a la imagen (la keyword del artículo), que es un campo SEO importante.

El resultado es el `media_id` (ID interno de WordPress) que se usará como imagen destacada del post.

---

### Paso 8 — Publicar el post en WordPress

Se hace una llamada a la REST API de WordPress con el artículo completo:

| Campo WordPress | Valor |
|----------------|-------|
| `title` | Título capitalizado |
| `slug` | Keyword convertida a slug limpio (ej: `cuanto-cuesta-esterilizar-un-gato`) |
| `content` | HTML del artículo + FAQ HTML + FAQPage JSON-LD |
| `excerpt` | Meta description |
| `status` | `publish` (se publica directamente, sin revisión) |
| `categories` | ID de la categoría correcta en WordPress |
| `featured_media` | ID de la imagen generada en el paso anterior |
| `meta._yoast_wpseo_title` | Título SEO para Yoast |
| `meta._yoast_wpseo_metadesc` | Meta description para Yoast |
| `meta._yoast_wpseo_focuskw` | Keyword principal para Yoast |

---

### Paso 9 — Tags y actualización del Sheet (en paralelo con el Paso 10)

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

---

### Paso 10 — Notificación Telegram

Tras publicar y indexar, el bot `@bigotesfelinos_pipeline_bot` envía un mensaje con el título, la URL y la keyword al chat del equipo. Si cualquier paso anterior falla, el **Error Trigger** captura la excepción, actualiza el Sheet a `"Error"` y envía una notificación de error con el detalle de qué fase falló.

---

### Si algo falla en cualquier paso

El nodo **Error Trigger** (bf-node-014) captura cualquier excepción no controlada. Ejecuta en paralelo:
- Actualiza el Sheet a `"Error"`
- Envía notificación Telegram con keyword + fase + detalle del error

---

## Diagrama del flujo completo

```
┌──────────────────────────────────────────────────────────────────┐
│  Schedule Trigger: 8am — Lunes, Miércoles y Viernes              │
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
        Tomar PRIMERA keyword´
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
                    │  artículo + FAQ +      │
                    │  tags + prompt imagen  │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Code node:            │
                    │  - Capitalización      │
                    │  - Slug limpio         │
                    │  - FAQ HTML + JSON-LD  │
                    │  - Payload WP listo    │
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

## Optimizaciones SEO implementadas

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

---

## Fase B-2 — Paquete de Redes Sociales

**Workflow:** `Bigotes Felinos - Fase B-2 Paquete Social` (ID: `3PWQY3biRhOyN1IA`) · **10 nodos** · ✅ Activo — publicación **manual**

### ¿Cuándo se ejecuta?

Corre **todos los días a las 10am Colombia (15:00 UTC)**. Detecta automáticamente qué artículos generar:

- **Estacionales:** filas donde `fecha_social = hoy` (cualquier día de la semana)
- **Regulares:** filas `Publicado` con columna L vacía, hoy es L/M/V

Si no hay candidatos, el workflow termina silenciosamente.

### Estrategia de contenido por plataforma

Cada artículo genera **4 piezas distintas**, no el mismo texto reformateado. Cada una está optimizada para la señal que premia su algoritmo:

GPT-4o genera **10 campos granulares** por artículo. Cada campo es inmediatamente usable en CapCut sin edición adicional.

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

Los 10 campos se consolidan en las 4 columnas del Sheet con separadores visuales (🎣 💡 📝 etc.) para facilitar el uso directo en CapCut. **La publicación en todas las plataformas es manual** — el equipo usa los scripts del Sheet para grabar y publicar.

### Flujo de cada artículo

```
Sheet: fila "Publicado" candidata para hoy
        ↓
GPT-4o → 10 campos granulares (3 IG + 2 FB + 3 TT + 2 YT)
        ↓
Sheet batchUpdate → columnas L (Instagram), M (Facebook), N (TikTok), P (YouTube)
        ↓
Telegram → notificación con keyword + título
```

### Estado de publicación por plataforma

| Plataforma | Estado | Detalle |
|-----------|--------|---------|
| Instagram | 📋 Manual | Caption + hook + tips en columna L. Publicación manual en la app |
| Facebook | 📋 Manual | Post AIDA + guión de voz en columna M. Publicación manual en la página |
| TikTok | 📋 Manual | Hook + script + bait en columna N. Grabar en CapCut y publicar |
| YouTube Shorts | 📋 Manual | Script storytelling + CTA en columna P. Grabar en CapCut y publicar |

---

## Pilar Entretenimiento

**Workflow:** `Bigotes Felinos - Pilar Entretenimiento` (ID: `ylPUrgrgbL1wLnQ2`) · **10 nodos** · ✅ Activo

### ¿Qué es?

Cubre el 20% de la estrategia editorial (Entretenimiento). Genera contenido viral/humor semanal desde un **banco de situaciones** en el Sheet, sin depender del pipeline de blog. El contenido nace de observaciones reales del comportamiento felino — el humor es reconocimiento, no exageración.

### ¿Cuándo se ejecuta?

Cada **sábado a las 10am Colombia (15:00 UTC)**, cron `0 15 * * 6`.

### Banco de situaciones — hoja `Entretenimiento`

| Columna | Campo | Descripción |
|---------|-------|-------------|
| A | `situacion` | La situación cómica a trabajar (ej: "el gato ignora el juguete caro y juega con la caja") |
| B | `estado` | `Pendiente` → `Listo` |
| C | `fecha` | Fecha de generación automática |
| D | `col_instagram` | Hook visual + caption IG + Stories Poll |
| E | `col_facebook` | Post Facebook con CTA de comentarios |
| F | `col_tiktok` | Hook + script + bait para TikTok |
| G | `col_youtube` | Script storytelling para YouTube Shorts |

### Estructura viral (3 pasos)

Cada pieza de entretenimiento sigue la mecánica de viralización:
1. **Reconocimiento** — "Sí, mi gato también hace eso"
2. **Identificación** — compartir para que otros digan lo mismo
3. **Impulso de compartir** — el contenido les representa, lo reenvían

### Flujo

```
Sheet Entretenimiento: fila "Pendiente"
        ↓
GPT-4o → 6 campos (ig_hook_visual, ig_caption, fb_post, tt_hook, tt_script, yt_script)
        ↓
Sheet batchUpdate → columnas D, E, F, G + estado="Listo" + fecha
        ↓
Telegram → notificación con situación + fecha
```

---

## Credenciales y accesos

Todas las credenciales están almacenadas en el sistema cifrado de n8n. **Nunca se almacenan en texto plano.** El archivo `.env` del proyecto es solo documentación de referencia.

| Servicio | Credencial en n8n | ID |
|---------|------------------|----|
| WordPress | `Wordpress account` | `r90z9yKyuuNlhBLy` |
| OpenAI | `N8N_BigotesFelinos` | `sZscccSGx3nfNyOm` |
| Google Sheets | `Google Sheets account` | `70heM3IFsNK9Cyak` |
| Gemini (imágenes) | `nano banana` | `ysOycTrtxEO3BRcW` |
| Telegram | `Telegram BF Bot` | `7iBygAb1uGxktnFH` |

---

## Pendientes de activación

| Funcionalidad | Estado | Detalle |
|--------------|--------|---------|
| Pipeline Blog (31 nodos) | ✅ 2026-04-25 | 5 artículos publicados. Todos los pasos funcionales. Activo L/M/V 8am |
| Tags automáticos | ✅ 2026-04-25 | Cadena de 4 HTTP nodes — creación y asignación funcionando |
| strip4Byte en bf-node-006 | ✅ 2026-04-25 | Sanitiza Unicode 4-byte (math bold de GPT) que rompe MySQL utf8 |
| Auto-priorización estacional | ✅ 2026-04-25 | bf-node-s1…s4 detectan `fecha_objetivo` en ≤14 días → auto-Aprobado |
| Fase B-2 (10 nodos) | ✅ 2026-04-27 | ID `3PWQY3biRhOyN1IA`. GPT genera 10 campos CapCut-ready. Publicación manual. Sheet cols L/M/N/P |
| Pilar Entretenimiento (10 nodos) | ✅ 2026-04-27 | ID `ylPUrgrgbL1wLnQ2`. Sábados 10am. Banco de situaciones en hoja Entretenimiento |
| Google Indexing API | ✅ Descartada 2026-04-25 | JWT RS256 funciona pero GSC UI no acepta SA como Owner. Indexación natural via Yoast |
| **Fase D — Re-optimización GSC** | 🟠 Próxima | GSC API → posts posición 6-20 con CTR bajo → GPT mejora título/meta → WP update. Datos disponibles (106 posts + meses de historial en GSC) |
| **TikTok / YouTube Shorts — video** | 🟠 Futura | Scripts en cols N y P. Publicación manual por CapCut. Automatizar cuando se decida servicio de video |

---

## Archivos del proyecto

```
bigotes-felinos/
├── CLAUDE.md                        ← Instrucciones para Claude Code
├── .env                             ← Referencia de variables (no contiene valores reales)
├── _contexto/
│   ├── FLUJO_COMPLETO.md            ← Este documento
│   ├── ESTRATEGIA_NEGOCIO.md        ← Visión, pilares y arquitectura editorial
│   └── auditoria_estrategia.md      ← Auditoría digital del sitio (2026-04-23)
├── _brandkit/
│   └── IDENTIDAD_VOZ.md             ← Personalidad, tono y diccionario de marca
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt     ← Estructuras y skills de producción
└── _config/
    └── INTEGRACIONES_TECNICAS.md    ← Endpoints, APIs y configuración técnica
```

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
| 2026-04-24 | Google Indexing API: bf-node-025 con JWT via Web Crypto API (sin `require`) |
| 2026-04-24 | Telegram: bot `@bigotesfelinos_pipeline_bot` activo — nodos bf-node-020 y bf-node-022 |
| 2026-04-24 | Bloque B técnico: robots.txt físico, redirect 301, Schema Organization+BreadcrumbList en Yoast |
| 2026-04-24 | bf-node-023 (Construir Body GPT): pre-serialización con JSON.stringify para evitar corrupción |
| 2026-04-25 | Google Indexing API: reescrito con pure-JS (SHA-256 + DER parser + RSA modpow BigInt). Web Crypto API y `require('crypto')` bloqueados en sandbox n8n |
| 2026-04-25 | Schedule cambiado de cada hora a una vez al día a las 8am (cron: `0 8 * * 1,3,5`) |
| 2026-04-25 | bf-node-003b: una sola keyword por ejecución, prioriza estacionales con fecha_objetivo |
| 2026-04-25 | Auto-priorización estacional: bf-node-s1…s4 detectan keywords estacionales con fecha_objetivo en ≤14 días y las marcan "Aprobado" automáticamente |
| 2026-04-25 | Master Sheet: columnas fecha_objetivo (K) y fecha_social (L) añadidas. ~143 keywords cargadas incluyendo 10 estacionales con fechas |
| 2026-04-25 | Decisión arquitectónica: blog estacional publica antes (SEO), redes sociales publican en fecha real del evento (fecha_social) — desacoplados |
| 2026-04-25 | strip4Byte en bf-node-006: GPT genera caracteres Unicode 4-byte (math bold) que MySQL utf8 no soporta → db_insert_error. Función strip4Byte() añadida |
| 2026-04-25 | Google Indexing API eliminada del pipeline: JWT RS256 pure-JS funciona (token OK), pero GSC UI no acepta service accounts como Owner. Sitemap ping (/ping) deprecado ene/2024. Nodo bf-node-025 eliminado. Indexación natural via sitemap Yoast |
| 2026-04-25 | Pipeline validado end-to-end: 5 artículos publicados sin errores. 31 nodos. Listo para producción autónoma |
| 2026-04-26 | Fase B-2 creada: workflow `3PWQY3biRhOyN1IA` (17 nodos). GPT genera 4 copies diferenciados: Instagram (guardados), Facebook (comentarios), TikTok (completado), YouTube Shorts (suscripciones). Sheet actualizado con columna P=guion_youtube |
| 2026-04-27 | Fase B-2 reestructurada: publicación 100% manual. Nodos bf2-007 a bf2-014 (Meta) eliminados. Flujo activo: 10 nodos. GPT genera 10 campos granulares CapCut-ready (3 IG + 2 FB + 3 TT + 2 YT) |
| 2026-04-27 | Vocabulario: "michi/michis" eliminado de todos los prompts y documentación. VOCABULARIO OBLIGATORIO actualizado |
| 2026-04-27 | Imagen del blog: arquitectura dos pasos — GPT escribe descripción de escena (≤20 palabras, inglés), bf-node-006 añade specs técnicas fijas de fotografía (85mm, bokeh, 16:9) |
| 2026-04-27 | Pilar Entretenimiento: workflow `ylPUrgrgbL1wLnQ2` creado (10 nodos). Sábados 10am Colombia. Banco de situaciones en hoja Entretenimiento del Sheet |
| 2026-04-27 | Fase D confirmada como próxima: 106 posts con historial real en GSC. Propiedad bigotesfelinos.com verificada con acceso del equipo |
