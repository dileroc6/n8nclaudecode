-- ============================================================================
-- ToqueFlow — Las herramientas estándar son ver y corregir la ficha
-- ----------------------------------------------------------------------------
-- Diego lo cortó bien:
--
--   «Toque Atiende tiene unas herramientas que no me cuadran y no son
--    estándar. ¿Consultar saldo? ¿De qué, si no todos tienen paquetes? Debe
--    ser algo estándar: consultar la información de un cliente y más bien
--    editarla. Que si tienen un campo que es un paquete, es otra cosa, pero
--    debe mencionarse general.»
--
-- Es la misma regla de siempre, una capa más abajo. `consultar-saldo` supone
-- que el negocio vende paquetes. La forma que sí le sirve a todos es:
--
--   consultar-cliente     ¿quién es el que me escribe y qué sé de él?
--   actualizar-cliente    lo que me acaba de decir, guárdalo en su ficha
--
-- Las dos se apoyan en `contact_campos`, o sea en lo que el propio cliente
-- decidió guardar. Un gimnasio verá clases; una tienda, la talla; un taller,
-- la placa. Y donde hay saldo, sale ahí dentro con las palabras del negocio —
-- mencionado en general, no como una herramienta aparte.
--
-- `consultar-saldo` se retira: lo que hacía ahora lo hace `consultar-cliente`.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Ver la ficha de quien escribe ─────────────────────────────────────────
-- Devuelve lo que el negocio decidió guardar, con las etiquetas que él puso.
-- El agente no sabe de antemano qué campos hay, y eso es a propósito: así la
-- misma herramienta sirve para un spa y para una ferretería.
create or replace function public.tf_tool_consultar_cliente(
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
  v_voc     jsonb;
  v_c       public.contacts%rowtype;
  v_s       public.contact_saldo%rowtype;
  v_datos   json;
  v_saldo   json := null;
begin
  select ac.company_id, coalesce(co.metadata->'vocabulario', '{}'::jsonb)
    into v_company, v_voc
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_telefono);

  if not found then
    -- Que no esté es una respuesta legítima y distinta de que esté vacío. El
    -- agente tiene que poder decir «no te tengo registrado» sin inventarse una
    -- ficha en blanco.
    return json_build_object('ok', true, 'existe', false,
      'motivo', 'no tengo a esta persona registrada todavia');
  end if;

  -- Solo los campos que el negocio definió. Lo demás que haya en `metadata`
  -- son datos internos y no tiene por qué verlos el agente.
  select coalesce(json_agg(json_build_object(
           'clave', cc.clave, 'etiqueta', cc.etiqueta,
           'valor', v_c.metadata->>cc.clave
         ) order by cc.orden), '[]'::json)
    into v_datos
  from public.contact_campos cc
  where cc.company_id = v_company;

  -- El saldo, solo si este negocio lleva saldo, y en sus palabras. Va dentro
  -- de la ficha porque es un dato más de la persona, no otra herramienta.
  select * into v_s from public.contact_saldo where contact_id = v_c.id;
  if found then
    v_saldo := json_build_object(
      'cantidad', v_s.unidades,
      'unidad',   coalesce(v_voc->>'unidad', 'unidad'),
      'unidad_plural', coalesce(v_voc->>'unidad_plural', 'unidades'),
      'vence', v_s.vence,
      'que_compro', v_s.que_compro
    );
  end if;

  return json_build_object(
    'ok', true,
    'existe', true,
    'nombre', v_c.full_name,
    'estado', v_c.status,
    'que_compro', v_c.service_type,
    'datos', v_datos,
    'saldo', v_saldo
  );
end;
$fn$;

comment on function public.tf_tool_consultar_cliente(text, text) is
  'La ficha de quien escribe, con los campos que ESE negocio definio. El saldo sale aqui dentro cuando existe: es un dato de la persona, no una herramienta aparte.';


