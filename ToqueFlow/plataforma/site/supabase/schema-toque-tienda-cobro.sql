-- ============================================================================
-- Toque Tienda — cómo cobra cada cliente
-- ----------------------------------------------------------------------------
-- Cada negocio cobra distinto y eso no lo decide la plataforma: se prende por
-- cliente, uno, otro o los dos. Es la misma idea que el tono o el horario —
-- la plataforma pone la forma, el negocio pone lo suyo.
--
-- LO QUE ESTO PROTEGE, y es más importante de lo que parece:
--
--   1. El agente NO PUEDE OFRECER lo que el negocio no tiene. Si un cliente
--      solo cobra por transferencia, ofrecerle un link de pago a alguien es
--      prometer algo que no existe.
--
--   2. Los datos de la cuenta se DICTAN TAL CUAL, nunca se recuerdan. Un
--      número de cuenta que el modelo «casi acierta» manda la plata de un
--      cliente a un desconocido. Es la misma regla del precio, subida de
--      gravedad: un precio mal dicho se corrige; una transferencia no.
--
--   3. Si nadie lo configuró, el agente NO INVENTA. Dice que confirma cómo
--      pagar y escala. Un agente que se inventa una cuenta bancaria es peor
--      que un agente que no sabe.
--
-- Idempotente. Va después de `schema-toque-tienda.sql` y sus dos parches.
-- ============================================================================

create table if not exists public.tienda_cobro (
  company_id uuid primary key references public.companies (id) on delete cascade,

  -- Los dos se pueden prender a la vez: hay negocios que dan a escoger.
  link           boolean not null default false,
  transferencia  boolean not null default false,
  efectivo       boolean not null default false,

  -- Lo que el agente DICTA cuando alguien va a transferir. Texto libre porque
  -- cada banco se dice distinto y cada negocio lo escribe a su manera. Se
  -- manda tal cual, sin resumir ni reordenar.
  datos_cuenta   text,

  -- A dónde le llega el aviso de que alguien dijo que pagó. Un número o un
  -- grupo de WhatsApp — NO «el equipo»: un aviso que va a una descripción no
  -- le llega a nadie, y el cliente se queda esperando.
  avisar_a       text,

  actualizado_at timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

comment on table public.tienda_cobro is
  'Que formas de cobro tiene prendidas cada cliente. El agente no puede ofrecer una que este apagada.';
comment on column public.tienda_cobro.datos_cuenta is
  'Se DICTA tal cual. Un numero de cuenta que el modelo casi acierta manda la plata a un desconocido.';
comment on column public.tienda_cobro.avisar_a is
  'Un numero o un grupo. Nunca una descripcion como "el equipo": eso no le llega a nadie.';

alter table public.tienda_cobro enable row level security;

drop policy if exists tienda_cobro_suyo on public.tienda_cobro;
create policy tienda_cobro_suyo on public.tienda_cobro
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists tienda_cobro_admin on public.tienda_cobro;
create policy tienda_cobro_admin on public.tienda_cobro
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());


