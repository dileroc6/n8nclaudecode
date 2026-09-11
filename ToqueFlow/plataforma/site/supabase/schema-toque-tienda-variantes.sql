-- ============================================================================
-- Toque Tienda — variantes, frescura del dato y las dos formas de pago
-- ----------------------------------------------------------------------------
-- TRES CORRECCIONES AL DISEÑO INICIAL, y las tres salieron de la misma
-- pregunta: ¿qué puede PROMETER el agente?
--
--   1. VARIANTES. Sin ellas el agente contesta «sí tenemos guantes» cuando lo
--      que hay es talla XL y la persona usa M. Cada variante sigue siendo una
--      cosa vendible distinta —su precio, sus existencias—; lo que se agrega
--      es que el agente sepa que son hermanas y pueda ofrecerlas.
--
--   2. FRESCURA. Un catálogo copiado envejece. El agente tiene que saber si lo
--      que está diciendo es de hace diez minutos o de hace tres semanas, y
--      hablar distinto en cada caso. «Quedan 12» y «según lo último que tengo,
--      quedan 12» son dos frases distintas y solo una es honesta cuando el
--      dato está viejo.
--
--   3. EL MOMENTO QUE IMPORTA. Equivocarse mientras alguien curiosea no cuesta
--      nada; equivocarse al aceptar el pedido es vender lo que no hay. Por eso
--      `crear_pedido` avisa cuándo hace falta confirmar contra la tienda antes
--      de comprometerse — en vez de sincronizar cada minuto «por si acaso».
--
-- Idempotente. Va después de `schema-toque-tienda.sql` y `-pago.sql`.
-- ============================================================================

-- ── 1. Variantes ────────────────────────────────────────────────────────────
-- Un producto «padre» agrupa a sus variantes. El padre NO se vende: se vende
-- la variante. Por eso cada variante sigue siendo su propia fila, con su SKU,
-- su precio y sus existencias — que es como lo entrega Woo, Shopify y Siigo.
alter table public.productos
  add column if not exists padre_sku text,
  -- {"talla": "M", "color": "azul"} — tal como lo nombre la tienda del cliente.
  -- Se guarda como vino: inventar nombres propios aquí obligaria a traducir en
  -- cada conector, y cada traduccion es un sitio donde perder informacion.
  add column if not exists variante jsonb;

create index if not exists productos_padre_idx
  on public.productos (company_id, padre_sku) where padre_sku is not null;

comment on column public.productos.padre_sku is
  'El SKU del producto que agrupa a esta variante. Nulo = producto suelto. El padre no se vende; se vende la variante.';
comment on column public.productos.variante is
  'Que la distingue de sus hermanas: {"talla":"M"}. Con las palabras de la tienda del cliente, no traducidas.';


-- ── 2. Cómo y cuándo se sincroniza cada empresa ─────────────────────────────
-- El nivel decide qué puede prometer el agente, así que se guarda con los
-- datos y no en la cabeza de quien lo configuró.
create table if not exists public.catalogo_fuente (
  company_id  uuid primary key references public.companies (id) on delete cascade,

  -- a = la tienda avisa cuando algo cambia (casi tiempo real)
  -- b = la plataforma pregunta cada rato
  -- c = alguien sube el catálogo a mano
  nivel       text not null default 'c' check (nivel in ('a', 'b', 'c')),
  plataforma  text,                       -- woocommerce, shopify, siigo, csv, manual

  -- A partir de cuántos minutos el dato se considera viejo. Es por empresa a
  -- propósito: una ferretería con 4.000 referencias que rotan despacio no es
  -- un spa con 3 cupos al día.
  frescura_min int not null default 1440,

  ultima_sync timestamptz,
  ultimo_error text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table public.catalogo_fuente is
  'De donde sale el catalogo de cada empresa y cada cuanto se refresca. El nivel decide que puede prometer el agente.';
comment on column public.catalogo_fuente.frescura_min is
  'Minutos tras los cuales el dato se considera viejo y el agente cambia de frase. Por empresa: rotan distinto.';

alter table public.catalogo_fuente enable row level security;

drop policy if exists catalogo_fuente_suya on public.catalogo_fuente;
create policy catalogo_fuente_suya on public.catalogo_fuente
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());


