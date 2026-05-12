# Sprints AEO — Bigotes Caninos

Plan de los 4 sprints de Answer Engine Optimization (AEO) para Bigotes Caninos.
Paridad estructural con [`_aeo/`](../../bigotes-felinos/_aeo/) del proyecto felino.

---

## ¿Qué es AEO?

AEO (Answer Engine Optimization) es la disciplina de optimizar contenido para que sea citado directamente por motores de IA — Google AI Overviews, ChatGPT, Perplexity, Claude, Bing Copilot, Alexa, Siri — además del SEO tradicional para Google búsqueda.

A diferencia del SEO clásico que apunta a posiciones en SERP, AEO apunta a **citaciones directas** del contenido en respuestas generativas. Las palancas son distintas: schemas JSON-LD múltiples, respuesta directa citable, fuentes verificables, entidades canónicas, structured data exhaustivo.

---

## Sprint 1 — Cimientos AEO ✅ COMPLETADO 2026-05-06

### Entregables

- [`sprint-1/llms.txt`](sprint-1/llms.txt) — ✅ Subido a `https://bigotescaninos.com/llms.txt`
- [`sprint-1/equipo-editorial.html`](sprint-1/equipo-editorial.html) — ✅ Publicado como WP page (ID `1966`, slug `equipo-editorial`) con SEO Yoast completo
- ✅ Schema Organization en Yoast (verificado — ya estaba configurado)
- ✅ BreadcrumbList en Yoast (verificado — ya estaba configurado)
- ✅ Plugin `bc-yoast-rest` instalado, activado y validado E2E
- ✅ robots.txt físico con reglas explícitas
- ✅ Bio de autor "Equipo Editorial Bigotes Caninos"
- ✅ Enlace "Equipo editorial" añadido al footer

### Criterios de éxito (todos cumplidos)

- ✅ `llms.txt` accesible en `https://bigotescaninos.com/llms.txt`
- ✅ `/equipo-editorial/` publicado e indexable
- ✅ Schema Organization detectado en `yoast_head_json`
- ✅ BreadcrumbList detectado vía REST API

---

## Sprint 2 — Stack AEO en producción de contenido nuevo ✅ COMPLETADO 2026-05-07

### Implementación

Cada artículo nuevo publicado por WF1 incluye desde el día uno:

1. **Respuesta directa** (`<p class="respuesta-directa">`) — 40-60 palabras, citable
2. **Key takeaways** (`<blockquote class="key-takeaways">`) — 3-5 viñetas
3. **Tabla obligatoria** (HARD GATE en Quality Gate)
4. **Bloque "Fuentes consultadas"** — 3-5 referencias whitelist
5. **Schemas JSON-LD múltiples:**
   - FAQPage (siempre, si hay faq_items)
   - WebPage con speakable (apuntando a `.respuesta-directa` y `.key-takeaways`)
   - WebPage.mentions con sameAs Wikipedia (entities canónicas)
   - HowTo (condicional, solo si keyword es procedural)
6. **H2/H3 question-first** cuando aplique
7. **Sentence case** en todos los headings
8. **Whitelist estricta de 7 fuentes científicas caninas**

### Criterios de éxito

- ✅ Primer post de WF1 (post 1973 `cuanto-cuesta-esterilizar-un-perro-en-colombia`) tiene los 8 componentes
- ✅ Schema.org Markup correctamente generado (FAQPage + WebPage.speakable + WebPage.mentions)
- ⏳ WF7 detección de citas — pendiente primer ciclo del lunes

### Posts validados con stack AEO completo

| Post ID | Slug | Origen | Quality Score |
|---------|------|--------|---------------|
| 1973 | cuanto-cuesta-esterilizar-un-perro-en-colombia | WF1 (primer post automático) | — |
| 591 | popo-verde-en-perros | WF-Util (re-optimización) | **105** |
| 25 | gonorrea-en-perros | WF-Util + edición manual del mito | **107** |

---

## Sprint 3 — Hubs y Pilares ✅ COMPLETADO 2026-05-07

### Entregables

- ✅ 4 páginas pilar publicadas en WP (pages, no posts)
- ✅ Master Sheet con columnas R (`hub`) y S (`cluster_parent`) populated para los 77 posts publicados
- ✅ WF9 sincronizando los 4 pilares automáticamente (cron diario 8:30am)

### 4 Pilares publicados

