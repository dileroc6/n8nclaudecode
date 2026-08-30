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