-- ── 3. ¿El dato está fresco? ────────────────────────────────────────────────
create or replace function public.tf_catalogo_frescura(p_company uuid)
returns json
language sql
stable
security definer
set search_path = public
as $fn$
  with f as (
    select coalesce(cf.nivel, 'c') nivel,
           coalesce(cf.frescura_min, 1440) limite,
           greatest(cf.ultima_sync, (select max(actualizado_at) from public.productos p
                                      where p.company_id = p_company)) as visto
    from (select p_company as id) x
    left join public.catalogo_fuente cf on cf.company_id = p_company
  )
  select json_build_object(
    'nivel', f.nivel,
    'visto', f.visto,
    'minutos', case when f.visto is null then null
                    else floor(extract(epoch from (now() - f.visto)) / 60)::int end,
    -- Tres estados, no dos. «No sé de cuándo es» no es lo mismo que «está
    -- viejo», y desde luego no es lo mismo que «está al día».
    'estado', case
                when f.visto is null then 'desconocido'
                when f.nivel = 'a'   then 'vivo'
                when extract(epoch from (now() - f.visto)) / 60 <= f.limite then 'fresco'
                else 'viejo'
              end
  ) from f;
$fn$;

comment on function public.tf_catalogo_frescura(uuid) is
  'Que tan viejo es el catalogo de una empresa. Tres estados: vivo, fresco, viejo — y "desconocido", que no es ninguno de los otros.';


-- ── 4. Buscar, ahora con hermanas y con frescura ────────────────────────────
create or replace function public.tf_tool_buscar_catalogo(p_payload jsonb)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_texto   text := translate(lower(btrim(coalesce(p_payload->>'que', ''))),
                              'áéíóúàèìòùäëïöüâêîôûñ', 'aeiouaeiouaeiouaeioun');
  v_limite  int  := least(greatest(coalesce((p_payload->>'cuantos')::int, 5), 1), 10);
  v_hay     json;
  v_n       int;
  v_fresca  json;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  if v_texto = '' then
    return json_build_object('ok', false,
      'motivo', 'falta que me digas que esta buscando la persona');
  end if;

  select count(*)::int into v_n
  from public.productos where company_id = v_company and activo;

  if v_n = 0 then
    -- Que el catálogo esté vacío es una respuesta legítima y distinta de «no
    -- encontré ese producto». El agente tiene que poder decir la verdad.
    return json_build_object('ok', false, 'motivo', 'este negocio todavia no tiene su catalogo cargado');
  end if;

  v_fresca := public.tf_catalogo_frescura(v_company);

  select coalesce(json_agg(t.x order by t.orden), '[]'::json) into v_hay from (
    select json_build_object(
             'nombre', p.nombre,
             'sku', p.sku,
             'precio', p.precio_cop,
             -- Se devuelve tal cual, incluido el nulo: el agente distingue
             -- «quedan 3», «no quedan» y «no lo sé».
             'existencias', p.existencias,
             'variante', p.variante,
             'url', p.url,
             'actualizado', p.actualizado_at,
             -- Las hermanas: lo que permite decir «ese viene en M, L y XL, y
             -- de M no queda». Sin esto el agente ofrece lo que no hay.
             'presentaciones', (
               select coalesce(json_agg(json_build_object(
                        'sku', h.sku, 'variante', h.variante,
                        'precio', h.precio_cop, 'existencias', h.existencias)
                      order by h.nombre), '[]'::json)
               from public.productos h
               where h.company_id = p.company_id and h.activo
                 and h.padre_sku is not null
                 and h.padre_sku = coalesce(p.padre_sku, p.sku)
                 and h.sku <> p.sku
             )
           ) as x,
           -- Lo que empieza por lo buscado va primero: quien escribe «guantes»
           -- espera guantes, no «limpiador para guantes».
           case when p.busqueda like v_texto || '%' then 0
                when p.busqueda like '% ' || v_texto || '%' then 1
                else 2 end as orden
    from public.productos p
    where p.company_id = v_company and p.activo
      and p.busqueda like '%' || v_texto || '%'
    order by orden, p.nombre
    limit v_limite
  ) t;

  return json_build_object(
    'ok', true,
    'encontrados', json_array_length(v_hay),
    'productos', v_hay,
    'catalogo_al', (v_fresca->>'visto')::timestamptz,
    -- vivo / fresco / viejo / desconocido. Es lo que decide si el agente dice
    -- «quedan 12» o «según lo último que tengo, quedan 12».
    'frescura', v_fresca,
    'que_decir', case v_fresca->>'estado'
      when 'vivo'   then null
      when 'fresco' then 'Puedes decir las existencias, pero no como una promesa.'
      else 'Este catalogo esta viejo: di cuando es el dato y ofrece confirmar antes de cerrar.'
    end
  );
end;
$fn$;

