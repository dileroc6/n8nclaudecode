-- ============================================================================
-- ToqueFlow — Toque Tienda: buscar en el catálogo, y dejar el pedido armado
-- ----------------------------------------------------------------------------
-- Al ir a migrar Savia y FerreteríaYa apareció que sus agentes viejos no viven
-- de un documento de conocimiento: viven de CONSULTAR SU CATÁLOGO. Y ahí está
-- la decisión que da forma a todo este archivo:
--
--   ¿El agente consulta la tienda del cliente EN VIVO, o consulta una copia?
--
-- Se elige la COPIA, sincronizada aquí. Y no por rendimiento:
--
--   · Si consultara en vivo, `buscar-catalogo` tendría que saber de WooCommerce,
--     de Siigo y de Shopify — o sea, una herramienta POR PLATAFORMA. Eso rompe
--     la regla que sostiene el producto: una herramienta es por CAPACIDAD.
--   · Con la copia, la herramienta es UNA y no sabe de dónde salieron los datos.
--     Lo que cambia por plataforma es solo el sincronizador.
--   · Y eso es exactamente lo que hace cierta la frase que ya se le dice al
--     cliente: «la primera tienda WooCommerce cuesta construirla, la segunda ya
--     está hecha». Lo que se construye una vez es el sincronizador.
--
-- Lo que la copia cuesta: los datos son de la última sincronización, no de este
-- segundo. Por eso cada producto lleva `actualizado_at` y la herramienta lo
-- devuelve — el agente puede decir «según lo último que tengo», que es la
-- verdad, en vez de afirmar una existencia que quizá ya no está.
--
-- Idempotente.
-- ============================================================================


-- Para buscar «guantes» dentro de «Guantes de nitrilo talla M» hace falta un
-- índice de trigramas: un índice normal solo sirve cuando la búsqueda empieza
-- por el principio de la palabra, y nadie escribe así.
create extension if not exists pg_trgm;


