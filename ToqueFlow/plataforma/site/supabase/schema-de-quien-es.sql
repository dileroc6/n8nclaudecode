-- ============================================================================
-- ToqueFlow — Una sola definición de «esta empresa es tuya»
-- ----------------------------------------------------------------------------
-- Varias funciones tienen que ser SECURITY DEFINER —leen bajas, citas, perfiles—
-- y reciben el `company_id` como PARÁMETRO. Esa combinación es la forma exacta
-- del agujero que ya apareció tres veces en este proyecto: permisos elevados
-- que se fían de lo que les pasan. Por eso cada una comprueba de quién es la
-- empresa antes de mirar nada.
--
-- El problema es que esa comprobación estaba copiada en cada función, y la
-- copia tenía DOS errores que se tapaban entre sí:
--
-- 1. `current_user = 'n8n_worker'` DENTRO de una SECURITY DEFINER nunca es
--    cierto. Ahí `current_user` es el dueño de la función —postgres—, no quien
--    llamó. Lo que se quería preguntar es `session_user`.
--
-- 2. Cuando nada casa, el resultado no era `false` sino NULL: `p_company =
--    my_company_id()` con la empresa en nulo da NULL, y `false or NULL` es
--    NULL. Y `if not NULL then return; end if;` NO SE EJECUTA.
--
-- O sea: el worker de n8n pasaba porque un NULL se colaba por un guardia, no
-- porque el guardia lo dejara pasar. Y lo mismo le pasaba a cualquier sesión
-- autenticada SIN perfil — que veía los contactos de cualquier empresa con
-- solo mandar su id.
--
-- El día que alguien «arreglara» el NULL con un coalesce, n8n se habría caído
-- sin que nadie entendiera por qué. Y mientras tanto el hueco seguía abierto.
--
-- Ahora la pregunta se hace en un solo sitio y devuelve true o false, nunca
-- NULL.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_es_mia(p_company uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    -- Sin empresa no hay nada que autorizar.
    p_company is not null and (

      -- El dueño de los datos: quien entró al portal con su sesión.
      p_company = public.my_company_id()

      -- ToqueFlow, que administra a todos sus clientes.
      or public.is_super_admin()

      -- El worker de n8n. Va por `session_user` porque dentro de una
      -- SECURITY DEFINER `current_user` siempre es el dueño de la función.
      or session_user = 'n8n_worker'

      -- Las herramientas y las pruebas, que entran por conexión directa.
      -- No concede nada nuevo: postgres es dueño de las tablas y la RLS no le
      -- aplica de todos modos. Está escrito para que sea una decisión visible
      -- y no un NULL colándose.
      or session_user = 'postgres'
    ),
    false);   -- ante la duda, no.
$fn$;

comment on function public.tf_es_mia(uuid) is
  'De quien es esta empresa. UNA sola definicion para todas las funciones SECURITY DEFINER que reciben company_id por parametro. Devuelve true o false, nunca NULL: un NULL no dispara el «if not ...» y deja pasar a quien no debia.';

grant execute on function public.tf_es_mia(uuid) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_es_mia(uuid) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_es_mia(uuid) from public, anon;

-- El guardia viejo, que vivía solo en la base y en ningún archivo. Se queda
-- como un alias del de verdad para no romper nada que aún lo llame.
create or replace function public.tf_campana_destinatarios_guardia(p_company uuid)
returns boolean
language sql stable
as $fn$ select public.tf_es_mia(p_company) $fn$;

revoke execute on function public.tf_campana_destinatarios_guardia(uuid) from public, anon;
