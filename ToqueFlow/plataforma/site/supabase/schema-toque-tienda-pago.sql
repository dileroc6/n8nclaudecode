-- ============================================================================
-- Toque Tienda — la cuarta pieza: «ya pagué»
-- ----------------------------------------------------------------------------
-- LO QUE ESTA PIEZA HACE Y LO QUE NO:
--
--   HACE    dejar escrito, contra el pedido, que la persona dice que pagó, con
--           la referencia que dicte, y que eso le aparezca a alguien del
--           negocio en el portal.
--   NO HACE mirar la cuenta del banco. Eso depende de la pasarela de cada
--           cliente (Wompi, Bancolombia, Nequi) y **no está construido**.
--
-- La diferencia importa para lo que el agente puede decir. Con esto puede
-- decir «quedó anotado con la referencia 4471, lo verificamos y le aviso».
-- No puede decir «listo, confirmado». Confirmar un pago que no entró es
-- despachar mercancía regalada.
--
-- Cuando exista la pasarela, lo único que cambia es quién llama a
-- `tf_pago_verificar`: hoy una persona desde el portal, mañana el webhook.
-- El resto del camino ya queda hecho.
--
-- Idempotente. Se corre encima de `schema-toque-tienda.sql`.
-- ============================================================================

-- ── 1. El estado del pago vive en el pedido, aparte del estado del pedido ───
-- Aparte a propósito: un pedido puede estar confirmado y sin pagar, o pagado y
-- sin despachar. Meterlo todo en una sola columna obliga a inventar estados
-- como 'confirmado_pero_no_pagado', y ahí empieza el enredo.
alter table public.pedidos
  add column if not exists pago_estado text not null default 'ninguno'
    check (pago_estado in ('ninguno', 'reportado', 'verificado', 'rechazado')),
  add column if not exists pago_dicho          text,
  add column if not exists pago_referencia     text,
  add column if not exists pago_reportado_at   timestamptz,
  add column if not exists pago_verificado_por uuid references auth.users (id) on delete set null,
  add column if not exists pago_verificado_at  timestamptz,
  add column if not exists pago_nota           text;

comment on column public.pedidos.pago_estado is
  'reportado = la persona DICE que pago. verificado = alguien lo comprobo. Nunca los junte: el agente solo puede llegar hasta reportado.';

create index if not exists pedidos_pago_pendiente_idx
  on public.pedidos (company_id, pago_reportado_at desc)
  where pago_estado = 'reportado';


-- ── 2. La herramienta: anotar que dice que pagó ─────────────────────────────
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
begin
  -- La empresa se deriva de la instancia, nunca llega en el payload. Igual que
  -- en todas las demas herramientas.
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

  -- Si dicta un numero, ese. Si no, el ultimo pedido suyo que siga esperando
  -- plata. Solo entre SUS pedidos: dictar el numero 1 no da derecho a tocar el
  -- numero 1 de otra persona.
  if nullif(trim(p_payload->>'numero'), '') is not null then
    select * into v_p from public.pedidos
     where company_id = v_company and contact_id = v_contact
       and numero = (p_payload->>'numero')::int
     for update;
  else
    -- Los que siguen esperando plata primero, y entre esos el mas reciente. Un
    -- pedido YA reportado tiene que seguir entrando aqui: quien escribe «ya
    -- pague» por segunda vez espera que le hablen de ese mismo pedido, no que
    -- le digan que no le encuentra ninguno.
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

  -- Ya verificado: no se vuelve a abrir. Quien insiste sobre algo que ya se
  -- comprobo no necesita otro registro, necesita que le digan que ya esta.
  if v_p.pago_estado = 'verificado' then
    return json_build_object('ok', true, 'numero', v_p.numero,
      'pago_estado', 'verificado', 'verificado', true, 'repetido', true,
      'mensaje', 'ese pago ya esta verificado');
  end if;

  -- Insistir no crea un registro nuevo: actualiza el mismo. Quien escribe tres
  -- veces «ya pague» no hizo tres pagos.
  update public.pedidos
     set pago_estado       = 'reportado',
         pago_referencia   = coalesce(v_ref, pago_referencia),
         pago_dicho        = coalesce(v_dicho, pago_dicho),
         pago_reportado_at = coalesce(pago_reportado_at, now())
   where id = v_p.id;

  return json_build_object(
    'ok', true,
    'numero', v_p.numero,
    'total_cop', v_p.total_cop,
    'referencia', coalesce(v_ref, v_p.pago_referencia),
    'pago_estado', 'reportado',
    -- Explicito para que el agente no lo redondee a «listo». Queda anotado, no
    -- comprobado, y decirlo de otra forma es prometer lo que no se hizo.
    'verificado', false,
    'repetido', v_p.pago_estado = 'reportado',
    'mensaje', 'queda anotado; alguien lo verifica y le avisamos'
  );
