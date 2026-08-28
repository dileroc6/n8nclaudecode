-- ============================================================================
-- ToqueFlow — Capturar a un interesado y matricular a un cliente no es lo mismo
-- ----------------------------------------------------------------------------
-- La pieza «Registrar a quien escribe» estaba mal planteada, y la pregunta de
-- Diego lo destapó: ¿y registrar clientes, ese no debería ir también?
--
-- Sí, pero no era el que estaba. Había dos cosas distintas metidas en una:
--
--   CAPTURAR A QUIEN ESCRIBE   ya pasa solo, sin herramienta. Cada mensaje que
--                              llega crea o actualiza la ficha del contacto con
--                              lo que el agente entendió. Declararlo como pieza
--                              opcional era ofrecer algo que ya viene incluido.
--
--   MATRICULAR A UN CLIENTE    es otra cosa: alguien COMPRÓ. Hay que dejarlo
--                              registrado como cliente, con qué compró y con
--                              cuántas unidades le quedan. Eso no pasa solo y
--                              es lo que faltaba.
--
-- La diferencia importa porque el saldo no existe hasta que alguien matricula:
-- consultar, descontar y recargar operan sobre un número que alguien tuvo que
-- poner ahí la primera vez.
--
-- Idempotente.
-- ============================================================================

-- Se retira la pieza mal planteada. No se borra: se desactiva, para que si
-- alguien la tenía encendida no le desaparezca sin explicación.
update public.catalogo set
  activo = false,
  descripcion = 'RETIRADA: capturar a quien escribe ya pasa solo, sin herramienta. Cada mensaje crea o actualiza la ficha del contacto. Ofrecerlo como pieza opcional era vender algo que ya viene incluido. Lo que sí faltaba es matricular, que es otra cosa.'
where clave = 'registrar-cliente';

insert into public.catalogo (clave, tipo, nombre, descripcion, beneficio, estado, liberado, visible_cliente, vendible, workflow, orden) values
  ('matricular-cliente', 'herramienta', 'Matricular a un cliente',
   'Dejar registrado que alguien COMPRÓ: qué paquete, con cuántas unidades y desde cuándo. Es el paso que hace existir el saldo — consultar, descontar y recargar operan sobre un número que alguien tuvo que poner ahí la primera vez. Distinto de capturar a quien escribe, que ya pasa solo en cada mensaje. Requiere confirmación de una persona: matricular es cobrar, y un agente que matricula solo es un agente que regala.',
   'Cuando alguien compra, queda registrado con su paquete y sus clases sin que nadie lo anote a mano.',
   'en_papel', false, false, false, 'tool-matricular-cliente', 118)
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  estado = excluded.estado, liberado = excluded.liberado, workflow = excluded.workflow, orden = excluded.orden;

-- La familia del saldo, en el orden en que ocurre de verdad:
-- se matricula, se consulta, se descuenta, se recarga.
update public.catalogo set puede_llevar = array[
  'matricular-cliente', 'consultar-saldo', 'registrar-consumo', 'recargar-saldo',
  'estado-pedido', 'confirmar-pago',
  'ver-disponibilidad', 'agendar-cita', 'registrar-reclamo',
  'recordatorio-cita', 'reactivacion'
] where clave = 'agente-atencion';

-- Y se deja dicho en la pieza base que la captura va incluida, para que nadie
-- vuelva a proponerla como algo aparte.
update public.catalogo set descripcion =
'La base del agente: responder usando el documento que el cliente cargó, y nada más. Si algo no está escrito ahí, lo dice en vez de inventarlo. **Incluye guardar a quien escribe**: cada mensaje crea o actualiza la ficha del contacto con lo que el agente entendió, sin necesidad de ninguna herramienta. Va siempre y no se puede apagar.'
where clave = 'responder-conocimiento';
