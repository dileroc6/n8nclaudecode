-- ============================================================================
-- El modelo lee una instrucción, no la frase de venta
-- ----------------------------------------------------------------------------
-- `tf_agente_contexto` le entregaba a Claude `coalesce(beneficio, descripcion)`.
-- `beneficio` es la frase que se le dice al CLIENTE al vender el paquete —
-- «Deja de contestar "déjame reviso" veinte veces al día». Como instrucción
-- para decidir cuándo llamar una herramienta no sirve: no dice cuándo.
--
-- Lo pilló un escenario de venta. La persona decía «sí, confirmo las 2», el
-- agente contestaba «listo, queda anotado tu pedido»… y no había ningún
-- pedido. Nunca llamó a la herramienta.
--
-- Ahora lee `instruccion` si existe, y si no cae a lo de antes.
-- Idempotente.
-- ============================================================================
-- ⚠ ESTE ARCHIVO YA NO HACE NADA. Se deja por lo que explica arriba.
--
-- Parcheaba `tf_agente_contexto` desde fuera para meterle que el modelo lea la instruccion.
-- El parche estaba bien hecho —contaba las veces que aparecia el ancla y se
-- paraba si no era exactamente una— pero seguia siendo un SEGUNDO ESCRITOR.
--
-- El 17-sep se reaplico `schema-agente-contexto.sql` para arreglar la zona
-- horaria, y eso borro TRES parches a la vez, en silencio: este, el del
-- cobro, y el de la instruccion. Ninguno fallo; simplemente dejaron de estar.
--
-- Vive ahora dentro de `schema-agente-contexto.sql`, que es el unico archivo
-- que define esa funcion. Lo vigila `el-agente-sabe-como-le-pagan.cjs`.

do $$ begin
  raise notice 'schema-agente-lee-instruccion.sql: ya no hace nada, vive en schema-agente-contexto.sql';
end $$;
