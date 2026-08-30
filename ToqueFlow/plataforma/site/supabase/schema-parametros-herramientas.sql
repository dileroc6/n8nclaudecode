-- ============================================================================
-- ToqueFlow — Las herramientas dicen qué datos necesitan
-- ----------------------------------------------------------------------------
-- Lo encontró la prueba de conversación (hueco 108a), y era lo peor posible:
--
--   Cliente:  «agéndame a las 10, me llamo Marcela»
--   Agente:   «Listo Marcela, tu cita está agendada para el miércoles 2 de
--              septiembre a las 10:00 AM»
--   La base:  ninguna cita.
--
-- Alguien llega al negocio y no lo pueden atender. Es exactamente el fallo que
-- la herramienta estaba diseñada para evitar, provocado un nivel más arriba.
--
-- Dos causas, las dos de construcción:
--
--   1. El agente le mandaba a la herramienta SOLO la instancia y el teléfono.
--      Lo que el modelo pidiera —el servicio, la fecha, el nombre— se perdía
--      por el camino. Cualquier herramienta que necesite un dato estaba rota
--      desde el principio; `consultar-saldo` funcionaba porque no necesita
--      ninguno.
--
--   2. A Claude se le declaraban las herramientas con un solo campo, `motivo`.
--      No tenía forma de decir «a las 10» ni «limpieza facial» aunque
--      quisiera.
--
-- Esto arregla la segunda: cada herramienta declara en el catálogo qué datos
-- necesita, y el workflow se los pasa a Claude tal cual. **El workflow sigue
-- sin saber nada de herramientas concretas** — que es lo que lo mantiene
-- compartido entre todos los clientes.
--
-- Idempotente.
-- ============================================================================

-- OJO: `parametros` ya existía y es OTRA cosa — es «qué hay que configurarle a
-- esta pieza» (el tono, la instancia, los umbrales), en `text[]`, y se muestra
-- en la ficha del catálogo en la consola. Reusarla habría metido dos ideas
-- distintas en una columna, que es como se termina sin poder cambiar ninguna.
alter table public.catalogo
  add column if not exists entrada jsonb not null default '{}'::jsonb;

comment on column public.catalogo.entrada is
  'Que datos necesita esta herramienta cuando el AGENTE la llama, en JSON Schema. El workflow se lo entrega a Claude tal cual como input_schema, asi que agregar una herramienta no obliga a tocar el workflow. Distinto de `parametros`, que es lo que hay que configurarle a la pieza al venderla.';


-- ── Ver disponibilidad ───────────────────────────────────────────────────────
update public.catalogo set entrada = jsonb_build_object(
  'type', 'object',
  'properties', jsonb_build_object(
    'servicio', jsonb_build_object(
      'type', 'string',
      'description', 'Que servicio quiere. Usa el nombre exacto como aparece en el conocimiento del negocio. Si la persona no lo dijo, no lo inventes: dejalo vacio y pregunta.'),
    'dias', jsonb_build_object(
      'type', 'integer',
      'description', 'Cuantos dias hacia adelante mirar. 14 si no hay una fecha concreta; 2 o 3 si la persona dijo un dia.'))
) where clave = 'ver-disponibilidad';


-- ── Agendar la cita ──────────────────────────────────────────────────────────
-- `inicio` es el campo delicado. Un modelo que escribe fechas a mano se
-- equivoca de año, de zona horaria y de día de la semana, así que la
-- descripción es explícita y el prompt le da la fecha de hoy.
update public.catalogo set entrada = jsonb_build_object(
  'type', 'object',
  'properties', jsonb_build_object(
    'servicio', jsonb_build_object(
      'type', 'string',
      'description', 'El servicio, con el nombre exacto del negocio.'),
    'inicio', jsonb_build_object(
      'type', 'string',
      'description', 'Cuando empieza la cita, en formato ISO con la hora de Colombia. Ejemplo: 2026-09-02T10:00:00-05:00. Usa la fecha de HOY que aparece arriba para calcular «el miercoles» o «manana». Si no estas seguro de la fecha, pregunta en vez de adivinar.'),
    'nombre', jsonb_build_object(
      'type', 'string',
      'description', 'Como se llama la persona, si lo dijo.'),
    'notas', jsonb_build_object(
      'type', 'string',
      'description', 'Algo que el negocio deba saber antes de la cita.')),
  'required', jsonb_build_array('servicio', 'inicio')
) where clave = 'agendar-cita';


-- ── El contexto se los entrega al agente ─────────────────────────────────────
-- Se agrega `parametros` a lo que ya devolvía. Sin esto el workflow no puede
-- declarárselos a Claude.
-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.


revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;
