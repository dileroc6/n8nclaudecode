# AdSense Setup — Bigotes Felinos

Configuración completa desplegada el 2026-05-07. Este documento es la fuente de verdad de toda la monetización del sitio.

---

## Estado actual

| Componente | Estado | Notas |
|---|---|---|
| Publisher ID | `ca-pub-9927086309447038` | Activo desde antes del proyecto |
| ads.txt | ✅ correcto | Una sola línea: `google.com, pub-9927086309447038, DIRECT, f08c47fec0942fa0` |
| Site Kit by Google | ✅ instalado y conectado | Conexión validada |
| Auto Ads | ❌ apagado | Reemplazado por slots manuales |
| Banner GDPR (Funding Choices) | ✅ activo | TCF v2.2 — cubre EEA/UK/Suiza |
| CCPA banner US States | ⏳ pendiente | Crear desde AdSense → Privacy & messaging |
| Cookie banner LATAM (Colombia) | ✅ cubierto por páginas legales | Decisión: NO usar plugin CMP adicional. Las 4 páginas legales + footer enlazado cumplen Ley 1581 (aviso previo + acceso a políticas + HABEAS DATA documentado). Banner explícito Ley 1581 = nice-to-have, no obligatorio para sitios editoriales. |
| Plugin Ad Inserter Free | ✅ instalado v2.8.15 | 4 bloques configurados |
| Páginas legales | ✅ 4/4 publicadas | Privacy Policy + Términos + Aviso + Cookies |
| Footer enlaces legales | ✅ visible | Pie de página 1, bloque "HTML personalizado" |
| Layout sidebar Astra | ✅ activado | `ast-right-sidebar` + `ast-two-container` en posts (vía Personalizar → Post Types → Posts) |
| Slot sidebar (Bloque 3) | ✅ activo | Widget en Barra Lateral 1, slot `7324202730` renderizando en producción |
| Plugin CMP (Complianz/CookieYes) | ❌ NO instalado | Decisión final 2026-05-11: usar solo Funding Choices nativo de AdSense (TCF v2.2) + páginas legales como cumplimiento Ley 1581. Probamos Complianz Free, se desinstaló por subóptimo (sin geo-targeting + interfería con TCF v2.2 nativo). |

---

## 5 Ad Units creados en AdSense

| # | Nombre del ad unit | data-ad-slot | Tipo | Tamaño |
|---|---|---|---|---|
| 1 | `BF - In-article 1 (post H2 #1)` | `6261282948` | Display | Adaptable |
| 2 | `BF - In-article 2 (post H2 #4-5)` | `8251391154` | Display | Adaptable |
| 3 | `BF - Sidebar Sticky` | `7324202730` | Display | Adaptable |
| 4 | `BF - Pre-FAQ` | `1211888823` | Display | Adaptable |
| 5 | `BF - Multiplex (Te puede interesar)` | `9734218500` | Multiplex (autorelaxed) | Nativo |

**Ad units viejos archivados** (2026-05-11) — eran de configuración pre-proyecto sept 2023:
- `Antes del parrafo 4` (slot `9942912624`)
- `Antes del parrafo 1` (slot `8071389761`)
- `Antes de la entrada` (slot `8454533147`)

---

## Configuración de Ad Inserter (4 bloques)

### Bloque 1 — In-article 1

```html
<div class="bf-ad bf-ad-inarticle">
  <span class="bf-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="6261282948"
       data-ad-format="fluid"
       data-ad-layout="in-article"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:** Insertar `Antes del párrafo` + parámetro `3` + solo Entradas.

### Bloque 2 — In-article 2

Mismo HTML cambiando `data-ad-slot="8251391154"`.

**Settings:** Insertar `Antes del párrafo` + parámetro `10` + solo Entradas.

### Bloque 3 — Sidebar Sticky

Mismo HTML cambiando `data-ad-slot="7324202730"`.

**Settings:** Insertar `Desactivado` (en Ad Inserter — el slot se renderiza vía widget, no via auto-insertion).

**Activación:** widget "Ad Inserter" en Barra Lateral 1 con dropdown "Block: 3 - BF - Sidebar Sticky". Layout sidebar de posts activado en Astra Customizer → Post Types → Posts → Sidebar Layout = Right Sidebar.

### Bloque 4 — Pre-FAQ

Mismo HTML cambiando `data-ad-slot="1211888823"`.

**Settings:** Insertar `Antes del párrafo` + parámetro `20` + solo Entradas.

### Bloque 5 — Multiplex (Te puede interesar)

```html
<div class="bf-ad bf-ad-multiplex">
  <span class="bf-ad-label">Te puede interesar</span>
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-format="autorelaxed"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="9734218500"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:** Insertar `Antes de los comentarios` (o `Después del contenido` si no aparece) + solo Entradas + Desktop/Tablet/Phone activados.

