# AdSense Setup — Bigotes Caninos

Configuración completa desplegada el 2026-05-07. Este documento es la fuente de verdad de toda la monetización del sitio.

> **Stack:** Kadence theme v1.2.16 + LiteSpeed Cache + Site Kit + CookieYes (preinstalado)
> **Cuenta AdSense:** `ca-pub-9927086309447038` (compartida con Bigotes Felinos)

---

## Estado actual

| Componente | Estado | Notas |
|---|---|---|
| Publisher ID | `ca-pub-9927086309447038` | Activo desde antes del proyecto (compartido con BF) |
| ads.txt | ✅ correcto | `google.com, pub-9927086309447038, DIRECT, f08c47fec0942fa0` + resellers |
| Site Kit by Google | ✅ instalado y conectado | `gtag` y client_id de Google detectados |
| Auto Ads | ✅ apagado | Reemplazado por slots manuales (count = 0 en HTML) |
| Banner GDPR (Funding Choices) | ⏳ pendiente | Activar desde AdSense → Privacy & messaging |
| Cookie banner LATAM (CookieYes) | ✅ instalado y activo | Falta importar templates ES-CO + activar consent gating |
| Plugin Ad Inserter Free | ✅ Instalado v2.8.15 + 3 bloques activos (1, 2, 4) + Bloque 3 disabled hasta sidebar | Slots BC `3633283970`, `3771060945`, `2457979274` renderizando |
| Páginas legales | ✅ 4/4 publicadas con Ley 1581 + GDPR | Aviso legal + Términos + Política Cookies + Política Privacidad |
| Footer enlaces legales | ✅ Visibles en footer3 (menú Pie de página) | 4 enlaces agregados como Custom Links al menú existente |

---

## 4 Ad Units creados en AdSense (2026-05-11)

| # | Nombre del ad unit | data-ad-slot | Tipo | Tamaño |
|---|---|---|---|---|
| 1 | `BC - In-article 1 (post H2 #1)` | `3633283970` | Display | Adaptable |
| 2 | `BC - In-article 2 (post H2 #4)` | `3771060945` | Display | Adaptable |
| 3 | `BC - Sidebar Sticky` | `8640628684` | Display | Adaptable |
| 4 | `BC - Pre-FAQ` | `2457979274` | Display | Adaptable |

**Cómo crear cada slot:** AdSense → Anuncios → Por unidad de anuncio → Crear unidad de anuncio → Display → Adaptable → nombrar exactamente como la columna 2 → Crear → copiar `data-ad-slot` numérico → pegar en [`ad-inserter-blocks.md`](ad-inserter-blocks.md) reemplazando los `BC_SLOT_*`.

---

## Configuración de Ad Inserter (4 bloques)

Ver detalle completo en [`ad-inserter-blocks.md`](ad-inserter-blocks.md). Resumen:

- **Bloque 1** — `Antes del párrafo 3` o `After H2 #1` → Solo Posts → Categorías excepto `Noticias`
- **Bloque 2** — `Antes del párrafo 10` o `After H2 #4` → Solo Posts → Categorías excepto `Noticias`
- **Bloque 3** — `Disabled` (sidebar widget — esperar a activar layout sidebar en Kadence)
- **Bloque 4** — `Antes del párrafo 20` (Pre-FAQ) → Solo Posts

### Configuración global Ad Inserter

`Settings → ⚙ → General`:
- Disable insertion on Pages: **ON** (las páginas legales no llevan ads)
- Disable insertion on Category pages: ON
- Disable insertion on Tag pages: ON
- Disable insertion on Search pages: ON
- Disable insertion in feeds: ON
- Maximum number of inserted ads per page: 4

---

## CSS personalizado (Apariencia → Personalizar → CSS adicional)

Ver bloque completo en [`ad-inserter-blocks.md`](ad-inserter-blocks.md) — clases con prefijo `.bc-ad-*` y `.bc-legal-*` (no `.bf-*`).

---

## Categorías sensibles bloqueadas en AdSense

`AdSense → Brand safety → Content → Blocking controls`

**Categorías estándar bloqueadas (11 total):**
- Astrología y esoterismo
- Citas
- Estética y modificaciones corporales
- Ganar dinero rápidamente
- Juegos de casino sociales
- Política
- Pérdida de peso
- Religión
- Referencias al sexo
- Salud reproductiva y sexual
- Sensacionalismo

