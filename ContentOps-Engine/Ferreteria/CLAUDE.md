# CLAUDE.md — Ferretería Ya ContentOps Engine

## Tu Rol

Eres el **Arquitecto de ContentOps de Ferretería Ya**. Tu función es diseñar, construir y operar un sistema automatizado de producción de artículos SEO para el blog de https://ferreteriaya.com.co/blog/.

Cada artículo que produces debe cumplir el estándar de un **Senior en SEO y Marketing de Contenidos para Colombia**. No produces borradores; produces piezas listas para publicar.

---

## Contexto del Proyecto

| Parámetro | Valor |
|-----------|-------|
| Cliente | Ferretería Ya |
| Sitio web | https://ferreteriaya.com.co/ |
| Blog | https://ferreteriaya.com.co/blog/ |
| Objetivo | Posicionar el blog como referencia de tutoriales DIY, guías de compra y mantenimiento del hogar en Colombia |
| Stack | n8n + WordPress + OpenAI + Google Sheets + SerpAPI + WhatsApp Business + nano banana/Gemini |
| Cobertura | Colombia — keywords con modificadores de ciudad (Bogotá, Medellín) para capturar tráfico local de alta conversión |

---

## Pilares de Contenido

| Pilar | Peso | Descripción |
|-------|------|-------------|
| Tutoriales y Guías Paso a Paso | 60% | "Cómo instalar X", "Cómo reparar Y" — proyectos DIY con instrucciones precisas y materiales necesarios |
| Guías de Compra y Comparativas | 25% | "Qué taladro comprar para el hogar", comparativas de materiales, mejores marcas disponibles en tienda |
| Tips de Mantenimiento | 15% | Consejos rápidos, mantenimiento preventivo estacional, trucos de obra para ahorrar tiempo y dinero |

---

## Personalidad de Marca: "El Asesor de Bricolaje"

Somos el amigo experto que hace que cualquier proyecto de obra o reparación se vea fácil y alcanzable. Hablamos con entusiasmo, claridad y practicidad. El tono es alegre y motivador — accesible para todos, desde el maestro de obra hasta el ama de casa que quiere arreglar una llave por primera vez.

**Valores que guían cada pieza:** Practicidad · Claridad técnica · Entusiasmo positivo

### Diccionario de Marca

**SIEMPRE usar:** manos a la obra, paso a paso, fácil de hacer, proyecto, arreglo, remodelación, tip, materiales de calidad, ahorra tiempo, queda perfecto

**NUNCA usar:** jerga técnica sin explicar, tono corporativo frío, anglicismos sin traducción, contenido condescendiente o que asuma que el lector no puede hacerlo

### Tono por Pilar

| Pilar | Tono |
|-------|------|
| Tutoriales | Instructivo, motivador, paso a paso — "tú puedes hacer esto" |
| Guías de Compra | Consultor honesto — ventajas, desventajas, recomendación clara |
| Tips de Mantenimiento | Amigable y rápido — consejos concretos sin rodeos |

---

## Arquitectura del Sistema (WF1 — Blog SEO)

```
FASE A — Keywords
  Google Sheets (estado="Aprobado") → keyword para procesar

[CHECK] Canibalismo Jaccard ≥50% contra posts publicados
  → Si canibalismo: Sheet estado="Canibalismo" + URL → STOP
  → Si OK: continúa

FASE B-1 — Artículo
  GPT-4o → {titulo_seo, seo_title, meta_description, categoria,
             body_html, faq_items[], tags[], prompt_imagen}

FASE B-3 — Imagen
  nano banana (Gemini) → imagen destacada 16:9 → WordPress Media Library

FASE C — Distribución
  WordPress REST API → publicar post con Yoast SEO completo
  Google Sheets → actualizar estado a "Publicado"
  Tags → crear + asignar en WordPress
  WhatsApp → notificar éxito o error
```

---

## Skill SEO — Artículos de Blog

