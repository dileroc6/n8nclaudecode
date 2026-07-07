# Script: sincronización de `savia.fichas_producto` desde WooCommerce

**Frecuencia:** cron diario 02:00 AM (n8n).

**Propósito:** mantener un cache de productos y atributos para responder rápido y como fallback si la API de Woo falla. **No es la fuente de verdad de stock** — el agente siempre re-valida en vivo antes de generar Payment Link.

---

## Lógica del workflow

```
[Cron 02:00 AM]
   │
   ▼
[1. Paginar productos en Woo]
   GET {{$env.WOO_BASE_URL}}/wp-json/wc/v3/products
     ?per_page=100
     &status=publish
     &page={n}
   loop hasta vaciar la paginación
   │
   ▼
[2. Por cada producto]
   ├─► Si type='variable':
   │     GET /products/{id}/variations?per_page=100
   │     construir variaciones[] con id, talla, color, stock, sku
   │
   ├─► Extraer atributos:
   │     - linea  (atributo "Línea" si existe)
   │     - categoria (de category[0].name)
   │     - tallas_disponibles (de attribute "Talla" o de variaciones con stock>0)
   │     - materiales (de meta_data o description)
   │
   ▼
[3. UPSERT en savia.fichas_producto]
   INSERT INTO savia.fichas_producto (
     woo_product_id, nombre, slug, linea, categoria,
     descripcion_corta, materiales, tallas_disponibles,
     precio_cop, stock_total, url_imagen, url_producto,
     variaciones, sincronizado_at
   )
   VALUES (...)
   ON CONFLICT (woo_product_id) DO UPDATE SET
     nombre = EXCLUDED.nombre,
     precio_cop = EXCLUDED.precio_cop,
     stock_total = EXCLUDED.stock_total,
     tallas_disponibles = EXCLUDED.tallas_disponibles,
     variaciones = EXCLUDED.variaciones,
     sincronizado_at = now(),
     ...;
   │
   ▼
[4. Marcar como inactivos los que no aparecieron]
   UPDATE savia.fichas_producto
   SET stock_total = 0
   WHERE sincronizado_at < now() - interval '1 hour';
   │
   ▼
[5. Resumen al admin (opcional)]
   POST Evolution savia-admin:
   "Sync productos OK · {n_creados} nuevos · {n_actualizados} actualizados · {n_descontinuados} descontinuados"
```

---

## Mapeo de campos Woo → fichas_producto

| Campo en Woo (REST API) | Campo en `fichas_producto` |
|---|---|
| `id` | `woo_product_id` |
| `name` | `nombre` |
| `slug` | `slug` |
| `categories[0].name` | `categoria` |
| `attributes[name=Línea].options[0]` | `linea` |
| `short_description` | `descripcion_corta` (strip HTML) |
| `meta_data[key=materiales].value` o parseo de `description` | `materiales` |
| `attributes[name=Talla].options` | `tallas_disponibles` |
| `price` | `precio_cop` (cast a int) |
| `stock_quantity` (sumando variaciones) | `stock_total` |
| `images[0].src` | `url_imagen` |
| `permalink` | `url_producto` |
| Llamada secundaria a `/products/{id}/variations` | `variaciones` |

---

## Carga del `guia_tallas_json`

El sitio público de Savia **no tiene guía de tallas en cm**. Esto es trabajo **manual** del cliente:

1. Crear un CSV con: `talla, busto_cm, cintura_cm, cadera_cm` por categoría.
2. Cargar a `savia.fichas_producto.guia_tallas_json` por producto o por línea.
3. Documentar en `docs/guia-tallas.md` para referencia del equipo.

Sin este dato, el agente no puede responder consultas tipo "soy talla M en jeans, ¿cuál me sirve?".

---

## Manejo de errores

- Reintento 3 veces con backoff exponencial (1s, 4s, 16s) si Woo retorna 5xx.
- Si la sincronización falla completamente, NO truncar `fichas_producto` — mantiene el cache anterior y alerta al admin.

---

## Schedule recomendado

| Job | Cron | Acción |
|---|---|---|
| Sync productos completo | `0 2 * * *` | Todo el catálogo |
| Refresh stock (rápido) | `0 */2 * * *` | Solo `stock_quantity` de productos con stock_total < 5 en último sync |
| Expirar pedidos viejos | `0 * * * *` | `UPDATE pedidos SET estado='expirado' WHERE estado='link_generado' AND expira_at < now()` |

---

## Estado

⏳ **Por construir en Sprint 1.5** (después de validar WF-01, WF-02, WF-03 en producción).
