# Bigotes Felinos — ContentOps Engine: Resumen del Proyecto

**Última actualización:** 2026-05-05 (WF1 anti-canibalismo v2 desplegado + limpieza Sheet/WP)

> Este documento es el **overview ejecutivo** del proyecto. Para ver Master Sheet, credenciales, nodos y pendientes, abrir [`../CLAUDE.md`](../CLAUDE.md). Para el detalle paso a paso del flujo y el historial de cambios, abrir [`FLUJO_COMPLETO.md`](FLUJO_COMPLETO.md). Para costos y APIs, abrir [`CREDENCIALES_Y_COSTOS.md`](CREDENCIALES_Y_COSTOS.md).

---

## ¿Qué es esto?

Un sistema de automatización de contenido construido en n8n que produce artículos de blog SEO + AEO (Answer Engine Optimization), copies para redes sociales y contenido de entretenimiento de forma semi-automática para **bigotesfelinos.com**, blog de referencia sobre gatos en el mundo hispanohablante (17k Instagram · 11k Facebook).

El equipo decide qué keywords trabajar. El sistema se encarga de escribir, generar imagen, publicar en WordPress y notificar — sin intervención humana.

**Stack AEO desde 2026-05-03:** Cada artículo publica con respuesta directa citable por IA, key takeaways, tabla obligatoria, bloque de fuentes científicas, schemas JSON-LD múltiples (FAQPage + WebPage con Speakable + mentions Wikipedia + HowTo condicional), H2 question-first y entidades canónicas — visibilidad en ChatGPT, Perplexity, Google AI Overviews, Alexa, Google Home y Siri además del SEO clásico.

**Anti-canibalismo v2 desde 2026-05-05:** WF1 protege contra duplicados con doble capa: (1) Jaccard kw≥35% + Jaccard slug≥60% con stem básico antes de gastar GPT; (2) consulta WP REST API por slug propuesto antes de publicar para detectar conflictos que generarían `-2` en WordPress. Sheet limpiada de 188→154 filas, 7 posts perdedores movidos a papelera tras audit GSC (1 click acumulado en 90 días entre todos).

---

## El problema que resuelve

El sitio tiene **106 posts existentes** con historial en Google, pero estuvo más de un año inactivo. La estrategia tiene dos frentes:

1. **Publicar contenido nuevo** de forma consistente (3 veces/semana) para recuperar autoridad editorial.
2. **Re-optimizar posts existentes** que ya tienen datos en Google pero no están en el top 5.

---

## Los 9 workflows

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
**Qué hace:** consulta GSC (queries reales con ≥3 impresiones), SerpAPI (PAA + autocomplete) y GPT-4o para generar ideas nuevas y enriquecidas. Descarta duplicados con Jaccard ≥50%. Desde 2026-05-04: cuota mínima de 6 de 15 ideas blog deben tener modificador colombiano.
**Cuándo corre:** manual — ejecutar cuando se quieran nuevas ideas para el pipeline.
**Resultado:** inserta keywords nuevas en la hoja `Blog` (estado=Pendiente, con metadatos completos) e ideas de entretenimiento en `Redes Sociales` (tipo=Entretenimiento, estado=Idea) listas para ser procesadas por WF4.

### 6. WF7 — AEO Monitor: Detectar citas en Google AI Overview
**Qué hace:** consulta SerpAPI con 2-step async fetch para detectar si bigotesfelinos.com aparece como fuente citada en Google AI Overview de 20 keywords clave. Registra resultados en hoja `AEO_Tracking` con país, top dominios competidores, snippet citado.
**Cuándo corre:** automático cada lunes 9am Colombia.
**Resultado:** Telegram con resumen semanal: split país (🇨🇴 Colombianas vs 🌎 Generales), top 3 dominios que dominan tu nicho, insight contextual rotativo.

### 7. WF8 — Bulk AEO Migrator (pendiente importación)
**Qué hace:** procesa los 130 posts existentes cronológicamente para aplicar el stack AEO completo (respuesta directa, key takeaways, fuentes, schemas, etc.) sin filtro GSC. Reusa la lógica de WF3 pero ignora el ranking — útil para "migrar AEO al catálogo histórico".
**Cuándo corre:** Manual — el usuario lo ejecuta cuando quiere procesar el siguiente batch de 10 posts.
**Resultado:** 10 posts re-optimizados con AEO completo + Sheet Blog!M actualizado para no reprocesar. Catálogo completo en ~13 runs (~$30 GPT total).
**Importación:** `_aeo/sprint-4/WF8_Bulk_AEO_Migrator.json` → n8n UI → "+" → "Import from file".

