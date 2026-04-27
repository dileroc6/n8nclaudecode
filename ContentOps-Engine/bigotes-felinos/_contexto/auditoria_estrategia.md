# Auditoría Estratégica: Bigotes Felinos
**Fecha de auditoría:** 2026-04-23
**Fuentes:** Scraping directo de bigotesfelinos.com, API REST WordPress, sitemap.xml, robots.txt, búsqueda pública de redes sociales.

---

## 1. Resumen Ejecutivo

Bigotes Felinos es un proyecto editorial con base en Colombia, activo desde 2020, que acumula **106 artículos publicados** y una tienda WooCommerce operativa. La marca llegó a construir una comunidad de 17k seguidores en Instagram y 11k en Facebook. Sin embargo, el sitio presenta **inactividad editorial desde abril de 2025** y acumula errores técnicos críticos que frenan tanto el SEO como la conversión. El potencial de reactivación es alto: el contenido existente cubre nichos de alto volumen y la audiencia construida, aunque dormida, sigue siendo un activo real.

---

## 2. Estado del Blog — Análisis Detallado

### Volumen y Cadencia de Publicación

| Período | Posts publicados | Observación |
|---------|-----------------|-------------|
| Ago–Sep 2020 | 2 | Lanzamiento |
| Nov 2021 | 1 | — |
| Oct 2022 | 7 | Burst de contenido |
| Ago–Sep 2023 | 7 | Burst |
| Oct 2023 | 28 | Producción masiva (posiblemente IA) |
| May–Jun 2024 | 7 | — |
| Ago 2024 | 3 | — |
| Nov 2024 | 7 | — |
| Dic 2024 | 24 | Burst masivo |
| Ene 2025 | 10 | — |
| **Abr 2025** | **2** | **Último contenido real publicado** |
| May 2025 – Abr 2026 | **0** | **Inactividad editorial: ~12 meses** |

**Hallazgo crítico:** El sitemap muestra modificaciones en enero de 2026 en 10 posts, pero sin nuevos artículos. Son actualizaciones de contenido existente, no publicaciones nuevas. La última entrada real es del 15 de abril de 2025.

### Autor identificado
- `laura.dionisio@bigotesfelinos.com` — único autor visible en la API pública.
- **Riesgo de seguridad:** El endpoint `/wp-json/wp/v2/users` expone el email del autor. Recomendación: ocultar este campo en la API REST.

### Distribución por Categorías
- **Salud del gato:** ~35% del contenido — categoría más desarrollada
- **El mundo del gato:** ~30%
- **Razas de gatos:** ~20%
- **Alimentación del gato:** ~10%
- **Noticias:** <5% — categoría casi vacía, aparece en el menú pero sin contenido real

---

## 3. Errores Técnicos Identificados

### Críticos (bloquean conversión o SEO)

| # | Error | Ubicación | Impacto |
|---|-------|-----------|---------|
| 1 | **Formulario de newsletter roto** | Footer y homepage | Pérdida total de leads. Cada visita que llega al sitio y quiere suscribirse recibe un error. Meses de tráfico convertible perdidos. |
| 2 | **Imágenes no cargan en el blog** | `/blog-2/` | Los thumbnails de los posts muestran SVG placeholders en lugar de la imagen real. Experiencia de usuario degradada, afecta bounce rate. |
| 3 | **Texto "Lorem ipsum" visible** | `/blog-2/` sección "My Recent Articles" | Contenido de placeholder no reemplazado. Aspecto no profesional visible al usuario. |
| 4 | **Fechas de publicación ocultas en el blog** | Listado del blog | Google necesita señales de frescura. Sin fecha visible, los posts se perciben como contenido sin datar, lo que reduce el crawl budget y la confianza del usuario. |
| 5 | **Email del autor expuesto en API REST** | `/wp-json/wp/v2/users` | Riesgo de spam y ataques de fuerza bruta al login. |

### Moderados (afectan SEO técnico)

