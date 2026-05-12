# Bigotes Caninos — ContentOps Engine: Resumen del Proyecto

**Última actualización:** 2026-05-07 (9 workflows desplegados — paridad total con felino)

> Overview ejecutivo del proyecto. Para Master Sheet, credenciales y nodos, abrir [`../CLAUDE.md`](../CLAUDE.md). Para flujo paso a paso de cada workflow, abrir [`FLUJO_COMPLETO.md`](FLUJO_COMPLETO.md). Para costos y APIs, abrir [`CREDENCIALES_Y_COSTOS.md`](CREDENCIALES_Y_COSTOS.md). Para auditoría inicial y datos GSC, abrir [`auditoria_estrategia.md`](auditoria_estrategia.md).

---

## ¿Qué es esto?

Sistema de automatización de contenido construido en n8n que produce artículos de blog SEO + AEO para [bigotescaninos.com](https://bigotescaninos.com/) — blog de referencia sobre perros en el mundo hispanohablante con foco Colombia/LATAM.

El equipo decide qué keywords trabajar. El sistema se encarga de escribir, generar imagen, publicar en WordPress y notificar — sin intervención humana.

**Diferencia clave vs proyecto hermano Bigotes Felinos:** este proyecto es **100% blog SEO+AEO**. No produce contenido para redes sociales (sin WF2 ni WF4). Toda la voz se concentra en un único canal.

**Stack AEO:** cada artículo publica con respuesta directa citable por IA, key takeaways, tabla obligatoria, bloque de fuentes científicas, schemas JSON-LD múltiples (FAQPage + WebPage con Speakable + mentions Wikipedia + HowTo condicional), H2 question-first y entidades canónicas — visibilidad en ChatGPT, Perplexity, Google AI Overviews, Alexa y Siri además del SEO clásico.

---

## El problema que resuelve

El sitio tiene **77 artículos publicados** con historial en Google, pero estuvo más de un año inactivo (última publicación: 2025-03-31).

**Hallazgo crítico de la auditoría GSC** (ver [`auditoria_estrategia.md`](auditoria_estrategia.md) §11):

> 97.5% del tráfico orgánico de los últimos 16 meses proviene de UN solo URL (`/salud/gonorrea-en-perros/`). Sin esa página, el sitio acumula 74 clicks en 16 meses. **El proyecto opera casi como tabula rasa.**

Esto cambia la estrategia respecto al felino: en vez de "reactivar un catálogo dormido", aquí toca **construir hubs nuevos** mientras se gestiona con cuidado la única página viral existente. Las dos estrategias son:

1. **Construir contenido nuevo** (eje principal — WF1 + WF5 + WF6) priorizando hubs vírgenes en GSC: Comportamiento y Adiestramiento, demand signals no capturados (diarrea, hepatitis, cushing, etc.) y cuota Colombia.
2. **Re-optimizar lo poco que tiene tracción** (eje secundario — WF3): hoy solo `/salud/gonorrea-en-perros/` (CTR fix) y `/salud/popo-verde-en-perros/` (mover de pos 15 → 5) son candidatos con volumen real.

---

## Los 9 workflows desplegados (vs 11 del felino) — estado 2026-05-07

| WF | n8n ID | Función | Cadencia | Status |
|----|--------|---------|----------|--------|
| WF1 | `vQJ5gCIDbNq2zqd8` | Blog SEO: keyword → publicar en WordPress | **Mar/Jue/Sáb 8am** Colombia | 🟢 Active |
| WF3 | `PloVJdTP2G8lKMNo` | Re-optimización SEO: posts GSC pos 6-50 | 1° de mes + manual | 🟡 Inactivo (dormido hasta WF8 termine) |
| WF5 | (otro chat) | Generador de Ideas (solo blog) | Manual | (otro chat) |
| WF6 | `37ZMWhzGb3ObewQ6` | Pillar Generator | Manual | ⚪ Cumplió misión (4 pilares) |
| WF7 | `RYhnbWPasSKE5HL6` | AEO Monitor | Lunes 9am | 🟢 Active |
| WF8 | `4vPCym417t5nO9ru` | Bulk AEO Migrator | Manual gradual | 🟡 En ejecución por usuario |
| WF9 | `VUA4Rnm3hYWVqcE5` | Pilares Auto-Sync | Diario 8:30am | 🟢 Active |
| WF11 | `39sEBfGprwCtVKOD` | GSC Weekly Dashboard | Lunes 9am | 🟢 Active |
| WF-Util | `n3j1DIxnMIJ5Xahw` | Force Re-optimize Post | Webhook `/webhook/bc-force-reopt-post` | 🟢 Active |

### Excluidos del canino (2)

| WF | Razón |
|----|-------|
| WF2 — Redes Sociales | Proyecto sin canales de redes — voz 100% en blog |
| WF4 — Entretenimiento Viral | Idem |

### Pilares publicados (Sprint 3 completado 2026-05-07)

| Hub | Page ID | URL pública | Clusters inyectados (WF9) |
|-----|---------|-------------|---------------------------|
| Salud | 1979 | https://bigotescaninos.com/guia-salud-canina/ | 33 |
| Alimentación | 1981 | https://bigotescaninos.com/guia-alimentacion-perros/ | 22 |
| Razas | 1983 | https://bigotescaninos.com/guia-razas-perros/ | 18 |
| Comportamiento | 1985 | https://bigotescaninos.com/guia-comportamiento-canino/ | 6 |
| **Total** | | | **79** |

### Posts producidos en Sprint inicial (2026-05-07)

| Post ID | URL | Origen | Quality |
|---------|-----|--------|---------|
| 1973 | `/salud/cuanto-cuesta-esterilizar-un-perro-en-colombia/` | WF1 (primer post automático) | — |
| 1966 | `/equipo-editorial/` | WP REST manual (Sprint 1 AEO) | — |
| 591 (re-opt) | `/salud/popo-verde-en-perros/` | WF-Util restoration | 105 |
| 25 (re-opt) | `/salud/gonorrea-en-perros/` | WF-Util + edición manual del mito médico | 107 |

---

## Nomenclatura de workflows en n8n

`BC - WF<n> - <descripción>` — ejemplo: `BC - WF1 - Blog SEO: Keyword → Publicar en WordPress`.

**BC** = Bigotes Caninos (en lugar de **BF** del felino). Esto permite ver ambos proyectos lado a lado en la misma instancia n8n sin confusión.

---

## Quién alimenta cada hoja del Master Sheet

El único paso manual del sistema es **decidir sobre qué escribir**. Esa decisión editorial la toma el equipo.

### Hoja `Blog`
El equipo escribe la keyword (col A) y los metadatos básicos. Al poner `estado = Aprobado` (col B), el sistema arranca automáticamente. Para keywords estacionales también se define la `fecha_objetivo` (col K) — el sistema la detecta y la prioriza 14 días antes.

WF5 también inserta filas aquí con `estado="Pendiente"` cuando encuentra ideas nuevas — el equipo solo necesita revisar y cambiar a `Aprobado` las que quiera publicar.

### Hojas `AEO_Tracking`, `GSC_Tracking`, `GSC_Pages_Tracking`
Solo escritas por workflows (WF7, WF11). Sin intervención manual.

> **Diferencia vs felino:** el canino NO tiene hoja `Redes Sociales` (no aplica) y tampoco las columnas N-Q huérfanas que el felino mantiene como referencia histórica.

---

## Estructura de Hubs y Pilares

Los 77 artículos existentes + el contenido nuevo se organizan en **4 hubs temáticos**, cada uno con su **página pilar** (3.500-4.000 palabras).

| Hub | Pilar (slug) | Categoría WP mapeada | Prioridad |
|-----|-------------|---------------------|-----------|
| Salud canina | `guia-salud-canina` | `salud` (ID 41) | Alta — donde está el tráfico actual |
| Alimentación canina | `guia-alimentacion-perros` | `alimentacion` (ID 42) | Media |
| Razas de perros | `guia-razas-perros` | `razas` (ID 45) | Media — alta demanda pero CTR cero (titles a reescribir) |
| Comportamiento y Adiestramiento | `guia-comportamiento-canino` | `Educación` → renombrar a "Educación y Comportamiento" (ID 43) | **🔥 Alta — hub virgen, mayor oportunidad** |

**Categoría adicional:** `Noticias` (transversal, sin hub).

**Eliminar:** `Blog2` (huérfana, ID 1, 0 posts).

**Ciclo de vida de un cluster:**
1. WF1 publica un cluster nuevo a las 8am martes/jueves/sábado → categoría WP correcta + slug + AEO completo
2. WF9 corre a las 8:30am del día siguiente → refresca la sección "Más artículos sobre..." del pilar correspondiente
3. Resultado: el cluster aparece automáticamente listado en su pilar máximo 25 horas después

---

## Diagrama de interacción entre workflows

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  WF5 — Generador de Ideas (manual)                               │
  │                                                                  │
  │  GSC API + SerpAPI + GPT-4o                                      │
  │  → Append: hoja Blog (estado=Pendiente)                          │
  │  → Cuota Colombia 6/15 obligatoria                               │
  └──────────┬───────────────────────────────────────────────────────┘
             │
             ▼
╔════════════════════════════╗
║      EQUIPO (humano)       ║
║                            ║
║  Sheet "Blog"              ║
║  · Revisa ideas de WF5     ║
║  · estado = "Aprobado"     ║
╚════════════╤═══════════════╝
             │
             ▼
  ┌────────────────────────┐
  │  WF1 — Blog SEO        │
  │  Diario 8am (martes/jueves/sábado)    │
  │                        │
  │  Lee: Blog (Aprobado)  │
  │  GPT-4o → artículo AEO │
  │  Gemini → imagen 16:9  │
  │  WP REST → publicar    │
  └────────────┬───────────┘
               │
               ▼
  ┌────────────────────────┐
  │     WORDPRESS          │ ◄── Post publicado con imagen,
  │  bigotescaninos.com    │     Yoast SEO, FAQ, schemas AEO,
  │                        │     tags, enlaces internos, fuentes
  └────────────┬───────────┘
               │
               ├──────────────────────────────────────┐
               ▼                                      ▼
  ┌────────────────────────┐          ┌───────────────────────────┐
  │  WF9 — Pilares Sync    │          │  WF3 — Re-optimización    │
  │  Diario 8:30am         │          │  1° de cada mes (auto)    │
  │  Refresca enlaces      │          │  + manual                 │
  │  cluster ↔ pilar       │          │                           │
  └────────────────────────┘          │  Consulta: GSC API        │
                                      │  GPT-4o → reescribe       │
                                      │  WP PATCH → actualiza     │
                                      └───────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  WF6 — Pillar Generator · Manual                             │
  │  Crea/regenera UNA página pilar (3.500-4.000 palabras)       │
  │  con stack AEO completo. Ejecutado 4 veces (1 por hub).      │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  WF7 — AEO Monitor · Lunes 9am                               │
  │  Detecta citas en Google AI Overview (20 keywords clave)     │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  WF11 — GSC Weekly Dashboard · Lunes 9am                     │
  │  Snapshot semanal sitewide + top 30 páginas                  │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  WF8 — Bulk AEO Migrator · Manual (baja prioridad)           │
  │  Procesa 10 posts viejos por run con stack AEO completo      │
  │  Catálogo histórico → 77 posts → ~9 runs                     │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────┐
  │  TELEGRAM — notifica éxito y error en los 9 workflows        │
  │  Bot: @bigotescaninos_pipeline_bot                           │
  │  Destinatario: chat_id 1591872862 (mismo que felino)         │
  └──────────────────────────────────────────────────────────────┘
```

---

## Cadencia de producción

| Tipo de contenido | Frecuencia | Automático |
|------------------|-----------|-----------|
| Ideas para el pipeline | A demanda (manual) | ✅ Generación automática, aprobación manual |
| Artículo de blog | 3/semana (martes/jueves/sábado) | ✅ Publicación automática |
| Re-optimización posts | ~10/mes (1° de cada mes) | ✅ Ejecución automática mensual + manual disponible |
| Sincronización pilares | Diario 8:30am | ✅ WF9 refresca enlaces cluster ↔ pilar automáticamente |
| AEO Monitor | Lunes 9am | ✅ WF7 detecta citas en Google AI Overview |
| GSC Dashboard | Lunes 9am | ✅ WF11 escribe snapshot en Sheets |
| Bulk AEO Migrator | A demanda | ⚪ Manual — procesa 10 posts viejos por run |
| Crear pilar nuevo | A demanda | ⚪ Manual — solo si se decide añadir un 5to hub |

---

## Plan de despliegue por sprints (TODO COMPLETADO)

### ✅ Sprint 0 — Bootstrap (2026-05-06)
- Estructura de directorios + archivos de contexto
- Auditoría completa + datos GSC reales 16 meses (hallazgo bomba: gonorrea 97.5%)
- 23 decisiones arquitectónicas registradas
- Score inicial 3.0/10 → target 6.7/10 en 90 días

### ✅ Sprint 1 — Cimientos AEO + correcciones técnicas (2026-05-06)
- `llms.txt` desplegado en `/llms.txt`
- `equipo-editorial.html` publicado como WP page (ID 1966) con SEO Yoast
- Plugin `bc-yoast-rest` instalado y validado E2E
- 5 credenciales en n8n (BC dedicadas: WP/OpenAI/Telegram + 2 compartidas BF: Sheets/Gemini/SerpAPI/GSC)
- robots.txt físico con reglas explícitas
- Redes felinas eliminadas del homepage
- Master Sheet con 4 hojas + 77 posts importados con hub
- Bot Telegram `@bigotescaninos_pipeline_bot` validado E2E
- Schema Organization confirmado en Yoast
- Categoría WP `Educación` → `Educación y Comportamiento`
- Categoría huérfana `Blog2` neutralizada

### ✅ Sprint 2 — WF1 (2026-05-07)
- WF1 BC desplegado (`vQJ5gCIDbNq2zqd8`, 36 nodos, paridad total)
- Cron Mar/Jue/Sáb 8am Bogotá local
- Bug fixes aplicados: categoriaMap canino + inferirCategoria + wordcount + alwaysOutputData
- **Primer post automatizado:** `/salud/cuanto-cuesta-esterilizar-un-perro-en-colombia/` (post 1973)

### ✅ Sprint 3 — WF6 + WF9 + 4 pilares (2026-05-07)
- WF6 BC desplegado (`37ZMWhzGb3ObewQ6`, 17 nodos)
- 4 pilares publicados (Salud 1979 / Alim 1981 / Razas 1983 / Comportamiento 1985) con stack AEO completo
- WF9 BC desplegado y activo (`VUA4Rnm3hYWVqcE5`, 11 nodos, idempotente)
- Backfill validado: 79 clusters distribuidos en 4 pilares en 2s

### ✅ Sprint 4 — WF7 + WF11 + WF8 + WF-Util + WF3 (2026-05-07)
- WF11 GSC Weekly Dashboard activo (`39sEBfGprwCtVKOD`)
- WF7 AEO Monitor activo (`RYhnbWPasSKE5HL6`)
- WF8 Bulk AEO Migrator listo y en ejecución gradual (`4vPCym417t5nO9ru`)
- WF-Util Force Re-optimize Post activo (`n3j1DIxnMIJ5Xahw`, webhook path `/bc-force-reopt-post`)
- **Post viral re-optimizado:** `/salud/gonorrea-en-perros/` (post 25) con AEO completo + aclaración mito médico (Quality 107)
- WF3 BC creado (`PloVJdTP2G8lKMNo`, 26 nodos) — **inactivo intencional** hasta que WF8 termine

---

## ✅ Decisión sobre la página viral `/salud/gonorrea-en-perros/` — EJECUTADO 2026-05-07

Esta página acumula 97.5% del tráfico orgánico (2.946 clicks / 16m). Tratamiento aplicado:

1. ✅ **Re-optimizada vía WF-Util** (post 25, Quality Score 107) con AEO completo: respuesta directa, key takeaways, tabla, FAQ, schemas FAQPage/Speakable.
2. ✅ **Mito médico aclarado manualmente** por el usuario tras la re-optimización GPT — el post ahora abre con: *"La gonorrea en perros no es causada por Neisseria gonorrhoeae, sino por bacterias como Brucella canis..."* + párrafo aclaratorio explícito citando WSAVA, AVMA, Merck Vet Manual.
3. ✅ **URL preservada** (`/salud/gonorrea-en-perros/`) — sin pérdida de señal SEO histórica.
4. ✅ **Yoast SEO actualizado** — title nuevo: *"Gonorrea en perros: causas, síntomas y tratamiento"*.

**Impacto esperado** (a confirmar con WF11 dashboards en próximas semanas):
- CTR: 4.48% → target 15%+ (mejor title + meta + información honesta)
- Clicks/16m: 2.946 → target ~10.500 (triplicación)
- E-E-A-T: resuelto el riesgo de propagar info médica errónea en AI Overview

---

## Métricas de éxito a 90 días

| Métrica | Línea base | Target 90d |
|---------|-----------|-----------|
| Posts publicados nuevos | 0 | +39 (3/sem × 13 semanas) |
| Posts re-optimizados | 0 | +5 (foco quirúrgico, no masa) |
| Posts AEO migrados (WF8) | 0 | +30-40 (background) |
| Score Salud Digital | 3.0/10 | 6.7/10 |
| Pages en pos 1-10 | 21 | +10 |
| Citaciones en Google AI Overview | 0 | ≥2 keywords |
| 4 pilares publicados | 0 | 4 ✅ |
| Cuota Colombia en nuevo contenido | 0% | ≥40% |
| Errores Bloque A/B resueltos | 0/11 | 11/11 |
| Tráfico orgánico mensual (estimado) | ~190 clicks/mes (concentrado) | ~400 clicks/mes (diversificado) |