end;
$fn$;

comment on function public.tf_tool_confirmar_pago(jsonb) is
  'Anota que la persona DICE que pago, contra su pedido. No comprueba nada: el agente solo puede llegar hasta "reportado".';


-- ── 3. Quien sí verifica: una persona (o mañana, la pasarela) ───────────────
create or replace function public.tf_pago_verificar(
  p_pedido uuid,
  p_ok     boolean,
  p_nota   text default null
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_p     public.pedidos%rowtype;
  v_quien uuid := auth.uid();
  v_mia   uuid;
begin
  select * into v_p from public.pedidos where id = p_pedido for update;
  if not found then return json_build_object('ok', false, 'motivo', 'ese pedido no existe'); end if;

  -- La sesion se exige aparte, por lo mismo de siempre: `not (a or b)` con b
  -- nulo da nulo, y un IF nulo no se dispara — dejaba pasar justo a quien no
  -- tiene empresa.
  if v_quien is null then
    return json_build_object('ok', false, 'motivo', 'hay que iniciar sesion');
  end if;
  v_mia := public.my_company_id();
  if not (public.is_super_admin() or (v_mia is not null and v_mia = v_p.company_id)) then
    return json_build_object('ok', false, 'motivo', 'ese pedido no es de tu empresa');
  end if;

  update public.pedidos
     set pago_estado         = case when p_ok then 'verificado' else 'rechazado' end,
         pago_nota           = coalesce(p_nota, pago_nota),
         pago_verificado_por = v_quien,
         pago_verificado_at  = now()
   where id = p_pedido;

  return json_build_object('ok', true, 'numero', v_p.numero,
    'pago_estado', case when p_ok then 'verificado' else 'rechazado' end);
end;
$fn$;

comment on function public.tf_pago_verificar(uuid, boolean, text) is
  'Unico camino por el que un pago pasa a verificado. Hoy lo llama una persona desde el portal; el dia que haya pasarela, lo llamara el webhook.';


-- ── 4. Lo que espera que alguien lo mire ────────────────────────────────────
drop view if exists public.pagos_por_verificar;
create view public.pagos_por_verificar
with (security_invoker = on) as
select
  p.id, p.company_id, p.numero, p.total_cop,
  p.pago_referencia, p.pago_dicho, p.pago_reportado_at,
  c.full_name as persona, c.phone as telefono
from public.pedidos p
left join public.contacts c on c.id = p.contact_id
where p.pago_estado = 'reportado';

comment on view public.pagos_por_verificar is
  'Los pagos que alguien dijo que hizo y nadie ha comprobado. Es la bandeja del negocio.';


-- ── 5. Permisos ─────────────────────────────────────────────────────────────
grant select on public.pagos_por_verificar to authenticated;
grant execute on function public.tf_pago_verificar(uuid, boolean, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_confirmar_pago(jsonb) to n8n_worker;
    grant select on public.pedidos to n8n_worker;
  end if;
end
$$;