| # | Error | Detalle |
|---|-------|---------|
| 6 | **Sin Schema Markup / JSON-LD** | No se detecta ningún schema en el homepage. Ausencia de `Organization`, `Article`, `BreadcrumbList` o `FAQPage`. Oportunidad perdida de rich snippets. |
| 7 | **robots.txt con conflicto de reglas** | El bloque de Yoast incluye `Disallow:` vacío al final, lo que anula las reglas anteriores y permite que los rastreadores accedan a rutas sensibles como `/wp-admin/` y logs de WooCommerce. |
| 8 | **Sin enlaces a redes sociales en homepage** | El homepage no tiene iconos ni enlaces visibles a Instagram o Facebook, rompiendo el ciclo web ↔ redes. |
| 9 | **WooCommerce sin integración editorial** | La tienda tiene productos activos ($49.000–$270.000 COP) pero ningún artículo del blog enlaza a productos. No hay estrategia de contenido → conversión. |

### Menores

| # | Error | Detalle |
|---|-------|---------|
| 10 | **Categoría "Noticias" vacía** | Aparece en el menú principal pero tiene contenido casi nulo. Genera expectativa que no se cumple. |
| 11 | **URL duplicada de guardería** | Existen `/guardera-para-gatos` (2023) y `/guarderia-para-gatos` (2024) con contenido similar. Posible canibalización de keyword. |
| 12 | **URL con typo histórico** | `/mi-gato-se-orina-entodas-partes` (sin espacio en "en todas"). Afecta la legibilidad del URL. |

---

## 4. Análisis de Redes Sociales

### Instagram (@bigotesfelinos — Bogotá)
- **Seguidores declarados:** 17.000
- **Estado:** Latencia confirmada de +12 meses
- **Hallazgo de búsqueda:** El perfil existe y es el correcto para el dominio. No fue posible extraer engagement público por restricciones de Instagram.
- **Benchmark de referencia:** El engagement promedio en Instagram para cuentas de nicho de mascotas/lifestyle en 2025 cayó al 0.45% de media, pero cuentas con comunidad activa de gatos alcanzan 1.5%–3% cuando publican consistentemente.
- **Estimado de daño por inactividad:** Con 17k seguidores y 12 meses sin publicar, el algoritmo de Instagram reduce sistemáticamente el alcance orgánico. Se estima que el primer mes de reactivación alcanzará apenas el 5–10% de la audiencia, requiriendo 4–8 semanas de publicación constante para recuperar visibilidad.

### Facebook (11.000 seguidores)
- No fue posible auditar directamente. Se asume el mismo patrón de inactividad y decaimiento algorítmico.

### Oportunidad de reactivación
La audiencia dormida de 28k seguidores combinados es el activo más valioso. A diferencia de crecer desde cero, reactivar seguidores previos tiene una tasa de reconexión documentada mayor porque ya expresaron interés. El contenido de "retorno" con el ángulo de "Volvimos y con todo" genera engagement de tipo nostalgia + sorpresa.

---

## 5. Análisis de Contenido Existente — Oportunidades Perdidas

### Keywords de alto valor sin explotar (vacíos detectados en el sitemap)

| Keyword potencial | Intención | Estimado volumen |
|-------------------|-----------|-----------------|
| `seguro médico para gatos Colombia` | Transaccional | Alto (única pieza existente es superficial) |
| `veterinario a domicilio gatos` | Local/transaccional | Alto |
| `gato persa precio Colombia` | Transaccional | Medio-alto |
| `cuánto cuesta esterilizar un gato Colombia` | Transaccional | Alto |
| `comida para gatos Colombia marcas` | Comercial | Alto |
| `gato Ragdoll características` | Informacional | Alto |
| `gato Maine Coon precio` | Transaccional | Medio |
| `toxoplasmosis embarazo gatos` | Informacional urgente | Alto |

### Contenido estacional completamente ausente
- **Halloween / Octubre:** Cero contenido sobre gatos negros y mitos (con 28k comunidad es uno de los posts más virales del año para este nicho)
- **Navidad:** Sin guía de "cómo proteger el árbol de navidad de tu gato" o regalos para gatos
- **14 de febrero:** Sin contenido de amor + gatos
- **Día del animal (4 oct):** Sin pieza editorial aprovechando la efeméride
- **"Día internacional del gato" (8 agosto):** No hay pieza para esta fecha de alto engagement