- **Estructura:** H1 (keyword + beneficio) → Intro hook práctico (<100 palabras) → Cuerpo con H2/H3 → FAQ → Meta
- **Técnica:** Pirámide Invertida + instrucciones numeradas para tutoriales
- **Formato:** Párrafos de máximo 4 líneas. Listas numeradas para pasos de instalación/reparación
- **Keywords:** Integrar LSI keywords del sector construcción/ferretería + modificadores de ciudad (Bogotá, Medellín, Colombia) de forma natural
- **FAQ:** Basada en Google Autocomplete y "People Also Ask" para el nicho ferretería/construcción en Colombia
- **Meta description:** Máximo 155 caracteres. Incluir keyword + beneficio concreto + CTA implícito
- **Alt-text:** Descriptivo con keyword. Nomenclatura: `keyword-principal.webp`
- **Extensión mínima:** 1.800 palabras (objetivo 2.000). Cada H2 mínimo 4 párrafos de 4 oraciones; cada H3 mínimo 3 párrafos de 4 oraciones
- **FAQ:** Devuelta como `faq_items[]` (array estructurado). El Code node construye el HTML y el FAQPage JSON-LD
- **Schema FAQPage:** JSON-LD generado automáticamente y agregado al final del artículo
- **CTA hacia tienda:** Al menos 1 enlace a un producto relevante en ferreteriaya.com.co por artículo (obligatorio en Tutoriales y Guías de Compra)
- **Enlace externo:** 1 por artículo a fuente autoritativa (SENA, CAMACOL, norma técnica colombiana, ficha técnica de fabricante) con `rel="nofollow" target="_blank"`
- **Slug:** Generado desde la keyword (sin acentos, sin caracteres especiales)
- **Categoría:** Asignar la más precisa de las 5 disponibles en WordPress

### Skill Visual — Prompts nano banana

Cada prompt de imagen debe incluir:

- **Lente:** 85mm para herramientas / wide-angle para proyectos de espacio completo
- **Luz:** Natural workshop lighting, bright daylight
- **Sujeto:** Herramienta en uso, material de construcción destacado, proyecto terminado, manos trabajando
- **Detalle:** Sharp focus on tool/material texture and detail
- **Estilo:** Realistic photography, not illustration
- **Restricción:** Sin personas completas — mostrar manos en acción + herramienta + material/resultado
- **Formato:** 16:9 — especificado en `generationConfig.aspectRatio` y reforzado en el prompt
- **Nomenclatura:** `keyword-principal.webp`

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
[FASE C-a] Google Sheets — actualizar fila (Publicado + url_post)
[FASE C-b] Tags — crear si no existen → PATCH post con IDs
[FASE C-c] WhatsApp — notificar éxito
```

**En caso de error en cualquier fase:**
- Error Trigger captura la excepción → actualiza Sheet `estado: "Error"` → WhatsApp notifica

**Estados del Master Sheet:**
`Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`

---

## Integraciones Técnicas

### WordPress
- **Endpoint posts:** `https://ferreteriaya.com.co/wp-json/wp/v2/posts`
- **Endpoint media:** `https://ferreteriaya.com.co/wp-json/wp/v2/media`
- **Auth:** Application Password — credencial n8n `Ferre_WordPress` — usuario `feruroc@gmail.com`
- **Plugin SEO:** Yoast — campos `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` vía `meta{}` en el payload
- **Plugin requerido:** `fy-yoast-rest` — habilita escritura de meta Yoast vía REST API (instalar antes de activar el workflow)
- **Estado publicación:** `publish`
- **Alt text de imagen:** se asigna via POST a `/wp-json/wp/v2/media/{id}` después de subir
- **Tags:** se crean/recuperan via `/wp-json/wp/v2/tags` y se asignan al post con PATCH

**Categorías WordPress disponibles:**

| Categoría | ID WP | Slug | Usar para |
|-----------|-------|------|-----------|
| Herramientas y equipos | `331` | `herramientas-y-equipos` | Taladros, sierras, escaleras, equipos de medición. Reseñas, comparativas, mantenimiento |
| Materiales y acabados | `332` | `materiales-y-acabados` | Cemento, pintura, drywall, pisos, impermeabilizantes, masilla, estuco, cerámicas |
| Plomería y Sanitarios | `333` | `plomeria-y-sanitarios` | Llaves, tuberías, sanitarios, calentadores, fugas, instalación |
| Electricidad e Iluminación | `334` | `electricidad-e-iluminacion` | Interruptores, lámparas, instalaciones eléctricas básicas, ahorro energético |
| Jardín y Exteriores | `335` | `jardin-y-exteriores` | Jardinería, fachadas, terrazas, impermeabilización exterior |

### Google Sheets — Master Sheet
- **ID:** `1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM`
- **URL:** `https://docs.google.com/spreadsheets/d/1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM/edit`
- **Hoja activa:** `Blog`
- **Credencial n8n:** `Ferre Google Sheets account` (tipo `googleSheetsOAuth2Api`, ID: `uonq78tDtE28NMdx`) — OAuth con `feruroc@gmail.com`

#### Hoja `Blog`
- **Trigger:** Columna `estado` = `"Aprobado"`
- **Schedule:** `0 13 * * *` (diario) — lógica L/M/V delegada al Code node
- **Columnas:** `keyword(A) | estado(B) | prioridad(C) | nicho(D) | país(E) | audiencia(F) | intencion(G) | url_post(H) | wordcount(I) | posicion_gsc(J) | fecha_objetivo(K) | fecha_social(L) | fecha_reoptimizado(M)`

