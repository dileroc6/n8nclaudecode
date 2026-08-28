-- ============================================================================
-- ToqueFlow — El mecanismo del lego: herramientas conectables
-- ----------------------------------------------------------------------------
-- Hasta ahora el agente tenía UNA herramienta: responder. Todo lo demás que un
-- cliente pudiera necesitar —consultar su saldo, mirar un pedido, verificar un
-- pago— habría terminado como un `if` dentro del flujo compartido. Rápido el
-- primer día, mortal el sexto: cada rama multiplica los caminos y a partir de
-- ahí ningún cambio es seguro porque cualquiera puede romper a alguien.
--
-- Con esto, agregarle una capacidad a un cliente es encender una fila.
--
-- CÓMO FUNCIONA, y por qué así:
--
--   agent_config.herramientas    las claves del catálogo que ese cliente tiene
--                                encendidas
--   catalogo.workflow            la ruta del webhook que la ejecuta
--
-- Cada herramienta es un workflow APARTE con su propio webhook. El agente la
-- llama por HTTP con la misma firma que protege su propia entrada. No se usan
-- sub-workflows de n8n a propósito: el nombre del workflow tendría que
-- resolverse en tiempo de ejecución, y n8n no lo hace bien. Un webhook por
-- herramienta es dinámico por naturaleza y además hace que cada una se pueda
-- probar sola, con curl.
--
-- LA REGLA QUE NO SE ROMPE: una herramienta es POR CAPACIDAD, no por cliente.
-- `ver_disponibilidad` es una sola y la usan todos los que tengan agenda.
-- `consultar_saldo` también es una sola — pasa que hoy solo Bejauha la usa, no
-- porque sea «suya» sino porque nadie más vende clases por paquete.
--
-- Requisitos: schema-catalogo-detalle.sql. Idempotente.
-- ============================================================================


-- ── 1. Qué herramientas tiene encendidas cada cliente ────────────────────────
alter table public.agent_config
  add column if not exists herramientas text[] not null default '{}';

comment on column public.agent_config.herramientas is
  'Claves del catálogo que este agente puede usar. Vacío = solo responde con su conocimiento.';


-- ── 2. El contexto ahora entrega también las herramientas ────────────────────
-- Se resuelven contra el catálogo aquí y no en n8n: así el workflow recibe la
-- lista lista para armar el prompt, con su descripción y su ruta, y no tiene
-- que saber nada del catálogo.
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
  v_cfg     public.agent_config%rowtype;
  v_contact public.contacts%rowtype;
  v_hist    json;
  v_tools   json;
begin
  select * into v_rt
  from public.agent_runtime
  where whatsapp_instance = p_instance and activo;

  if not found then
    return null;
  end if;

  select * into v_cfg from public.agent_config where company_id = v_rt.company_id;

  select * into v_contact
  from public.contacts
  where company_id = v_rt.company_id and phone = p_telefono;

  -- ── El historial, de la tabla que corresponda ──────────────────────────────
  if p_test then
    select coalesce(json_agg(json_build_object('dir', h.direction, 'texto', h.body) order by h.created_at), '[]'::json)
      into v_hist
    from (select direction, body, created_at from public.test_messages
           where company_id = v_rt.company_id and telefono = p_telefono
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

  -- ── Las herramientas encendidas, ya resueltas contra el catálogo ──────────
  -- Solo las que tienen workflow: una pieza sin ruta no se puede ejecutar, y
  -- ofrecérsela al modelo sería prometerle algo que no existe.
  select coalesce(json_agg(json_build_object(
           'clave',       c.clave,
           'nombre',      c.nombre,
           'descripcion', coalesce(c.beneficio, c.descripcion),
           'workflow',    c.workflow
         ) order by c.orden), '[]'::json)
    into v_tools
  from public.catalogo c
  where c.clave = any(coalesce(v_cfg.herramientas, '{}'))
    and c.tipo = 'herramienta'
    and c.activo
    and c.workflow is not null;

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
      'conocimiento_at', v_rt.conocimiento_at,
      'herramientas',    v_tools
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

revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;


-- ── 3. La primera herramienta de verdad: consultar saldo ─────────────────────
-- Lee de `contacts`, que es donde la plataforma ya guarda las clases restantes
-- de los clientes de Bejauha. El company_id se deriva de la instancia, igual
-- que en todo lo demás: la herramienta no acepta que le digan de qué empresa es.
create or replace function public.tf_tool_consultar_saldo(
  p_instance text,
  p_telefono text
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_c       public.contacts%rowtype;
begin
  select company_id into v_company
  from public.agent_config
  where whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c
  from public.contacts
  where company_id = v_company and phone = p_telefono;

  if not found then
    -- Que la herramienta diga que no encontró a la persona es MEJOR que
    -- devolver cero: cero suena a «se le acabaron» y es una respuesta falsa.
    return json_build_object('ok', false, 'motivo', 'no encontre a esta persona en la base');
  end if;

  return json_build_object(
    'ok', true,
    'nombre', v_c.full_name,
    'clases_restantes', v_c.clases_restantes,
    'fecha_renovacion', v_c.fecha_renovacion,
    'estado', v_c.status
  );
end;
$fn$;

revoke all on function public.tf_tool_consultar_saldo(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
  end if;
end $$;


-- ── 4. La ruta de cada herramienta ───────────────────────────────────────────
-- El valor de `workflow` es la ruta del webhook, no un nombre bonito.
update public.catalogo set workflow = 'tool-consultar-saldo',
  descripcion = 'Cuántas clases o cupos le quedan a quien escribe. Lee de la ficha del contacto en la plataforma.',
  beneficio   = 'Consulta cuántas clases te quedan y cuándo se te renuevan.',
  estado = 'funcionando', liberado = true
where clave = 'consultar-saldo';
