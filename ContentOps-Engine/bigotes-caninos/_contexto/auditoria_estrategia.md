# Auditoría Estratégica: Bigotes Caninos

**Fecha de auditoría:** 2026-05-06 (con actualizaciones del 2026-05-07 reflejando acciones tomadas)
**Fuentes:** Scraping directo de bigotescaninos.com (homepage, /blog/), API REST WordPress (`/wp-json/wp/v2/categories`, `/users`, `/posts`), `robots.txt`, `sitemap_index.xml`, **Google Search Console API (16 meses)** vía workflow temporal creado y ejecutado el 2026-05-06.

> **Paridad con Bigotes Felinos:** este informe sigue la misma estructura que [`auditoria_estrategia.md`](../../bigotes-felinos/_contexto/auditoria_estrategia.md) del proyecto felino. Las diferencias se anotan en cada bloque.

---

## 1. Resumen Ejecutivo

Bigotes Caninos es un proyecto editorial sobre perros con **77 artículos publicados** distribuidos en 6 categorías (incluyendo una huérfana "Blog2"). El sitio tiene infraestructura WordPress + Yoast SEO funcional pero acumula **~13 meses de inactividad editorial** (última publicación: 31 de marzo de 2025) y arrastra **errores de configuración cruzada** con el proyecto hermano Bigotes Felinos — concretamente, las redes sociales del homepage apuntan a las cuentas felinas, fuga grave de tráfico que debe corregirse antes del primer post nuevo.

> **🚨 Hallazgo bomba (datos GSC 16m):** la página `/salud/gonorrea-en-perros/` acumula **2.946 de 3.020 clicks totales del sitio (97.5%)**. Sin esta página, el sitio tiene **74 clicks en 16 meses** — está prácticamente sin tráfico orgánico real. Esto cambia totalmente la lectura del catálogo: NO es un activo SEO sustancial sino un proyecto que arranca **casi como tabula rasa**, con 87 páginas indexadas pero la inmensa mayoría en posición 50+ y casi sin clicks. Detalle completo en §11.

Comparado con Bigotes Felinos al inicio de su pipeline (4.2/10), el canino arranca **1.2 puntos por debajo** (3.0/10) tras revisión con datos GSC reales. El gap viene principalmente de: (a) catálogo histórico con valor SEO real muy concentrado en una sola página viral, (b) ausencia de tienda WooCommerce y funnel de monetización, (c) ausencia de comunidad social propia verificada, (d) errores de cross-config con el felino, (e) **cuota Colombia REAL = 0%** — el sitio no tiene tráfico colombiano detectable.

**Estrategia recomendada:** dado el hallazgo GSC, el énfasis se desplaza desde "re-optimizar lo viejo" hacia "**construir hubs nuevos**" — especialmente Comportamiento y Adiestramiento (100% virgen en GSC) y contenido localizado Colombia. WF8 (Bulk AEO Migrator) tendrá menos impacto del esperado; WF1 + WF5 + WF6 son los workhorses reales para este proyecto.

---

## 2. Estado del Blog — Análisis Detallado

### Volumen y categorización

| Categoría WP | Slug | ID | Posts (count API) | Públicos (publish) |
|--------------|------|----|----|---|
| Salud | `salud` | 41 | 32 | 32 |
| Alimentación | `alimentacion` | 42 | 22 | 22 |
| Razas | `razas` | 45 | 18 | 18 |
| Noticias | `noticias` | 157 | 12 | 0 (todos en draft/private) |
| Educación | `educacion` | 43 | 5 | 5 |
| Blog2 (huérfana) | `blog2` | 1 | 0 | 0 |
| **Total** | | | **89** | **77** |

> **Nota:** la API `/wp-json/wp/v2/categories` reporta `count` incluyendo posts en cualquier estado (publish + draft + private). El total "89" representa contenido total en WP. El total **77** es lo realmente público/indexado (`X-WP-Total` de `/wp-json/wp/v2/posts` que filtra por defecto a `status=publish`). Los 12 de "Noticias" no son visibles públicamente — quedan fuera de WF1/WF8.