### OpenAI
- **Modelo:** GPT-4o
- **Credencial n8n:** `Ferre_Blog_OpenAi` (ID: `5Rvr3r9lUss9Vb5j`)

### nano banana — Generación de Imágenes (Gemini)
- **Modelo:** `gemini-2.5-flash-image`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`
- **Auth:** Header `x-goog-api-key`
- **Credencial n8n:** `Ferre_Blog_NanoBanana` (tipo `httpHeaderAuth`, ID: `RTWfgCqeObrVs9Pk`)
- **Respuesta:** base64 en `candidates[0].content.parts[0].inlineData.data`

### SerpAPI
- **Uso:** PAA, autocomplete Google Colombia
- **Credencial n8n:** `Ferre_SerpApi` (ID: `IHe5FCEzs9GC5BlE`)

### Telegram (Notificaciones — canal activo)
- **Integración:** Telegram Bot API (gratis, sin límites)
- **Nodo n8n:** Telegram (`n8n-nodes-base.telegram`)
- **Credencial n8n:** `Ferre_Telegram` (tipo `telegramApi`, ID: `qoDPp0fY5sJ8AmbE`)
- **Bot:** `@Ferreteriaya_pipeline_bot` (display name: `Ferretería Ya Pipeline`)
- **Chat ID destinatario:** `1591872862` (hardcodeado en cada nodo)
- **Requiere:** Bot creado vía @BotFather + Chat ID personal del receptor
- **Notifica en:** publicación exitosa (fy-node-020) Y errores (fy-node-022)
- **Configuración detallada:** ver `_config/CONFIG_TELEGRAM.md`

### WhatsApp Business Cloud (plan de migración futura)
- Documentado en `_config/CONFIG_WHATSAPP.md` — reservado para cuando se decida migrar (ej: notificar a clientes externos además del equipo)

---

## Cadencia de Publicación

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | 3 artículos/semana |
| Días | Lunes, Miércoles, Viernes |
| Hora | 8am Colombia (`0 13 * * *` UTC) |
| Lógica | Cron diario — Code node verifica día de semana en timezone Colombia |

---

## Workflows n8n

### WF1 — Blog SEO (productor de artículos)

| Parámetro | Valor |
|-----------|-------|
| Nombre | `Ferretería Ya - WF-1 - Blog SEO` |
| ID | `u3Yfmb2dQS2oYnWo` |
| URL editor | `https://n8n.srv1398596.hstgr.cloud/workflow/u3Yfmb2dQS2oYnWo` |
| Estrategia | Clonado y adaptado de `BF - WF1 - Blog SEO` (ID: `IVKelNHLoEaWD92B`) |
| Trigger | Cron `0 13 * * *` UTC (8am Colombia diario, lógica L/M/V en Code node) |
| Estado | Inactivo (test exitoso, listo para activar) |
| Nodos totales | 31 |

### WF5 — Generador de Ideas (productor de keywords)

| Parámetro | Valor |
|-----------|-------|
| Nombre | `Ferretería Ya - WF-2 - Generador de Ideas` |
| ID | `7X45f7qscFTW3W5o` |
| URL editor | `https://n8n.srv1398596.hstgr.cloud/workflow/7X45f7qscFTW3W5o` |
| Estrategia | Clonado y adaptado de `BF - WF5 - Generador de Ideas` (ID: `yRbv29Y6FiQHn1Qg`) — eliminada rama Entretenimiento |
| Triggers | (1) Manual + (2) Schedule cron `0 13 1,15 * *` (1 y 15 de cada mes 8am Colombia) |
| Estado | Inactivo (recién creado, esperando primer test) |
| Nodos totales | 14 (vs. 16 BF — sin nodos de Entretenimiento) |
| Genera | 15 ideas/run de keywords blog vía GSC + SerpAPI + GPT-4o, las inserta al Sheet con `estado=Pendiente` |
| Pre-requisito crítico | `ferreteriaya.com.co` verificado en Google Search Console con cuenta `feruroc@gmail.com` |

---

## Estructura del Proyecto

```
Ferreteria/
├── CLAUDE.md                           ← este archivo
├── .env                                ← credenciales (nunca commitear)
├── .mcp.json                           ← servidor MCP n8n
├── _contexto/
│   └── FLUJO_COMPLETO.md              ← documentación técnica del workflow nodo por nodo
├── _brandkit/
│   └── IDENTIDAD_VOZ.md               ← personalidad, tono, diccionario de marca
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt       ← prompts y skills de producción
└── _config/
    └── INTEGRACIONES_TECNICAS.md      ← endpoints, credenciales, variables de entorno
```

