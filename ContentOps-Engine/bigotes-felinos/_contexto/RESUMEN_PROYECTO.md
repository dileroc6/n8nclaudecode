# Bigotes Felinos — ContentOps Engine: Resumen del Proyecto

**Última actualización:** 2026-05-04

> Este documento es el **overview ejecutivo** del proyecto. Para ver Master Sheet, credenciales, nodos y pendientes, abrir [`../CLAUDE.md`](../CLAUDE.md). Para el detalle paso a paso del flujo y el historial de cambios, abrir [`FLUJO_COMPLETO.md`](FLUJO_COMPLETO.md). Para costos y APIs, abrir [`CREDENCIALES_Y_COSTOS.md`](CREDENCIALES_Y_COSTOS.md).

---

## ¿Qué es esto?

Un sistema de automatización de contenido construido en n8n que produce artículos de blog SEO + AEO (Answer Engine Optimization), copies para redes sociales y contenido de entretenimiento de forma semi-automática para **bigotesfelinos.com**, blog de referencia sobre gatos en el mundo hispanohablante (17k Instagram · 11k Facebook).

El equipo decide qué keywords trabajar. El sistema se encarga de escribir, generar imagen, publicar en WordPress y notificar — sin intervención humana.

**Stack AEO desde 2026-05-03:** Cada artículo publica con respuesta directa citable por IA, key takeaways, tabla obligatoria, bloque de fuentes científicas, schemas JSON-LD múltiples (FAQPage + WebPage con Speakable + mentions Wikipedia + HowTo condicional), H2 question-first y entidades canónicas — visibilidad en ChatGPT, Perplexity, Google AI Overviews, Alexa, Google Home y Siri además del SEO clásico.

---

## El problema que resuelve

El sitio tiene **106 posts existentes** con historial en Google, pero estuvo más de un año inactivo. La estrategia tiene dos frentes:

1. **Publicar contenido nuevo** de forma consistente (3 veces/semana) para recuperar autoridad editorial.
2. **Re-optimizar posts existentes** que ya tienen datos en Google pero no están en el top 5.

---

## Los 5 workflows

### 1. WF1 — Blog SEO: Keyword → Publicar en WordPress
**Qué hace:** toma una keyword aprobada en el Sheet y publica un artículo completo en WordPress de forma automática.
**Cuándo corre:** lunes, miércoles y viernes a las 8am Colombia.
**Resultado:** artículo publicado en el blog con imagen, SEO Yoast configurado, tags y enlaces internos.

### 2. WF2 — Redes Sociales: Generar Copies CapCut
**Qué hace:** por cada artículo publicado, genera 10 piezas de contenido diferenciadas para Instagram, Facebook, TikTok y YouTube Shorts.
**Cuándo corre:** todos los días a las 10am Colombia.
**Resultado:** se inserta una fila nueva en la hoja `Redes Sociales` del Sheet con scripts listos para usar en CapCut. La publicación es manual.

### 3. WF3 — Re-optimización SEO: Posts GSC posición 6-50
**Qué hace:** detecta los posts del blog que Google está mostrando en posición 6-50 con al menos 5 impresiones, los reescribe completos con GPT-4o y actualiza WordPress.
**Cuándo corre:** automáticamente el 1° de cada mes + disponible para ejecución manual.
**Resultado:** hasta 10 artículos por run con contenido renovado, FAQ, seo_title y meta description actualizados en WordPress. Registra la fecha en el Sheet para no re-procesar en 90 días.

### 4. WF4 — Entretenimiento Viral: Contenido Humor
**Qué hace:** si WF5 dejó ideas pendientes (`estado="Idea"`), desarrolla la primera. Si no hay ideas, GPT-4o elige autónomamente una situación cómica y genera 4 piezas de contenido viral para las mismas 4 plataformas.
**Cuándo corre:** sábados a las 10am Colombia.
**Resultado:** actualiza fila existente (si había idea) o inserta fila nueva en la hoja `Redes Sociales` con scripts listos para publicar manualmente.

### 5. WF5 — Generador de Ideas: Blog + Entretenimiento
**Qué hace:** consulta GSC (queries reales con ≥3 impresiones), SerpAPI (PAA + autocomplete) y GPT-4o para generar ideas nuevas y enriquecidas. Descarta duplicados con Jaccard ≥50%.
**Cuándo corre:** manual — ejecutar cuando se quieran nuevas ideas para el pipeline.
**Resultado:** inserta keywords nuevas en la hoja `Blog` (estado=Pendiente, con metadatos completos) e ideas de entretenimiento en `Redes Sociales` (tipo=Entretenimiento, estado=Idea) listas para ser procesadas por WF4.