**Hallazgos:**
- **Educación está sub-explotada (5 posts, 5,6%)** — es el hub natural para Comportamiento + Adiestramiento, donde el nicho canino tiene oportunidades de tráfico altísimas (adiestramiento, ansiedad por separación, socialización).
- **Salud lidera (36%)** — patrón sano para el nicho, mismo que felino al inicio.
- **Blog2 huérfana** — categoría heredada sin posts, contamina la estructura.
- **Distribución a corregir:** la categoría WP "Educación" se renombrará a **"Educación y Comportamiento"** para cubrir adiestramiento, comportamiento canino y conducta — paridad con el hub `Comportamiento y Adiestramiento` del Master Sheet.

### Cadencia de publicación histórica

| Período | Estado |
|---------|--------|
| Última publicación real | **2025-03-31** — "Los beneficios insospechados de abrazar a tu perro" |
| Período de inactividad | **~13 meses** (abr 2025 → may 2026) |
| Última modificación del sitemap | 2025-03-31 |

**Hallazgo crítico:** patrón idéntico al felino — proyecto dormido, no muerto. Los 77 posts indexados son un activo real de re-optimización.

### Autores expuestos en API REST

```
ID 1 → name: "bigotescaninos.com" · slug: bigotescaninos-com
ID 2 → name: "User Post News"     · slug: userpostnews
```

**Riesgo doble:**
- **Seguridad:** los slugs son enumerables y facilitan ataques de fuerza bruta al login WP.
- **Editorial:** el autor "User Post News" sugiere uso previo de una herramienta de repost/scraping automático. **Bandera E-E-A-T para AEO** — si Google detecta autoría no humana, perjudica la visibilidad en AI Overviews. Recomendación: crear autor con identidad real + foto + bio (ver Sprint 1 AEO `equipo-editorial.html`).

---

## 3. Errores Técnicos Identificados

### BLOQUE A — Críticos (sangrando tráfico/conversión hoy)

| # | Error | Ubicación | Impacto | Acción |
|---|-------|-----------|---------|--------|
| 1 | **Redes sociales del homepage apuntan al proyecto FELINO** | Footer/header → `facebook.com/bigotesfelinoscol/` e `instagram.com/bigotesfelinos` | Filtra tráfico canino hacia el dominio hermano. Confunde marca | Corregir URLs a redes propias canino (cuando se creen) o eliminar enlaces hasta tenerlas |
| 2 | **Imágenes destacadas no cargan en `/blog/`** | Listing del blog | Placeholders SVG con baja opacidad → bounce rate alto | Misma raíz que felino: revisar configuración del tema Kadence (lazy load + featured image fallback) |
| 3 | **Newsletter no visible** | Homepage y `/blog/` | Captura de leads = 0 | Decidir si se quiere captura email; si sí, instalar plugin (MC4WP / Brevo / ConvertKit) y colocar en footer + sticky en blog |
| 4 | **Inactividad editorial ~13 meses** | Sitewide | Caída de autoridad editorial, crawl budget reducido | Reactivar con WF1 una vez resueltos correcciones técnicas |
| 5 | **Autores genéricos / probable repost automático** | API REST + posts existentes | Riesgo E-E-A-T para AEO; perjudica citaciones en AI Overview | Crear autor real ("Equipo Bigotes Caninos") con bio veterinaria; reasignar posts viejos en bulk |

### BLOQUE B — SEO Técnico (afectan ranking pero no sangran)

