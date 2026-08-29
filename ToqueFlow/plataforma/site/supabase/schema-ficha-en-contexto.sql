-- ============================================================================
-- ToqueFlow — Ver y anotar la ficha, sin una llamada de más
-- ----------------------------------------------------------------------------
-- Diego definió el producto: el agente responde, escala a un humano, y
-- «registra en una tabla personalizada la información de los clientes».
--
-- Al ir a construirlo como dos herramientas —una para ver la ficha, otra para
-- escribirla— apareció que el agente YA hace las dos cosas, sin llamar a nadie:
--
--   ver     `tf_agente_contexto` devuelve `contacto.metadata` en cada turno
--   anotar  la herramienta `responder` trae un campo `datos` que se guarda
--
-- Una herramienta aparte para eso sería un segundo camino a lo mismo, y cada
-- uso costaría una llamada entera a Claude para leer un dato que ya venía en la
-- mano. Así que no se agregan: se completa lo que ya hay, que es donde estaban
-- los dos huecos de verdad.
--
--   HUECO 1  el agente no ve el saldo ni las etiquetas de los campos. Sabe que
--            `modalidad` vale «Membresía Virtual», pero no que a eso el negocio
--            le dice «Modalidad», ni que a esta persona le quedan 3 clases.
--
--   HUECO 2  al guardar no se valida NADA. `tf_agente_registrar` mete en
--            `metadata` lo que venga: un campo que el negocio nunca definió, o
--            una opción que no está en su lista. La lista cerrada existía solo
--            en el prompt, y un prompt no es un candado.
--
-- Las dos piezas del catálogo (ver la ficha · guardar en la ficha) se quedan:
-- describen capacidades reales del producto. Lo que cambia es que no cuestan
-- una vuelta extra.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Una sola regla para validar lo capturado ──────────────────────────────
-- La usan las dos rutas de escritura. Tener la regla en un solo sitio es lo que
-- evita que dentro de seis meses el agente acepte algo que el portal rechaza.
create or replace function public.tf_validar_campos(
  p_company uuid,
  p_datos   jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_campo    public.contact_campos%rowtype;
  v_clave    text;
  v_valor    text;
  v_dicho    text;
  v_cuantas  int;
  v_bueno    jsonb  := '{}'::jsonb;
  v_ignorado text[] := '{}';
  v_col      text;
begin
  for v_clave, v_valor in select key, value from jsonb_each_text(coalesce(p_datos, '{}'::jsonb))
  loop
    if v_valor is null or btrim(v_valor) = '' then
      continue;  -- vacío no es un error, es que no lo dijeron
    end if;

    -- Nombre y correo tienen columna propia y los pide cualquier negocio: no
    -- necesitan estar declarados para poder guardarse.
    v_col := public.tf_captura_columna(v_clave);
    if v_col in ('full_name', 'email') then
      v_bueno := v_bueno || jsonb_build_object(v_clave, btrim(v_valor));
      continue;
    end if;

    select * into v_campo from public.contact_campos
    where company_id = p_company and clave = v_clave;

    if not found then
      v_ignorado := v_ignorado || (v_clave || ' (este negocio no guarda ese dato)');
      continue;
    end if;

    if v_campo.tipo = 'opciones' and coalesce(array_length(v_campo.opciones, 1), 0) > 0 then
      v_dicho := btrim(v_valor);
      v_valor := null;

      -- Primero exacta.
      select o into v_valor from unnest(v_campo.opciones) o where lower(o) = lower(v_dicho);

      -- Si no, se acepta una parcial SOLO si es única. Las opciones de un
      -- negocio real son frases —«Membresía Virtual»— y el modelo contesta
      -- «virtual»; sin esto el dato se pierde en silencio, que es el peor de
      -- los dos errores. Exigir que sea única evita el otro: adivinar mal
      -- entre dos opciones parecidas.
      if v_valor is null then
        select count(*) into v_cuantas from unnest(v_campo.opciones) o
        where lower(o) like '%' || lower(v_dicho) || '%';
        if v_cuantas = 1 then
          select o into v_valor from unnest(v_campo.opciones) o
          where lower(o) like '%' || lower(v_dicho) || '%';
        end if;
      end if;

      if v_valor is null then
        v_ignorado := v_ignorado || (v_clave || ' (no esta en la lista: ' ||
                                     array_to_string(v_campo.opciones, ' / ') || ')');
        continue;
      end if;

    elsif v_campo.tipo = 'numero' then
      if btrim(v_valor) !~ '^-?[0-9]+([.,][0-9]+)?$' then
        v_ignorado := v_ignorado || (v_clave || ' (deberia ser un numero)');
        continue;
      end if;
      v_valor := btrim(v_valor);
    else
      v_valor := btrim(v_valor);
    end if;

    v_bueno := v_bueno || jsonb_build_object(v_clave, v_valor);
  end loop;

  return jsonb_build_object('datos', v_bueno, 'ignorado', to_jsonb(v_ignorado));
end;
$fn$;

comment on function public.tf_validar_campos(uuid, jsonb) is
  'La unica regla sobre que se puede guardar en la ficha de un contacto: solo campos que el negocio definio en contact_campos, y dentro de la lista cuando la lista es cerrada. La usan el agente y las herramientas, para que no haya dos reglas.';


-- ── 2. El agente valida antes de guardar ─────────────────────────────────────
-- Se envuelve `tf_agente_registrar` en vez de reescribirla: la función hace
-- siete cosas más (contacto, conversación, consumo, precio) y todas funcionan.
-- Lo único que cambia es que los datos entran filtrados.
create or replace function public.tf_agente_registrar(p jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_filtro  jsonb;
  v_res     json;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p->>'instance';

  v_filtro := public.tf_validar_campos(v_company, coalesce(p->'datos', '{}'::jsonb));

  v_res := public.tf_agente_registrar(
    p->>'instance',
    p->>'telefono',
    p->>'entrante',
    p->>'respuesta',
    coalesce(v_filtro->'datos', '{}'::jsonb),
    p->>'wa_id',
    p->>'model',
    coalesce((p->>'input')::int, 0),
    coalesce((p->>'output')::int, 0),
    coalesce((p->>'cache_read')::int, 0),
    coalesce((p->>'cache_write')::int, 0),
    coalesce((p->>'test')::boolean, false)
  );

  -- Lo descartado viaja de vuelta para que quede en el log del workflow. Un
  -- dato que se cae en silencio es el que nadie encuentra en seis meses.
  return (v_res::jsonb || jsonb_build_object('ignorado', v_filtro->'ignorado'))::json;
end;
$fn$;


-- ── 3. La ficha completa llega en el contexto ────────────────────────────────
-- Con las etiquetas del negocio y, si lleva saldo, cuánto le queda y cómo se
-- llama. Es lo que hacía falta para que el agente responda «te quedan 3 clases»
-- sin pedirle el dato a nadie.
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
           'workflow', c.workflow
         ) order by c.orden), '[]'::json)
    into v_tools
  from public.catalogo c
  where c.clave = any(coalesce(v_rt.herramientas, '{}'))
    and c.tipo = 'herramienta' and c.activo and c.workflow is not null;

  -- Los que el agente debe intentar averiguar.
  select coalesce(json_agg(json_build_object(
           'clave', cc.clave, 'etiqueta', cc.etiqueta,
           'obligatorio', cc.obligatorio,
           'opciones', case when cc.tipo = 'opciones' then to_jsonb(cc.opciones) else '[]'::jsonb end
         ) order by cc.orden), '[]'::json)
    into v_campos
  from public.contact_campos cc
  where cc.company_id = v_rt.company_id and cc.capturar;

  -- Y lo que YA se sabe de esta persona, con las etiquetas del negocio. Antes
  -- llegaba el `metadata` crudo: el agente veía `como_llego: "Instagram"` y no
  -- que a eso el negocio le dice «Cómo llegó».
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
      -- Lo que ya se sabe, listo para leer.
      'ficha', coalesce(v_ficha, '[]'::json),
      -- El saldo, en las palabras del negocio. Nulo donde no se cuenta nada:
      -- una tienda no tiene saldo y no debe ver un cero que parezca «se le
      -- acabaron».
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


