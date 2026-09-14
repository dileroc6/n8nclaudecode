-- ============================================================================
-- ToqueFlow — Una sola definición de «qué hora es para este negocio»
-- ----------------------------------------------------------------------------
-- Toda la agenda se calcula en la hora de PARED del negocio: «tengo libre el
-- martes a las 3» significa las 3 de la tarde allá, no en UTC ni en Bogotá.
--
-- La zona ya se leía de `companies.metadata->>'zona_horaria'`, pero con
-- 'America/Bogota' escrito a mano en NUEVE sitios como valor por defecto. Eso
-- funciona mientras todos los clientes estén en Colombia y se rompe callado el
-- día que no — y el primer cliente que se está cotizando es de clínicas en
-- España.
--
-- Peor: en el disparo de campañas programadas la zona no era un valor por
-- defecto sino un SUPUESTO — `at time zone 'America/Bogota'` con un offset
-- '-05:00' pegado al texto. Una clínica en Madrid habría recibido sus campañas
-- siete horas corridas, y el offset fijo además ignora el horario de verano.
--
-- Ahora la pregunta se hace en un solo sitio.
--
-- Idempotente.
-- ============================================================================

-- ── Qué zona usa una empresa ────────────────────────────────────────────────
-- Devuelve SIEMPRE una zona que Postgres reconoce. Si lo guardado no existe
-- —un dedazo, un nombre viejo— se cae a Bogotá en vez de reventar: una agenda
-- que no abre es peor que una agenda con la hora del sitio equivocado, y el
-- aviso queda en el registro de la empresa, no en una excepción a medio flujo.
create or replace function public.tf_zona(p_company uuid)
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(
    (select z.name
     from public.companies c
     left join pg_timezone_names z
       on z.name = nullif(btrim(c.metadata->>'zona_horaria'), '')
     where c.id = p_company),
    'America/Bogota');
$fn$;

comment on function public.tf_zona(uuid) is
  'La zona horaria del negocio. UNA sola definicion: toda la agenda se calcula en su hora de pared. Si lo guardado no es una zona real, cae a Bogota en vez de reventar.';

grant execute on function public.tf_zona(uuid) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_zona(uuid) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_zona(uuid) from public, anon;


-- ── Guardar la zona de una empresa ──────────────────────────────────────────
-- Se valida contra las zonas que Postgres conoce. Guardar 'Madrid' o
-- 'GMT+2' deja la agenda calculando en Bogotá sin que nadie se entere, que es
-- justo el error que esto existe para evitar.
create or replace function public.tf_zona_guardar(p_company uuid, p_zona text)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare v_z text := nullif(btrim(coalesce(p_zona, '')), '');
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;
  if v_z is null or not exists (select 1 from pg_timezone_names where name = v_z) then
    return json_build_object('ok', false, 'motivo', 'esa zona horaria no existe');
  end if;

  update public.companies
     set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('zona_horaria', v_z)
   where id = p_company;

  return json_build_object('ok', true, 'zona', v_z,
    'hora_alla', to_char(timezone(v_z, now()), 'HH24:MI'));
end;
$fn$;

grant execute on function public.tf_zona_guardar(uuid, text) to authenticated;
revoke execute on function public.tf_zona_guardar(uuid, text) from public, anon;


-- ── Las zonas que se pueden elegir ──────────────────────────────────────────
-- Para el selector del alta. Se sacan de Postgres, no de una lista escrita a
-- mano: una lista a mano es la que no tiene la ciudad del cliente nuevo.
create or replace function public.tf_zonas_horarias()
returns table (zona text, utc text)
language sql
stable
as $fn$
  select name, 'UTC' || to_char(utc_offset, 'FMHH24:MI')
  from pg_timezone_names
  where name like 'America/%' or name like 'Europe/%'
     or name like 'Africa/%'  or name like 'Asia/%'
     or name like 'Atlantic/%' or name like 'Pacific/%'
  order by name;
$fn$;

grant execute on function public.tf_zonas_horarias() to authenticated;
revoke execute on function public.tf_zonas_horarias() from public, anon;
