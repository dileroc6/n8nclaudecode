-- ============================================================================
-- ToqueFlow — El agente guarda lo que pasó, en una sola llamada
-- ----------------------------------------------------------------------------
-- Contraparte de `tf_agente_contexto`. Después de responder hay que guardar
-- cinco cosas, y todas tienen que pasar o ninguna:
--
--   el contacto (si es la primera vez que escribe)
--   lo que dijo el cliente
--   lo que contestó el agente
--   los datos que se capturaron en el camino
--   cuántos tokens costó
--
-- Hacerlo con cinco nodos en n8n significa que un fallo en el tercero deja la
-- conversación a medias: el mensaje del cliente guardado, la respuesta no. La
-- próxima vez el agente lee un historial que miente. Una función = una
-- transacción = o queda todo o no queda nada.
--
-- Requisitos: schema-agente-runtime.sql. Idempotente.
-- ============================================================================


-- ── Precios del modelo, en un solo sitio ─────────────────────────────────────
-- Los mismos números que usa la edge function de conocimiento. Cuando cambien
-- —y van a cambiar— se cambian aquí y no en cinco archivos. USD por millón.
drop function if exists public.tf_precio_modelo(text);
create or replace function public.tf_precio_modelo(p_model text)
returns jsonb language sql immutable as $fn$
  select case
    when p_model like 'claude-sonnet%'
      then jsonb_build_object('input', 3.00, 'output', 15.00, 'cache_read', 0.30, 'cache_write', 6.00)
    -- Haiku 4.5 es el modelo del producto estándar y el default deliberado:
    -- si llega un modelo desconocido, se cobra como el barato antes que
    -- inflar el costo reportado con precios que no son.
    else jsonb_build_object('input', 1.00, 'output', 5.00, 'cache_read', 0.10, 'cache_write', 2.00)
  end;
$fn$;


-- ── El registro ──────────────────────────────────────────────────────────────
-- SECURITY DEFINER porque escribe en `ai_usage`, donde el worker de n8n no
-- tiene permiso —y no debe tenerlo: si pudiera escribir ahí libremente, un
-- error de código podría falsear el consumo que le facturamos al cliente.
-- Aquí el company_id no se acepta a ciegas: se deriva de la instancia de
-- WhatsApp, igual que en la lectura. El workflow no puede pedir que se
-- escriba en otra empresa aunque quisiera.
create or replace function public.tf_agente_registrar(
  p_instance     text,
  p_telefono     text,
  p_entrante     text,      -- lo que escribió el cliente
  p_respuesta    text,      -- lo que contestó el agente
  p_datos        jsonb  default '{}',   -- campos capturados en este turno
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
begin
  select company_id into v_company
  from public.agent_config
  where whatsapp_instance = p_instance;

  if v_company is null then
    raise exception 'Instancia de WhatsApp desconocida: %', p_instance
      using errcode = 'foreign_key_violation';
  end if;

  -- ── El contacto ────────────────────────────────────────────────────────────
  -- `coalesce` en el nombre y no asignación directa: si el agente capturó el
  -- nombre en este turno se guarda, pero si no, NO se pisa el que ya había.
  -- Un cliente que lleva meses siendo "María" no debe volver a ser null porque
  -- en el último mensaje solo dijo "gracias".
  insert into public.contacts (company_id, phone, full_name, source, last_contact_at, metadata)
  values (
    v_company, p_telefono,
    nullif(p_datos->>'nombre', ''),
    'whatsapp', now(),
    coalesce(p_datos, '{}'::jsonb) - 'nombre'
  )
  on conflict (company_id, phone) do update set
    full_name       = coalesce(nullif(excluded.full_name, ''), public.contacts.full_name),
    last_contact_at = now(),
    metadata        = public.contacts.metadata || excluded.metadata
  returning id into v_contact;

  -- ── La conversación ────────────────────────────────────────────────────────
  -- En modo prueba va a `test_messages`, que es lo que lee el panel del
  -- sandbox. Es el mismo flujo real: solo cambia dónde aterriza la salida.
  if p_test then
    insert into public.test_messages (company_id, contact_id, telefono, direction, author, body, flow)
    values (v_company, v_contact, p_telefono, 'in',  'cliente', p_entrante,  'agente'),
           (v_company, v_contact, p_telefono, 'out', 'bot',     p_respuesta, 'agente');
  else
    insert into public.message_log (company_id, contact_id, direction, channel, body, wa_message_id)
    values (v_company, v_contact, 'in',  'whatsapp', p_entrante,  p_wa_id),
           (v_company, v_contact, 'out', 'whatsapp', p_respuesta, null);
  end if;

  -- ── El costo ───────────────────────────────────────────────────────────────
  -- Se registra también en modo prueba: probar cuesta plata igual, y esconderlo
  -- haría que el panel de consumo mienta justo cuando más se usa.
  if p_model is not null then
    v_precio := public.tf_precio_modelo(p_model);
    v_costo  := (
        p_input       * (v_precio->>'input')::numeric
      + p_output      * (v_precio->>'output')::numeric
      + p_cache_read  * (v_precio->>'cache_read')::numeric
      + p_cache_write * (v_precio->>'cache_write')::numeric
    ) / 1000000.0;

    insert into public.ai_usage (company_id, tool, model, input_tokens, output_tokens, cost_usd, success)
    values (
      v_company,
      case when p_test then 'agente-atencion-prueba' else 'agente-atencion' end,
      p_model,
      -- input_tokens guarda el total realmente procesado, cacheado incluido.
      -- Si solo guardáramos el no-cacheado, el panel mostraría un agente que
      -- lee 300 tokens y responde de maravilla, y nadie entendería el costo.
      p_input + p_cache_read + p_cache_write,
      p_output,
      v_costo,
      true
    );
  end if;

  return json_build_object(
    'company_id', v_company,
    'contact_id', v_contact,
    'costo_usd',  coalesce(v_costo, 0)
  );
end;
$fn$;

comment on function public.tf_agente_registrar is
  'Guarda contacto, conversación y consumo de un turno del agente, en una sola transacción. El company_id se deriva de la instancia de WhatsApp, nunca se acepta del payload.';


-- ── Permisos ─────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_registrar(
      text, text, text, text, jsonb, text, text, int, int, int, int, boolean
    ) to n8n_worker;
    grant execute on function public.tf_precio_modelo(text) to n8n_worker;
  end if;
end $$;

revoke all on function public.tf_agente_registrar(
  text, text, text, text, jsonb, text, text, int, int, int, int, boolean
) from public, anon, authenticated;