-- ── 4. Permisos ──────────────────────────────────────────────────────────────
revoke all on function public.tf_validar_campos(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
revoke all on function public.tf_agente_registrar(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_validar_campos(uuid, jsonb) to n8n_worker;
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
    grant execute on function public.tf_agente_registrar(jsonb) to n8n_worker;
  end if;
end $$;


-- ── 5. Las herramientas sueltas se retiran ───────────────────────────────────
-- Se construyeron antes de ver que el agente ya tenía las dos rutas. Dejarlas
-- sería un segundo camino a lo mismo: dos webhooks vivos, dos reglas y una
-- llamada de más cada vez.
drop function if exists public.tf_tool_consultar_cliente(text, text);
drop function if exists public.tf_tool_actualizar_cliente(jsonb);
drop function if exists public.tf_tool_actualizar_cliente(text, text, jsonb);

-- Las piezas del catálogo SÍ se quedan: describen lo que el producto hace, y
-- eso sigue siendo cierto. Lo que cambia es que no llevan webhook.
update public.catalogo set workflow = null
 where clave in ('consultar-cliente', 'actualizar-cliente');

-- Y salen de `herramientas`: ahí solo van las que el agente llama por webhook.
-- Si se quedaran, el agente las ofrecería a Claude y cada uso costaría una
-- vuelta entera para leer algo que ya tenía.
update public.agent_config
   set herramientas = array(
     select x from unnest(coalesce(herramientas, '{}')) x
     where x not in ('consultar-cliente', 'actualizar-cliente')
   );
