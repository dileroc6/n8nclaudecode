-- ============================================================================
-- Cómo cobra el negocio va en el contexto, no en la respuesta de una herramienta
-- ----------------------------------------------------------------------------
-- EL HUECO QUE ESTO TAPA, y lo encontró una conversación de prueba:
--
--   cliente:  «listo me lleva 1 martillo. ¿a qué cuenta le consigno?»
--   agente:   «Para el pago por transferencia necesito que me confirmes y te
--              paso la cuenta.»
--
-- No estaba siendo evasivo: **no tenía la cuenta**. Los datos llegaban dentro
-- de la respuesta de `crear-pedido`, así que el agente solo los conocía después
-- de armar un pedido. Y la gente pregunta antes.
--
-- Cómo cobra un negocio es CONFIGURACIÓN, igual que el tono o el horario: tiene
-- que estar ahí desde el primer mensaje. Además va en el bloque cacheado del
-- prompt, que cambia una vez cada mucho — mandarlo en cada herramienta era
-- pagarlo en cada turno.
--
-- Se deja también en la respuesta de `crear-pedido`: no estorba, y ahí llega
-- justo cuando se necesita.
--
-- Idempotente.
-- ============================================================================

-- ⚠ ESTE ARCHIVO YA NO HACE NADA. Se deja por lo que explica arriba.
--
-- Parcheaba `tf_agente_contexto` desde fuera para meterle el cobro. El parche
-- estaba bien pensado —no reescribia la funcion entera, y fallaba ruidoso si
-- no encontraba donde meterlo— pero seguia siendo un SEGUNDO ESCRITOR.
--
-- El 17-sep se reaplico `schema-agente-contexto.sql` para arreglar la zona
-- horaria, y eso borro el parche EN SILENCIO. El agente estuvo desde entonces
-- sin saber como le pagan a su negocio — justo el hueco que este archivo
-- existia para tapar.
--
-- El cobro vive ahora dentro de `schema-agente-contexto.sql`, que es el unico
-- archivo que define esa funcion.

do $$ begin
  raise notice 'schema-agente-cobro-en-contexto.sql: ya no hace nada, el cobro vive en schema-agente-contexto.sql';
end $$;
