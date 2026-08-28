-- ============================================================================
-- ToqueFlow — Lo que el agente captura aterriza donde se busca
-- ----------------------------------------------------------------------------
-- Cada cliente declara qué datos quiere que el agente averigüe. Eso ya
-- funcionaba: es una fila de `agent_config.captura`, no código.
--
-- Lo que faltaba: TODO lo capturado caía en `contacts.metadata`, que es una
-- bolsa. Un correo capturado quedaba enterrado ahí en vez de aparecer en la
-- columna de correo — y la pantalla de contactos, las campañas y cualquier
-- exportación lo ignoraban. El agente hacía bien su trabajo y el dato no
-- llegaba a donde sirve.
--
-- Ahora las claves conocidas van a su columna de verdad, y lo demás sigue en
-- metadata. Un cliente que quiera capturar «talla de camiseta» no necesita una
-- columna nueva; uno que capture el correo lo ve donde lo busca.
--
-- Idempotente.
-- ============================================================================


-- ── Qué clave va a qué columna ───────────────────────────────────────────────
-- Se aceptan varios nombres para lo mismo porque quien configura escribe lo
-- que le sale natural: uno pone `correo`, otro `email`. Obligarlos a acertar
-- con una palabra exacta sería trasladarles un problema nuestro.
create or replace function public.tf_captura_columna(p_clave text)
returns text language sql immutable as $fn$
  select case lower(trim(p_clave))
    when 'nombre'   then 'full_name'
    when 'name'     then 'full_name'
    when 'correo'   then 'email'
    when 'email'    then 'email'
    -- OJO: `interes` NO se mapea a `service_type`. Esa columna tiene valores
    -- fijos de Bejauha —karma, beja, uja, paquete— heredados del sistema viejo:
    -- es una columna de UN cliente en una tabla compartida, el mismo problema
    -- del «si es Bejauha entonces» pero metido en el esquema. Mientras eso no
    -- se resuelva, el interés va a metadata, donde no rompe nada.
    else null
  end;
$fn$;

comment on function public.tf_captura_columna(text) is
  'Traduce una clave de captura a la columna real de contacts, o null si va a metadata.';


-- ── El registro reparte lo capturado ─────────────────────────────────────────
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
  v_datos   jsonb := coalesce(p_datos, '{}'::jsonb);
  v_resto   jsonb := '{}'::jsonb;
  v_nombre  text;
  v_correo  text;
  k         text;
  col       text;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_instance;

  if v_company is null then
    raise exception 'Instancia de WhatsApp desconocida: %', p_instance
      using errcode = 'foreign_key_violation';
  end if;

  -- ── Se reparte lo capturado ────────────────────────────────────────────────
  -- Lo que tiene columna propia va a su columna; lo demás a metadata, que
  -- sigue sirviendo para lo que cada negocio necesite y nadie previó.
  for k in select jsonb_object_keys(v_datos) loop
    col := public.tf_captura_columna(k);
    if    col = 'full_name'    then v_nombre  := nullif(trim(v_datos->>k), '');
    elsif col = 'email'        then v_correo  := nullif(trim(v_datos->>k), '');
    else  v_resto := v_resto || jsonb_build_object(k, v_datos->k);
    end if;
  end loop;

  select id into v_contact
  from public.contacts
  where company_id = v_company and public.tf_telefono(phone) = v_tel;

  if v_contact is null then
    insert into public.contacts (company_id, phone, full_name, email,
                                 source, last_contact_at, metadata)
    values (v_company, v_tel, v_nombre, v_correo, 'whatsapp', now(), v_resto)
    returning id into v_contact;
  else
    -- `coalesce` en todos: un cliente que lleva meses siendo «María» no debe
    -- quedarse sin nombre porque en el último mensaje solo dijo «gracias».
    -- Y no se toca `phone`: se respeta como lo guardó el negocio.
    update public.contacts set
      full_name       = coalesce(v_nombre, full_name),
      email           = coalesce(v_correo, email),
      last_contact_at = now(),
      metadata        = metadata || v_resto
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

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_captura_columna(text) to n8n_worker;
    grant execute on function public.tf_agente_registrar(
      text, text, text, text, jsonb, text, text, int, int, int, int, boolean) to n8n_worker;
  end if;
end $$;
