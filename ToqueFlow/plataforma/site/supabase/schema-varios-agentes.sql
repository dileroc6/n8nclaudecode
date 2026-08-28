-- ============================================================================
-- ToqueFlow — Una empresa puede tener varios agentes
-- ----------------------------------------------------------------------------
-- Hasta ahora `agent_config` tenía `company_id` como llave primaria: una
-- empresa = un agente. Y eso ya se queda corto en un cliente que existe hoy:
-- FerreteríaYa atiende Bogotá y Medellín con números de WhatsApp distintos, y
-- cada uno necesita su propio agente. Cualquier negocio con dos líneas va a
-- querer lo mismo.
--
-- El cambio es pequeño porque el diseño ya lo permitía sin saberlo: TODO se
-- resuelve por `whatsapp_instance`, que siempre fue única. El agente nunca
-- preguntó «¿cuál es el agente de esta empresa?», sino «¿de quién es esta
-- instancia?» — que es la pregunta correcta y sigue teniendo una sola respuesta.
--
-- Se hace ahora, con UNA fila en la tabla, y no cuando haya veinte.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Cada agente tiene su propia identidad ─────────────────────────────────
alter table public.agent_config
  add column if not exists id uuid not null default gen_random_uuid();

-- Un nombre para distinguirlos en la consola. Sin esto, dos agentes de la
-- misma empresa se ven idénticos y nadie sabe cuál está tocando.
alter table public.agent_config
  add column if not exists nombre text;

update public.agent_config c
   set nombre = coalesce(nombre, co.name)
  from public.companies co
 where co.id = c.company_id and c.nombre is null;

do $$
begin
  -- La llave primaria pasa a ser el id. `company_id` sigue siendo obligatorio y
  -- con su índice: es por donde se listan los agentes de un cliente.
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.agent_config'::regclass
      and conname = 'agent_config_pkey'
      and pg_get_constraintdef(oid) = 'PRIMARY KEY (company_id)'
  ) then
    alter table public.agent_config drop constraint agent_config_pkey;
    alter table public.agent_config add constraint agent_config_pkey primary key (id);
  end if;
end $$;

create index if not exists agent_config_company_idx on public.agent_config (company_id);

-- La instancia sigue siendo única en toda la plataforma, y ahora se entiende
-- mejor por qué: es lo que identifica a UN agente, no a una empresa.
comment on column public.agent_config.whatsapp_instance is
  'Nombre de la instancia en Evolution. Identifica a ESTE agente. Es la llave que traduce "llego un WhatsApp" a "es de este agente, de esta empresa".';


-- ── 2. El conocimiento puede ser de todos o de uno ───────────────────────────
-- Dos agentes de la misma empresa comparten casi todo —los precios son los
-- mismos— y difieren en poco: la dirección, los horarios de esa sede. Obligar a
-- duplicar el documento entero sería garantizar que un día uno quede desfasado.
--
-- `agent_id` nulo = lo sabe TODA la empresa. Con agente = solo ese.
alter table public.agent_knowledge
  add column if not exists agent_id uuid references public.agent_config (id) on delete cascade;

comment on column public.agent_knowledge.agent_id is
  'Null = lo sabe toda la empresa. Con valor = solo ese agente. Sirve para lo que cambia entre sedes sin duplicar el documento entero.';

create index if not exists agent_knowledge_agent_idx on public.agent_knowledge (agent_id) where agent_id is not null;


