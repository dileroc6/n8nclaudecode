# Ad Inserter — Configuración de los 4 bloques (Bigotes Caninos)

Este documento contiene los snippets exactos para los 4 placements de AdSense en bigotescaninos.com.

**Cuenta AdSense:** `ca-pub-9927086309447038` (compartida con Bigotes Felinos)

Slots a crear en AdSense (Apps → Anuncios → Por unidad de anuncio → Crear unidad de anuncio):

| Bloque | Nombre del ad unit | data-ad-slot | Tipo | Tamaño |
|---|---|---|---|---|
| 1 | `BC - In-article 1 (post H2 #1)` | ⏳ pendiente | Display | Adaptable |
| 2 | `BC - In-article 2 (post H2 #4)` | ⏳ pendiente | Display | Adaptable |
| 3 | `BC - Sidebar Sticky` | ⏳ pendiente | Display | Adaptable |
| 4 | `BC - Pre-FAQ` | ⏳ pendiente | Display | Adaptable |

> Tras crear cada slot, copia el `data-ad-slot` y reemplaza los placeholders `BC_SLOT_*` que aparecen abajo.

Cada bloque incluye `data-loading-strategy="lazy"` — lazy loading nativo de Google, sin necesidad de plugin extra.

---

## Bloque 1 — In-article superior (después del primer H2)

**Code:**

```html
<div class="bc-ad bc-ad-inarticle">
  <span class="bc-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="3633283970"
       data-ad-format="fluid"
       data-ad-layout="in-article"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings del bloque:**

| Campo | Valor |
|---|---|
| Nombre | `BC - In-article 1 (post H2 #1)` |
| Tipo de inserción | `After heading` (Después del encabezado) |
| Heading level | `H2` |
| Heading number | `1` |
| Posts | Activado |
| Pages | Desactivado |
| Categorías | Todas EXCEPTO `Noticias` |
| Display Desktop | Activado |
| Display Tablet | Activado |
| Display Phone | Activado |

---

## Bloque 2 — In-article inferior (después del 4to H2)

**Code:**

```html
<div class="bc-ad bc-ad-inarticle">
  <span class="bc-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="3771060945"
       data-ad-format="fluid"
       data-ad-layout="in-article"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:**

| Campo | Valor |
|---|---|
| Nombre | `BC - In-article 2 (post H2 #4)` |
| Tipo de inserción | `After heading` |
| Heading level | `H2` |
| Heading number | `4` |
| Posts | Activado |
| Pages | Desactivado |
| Categorías | Todas EXCEPTO `Noticias` |
| Display Desktop | Activado |
| Display Tablet | Activado |
| Display Phone | Activado |

---

## Bloque 3 — Sidebar sticky (solo desktop) — DESACTIVADO inicialmente

**Code:**

```html
<div class="bc-ad bc-ad-sidebar-sticky">
  <span class="bc-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; min-height:600px;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="8640628684"
       data-ad-format="auto"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:**

| Campo | Valor |
|---|---|
| Nombre | `BC - Sidebar Sticky` |
| Tipo de inserción | `Disabled` (lo insertaremos como widget cuando el sidebar esté activo) |
| Display Desktop | Activado |
| Display Tablet | Desactivado |
| Display Phone | Desactivado |

> **Nota Kadence:** Verificar primero si el theme tiene sidebar activo para Posts en `Apariencia → Personalizar → Posts → Layout`. Kadence usa por defecto layout sin sidebar (full-width). Si está apagado, dejar el bloque 3 desactivado y reactivar cuando el usuario decida activar sidebar.

**Cuando se active sidebar en Kadence:** WP Admin → Apariencia → Widgets → "Primary Sidebar" → añadir bloque "Ad Inserter" → seleccionar Block 3.

---

## Bloque 4 — Antes del FAQ

**Code:**

```html
<div class="bc-ad bc-ad-prefaq">
  <span class="bc-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="2457979274"
       data-ad-format="auto"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:**

| Campo | Valor |
|---|---|
| Nombre | `BC - Pre-FAQ` |
| Tipo de inserción | `Antes del párrafo` |
| Heading number | `20` (alternativa: `Before HTML element` con selector `h2:nth-last-of-type(1)` que apunta al H2 "Preguntas frecuentes") |
| Posts | Activado |
| Pages | Desactivado |
| Display Desktop | Activado |
| Display Tablet | Activado |
| Display Phone | Activado |
| Block alignment | `Center, no wrapping` |

---

## CSS común (pegar en Apariencia → Personalizar → CSS adicional)

```css
.bc-ad {
  margin: 32px auto;
  padding: 8px 0;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
}

.bc-ad-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin-bottom: 8px;
}

.bc-ad-inarticle {
  margin: 40px 0;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.bc-ad-sidebar-sticky {
  position: sticky;
  top: 100px;
  margin-top: 24px;
}

.bc-ad-prefaq {
  margin: 48px 0 32px;
}

@media (max-width: 768px) {
  .bc-ad-sidebar-sticky { position: static; }
}

.bc-legal-links h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.bc-legal-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.bc-legal-links li {
  margin-bottom: 6px;
}
.bc-legal-links a {
  text-decoration: none;
  font-size: 13px;
}
.bc-legal-links a:hover {
  text-decoration: underline;
}

.bc-legal-doc h2 {
  margin-top: 32px;
  margin-bottom: 12px;
}

.bc-legal-doc h3 {
  margin-top: 24px;
  margin-bottom: 10px;
}

.bc-legal-doc table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.bc-legal-doc th,
.bc-legal-doc td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: left;
}

.bc-legal-doc th {
  background-color: #f8f8f8;
  font-weight: 600;
}
```

---

## Configuración global de Ad Inserter

En la pestaña **(⚙) Settings → General**:

- Disable insertion on Pages: **ON** (las páginas legales no llevan ads)
- Disable insertion on Category pages: ON
- Disable insertion on Tag pages: ON
- Disable insertion on Search pages: ON
- Disable insertion in feeds: ON
- Maximum number of inserted ads per page: `4`

---

## Notas

- Lazy loading: usado vía `data-loading-strategy="lazy"` en cada `<ins>` (API oficial de AdSense). No requiere activar la opción de "Carga diferida" de Ad Inserter.
- Si actualizas algún slot ID, actualiza solo el valor de `data-ad-slot` en este archivo y vuelve a copiar al bloque correspondiente.
- **Tras cualquier cambio, purgar LiteSpeed Cache** (WP Admin → LiteSpeed Cache → Caja de herramientas → Purgar todo).
