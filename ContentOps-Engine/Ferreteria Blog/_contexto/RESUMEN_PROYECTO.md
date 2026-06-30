# Ferretería Ya — ContentOps Engine: Resumen del Proyecto

**Última actualización:** 2026-05-01

---

## ¿Qué es esto?

Un sistema de automatización de contenido construido en n8n que produce artículos de blog SEO de forma automática para **ferreteriaya.com.co**, e-commerce de ferretería y materiales de construcción en Colombia.

El equipo decide qué keywords trabajar. El sistema se encarga de escribir, generar imagen, publicar en WordPress y notificar — sin intervención humana.

---

## El problema que resuelve

Ferretería Ya necesita posicionar su blog como referencia de **tutoriales DIY, guías de compra y mantenimiento del hogar** en Colombia, capturando tráfico orgánico de alta intención de compra (gente que busca "cómo instalar X" termina necesitando comprar materiales).

Producir contenido SEO de calidad senior a 3 artículos/semana de forma manual cuesta tiempo y dinero. El sistema reduce ese costo a ~$0.76/mes en APIs y elimina el trabajo operativo, dejando al equipo solo la decisión editorial: qué keywords trabajar.

---

## El workflow

### WF1 — Blog SEO: Keyword → Publicar en WordPress
**¿Qué hace?** Toma una keyword aprobada en el Sheet y publica un artículo completo en WordPress de forma automática.
**¿Cuándo corre?** Lunes, miércoles y viernes a las 8am Colombia.
**Resultado:** Artículo publicado en `https://ferreteriaya.com.co/blog/` con imagen destacada 16:9, SEO Yoast configurado, FAQ con schema, tags y enlace a tienda.
**n8n ID:** `u3Yfmb2dQS2oYnWo`

### WF5 — Generador de Ideas: GSC + SerpAPI → Keywords nuevas
**¿Qué hace?** Consulta Google Search Console + SerpAPI Colombia, y le pide a GPT-4o que genere 15 keywords nuevas para el blog. Descarta duplicados con Jaccard ≥50% e inserta en el Sheet con `estado=Pendiente`.
**¿Cuándo corre?** Manual (a demanda) + automático cada 1 y 15 de cada mes a las 8am Colombia.
**Resultado:** 10-15 nuevas filas en el Sheet `Blog` que el equipo revisa y aprueba (cambia a `Aprobado`) las que quiere publicar.
**n8n ID:** `7X45f7qscFTW3W5o`

> Estos son los workflows activos del proyecto. La arquitectura está diseñada para extenderse a Redes Sociales y Re-optimización en el futuro, replicando el modelo probado en bigotes-felinos.

---

## Qué tecnologías usa

| Herramienta | Para qué |
|-------------|---------|
| **n8n** (self-hosted en Hostinger) | Motor de automatización — orquesta todo |
| **GPT-4o (OpenAI)** | Escribe el artículo: H1, intro, body con H2/H3, FAQ, meta description |
| **Google Gemini Flash (`gemini-2.5-flash-image`)** | Genera la imagen destacada de cada artículo en 16:9 (workshop lighting, 85mm) |
| **WordPress REST API** | Publica artículos, sube imagen, asigna alt text y tags |
| **Google Sheets API** | Panel de control del pipeline — estado de cada keyword |
| **Telegram Bot API** (canal actual) | Notifica éxitos y errores en tiempo real — gratis ilimitado |
| **Yoast SEO (plugin WP) + `fy-yoast-rest`** | Gestiona los metadatos SEO de cada post vía REST API |

---

## Quién alimenta la hoja del Sheet

El único paso manual de todo el sistema es **decidir sobre qué escribir**. Esa decisión editorial la toma el equipo.

### Hoja `Blog`
El equipo escribe la keyword (col A) y los metadatos básicos (nicho, audiencia, intención). Al poner `estado = Aprobado` en la col B, el sistema arranca automáticamente. Para keywords estacionales (ej: "cómo proteger la fachada en temporada de lluvias") también se define la `fecha_objetivo` (col K) — el sistema la detecta sola y la prioriza 14 días antes.

