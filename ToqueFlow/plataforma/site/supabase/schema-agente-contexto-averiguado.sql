-- ============================================================================
-- El contexto entrega lo que el agente ya averiguó
-- ----------------------------------------------------------------------------
-- Va en la raíz del contexto y no dentro de `contacto`, porque existe aunque
-- la persona todavía no sea un contacto —en el sandbox pasa— y porque el
-- workflow lo mete en los MENSAJES, no en el prefijo cacheado.
--
-- Eso último no es un detalle: el caché de Anthropic es un match de prefijo
-- byte a byte, y esto cambia en cada turno. Metido en el bloque estable,
-- multiplicaría la factura por diez.
--
-- ⚠ EL ANCLA TIENE QUE SER ÚNICA. La primera versión de este parche enganchó
-- con `'asignado_humano'`, que aparece DOS veces —la clave del JSON y el campo
-- de donde sale su valor—, así que el reemplazo se metió en las dos y dejó la
-- función rota: «cannot cast type record to boolean», y el agente dejó de
-- contestar. Se ancla en `'historial', v_hist`, que aparece una sola vez, y se
-- comprueba que sea así antes de tocar nada.
--
-- Idempotente. Requiere schema-agente-averiguado.sql.
-- ============================================================================
-- ⚠ ESTE ARCHIVO YA NO HACE NADA. Se deja por lo que explica arriba.
--
-- Parcheaba `tf_agente_contexto` desde fuera para meterle lo que el agente averiguo.
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
  raise notice 'schema-agente-contexto-averiguado.sql: ya no hace nada, vive en schema-agente-contexto.sql';
end $$;