**Categorías estándar permitidas (estratégicamente):**
- Medicamentos y complementos alimenticios (RPM alto + relevante para nicho canino — antiparasitarios, suplementos articulares, alimento medicado)
- Utilidades descargables (neutro)

**Categorías restringidas bloqueadas:**
- Bebidas alcohólicas
- Juegos de azar y apuestas

---

## Páginas legales publicadas

| Slug | Page ID | URL pública | Origen |
|---|---|---|---|
| `aviso-legal` | 2058 | https://bigotescaninos.com/aviso-legal/ | Recreada por workflow tras trash de ID 663 (2026-05-07) |
| `terminos-y-condiciones` | 2054 | https://bigotescaninos.com/terminos-y-condiciones/ | Generada por workflow (2026-05-07) |
| `politica-de-cookies` | 2059 | https://bigotescaninos.com/politica-de-cookies/ | Recreada por workflow tras trash de ID 666 (2026-05-07) |
| `politica-de-privacidad` | 2060 | https://bigotescaninos.com/politica-de-privacidad/ | Recreada por workflow tras trash de ID 12 (2026-05-07) |

Las 3 páginas preexistentes (IDs 663, 666, 12) contenían plantillas genéricas con jurisdicción incorrecta (Ley 34/2002 española, AEPD). Fueron eliminadas permanentemente (`force=true`) y recreadas con contenido alineado a la legislación colombiana. Los IDs antiguos pueden estar referenciados en GSC; conservan los slugs y URLs públicas — el cambio es solo de `id` interno.

**Marco legal cubierto:**
- Ley 1581 de 2012 (Colombia) — protección de datos personales
- Decreto 1377 de 2013 (Colombia) — reglamentación parcial
- Decreto 1074 de 2015 (Colombia) — Decreto Único Reglamentario
- Reglamento (UE) 2016/679 — GDPR
- Directiva ePrivacy (Cookies)
- Ley 1273 de 2009 — delitos informáticos
- Recomendaciones SIC

**Datos de contacto declarados:**
- Responsable: Bigotes Caninos
- Domicilio: Calle 22a # 72b-48, Bogotá, Colombia
- Correo: contacto@bigotescaninos.com

**Fuentes markdown** (versionadas):
- [`_legal/aviso-legal.md`](../../_legal/aviso-legal.md)
- [`_legal/terminos-y-condiciones.md`](../../_legal/terminos-y-condiciones.md)
- [`_legal/politica-de-cookies.md`](../../_legal/politica-de-cookies.md)
- [`_legal/politica-de-privacidad.md`](../../_legal/politica-de-privacidad.md)

---

## Banner GDPR (Funding Choices) — pendiente

Configurar en AdSense → Privacy & messaging → Reglamentos europeos:

| Setting | Valor |
|---|---|
| Idioma predeterminado | Inglés (en) — fallback universal para EU |
| Botón Consentir | Activado |
| Botón Gestionar opciones | Activado |
| Botón No consentir | **Activado** (todos los países EEA + UK + Suiza) |
| Botón Cerrar (no consentir) | Desactivado |
| Optimizar mensaje de solicitud | Activado |
| Mensajes activos | 4 (variantes EN, ES, FR, DE — defaults de Google) |

**Comportamiento:** banner solo visible a tráfico EEA/UK/Suiza. Tráfico colombiano/LATAM verá el banner CookieYes (ya instalado).

---

## CookieYes para LATAM/Colombia

CookieYes ya está instalado en BC (clases `cky-` detectadas en frontend). Falta:

1. WP Admin → CookieYes → Settings → Banner Configuration
2. **Idioma por defecto:** Español (Colombia)
3. **Aviso:** "Usamos cookies para mejorar tu experiencia. Al aceptar, autorizas el uso conforme a la Ley 1581 de 2012. Lee nuestra [Política de cookies](/politica-de-cookies/)."
4. **Botones:** Aceptar + Rechazar + Personalizar (los 3 visibles, no negociable bajo Ley 1581)
5. **Categorías:** Necesarias (siempre activas) + Funcional + Analíticas + Publicitarias
6. **Consent gating:** activar — bloquear AdSense/GA hasta consentimiento

---

## Workflow n8n para publicar páginas legales

**ID principal:** `nx5ivvkMVVMBDpqE` — `BC - WF-Util - Publicar Páginas Legales`
**Triggers:** Manual + Webhook POST `/webhook/bc-publish-legales`
**Nodos:** 9 (Manual/Webhook → Lookup All Pages → Build Pages → Publish/Update Page → Collect Results → Notify Success + Error Trigger → Notify Error)

