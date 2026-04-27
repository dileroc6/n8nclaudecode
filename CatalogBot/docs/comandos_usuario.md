# Manual de comandos para usuarios — CatalogBot

Referencia de todo lo que puedes hacer desde WhatsApp.

---

## Qué puedes hacer según tu rol

| Acción | Admin | Editor | Viewer |
|---|---|---|---|
| Buscar productos | ✅ | ✅ | ✅ |
| Ver detalle de un producto | ✅ | ✅ | ✅ |
| Ver historial de cambios propios | ✅ | ✅ | ✅ |
| Ver historial de todos los usuarios | ✅ | ✅ | ❌ |
| Ver categorías disponibles | ✅ | ✅ | ✅ |
| Crear productos | ✅ | ✅ | ❌ |
| Actualizar nombre/descripción/SKU | ✅ | ✅ | ❌ |
| Actualizar precio de un producto | ✅ | ✅ | ❌ |
| Aplicar descuentos | ✅ | ✅ | ❌ |
| Quitar descuentos | ✅ | ✅ | ❌ |
| Subir fotos de productos | ✅ | ✅ | ❌ |
| Programar cambios futuros | ✅ | ✅ | ❌ |
| Actualizar precios por categoría (masivo) | ✅ | ❌ | ❌ |
| Eliminar productos | ✅ | ❌ | ❌ |
| Revertir cambios | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

---

## Ejemplos de mensajes

### Buscar productos

```
"buscar camiseta azul"
"¿tienes algo de la marca X?"
"busca el producto con SKU AZU-M-001"
```

### Ver detalle de un producto

```
"muéstrame el producto ID 1234"
"¿cuál es el precio de la camiseta azul?"
```

### Crear un producto *(editor / admin)*

```
"crear producto Camiseta Azul Talla M, precio 89900, categoría ropa"
"agregar nuevo producto: Servicio de Consultoría, precio 150000"
```

El bot te pedirá confirmar antes de crearlo.

### Actualizar precio *(editor / admin)*

```
"cambiar precio de la camiseta azul a 75000"
"actualizar precio del producto 1234 a 99900"
```

El bot mostrará el precio actual y el nuevo antes de confirmar.

### Aplicar descuento *(editor / admin)*

```
"aplicar 20% de descuento a la camiseta azul"
"poner precio de oferta 45000 al producto 1234"
"descuento de 10000 al servicio de consultoría hasta el 31 de diciembre"
```

### Quitar descuento *(editor / admin)*

```
"quitar la oferta de la camiseta azul"
"eliminar descuento del producto 1234"
```

### Actualizar nombre o descripción *(editor / admin)*

```
"cambiar nombre del producto 1234 a 'Camiseta Azul Premium Talla M'"
"actualizar descripción de la camiseta azul"
```

### Subir foto *(editor / admin)*

Envía directamente una foto desde WhatsApp. El bot la analizará
y preguntará a qué producto asignarla.

### Programar un cambio *(editor / admin)*

```
"programar cambio de precio de la camiseta azul a 65000 para el 1 de enero"
"aplicar descuento del 30% a la categoría ropa el 24 de diciembre a las 9am"
```

### Ver historial *(todos los roles)*

```
"ver cambios de hoy"
"¿quién modificó el producto camiseta azul?"
"historial de cambios de esta semana"
```

### Revertir un cambio *(solo admin)*

```
"revertir último cambio de camiseta azul"
"revertir cambio #42"
```

### Cambio de precios masivo *(solo admin)*

```
"subir 10% los precios de la categoría ropa"
"bajar 15% todos los precios de electrónica"
```

Requiere confirmar con **CONFIRMAR MASIVO**.

### Eliminar un producto *(solo admin)*

```
"eliminar producto 1234"
"borrar la camiseta azul del catálogo"
```

Requiere confirmar con **CONFIRMAR ELIMINAR**.

---

## Comandos de administración *(solo admin)*

```
agregar admin 573001234567 Juan Pérez
agregar editor 573002345678 María López
listar usuarios
desactivar 573002345678
ver cambios de hoy
revertir último cambio de camiseta azul
ver programados pendientes
cancelar programado #5
estado del sistema
```

---

## Confirmar una acción

Cuando el bot muestra el resumen y pide confirmación:
- Escribe **CONFIRMAR** para ejecutar
- Escribe cualquier otra cosa para cancelar
- Para eliminar un producto: **CONFIRMAR ELIMINAR**
- Para cambio masivo de precios: **CONFIRMAR MASIVO**

---

## Iniciar una nueva consulta

```
"nueva consulta"
"reiniciar"
```

---

## Notas importantes

- El bot solo acepta texto e imágenes. No procesa audios, PDFs ni documentos.
- Las confirmaciones expiran en 5 minutos. Si tardas más, el bot te avisará.
- Los cambios masivos de precio están limitados a 100 productos por operación.
- Puedes consultar el historial de los últimos 50 cambios como máximo.