-- ── Qué se le puede ofrecer a esta persona ──────────────────────────────────
create or replace function public.tf_cobro_de(p_company uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_c public.tienda_cobro%rowtype;
  v_m text[] := '{}';
begin
  select * into v_c from public.tienda_cobro where company_id = p_company;

  if not found or not (v_c.link or v_c.transferencia or v_c.efectivo) then
    -- Sin configurar no se inventa nada. El agente tiene que poder decir «le
    -- confirmo como puede pagar» en vez de sacarse una cuenta de la manga.
    return json_build_object(
      'configurado', false,
      'metodos', '[]'::json,
      'que_decir', 'Este negocio todavia no tiene configurada la forma de cobro. NO inventes una cuenta ni un link: dile que le confirmas como puede pagar y escala.');
  end if;

  if v_c.link          then v_m := v_m || 'link'::text; end if;
  if v_c.transferencia then v_m := v_m || 'transferencia'::text; end if;
  if v_c.efectivo      then v_m := v_m || 'efectivo'::text; end if;

  return json_build_object(
    'configurado', true,
    'metodos', to_json(v_m),
    -- Solo se manda si la transferencia esta prendida: no hay razon para que
    -- los datos de la cuenta anden circulando cuando no se van a usar.
    'datos_cuenta', case when v_c.transferencia then v_c.datos_cuenta else null end,
    'que_decir', case
      when array_length(v_m, 1) = 1 and v_m[1] = 'transferencia'
        then 'Solo recibe transferencia. Dicta los datos de la cuenta TAL CUAL vienen, sin resumir ni reordenar. NO ofrezcas link de pago: no existe.'
      when array_length(v_m, 1) = 1 and v_m[1] = 'link'
        then 'Solo cobra con link de pago. NO ofrezcas transferencia ni des datos de cuenta.'
      when array_length(v_m, 1) = 1 and v_m[1] = 'efectivo'
        then 'Solo recibe efectivo, contra entrega. NO ofrezcas link ni transferencia.'
      else 'Ofrece las formas que estan prendidas y deja que la persona escoja. Si escoge transferencia, dicta los datos TAL CUAL.'
    end
  );
end;
$fn$;

comment on function public.tf_cobro_de(uuid) is
  'Que formas de cobro puede ofrecer el agente de esta empresa, y que NO puede ofrecer. Sin configurar devuelve configurado:false para que no invente.';


-- ── Al armar el pedido, decirle al agente cómo se cobra aquí ────────────────
-- No hace falta una herramienta nueva: la respuesta llega en el momento en que
-- el agente la necesita, que es justo cuando acaba de armar el pedido.
create or replace function public.tf_tool_crear_pedido(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_c       public.contacts%rowtype;
  v_items   jsonb := coalesce(p_payload->'items', '[]'::jsonb);
  v_it      jsonb;
  v_p       public.productos%rowtype;
  v_id      uuid;
  v_num     int;
  v_total   numeric := 0;
  v_lineas  int := 0;
  v_falta   text[] := '{}';
  v_intento int := 0;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_payload->>'telefono');
  if not found then
    return json_build_object('ok', false, 'motivo', 'no tengo a esta persona registrada');
  end if;

  if jsonb_array_length(v_items) = 0 then
    return json_build_object('ok', false, 'motivo', 'no me dijiste que va en el pedido');
  end if;

  loop
    v_intento := v_intento + 1;
    select coalesce(max(numero), 0) + 1 into v_num from public.pedidos where company_id = v_company;
    begin
      insert into public.pedidos (company_id, contact_id, numero, dicho)
      values (v_company, v_c.id, v_num, nullif(btrim(coalesce(p_payload->>'dicho', '')), ''))
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_intento >= 5 then raise; end if;
    end;
  end loop;

  for v_it in select * from jsonb_array_elements(v_items)
  loop
    -- El precio sale del CATÁLOGO, no de lo que diga el modelo. Si el agente
    -- pudiera poner el precio, un cliente que dice «me dijeron que valía
    -- 10.000» acabaría con un pedido a 10.000.
    select * into v_p from public.productos
    where company_id = v_company and sku = (v_it->>'sku') and activo;

    if not found then
      v_falta := v_falta || coalesce(v_it->>'sku', '(sin sku)');
      continue;
    end if;

    insert into public.pedido_lineas (pedido_id, sku, nombre, cantidad, precio_cop)
    values (v_id, v_p.sku, v_p.nombre,
            greatest(1, coalesce((v_it->>'cantidad')::int, 1)), v_p.precio_cop);

    v_total := v_total + coalesce(v_p.precio_cop, 0) * greatest(1, coalesce((v_it->>'cantidad')::int, 1));
    v_lineas := v_lineas + 1;
  end loop;

  if v_lineas = 0 then
    delete from public.pedidos where id = v_id;
    return json_build_object('ok', false,
      'motivo', 'ninguno de esos productos esta en el catalogo',
      'no_encontrados', to_json(v_falta));
  end if;

  update public.pedidos set total_cop = v_total where id = v_id;

  return json_build_object(
    'ok', true,
    'aplicado', false,
    'numero', v_num,
    'lineas', v_lineas,
    'total', v_total,
    'no_encontrados', to_json(v_falta),
    -- Cómo cobra ESTE negocio. Llega aquí y no en una herramienta aparte
    -- porque es justo el momento en que el agente lo necesita.
    'cobro', public.tf_cobro_de(v_company),
    'que_decir', 'Te dejo armado el pedido numero ' || v_num ||
                 '. Alguien del equipo lo confirma y te avisa.'
  );
end;
$fn$;

comment on function public.tf_tool_crear_pedido(jsonb) is
  'Deja un pedido ARMADO, no confirmado. Los precios salen del catalogo y nunca del modelo. Devuelve tambien como cobra este negocio, para que el agente no ofrezca una forma de pago que no existe.';


-- ── Y al reportar el pago, que el método sea uno de los prendidos ───────────
create or replace function public.tf_tool_confirmar_pago(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_contact uuid;
  v_p       public.pedidos%rowtype;
  v_ref     text := nullif(trim(p_payload->>'referencia'), '');
  v_dicho   text := nullif(trim(p_payload->>'dicho'), '');
  v_met     text := nullif(trim(p_payload->>'metodo'), '');
  v_cobro   jsonb;
begin
  select company_id into v_company
    from public.agent_config
   where whatsapp_instance = p_payload->>'instance'
   limit 1;
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'no reconozco esta linea');
  end if;

  select id into v_contact
    from public.contacts
   where company_id = v_company
     and public.tf_telefono(phone) = public.tf_telefono(p_payload->>'telefono')
   limit 1;
  if v_contact is null then
    return json_build_object('ok', false, 'motivo', 'no tengo a esta persona registrada');
  end if;

  -- Un método que el negocio no tiene prendido no se acepta. Si el agente
  -- anota «pagó por transferencia» en un negocio que solo cobra con link, lo
  -- que queda escrito es una transferencia que nadie va a encontrar nunca.
  if v_met is not null then
    v_cobro := public.tf_cobro_de(v_company)::jsonb;
    if not (v_cobro->'metodos') @> to_jsonb(v_met) then
      return json_build_object('ok', false,
        'motivo', 'este negocio no cobra asi',
        'metodos', v_cobro->'metodos');
    end if;
  end if;

  if nullif(trim(p_payload->>'numero'), '') is not null then
    select * into v_p from public.pedidos
     where company_id = v_company and contact_id = v_contact
       and numero = (p_payload->>'numero')::int
     for update;
  else
    -- Los que siguen esperando plata primero, y entre esos el mas reciente. Un
    -- pedido YA reportado tiene que seguir entrando aqui: quien escribe «ya
    -- pague» por segunda vez espera que le hablen de ese mismo pedido.
    select * into v_p from public.pedidos
     where company_id = v_company and contact_id = v_contact
       and estado <> 'rechazado'
     order by (pago_estado = 'verificado'), created_at desc
     limit 1
     for update;
  end if;

  if v_p.id is null then
    return json_build_object('ok', false, 'motivo', 'no le encuentro un pedido esperando pago');
  end if;

  if v_p.pago_estado = 'verificado' then
    return json_build_object('ok', true, 'numero', v_p.numero,
      'pago_estado', 'verificado', 'verificado', true, 'repetido', true,
      'mensaje', 'ese pago ya esta verificado');
  end if;

  update public.pedidos
     set pago_estado       = 'reportado',
         pago_metodo       = coalesce(v_met, pago_metodo),
         pago_referencia   = coalesce(v_ref, pago_referencia),
         pago_dicho        = coalesce(v_dicho, pago_dicho),
         pago_comprobante_url = coalesce(nullif(trim(p_payload->>'comprobante_url'), ''), pago_comprobante_url),
         pago_reportado_at = coalesce(pago_reportado_at, now())
   where id = v_p.id;

  return json_build_object(
    'ok', true,
    'numero', v_p.numero,
    'total_cop', v_p.total_cop,
    'referencia', coalesce(v_ref, v_p.pago_referencia),
    'pago_estado', 'reportado',
    'verificado', false,
    'repetido', v_p.pago_estado = 'reportado',
    'mensaje', 'queda anotado; alguien lo verifica y le avisamos'
  );
end;
$fn$;


-- ── Permisos ────────────────────────────────────────────────────────────────
grant select on public.tienda_cobro to authenticated;
grant execute on function public.tf_cobro_de(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_cobro_de(uuid) to n8n_worker;
    grant select on public.tienda_cobro to n8n_worker;
  end if;
end
$$;