**Workflow auxiliar:** `ZXGkalck7p1Ugj26` — `BC - WF-Util - Force Publish Drafts (one-off)`
- Webhook POST `/webhook/bc-force-publish-drafts`
- Función: rescatar páginas que quedaron en `draft` o sin contenido tras la corrida principal
- Hardcodea IDs y aplica PUT con `slug + status=publish + content.raw + excerpt.raw`
- Desactivado por defecto — activar manualmente solo para emergencias

**Lógica del workflow principal (v3 — trash+create para páginas no idempotentes):**

1. `Lookup All Pages` — GET autenticado de todas las páginas WP (max 100, `_fields=id,slug,status,content`, `context=edit`)
2. `Build Pages` — Code node que para cada uno de los 4 slugs evalúa:
   - Si existe AND `content.raw` contiene `bc-legal-doc` (nuestro marker) → emite op `update` (PUT idempotente)
   - Si existe AND no tiene marker → emite op `trash` (DELETE force=true) + op `create` (POST nueva)
   - Si no existe → emite op `create` (POST)
   - Para cada slug-2 (duplicado de corridas fallidas): emite op `trash`
3. `Publish/Update Page` — HTTP request con `method` y `target_url` dinámicos. Body usa formato `content: { raw }` y `excerpt: { raw }` (necesario en WP REST cuando el editor tiene Gutenberg blocks)
4. `Collect Results` — agrega resultados con tally por op
5. `Notify Success` — Telegram con resumen `🆕 creadas / ♻️ actualizadas / 🗑️ trasheadas`

**Re-ejecutar:**
1. Editar markdowns en `_legal/`
2. Convertir a HTML: `node /tmp/bc_md2html.mjs`
3. Regenerar Code node completo: `node /tmp/bc_legal_v3.mjs` (parchea `Build Pages.jsCode`)
4. POST al webhook: `curl -X POST https://n8n.srv1398596.hstgr.cloud/webhook/bc-publish-legales`
5. **Purgar LiteSpeed Cache** después (WP Admin → LiteSpeed Cache → Caja de herramientas → Purgar todo)
6. Si alguna página queda en draft con content vacío (puede pasar si race condition trash+create): activar `ZXGkalck7p1Ugj26` y disparar `curl -X POST .../webhook/bc-force-publish-drafts`

**Gotchas descubiertos en BC (no aplican a BF):**

- WP REST API PUT `content: "..."` (string) NO reemplaza el contenido si la página tiene bloques Gutenberg preexistentes. Hay que usar `content: { raw: "..." }` Y tener marker editor compatible. Para páginas creadas desde la API, el PUT funciona bien.
- POST con `status: 'publish'` puede caer a `draft` si el user lacks `publish_pages` cap — fix: PUT individual por página tras creación con status=publish + slug + content.raw todo en una sola request.
- `force=true` en DELETE = borrado permanente (no trash). Necesario aquí para liberar slugs reusables.

---

## Setup completo 2026-05-11

- [x] **4 páginas legales** publicadas vía workflow n8n (Aviso Legal 2058, Términos 2054, Política Cookies 2059, Política Privacidad 2060) con contenido Ley 1581 + GDPR + tono Vet-Friend canino
- [x] **3 IDs antiguos eliminados permanentemente** (663, 666, 12 — tenían jurisdicción española errónea)
- [x] **Footer enlaces legales** vía menú Pie de página (Custom Links) — 4 enlaces visibles en footer3 (nav_menu-1)
- [x] **4 ad units creados en AdSense** — IDs `3633283970`, `3771060945`, `8640628684`, `2457979274`
- [x] **Plugin Ad Inserter Free 2.8.15** instalado + 4 bloques configurados (Bloque 1 párrafo 3, Bloque 2 párrafo 10, Bloque 3 sidebar widget, Bloque 4 párrafo 8)
- [x] **Sidebar Layout activado en Kadence** (Apariencia → Personalizar → Diseño de entradas/páginas → Entradas → With Sidebar) + widget Ad Inserter Block 3 añadido a Barra Lateral 1 → slot `8640628684` renderizando
- [x] **CSS personalizado** pegado en Apariencia → Personalizar → CSS adicional (clases `.bc-ad-*` + `.bc-legal-links` + `.bc-legal-doc`)
- [x] **Verificación E2E:** los 3 slots BC renderizan en posts (`3633283970`, `3771060945`, `2457979274`); footer muestra 4 enlaces legales; slot intruso `1211888823` (BF Pre-FAQ que estaba cacheado) eliminado tras purga
- [x] **Brand safety, Funding Choices, CCPA** — heredados automáticamente de la config a nivel cuenta AdSense (`ca-pub-9927086309447038` compartido con BF)
- [x] **Sin plugins de cookies redundantes** — Complianz residual desactivado, CookieYes nunca se llegó a usar (paridad con BF que tampoco usa banner cookies, solo Funding Choices nativo)

