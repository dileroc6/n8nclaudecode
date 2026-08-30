-- ============================================================================
-- ToqueFlow — Lo que el agente sabe al empezar cada mensaje
-- ----------------------------------------------------------------------------
-- `tf_agente_contexto` es la consulta que responde, de una sola vez, todo lo que el
-- agente necesita saber: de quién es la instancia, cómo habla, qué sabe del
-- negocio, qué herramientas tiene, quién le está escribiendo, qué le dijeron
-- antes y qué día es hoy. El inquilino se decide DENTRO de la base, a partir
-- de la instancia — nunca viene del payload.
--
-- ⚠ ESTE ES EL ÚNICO ARCHIVO QUE LA DEFINE.
--
-- Llegó a estar definida en nueve archivos a la vez, cada uno con la versión
-- de su momento y todos idempotentes: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior sin que nadie se enterara. Es el mismo error
-- que borró «escalar a una persona» del producto y que antes revivió
-- `registrar-cliente`. Si hay que cambiarla, se cambia AQUÍ.
--
-- Idempotente.
-- ============================================================================

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
  v_saldo   public.contact_saldo%rowtype;
  v_hist    json;
  v_tools   json;
  v_campos  json;
  v_ficha   json;
  v_tiene   boolean;
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
           'workflow', c.workflow,
           -- Qué datos necesita. El workflow se lo pasa a Claude tal cual.
           'entrada', coalesce(c.entrada, '{}'::jsonb)
         ) order by c.orden), '[]'::json)
    into v_tools
  from public.catalogo c
  -- Se expanden los paquetes: `herramientas` puede traer la clave de una
  -- pieza suelta o la de un paquete, y el agente solo entiende piezas.
  where c.clave = any(public.tf_piezas_del_agente(v_rt.herramientas))
    and c.tipo = 'herramienta' and c.activo and c.workflow is not null;

  select coalesce(json_agg(json_build_object(
           'clave', cc.clave, 'etiqueta', cc.etiqueta,
           'obligatorio', cc.obligatorio,
           'opciones', case when cc.tipo = 'opciones' then to_jsonb(cc.opciones) else '[]'::jsonb end
         ) order by cc.orden), '[]'::json)
    into v_campos
  from public.contact_campos cc
  where cc.company_id = v_rt.company_id and cc.capturar;

  if v_contact.id is not null then
    select coalesce(json_agg(json_build_object(
             'etiqueta', cc.etiqueta, 'valor', v_contact.metadata->>cc.clave
           ) order by cc.orden), '[]'::json)
      into v_ficha
    from public.contact_campos cc
    where cc.company_id = v_rt.company_id
      and nullif(v_contact.metadata->>cc.clave, '') is not null;

    select * into v_saldo from public.contact_saldo where contact_id = v_contact.id;
    v_tiene := found;
  end if;

  return json_build_object(
    'company_id', v_rt.company_id, 'agent_id', v_rt.agent_id,
    'empresa', v_rt.empresa, 'agente', v_rt.agente, 'company_slug', v_rt.company_slug,
    -- La fecha de hoy, en la hora del negocio. Sin esto el modelo calcula
    -- «el miércoles» contra una fecha inventada, y agenda en el año pasado.
    'hoy', to_char(timezone(coalesce((select metadata->>'zona_horaria' from public.companies where id = v_rt.company_id), 'America/Bogota'), now()),
                   'YYYY-MM-DD"T"HH24:MI:SS'),
    'config', json_build_object(
      'identidad', v_rt.identidad,
      'captura', json_build_object('campos', v_campos),
      'enrutamiento', v_rt.enrutamiento, 'limites', v_rt.limites, 'agenda', v_rt.agenda,
      'conocimiento', v_rt.conocimiento, 'conocimiento_at', v_rt.conocimiento_at,
      'herramientas', v_tools
    ),
    'contacto', case when v_contact.id is null then null else json_build_object(
      'id', v_contact.id, 'nombre', v_contact.full_name,
      'status', v_contact.status, 'lead_stage', v_contact.lead_stage,
      'metadata', v_contact.metadata,
      'ficha', coalesce(v_ficha, '[]'::json),
      'saldo', case when not coalesce(v_tiene, false) then null else json_build_object(
        'cantidad', v_saldo.unidades,
        'unidad', coalesce(v_rt.vocabulario->>'unidad', 'unidad'),
        'unidad_plural', coalesce(v_rt.vocabulario->>'unidad_plural', 'unidades'),
        'vence', v_saldo.vence,
        'que_compro', v_saldo.que_compro
      ) end
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