**Diferencias respecto a Bloques 1-4:**
- Label dice "Te puede interesar" (no "Publicidad") porque el widget mezcla posts relacionados tuyos + ads
- `data-ad-format="autorelaxed"` (signature multiplex)
- SIN `data-loading-strategy="lazy"` — Google maneja lazy loading internamente para multiplex; agregarlo causa render issues
- SIN `data-full-width-responsive` y `data-ad-layout` (no aplican a multiplex)

**Impacto esperado:** +20-30% pageviews/sesión (lectores hacen click en otros posts) + slot adicional monetizado.

### Configuración global Ad Inserter

`Settings → ⚙ → General`:
- Disable insertion on Pages: ON
- Disable insertion on Category pages: ON
- Disable insertion on Tag pages: ON
- Disable insertion on Search pages: ON
- Disable insertion in feeds: ON
- Maximum number of inserted ads per page: 4

---

## CSS personalizado (Apariencia → Personalizar → CSS adicional)

```css
.bf-ad {
  margin: 32px auto;
  padding: 8px 0;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
}

.bf-ad-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin-bottom: 8px;
}

.bf-ad-inarticle {
  margin: 40px 0;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.bf-ad-sidebar-sticky {
  position: sticky;
  top: 100px;
  margin-top: 24px;
}

.bf-ad-prefaq {
  margin: 48px 0 32px;
}

.bf-ad-multiplex {
  margin: 48px 0 32px;
  padding: 16px 0;
  border-top: 1px solid #eee;
}

.bf-ad-multiplex .bf-ad-label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
  text-transform: none;
  letter-spacing: 0;
  margin-bottom: 12px;
  text-align: left;
}

@media (max-width: 768px) {
  .bf-ad-sidebar-sticky { position: static; }
}

.bf-legal-links h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.bf-legal-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.bf-legal-links li {
  margin-bottom: 6px;
}
.bf-legal-links a {
  text-decoration: none;
  font-size: 13px;
}
.bf-legal-links a:hover {
  text-decoration: underline;
}
```

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
- Medicamentos y complementos alimenticios (RPM alto + relevante para nicho felino)
- Utilidades descargables (neutro)

**Categorías restringidas bloqueadas:**
- Bebidas alcohólicas
- Juegos de azar y apuestas

---

## Páginas legales publicadas

| Slug | Page ID | URL pública | Origen |
|---|---|---|---|
| `privacy-policy` | (preexistente) | https://bigotesfelinos.com/privacy-policy/ | Existente antes del proyecto |
| `terminos-y-condiciones` | (auto) | https://bigotesfelinos.com/terminos-y-condiciones/ | Generada vía workflow n8n `BF - WF-Util - Publicar Páginas Legales` (`fmdlcPbN8juFuCMN`) |
| `aviso-legal` | (auto) | https://bigotesfelinos.com/aviso-legal/ | idem |
| `politica-de-cookies` | (auto) | https://bigotesfelinos.com/politica-de-cookies/ | idem |

**Marco legal cubierto:**
- Ley 1581 de 2012 (Colombia) — protección de datos personales
- Decreto 1377 de 2013 (Colombia) — reglamentación parcial
- Reglamento (UE) 2016/679 — GDPR
- Directiva ePrivacy (Cookies)
- Recomendaciones SIC

**Datos de contacto declarados:**
- Responsable: Bigotes Felinos
- Domicilio: Bogotá, Colombia
- Correo: laura.dionisio@bigotesfelinos.com