> Todo lo demás — escribir, generar imagen, publicar en WordPress, notificar — lo hace el workflow sin intervención humana.

---

## Diagrama de interacción

```
╔════════════════════════════╗
║      EQUIPO (humano)       ║
║                            ║
║  Sheet "Blog"              ║
║  · Escribe keyword         ║
║  · estado = "Aprobado"     ║
╚════════════╤═══════════════╝
             │
             ▼
  ┌────────────────────────┐
  │  WF1 — Blog SEO        │
  │  Diario 8am (L/M/V)    │
  │                        │
  │  Lee: Blog (Aprobado)  │
  │  Check: canibalismo    │
  │  Escribe: Blog (B, H)  │
  │                        │
  │  GPT-4o → artículo     │
  │  Gemini → imagen 16:9  │
  └────────────┬───────────┘
               │
               ▼
  ┌────────────────────────┐
  │     WORDPRESS          │   ◄── Post publicado con imagen,
  │  ferreteriaya.com.co   │       Yoast SEO, FAQ + JSON-LD,
  │  /blog/                │       tags, CTA a tienda
  └────────────┬───────────┘
               │
               ▼
  ┌──────────────────────────────────────────┐
  │  TELEGRAM — notifica éxito o error       │
  │  (WhatsApp = migración futura)           │
  └──────────────────────────────────────────┘

  LEYENDA:
  · Blog (hoja)            = pipeline de keywords y artículos
  · Blog!B = estado        Blog!H = url_post
  · Blog!K = fecha_objetivo (estacionales)
```

### Flujo en palabras

El equipo aprueba una keyword en la hoja `Blog`. Cada mañana a las 8am, el cron de n8n lee las keywords con `estado="Aprobado"` y procesa la primera (en días L/M/V para keywords regulares; cualquier día para estacionales con `fecha_objetivo` próxima).

Antes de escribir, hace un check anti-canibalismo: compara la keyword nueva contra todas las keywords ya publicadas usando similitud Jaccard ≥50%. Si detecta solapamiento, marca la fila como `Canibalismo`, registra la URL del post similar y se detiene.

Si pasa el check, GPT-4o escribe el artículo (≥1.800 palabras, H2/H3 estructurados, FAQ basada en autocomplete colombiano, CTA a tienda). En paralelo, Gemini genera la imagen destacada 16:9. WordPress recibe el post con featured image, alt text, categorías, tags y meta Yoast configurada.

WhatsApp notifica al equipo con título y URL del post publicado. Si algo falla en cualquier nodo, el Error Trigger marca la fila como `Error` y notifica el detalle.

---

## Cadencia de producción

| Tipo de contenido | Frecuencia | Automático |
|------------------|-----------|-----------|
| Artículo de blog | 3/semana (L/M/V) | ✅ Publicación automática |

> Lógica L/M/V implementada en Code node (`fy-node-003b`) con detección de día de semana en timezone Colombia (UTC-5). El cron base es diario para permitir publicación urgente de keywords estacionales en cualquier día.

---

## El Master Sheet — Panel de control

**ID:** `1HDLc1HCvfyjXsQ2QyY_TWPHWa2rcq-t5nhLfIFo0HWM` — una hoja activa: `Blog`

### Hoja `Blog`

| Columna | Campo | Uso |
|---------|-------|-----|
| A | keyword | El tema del artículo |
| B | estado | Pendiente → Aprobado → En proceso → Publicado / Error / Canibalismo |
| C | prioridad | Alta / Media / Baja |
| D | nicho | Tutoriales DIY / Herramientas / Materiales / Instalaciones / Jardinería |
| E | país | Colombia (con modificadores de ciudad: Bogotá, Medellín) |
| F | audiencia | Maestro de obra / DIYer principiante / Ama de casa / Constructor |
| G | intencion | Informacional / Transaccional / Navegacional |
| H | url_post | URL del post publicado |
| I | wordcount | Palabras del artículo |
| J | posicion_gsc | Posición en Google (reservado para futuro WF de re-optimización) |
| K | fecha_objetivo | Solo estacionales: fecha límite del blog (2 semanas antes del evento) |
| L | fecha_social | Reservado para futuro WF de redes sociales |
| M | fecha_reoptimizado | Reservado para futuro WF de re-optimización |