-- ── 1. El catálogo del cliente, copiado aquí ────────────────────────────────
create table if not exists public.productos (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,

  -- El identificador que usa el cliente en SU tienda. Es la llave para
  -- sincronizar sin duplicar.
  sku         text not null,
  nombre      text not null,
  descripcion text,
  categoria   text,

  precio_cop  numeric,
  -- Nulo = esta tienda no lleva inventario, o el sincronizador no lo trae. NO
  -- es lo mismo que cero, y el agente tiene que poder distinguirlo: decir «no
  -- hay» cuando en realidad no se sabe es una venta perdida.
  existencias int,
  url         text,

  activo      boolean not null default true,
  -- De dónde salió: woocommerce, siigo, shopify, manual.
  origen      text,
  actualizado_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create unique index if not exists productos_sku_idx on public.productos (company_id, sku);
create index if not exists productos_empresa_idx on public.productos (company_id) where activo;

-- Para buscar sin que importen tildes ni mayúsculas. Es una columna generada:
-- la calcula la base y no hay forma de que se olvide de actualizarse.
alter table public.productos
  add column if not exists busqueda text
  generated always as (
    translate(lower(coalesce(nombre, '') || ' ' || coalesce(descripcion, '') || ' ' ||
                    coalesce(categoria, '') || ' ' || coalesce(sku, '')),
              'áéíóúàèìòùäëïöüâêîôûñ', 'aeiouaeiouaeiouaeioun')
  ) stored;

create index if not exists productos_busqueda_idx on public.productos using gin (busqueda gin_trgm_ops);

comment on table public.productos is
  'Copia del catalogo del cliente, sincronizada desde su tienda. La herramienta de busqueda consulta ESTO y no la tienda: asi hay UNA herramienta para todas las plataformas y lo que cambia por plataforma es solo el sincronizador.';


-- ── 2. Buscar en el catálogo ────────────────────────────────────────────────
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
  v_viejo   timestamptz;
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

  select count(*)::int, min(actualizado_at) into v_n, v_viejo
  from public.productos where company_id = v_company and activo;

  if v_n = 0 then
    -- Que el catálogo esté vacío es una respuesta legítima y distinta de «no
    -- encontré ese producto». El agente tiene que poder decir la verdad.
    return json_build_object('ok', false, 'motivo', 'este negocio todavia no tiene su catalogo cargado');
  end if;

  select coalesce(json_agg(t.x order by t.orden), '[]'::json) into v_hay from (
    select json_build_object(
             'nombre', p.nombre,
             'sku', p.sku,
             'precio', p.precio_cop,
             -- Se devuelve tal cual, incluido el nulo: el agente distingue
             -- «quedan 3», «no quedan» y «no lo sé».
             'existencias', p.existencias,
             'url', p.url,
             'actualizado', p.actualizado_at
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
    -- Para que el agente pueda decir «segun lo ultimo que tengo» en vez de
    -- afirmar una existencia de hace tres semanas como si fuera de ahora.
    'catalogo_al', v_viejo
  );
end;
$fn$;

comment on function public.tf_tool_buscar_catalogo(jsonb) is
  'Busca en el catalogo copiado del cliente. Devuelve precio, existencias y CUANDO se sincronizo: un dato viejo dicho como viejo sirve; dicho como actual, miente.';


-- ── 3. Los pedidos que arma el agente ───────────────────────────────────────
-- Como matricular y recargar, crear un pedido COMPROMETE al negocio. Así que el
-- agente lo deja armado y una persona lo confirma. Un agente que cierra pedidos
-- solo es un agente que compromete inventario que quizá no está.
create table if not exists public.pedidos (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete set null,

  numero      int  not null,
  estado      text not null default 'armado'
                check (estado in ('armado', 'confirmado', 'rechazado', 'entregado')),
  total_cop   numeric,
  nota        text,
  -- Lo que dijo la persona, tal cual. Quien confirma necesita el contexto.
  dicho       text,

  -- El id que le puso la tienda del cliente cuando se creó allá. Nulo mientras
  -- solo exista aquí.
  externo_id  text,

  resuelto_por uuid references auth.users (id) on delete set null,
  resuelto_at timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists pedidos_numero_idx on public.pedidos (company_id, numero);
create index if not exists pedidos_abiertos_idx on public.pedidos (company_id, estado, created_at desc);

create table if not exists public.pedido_lineas (
  id         uuid primary key default gen_random_uuid(),
  pedido_id  uuid not null references public.pedidos (id) on delete cascade,
  sku        text,
  nombre     text not null,
  cantidad   int  not null default 1 check (cantidad > 0),
  -- El precio del momento en que se armó. Si mañana sube, el pedido sigue
  -- diciendo lo que se le dijo a la persona.
  precio_cop numeric
);

comment on table public.pedidos is
  'Pedidos que el agente deja ARMADOS. Una persona los confirma: crear un pedido compromete inventario y plata, igual que matricular o recargar.';
comment on column public.pedido_lineas.precio_cop is
  'El precio del momento en que se armo. Si mañana sube, el pedido sigue diciendo lo que se le prometio a la persona.';


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
    'que_decir', 'Te dejo armado el pedido numero ' || v_num ||
                 '. Alguien del equipo lo confirma y te avisa.'
  );
end;
$fn$;

comment on function public.tf_tool_crear_pedido(jsonb) is
  'Deja un pedido ARMADO, no confirmado. Los precios salen del catalogo y nunca del modelo: si el agente pudiera ponerlos, quien diga "me dijeron que valia 10.000" acabaria con un pedido a 10.000.';


-- ── 4. En qué va mi pedido ──────────────────────────────────────────────────
create or replace function public.tf_tool_estado_pedido(p_payload jsonb)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_c       public.contacts%rowtype;
  v_num     int := nullif(btrim(coalesce(p_payload->>'numero', '')), '')::int;
  v_hay     json;
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

  -- Solo SUS pedidos. Que alguien pregunte por el número 3 no le da derecho a
  -- ver el pedido número 3 de otra persona.
  select coalesce(json_agg(json_build_object(
           'numero', p.numero, 'estado', p.estado, 'total', p.total_cop,
           'cuando', p.created_at, 'nota', p.nota
         ) order by p.created_at desc), '[]'::json) into v_hay
  from public.pedidos p
  where p.company_id = v_company and p.contact_id = v_c.id
    and (v_num is null or p.numero = v_num);

  if json_array_length(v_hay) = 0 then
    return json_build_object('ok', true, 'tiene', false,
      'motivo', case when v_num is null then 'no tiene pedidos'
                     else 'no tiene ningun pedido con ese numero' end);
  end if;

  return json_build_object('ok', true, 'tiene', true, 'pedidos', v_hay);
end;
$fn$;

comment on function public.tf_tool_estado_pedido(jsonb) is
  'Los pedidos de quien escribe. Solo los SUYOS: preguntar por el numero 3 no da derecho a ver el pedido 3 de otra persona.';


-- ── 5. La persona confirma ──────────────────────────────────────────────────
create or replace function public.tf_pedido_resolver(
  p_pedido  uuid,
  p_estado  text,
  p_nota    text default null
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
  if p_estado not in ('confirmado', 'rechazado', 'entregado') then
    return json_build_object('ok', false, 'motivo', 'estado invalido');
  end if;

  select * into v_p from public.pedidos where id = p_pedido for update;
  if not found then return json_build_object('ok', false, 'motivo', 'ese pedido no existe'); end if;

  -- Escrito en positivo y con la sesión exigida aparte, por lo mismo que en
  -- `tf_saldo_resolver`: `not (a or b)` con b nulo da nulo, y un IF nulo no se
  -- dispara — dejaba pasar justo a quien no tiene empresa.
  if v_quien is null then
    return json_build_object('ok', false, 'motivo', 'hay que iniciar sesion');
  end if;
  v_mia := public.my_company_id();
  if not (public.is_super_admin() or (v_mia is not null and v_mia = v_p.company_id)) then
    return json_build_object('ok', false, 'motivo', 'ese pedido no es de tu empresa');
  end if;

  if v_p.estado <> 'armado' and p_estado <> 'entregado' then
    return json_build_object('ok', false, 'motivo', 'ese pedido ya se resolvio', 'estado', v_p.estado);
  end if;

  update public.pedidos
     set estado = p_estado, nota = coalesce(p_nota, nota),
         resuelto_por = v_quien, resuelto_at = now()
   where id = p_pedido;

  return json_build_object('ok', true, 'numero', v_p.numero, 'estado', p_estado);
end;
$fn$;

comment on function public.tf_pedido_resolver(uuid, text, text) is
  'Confirma, rechaza o marca entregado un pedido. Es el unico camino por el que un pedido deja de estar "armado".';


-- ── 6. Lo que espera confirmación, para la pantalla ─────────────────────────
drop view if exists public.pedidos_armados;
create view public.pedidos_armados
with (security_invoker = on) as
select
  p.id, p.company_id, p.numero, p.total_cop, p.dicho, p.created_at,
  c.full_name as persona, c.phone as telefono,
  (select count(*)::int from public.pedido_lineas l where l.pedido_id = p.id) as lineas
from public.pedidos p
left join public.contacts c on c.id = p.contact_id
where p.estado = 'armado';

comment on view public.pedidos_armados is
  'Los pedidos que el agente armo y esperan que una persona los confirme.';


-- ── 7. RLS y permisos ───────────────────────────────────────────────────────
alter table public.productos      enable row level security;
alter table public.pedidos        enable row level security;
alter table public.pedido_lineas  enable row level security;

drop policy if exists productos_suyos on public.productos;
create policy productos_suyos on public.productos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists pedidos_suyos on public.pedidos;
create policy pedidos_suyos on public.pedidos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists pedido_lineas_suyas on public.pedido_lineas;
create policy pedido_lineas_suyas on public.pedido_lineas
  for select to authenticated
  using (exists (select 1 from public.pedidos p where p.id = pedido_id
                   and (public.is_super_admin() or p.company_id = public.my_company_id())));

grant select on public.productos, public.pedidos, public.pedido_lineas, public.pedidos_armados to authenticated;

revoke all on function public.tf_tool_buscar_catalogo(jsonb) from public, anon, authenticated;
revoke all on function public.tf_tool_crear_pedido(jsonb)    from public, anon, authenticated;
revoke all on function public.tf_tool_estado_pedido(jsonb)   from public, anon, authenticated;
revoke all on function public.tf_pedido_resolver(uuid, text, text) from public, anon, authenticated;
grant execute on function public.tf_pedido_resolver(uuid, text, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_buscar_catalogo(jsonb) to n8n_worker;
    grant execute on function public.tf_tool_crear_pedido(jsonb)    to n8n_worker;
    grant execute on function public.tf_tool_estado_pedido(jsonb)   to n8n_worker;
    -- El sincronizador escribe el catalogo; nadie mas.
    grant select, insert, update on public.productos to n8n_worker;
    grant select on public.pedidos, public.pedido_lineas to n8n_worker;
  end if;
end $$;


-- ── 8. El catálogo de ToqueFlow ─────────────────────────────────────────────
update public.catalogo set
  estado = 'funcionando',
  entrada = '{"type":"object","required":["que"],"properties":{
      "que":{"type":"string","description":"Que esta buscando la persona, en sus palabras."},
      "cuantos":{"type":"integer","description":"Cuantos resultados traer. Por defecto 5."}
    }}'::jsonb
where clave = 'buscar-catalogo';

update public.catalogo set
  estado = 'funcionando',
  entrada = '{"type":"object","required":["items"],"properties":{
      "items":{"type":"array","description":"Lo que va en el pedido.","items":{"type":"object","properties":{
        "sku":{"type":"string","description":"El sku EXACTO que devolvio buscar-catalogo."},
        "cantidad":{"type":"integer"}}}},
      "dicho":{"type":"string","description":"Lo que dijo la persona, tal cual."}
    }}'::jsonb
where clave = 'crear-pedido';

update public.catalogo set
  estado = 'funcionando',
  entrada = '{"type":"object","properties":{
      "numero":{"type":"string","description":"El numero del pedido, si lo dijo. Sin el se devuelven todos los suyos."}
    }}'::jsonb
where clave = 'estado-pedido';

-- Sin liberar todavia: las funciones existen y estan probadas, pero el agente
-- no las puede llamar hasta que sus workflows esten en n8n. Y el paquete no
-- sirve a nadie hasta que exista el sincronizador de al menos una plataforma.
update public.catalogo set liberado = false
where clave in ('buscar-catalogo', 'crear-pedido', 'estado-pedido');