| # | Problema detectado | Acción requerida | Estado |
|---|-------------------|------------------|--------|
| 6 | ~~**Sin Schema Markup global**~~ ✅ **Falsa alarma — ya configurado.** Verificado 2026-05-06 vía REST: Yoast inyecta Organization (con logo `cropped-logo-bigotes-canino-blanco.png`), BreadcrumbList, WebSite, Person en cada página. La auditoría inicial vía WebFetch no parseó `yoast_head_json` y reportó incorrectamente. | ✅ Sin acción requerida |
| 7 | **`robots.txt` con `Disallow:` vacío** (`User-agent: * / Disallow:`) | Crear `public_html/robots.txt` físico con reglas explícitas (paridad con felino 2026-04-24): `Disallow: /wp-admin/`, `Disallow: /wp-includes/`, `Allow: /wp-admin/admin-ajax.php`, `Sitemap: …` | ⏳ Pendiente |
| 8 | **Endpoint `/wp-json/wp/v2/users` enumera 2 autores** con slugs y avatares | Bloquear endpoint para no autenticados (plugin `Disable WP REST API` con whitelist o snippet `rest_endpoints` filter) | ⏳ Pendiente |
| 9 | **`llms.txt` no existe** (404) | Generar archivo en Sprint 1 AEO (paridad felino) y subirlo a `bigotescaninos.com/llms.txt` | ⏳ Pendiente — Sprint 1 |
| 10 | **Categoría huérfana `Blog2` (ID 1, 0 posts)** | Eliminar desde WP Admin → Posts → Categorías | ⏳ Pendiente |
| 11 | **Sitemap stale** (lastmod 2025-03-31) | Se resuelve solo cuando WF1 publique el primer post nuevo | ⏳ Auto-resuelve con primer post |

### BLOQUE C — Estrategia de Contenido: integrar al pipeline desde el inicio

| # | Oportunidad | Acción en el pipeline |
|---|-------------|-----------------------|
| 12 | **77 posts existentes con potencial de re-optimización rápida** — magnitud comparable al felino al inicio (106) | WF8 (Bulk AEO Migrator) procesa 10 posts/run con stack AEO completo. WF3 detecta posts en posición 6-50 con CTR bajo |
| 13 | **Contenido estacional canino ausente** — sin pieza para Día Internacional del Perro (26 jul), Día del Animal (4 oct), Halloween + perros, Black Friday alimento, Navidad | Sembrar keywords estacionales en Master Sheet con `fecha_objetivo` (col K). WF1 prioriza 14 días antes |
| 14 | **Intención transaccional local sin cubrir** — esterilización Colombia, vacunas COP, adiestramiento Bogotá/Medellín, cuánto cuesta un golden colombiano | Cuota Colombia 6/15 en WF5 (paridad felino), modificadores locales en keywords |
| 15 | **Hub Comportamiento sub-explotado** (5 posts en Educación) — alta demanda en adiestramiento, ansiedad por separación, socialización cachorro | Priorizar este hub en los primeros 30 días de pipeline para reequilibrar la distribución |
| 16 | **Sin tienda WooCommerce** (vs felino que tenía $49k–$270k COP en productos) | Modelo de monetización: afiliados Amazon/Mercado Libre + AdSense + lead magnets. Ver `ESTRATEGIA_NEGOCIO.md` |
| 17 | **WordPress aún sin Application Password ni `bf-yoast-rest`-equivalente** ⚠️ | C9 ya validado: crear Application Password al desplegar pipeline. C10 confirmado: plugin escritura de meta Yoast vía REST ya está instalado |

---

## 4. Análisis de Redes Sociales

**Estado:** sin redes sociales propias verificadas. Las URLs visibles en el homepage apuntan al proyecto felino (error de config).

**Decisión del proyecto:** Bigotes Caninos es **100% blog SEO+AEO**. No se replican WF2 (Redes) ni WF4 (Entretenimiento). Si en el futuro se decide añadir redes sociales propias, será un sprint independiente.

**Acción inmediata:** corregir el footer/header del homepage para que NO enlace a las redes felinas. Hasta que existan redes propias, dejar los iconos sociales ocultos en el tema Kadence.

---

## 5. Análisis de Contenido Existente — Oportunidades Perdidas

### Keywords de alto valor sin explotar (estimadas — pendiente confirmación con datos GSC)

| Keyword potencial | Intención | Volumen estimado |
|-------------------|-----------|------------------|
| `cuánto cuesta esterilizar un perro Colombia` | Transaccional | Alto |
| `vacunas para perros precio Colombia` | Transaccional | Alto |
| `golden retriever precio Colombia` | Transaccional | Alto |
| `cómo enseñar a mi perro a no morder` | Informacional accionable | Alto |
| `ansiedad por separación perros` | Informacional urgente | Alto |
| `mejor comida para perros adultos` | Comercial | Alto |
| `parvovirus en cachorros síntomas` | Informacional urgente | Alto |
| `socialización cachorro` | Informacional | Medio-alto |
| `adiestramiento canino Bogotá` | Local/transaccional | Medio |