### 8. WF6 — Pillar Generator: Crear Página Pilar por Hub
**Qué hace:** genera una **página pilar** completa (3.500-4.000 palabras) para uno de los 4 hubs temáticos: Salud, Alimentación, Razas o Mundo. Aplica el stack AEO completo (respuesta directa, key takeaways, tabla obligatoria, fuentes, schemas CollectionPage + Speakable + mentions Wikipedia). Publica como **page** (no post) en WordPress, sin categoría, sin fecha visible.
**Cuándo corre:** Manual — solo se ejecuta cuando se quiere crear un pilar nuevo o regenerar uno existente.
**Resultado:** página pilar publicada en `bigotesfelinos.com/{slug}` con imagen destacada, schemas y enlaces internos a clusters publicados del hub.
**Estado actual:** los 4 pilares ya están publicados ([Salud](https://bigotesfelinos.com/guia-salud-felina/), [Alimentación](https://bigotesfelinos.com/guia-alimentacion-gatos/), [Razas](https://bigotesfelinos.com/guia-razas-gatos/), [Mundo](https://bigotesfelinos.com/guia-comportamiento-felino/)).

### 9. WF9 — Pilares Auto-Sync: Inyectar clusters en pilares
**Qué hace:** lee la hoja `Blog`, agrupa los posts publicados por hub (columna R), y refresca la sección "Más artículos sobre..." en cada uno de los 4 pilares con la lista actualizada de clusters. Idempotente: re-ejecutar 100 veces da el mismo resultado.
**Cuándo corre:** automático todos los días a las 8:30am Colombia (30 min después de WF1) + manual para refresh inmediato.
**Resultado:** los 4 pilares siempre tienen enlaces internos al día con todos los clusters publicados de su hub. Cada cluster nuevo aparece en su pilar máximo 25 horas después de ser publicado por WF1.

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

> Todo lo demás — escribir, generar imagen, publicar, generar copies de redes, generar ideas — lo hacen los workflows sin intervención humana. El detalle de columnas (Blog A-S incluyendo R=hub y S=cluster_parent, Redes Sociales A-I) está en [`../CLAUDE.md`](../CLAUDE.md).

---

## Estructura de Hubs y Pilares (Sprint 3 — desplegado 2026-05-04)

El catálogo de 188 keywords está organizado en **4 hubs temáticos**, cada uno con su **página pilar** maestra (3.500-4.000 palabras). Los clusters (artículos de blog) enlazan al pilar; el pilar lista a los clusters.

| Hub | Pilar (URL) | Page ID | Clusters publicados | Slug |
|-----|------------|---------|---------------------|------|
| Salud | [`/guia-salud-felina/`](https://bigotesfelinos.com/guia-salud-felina/) | 2700 | ~50 | `guia-salud-felina` |
| Alimentación | [`/guia-alimentacion-gatos/`](https://bigotesfelinos.com/guia-alimentacion-gatos/) | 2702 | ~12 | `guia-alimentacion-gatos` |
| Razas | [`/guia-razas-gatos/`](https://bigotesfelinos.com/guia-razas-gatos/) | 2704 | ~22 | `guia-razas-gatos` |
| Mundo | [`/guia-comportamiento-felino/`](https://bigotesfelinos.com/guia-comportamiento-felino/) | 2706 | ~45 | `guia-comportamiento-felino` |

**Beneficio:** los pilares acumulan autoridad de todos sus clusters, son citados por IAs (ChatGPT, Perplexity) por su exhaustividad, y crean estructura de site claramente temática para Google.

**Ciclo de vida de un cluster:**
1. WF1 publica un cluster nuevo a las 8am L/M/V → categoría WP correcta + slug + AEO completo
2. WF9 corre a las 8:30am del día siguiente → refresca la sección "Más artículos sobre..." del pilar correspondiente con el cluster nuevo enlazado
3. Resultado: el cluster aparece automáticamente listado en su pilar máximo 25 horas después

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

  ┌────────────────────────────────────────────────────────────────┐
  │  WF9 — Pilares Auto-Sync · Diario 8:30am                       │
  │                                                                │
  │  Lee Blog (col R = hub) → agrupa publicados por hub            │
  │  → GET cada uno de los 4 pilares (WP pages)                    │
  │  → Regenera sección "Más artículos sobre..." en cada pilar     │
  │  → PATCH WP pages (idempotente)                                │
  │                                                                │
  │  Resultado: enlaces internos cluster ↔ pilar siempre al día    │
  └────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  WF6 — Pillar Generator · Manual                             │
  │  Crea/regenera UNA página pilar (3.500-4.000 palabras)       │
  │  con stack AEO completo. Ejecutado 4 veces (1 por hub).      │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  TELEGRAM — notifica éxito y error en los 9 workflows        │
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
| Sincronización pilares | Diario 8:30am | ✅ WF9 refresca enlaces cluster ↔ pilar automáticamente |
| AEO Monitor | Lunes 9am | ✅ WF7 detecta citas en Google AI Overview |
| Bulk AEO Migrator | A demanda | ⚪ Manual — procesa 10 posts viejos por run para añadir AEO |
| Crear pilar nuevo | A demanda | ⚪ Manual — solo si se decide añadir un 5to hub |

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

**WF6 — Pillar Generator · Manual**

Sin schedule. Solo se usa para crear o regenerar pilares. El uso típico es: al inicio del proyecto se ejecuta 4 veces (una por hub) para crear los 4 pilares. Después puede quedar dormido por meses. Se reactiva si: (a) se decide añadir un 5to hub temático, (b) un pilar quedó muy desactualizado y se quiere regenerar desde cero, o (c) se cambió el prompt de generación y se quiere ver el efecto en un pilar específico.

**WF7 — AEO Monitor · Lunes 9am**

Corre semanal porque medir citas en Google AI Overview tiene volatilidad alta — más frecuente generaría ruido sin valor. El lunes da una visión de la semana anterior. Si bigotesfelinos.com aparece como fuente citada por la IA de Google para alguna de las 20 keywords clave, lo registra en hoja `AEO_Tracking` y avisa por Telegram con dominios competidores.

**WF8 — Bulk AEO Migrator · Manual**

Sin schedule. Procesa los posts viejos del catálogo para añadirles el stack AEO completo (respuesta directa, key takeaways, fuentes, schemas). El usuario lo ejecuta cuando tiene presupuesto GPT y quiere avanzar 10 posts más. A ritmo de 1 run por semana, los 130 posts existentes quedan migrados en ~13 semanas.

**WF9 — Pilares Auto-Sync · Diario 8:30am**

Corre 30 min después de WF1 para que si un cluster nuevo se publicó hoy, ya esté reflejado en su pilar correspondiente esa misma mañana. Idempotente: re-ejecutar 100 veces da el mismo resultado, así que no importa si corre cuando no hay cambios. Solo hace 4 GET + 4 PATCH al WP por día (sin GPT, costo cero).
