-- ============================================================================
-- ToqueFlow — El sandbox también tiene memoria
-- ----------------------------------------------------------------------------
-- Encontrado el 28-ago-2026 midiendo por qué el agente saludaba en 6 de 6
-- mensajes. No era el prompt: era que EN MODO PRUEBA NO TENÍA HISTORIAL.
--
--   tf_agente_registrar  en modo prueba escribe en `test_messages`
--   tf_agente_contexto   leía el historial siempre de `message_log`
--
-- Esas dos tablas no se tocan. Resultado: en el sandbox cada mensaje era el
-- primero. El agente saludaba de nuevo, volvía a preguntar lo que la persona ya
-- había dicho, y se veía mucho peor de lo que en realidad es.
--
-- POR QUÉ IMPORTA MÁS DE LO QUE PARECE: el sandbox es donde el cliente prueba
-- su agente ANTES de encenderlo. Si ahí se ve con amnesia, el cliente concluye
-- que el producto es malo — o peor, se ajusta el prompt para arreglar un
-- problema que en producción no existía. Un sandbox que miente es peor que no
-- tener sandbox.
--
-- Y de paso deja al descubierto una prueba que pasaba por la razón equivocada:
-- el escenario «recuerda lo que ya se dijo» preguntaba «¿cómo me llamo?», y el
-- agente acertaba leyendo el nombre del CONTACTO, no del historial.
--
-- Requisitos: schema-agente-fuga-vistas.sql. Idempotente.
-- ============================================================================

create or replace function public.tf_agente_contexto(
  p_instance text,
  p_telefono text,
  -- Nuevo, con default para no romper a quien ya la llamaba con dos argumentos.
  p_test     boolean default false
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_rt      public.agent_runtime%rowtype;
  v_contact public.contacts%rowtype;
  v_hist    json;
begin
  select * into v_rt
  from public.agent_runtime
  where whatsapp_instance = p_instance
    and activo;

  if not found then
    return null;
  end if;

  select * into v_contact
  from public.contacts
  where company_id = v_rt.company_id
    and phone = p_telefono;

  -- ── El historial, de la tabla que corresponda ──────────────────────────────
  -- Diez mensajes y no más: la memoria larga la da el conocimiento, no el
  -- historial, y cada mensaje extra se paga en cada llamada.
  if p_test then
    -- En el sandbox la conversación vive en `test_messages`, y se filtra por
    -- teléfono porque ahí puede no haber contacto todavía.
    select coalesce(json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at), '[]'::json)
      into v_hist
    from (
      select direction, body, created_at
      from public.test_messages
      where company_id = v_rt.company_id
        and telefono   = p_telefono
        and flow       = 'agente'
        and body is not null
      order by created_at desc
      limit 10
    ) h;
  else
    select coalesce(json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at), '[]'::json)
      into v_hist
    from (
      select direction, body, created_at
      from public.message_log
      where company_id = v_rt.company_id
        and contact_id = v_contact.id
        and body is not null
      order by created_at desc
      limit 10
    ) h;
  end if;

  return json_build_object(
    'company_id',   v_rt.company_id,
    'empresa',      v_rt.empresa,
    'company_slug', v_rt.company_slug,
    'config', json_build_object(
      'identidad',       v_rt.identidad,
      'captura',         v_rt.captura,
      'enrutamiento',    v_rt.enrutamiento,
      'limites',         v_rt.limites,
      'agenda',          v_rt.agenda,
      'conocimiento',    v_rt.conocimiento,
      'conocimiento_at', v_rt.conocimiento_at
    ),
    'contacto', case when v_contact.id is null then null else json_build_object(
      'id',         v_contact.id,
      'nombre',     v_contact.full_name,
      'status',     v_contact.status,
      'lead_stage', v_contact.lead_stage,
      'metadata',   v_contact.metadata
    ) end,
    'asignado_humano', coalesce((v_contact.metadata->>'asignado_humano')::boolean, false),
    'historial', v_hist
  );
end;
$fn$;

comment on function public.tf_agente_contexto(text, text, boolean) is
  'Todo lo que el agente necesita para responder un WhatsApp, en un solo viaje. En modo prueba lee el historial de test_messages: si no, el sandbox se ve con amnesia y miente sobre cómo se comporta el agente de verdad.';

-- La versión de dos argumentos ya no se usa: el workflow siempre manda el
-- flag. Se elimina para que nadie la llame por error y vuelva a quedarse sin
-- historial en el sandbox sin enterarse.
drop function if exists public.tf_agente_contexto(text, text);

revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;