**Validación pendiente:** datos reales de GSC vía workflow `BC - GSC Explorer (temporal)`.

### Contenido estacional ausente

- **Día Internacional del Perro (26 julio):** sin contenido — uno de los días de mayor engagement orgánico para el nicho
- **Halloween + perros:** sin guía sobre disfraces seguros, golosinas peligrosas, ruidos
- **Día del Animal (4 octubre):** sin pieza editorial
- **Black Friday alimento canino:** sin comparativa de marcas/precios
- **Navidad:** sin guía sobre alimentos peligrosos en mesa, regalos, ruidos
- **Día de San Roque (16 agosto, patrón de los perros):** culturalmente relevante en LATAM

---

## 6. Activos No Aprovechados

### Sin tienda — modelo de monetización alternativo

A diferencia del felino (que tiene WooCommerce con productos físicos), Bigotes Caninos **no tiene tienda**. Pero los hubs Salud y Alimentación generan tráfico con altísima intención comercial. Modelo recomendado:
- **Afiliados** (Amazon Colombia, Mercado Libre, Falabella) en posts de Alimentación y productos de Salud
- **AdSense** o equivalente para tráfico informacional masivo
- **Lead magnets** (PDFs descargables) para construir lista de email

> Tienda WooCommerce queda como decisión a futuro si el tráfico justifica la inversión (C11).

### Categoría "Noticias" como entrada para Discover

Felino tiene Noticias casi vacía (<5%). Canino tiene **12 posts en Noticias (13%)** — proporcionalmente más. Posible activo para Google Discover si se publican noticias caninas en formato AMP/Web Stories. **A evaluar después de los primeros 30 días.**

---

## 7. Mapa de Prioridades para el Pipeline

### Prioridad 1 — Correcciones técnicas (paralelas al pipeline, no bloquean el primer post)
1. ⚠️ **Corregir redes sociales del homepage** (apuntan al felino — fuga de tráfico)
2. Reparar imágenes destacadas en `/blog/` (revisar Kadence)
3. Configurar Schema Markup global vía Yoast (Organization + BreadcrumbList)
4. Corregir `robots.txt` (paridad felino)
5. Bloquear `/wp-json/wp/v2/users` para no autenticados
6. Crear autor "Equipo Bigotes Caninos" + bio + reasignar posts viejos
7. Crear Application Password para WP REST API
8. Eliminar categoría huérfana `Blog2`
9. Renombrar categoría `Educación` → `Educación y Comportamiento`

### Prioridad 2 — Sprint 1 AEO (en paralelo)
- Generar `llms.txt` y publicar en `bigotescaninos.com/llms.txt`
- Generar `equipo-editorial.html` y publicarla como page
- Configurar GSC + verificar datos disponibles (✅ ya verificado por usuario)
- Setup del Master Sheet (Bigotes Caninos — Master Sheet)

### Prioridad 3 — Primer mes de producción (Reactivación)
- Post inaugural "Volvimos" con tono Vet-Friend canino
- 4 posts de alto volumen con intención transaccional + Colombia
- Priorizar hub Comportamiento y Adiestramiento (sub-explotado)
- Activar WF8 (Bulk AEO Migrator) para empezar la migración del catálogo histórico

### Prioridad 4 — Mes 2+ (Operación continua)
- Pipeline automatizado martes/jueves/sábado con WF1
- Re-optimización mensual (WF3) sobre los 77 posts indexados
- Sprint 2/3 AEO progresivo
- Decisión sobre redes sociales propias (si se decide, sprint separado)

---

## 8. Score de Salud Digital