-- ── 3. La vista, ahora por agente ────────────────────────────────────────────
drop view if exists public.agent_runtime;
create view public.agent_runtime
with (security_invoker = on) as
select
  c.id         as agent_id,
  c.company_id,
  co.name      as empresa,
  co.slug      as company_slug,
  coalesce(c.nombre, co.name) as agente,
  c.activo,
  c.whatsapp_instance,
  c.identidad, c.captura, c.enrutamiento, c.limites, c.agenda, c.recordatorios,
  c.herramientas,
  -- El conocimiento de este agente: lo de la empresa más lo suyo propio.
  coalesce(k.texto, '')       as conocimiento,
  coalesce(k.bytes_total, 0)  as conocimiento_bytes,
  coalesce(k.fuentes, 0)      as conocimiento_fuentes,
  case
    when coalesce(k.bytes_total, 0) = 0 then 'vacio'
    when k.bytes_total > public.tf_limite_conocimiento_bytes() then 'excedido'
    when k.bytes_total >= public.tf_limite_conocimiento_bytes() * 0.75 then 'cerca'
    else 'ok'
  end as conocimiento_estado,
  k.actualizado_at as conocimiento_at
from public.agent_config c
join public.companies co on co.id = c.company_id
left join lateral (
  select string_agg('## ' || titulo || E'\n' || contenido, E'\n\n' order by orden, created_at) as texto,
         sum(bytes)::int     as bytes_total,
         count(*)::int       as fuentes,
         max(actualizado_at) as actualizado_at
  from public.agent_knowledge ak
  where ak.company_id = c.company_id
    and ak.activo
    and (ak.agent_id is null or ak.agent_id = c.id)
) k on true;

grant select on public.agent_runtime to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select on public.agent_runtime to n8n_worker;
  end if;
end $$;


-- ── 4. El contexto, resuelto por instancia como siempre ──────────────────────
create or replace function public.tf_agente_contexto(
  p_instance text,
  p_telefono text,
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
  v_tools   json;
  v_tel     text := public.tf_telefono(p_telefono);
begin
  select * into v_rt from public.agent_runtime
  where whatsapp_instance = p_instance and activo;
  if not found then return null; end if;

  select * into v_contact from public.contacts
  where company_id = v_rt.company_id
    and public.tf_telefono(phone) = v_tel;

  if p_test then
    select coalesce(json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at), '[]'::json)
      into v_hist
    from (select direction, body, created_at from public.test_messages
           where company_id = v_rt.company_id
             and public.tf_telefono(telefono) = v_tel
             and flow = 'agente' and body is not null
           order by created_at desc limit 10) h;
  else
    select coalesce(json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at), '[]'::json)
      into v_hist
    from (select direction, body, created_at from public.message_log
           where company_id = v_rt.company_id and contact_id = v_contact.id
             and body is not null
           order by created_at desc limit 10) h;
  end if;

  select coalesce(json_agg(json_build_object(
           'clave', c.clave, 'nombre', c.nombre,
           'descripcion', coalesce(c.beneficio, c.descripcion),
           'workflow', c.workflow
         ) order by c.orden), '[]'::json)
    into v_tools
  from public.catalogo c
  where c.clave = any(coalesce(v_rt.herramientas, '{}'))
    and c.tipo = 'herramienta' and c.activo and c.workflow is not null;

  return json_build_object(
    'company_id', v_rt.company_id, 'agent_id', v_rt.agent_id,
    'empresa', v_rt.empresa, 'agente', v_rt.agente, 'company_slug', v_rt.company_slug,
    'config', json_build_object(
      'identidad', v_rt.identidad, 'captura', v_rt.captura,
      'enrutamiento', v_rt.enrutamiento, 'limites', v_rt.limites, 'agenda', v_rt.agenda,
      'conocimiento', v_rt.conocimiento, 'conocimiento_at', v_rt.conocimiento_at,
      'herramientas', v_tools
    ),
    'contacto', case when v_contact.id is null then null else json_build_object(
      'id', v_contact.id, 'nombre', v_contact.full_name,
      'status', v_contact.status, 'lead_stage', v_contact.lead_stage,
      'metadata', v_contact.metadata
    ) end,
    'asignado_humano', coalesce((v_contact.metadata->>'asignado_humano')::boolean, false),
    'historial', v_hist
  );
end;
$fn$;

revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;
