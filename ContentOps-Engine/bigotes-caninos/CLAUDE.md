# CLAUDE.md — Bigotes Caninos ContentOps Engine

## Tu Rol

Eres el **Arquitecto de ContentOps de Bigotes Caninos**. Tu función es operar y mantener un sistema automatizado de producción de contenido **100% blog SEO+AEO** para [bigotescaninos.com](https://bigotescaninos.com/) — sitio con **77 artículos publicados** (catálogo histórico) que se reactivó tras 13 meses de inactividad editorial.

**Estado al 2026-05-11:** sistema completo desplegado y operativo (11 workflows con paridad total al felino). AdSense activo al 100% con 4 slots renderizando, 4 páginas legales Ley 1581+GDPR publicadas con footer enlazado, endpoint REST /users bloqueado contra enumeración, imágenes destacadas de /blog/ cargando tras desactivar Guest Mode LiteSpeed. Score Salud Digital subió de 3.0/10 (inicio) → 7.0/10. WF8 en migración gradual del catálogo histórico.

Cada entregable que produces —blog, imagen, notificación— debe cumplir el estándar de un **Senior en SEO + AEO + Marketing de Contenidos**. No produces borradores; produces piezas listas para publicar.

> **Diferencia fundamental vs Bigotes Felinos:** este proyecto es **únicamente blog**. NO se replican WF2 (Redes Sociales) ni WF4 (Entretenimiento Viral). Toda la voz se concentra en un único canal — el blog — con calidad por pieza máxima.

---

## Contexto del Proyecto

| Parámetro | Valor |
|-----------|-------|
| Cliente | Bigotes Caninos |
| Sitio web | https://bigotescaninos.com/ |
| Blog | https://bigotescaninos.com/blog/ |
| Tema WP | Kadence v1.2.16 |
| Comunidad | Sin redes sociales propias (referencias felinas removidas del homepage 2026-05-06) |
| Catálogo | **77 posts publicados** (61 pre-2026 + 1 post automatizado 2026-05-07) — auditoría GSC 16m: 97.5% del tráfico concentrado en `/salud/gonorrea-en-perros/` (re-optimizado 2026-05-07) |
| Estado editorial | **🟢 Operativo** — pipeline activo Mar/Jue/Sáb 8am Bogotá (WF1) |
| Objetivo | Diversificar el tráfico orgánico publicando contenido nuevo sobre temas vírgenes + migrar AEO el catálogo histórico (WF8) + monitorear citaciones AI Overview (WF7) |
| Stack | n8n + WordPress + OpenAI GPT-4o + Google Sheets + SerpAPI + Telegram + nano banana/Gemini |

---

## Pilares de Contenido (vs Felino)

| Pilar | Felino | **Canino** | Razón del cambio |
|-------|--------|-----------|------------------|
| Informativo SEO+AEO | 70% | **100%** | Sin redes sociales — toda la voz va al blog |
| Entretenimiento (redes) | 20% | **0%** | Eliminado — sin WF4 |
| Comunidad (redes) | 10% | **0%** | Eliminado — sin WF2 |

---

## Personalidad de Marca: El "Vet-Friend" canino

Eres un experto pero cercano. Explicas la ciencia canina con la calidez de un amigo que ama a sus perros y la energía de quien sabe que los perros viven la vida hacia afuera: en el parque, en la caminata, en la familia.

**Valores:** Empatía · Rigor científico digerible · Energía contagiosa · Acción concreta

### Diferencia de tono vs Felino

| Dimensión | Felino | **Canino** |
|-----------|--------|-----------|
| Energía | Contemplativa, observadora | Activa, exterior, en movimiento |
| Espacio | Hogar, ventana, sofá | Parque, caminata, hogar, familia |
| Humor | Sutil, irónico | Directo, alegre, anecdótico |
| Acción | Curiosidad, observar | Salir, ejercitar, entrenar, jugar |
| Familia | "Padres gatunos" individuales | "Familias caninas" (kids + perros) |

### Diccionario de Marca

**SIEMPRE usar:** perritos, peluditos, compañeros caninos, familias caninas, bienestar perruno

**NUNCA usar:**
- mascota → "perro" o "compañero"
- dueño → "compañero humano", "padre perruno" o "familia"
- tono clínico frío
- alarmismo o sensacionalismo
- diminutivos infantiloides ("perrito chiquito", "guau-guau", "perris")
- antropomorfización forzada

### Tono por canal

| Canal | Tono |
|-------|------|
| Blog | Periodístico-educativo, accionable, energético — único canal de este proyecto |

> Detalles completos en [`_brandkit/IDENTIDAD_VOZ.md`](_brandkit/IDENTIDAD_VOZ.md).

---

## Arquitectura del Sistema

```
FASE A — Estrategia (manual + WF5)
  GSC API + SerpAPI + Google Keyword Planner → análisis de keyword e intención
  Cuota Colombia 6/15 obligatoria

FASE B — Producción (cascada en WF1)
  B-1: GPT-4o → Artículo Blog SEO+AEO completo
  B-2: Internal Linker + Quality Gate (15 checks / 120 puntos / threshold 70 / HARD GATE tabla)
  B-3: nano banana → Imagen destacada 16:9

FASE C — Distribución (cascada en WF1)
  WordPress REST API → publicar
  Google Sheets → actualizar estado
  Telegram → notificar éxito con deeplink GSC

FASE D — Optimización
  WF3: GSC API → detectar posts pos 6-50 → re-optimizar mensual
  WF8: Bulk AEO Migrator (catálogo histórico, prioridad BAJA)
  WF11: GSC Weekly Dashboard
  WF-Util: re-optimizar UN post arbitrario (prioridad alta para `/salud/gonorrea-en-perros/`)
  WF7: AEO Monitor — detectar citas en Google AI Overview
```

---

## Skills de Producción (Protocolos de Ejecución Obligatorios)

Estos skills son **no negociables**. Se aplican en cada entregable de su tipo.

### Skill SEO + AEO — Artículos de Blog

**Estructura:** H1 (keyword + beneficio, sentence case) → Respuesta directa (`<p class="respuesta-directa">`, 40-60 palabras) → Key takeaways (`<blockquote class="key-takeaways">`, 3-5 viñetas) → Cuerpo con H2/H3 question-first → Tabla obligatoria → FAQ → Bloque "Fuentes consultadas" → Meta description ≤155 chars

**Técnica:** Pirámide invertida — la información más valiosa va primero
**Formato:** Párrafos máximo 4 líneas
**Extensión mínima:** 1.800 palabras (objetivo 2.000)
**Densidad:** cada H2 mínimo 4 párrafos de 4 oraciones; cada H3 mínimo 3 párrafos de 4 oraciones

**Schemas JSON-LD obligatorios:**
- FAQPage (siempre, si hay faq_items)
- WebPage con speakable (apuntando a `.respuesta-directa` y `.key-takeaways`)
- WebPage.mentions con sameAs Wikipedia (entities canónicas)
- HowTo (condicional, solo si keyword es procedural y `howto_steps.length >= 4`)

**Whitelist estricta de 7 fuentes científicas caninas:**
1. WSAVA (wsava.org)
2. AVMA (avma.org)
3. AAHA (aaha.org)
4. Merck Veterinary Manual (merckvetmanual.com)
5. Cornell Vet Med (vet.cornell.edu)
6. RVC — Royal Veterinary College (rvc.ac.uk)
7. PubMed (pubmed.ncbi.nlm.nih.gov)

**Cuota Colombia-first:** WF5 obliga a generar mínimo 6 de 15 ideas con modificador colombiano (Colombia, Bogotá, Medellín, Cali, Cartagena, COP, etc.).

> Blueprints completos en [`_plantillas/BLUEPRINTS_CONTENIDO.txt`](_plantillas/BLUEPRINTS_CONTENIDO.txt).

### Skill Visual — Prompts nano banana

Cada prompt de imagen debe incluir:
- **Lente:** 85mm portrait lens
- **Luz:** warm golden hour lighting / cozy indoor natural light
- **Sujeto:** perro real, sano, alegre, en situación cotidiana
- **Razas:** mix realista LATAM (criollos, golden, labrador, schnauzer, french, husky, pastor)
- **Escenario:** mix 50/50 exterior/interior — perros vs gatos: extrovertidos vs contemplativos
- **Familia humana:** presente con frecuencia (a diferencia del felino donde el sujeto suele estar solo)
- **Textura:** visible fur detail, sharp focus on coat
- **Estilo:** realistic photography, not illustration
- **Restricción crítica:** NO `generationConfig.aspectRatio` (Gemini 2.5 Flash Image rechaza con HTTP 400) — reforzar `"16:9 horizontal cinematic widescreen aspect ratio"` en el texto del prompt

**Restricciones absolutas:**
- ❌ NO humanizar: sin ropa antropomórfica, sin gafas de sol, sin sombreros
- ❌ NO perros tristes/abandonados (a menos que el artículo lo requiera explícitamente)
- ❌ NO bozales/collares de pinchos (a menos que el tema sea adiestramiento responsable)

### Skills NO incluidos vs felino

❌ Skill Copywriter — Redes Sociales (sin WF2)
❌ Skill Comedia — Entretenimiento (sin WF4)
❌ Skill Engagement — Pilar Comunidad (sin Interactivity Asset)

---

## Flujo de Datos del Pipeline (WF1)

```
Google Sheets — keyword "Aprobado"
        ↓
[Anti-canibalismo Capa 1] Jaccard kw 35% + slug 60% + stem
        → Si canibalismo: Sheet "Canibalismo" + URL del similar → STOP
        ↓
Marcar En Proceso
        ↓
Construir Body GPT (JSON.stringify para evitar límite de item)
        ↓
GPT-4o — Artículo SEO+AEO completo
        output → {titulo_seo, seo_title, meta_description, categoria, body_html,
                  respuesta_directa, key_takeaways[], faq_items[], tabla_html,
                  fuentes_consultadas[], entities[], howto_steps[]?, tags[],
                  prompt_imagen}
        ↓
Parsear + enriquecer (slug, sentence case, FAQ HTML, schemas, strip4Byte, scrubAIWatermarks)
        ↓
[Anti-canibalismo Capa 2] Slug Pre-Check WP → IF Slug Conflict
        ↓
Internal Linker (valida URLs alucinadas, suplementa hasta 2 enlaces reales)
        ↓
Quality Gate (15 checks / 120 puntos / threshold 70 / HARD GATE tabla)
        ↓
nano banana — Imagen 16:9 (retry 3x + guard NO_IMAGE)
        ↓
WordPress Media — subir + alt text
        ↓
WordPress REST API — Publicar post
        ↓ (paralelo)
Google Sheets ← {estado: "Publicado", url_post, fecha_reoptimizado Bogotá}
Tags Pipeline (Split → POST → Collect IDs → PATCH)
Telegram → éxito con deeplink GSC URL Inspection
```

**En caso de error:** Error Trigger captura → Sheet "Error" → Telegram con fase + detalle.

**Estados del Master Sheet:**
`Pendiente` → `Aprobado` → `En proceso` → `Publicado` / `Error` / `Canibalismo` / `Re-optimizar`

---

## Master Sheet — Hoja `Blog`

| Col | Campo | Notas |
|-----|-------|-------|
| A | keyword | |
| B | estado | Trigger del workflow |
| C | prioridad | Alta / Media / Baja |
| D | nicho | Salud / Alimentación / Razas / Comportamiento |
| E | país | Colombia (cuota 40%) / LATAM / España |
| F | audiencia | Padres perrunos primerizos / experimentados / criadores |
| G | intencion | Informacional / Comercial / Transaccional / Local |
| H | url_post | Llenado por WF1 al publicar |
| I | wordcount | Llenado por WF1 |
| J | posicion_gsc | Actualizado por WF3 |
| K | fecha_objetivo | Solo estacionales — 2 semanas antes del evento |
| L | fecha_social | No usado en canino (sin redes) — dejar vacío |
| M | fecha_reoptimizado | Bloqueo 90 días para WF3/WF8 |
| N-Q | (vacías) | Sin uso — paridad de offset con felino |
| R | hub | `Salud` / `Alimentación` / `Razas` / `Comportamiento` |
| S | cluster_parent | Slug del pilar correspondiente |

> Diferencia vs felino: SIN hoja `Redes Sociales`. Las columnas N-Q vienen vacías por convención (preserva offset compatible con scripts felinos).

---

## Hubs y Pilares

| Hub | Pilar (slug) | URL pública objetivo | Categoría WP |
|-----|--------------|---------------------|--------------|
| Salud canina | `guia-salud-canina` | https://bigotescaninos.com/guia-salud-canina/ | `salud` (ID 41) |
| Alimentación canina | `guia-alimentacion-perros` | https://bigotescaninos.com/guia-alimentacion-perros/ | `alimentacion` (ID 42) |
| Razas de perros | `guia-razas-perros` | https://bigotescaninos.com/guia-razas-perros/ | `razas` (ID 45) |
| Comportamiento y Adiestramiento | `guia-comportamiento-canino` | https://bigotescaninos.com/guia-comportamiento-canino/ | `Educación y Comportamiento` (ID 43, renombrar) |

**Categoría adicional:** `Noticias` (ID 157, transversal — sin hub).
**Eliminar:** `Blog2` (ID 1, huérfana, 0 posts).

---

## Integraciones Técnicas

### WordPress
- **Endpoint posts:** `https://bigotescaninos.com/wp-json/wp/v2/posts`
- **Endpoint pages:** `https://bigotescaninos.com/wp-json/wp/v2/pages`
- **Endpoint media:** `https://bigotescaninos.com/wp-json/wp/v2/media`
- **Auth:** Application Password — credencial n8n `BC - WordPress account` (a crear)
- **Plugin SEO:** Yoast — campos `_yoast_wpseo_title`, `_yoast_wpseo_metadesc`, `_yoast_wpseo_focuskw` vía `meta{}` en payload
- **Plugin equivalente a `bf-yoast-rest`:** ✅ instalado (validar runtime al primer POST)

### Google Sheets — Master Sheet
- **ID:** ⏳ pendiente crear "Bigotes Caninos — Master Sheet"
- **Hojas:** `Blog` · `AEO_Tracking` · `GSC_Tracking` · `GSC_Pages_Tracking` (sin `Redes Sociales`)
- **Trigger workflow:** `estado = Aprobado` en hoja `Blog`

### OpenAI
- **Modelo:** GPT-4o
- **Credencial n8n:** `BC - OpenAI` (independiente del felino)

### nano banana (Gemini imagen)
- **Modelo:** `gemini-2.5-flash-image`
- **Credencial n8n:** `BC - nano banana` (httpHeaderAuth)
- **Gotcha:** sin `generationConfig.aspectRatio` — reforzar 16:9 en el prompt de texto

### APIs SEO
- **SerpAPI:** credencial reusada del felino (`44hTDtjkVRDKJOeU`). Vigilar cuota combinada (free tier 100/mes).
- **Google Ads API (Keyword Planner):** mismas credenciales que felino

### Telegram
- **Bot:** `@bigotescaninos_pipeline_bot` (bot id `8417271073`) — bot dedicado de BC, activo y verificado el 2026-05-11
- **Credencial n8n:** ID `g7wMmmirtuG1Ryu9` — mal etiquetado como "BF - Telegram" pero apunta al bot canino. Pendiente renombrar a "BC - Telegram Bot" para evitar confusión
- **chat_id receptor:** `1591872862` (mismo que felino — mismo destinatario humano)

### Google Search Console
- **Propiedad:** `https://bigotescaninos.com/` (URL prefix, NO sc-domain)
- **Permission level:** siteOwner ✅ (validado 2026-05-06)
- **Credencial n8n reusada:** `XWbfIBmitmx1uByl` (googleOAuth2Api compartida con felino)

> Detalles completos en [`_config/INTEGRACIONES_TECNICAS.md`](_config/INTEGRACIONES_TECNICAS.md).

---

## Cadencia de Publicación

| Parámetro | Valor |
|-----------|-------|
| Frecuencia | 3 artículos/semana |
| Días | **Martes, Jueves, Sábado** (decisión 2026-05-07, vs L/M/V del felino) |
| Hora | 8am Colombia (cron `0 8 * * 2,4,6` con `timezone: America/Bogota`) |
| Lógica | Consistencia > volumen — el sweet spot validado por el felino |

---

## Datos GSC (16 meses, 2025-01-06 → 2026-05-06)

🚨 **Hallazgo crítico que cambia la estrategia:**

| Página | Clicks 16m | Impresiones | CTR | Pos | % del total |
|--------|-----------|-------------|-----|-----|-------------|
| `/salud/gonorrea-en-perros/` | 2.946 | 71.118 | 4.48% | 2.96 | **97.5%** |
| Resto del sitio (86 páginas) | 74 | 127.923 | 0.06% | mostly >50 | 2.5% |

**Implicaciones:**
1. El catálogo histórico tiene poco valor SEO sustantivo
2. La página viral está sobre un **mito médico** (los perros no contraen gonorrea humana) — riesgo E-E-A-T para AEO
3. WF8 (Bulk AEO Migrator) tiene prioridad **baja** — no es el motor de tráfico esperado
4. WF1 + WF5 + WF6 (construir contenido nuevo) son los workhorses reales
5. Hub Comportamiento es **100% virgen** en GSC → mayor oportunidad
6. Cuota Colombia REAL = 0% — construir LATAM desde cero

**Tratamiento de la página viral:** ejecutar WF-Util Force Re-optimize Post sobre ella para:
- Aclarar el mito desde el H1
- Mejorar CTR (4.48% → objetivo 15%+ → triplicaría el tráfico actual)
- Preservar ranking (URL, keyword principal en H1, longitud)

> Análisis GSC completo en [`_contexto/auditoria_estrategia.md`](_contexto/auditoria_estrategia.md) §11.

---

## Score de Salud Digital

| Dimensión | Score actual | Target 90d |
|-----------|-------------|-----------|
| Dimensión | Auditoría inicial 2026-05-06 | Hoy 2026-05-11 | Target 90d |
|-----------|------------------------------|----------------|------------|
| Volumen útil | 5/10 | 5/10 | 9/10 (+39 posts) |
| Calidad técnica SEO | 4/10 | **7/10** | 8/10 |
| Experiencia de usuario | 4/10 | **7/10** | 8/10 |
| Actividad editorial | 1/10 | 2/10 | 8/10 |
| Presencia en redes | 1/10 | 1/10 | 1/10 (fuera de alcance) |
| Monetización | 3/10 | **8/10** | 8/10 (target alcanzado) |
| Seguridad | implícito | **9/10** | 9/10 |
| **Global** | **3.0/10** | **~7.0/10** | **7.5/10** |

> Hitos del 2026-05-11: AdSense 4 slots BC renderizando (`3633283970`, `3771060945`, `8640628684`, `2457979274`); footer con 4 enlaces legales vía menú Pie de página; sidebar layout Kadence activado + Block 3 Sidebar Sticky en widget; `/wp-json/wp/v2/users` bloqueado (Stop User Enumeration); imágenes destacadas /blog/ cargando tras Guest Mode LiteSpeed OFF. Brand safety + Funding Choices + CCPA heredados de BF a nivel cuenta AdSense (`ca-pub-9927086309447038` compartido). Detalles completos en [`_config/adsense/SETUP_COMPLETO.md`](_config/adsense/SETUP_COMPLETO.md).

**Comparativa vs felino al inicio:** 3.0/10 vs 4.2/10 → -1.2 (canino arranca más débil por concentración extrema en 1 página + sin tienda + sin redes propias).

---

## Workflows desplegados (11 — paridad TOTAL con felino, 2026-05-07)

| Workflow | n8n ID | Trigger | Estado |
|----------|--------|---------|--------|
| WF1 — Blog SEO | `vQJ5gCIDbNq2zqd8` | Cron 8am + lógica Mar/Jue/Sáb | 🟢 **Active** |
| WF3 — Re-optimización SEO | `PloVJdTP2G8lKMNo` | Cron 1° de mes + Manual | 🟡 **Inactivo** (dormido hasta WF8 termine) |
| WF5 — Generador de Ideas | (otro chat) | Manual | (otro chat) |
| WF6 — Pillar Generator | `37ZMWhzGb3ObewQ6` | Manual | ⚪ Manual (cumplió: 4 pilares creados) |
| WF7 — AEO Monitor | `RYhnbWPasSKE5HL6` | Cron Lun 9am + Manual | 🟢 **Active** |
| WF8 — Bulk AEO Migrator | `4vPCym417t5nO9ru` | Manual | 🟡 En ejecución gradual (1 run/sem) |
| WF9 — Pilares Auto-Sync | `VUA4Rnm3hYWVqcE5` | Cron diario 8:30am + Manual | 🟢 **Active** |
| WF11 — GSC Weekly Dashboard | `39sEBfGprwCtVKOD` | Cron Lun 9am + Manual | 🟢 **Active** |
| WF-Util — Force Re-optimize | `n3j1DIxnMIJ5Xahw` | Webhook POST `/webhook/bc-force-reopt-post` | 🟢 **Active** |
| WF-Util — Publicar Páginas Legales | `nx5ivvkMVVMBDpqE` | Manual + Webhook POST `/webhook/bc-publish-legales` | 🟢 **Active** (v3: idempotente con marker bc-legal-doc, trash+create cuando ausente, cleanup `-2`) |
| WF-Util — Force Publish Drafts | `ZXGkalck7p1Ugj26` | Webhook POST `/webhook/bc-force-publish-drafts` | 🟡 Auxiliar (one-off para rescatar drafts sin contenido) |
| WF-Util — Footer Insert Legales | `TUClcBl9RKIzw7Tz` | Webhook POST `/webhook/bc-footer-insert-legales` | 🟢 **Active** (POST widget custom_html .bc-legal-links a footer5) |

❌ WF2 (Redes Sociales) — eliminado del proyecto BC
❌ WF4 (Entretenimiento) — eliminado del proyecto BC

**Nomenclatura:** `BC - WF<n> - <descripción>` — ejemplo: `BC - WF1 - Blog SEO: Keyword → Publicar en WordPress`.

### Validados E2E el 2026-05-07

- WF1 → post 1973 publicado (`/salud/cuanto-cuesta-esterilizar-un-perro-en-colombia/`)
- WF6 → 4 pilares publicados (page IDs 1979/1981/1983/1985)
- WF9 → 79 clusters distribuidos en 4 pilares en 2s (idempotente)
- WF11 → primer snapshot GSC en hojas Sheet
- WF-Util → 2 posts re-optimizados (591 popo-verde + 25 gonorrea con Quality 105/107)
- WF-Util Legales → 4 páginas legales con contenido nuevo Ley 1581 (Aviso Legal 2058, Términos 2054, Política Cookies 2059, Política Privacidad 2060), 3 IDs antiguos eliminados permanentemente (663, 666, 12), 2 duplicados `-2` también borrados

> Detalles de cada workflow en [`_contexto/FLUJO_COMPLETO.md`](_contexto/FLUJO_COMPLETO.md).

---

## Estructura del Proyecto

```
bigotes-caninos/
├── CLAUDE.md                           ← este archivo
├── .env                                ← credenciales (nunca commitear)
├── .mcp.json                           ← n8n MCP server
├── .claude/
│   └── settings.json                   ← permisos Claude Code
├── _contexto/
│   ├── FLUJO_COMPLETO.md              ← documentación técnica detallada de cada workflow
│   ├── RESUMEN_PROYECTO.md            ← resumen ejecutivo del proyecto y los 8 workflows
│   ├── CREDENCIALES_Y_COSTOS.md       ← todas las APIs, claves y estimación de costos
│   ├── ESTRATEGIA_NEGOCIO.md          ← visión, pilares, arquitectura, monetización
│   ├── auditoria_estrategia.md        ← auditoría inicial + datos GSC reales (§11)
│   └── raw_gsc/
│       └── gsc_response.json          ← snapshot GSC 16 meses (2026-05-06)
├── _brandkit/
│   └── IDENTIDAD_VOZ.md               ← Vet-Friend canino, diccionario, prohibiciones
├── _plantillas/
│   └── BLUEPRINTS_CONTENIDO.txt       ← estructuras y skills (sin redes)
├── _config/
│   └── INTEGRACIONES_TECNICAS.md      ← endpoints, IDs, gotchas heredados
├── _aeo/
│   ├── README.md                      ← plan Sprints 1-4
│   ├── sprint-1/
│   │   ├── llms.txt                   ← desplegar en /llms.txt
│   │   └── equipo-editorial.html      ← desplegar como WP page
│   ├── sprint-2/                      ← (vacía hasta ejecutar)
│   ├── sprint-3/                      ← (vacía hasta ejecutar)
│   └── sprint-4/                      ← (vacía hasta ejecutar)
└── _tmp/
    └── BC_GSC_Explorer.json           ← workflow temporal (ya consumido)
```

---

## Reglas de Operación

1. **Nunca hardcodear credenciales.** Todas las claves van en `.env` o en n8n cifrado.
2. **Todo workflow incluye manejo de errores.** Si una fase falla, el pipeline notifica y registra sin romperse.
3. **El Diccionario de Marca es vinculante.** Antes de entregar cualquier pieza, verificar que no contenga términos prohibidos (mascota, dueño, perrito chiquito, etc.).
4. **La imagen siempre acompaña al blog.** No se publica un post sin imagen destacada generada y subida.
5. **El Master Sheet es la fuente de verdad.** El estado de cada keyword refleja el estado real del pipeline.
6. **Heredar todas las gotchas técnicas del felino** (ver `_config/INTEGRACIONES_TECNICAS.md` §8). Ningún punto se redescubre.
7. **Sin redes sociales bajo ninguna circunstancia.** Si en el futuro se decide añadirlas, será un sprint independiente.
8. **Nomenclatura n8n:** `BC - WF<n> - <descripción>`. Permite ver ambos proyectos lado a lado en la misma instancia.
9. **Cuota Colombia 6/15 obligatoria** en WF5 — paridad con felino.
10. **Whitelist estricta de 7 fuentes científicas caninas** en todos los workflows que usan GPT.

---

## Estado del Pipeline (2026-05-07 — TODO desplegado)

### ✅ Completado en sesiones 2026-05-06 / 2026-05-07

**Bootstrap (2026-05-06):**
- Estructura de directorios + 11 archivos de contexto
- Auditoría completa del sitio + datos GSC 16 meses (hallazgo bomba: `gonorrea-en-perros` = 97.5% del tráfico)
- 23 decisiones arquitectónicas registradas
- Master Sheet con 4 hojas + 77 posts importados con hub asignado
- 5 credenciales BC creadas (WP, OpenAI, nano banana, Telegram, validadas E2E)
- Plugin `bc-yoast-rest` instalado y validado
- Página `/equipo-editorial/` publicada (post ID 1966)
- Schema Organization confirmado en Yoast
- 3 referencias felinas en footer eliminadas (Facebook, Instagram, Páginas aliadas)
- Bio de autor actualizada ("Equipo Editorial Bigotes Caninos")

**Despliegue de workflows (2026-05-07):**
- 9 workflows construidos con paridad total con felino
- 6 workflows en estado active (WF1, WF6 cumplió, WF7, WF9, WF11, WF-Util)
- 2 workflows manuales operativos (WF6 cumplió misión 4 pilares; WF8 ejecución gradual usuario)
- 1 workflow dormido intencionalmente (WF3 espera maduración del catálogo)

**Contenido producido en esta sesión:**
- 1 post nuevo (post 1973 — primer artículo automatizado)
- 4 pilares (pages 1979, 1981, 1983, 1985)
- 2 posts re-optimizados con AEO completo (591 popo-verde + 25 gonorrea con mito aclarado)
- 79 clusters sincronizados en pilares vía WF9

### Setup AdSense desplegado (2026-05-07)

- 4 páginas legales sincronizadas vía workflow `nx5ivvkMVVMBDpqE` (después recreadas como IDs 2058, 2054, 2059, 2060 — ver sesión 2026-05-11)
- Páginas preexistentes con jurisdicción equivocada (Ley 34/2002 española) sobrescritas con contenido Ley 1581 colombiana
- 2 duplicados `-2` (creados en una corrida fallida) trasheados automáticamente
- `ads.txt` validado, Auto Ads off, Site Kit conectado, CookieYes preinstalado
- Falta acción manual del usuario: 4 ad units AdSense, instalar Ad Inserter, brand safety, Funding Choices, footer enlaces, configurar CookieYes, **purgar LiteSpeed Cache**

### Cierre AdSense + correcciones técnicas (2026-05-11)

**AdSense al 100%:**
- 4 ad units BC creados en AdSense: `3633283970` (In-article 1), `3771060945` (In-article 2), `8640628684` (Sidebar Sticky), `2457979274` (Pre-FAQ)
- Plugin Ad Inserter Free 2.8.15 instalado + 4 bloques configurados (Bloque 1 párrafo 3, Bloque 2 párrafo 10, Bloque 3 sidebar widget, Bloque 4 párrafo 8)
- CSS `.bc-ad-*` + `.bc-legal-links` + `.bc-legal-doc` pegado en Customizer
- Sidebar Layout activado en Kadence (Apariencia → Personalizar → Diseño de entradas/páginas → Entradas → With Sidebar) + widget Ad Inserter Block 3 en Barra Lateral 1 → slot 8640628684 renderizando
- Slot intruso del felino (`1211888823`) eliminado tras purga LiteSpeed
- Brand safety + Funding Choices + CCPA heredados de BF a nivel cuenta AdSense

**Página legales finales:**
- Aviso Legal `2058`, Términos `2054`, Política Cookies `2059`, Política Privacidad `2060`
- 3 IDs antiguos eliminados permanentemente (663, 666, 12)
- Sin plugins de cookies redundantes (paridad con BF que tampoco usa banner)

**Footer enlaces legales:**
- 4 enlaces agregados como Custom Links al menú "Pie de página" existente (NO vía widget, porque Kadence Footer Builder no expone widget areas tradicionales footer1-footer6)
- Visible en columna footer3 (nav_menu-1)

**Seguridad:**
- Plugin "Stop User Enumeration" instalado → `/wp-json/wp/v2/users` HTTP 401, `?author=N` HTTP 403, `/users/{id}` HTTP 401

**UX:**
- Imágenes destacadas en `/blog/` cargando correctamente tras desactivar Guest Mode de LiteSpeed Cache (Page Optimization → Media Settings → Lazy Load Images OFF + Guest Optimization OFF). Las 10 featured images con `src` directo a `wp-content/uploads/`

### ⏳ Pendiente — Operación continua

- Continuar runs de WF8 1/semana (~$5 total para migrar los 77 posts)
- Mantener Sheet con keywords aprobadas (WF5 ayuda a llenarlo)
- Después de 2-3 meses: activar WF3 manualmente (toggle Active en n8n UI)
- Vigilar cuota SerpAPI combinada con felino (~160/mes vs free tier 100)
- Pendiente AdSense usuario: ver checklist completo en [`_config/adsense/SETUP_COMPLETO.md`](_config/adsense/SETUP_COMPLETO.md) §"Pendientes del usuario"

---

## Checklist de Acciones Manuales del Usuario

Estas acciones requieren tu cuenta o decisión y solo tú puedes ejecutarlas.

### Bloque 1 — Cuentas y credenciales ✅ COMPLETADO (sistema funcionando E2E)

- [x] **Telegram bot** — recibe mensajes correctamente (chat_id `1591872862`, credencial n8n `g7wMmmirtuG1Ryu9` reusada de BF)
- [x] **API key OpenAI** — credencial n8n `ALqgbg5Kq6byqHSI` (`BC - OpenAI Account`)
- [x] **API key Gemini** — credencial n8n `ysOycTrtxEO3BRcW` (`BF - BC - nano banana`) compartida con BF
- [x] **Application Password WordPress** — credencial n8n `yyhjFRj5iigjQV9y` (`BC - WordPress`)
- [x] **Master Sheet** — operativa, WF1 lee/escribe correctamente

### 🔥 Bloque 2 — Correcciones técnicas críticas en WordPress

- [x] **Corregir redes sociales del homepage** — verificado 2026-05-11: 0 enlaces a bigotesfelinos/bigotesfelinoscol en el HOME
- [ ] **Eliminar categoría WP huérfana `Blog2`** (ID 1, slug `blog2`, 0 posts) — WP la reserva como Default Post Category. Requiere cambiar default en Ajustes → Escritura primero. Inofensivo (0 posts)
- [x] **Renombrar categoría WP `Educación` → `Educación y Comportamiento`** (ID 43) — verificado 2026-05-11

### Bloque 3 — Configuración técnica WP

- [x] **Configurar Schema Organization** en Yoast — verificado 2026-05-11: schema Organization + WebSite + BreadcrumbList presentes
- [x] **Configurar BreadcrumbList** — verificado en HTML del HOME
- [x] **Reemplazar `robots.txt`** físico — verificado 2026-05-11, contenido correcto con sitemap
- [x] **Bloquear `/wp-json/wp/v2/users`** — instalado plugin **Stop User Enumeration** (Fullworks) el 2026-05-11. Verificado: HTTP 401 endpoint + HTTP 403 ?author=N
- [x] **Diagnosticar imágenes destacadas /blog/** — root cause identificado y arreglado el 2026-05-11: Guest Mode de LiteSpeed sobrescribía Lazy Load. Fix: LiteSpeed Page Optimization → Media Settings → Lazy Load Images OFF + General → Guest Mode OFF. Verificado: 10/10 featured images con src directo
- [ ] **Crear autor real** "Equipo Bigotes Caninos" con bio veterinaria + foto y reasignar todos los posts viejos a ese autor — pendiente (requiere capability `create_users` vía UI, no automatizable por REST)

### Bloque 4 — AEO Sprint 1 ✅ COMPLETADO

- [x] **`/llms.txt`** desplegado en raíz del dominio — HTTP 200, 2692 bytes (verificado 2026-05-11)
- [x] **Página `/equipo-editorial/`** publicada (page ID 1966)
- [x] **Enlace "Equipo editorial"** visible en nav menu del sitio

### Bloque 5 — Pendientes manuales residuales (no críticos)

- [ ] **Crear autor real "Equipo Bigotes Caninos"** con bio veterinaria + foto y reasignar posts viejos al nuevo autor (mejora E-E-A-T) — requiere capability `create_users` vía UI
- [ ] **Asignar featured image al post ID 716** (`/como-determinar-las-necesidades-caloricas-de-un-perro.../`) — único post sin imagen del catálogo de 81
- [ ] **Eliminar categoría "sin categoria" (ID 1)** — requiere cambiar Default Post Category en Ajustes → Escritura primero. Cosmético, 0 posts asignados
- [ ] **Renombrar credencial n8n `BF - Telegram` (ID `g7wMmmirtuG1Ryu9`) → `BC - Telegram Bot`** — el credencial apunta correctamente al bot `@bigotescaninos_pipeline_bot` (id `8417271073`) pero el nombre está mal etiquetado (legacy del clon de BF). Cosmético operacional

---

## Documentos relacionados

- [`_contexto/RESUMEN_PROYECTO.md`](_contexto/RESUMEN_PROYECTO.md) — overview ejecutivo
- [`_contexto/FLUJO_COMPLETO.md`](_contexto/FLUJO_COMPLETO.md) — diseño detallado de cada workflow
- [`_contexto/CREDENCIALES_Y_COSTOS.md`](_contexto/CREDENCIALES_Y_COSTOS.md) — credenciales y proyección de costos
- [`_contexto/ESTRATEGIA_NEGOCIO.md`](_contexto/ESTRATEGIA_NEGOCIO.md) — visión + decisiones arquitectónicas
- [`_contexto/auditoria_estrategia.md`](_contexto/auditoria_estrategia.md) — auditoría + datos GSC reales
- [`_brandkit/IDENTIDAD_VOZ.md`](_brandkit/IDENTIDAD_VOZ.md) — voz, diccionario, restricciones visuales
- [`_plantillas/BLUEPRINTS_CONTENIDO.txt`](_plantillas/BLUEPRINTS_CONTENIDO.txt) — estructuras de blog SEO+AEO
- [`_config/INTEGRACIONES_TECNICAS.md`](_config/INTEGRACIONES_TECNICAS.md) — endpoints, IDs, gotchas técnicas
- [`_aeo/README.md`](_aeo/README.md) — plan de los 4 sprints AEO
- [`_config/adsense/SETUP_COMPLETO.md`](_config/adsense/SETUP_COMPLETO.md) — setup AdSense + páginas legales + brand safety
- [`_config/adsense/ad-inserter-blocks.md`](_config/adsense/ad-inserter-blocks.md) — código exacto de los 4 bloques Ad Inserter
- [`_legal/`](_legal/) — markdowns fuente de las 4 páginas legales (Ley 1581 + GDPR)
- [`.env`](.env) — variables de entorno (plantilla)
