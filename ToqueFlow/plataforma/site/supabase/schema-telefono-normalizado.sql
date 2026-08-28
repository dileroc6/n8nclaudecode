-- ============================================================================
-- ToqueFlow — El teléfono se compara siempre igual
-- ----------------------------------------------------------------------------
-- Encontrado el 28-ago-2026 probando la primera herramienta contra datos
-- REALES, no inventados.
--
-- Los 46 contactos de Bejauha tienen el teléfono guardado como `+573185478900`.
-- WhatsApp entrega `573185478900`, sin el más. Todas las búsquedas del agente
-- comparaban `phone = p_telefono`, así que:
--
--   · el agente no habría reconocido a NINGUNO de sus 46 clientes reales
--   · les habría creado un contacto DUPLICADO a cada uno, sin el «+»
--   · cada cliente que vuelve habría parecido nuevo, sin nombre ni historial
--
-- No lo vio ninguna prueba porque todas usaban teléfonos inventados, escritos
-- sin «+». Es el ejemplo perfecto de por qué probar con datos de verdad no es
-- lo mismo que probar.
--
-- El arreglo compara por dígitos y no toca lo guardado. Cambiar 46 filas
-- afectaría a las campañas y a la pantalla de contactos; normalizar los datos
-- queda como tarea aparte, con su prueba.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Una sola forma de comparar un teléfono ────────────────────────────────
-- Solo dígitos. Sirve igual para `+57 318 547 8900`, `573185478900` y
-- `(318) 547-8900` — aunque este último pierde el indicativo, que es un
-- problema distinto y peor, y por eso hay una tarea para normalizar de verdad.
create or replace function public.tf_telefono(p text)
returns text language sql immutable as $fn$
  select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '');
$fn$;

comment on function public.tf_telefono(text) is
  'Un telefono comparable: solo digitos. Los contactos viejos se guardaron con + y WhatsApp los entrega sin el.';

-- Buscar por dígitos sin esto sería un recorrido completo de la tabla en cada
-- mensaje que llega.
create index if not exists contacts_company_telnorm_idx
  on public.contacts (company_id, public.tf_telefono(phone));


-- ── 2. El agente encuentra a quien ya existe ─────────────────────────────────
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
  v_tel     text := public.tf_telefono(p_telefono);
begin
  select * into v_rt from public.agent_runtime
  where whatsapp_instance = p_instance and activo;
  if not found then return null; end if;

  select * into v_cfg from public.agent_config where company_id = v_rt.company_id;

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
  where c.clave = any(coalesce(v_cfg.herramientas, '{}'))
    and c.tipo = 'herramienta' and c.activo and c.workflow is not null;

  return json_build_object(
    'company_id', v_rt.company_id, 'empresa', v_rt.empresa, 'company_slug', v_rt.company_slug,
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


-- ── 3. Al guardar, actualiza al que ya está en vez de duplicarlo ─────────────
create or replace function public.tf_agente_registrar(
  p_instance     text,
  p_telefono     text,
  p_entrante     text,
  p_respuesta    text,
  p_datos        jsonb  default '{}',
  p_wa_id        text   default null,
  p_model        text   default null,
  p_input        int    default 0,
  p_output       int    default 0,
  p_cache_read   int    default 0,
  p_cache_write  int    default 0,
  p_test         boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_contact uuid;
  v_precio  jsonb;
  v_costo   numeric;
  v_tel     text := public.tf_telefono(p_telefono);
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_instance;

  if v_company is null then
    raise exception 'Instancia de WhatsApp desconocida: %', p_instance
      using errcode = 'foreign_key_violation';
  end if;

  -- Primero se BUSCA por dígitos. El `on conflict (company_id, phone)` de antes
  -- no servía: la fila vieja dice «+573185478900» y la nueva llegaba como
  -- «573185478900», así que el conflicto nunca se daba y se creaba un contacto
  -- duplicado por cada cliente real que escribiera.
  select id into v_contact
  from public.contacts
  where company_id = v_company and public.tf_telefono(phone) = v_tel;

  if v_contact is null then
    insert into public.contacts (company_id, phone, full_name, source, last_contact_at, metadata)
    values (v_company, v_tel, nullif(p_datos->>'nombre', ''), 'whatsapp', now(),
            coalesce(p_datos, '{}'::jsonb) - 'nombre')
    returning id into v_contact;
  else
    -- `coalesce` en el nombre: un cliente que lleva meses siendo «María» no debe
    -- quedarse sin nombre porque en el último mensaje solo dijo «gracias».
    -- Y NO se toca `phone`: se respeta como lo guardó el negocio.
    update public.contacts set
      full_name       = coalesce(nullif(p_datos->>'nombre', ''), full_name),
      last_contact_at = now(),
      metadata        = metadata || (coalesce(p_datos, '{}'::jsonb) - 'nombre')
    where id = v_contact;
  end if;

  if p_test then
    insert into public.test_messages (company_id, contact_id, telefono, direction, author, body, flow)
    values (v_company, v_contact, v_tel, 'in',  'cliente', p_entrante,  'agente'),
           (v_company, v_contact, v_tel, 'out', 'bot',     p_respuesta, 'agente');
  else
    insert into public.message_log (company_id, contact_id, direction, channel, body, wa_message_id)
    values (v_company, v_contact, 'in',  'whatsapp', p_entrante,  p_wa_id),
           (v_company, v_contact, 'out', 'whatsapp', p_respuesta, null);
  end if;

  if p_model is not null then
    v_precio := public.tf_precio_modelo(p_model);
    v_costo  := (p_input * (v_precio->>'input')::numeric
               + p_output * (v_precio->>'output')::numeric
               + p_cache_read * (v_precio->>'cache_read')::numeric
               + p_cache_write * (v_precio->>'cache_write')::numeric) / 1000000.0;

    insert into public.ai_usage (company_id, tool, model, input_tokens, output_tokens, cost_usd, success)
    values (v_company,
            case when p_test then 'agente-atencion-prueba' else 'agente-atencion' end,
            p_model, p_input + p_cache_read + p_cache_write, p_output, v_costo, true);
  end if;

  return json_build_object('company_id', v_company, 'contact_id', v_contact, 'costo_usd', coalesce(v_costo, 0));
end;
$fn$;


-- ── 4. La herramienta también ────────────────────────────────────────────────
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
  from public.agent_config where whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_telefono);

  if not found then
    -- Decir que no se encontró a la persona es MEJOR que devolver cero: cero
    -- suena a «se le acabaron» y es una respuesta falsa.
    return json_build_object('ok', false, 'motivo', 'no encontre a esta persona en la base');
  end if;

  return json_build_object(
    'ok', true, 'nombre', v_c.full_name,
    'clases_restantes', v_c.clases_restantes,
    'fecha_renovacion', v_c.fecha_renovacion,
    'estado', v_c.status
  );
end;
$fn$;


-- ── 5. Permisos ──────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_telefono(text) to n8n_worker;
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
    grant execute on function public.tf_agente_registrar(
      text, text, text, text, jsonb, text, text, int, int, int, int, boolean) to n8n_worker;
  end if;
end $$;