**Fuentes markdown** (versionadas):
- [`_legal/terminos-y-condiciones.md`](../../_legal/terminos-y-condiciones.md)
- [`_legal/aviso-legal.md`](../../_legal/aviso-legal.md)
- [`_legal/politica-de-cookies.md`](../../_legal/politica-de-cookies.md)

---

## Banner GDPR (Funding Choices)

Configurado en AdSense → Privacy & messaging → Reglamentos europeos:

| Setting | Valor |
|---|---|
| Idioma predeterminado | Inglés (en) — fallback universal para EU |
| Botón Consentir | Activado |
| Botón Gestionar opciones | Activado |
| Botón No consentir | **Activado** (todos los países EEA + UK + Suiza) |
| Botón Cerrar (no consentir) | Desactivado |
| Optimizar mensaje de solicitud | Activado |
| Mensajes activos | 4 (variantes EN, ES, FR, DE — defaults de Google) |

**Comportamiento:** el banner solo se muestra a tráfico desde EEA/UK/Suiza. Tráfico colombiano/LATAM no lo ve.

---

## Workflow n8n para publicar páginas legales

**ID:** `fmdlcPbN8juFuCMN`
**Nombre:** `BF - WF-Util - Publicar Páginas Legales`
**Trigger:** Manual
**Nodos:** 7 (Manual Trigger → Build Pages → Publish Page → Collect Results → Notify Success + Error Trigger → Notify Error)

Las 3 páginas (terminos, aviso, cookies) viven embebidas en el Code node `Build Pages` como template literals JS. Para regenerar/actualizar:

1. Editar el markdown en `_legal/`
2. Convertir a HTML con `node /tmp/md2html.mjs` (script en `/tmp`)
3. Patch del workflow vía MCP n8n update_partial_workflow → 3 patchNodeField operations

---

## Pendientes (orden de prioridad)

### Inmediato (próximas 24-48h)
- [ ] Esperar a que AdSense empiece a llenar slots con creatividades reales (primeras 1-12h tras configurar)
- [ ] Verificar en producción que los 4 slots se rendereen con anuncios reales (no espacios en blanco)

### Esta semana
- [ ] Crear mensaje "Normativas estatales de EE. UU. (CCPA)" en AdSense → Privacy & messaging — 5 min
- [ ] Bloquear endpoint `/wp-json/wp/v2/users` para no autenticados — 10 min (plugin "Disable WP REST API" o filtro `rest_endpoints`)
- [ ] Probar el banner GDPR con VPN europea o pedir a alguien en EU que lo confirme

### Revisión semanal
- [ ] Revisar AdSense Reports cada lunes: impresiones por slot, RPM, CTR, fill rate
- [ ] Identificar si conviene mover parámetros de Bloque 1 (párrafo 3 → 4) según bounce rate
- [ ] Validar que el sidebar (Bloque 3) tiene CTR razonable (>0.3% en desktop)

### Replicación
- [ ] Replicar setup completo en Bigotes Caninos (prompt en sesión separada)

---

## Sidebar widget — activación (referencia histórica)

**Activado el 2026-05-07.** El sidebar de posts está renderizando el Bloque 3 (slot `7324202730`).

**Cómo se activó (replicable en otros sitios Astra Free 4.x):**

1. WP Admin → Apariencia → **Personalizar**.
2. Menú izquierdo → **"Post Types"** → **"Posts"** (o "Single Post").
3. Buscar **"Sidebar Layout"** → cambiar de **"No Sidebar"** a **"Right Sidebar"**.
4. **Publicar**.
5. Apariencia → Widgets → Barra Lateral 1 → añadir bloque "Ad Inserter" con Block = `3 - BF - Sidebar Sticky` (Title vacío, Fija desmarcado).
6. Actualizar.
7. Purgar LiteSpeed Cache → Caja de herramientas → Purgar todo - LSCache.

**Verificación post-activación (corrida 2026-05-07):**

```bash
curl -sL "https://bigotesfelinos.com/salud-del-gato/sintomas-de-gato-enfermo/?cb=$(date +%s)" \
  | grep -oE "(data-ad-slot=\"7324202730\"|ast-(no-)?(right-)?sidebar)" | sort -u
```