---

## Quién alimenta cada hoja del Sheet

El único paso manual de todo el sistema es **decidir sobre qué escribir**. Esa decisión editorial la toma el equipo.

### Hoja `Blog`
El equipo escribe la keyword (col A) y los metadatos básicos (nicho, audiencia, intención). Al poner `estado = Aprobado` en la col B, el sistema arranca automáticamente. Para keywords estacionales también se define la `fecha_objetivo` (col K) — el sistema la detecta solo y la prioriza 14 días antes. WF5 también inserta filas aquí con `estado="Pendiente"` cuando encuentra ideas nuevas — el equipo solo necesita revisar esas filas y cambiar a `Aprobado` las que quiera publicar.

### Hoja `Redes Sociales`
**No requiere intervención manual para generación.** Tres workflows escriben aquí:
- **WF2** inserta una fila con `tipo="Blog"` cada vez que hay un artículo nuevo sin copies.
- **WF4** inserta (o actualiza) una fila con `tipo="Entretenimiento"` cada sábado.
- **WF5** inserta filas con `tipo="Entretenimiento"` + `estado="Idea"` cuando genera ideas de entretenimiento.

El equipo solo marca `estado = Publicado` en cada fila cuando publica manualmente en cada plataforma.

> Todo lo demás — escribir, generar imagen, publicar, generar copies de redes, generar ideas — lo hacen los workflows sin intervención humana. El detalle de columnas A-M (Blog) y A-I (Redes Sociales) está en [`../CLAUDE.md`](../CLAUDE.md).

---

## Diagrama de interacción entre workflows

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  WF5 — Generador de Ideas (manual)                               │
  │                                                                  │
  │  GSC API + SerpAPI + GPT-4o                                      │
  │  → Append: Blog (estado=Pendiente)                               │
  │  → Append: Redes Sociales (tipo=Entretenimiento, estado=Idea)    │
  └──────────┬───────────────────────────────────────┬───────────────┘
             │                                       │
             ▼                                       ▼
╔════════════════════════════╗         ┌─────────────────────────┐
║      EQUIPO (humano)       ║         │   Redes Sociales (hoja) │
║                            ║         │   · Ideas de entret.    │
║  Sheet "Blog"              ║         │     estado="Idea"       │
║  · Revisa ideas de WF5     ║         └─────────────┬───────────┘
║  · estado = "Aprobado"     ║                       │
╚════════════╤═══════════════╝                       │
             │                                       │
             ▼                                       ▼
  ┌────────────────────────┐             ┌────────────────────────┐
  │  WF1 — Blog SEO        │             │  WF4 — Entretenimiento │
  │  Diario 8am (L/M/V)    │             │  Sábados 10am          │
  │                        │             │                        │
  │  Lee: Blog (Aprobado)  │             │  Si hay estado=Idea:   │
  │  Escribe: Blog (B, H)  │             │    PUT → actualiza fila│
  │                        │             │  Si no hay Ideas:      │
  │  GPT-4o → artículo     │             │    GPT elige autónomo  │
  │  Gemini → imagen 16:9  │             │    → append nueva fila │
  └────────────┬───────────┘             └────────────────────────┘
               │
               ▼
  ┌────────────────────────┐
  │     WORDPRESS          │   ◄── Post publicado con imagen,
  │  bigotesfelinos.com    │       Yoast SEO, FAQ, tags,
  │                        │       enlaces internos
  └────────────┬───────────┘
               │
               ├──────────────────────────────────────┐
               ▼                                      ▼
  ┌────────────────────────┐          ┌───────────────────────────┐
  │  WF2 — Redes Sociales  │          │  WF3 — Re-optimización    │
  │  Diario 10am           │          │  1° de cada mes (auto)    │
  │                        │          │  + manual                 │
  │  Lee: Blog (Publicado) │          │                           │
  │  Lee: Redes Sociales   │          │  Consulta: GSC API        │
  │  Append: Redes Sociales│          │  Lee: WP contenido actual │
  │  tipo="Blog"           │          │  Escribe: Blog (J, M)     │
  │                        │          │                           │
  │  GPT-4o → 10 campos    │          │  GPT-4o → reescribe       │
  │  CapCut-ready          │          │  artículo + FAQ           │
  └────────────────────────┘          │  WP PATCH → actualiza     │
                                      └───────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  TELEGRAM — notifica éxito y error en los 5 workflows        │
  └──────────────────────────────────────────────────────────────┘