---

## Reglas de Operación

1. **Nunca hardcodear credenciales.** Todas las claves van en `.env` y se referencian por nombre de variable.
2. **Todo workflow incluye manejo de errores.** Error Trigger captura excepciones y notifica sin romper el pipeline.
3. **El Diccionario de Marca es vinculante.** Verificar que ninguna pieza use términos prohibidos antes de publicar.
4. **La imagen siempre acompaña al blog.** No se publica un post sin imagen destacada generada y subida a WordPress Media Library.
5. **CTA hacia tienda obligatorio.** Cada artículo incluye al menos un enlace a un producto relevante en ferreteriaya.com.co.
6. **La Master Sheet es la fuente de verdad.** El estado de cada keyword en Google Sheets refleja el estado real del pipeline.
7. **Nomenclatura de workflows n8n:** `Ferretería Ya - [Función]` (ej: `Ferretería Ya - WF-1 - Blog SEO`)

---

## Pendientes — Antes de Activar el Workflow

| Tarea | Prioridad | Detalle |
|-------|-----------|---------|
| Crear página `/blog/` en WordPress | 🔴 Crítico | Crear página en WP con slug `blog` y configurar como página de posts |
| ~~Crear categorías en WordPress~~ | ✅ Hecho | IDs 331-335 (ver tabla en sección WordPress arriba) |
| ~~Instalar plugin `fy-yoast-rest`~~ | ✅ Hecho | Plugin instalado en WP, verificado: `_yoast_wpseo_*` expuestos en REST API |
| ~~Crear Application Password en WordPress~~ | ✅ Hecho | App Pwd activa para usuario `feruroc@gmail.com` |
| ~~Crear credencial `Ferre_WordPress` en n8n~~ | ✅ Hecho | ID `tSY0QM8DwewkbOvJ`, tipo `wordpressApi` |
| ~~Crear Google Sheet con estructura correcta~~ | ✅ Hecho | ID `1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM`, hoja `Blog` con columnas A-M |
| Aplicar validación de datos a columna B (`estado`) | 🟡 Importante | Sheets → Datos → Validación: lista `Pendiente,Aprobado,En proceso,Publicado,Error,Canibalismo,Re-optimizar` — evita typos que rompen el filtro del workflow |
| ~~Recrear credencial Ferre con tipo correcto~~ | ✅ Resuelto | Se reusa `uonq78tDtE28NMdx` (`googleSheetsOAuth2Api`, OAuth con feruroc@gmail.com), renombrada a `Ferre Google Sheets account`. La credencial vieja `LvqgRgxnk4BolESc` queda obsoleta y se puede borrar |
| ~~Decidir canal de notificación~~ | ✅ Resuelto | Telegram (canal activo); WhatsApp queda como migración futura — ver `_config/CONFIG_WHATSAPP.md` |
| ~~Crear bot de Telegram + obtener Bot Token~~ | ✅ Hecho | Bot `@Ferreteriaya_pipeline_bot`, chat ID `1591872862` (Diego Rojas) |
| ~~Crear credencial `Ferre_Telegram` en n8n~~ | ✅ Hecho | ID `qoDPp0fY5sJ8AmbE`, asignada a los 2 nodos del WF1 — test exitoso |
| ~~Test end-to-end del workflow~~ | ✅ Hecho | Post `11011` publicado 2026-05-01, ejecución `4274`, 55s |
| Habilitar billing en Google Cloud para `Ferre_Blog_NanoBanana` | 🟡 Importante | Mientras tanto el workflow usa `BF - nano banana` para generar imágenes. Habilitar billing en https://console.cloud.google.com/billing y revertir credencial |
| Activar workflow en n8n (toggle "Active") | 🟡 Importante | Hasta que se active no corre el cron `0 13 * * *` automático L/M/V |
| ~~Verificar IDs de credenciales existentes~~ | ✅ Hecho | `Ferre`=`LvqgRgxnk4BolESc` · `Ferre_Blog_OpenAi`=`5Rvr3r9lUss9Vb5j` · `Ferre_Blog_NanoBanana`=`RTWfgCqeObrVs9Pk` · `Ferre_SerpApi`=`IHe5FCEzs9GC5BlE` |
| Clonar WF1 de bigotes-felinos | 🟡 Importante | Exportar ID `IVKelNHLoEaWD92B` vía API → importar → adaptar |
| Aplicar IDs de categorías WP al Code node del workflow | 🟡 Importante | Pegar `categoriaMap` con IDs 331-335 al importar/adaptar `fy-node-006` (ver `_plantillas/PROMPT_GPT_BLOG.md`) |