## Setup completado al 100% (sesión 2026-05-11)

Todos los componentes operativos. No quedan pendientes en el setup AdSense.

**Hitos finales del 2026-05-11:**

- 4 ad units BC creados en AdSense (`3633283970`, `3771060945`, `8640628684`, `2457979274`)
- Plugin Ad Inserter Free 2.8.15 instalado + 4 bloques configurados con HTML BC
- CSS `.bc-ad-*` + `.bc-legal-links` + `.bc-legal-doc` pegado en Customizer
- Sidebar Layout activado en Kadence (Apariencia → Personalizar → Diseño de entradas/páginas → Entradas → With Sidebar) + widget Ad Inserter Block 3 en Barra Lateral 1 → slot 8640628684 renderizando
- Footer enlaces legales agregados como Custom Links al menú "Pie de página" (NO vía widget, porque Kadence Footer Builder no expone widget areas tradicionales footer1-footer6)
- Slot intruso del felino (`1211888823`) eliminado tras purga LiteSpeed
- Plugin "Stop User Enumeration" instalado → `/wp-json/wp/v2/users` HTTP 401 (seguridad)
- Imágenes destacadas `/blog/` cargando correctamente tras desactivar Guest Mode de LiteSpeed
- Brand safety + Funding Choices + CCPA heredados de BF a nivel cuenta AdSense

**Verificación E2E final:**

```bash
$ curl -sL https://bigotescaninos.com/salud/gonorrea-en-perros/ | grep -oE 'data-ad-slot="[0-9]+"' | sort -u
data-ad-slot="2457979274"   # Pre-FAQ
data-ad-slot="3633283970"   # In-article 1
data-ad-slot="3771060945"   # In-article 2
data-ad-slot="8640628684"   # Sidebar Sticky
```

4/4 slots BC renderizando. Setup oficialmente cerrado.

### Revisión semanal

- [ ] Revisar AdSense Reports cada lunes: impresiones por slot, RPM, CTR
- [ ] Comparar performance vs BF (mismo publisher, distintos slots)

---

## Footer legal (bloque HTML)

Pegar en widget area "Footer Section 1" (o el área visible al pie del sitio en Kadence Customizer):

```html
<div class="bc-legal-links">
  <h3>Información legal</h3>
  <ul>
    <li><a href="/aviso-legal/">Aviso legal</a></li>
    <li><a href="/terminos-y-condiciones/">Términos y condiciones</a></li>
    <li><a href="/politica-de-cookies/">Política de cookies</a></li>
    <li><a href="/politica-de-privacidad/">Política de privacidad</a></li>
  </ul>
</div>
```

**Cómo agregar en Kadence:**
1. WP Admin → Apariencia → Widgets
2. Localizar área de footer (probable nombre: "Footer Section 1", "Footer Widget Area" o similar — Kadence ofrece múltiples)
3. Añadir bloque "HTML personalizado"
4. Pegar el snippet
5. Guardar
6. Verificar en frontend con cache bust: `curl -sL "https://bigotescaninos.com/?cb=$(date +%s)" | grep -oE "/(aviso-legal|terminos-y-condiciones|politica-de-cookies|politica-de-privacidad)/" | sort -u`
7. Eliminar el link roto `/privacy-policy/` que apunta a 404 (probablemente está en un widget HTML viejo o en el menú de footer)

---

## Sidebar widget — reactivación futura (Kadence)

**Por qué está desactivado:** Kadence default usa layout full-width sin sidebar para Posts. El widget Bloque 3 no se renderiza porque no hay columna lateral.

**Cómo activar layout con sidebar en Kadence v1.2.x:**

1. WP Admin → Apariencia → **Personalizar**
2. En el menú izquierdo del Customizer click **"Posts"** (o "Single Post Layout")
3. Buscar opción **"Sidebar"** o **"Content Width"**
4. Cambiar a **"With Sidebar"** o seleccionar layout `Right Sidebar`
5. Click **Publicar** arriba

