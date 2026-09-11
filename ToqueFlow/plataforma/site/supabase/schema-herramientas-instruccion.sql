-- ============================================================================
-- Lo que lee Ferney y lo que lee el modelo no son el mismo texto
-- ----------------------------------------------------------------------------
-- EL PROBLEMA, encontrado probando una conversación de venta:
--
--   cliente: si, confirmo las 2
--   agente:  Listo, queda anotado tu pedido de 2 cajas.
--   (no había ningún pedido — nunca llamó a la herramienta)
--
-- `catalogo.descripcion` estaba haciendo dos trabajos a la vez: explicarle el
-- producto a quien vende, y decirle al modelo cuándo usar la herramienta. La de
-- `crear-pedido` decía:
--
--   «Dejar el pedido creado en la tienda del negocio con lo que la persona
--    pidio. Existe para Savia contra WooCommerce.»
--
-- Eso es una ficha comercial. Al modelo no le dice CUÁNDO llamarla, y le
-- menciona un cliente que no significa nada dentro de una conversación. Encima
-- el workflow le pegaba a todas «úsala cuando la persona pregunte por eso»,
-- que sirve para las de consultar y es falso para las que HACEN algo: esas no
-- se disparan con una pregunta, se disparan cuando la persona acepta.
--
-- Se separan los dos públicos. `descripcion` sigue siendo para la consola;
-- `instruccion` es lo único que ve el modelo. Si una herramienta no tiene
-- instrucción se usa la descripción, como antes.
--
-- Idempotente.
-- ============================================================================

alter table public.catalogo
  add column if not exists instruccion text;

comment on column public.catalogo.instruccion is
  'Lo que lee el MODELO para saber cuando llamar esta herramienta. Distinto de descripcion, que es lo que lee quien vende. Sin esto, una ficha comercial acaba de instruccion y el agente narra acciones que nunca hizo.';


-- Las instrucciones. Se escriben en segunda persona y dicen CUÁNDO, que es lo
-- único que el modelo necesita decidir.
update public.catalogo set instruccion = v.txt
from (values
  ('buscar-catalogo',
   'Busca un producto en el catalogo de este negocio. USALA SIEMPRE antes de decir un precio o si hay existencias: nunca los digas de memoria. Devuelve tambien las otras tallas o presentaciones del mismo producto, para que puedas ofrecer la que si hay.'),

  ('crear-pedido',
   'Deja armado el pedido. USALA EN CUANTO LA PERSONA ACEPTE COMPRAR —«si», «hagale», «confirmo», «mandemelo»—, antes de contestarle. No existe ningun pedido hasta que la llames: si dices que quedo anotado sin haberla llamado, la persona se va creyendo que le van a despachar y no hay nada. El pedido queda ARMADO y lo confirma una persona del negocio.'),

  ('estado-pedido',
   'Mira en que va el pedido de quien te escribe. Usala cuando pregunten por un pedido suyo, con numero o sin el.'),

  ('confirmar-pago',
   'Anota que la persona DICE que pago. USALA EN CUANTO LO DIGA —«ya pague», «ya transferi», «ahi le mande el soporte»—, antes de contestarle. No comprueba nada contra el banco: queda anotado para que alguien del negocio lo verifique. Nunca le digas que el pago esta confirmado.'),

  ('matricular-cliente',
   'Deja pedida la matricula de alguien nuevo. USALA CUANDO LA PERSONA ACEPTE, antes de contestarle. No queda aplicada: alguien del negocio la aprueba.'),

  ('recargar-saldo',
   'Deja pedida una recarga de saldo. USALA CUANDO LA PERSONA DIGA QUE YA PAGO O QUE QUIERE RECARGAR, antes de contestarle. NO sube el saldo: alguien del negocio lo aprueba. Nunca le digas que ya le quedo cargado.'),

  ('registrar-consumo',
   'Descuenta una unidad del saldo de quien te escribe. Usala cuando confirmen que asistieron o usaron el servicio.'),

  ('consultar-saldo',
   'Mira cuanto saldo le queda a quien te escribe. Usala antes de decir un numero de clases o sesiones: nunca lo digas de memoria.'),

  ('registrar-reclamo',
   'Deja escrita una queja con un numero corto que le puedas dictar. USALA CUANDO ALGUIEN RECLAME, antes de contestarle, aunque tambien vayas a escalar.'),

  ('ver-disponibilidad',
   'Mira que horas hay libres. Usala antes de ofrecer una hora: nunca inventes disponibilidad.'),

  ('agendar-cita',
   'Deja agendada la cita. USALA EN CUANTO LA PERSONA ESCOJA UNA HORA, antes de contestarle. No hay ninguna cita hasta que la llames.'),

  ('confirmar-cita',
   'Marca si la persona confirma que va o que no puede. Usala cuando responda a un recordatorio.')
) as v(clave, txt)
where public.catalogo.clave = v.clave;