| Hub | Page ID | Slug | URL pública | Clusters inyectados |
|-----|---------|------|-------------|---------------------|
| Salud canina | **1979** | `guia-salud-canina` | https://bigotescaninos.com/guia-salud-canina/ | 33 |
| Alimentación canina | **1981** | `guia-alimentacion-perros` | https://bigotescaninos.com/guia-alimentacion-perros/ | 22 |
| Razas de perros | **1983** | `guia-razas-perros` | https://bigotescaninos.com/guia-razas-perros/ | 18 |
| Comportamiento | **1985** | `guia-comportamiento-canino` | https://bigotescaninos.com/guia-comportamiento-canino/ | 6 |

### Clasificación del catálogo histórico (77 posts)

Hecha durante el bootstrap importando los posts publicados con hub asignado por categoría WP. No se requirió clasificador GPT separado — el mapping fue determinístico por categoría:
- categoría 41 (Salud) → hub Salud
- categoría 42 (Alimentación) → hub Alimentación
- categoría 45 (Razas) → hub Razas
- categoría 43 (Educación) → hub Comportamiento

### Criterios de éxito (todos cumplidos)

- ✅ 4 pilares publicados con slug correcto (sin `-2` añadido por WP — el fix `pilar-img-{slug}.webp` heredado del felino funciona)
- ✅ Cada pilar tiene ~3.500-4.000 palabras + AEO completo + featured image
- ✅ WF9 corre 8:30am diario y refresca los 4 pilares idempotentemente
- ✅ Cada cluster nuevo aparece en su pilar máximo 25 horas después

---

## Sprint 4 — Bulk AEO Migration + Monitoring + Polish ✅ DESPLEGADO 2026-05-07 (operación continua)

### Entregables desplegados

1. ✅ **WF8 — Bulk AEO Migrator** (`4vPCym417t5nO9ru`) — operativo, en ejecución gradual por usuario (1 run/semana, 10 posts/run)
2. ✅ **WF7 — AEO Monitor** (`RYhnbWPasSKE5HL6`) — activo, primera ejecución programada lunes 9am
3. ✅ **WF11 — GSC Weekly Dashboard** (`39sEBfGprwCtVKOD`) — activo, primer snapshot capturado en `GSC_Tracking` + `GSC_Pages_Tracking`
4. ✅ **WF-Util — Force Re-optimize Post** (`n3j1DIxnMIJ5Xahw`) — ejecutado sobre `/salud/gonorrea-en-perros/` (post 25) con Quality Score 107 + aclaración manual del mito médico (Brucella canis vs Neisseria gonorrhoeae)

### Métricas a monitorear (próximos 30-90 días)

| Métrica | Baseline (2026-05-07) | Target 90d |
|---------|----------------------|-----------|
| Citas en AIO | 0 | ≥2 keywords citando bigotescaninos.com |
| CTR `/salud/gonorrea-en-perros/` | 4.48% | 15%+ |
| Concentración top 1 página | 97.5% | <70% |
| Posts AEO-migrados (WF8) | 0 | ≥30 |
| Posts en pos 1-10 | 21 | +10 |

### Operación continua

- WF7 + WF11 corren cada lunes 9am Bogotá automáticamente
- WF8 a ritmo de 1 run/semana = 8 runs para migrar todo (~$5 total)
- WF3 BC creado (`PloVJdTP2G8lKMNo`) **inactivo** — se activará cuando WF8 termine y posts re-rankeen (~3 meses)

---

## Cronograma — TODO COMPLETADO

| Sprint | Duración planeada | Duración real | Status |
|--------|-------------------|---------------|--------|
| 1 | 1 semana | **1 sesión** (2026-05-06) | ✅ |
| 2 | 2 semanas | **1 sesión** (2026-05-07) | ✅ |
| 3 | 2 semanas | **1 sesión** (2026-05-07) | ✅ |
| 4 | 4 semanas | **1 sesión** (2026-05-07) | ✅ desplegado, operación continua |

**Realidad:** todo el sistema BC se construyó y desplegó en 2 sesiones, mucho más rápido de lo esperado gracias al patrón de adaptación BF→BC vía Python + n8n REST API.

---

## Notas para futuras revisiones

- ✅ Sitio ya tiene infraestructura completa para AIO citations — esperar primeros datos de WF7 en 1-2 semanas
- ✅ Página gonorrea ya re-optimizada con honestidad médica — protección contra core updates futuros
- Si el catálogo no crece de tráfico tras 60 días con WF1 corriendo + WF8 migrando → revisar prompt GPT (puede necesitar más Colombia-first o hubs específicos)
- Cuando WF8 termine de migrar: revisar candidatos GSC pos 6-50 y activar WF3
- Vigilar cuota SerpAPI combinada (felino + canino ~160 vs free 100) — primer mes nos dirá si necesitamos upgrade o bajar cadencia BC
