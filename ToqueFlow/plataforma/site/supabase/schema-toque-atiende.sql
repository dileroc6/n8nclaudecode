-- ============================================================================
-- ToqueFlow — Qué es Toque Atiende, dicho por Diego
-- ----------------------------------------------------------------------------
-- La definición del producto, con sus palabras:
--
--   «Un agente que responde preguntas de un sitio y sus servicios; si no sabe,
--    redirecciona a un admin humano; registra en una tabla personalizada la
--    información de los clientes; tiene la posibilidad de agendar citas (si
--    así lo requiere el cliente) y/o de registrar pagos como transferencias
--    (como se hace en Savia) o integrarse con el sitio web para registrar
--    pagos y ver disponibilidad de productos. Las herramientas mencionadas se
--    usan de acuerdo al caso de uso.»
--
-- Eso parte el producto en dos mitades, y la partición es el diseño:
--
--   LO QUE VA SIEMPRE          responder · escalar · ver la ficha · anotar
--   LO QUE SE ENCIENDE         agendar · pagos · disponibilidad · saldo
--
-- La primera mitad le sirve igual a una tienda, un hotel, una clínica y un
-- gimnasio. La segunda cambia por sector, y por eso se enciende por caso de
-- uso en vez de venir puesta.
--
-- Lo que faltaba: **escalar a un humano**. Está construido dentro del workflow
-- desde el principio, pero no existía como pieza del catálogo, así que no se
-- veía en la ficha del cliente ni se podía explicar en una propuesta. Una
-- capacidad que no se ve no se vende — y esta es de las que más tranquilidad
-- dan al que compra.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Escalar a un humano, que ya existía sin nombre ────────────────────────
-- No lleva `workflow` propio a propósito: no es un sub-flujo que el agente
-- llame, es una decisión que toma dentro de su propio turno según las reglas
-- de `agent_config.enrutamiento`. Se registra igual porque el cliente tiene
-- derecho a saber que la tiene.
insert into public.catalogo (clave, nombre, tipo, descripcion, beneficio, workflow, liberado, activo, orden)
values
  ('escalar-a-humano', 'Pasar la conversacion a una persona', 'herramienta',
   'Cuando la pregunta se sale de lo que el agente sabe, o alguien se molesta, o pide hablar con alguien, avisa a la persona que el negocio haya designado y deja de responder esa conversacion.',
   'Nadie queda hablando con un robot que no entiende. El agente sabe cuando no es su turno.',
   null, true, true, 22)
on conflict (clave) do update set
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  beneficio   = excluded.beneficio,
  liberado    = excluded.liberado,
  activo      = excluded.activo;


-- ── 2. El producto, con la definición de arriba ──────────────────────────────
update public.catalogo
   set nombre      = 'Toque Atiende',
       descripcion = 'Un agente que atiende el WhatsApp del negocio: responde sobre lo que hace y lo que vende, pasa la conversacion a una persona cuando no sabe, y va anotando en la ficha de cada quien los datos que el negocio decidio guardar. Segun el caso de uso se le encienden herramientas: agendar citas, confirmar pagos por transferencia, o consultar disponibilidad y pedidos contra el sitio del cliente.',
       beneficio   = 'El negocio deja de contestar lo mismo veinte veces al dia, y lo que la gente cuenta por WhatsApp queda en su base en vez de perderse en el chat.',

       -- Lo que va SIEMPRE. Le sirve a una tienda, un hotel, una clinica y un
       -- gimnasio sin cambiar nada: esa es la prueba para entrar aqui.
       incluye = array[
         'responder-conocimiento',
         'escalar-a-humano',
         'consultar-cliente',
         'actualizar-cliente'
       ],

       -- Lo que se enciende POR CASO DE USO. Todo esto cambia por sector, y por
       -- eso no viene puesto: un taller no agenda citas de spa, y una tienda no
       -- descuenta clases.
       puede_llevar = array[
         -- agendar
         'ver-disponibilidad', 'agendar-cita', 'recordatorio-cita',
         -- pagos
         'confirmar-pago',
         -- contra el sitio del cliente
         'estado-pedido',
         -- saldos y paquetes, para quien venda por unidades
         'matricular-cliente', 'registrar-consumo', 'recargar-saldo',
         -- otros
         'registrar-reclamo', 'reactivacion'
       ]
 where clave = 'agente-atencion';


-- ── 3. Los agentes que ya existen se quedan con lo estándar ──────────────────
-- Escalar no se declara en `herramientas` porque no es un sub-flujo; el resto
-- sí. Se añade sin quitar lo que cada agente ya tuviera encendido.
update public.agent_config
   set herramientas = array(
     select distinct x
     from unnest(coalesce(herramientas, '{}') || array['consultar-cliente', 'actualizar-cliente']) x
   );