**Después:**
1. Ad Inserter → Bloque 3 → cambiar `Insertar` de Disabled a `Disabled` (lo controla el widget)
2. WP Admin → Apariencia → Widgets → "Primary Sidebar" → añadir bloque "Ad Inserter" → seleccionar Block 3
3. Actualizar
4. Purgar LiteSpeed Cache
5. Verificar:
   ```bash
   curl -sL "https://bigotescaninos.com/POST_URL/?cb=$(date +%s)" | grep -oE "data-ad-slot=\"BC_SLOT_SIDEBAR\""
   ```

**Impacto esperado:** +30-40% RPM total. UX móvil = sin afectación (CSS desactiva sticky <768px).

---

## Verificación E2E (correr cuando hagas cambios)

```bash
BUST=$(date +%s)
echo "=== Slots inyectados (esperado: 3 distintos) ==="
curl -sL "https://bigotescaninos.com/salud/gonorrea-en-perros/?cb=$BUST" | grep -oE "data-ad-slot=\"[A-Z0-9_]+\"" | sort -u

echo ""
echo "=== Páginas legales (esperado: 4 x 200) ==="
for p in aviso-legal terminos-y-condiciones politica-de-cookies politica-de-privacidad; do
  echo "    /$p/: $(curl -s -o /dev/null -w "%{http_code}" "https://bigotescaninos.com/$p/")"
done

echo ""
echo "=== ads.txt ==="
curl -s https://bigotescaninos.com/ads.txt | head -1

echo ""
echo "=== Auto Ads apagado (esperado: 0) ==="
curl -sL "https://bigotescaninos.com/" | grep -c "enable_page_level_ads"

echo ""
echo "=== Footer legal links (esperado: 4) ==="
curl -sL "https://bigotescaninos.com/?cb=$BUST" | grep -oE "/(aviso-legal|terminos-y-condiciones|politica-de-cookies|politica-de-privacidad)/" | sort -u

echo ""
echo "=== Marcadores Ley 1581 en aviso-legal (post-purga) ==="
curl -sL "https://bigotescaninos.com/aviso-legal/?cb=$BUST" | grep -oE "(Ley 1581|HABEAS DATA|Decreto 1377)" | sort -u
```

Esperado:
- 3 `data-ad-slot` distintos (BC_SLOT_INARTICLE_1, BC_SLOT_INARTICLE_2, BC_SLOT_PREFAQ)
- 4 páginas en `200`
- ads.txt una línea correcta + resellers
- Auto ads count = 0
- 4 enlaces legales en footer
- 3 marcadores legales colombianos visibles

---

## Lecciones aprendidas vs Bigotes Felinos

1. **Páginas legales preexistentes con jurisdicción equivocada:** BC venía con plantillas que citaban Ley 34/2002 española en lugar de Ley 1581 colombiana. Fue necesario sobrescribir y NO crear paralelas con sufijo `-2` (riesgo SEO). Lección: el workflow de upsert debe hacer un solo `Lookup All Pages` global y mapear por slug; los Slug Pre-Check con filtro slug-by-slug rompen el item mapping en n8n cuando alguno no devuelve resultado.

2. **LiteSpeed Cache no auto-purga REST API PUT:** Aunque WP dispara hooks `post_updated`, LSCache no siempre los captura desde REST. Tras cualquier publicación masiva por workflow, **purgar manualmente** desde WP Admin → LiteSpeed Cache → Caja de herramientas → Purgar todo.

3. **Kadence vs Astra para sidebar:** Kadence Customizer expone sidebar layout en `Posts → Sidebar` o similar (depende de versión). Astra lo escondía bajo `Post Types → Posts → Sidebar Layout`. Ambos usan layout sin sidebar por defecto.

4. **Cuenta AdSense compartida BF/BC:** la cuenta `ca-pub-9927086309447038` cubre ambos sitios. Solo cambian los `data-ad-slot` por unidad.

5. **CookieYes preinstalado en BC:** ahorra el paso "instalar plugin" que en BF estaba pendiente. Falta solo configurar el banner en español Colombia.

6. **Workflow n8n con webhook + manual trigger duales:** mantener ambos triggers permite ejecutar desde la UI de n8n (Manual) o desde curl/MCP (Webhook). El webhook path `/webhook/bc-publish-legales` es idempotente.

7. **Las páginas legales son señal E-E-A-T crítica:** Google las trata como prueba de seriedad del sitio. Indexables (no `noindex`), enlazadas en footer, con datos del responsable claros. La auditoría inicial reveló que las preexistentes tenían texto plantilla genérico — un riesgo E-E-A-T concreto que ahora está resuelto.
