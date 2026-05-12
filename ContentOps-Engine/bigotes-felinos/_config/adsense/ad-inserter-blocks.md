# Ad Inserter — Configuración de los 4 bloques

Este documento contiene los snippets exactos para los 4 placements de AdSense en bigotesfelinos.com.

Slots reales:

| Bloque | data-ad-slot |
|---|---|
| BF - In-article 1 (post H2 #1) | `6261282948` |
| BF - In-article 2 (post H2 #4-5) | `8251391154` |
| BF - Sidebar Sticky | `7324202730` |
| BF - Pre-FAQ | `1211888823` |

Cada bloque incluye `data-loading-strategy="lazy"` — lazy loading nativo de Google, sin necesidad de plugin extra.

---

## Bloque 1 — In-article superior (después del primer H2)

**Code:**

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

**Settings del bloque:**

| Campo | Valor |
|---|---|
| Nombre | `BF - In-article 1 (post H2 #1)` |
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
<div class="bf-ad bf-ad-inarticle">
  <span class="bf-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="8251391154"
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
| Nombre | `BF - In-article 2 (post H2 #4-5)` |
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

## Bloque 3 — Sidebar sticky (solo desktop)

**Code:**

```html
<div class="bf-ad bf-ad-sidebar-sticky">
  <span class="bf-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; min-height:600px;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="7324202730"
       data-ad-format="auto"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:**

| Campo | Valor |
|---|---|
| Nombre | `BF - Sidebar Sticky` |
| Tipo de inserción | `Disabled` (lo insertaremos como widget) |
| Display Desktop | Activado |
| Display Tablet | Desactivado |
| Display Phone | Desactivado |

**Después:** WP Admin → Apariencia → Widgets → Sidebar Principal → añadir widget "Ad Inserter" → seleccionar Block 3.

---

## Bloque 4 — Antes del FAQ

**Code:**

```html
<div class="bf-ad bf-ad-prefaq">
  <span class="bf-ad-label">Publicidad</span>
  <ins class="adsbygoogle"
       style="display:block; text-align:center;"
       data-ad-client="ca-pub-9927086309447038"
       data-ad-slot="1211888823"
       data-ad-format="auto"
       data-loading-strategy="lazy"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

**Settings:**

| Campo | Valor |
|---|---|
| Nombre | `BF - Pre-FAQ` |
| Tipo de inserción | `Before HTML element` |
| Selector | `h2:nth-last-of-type(1)` o usar el texto: insertar antes del último H2 (suele ser "Preguntas frecuentes") |
| Posts | Activado |
| Pages | Desactivado |
| Display Desktop | Activado |
| Display Tablet | Activado |
| Display Phone | Activado |
| Block alignment | `Center, no wrapping` |

---

## CSS común (pegar en Apariencia → Personalizar → CSS adicional)

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

@media (max-width: 768px) {
  .bf-ad-sidebar-sticky { position: static; }
}
```

---

## Configuración global de Ad Inserter

En la pestaña **(⚙) Settings → General**:

- Disable insertion on Pages: ON
- Disable insertion on Category pages: ON
- Disable insertion on Tag pages: ON
- Disable insertion on Search pages: ON
- Disable insertion in feeds: ON
- Maximum number of inserted ads per page: `4`

---

## Notas

- Lazy loading: usado vía `data-loading-strategy="lazy"` en cada `<ins>` (API oficial de AdSense). No requiere activar la opción de "Carga diferida" de Ad Inserter.
- Si actualizas algún slot ID, actualiza solo el valor de `data-ad-slot` en este archivo y vuelve a copiar al bloque correspondiente.