### Bigotes Caninos (revisado con datos GSC reales)

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Volumen de contenido | **5/10** | 77 posts publicados, 87 con impresiones, pero 47% en pos 51+ y 97.5% del tráfico concentrado en 1 sola página viral |
| Calidad técnica SEO | 4/10 | Sin schema, robots laxo, users expuestos, llms.txt ausente |
| Experiencia de usuario | 4/10 | Imágenes rotas, sin newsletter, redes apuntan al felino |
| Actividad editorial reciente | 1/10 | ~13 meses sin publicar |
| Presencia en redes | 1/10 | Sin redes propias verificadas |
| Monetización (funnel) | 3/10 | Sin tienda, sin afiliados configurados, sin lead magnets |
| **Score global** | **3.0/10** | **Proyecto casi tabula rasa — el catálogo no es el activo SEO que parecía** |

### Comparativa con Bigotes Felinos al inicio (4.2/10)

| Dimensión | Caninos | Felinos | Δ |
|-----------|---------|---------|---|
| Volumen útil | 5/10 | 8/10 | **-3** (concentración extrema en 1 página) |
| Calidad SEO | 4/10 | 4/10 | = |
| UX | 4/10 | 5/10 | -1 |
| Actividad | 1/10 | 1/10 | = |
| Redes | 1/10 | 2/10 | -1 |
| Monetización | 3/10 | 5/10 | -2 |
| **Global** | **3.0/10** | **4.2/10** | **-1.2** |

### Target a 90 días

| Dimensión | Score actual | Target 90d |
|-----------|--------------|-----------|
| Volumen | 7/10 | 9/10 (+39 posts a ritmo 3/sem martes/jueves/sábado durante 13 semanas) |
| Calidad SEO | 4/10 | 8/10 (Bloque B + AEO Sprints 1-4) |
| UX | 4/10 | 8/10 (correcciones Bloque A + newsletter) |
| Actividad | 1/10 | 8/10 (publicación consistente) |
| Redes | 1/10 | 1/10 (sin cambios — fuera de alcance) |
| Monetización | 3/10 | 6/10 (afiliados + AdSense + lead magnets) |
| **Global** | **3.3/10** | **6.7/10** |

---

## 9. Conclusión

Bigotes Caninos no es un proyecto vacío — es un proyecto dormido con **77 artículos indexados, dominio con historial real y categorización ya estructurada**. La mayor diferencia con el felino al inicio no es la salud editorial sino la ausencia de monetización (sin tienda) y la ausencia de comunidad social propia.

El **mayor riesgo identificado** es la fuga de tráfico hacia el felino vía las redes sociales mal apuntadas en el homepage — corregir esto **antes** del primer post nuevo es no negociable.

La **mayor oportunidad inmediata** es el hub de Comportamiento y Adiestramiento (sub-explotado con 5 posts) y el contenido estacional ausente (especialmente Día Internacional del Perro 26 jul).

**Tiempo estimado para recuperar autoridad:** 60-90 días de producción consistente (martes/jueves/sábado) en paralelo a las correcciones técnicas — mismo horizonte que el felino.

---

## 10. Pendientes para enriquecer esta auditoría

- [x] ~~Datos GSC reales vía workflow `BC - GSC Explorer (temporal)`~~ → completado 2026-05-06, ver §11
- [x] ~~Confirmar tipo de propiedad GSC~~ → **URL prefix** (`https://bigotescaninos.com/`), no Domain. Refresh token actual tiene `siteOwner` ✅
- [ ] Auditar tema Kadence v1.2.16 para identificar la causa raíz de las imágenes que no cargan en `/blog/`
- [ ] Revisar plugins activos en WP para confirmar que `bf-yoast-rest`-equivalente está instalado (C10 marcado como ✅ por usuario, validar runtime)
- [x] ~~Decidir destino de la página viral `/salud/gonorrea-en-perros/`~~ → **RESUELTO 2026-05-07**: re-optimizada vía WF-Util (Quality Score 107) con AEO completo, **mito médico aclarado** desde el primer párrafo (Brucella canis vs Neisseria gonorrhoeae), citando WSAVA/AVMA/Merck Vet Manual. URL preservada (`/salud/gonorrea-en-perros/`). Yoast title actualizado: "Gonorrea en perros: causas, síntomas y tratamiento". Esperando ver impacto en CTR vía WF11 dashboards en próximas semanas.

---

