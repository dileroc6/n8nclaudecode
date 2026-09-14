-- ============================================================================
-- ToqueFlow — Todas las herramientas reciben UN jsonb
-- ----------------------------------------------------------------------------
-- `ver-disponibilidad` era la única que recibía tres parámetros sueltos
-- (instancia, servicio, días) en vez de un solo objeto. Funcionaba, pero la
-- dejaba atada a la forma de su nodo de n8n: el día que se quitaron las listas
-- blancas de los nodos —para que el catálogo pueda crecer sin tocar n8n— fue
-- la única que se rompió.
--
-- Una forma para todas. Así el nodo `Extraer` es idéntico en las trece y no
-- hay que recordar cuál es distinta.
--
-- La versión de tres parámetros se conserva: la llaman las pruebas y el portal.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_tool_ver_disponibilidad(p_payload jsonb)
returns json
language sql
stable
security definer
set search_path = public
as $fn$
  select public.tf_tool_ver_disponibilidad(
    p_payload->>'instance',
    nullif(btrim(coalesce(p_payload->>'servicio', '')), ''),
    -- Dos semanas si no dice. Mirar más lejos no cuesta nada y deja ofrecer
    -- alternativas cuando el día que pidió está lleno.
    coalesce(nullif(btrim(coalesce(p_payload->>'dias', '')), '')::int, 14)
  );
$fn$;

comment on function public.tf_tool_ver_disponibilidad(jsonb) is
  'La misma forma que las demas herramientas: un solo jsonb. Existe para que el nodo Extraer de n8n sea identico en todas y el catalogo pueda crecer sin tocar el workflow.';

revoke all on function public.tf_tool_ver_disponibilidad(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_ver_disponibilidad(jsonb) to n8n_worker;
  end if;
end $$;