comment on function public.tf_tool_buscar_catalogo(jsonb) is
  'Busca en el catalogo copiado. Devuelve precio, existencias, las variantes hermanas y QUE TAN VIEJO es el dato: un dato viejo dicho como viejo sirve; dicho como actual, miente.';


-- ── 5. Al armar el pedido, avisar si hay que confirmar contra la tienda ─────
-- No se cambia lo que hace `tf_tool_crear_pedido` —sigue armando sin
-- confirmar—, se le agrega lo que quien confirma necesita saber: si el dato
-- con el que se armó era de fiar, y si algo se comprometió por encima de lo
-- que hay.
create or replace function public.tf_pedido_revisar(p_pedido uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_p      public.pedidos%rowtype;
  v_avisos json;
begin
  select * into v_p from public.pedidos where id = p_pedido;
  if not found then return json_build_object('ok', false, 'motivo', 'ese pedido no existe'); end if;

  select coalesce(json_agg(json_build_object(
           'sku', l.sku, 'nombre', l.nombre,
           'pedidas', l.cantidad, 'hay', p.existencias,
           'precio_pedido', l.precio_cop, 'precio_hoy', p.precio_cop)), '[]'::json)
    into v_avisos
    from public.pedido_lineas l
    left join public.productos p
           on p.company_id = v_p.company_id and p.sku = l.sku and p.activo
   where l.pedido_id = p_pedido
     and (p.id is null                                    -- ya no está en el catálogo
          or (p.existencias is not null and p.existencias < l.cantidad)
          or (p.precio_cop is not null and l.precio_cop is not null
              and p.precio_cop <> l.precio_cop));

  return json_build_object(
    'ok', true,
    'numero', v_p.numero,
    'frescura', public.tf_catalogo_frescura(v_p.company_id),
    -- Vacío = nada cambió desde que se armó. Con algo dentro = miralo antes de
    -- confirmar: o no alcanza, o el precio se movió, o ya no existe.
    'revisar', v_avisos
  );
end;
$fn$;

comment on function public.tf_pedido_revisar(uuid) is
  'Que ha cambiado entre armar el pedido y confirmarlo: lo que ya no alcanza, lo que subio de precio, lo que desaparecio. Es lo que mira quien confirma.';


-- ── 6. Las dos formas de pago ───────────────────────────────────────────────
-- Se ofrecen las dos porque en Colombia conviven. La diferencia no es quién
-- puede menos: es que una pasarela puede VERIFICAR y una conversación no.
alter table public.pedidos
  add column if not exists pago_metodo text
    check (pago_metodo is null or pago_metodo in ('link', 'transferencia', 'efectivo')),
  add column if not exists pago_link text,
  -- El pantallazo de la transferencia. Se guarda la URL, no la imagen: la
  -- imagen vive donde ya vive el resto de media.
  add column if not exists pago_comprobante_url text;

comment on column public.pedidos.pago_metodo is
  'link = la pasarela verifica sola. transferencia/efectivo = lo verifica una persona. El agente no confirma en ninguno de los dos.';
comment on column public.pedidos.pago_comprobante_url is
  'El pantallazo que mando la persona. Que exista NO quiere decir que el pago entro.';


-- ── 7. La bandeja, ahora diciendo qué espera de quién ───────────────────────
drop view if exists public.pagos_por_verificar;
create view public.pagos_por_verificar
with (security_invoker = on) as
select
  p.id, p.company_id, p.numero, p.total_cop,
  p.pago_metodo, p.pago_referencia, p.pago_dicho,
  p.pago_comprobante_url, p.pago_reportado_at,
  c.full_name as persona, c.phone as telefono
from public.pedidos p
left join public.contacts c on c.id = p.contact_id
where p.pago_estado = 'reportado';

comment on view public.pagos_por_verificar is
  'Los pagos que alguien dijo que hizo y nadie ha comprobado. Con link de pago esto deberia estar casi siempre vacio: la pasarela verifica sola.';


-- ── 8. Permisos ─────────────────────────────────────────────────────────────
grant select on public.catalogo_fuente, public.pagos_por_verificar to authenticated;
grant execute on function public.tf_catalogo_frescura(uuid) to authenticated;
grant execute on function public.tf_pedido_revisar(uuid)    to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_catalogo_frescura(uuid) to n8n_worker;
    -- El sincronizador es quien escribe el catalogo y deja la marca de cuando
    -- lo hizo.
    grant select, insert, update on public.catalogo_fuente to n8n_worker;
  end if;
end
$$;