---

## Periodicidad y por qué L/M/V

**Diario 8am, publica solo L/M/V**

El trigger es diario pero la lógica de publicación está en el código. El motivo: si hay una keyword estacional con `fecha_objetivo` inminente y cae un martes, el sistema necesita poder publicarla ese día. Si el cron fuera solo L/M/V, ese martes no dispararía y el post llegaría tarde a Google. Las keywords regulares sí respetan L/M/V porque 3 posts/semana es la cadencia que Google premia en sitios que están ganando autoridad — más no es mejor, menos no genera suficiente señal editorial.

---

## Estructura del proyecto en disco

```
Ferreteria/
├── CLAUDE.md                           ← Instrucciones para Claude Code
├── .env                                ← credenciales (nunca commitear)
├── .mcp.json                           ← servidor MCP n8n
├── _contexto/
│   ├── FLUJO_COMPLETO.md              ← Documentación técnica nodo por nodo del WF1
│   ├── RESUMEN_PROYECTO.md            ← Este documento
│   └── CREDENCIALES_Y_COSTOS.md       ← APIs, keys y estimación de costos
├── _brandkit/
│   └── IDENTIDAD_VOZ.md               ← Personalidad "Asesor de Bricolaje", tono, diccionario
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt       ← Estructuras de contenido y prompts GPT
└── _config/
    └── INTEGRACIONES_TECNICAS.md      ← Endpoints, credenciales, variables de entorno
```

---

## Estado actual del proyecto

| Hito | Estado |
|------|--------|
| Documentación inicial (`CLAUDE.md` + docs de contexto) | ✅ Completo |
| Estructura del workflow definida (31 nodos en `FLUJO_COMPLETO.md`) | ✅ Completo |
| **Workflow `Ferretería Ya - WF-1 - Blog SEO` clonado e importado en n8n** | ✅ ID `u3Yfmb2dQS2oYnWo` (inactivo) |
| Plugin `fy-yoast-rest` instalado en WordPress | ⏳ Pendiente |
| Categorías WP creadas + IDs registrados | ⏳ Pendiente |
| Application Password de WordPress generado | ⏳ Pendiente |
| Credencial `Ferre_WordPress` en n8n | ⏳ Pendiente |
| Google Sheet creado con estructura A-M | ✅ Completo (`1HDLc1H...HWM`) |
| Bot de Telegram creado + token + chat ID | ✅ Completo (`@Ferreteriaya_pipeline_bot`) |
| Credencial `Ferre_Telegram` en n8n | ✅ Completo (`qoDPp0fY5sJ8AmbE`) — asignada a los 2 nodos del WF1 |
| Test del bot Telegram | ✅ Mensaje recibido en chat 1591872862 |
| Application Password de WordPress | ✅ Completo |
| Credencial `Ferre_WordPress` en n8n | ✅ Completo (`tSY0QM8DwewkbOvJ`) |
| Plugin `fy-yoast-rest` instalado en WP | ✅ Completo (verificado vía REST) |
| 5 categorías WP creadas | ✅ Completo (IDs 331-335) |
| WF1 clonado desde bigotes-felinos (`IVKelNHLoEaWD92B`) | ⏳ Pendiente |
| Test end-to-end exitoso | ✅ 2026-05-01 — post `11011` publicado en `/plomeria-y-sanitarios/como-instalar-una-llave-de-paso/` |
| Workflow activado en producción | ⏳ Pendiente (toggle "Active" cuando confirmes que el post se ve bien) |

> Ver detalle de pendientes en la tabla "Pendientes — Antes de Activar el Workflow" en `CLAUDE.md`.
