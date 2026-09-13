-- ============================================================================
-- Que ninguna vista se salte el RLS, y que se revise sola
-- ----------------------------------------------------------------------------
-- POR QUÉ EXISTE: una vista sin `security_invoker` corre con los permisos de
-- QUIEN LA CREÓ, no de quien la consulta. O sea que atraviesa el RLS y le
-- entrega a cualquiera los datos de todos los clientes. Ya pasó: dos vistas
-- estaban así y se descubrió probando desde afuera con la llave pública.
--
-- La regla «toda vista nueva nace con security_invoker» no se sostiene con
-- acordarse. Esto la vuelve una consulta que se puede correr desde cualquier
-- parte —el cron semanal, la consola, una prueba— y que dice exactamente qué
-- vista se saltó la regla.
--
-- DOS TRAMPAS, Y LAS DOS ME MORDIERON AL ESCRIBIR ESTO:
--
--   1. Una vista sin `reloptions` NO es lo mismo que una con
--      `security_invoker=false`. Las dos se saltan el RLS, pero solo la segunda
--      lo dice. Así que no se busca «false»: se busca la AUSENCIA de encendido.
--
--   2. **Postgres lo guarda como `security_invoker=on`, no `=true`.** La
--      primera versión de esto buscaba «true» y marcó las 12 vistas como
--      agujeros cuando las 12 estaban bien. Un chequeo que grita lobo se acaba
--      ignorando, y el día que grite de verdad nadie va a mirar. Por eso aquí
--      se aceptan todas las formas en que Postgres escribe «sí».
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_vistas_sin_invoker()
returns table (vista text, motivo text)
language sql
stable
security definer
set search_path = public
as $fn$
  select c.relname::text,
         case when c.reloptions is null then 'sin reloptions: corre con los permisos de quien la creo'
              else 'security_invoker no esta en true' end
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
    -- Se busca la ausencia de «encendido», no la presencia de «apagado»: una
    -- vista sin opciones se salta el RLS igual y no lo dice en ninguna parte.
    --
    -- Y se aceptan las cuatro formas en que Postgres escribe «sí». El guardado
    -- de verdad es `on`; buscar solo `true` marcaba como agujero cada vista
    -- correcta del proyecto.
    and not coalesce(
      array_to_string(c.reloptions, ',') ~* 'security_invoker=(on|true|yes|1)', false)
  order by c.relname;
$fn$;

comment on function public.tf_vistas_sin_invoker() is
  'Las vistas que se saltan el RLS. Una vista sin security_invoker corre con los permisos de quien la creo y le entrega a cualquiera los datos de todos los clientes.';


-- ── Y las tablas sin RLS, que es el mismo agujero por otra puerta ───────────
create or replace function public.tf_tablas_sin_rls()
returns table (tabla text, filas_aprox bigint)
language sql
stable
security definer
set search_path = public
as $fn$
  select c.relname::text, c.reltuples::bigint
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and not c.relrowsecurity
    -- Las de apoyo no llevan datos de nadie: son catalogo compartido.
    and c.relname not in ('catalogo', 'schema_migrations')
  order by c.reltuples desc;
$fn$;

comment on function public.tf_tablas_sin_rls() is
  'Tablas sin RLS encendido. Sin RLS, cualquiera con la llave publica lee todo lo de todos los clientes.';


-- ── El veredicto de una sola consulta, para el cron ─────────────────────────
create or replace function public.tf_aislamiento()
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_vistas json;
  v_tablas json;
  v_n int;
begin
  select coalesce(json_agg(json_build_object('vista', vista, 'motivo', motivo)), '[]'::json)
    into v_vistas from public.tf_vistas_sin_invoker();
  select coalesce(json_agg(json_build_object('tabla', tabla, 'filas', filas_aprox)), '[]'::json)
    into v_tablas from public.tf_tablas_sin_rls();

  v_n := json_array_length(v_vistas) + json_array_length(v_tablas);

  return json_build_object(
    'ok', v_n = 0,
    'cuantos', v_n,
    'vistas_sin_invoker', v_vistas,
    'tablas_sin_rls', v_tablas,
    'que_decir', case when v_n = 0
      then 'Todas las vistas respetan al que pregunta y todas las tablas tienen RLS.'
      else 'HAY ' || v_n || ' SITIOS POR DONDE SE PUEDEN VER DATOS DE OTRO CLIENTE. Revisar hoy.' end
  );
end;
$fn$;

comment on function public.tf_aislamiento() is
  'Un solo veredicto: que vistas se saltan el RLS y que tablas no lo tienen. Pensado para que lo llame el cron semanal — una auditoria que se corre "cuando hay tiempo" no es una auditoria.';


grant execute on function public.tf_aislamiento() to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_aislamiento() to n8n_worker;
  end if;
end
$$;