```

### Flujo en palabras

**WF5** es el generador de combustible: consulta GSC y SerpAPI para descubrir qué busca la gente, y llena automáticamente el pipeline con ideas nuevas (Blog) e ideas de entretenimiento (Redes Sociales). El equipo solo aprueba las keywords que le interesan.

**WF1** es el motor central: toma una keyword aprobada, produce el artículo completo y lo publica en WordPress. A partir de ese post, **WF2** genera los scripts de redes (diario) y **WF3** re-optimiza mensualmente los posts que Google ya muestra pero no en el top 5.

**WF4** corre los sábados de forma independiente: si WF5 dejó ideas de entretenimiento pendientes, las desarrolla; si no, GPT elige autónomamente una situación nueva.

---

## Cadencia de producción

| Tipo de contenido | Frecuencia | Automático |
|------------------|-----------|-----------|
| Ideas para el pipeline | A demanda (manual) | ✅ Generación automática, aprobación manual |
| Artículo de blog | 3/semana (L/M/V) | ✅ Publicación automática |
| Copies redes sociales | Diario | ✅ Generación automática, publicación manual |
| Contenido entretenimiento | 1/semana (sábado) | ✅ Generación automática, publicación manual |
| Re-optimización posts | ~10/mes (1° de cada mes) | ✅ Ejecución automática mensual + manual disponible |

---

## Periodicidad de cada workflow y por qué

**WF1 — Blog SEO · Diario 8am, publica solo L/M/V**

El trigger es diario pero la lógica de publicación está en el código. El motivo: si hay una keyword estacional con `fecha_objetivo` inminente y cae un martes, el sistema necesita poder publicarla ese día. Si el cron fuera solo L/M/V, ese martes no dispararía y el post llegaría tarde a Google. Las keywords regulares sí respetan L/M/V porque 3 posts/semana es la cadencia que Google premia en sitios que se están reactivando — más no es mejor, menos no genera suficiente señal editorial.

**WF2 — Redes Sociales · Diario 10am**

Corre 2 horas después de WF1 para que si se publicó un post hoy, ya esté en el Sheet con `estado="Publicado"`. Luego compara dos listas: todos los posts con `estado=Publicado` en la hoja Blog (Lista A) contra todas las filas con `tipo=Blog` en la hoja Redes Sociales (Lista B). Cualquier keyword que ya esté en la Lista B se descarta — así nunca genera copies dos veces del mismo post. Solo trabaja con lo que está en A pero no en B.

Prioridad y límite por ejecución:
- **Estacionales** (`fecha_social = hoy`): se procesan **todos**, sin límite. Son time-sensitive.
- **Regulares** (sin fecha_social): máximo **2 por ejecución** en días L/M/V → 6 posts/semana del backlog. A ese ritmo los 106 posts viejos quedan cubiertos en ~18 semanas.

Cuando termine el backlog, WF2 simplemente encuentra 0 o 1 candidato por día (el post que WF1 publicó ese mismo día) y genera sus copies. El límite de 2 deja de ser relevante — el sistema queda en estado estable.

**WF3 — Re-optimización · 1° de cada mes automático + manual disponible**

GSC necesita tiempo para acumular datos. Re-optimizar más seguido no le da a Google tiempo de recrawlear y medir el impacto del cambio anterior. El bloqueo de 90 días por artículo refuerza esto. El 1° del mes es un punto de control fácil de recordar y alineado con revisiones de estrategia. El modo manual existe para casos excepcionales (update de Google, caída brusca de tráfico).

**WF4 — Entretenimiento · Sábados 10am**

Solo genera los scripts — no publica nada. La publicación es 100% manual. El sábado es una convención de ritmo editorial: mantiene el equipo en la costumbre de tener contenido de entretenimiento listo cada semana para publicar cuando quieran durante el fin de semana, que es cuando este tipo de contenido tiene más engagement en la audiencia de Bigotes Felinos.

**WF5 — Ideas · Manual**

Sin schedule intencionalmente. Si corriera automático cada semana generaría más ideas de las que el pipeline puede ejecutar (WF1 publica 3/semana). La dinámica correcta: cuando el equipo ve que el Sheet tiene pocas keywords `Pendiente` (menos de 2-3 semanas de backlog), ejecuta WF5 para rellenarlo.
