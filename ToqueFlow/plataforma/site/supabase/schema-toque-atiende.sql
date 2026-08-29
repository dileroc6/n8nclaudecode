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
-- ⚠ ESTE ARCHIVO ES EL ÚNICO QUE ESCRIBE `incluye` Y `puede_llevar` DE
--   `agente-atencion`. Ya pasó dos veces que dos archivos escribían el mismo
--   dato y el que se corría después borraba el trabajo del otro —así
--   desapareció «escalar a una persona» del producto sin que nadie lo tocara.
--   Si hace falta cambiar qué lleva Toque Atiende, se cambia AQUÍ.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Las piezas estándar ───────────────────────────────────────────────────
-- Ninguna lleva `workflow`: no son sub-flujos que el agente llame por webhook.
-- Ver la ficha y anotar en ella ocurren dentro del mismo turno —la ficha llega
-- en el contexto y `responder` trae los datos— y escalar es una decisión que el
-- agente toma según `agent_config.enrutamiento`.
--
-- Se registran igual porque el cliente tiene derecho a saber qué compró, y
-- porque una capacidad que no aparece en ninguna pantalla no se puede vender.
insert into public.catalogo (clave, nombre, tipo, descripcion, beneficio, workflow, liberado, activo, orden)
values
  ('consultar-cliente', 'Ver la ficha de quien escribe', 'herramienta',
   'El agente recibe en cada mensaje lo que el negocio guarda de esa persona: sus datos, su estado y, si el negocio lleva saldo, cuanto le queda y en que palabras.',
   'El agente sabe con quien esta hablando y no vuelve a preguntar lo que ya le dijeron.',
   null, true, true, 20),

  ('actualizar-cliente', 'Guardar lo que le acaban de decir', 'herramienta',
   'Anota en la ficha los datos que la persona da conversando, solo en los campos que el negocio definio y respetando las listas cerradas.',
   'La base se llena sola con lo que la gente ya esta contando por WhatsApp.',
   null, true, true, 21),

  ('escalar-a-humano', 'Pasar la conversacion a una persona', 'herramienta',
   'Cuando la pregunta se sale de lo que el agente sabe, o alguien se molesta, o pide hablar con alguien, avisa a la persona que el negocio designo y deja de responder esa conversacion.',
   'Nadie queda hablando con un robot que no entiende. El agente sabe cuando no es su turno.',
   null, true, true, 22)

on conflict (clave) do update set
  nombre      = excluded.nombre,
  descripcion = excluded.descripcion,
  beneficio   = excluded.beneficio,
  workflow    = excluded.workflow,
  liberado    = excluded.liberado,
  activo      = excluded.activo,
  orden       = excluded.orden;


-- ── 2. El producto ───────────────────────────────────────────────────────────
update public.catalogo
   set nombre      = 'Toque Atiende',
       descripcion = 'Un agente que atiende el WhatsApp del negocio: responde sobre lo que hace y lo que vende, pasa la conversacion a una persona cuando no sabe, y va anotando en la ficha de cada quien los datos que el negocio decidio guardar. Segun el caso de uso se le encienden herramientas: agendar citas, confirmar pagos por transferencia, o consultar disponibilidad y pedidos contra el sitio del cliente.',
       beneficio   = 'El negocio deja de contestar lo mismo veinte veces al dia, y lo que la gente cuenta por WhatsApp queda en su base en vez de perderse en el chat.',

       -- Lo que va SIEMPRE. La prueba para entrar aquí: ¿le sirve igual a una
       -- tienda, un hotel, una clínica y un gimnasio, sin cambiar nada?
       incluye = array[
         'responder-conocimiento',
         'escalar-a-humano',
         'consultar-cliente',
         'actualizar-cliente'
       ],

       -- Lo que se enciende POR CASO DE USO. Todo esto cambia por sector: un
       -- taller no agenda citas de spa y una tienda no descuenta clases.
       puede_llevar = array[
         'ver-disponibilidad', 'agendar-cita', 'recordatorio-cita',   -- agendar
         'confirmar-pago',                                           -- pagos
         'estado-pedido',                                            -- contra el sitio
         'matricular-cliente', 'registrar-consumo', 'recargar-saldo', -- saldos
         'registrar-reclamo', 'reactivacion'
       ]
 where clave = 'agente-atencion';


-- ── 3. `consultar-saldo` se retira ───────────────────────────────────────────
-- Suponía que el negocio vende paquetes. Lo que hacía lo hace ahora
-- `consultar-cliente`, que devuelve el saldo dentro de la ficha cuando existe.
-- No se borra la fila: hay historia colgando de ella.
update public.catalogo
   set activo      = false,
       liberado    = false,
       descripcion = 'Retirada: la reemplaza consultar-cliente, que devuelve el saldo dentro de la ficha y no supone que el negocio venda paquetes.'
 where clave = 'consultar-saldo';


-- ── 4. Los agentes ───────────────────────────────────────────────────────────
-- En `agent_config.herramientas` solo van las que el agente llama por webhook.
-- Las estándar no están ahí a propósito: si estuvieran, se le ofrecerían a
-- Claude como herramientas y cada uso costaría una vuelta entera para leer o
-- escribir algo que ya viene en el contexto.
update public.agent_config
   set herramientas = array(
     select x from unnest(coalesce(herramientas, '{}')) x
     where x not in ('consultar-saldo', 'consultar-cliente', 'actualizar-cliente', 'escalar-a-humano')
   );