## 11. Análisis GSC — datos reales (16 meses, 2025-01-06 → 2026-05-06)

### Resumen agregado

| Métrica | Valor |
|---------|-------|
| Páginas indexadas con impresiones | **87** (vs 77 posts publicados — 2 pages nunca aparecen) |
| Queries con impresiones | **1.000** (límite del export; long-tail puede ser mayor) |
| Clicks totales en 16 meses | **3.020** |
| Impresiones totales en 16 meses | **199.041** |
| CTR promedio del sitio | ~1.5% |

### 🚨 Hallazgo crítico: Sitio de un solo post

| Página | Clicks | Impresiones | CTR | Posición |
|--------|--------|-------------|-----|----------|
| `/salud/gonorrea-en-perros/` | **2.946** | 71.118 | 4.48% | 2.96 (top 3) |
| Resto del sitio (86 páginas) | **74** | 127.923 | 0.06% | mayoría > 50 |

**97.5% del tráfico orgánico** del sitio entero proviene de una sola página sobre un término **médicamente cuestionable** (los perros no contraen gonorrea humana — el término es un mito viral con alta demanda en buscadores). Implicaciones:

1. **El catálogo histórico tiene poco valor SEO sustantivo** — 86 páginas no generan clicks. WF8 (Bulk AEO Migrator) tendrá impacto editorial pero no de tráfico inmediato.
2. **Riesgo reputacional con AEO**: si Google AI Overview cita el contenido sobre "gonorrea en perros" se exporta un mito. Recomendación → re-optimizar la página para clarificar que el término popular no corresponde a una enfermedad real, manteniendo el ranking pero corrigiendo la información.
3. **El proyecto canino es casi tabula rasa** — opera con 87 páginas indexadas pero 41 en posición 51+ que prácticamente no existen para Google.

### Distribución de posiciones (87 pages con impresiones)

| Rango | # Pages | % |
|-------|---------|---|
| 1-3 (top 3) | 2 | 2% |
| 4-10 (página 1) | 19 | 22% |
| 11-20 (página 2) | 6 | 7% |
| 21-50 | 19 | 22% |
| 51+ (sumergidas) | **41** | 47% |

**47% del catálogo está en posición 51+** — invisible en la práctica. WF3 (Re-optimización) trabaja sobre posición 6-50 → solo 25 candidatos en total, y de esos solo `/salud/popo-verde-en-perros/` (pos 15.4, 10.274 impresiones, 28 clicks) tiene volumen real para mover.

### Distribución de tráfico por hub URL

| Hub URL | Pages | Clicks | Impresiones | Comentario |
|---------|-------|--------|-------------|------------|
| `/salud/` | 30 | **2.997** | 163.319 | 99% del valor — pero concentrado en gonorrea |
| `/razas/` | 15 | 5 | **32.102** | Alta demanda, CTR ~0% — titles/metas mal optimizados |
| `/alimentacion/` | 13 | 7 | 2.896 | Sub-explotado |
| `/educacion/` | 4 | 1 | 399 | Casi inexistente — confirma necesidad de hub Comportamiento |
| `/noticias/` | 5 | 0 | 45 | Sin valor SEO actual |
| `root /` | 1 | 6 | 71 | Homepage |

### Hub Comportamiento y Adiestramiento: 100% virgen

Solo **1 query** detectada con palabras del hub Comportamiento (sobre 1000): "cabeza caliente perro" — y es marginal. Esto **valida la decisión B6/B7** de priorizar este hub: es el área de mayor oportunidad porque competidores no han llenado el espacio en este dominio.

### Cuota Colombia REAL = 0%

| Métrica | Valor |
|---------|-------|
| Queries con modificador colombiano (de 1000) | **1** |
| Queries con modificador "Bogotá/Medellín/Cali/Cartagena" | 0 |
| Clicks generados por queries colombianas | 0 |

El sitio NO tiene tráfico colombiano detectable. La cuota 6/15 acordada en E20 implica **construir desde cero** la presencia local. Esto es **oportunidad pura** porque la SERP colombiana de keywords caninas tiene menos competencia que la española genérica.

### Top 15 demand signals no capturados (alimentar WF5 inmediatamente)

