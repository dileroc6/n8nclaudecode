-- ============================================================================
-- ToqueFlow — Lo que el agente necesita EN CALIENTE, en una sola consulta
-- ----------------------------------------------------------------------------
-- Llega un WhatsApp. n8n tiene que averiguar, antes de poder pensar siquiera:
--
--   ¿de qué empresa es este número?   ¿está activo el agente?
--   ¿cómo habla?                      ¿qué sabe?
--   ¿quién es el que escribe?         ¿qué se dijeron antes?
--   ¿ya lo atiende un humano?
--
-- Son siete preguntas. Resolverlas con siete nodos de Postgres en n8n es lento,
-- frágil y —lo peor— cada nodo es un sitio más donde olvidar el filtro por
-- empresa. UNA sola función que devuelve todo cierra esa puerta: el aislamiento
-- por `company_id` se decide aquí adentro, una vez, y no en el workflow.
--
-- Requisitos: correr PRIMERO schema-agente.sql y schema-agente-uso.sql.
-- Idempotente.
-- ============================================================================


-- ── 1. Qué línea de WhatsApp es de quién ─────────────────────────────────────
-- Evolution manda el nombre de la instancia en cada webhook y es lo ÚNICO que
-- identifica al remitente. Sin este mapeo, el agente no sabe de quién es el
-- mensaje que acaba de llegar.
--
-- `unique` no es decorativo: dos empresas con la misma instancia significaría
-- responderle a un cliente con el conocimiento —y los precios— de otro. Que la
-- base lo impida es más barato que descubrirlo en producción.
alter table public.agent_config
  add column if not exists whatsapp_instance text;

create unique index if not exists agent_config_instance_idx
  on public.agent_config (whatsapp_instance)
  where whatsapp_instance is not null;

comment on column public.agent_config.whatsapp_instance is
  'Nombre de la instancia en Evolution. Es la llave que traduce "llegó un WhatsApp" a "es de esta empresa".';


-- ── 2. La foto completa del inquilino, sin el teléfono de por medio ──────────
-- Sirve para la consola de administración y para depurar: qué agentes hay, si
-- están activos y con cuánto conocimiento cargado.
create or replace view public.agent_runtime as
select
  c.company_id,
  co.name  as empresa,
  co.slug  as company_slug,
  c.activo,
  c.whatsapp_instance,
  c.identidad,
  c.captura,
  c.enrutamiento,
  c.limites,
  c.agenda,
  c.recordatorios,
  coalesce(k.texto, '')       as conocimiento,
  coalesce(k.bytes_total, 0)  as conocimiento_bytes,
  coalesce(k.fuentes, 0)      as conocimiento_fuentes,
  coalesce(k.estado, 'vacio') as conocimiento_estado,
  k.actualizado_at            as conocimiento_at
from public.agent_config c
join public.companies co             on co.id = c.company_id
left join public.agent_knowledge_prompt k on k.company_id = c.company_id;


-- ── 3. La función que corre el agente ────────────────────────────────────────
-- Un solo viaje a la base. Devuelve `null` si la instancia no existe o el
-- agente está apagado: para n8n, "no hay nada que hacer aquí" es una respuesta
-- perfectamente válida y evita que un mensaje a una línea desactivada dispare
-- una llamada al modelo que nadie pidió ni va a pagar.
--
-- Sobre la forma de la respuesta: viene partida en `config` (estable) e
-- `historial` (cambia en cada mensaje) a propósito. Esa división es la que hace
-- posible el caché de prompt: el bloque estable se manda idéntico cada vez y
-- Anthropic lo cobra a una décima parte. Mezclarlos costaría ~4x más. Ver
-- ToqueFlow/estrategia/producto-estandar.md § La economía por mensaje.
create or replace function public.tf_agente_contexto(
  p_instance text,
  p_telefono text
)
returns json
language plpgsql
stable
as $fn$
declare
  v_rt      public.agent_runtime%rowtype;
  v_contact public.contacts%rowtype;
begin
  select * into v_rt
  from public.agent_runtime
  where whatsapp_instance = p_instance
    and activo;

  if not found then
    return null;
  end if;

  -- El contacto puede no existir todavía: primer mensaje de alguien nuevo.
  -- No se crea aquí — esta función es `stable` y no escribe. Lo crea el
  -- workflow después de responder, junto con el registro del mensaje.
  select * into v_contact
  from public.contacts
  where company_id = v_rt.company_id
    and phone = p_telefono;

  return json_build_object(
    'company_id',   v_rt.company_id,
    'empresa',      v_rt.empresa,
    'company_slug', v_rt.company_slug,

    -- Todo lo que va en el prefijo cacheable del prompt.
    'config', json_build_object(
      'identidad',     v_rt.identidad,
      'captura',       v_rt.captura,
      'enrutamiento',  v_rt.enrutamiento,
      'limites',       v_rt.limites,
      'agenda',        v_rt.agenda,
      'conocimiento',  v_rt.conocimiento,
      'conocimiento_at', v_rt.conocimiento_at
    ),

    'contacto', case when v_contact.id is null then null else json_build_object(
      'id',         v_contact.id,
      'nombre',     v_contact.full_name,
      'status',     v_contact.status,
      'lead_stage', v_contact.lead_stage,
      'metadata',   v_contact.metadata
    ) end,

    -- Si un humano se metió en la conversación, el agente se calla. La bandera
    -- vive en contacts.metadata para no agregar una tabla por un booleano.
    'asignado_humano', coalesce((v_contact.metadata->>'asignado_humano')::boolean, false),

    -- Los últimos 10 mensajes, en orden cronológico. Diez y no más: la memoria
    -- larga la da el conocimiento, no el historial, y cada mensaje extra se
    -- paga en cada llamada.
    'historial', coalesce((
      select json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at)
      from (
        select direction, body, created_at
        from public.message_log
        where company_id = v_rt.company_id
          and contact_id = v_contact.id
          and body is not null
        order by created_at desc
        limit 10
      ) h
    ), '[]'::json)
  );
end;
$fn$;

comment on function public.tf_agente_contexto(text, text) is
  'Todo lo que el agente necesita para responder un WhatsApp, en un solo viaje. Devuelve null si la instancia no existe o el agente está apagado.';


-- ── 4. Permisos ──────────────────────────────────────────────────────────────
-- El worker de n8n solo LEE. La función es la puerta preferida aunque el rol
-- ya tenga select sobre agent_config: devuelve exactamente los campos que el
-- agente necesita, así que el día que esa tabla guarde algo que el worker no
-- deba ver, basta con quitarle el select a la tabla y nada más se rompe.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text) to n8n_worker;
    grant select  on public.agent_runtime to n8n_worker;
  end if;
end $$;

-- La vista hereda RLS de las tablas de abajo para los usuarios del portal; la
-- función es `stable` y se ejecuta con los permisos de quien llama, así que un
-- cliente autenticado no puede usarla para leer otra empresa: no tiene grant.
revoke all on function public.tf_agente_contexto(text, text) from public, anon, authenticated;


-- ── Cómo lo usa n8n ──────────────────────────────────────────────────────────
--
--   select public.tf_agente_contexto($1, $2) as ctx;
--     $1 = body.instance   (Evolution)
--     $2 = teléfono del remitente, solo dígitos
--
--   Si ctx viene null → no responder. Ni loguear como error: es el caso normal
--   de una línea que todavía no se activó.