### Formatos de contenido sin explotar
- **Comparativas:** "Comida seca vs húmeda: cuál es mejor para tu michi"
- **Listicles virales:** "17 cosas que hacen los gatos y tienen explicación científica"
- **Contenido local:** Guías orientadas a Colombia (precios, veterinarias, razas populares en LATAM)
- **UGC anchors:** Posts que invitan a compartir fotos de la comunidad

---

## 6. Activos No Aprovechados

### WooCommerce (Tienda activa)
- Productos confirmados con precios en COP ($49k–$270k)
- **Oportunidad perdida:** Ningún artículo del blog actual hace cross-linking a productos de la tienda. El funnel `contenido SEO → intención de compra → producto` no está construido.
- **Acción recomendada:** Por cada artículo de categoría "Alimentación" o "Salud", incluir un CTA hacia productos relevantes de la tienda.

### Base de datos de emails (newsletter)
- El formulario existía y posiblemente capturó suscriptores antes de romperse.
- Si hay lista de emails construida, es un activo de reactivación de primer orden (email marketing directo).

---

## 7. Mapa de Prioridades para el Pipeline

### Prioridad 1 — Correcciones antes de activar el pipeline
1. Reparar formulario de newsletter (antes del primer post para no perder el tráfico nuevo)
2. Arreglar imágenes no cargadas en `/blog-2/`
3. Eliminar "Lorem ipsum" del listing del blog
4. Activar fechas visibles en el listing del blog (configuración de tema)
5. Implementar Schema Article y FAQPage vía Yoast o plugin adicional
6. Corregir robots.txt (quitar el `Disallow:` vacío del bloque Yoast o reemplazarlo con reglas explícitas)
7. Ocultar email del autor en la API REST WordPress
8. Añadir enlaces a redes sociales en header/footer

### Prioridad 2 — Primer mes de producción (Reactivación)
- Post inaugural de "retorno" en tono Vet-Friend: anuncio de vuelta a la comunidad
- 4 posts de alto volumen con intención transaccional + Colombia como modificador local
- Primer Interactivity Asset para Instagram Stories (Poll de reactivación)
- Configurar cross-linking blog → tienda en posts de categoría Alimentación y Salud

### Prioridad 3 — Mes 2+ (Operación continua)
- Pipeline automatizado L/M/V con el sistema n8n construido
- Contenido estacional integrado al calendario
- Monitoreo de posición GSC para los 106 posts existentes (muchos ya rankeando, susceptibles de mejora rápida con re-optimización)

---

## 8. Score de Salud Digital

| Dimensión | Score | Estado |
|-----------|-------|--------|
| Volumen de contenido | 8/10 | 106 posts es base sólida |
| Calidad técnica SEO | 4/10 | Sin schema, errores de rastreo, sin fechas |
| Experiencia de usuario | 5/10 | Imágenes rotas, formulario roto, Lorem ipsum |
| Actividad editorial reciente | 1/10 | 12 meses sin publicar |
| Presencia en redes | 2/10 | Comunidad dormida, sin publicaciones |
| Monetización | 5/10 | Tienda activa pero sin funnel editorial |
| **Score global** | **4.2/10** | **Proyecto con base sólida pero en estado crítico de inactividad** |

---

## 9. Conclusión

Bigotes Felinos no es un proyecto muerto — es un proyecto dormido con activos reales: 106 artículos indexados, una comunidad de 28k seguidores con memoria de marca, una tienda funcional y un dominio con historial de varios años. El daño principal es la **acumulación de deuda técnica + inactividad editorial**, no la ausencia de valor.

La estrategia correcta no es empezar desde cero sino **reactivar con cirugía de precisión**: corregir los errores que están sangrando tráfico hoy, lanzar contenido de alto impacto rápido para despertar el algoritmo, y luego sostener con el pipeline automatizado de n8n.

**Tiempo estimado para recuperar autoridad:** 60–90 días de producción consistente (L/M/V) con correcciones técnicas previas.