| Query | Impresiones | Posición | Estado |
|-------|------------|----------|--------|
| diarrea en perros | 970 | 94.4 | Sin pieza dedicada o mal optimizada |
| hepatitis en perros | 732 | 78.7 | Sin pieza |
| hepatitis canina | 577 | 85.0 | Sin pieza |
| los perros más grandes del mundo | 407 | 80.9 | Tiene pieza pero ilegible para Google |
| cushing perros | 283 | 96.8 | Sin pieza |
| el perro más grande del mundo | 265 | 87.2 | Variante a fusionar con la anterior |
| cómo saber si mi perro está enfermo | 254 | 83.9 | Sin pieza generalista |
| caca verde en perros | 245 | 26.1 | Pieza existente pero pos baja |
| diarrea verde en perros | 243 | 30.2 | Variante a consolidar |
| hepatitis perros | 211 | 82.7 | Variante |
| heces verdes en perros | 202 | 24.7 | Variante |
| estreñimiento perro remedios | 193 | 75.6 | Pieza existente pero pos baja |
| **Total demanda no capturada (top 15)** | **~5.000+ impresiones/16m** | | |

Estas keywords son **inserciones inmediatas** en la Master Sheet (estado=`Aprobado`) cuando WF1 esté operativo.

### Top candidatos WF3 (re-optimización SEO)

| Página | Pos | Impresiones | Acción |
|--------|-----|-------------|--------|
| `/salud/gonorrea-en-perros/` | 2.96 | 71.118 | **Mejorar CTR**: hoy 4.48%, debería ser ~25-30% en pos 3. Title + meta description |
| `/salud/popo-verde-en-perros/` | 15.4 | 10.274 | Mover de pos 15 → 5 con AEO completo |
| `/razas/cuales-son-las-razas-de-perros-mas-grandes/` | 85.3 | 11.351 | Posición 85 con 11k impresiones es anomalía → query mismatch grave; reescribir desde cero |
| `/alimentacion/piramide-alimenticia-perros/` | 29.1 | 1.609 | Mover de pos 29 → 10 |
| `/salud/sindrome-de-cushing-en-perros/` | 89.9 | 1.625 | Reescribir + AEO completo |

### Implicaciones estratégicas (revisión post-GSC)

1. **Bajar el peso de WF8** (Bulk AEO Migrator) en el roadmap de los primeros 90 días. El catálogo no tiene tráfico que justifique la migración como prioridad alta. Ejecutarlo en background, no como bandera principal.
2. **Subir el peso de WF1 + WF5** — la fábrica de contenido nuevo es el motor real. Plan: 39 posts nuevos en 13 semanas (3/sem) con énfasis en Comportamiento + demanda no capturada.
3. **Hub Comportamiento como prioridad #1** del primer mes — espacio virgen + alta demanda real.
4. **Keywords de "demand signals no capturados" van directas al Sheet** como `Aprobado` — son layups con demanda demostrada por GSC.
5. **Re-optimizar la página viral de gonorrea** con cuidado editorial: arreglar título/meta para subir CTR sin desindexar; actualizar contenido para evitar que se cite el mito en AI Overview.
6. **Cuota Colombia 6/15 implica construir LATAM/Colombia desde cero** — fortaleza, no debilidad: SERP menos competida.

### Comparativa GSC: Bigotes Caninos vs Bigotes Felinos al inicio (estimación)

| Métrica | Caninos (real) | Felinos al inicio (estimado, lo que tenían en GSC al lanzarse el pipeline) |
|---------|---------------|---|
| Páginas indexadas con impresiones | 87 | ~106 |
| Concentración top 1 página | **97.5%** | ~10-15% |
| Pages en pos 1-10 | 21 (24%) | ~30-40 (~35%) |
| Pages en pos 51+ | 41 (47%) | ~20% estimado |
| Tráfico real útil | ~74 clicks/16m sin gonorrea | varios miles/año |

El proyecto canino tiene **mayor concentración de riesgo + menor base sólida de tráfico** que el felino al inicio. La estrategia de reactivación debe priorizar **construir** sobre **reactivar**.