-- ── 2. Corregir o completar la ficha ─────────────────────────────────────────
-- Escribe SOLO en los campos que el negocio definió. Es el candado que importa:
-- sin él, un agente al que le digan «ponme como activo» tocaría el estado
-- comercial de la persona, que es una decisión del negocio y no de quien
-- escribe. Tampoco borra nada: un valor vacío se ignora.
create or replace function public.tf_tool_actualizar_cliente(
  p_instance text,
  p_telefono text,
  p_datos    jsonb
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company  uuid;
  v_c        public.contacts%rowtype;
  v_campo    public.contact_campos%rowtype;
  v_clave    text;
  v_valor    text;
  v_ok       text[] := '{}';
  v_ignorado text[] := '{}';
  v_nuevo    jsonb  := '{}'::jsonb;
begin
  select ac.company_id into v_company
  from public.agent_config ac
  where ac.whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_telefono);

  if not found then
    return json_build_object('ok', false,
      'motivo', 'no tengo a esta persona registrada; primero hay que crearla');
  end if;

  for v_clave, v_valor in select key, value from jsonb_each_text(coalesce(p_datos, '{}'::jsonb))
  loop
    select * into v_campo from public.contact_campos
    where company_id = v_company and clave = v_clave;

    if not found then
      -- No es un error del agente: es que ese negocio no guarda ese dato.
      v_ignorado := v_ignorado || (v_clave || ' (este negocio no guarda ese dato)');
      continue;
    end if;

    if v_valor is null or btrim(v_valor) = '' then
      v_ignorado := v_ignorado || (v_clave || ' (venia vacio)');
      continue;
    end if;

    -- La lista cerrada es el punto de tener una lista cerrada. Si el agente
    -- devuelve algo que no está en ella, no se guarda: guardarlo dejaría la
    -- columna con cuatro maneras de decir lo mismo, que es justo lo que la
    -- lista existe para evitar.
    if v_campo.tipo = 'opciones' and array_length(v_campo.opciones, 1) > 0 then
      declare v_dicho text := btrim(v_valor); v_cuantas int;
      begin
        -- Primero la coincidencia exacta.
        select o into v_valor from unnest(v_campo.opciones) o where lower(o) = lower(v_dicho);

        -- Si no la hay, se acepta una parcial SOLO si es única. Las opciones de
        -- un negocio real son frases —«Membresía Virtual»— y un agente contesta
        -- «virtual»; sin esto el dato se perdería en silencio, que es el peor
        -- de los dos errores. Exigir que sea única es lo que evita el otro:
        -- adivinar mal entre dos opciones parecidas.
        if v_valor is null then
          select count(*) into v_cuantas from unnest(v_campo.opciones) o
          where lower(o) like '%' || lower(v_dicho) || '%';
          if v_cuantas = 1 then
            select o into v_valor from unnest(v_campo.opciones) o
            where lower(o) like '%' || lower(v_dicho) || '%';
          end if;
        end if;

        if v_valor is null then
          v_ignorado := v_ignorado || (v_clave || ' (no es una de las opciones: ' ||
                                       array_to_string(v_campo.opciones, ' / ') || ')');
          continue;
        end if;
      end;
    elsif v_campo.tipo = 'numero' then
      if btrim(v_valor) !~ '^-?[0-9]+([.,][0-9]+)?$' then
        v_ignorado := v_ignorado || (v_clave || ' (deberia ser un numero)');
        continue;
      end if;
    end if;

    v_nuevo := v_nuevo || jsonb_build_object(v_clave, btrim(v_valor));
    v_ok := v_ok || v_campo.etiqueta;
  end loop;

  if v_nuevo <> '{}'::jsonb then
    update public.contacts
       set metadata = coalesce(metadata, '{}'::jsonb) || v_nuevo
     where id = v_c.id;
  end if;

  -- Se devuelve lo guardado Y lo ignorado. Si el agente no supiera qué se
  -- descartó, le diría a la persona «ya lo anoté» de algo que no quedó
  -- anotado, y eso es peor que no tener la herramienta.
  return json_build_object(
    'ok', true,
    'guardado', to_json(v_ok),
    'ignorado', to_json(v_ignorado),
    'nada_que_guardar', (v_nuevo = '{}'::jsonb)
  );
end;
$fn$;

comment on function public.tf_tool_actualizar_cliente(text, text, jsonb) is
  'Guarda datos en la ficha, SOLO en los campos que el negocio definio en contact_campos y validando las listas cerradas. Nunca borra y nunca toca el estado comercial. Devuelve tambien lo que ignoro.';


-- El nodo de Postgres de n8n parte los parámetros por coma, y un mensaje de
-- WhatsApp trae comas. Por eso, como con `tf_agente_registrar`, hay una versión
-- que recibe un solo jsonb.
create or replace function public.tf_tool_actualizar_cliente(p_payload jsonb)
returns json
language sql
volatile
security definer
set search_path = public
as $fn$
  select public.tf_tool_actualizar_cliente(
    p_payload->>'instance',
    p_payload->>'telefono',
    coalesce(p_payload->'datos', '{}'::jsonb)
  );
$fn$;


-- ── 3. Permisos ──────────────────────────────────────────────────────────────
revoke all on function public.tf_tool_consultar_cliente(text, text) from public, anon, authenticated;
revoke all on function public.tf_tool_actualizar_cliente(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.tf_tool_actualizar_cliente(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_consultar_cliente(text, text) to n8n_worker;
    grant execute on function public.tf_tool_actualizar_cliente(text, text, jsonb) to n8n_worker;
    grant execute on function public.tf_tool_actualizar_cliente(jsonb) to n8n_worker;
  end if;
end $$;


-- ── 4. El catálogo ──────────────────────────────────────────────────────────
-- NO va aquí. Qué lleva Toque Atiende lo escribe UN SOLO archivo:
-- schema-toque-atiende.sql. Esto estuvo duplicado y al reaplicar este archivo
-- se borró «escalar a una persona» del producto sin que nadie lo tocara.
--
-- Lo que quedaba de este archivo (las dos funciones tf_tool_*) tampoco existe
-- ya: lo retiró schema-ficha-en-contexto.sql al ver que el agente hacía las
-- dos cosas sin llamar a nadie. Se conserva el archivo por su encabezado, que
-- cuenta de dónde salió la decisión.
