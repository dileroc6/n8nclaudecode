# Descripciones de tools para el AI Agent

Referencia de cuándo usar cada tool. Ver schemas JSON completos en schemas/tools/.

---

## buscar_producto
**Cuándo usar:** El usuario menciona un producto por nombre parcial, descripción o SKU, y no proporciona el ID exacto.
**No usar:** Cuando ya tienes el ID del producto (usar obtener_producto directamente).
**Resultado:** Lista de candidatos con id, nombre, precio y SKU.

## obtener_producto
**Cuándo usar:** Ya tienes el ID exacto del producto y necesitas los detalles completos (precio actual, variantes, imágenes).
**No usar:** Para búsquedas — usar buscar_producto.
**Resultado:** Objeto completo del producto con todas sus variantes.

## crear_producto
**Cuándo usar:** El usuario solicita agregar un producto nuevo al catálogo.
**Flujo:** Listar categorías → recopilar datos → confirmar → ejecutar.
**Resultado:** ID del producto creado.

## actualizar_producto
**Cuándo usar:** El usuario quiere cambiar nombre, descripción, SKU, categoría o imagen de un producto.
**No usar para precio:** Para precio usar actualizar_precio.
**Resultado:** Confirmación de los campos actualizados.

## eliminar_producto
**Cuándo usar:** Solo con instrucción explícita del usuario admin de eliminar/borrar un producto.
**Flujo obligatorio:** Siempre doble confirmación con "CONFIRMAR ELIMINAR".
**Resultado:** Confirmación de eliminación.

## listar_categorias
**Cuándo usar:** El usuario pregunta por categorías disponibles, o antes de crear/mover un producto y no se conoce el ID de categoría.
**Resultado:** Lista de categorías con id y nombre.

## actualizar_precio
**Cuándo usar:** El usuario quiere cambiar el precio de un producto o variante.
**Siempre:** Mostrar precio actual y nuevo antes de confirmar.
**Resultado:** Confirmación con el precio actualizado.

## crear_descuento
**Cuándo usar:** El usuario quiere aplicar una oferta, promoción o precio de venta.
**Tipos:** porcentaje (% de descuento), monto_fijo (restar cantidad), precio_especial (precio exacto de oferta).
**Resultado:** Precio de venta resultante y fechas si aplican.

## eliminar_descuento
**Cuándo usar:** El usuario quiere quitar una oferta o precio de venta activo.
**Resultado:** Confirmación de que el descuento fue eliminado.

## precio_masivo
**Cuándo usar:** El usuario quiere actualizar precios de toda una categoría a la vez.
**Restricción crítica:** Máximo 100 productos. Solo rol admin. Doble confirmación "CONFIRMAR MASIVO".
**Resultado:** Resumen de cuántos productos se actualizaron y cuántos fallaron.

## subir_imagen
**Cuándo usar:** El usuario envía una foto que debe asignarse a un producto.
**Flujo:** Validar tamaño ≤5MB → subir_imagen → usar la URL retornada en crear_producto o actualizar_producto.
**Resultado:** URL pública de la imagen en Cloudinary.

## analizar_imagen
**Cuándo usar:** El usuario envía una foto de un producto y no especifica de qué producto se trata.
**Resultado:** nombre_probable, descripcion, caracteristicas[], nivel_confianza (alto/medio/bajo).

## ver_historial
**Cuándo usar:** El usuario pregunta por cambios recientes, historial de un producto, o quiere auditar acciones.
**Restricción viewer:** Solo puede ver su propio historial.
**Resultado:** Lista de cambios con timestamp, usuario, acción y valores antes/después.

## revertir_cambio
**Cuándo usar:** El usuario admin quiere deshacer un cambio específico del historial.
**Verificar:** Que revertido=false en el registro de auditoría antes de proceder.
**Resultado:** Confirmación del revert con el valor restaurado.

## programar_cambio
**Cuándo usar:** El usuario quiere que un cambio se ejecute en una fecha/hora futura.
**Validar:** Que fecha_ejecucion sea en el futuro.
**Resultado:** ID del programado para seguimiento.
