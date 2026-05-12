# Bigotes Caninos — Estrategia de Negocio

**Última actualización:** 2026-05-07 (9 workflows desplegados — paridad total con felino)

> **Paridad con Bigotes Felinos:** la estructura sigue al [`ESTRATEGIA_NEGOCIO.md`](../../bigotes-felinos/_contexto/ESTRATEGIA_NEGOCIO.md) del proyecto hermano. Las diferencias intencionales se anotan en cada sección.

---

## 1. Visión

Convertir [bigotescaninos.com](https://bigotescaninos.com/) en la **referencia editorial sobre perros del mundo hispanohablante** — autoridad SEO + AEO citable por motores de IA (ChatGPT, Perplexity, Google AI Overview, Alexa, Siri), con producción automatizada y consistente.

A diferencia del proyecto felino — que combina blog + redes + tienda — Bigotes Caninos es **100% blog SEO+AEO**. La voz se concentra en un único canal y la calidad por pieza es máxima.

---

## 2. Diferencial competitivo

1. **Voz Vet-Friend canina diferenciada** — experta pero cercana, con energía perruna (extrovertida, accionable, exterior).
2. **Stack AEO completo** desde el día uno — respuesta directa, key takeaways, tabla obligatoria, fuentes científicas, schemas FAQPage + WebPage.speakable + mentions Wikipedia + HowTo. Citaciones en AI Overview como objetivo medible.
3. **Cuota Colombia-first** — 40% del catálogo con modificador colombiano (precios COP, veterinarias locales, razas populares en LATAM).
4. **Estructura de hubs y pilares** — 4 páginas pilar de 3.500-4.000 palabras como ancla de autoridad.
5. **Producción semi-automatizada** — el equipo decide qué keywords trabajar; n8n hace el resto (escribir, generar imagen, publicar).

---

## 3. Pilares de Contenido

### Distribución (vs Felino)

| Pilar | Felino | **Canino** | Razón del cambio |
|-------|--------|-----------|------------------|
| Informativo SEO+AEO | 70% | **100%** | Sin redes sociales — toda la voz va al blog |
| Entretenimiento (redes) | 20% | **0%** | Eliminado — sin WF2 ni WF4 |
| Comunidad (redes) | 10% | **0%** | Eliminado — sin WF2 ni WF4 |

> Si en el futuro se decide añadir redes sociales propias para Caninos, será un sprint independiente y se reabrirá esta tabla.

---

## 4. Arquitectura de Hubs y Pilares

Cada hub temático tiene una **página pilar** (3.500-4.000 palabras) que actúa como ancla de autoridad. Los clusters (artículos de blog) enlazan al pilar; el pilar lista a los clusters automáticamente vía WF9.

| Hub | Pilar (slug propuesto) | Clusters target | Enfoque |
|-----|------------------------|-----------------|---------|
| **Salud canina** | `guia-salud-canina` | ~30 | Vacunas, enfermedades, parásitos, esterilización, primeros auxilios |
| **Alimentación canina** | `guia-alimentacion-perros` | ~20 | Dietas por edad/raza, alimentos comerciales, BARF, alimentos prohibidos |
| **Razas de perros** | `guia-razas-perros` | ~25 | Guías por raza, comparativas, razas en Colombia/LATAM |
| **Comportamiento y Adiestramiento** | `guia-comportamiento-canino` | ~25 | Adiestramiento positivo, ansiedad, socialización, conducta, juegos |

### Mapeo Hub ↔ Categoría WordPress

| Hub | Categoría WP actual | Acción WP necesaria |
|-----|--------------------|--------------------|
| Salud | `Salud` (slug `salud`, ID 41) | ✅ Sin cambios |
| Alimentación | `Alimentación` (slug `alimentacion`, ID 42) | ✅ Sin cambios |
| Razas | `Razas` (slug `razas`, ID 45) | ✅ Sin cambios |
| Comportamiento y Adiestramiento | `Educación` (slug `educacion`, ID 43) | ⚠️ **Renombrar a "Educación y Comportamiento"** |

**Categoría adicional:** `Noticias` (slug `noticias`, ID 157) — usada para piezas de actualidad caninas. No tiene hub porque es transversal.

**Eliminar:** `Blog2` (slug `blog2`, ID 1) — categoría huérfana sin posts.

---

## 5. Cuota Colombia-First

Mismo umbral que el felino: **6 de 15 ideas generadas por WF5 deben tener modificador colombiano** (40%). Si WF5 no alcanza la cuota en una pasada, intenta una segunda fase con queries específicamente colombianas.

Modificadores aceptados: "Colombia", "Bogotá", "Medellín", "Cali", "Cartagena", "COP", "precio en Colombia", "veterinario Bogotá", etc.

**Razón:** el usuario opera desde Colombia y la audiencia primaria es LATAM con epicentro colombiano. La cuota fuerza al pipeline a no derivar hacia keywords genéricas españolas/mexicanas que no convertirían tan bien.

---

## 6. Cadencia y Ritmo Editorial

| Tipo de contenido | Frecuencia | Trigger |
|------------------|-----------|---------|
| Artículo de blog | **3/semana (martes/jueves/sábado) a las 8am Colombia** | Master Sheet `estado=Aprobado` |
| Re-optimización SEO | ~10/mes (1° de cada mes) | Cron + manual |
| Sincronización pilares | Diario 8:30am | Cron (idempotente) |
| AEO Monitor | Lunes 9am | Cron |
| Bulk AEO Migrator | Manual | Decisión humana |
| Generador de Ideas | Manual | Cuando el backlog cae |
| Pillar Generator | Manual | Crear/regenerar pilar |

**Razón de la cadencia 3/sem martes/jueves/sábado:** Google premia la **consistencia** > **volumen** en sitios que se reactivan tras inactividad. Más posts no equivale a mejor ranking; menos posts no genera suficiente señal editorial. 3/sem es el sweet spot validado por el felino.

---

## 7. Workflows incluidos (8 de 9 del felino) — priorización post-GSC

| Workflow | Incluido | Prioridad | Razón |
|----------|---------|-----------|-------|
| WF1 — Blog SEO | ✅ | **🔥 ALTA** | Motor central — fábrica de contenido nuevo |
| WF5 — Generador de Ideas | ✅ | **🔥 ALTA** | Solo rama blog. Alimenta WF1 con keywords desde GSC + SerpAPI. Crítico dado que el catálogo histórico no genera tráfico |
| WF6 — Pillar Generator | ✅ | **🔥 ALTA** | 4 pilares + adaptaciones de prompts. Especialmente para hub Comportamiento (100% virgen en GSC) |
| WF9 — Pilares Auto-Sync | ✅ | ALTA | Idempotente. Sincroniza pilar ↔ clusters automáticamente |
| WF7 — AEO Monitor | ✅ | MEDIA | Vital para AEO pero no urgente con tráfico actual |
| WF11 — GSC Weekly Dashboard | ✅ | MEDIA | Snapshot semanal — útil cuando crezca el tráfico |
| WF3 — Re-optimización GSC | ✅ | **BAJA** (revisado post-GSC) | Solo 25 candidatos en pos 6-50 con volumen real. Foco en `gonorrea-en-perros` (CTR fix) y `popo-verde-en-perros` (mover de 15 → 5) |
| WF8 — Bulk AEO Migrator | ✅ | **BAJA** (revisado post-GSC) | El catálogo histórico no genera tráfico (74 clicks/16m sin gonorrea). Migración valiosa editorialmente pero no de tráfico |
| WF-Util — Force Re-optimize Post | ✅ | UTILIDAD | Operativa puntual |
| WF2 — Redes Sociales | ❌ | — | Eliminado — sin redes |
| WF4 — Entretenimiento | ❌ | — | Eliminado — sin redes |

**Cambio de orden vs felino:** en el felino WF8 era prioridad media (130 posts con valor SEO real para migrar). En el canino se baja a baja porque los datos GSC muestran que el catálogo no genera el tráfico que justificaría poner WF8 en el frente. WF1 + WF5 + WF6 son los workhorses reales.

---

## 8. Modelo de Monetización

A diferencia del felino (WooCommerce con productos físicos $49k-$270k COP), el canino arranca **sin tienda**. Modelo recomendado por capas:

### Capa 1 — Inmediata (mes 1-3)
- **Afiliados Amazon Colombia + Mercado Libre + Falabella** — links con `rel="sponsored"` en posts de Alimentación y productos de Salud (collares, juguetes, camas).
- **AdSense** o equivalente para tráfico informacional masivo.

### Capa 2 — Mediano plazo (mes 4-6)
- **Lead magnets** (PDFs descargables tipo "Guía completa de socialización de cachorros") con captura de email.
- **Email marketing** sobre la lista construida — newsletter semanal con artículos del blog.

### Capa 3 — Largo plazo (mes 7+, condicional al tráfico)
- **Tienda WooCommerce** si el tráfico justifica la inversión (C11 — usuario validó: "de pronto si tenemos más tráfico").
- **Productos digitales propios** (cursos cortos de adiestramiento, guías premium).

---

## 9. Métricas de Éxito a 90 días

| Métrica | Línea base | Target 90d |
|---------|-----------|-----------|
| Posts publicados nuevos | 0 | **+39** (3/sem × 13 semanas) |
| Posts re-optimizados | 0 | **+30** (10 WF3 + 20 WF8) |
| Score Salud Digital | 3.3/10 | **6.7/10** |
| Posts en posición 1-3 GSC | TBD (pendiente datos) | +15 vs línea base |
| Citaciones en Google AI Overview | 0 detectadas | ≥3 keywords mostrando bigotescaninos.com como fuente |
| 4 pilares publicados | 0 | **4** ✅ |
| Cuota Colombia en nuevo contenido | N/A | ≥40% |
| Errores Bloque A/B resueltos | 0/11 | **11/11** |

---

## 10. Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Cross-config con felino (redes apuntan al felino) | Alto — fuga de tráfico | Corregir antes del primer post nuevo |
| Refresh token GSC podría no cubrir el dominio canino | Medio — bloquea WF3/WF5/WF8 | Verificar al primer fetch; regenerar OAuth si es necesario |
| Plugin `bf-yoast-rest`-equivalente puede no estar instalado realmente | Medio — bloquea escritura de meta Yoast vía REST | Validar runtime al primer POST a `/wp-json/wp/v2/posts` con campo `meta` |
| Autor "User Post News" en posts viejos puede afectar E-E-A-T | Medio — daña AEO citaciones | Reasignar autoría en bulk + crear bio veterinaria real |
| GPT-4o aplicado al nicho canino puede caer en clichés ("perrito chiquito") si el prompt no enfatiza el diccionario | Bajo-medio — calidad editorial | Diccionario reforzado en prompt + pasada de Quality Gate con HARD GATE de tabla y validación de términos prohibidos |

---

## 11. Decisiones arquitectónicas registradas

| ID | Decisión | Fecha |
|----|----------|-------|
| A1 | Voz "Vet-Friend canino" con modulación enérgica | 2026-05-06 |
| A2 | Diccionario Paquete B (perritos, peluditos, compañeros caninos, familias caninas, bienestar perruno) | 2026-05-06 |
| A2.1 | **NO usar "lomito"** — descartado explícitamente. Sustituto: "compañero canino" o "peludito" | 2026-05-07 |
| A3 | Prohibir "mascota", "dueño", tono clínico, alarmismo, infantiloides | 2026-05-06 |
| B5 | 100% Informativo SEO+AEO — sin redes | 2026-05-06 |
| B6 | 4 hubs: Salud, Alimentación, Razas, Comportamiento y Adiestramiento | 2026-05-06 |
| B7 | Renombrar categoría WP `Educación` → `Educación y Comportamiento` | 2026-05-06 |
| B8 | Eliminar categoría huérfana `Blog2` (resuelto como rename a "Sin categoría") | 2026-05-06 |
| C11 | Sin tienda WooCommerce — modelo afiliados/AdSense/leads | 2026-05-06 |
| C13 | Correcciones técnicas en paralelo al pipeline (no bloquean primer post) | 2026-05-06 |
| D14 | Credenciales independientes excepto Google (GSC, Sheets, Ads) y SerpAPI | 2026-05-06 |
| D14.1 | **Gemini/nano banana también compartida con felino** — el proyecto GCP del usuario para BC no tiene billing; reutilizar cred felino que sí lo tiene (~$0.04/mes incremental) | 2026-05-07 |
| D15 | Bot Telegram dedicado `@bigotescaninos_pipeline_bot` | 2026-05-06 |
| D16 | Master Sheet dedicado, sin hoja Redes Sociales | 2026-05-06 |
| D17 | GSC propiedad de tipo **URL prefix** (`https://bigotescaninos.com/`), no sc-domain | 2026-05-06 |
| D18 | ~~GCP project dedicado `n8n-bigotescaninos` para Indexing API~~ — **descartado** (Indexing API no se implementa, indexación natural vía sitemap es suficiente) | 2026-05-06 |
| D19 | Webhook path WF-Util: `/webhook/bc-force-reopt-post` con prefijo `bc-` (paths únicos por instancia n8n) | 2026-05-07 |
| E19 | ~~Cadencia 3/sem martes/jueves/sábado~~ → **3/sem martes/jueves/sábado** (cambio operativo del usuario) | 2026-05-07 |
| E20 | Cuota Colombia 6/15 (paridad felino) | 2026-05-06 |
| E21 | Whitelist 7 fuentes: WSAVA, AVMA, AAHA, Merck Vet Manual, Cornell Vet Med, RVC, PubMed | 2026-05-06 |
| E23 | Bot Telegram diferente, mismo `chat_id` receptor (1591872862) | 2026-05-06 |
| E24 | **WF3 inactivo intencional** hasta que WF8 termine de migrar el catálogo y posts re-rankeen (~2-3 meses) | 2026-05-07 |
| E25 | **`gonorrea-en-perros` (post 25) tratado como prioridad** — re-optimizado con AEO completo + aclaración de mito médico (Brucella canis vs Neisseria gonorrhoeae) para resolver riesgo E-E-A-T | 2026-05-07 |