Esperado:
- `ast-right-sidebar` y `ast-two-container` presentes en el HTML del post
- `data-ad-slot="7324202730"` aparece (Bloque 3 inyectando)

**Impacto esperado:** +30-40% RPM total (sidebar es slot de alta visibilidad). Pérdida UX en móvil = nula porque el CSS desactiva el sticky en pantallas <768px.

---

## Verificación E2E (correr cuando hagas cambios)

```bash
BUST=$(date +%s)
echo "=== Slots inyectados (esperado: 4) ==="
curl -sL "https://bigotesfelinos.com/salud-del-gato/sintomas-de-gato-enfermo/?cb=$BUST" | grep -oE "data-ad-slot=\"[0-9]+\"" | sort -u

echo ""
echo "=== Layout sidebar (esperado: ast-right-sidebar) ==="
curl -sL "https://bigotesfelinos.com/salud-del-gato/sintomas-de-gato-enfermo/?cb=$BUST" | grep -oE "ast-(right-sidebar|left-sidebar|no-sidebar|two-container)" | sort -u

echo ""
echo "=== Páginas legales (esperado: 4 x 200) ==="
for p in privacy-policy terminos-y-condiciones aviso-legal politica-de-cookies; do
  echo "    /$p/: $(curl -s -o /dev/null -w "%{http_code}" "https://bigotesfelinos.com/$p/")"
done

echo ""
echo "=== ads.txt ==="
curl -s https://bigotesfelinos.com/ads.txt

echo ""
echo "=== Auto Ads apagado (esperado: 0) ==="
curl -sL "https://bigotesfelinos.com/" | grep -c "enable_page_level_ads"

echo ""
echo "=== Footer legal links (esperado: 4) ==="
curl -sL "https://bigotesfelinos.com/?cb=$BUST" | grep -oE "/(privacy-policy|terminos-y-condiciones|aviso-legal|politica-de-cookies)/" | sort -u
```

Esperado:
- 4 `data-ad-slot` distintos (in-article 1, in-article 2, sidebar, pre-FAQ)
- Layout `ast-right-sidebar` + `ast-two-container`
- 4 páginas en `200`
- ads.txt una línea correcta
- Auto ads count = 0
- 4 enlaces legales en footer

---

## Lecciones aprendidas (para replicar en otros sitios)

1. **Auto Ads vs Manual:** Auto Ads optimiza para fill rate pero sacrifica UX. Manual con 3 in-article + 1 sidebar (cuando aplica) suele rendir igual o mejor con mejor experiencia.

2. **Ad Inserter Free 2.8.15 — sintaxis "H2 N" no funciona.** Usar números de párrafo simples en el campo del parámetro. El Bloque 4 con `10` confirmó el patrón.

3. **LiteSpeed Cache debe purgarse después de cada cambio en Ad Inserter.** Sin purga, los cambios no aparecen en el HTML servido. Path: WP Admin → LiteSpeed Cache → Caja de herramientas → Purgar todo - LSCache.

4. **Astra Free no expone fácil "Sidebar Layout" en el Customizer.** Path correcto: Personalizar → Post Types → Posts → Sidebar Layout. NO está bajo "Sidebar" o "Global" como sugieren docs antiguas.

5. **Banner GDPR aplica solo a EEA.** No verás el banner desde Colombia aunque navegues incógnito — eso es correcto. Para tráfico Colombia/LATAM hay que instalar plugin separado (CookieYes/Complianz).

6. **`data-loading-strategy="lazy"` es lazy loading nativo de AdSense.** Más confiable que la "Carga diferida" del plugin Ad Inserter. Añadirlo directo al `<ins>`.

7. **Las páginas legales son señal E-E-A-T.** Google las trata como prueba de seriedad del sitio. Indexables (no `noindex`), enlazadas en footer, con datos del responsable claros.

8. **Cuando hay >2K líneas de HTML para meter en Code node n8n:** preferir patchNodeField con find/replace de placeholders en lugar de updateNode wholesale. Más resistente a errores de escape.
