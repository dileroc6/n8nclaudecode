-- ============================================================================
-- ToqueFlow — Qué se vende de verdad, y cómo se llaman los estados
-- ----------------------------------------------------------------------------
-- Tres correcciones que salieron de mirar el catálogo con ojos de vendedor y no
-- de programador.
--
-- 1. NO TODOS LOS «PRODUCTOS» SE VENDEN. De los nueve, dos vienen con la
--    plataforma y nadie los compra aparte: el Portal y el Simulador. Contarlos
--    como productos hace que un cliente con una sola cosa contratada aparezca
--    con tres, y eso hace que el número no sirva para nada.
--
-- 2. «PROMETIDO» NO SE ENTIENDE. El estado sale de `flows.status =
--    'próximamente'`, que es LITERALMENTE lo que el cliente ve escrito en su
--    panel. Llamarlo de otra forma en la consola obliga a traducir mentalmente.
--    Se llama igual que lo que ve el cliente.
--
-- 3. BEJAUHA TENÍA EL AGENTE CONFIGURADO Y NO APARECÍA COMO PRODUCTO. Su
--    `agent_config` existe, con conocimiento cargado y el agente respondiendo en
--    el sandbox — pero no había fila en `flows`, así que la matriz decía que no
--    lo tiene. Configurar el agente de alguien y que el sistema no lo cuente
--    como cliente de ese producto es justo el tipo de desajuste que hace que un
--    tablero deje de creerse.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Lo que se vende aparte y lo que viene incluido ────────────────────────
alter table public.catalogo
  add column if not exists vendible boolean not null default true;

comment on column public.catalogo.vendible is
  'Si se cotiza aparte. false = viene con la plataforma y lo tiene todo el mundo (Portal, Simulador). Sirve para que "cuántos productos tiene este cliente" signifique algo.';

update public.catalogo set vendible = false where clave in ('portal', 'sandbox');


-- ── 2. Bejauha sí tiene Toque Atiende ────────────────────────────────────────
-- Queda como «próximamente» y no como activo, que es la verdad: el agente
-- funciona en el sandbox pero todavía no atiende un WhatsApp real.
insert into public.flows (company_id, catalogo_id, name, description, status, type, kind)
select co.id, ca.id, ca.nombre, ca.beneficio, 'próximamente', ca.tipo, ca.clave
from public.companies co
cross join public.catalogo ca
where co.slug = 'bejauha'
  and ca.clave = 'agente-atencion'
  and not exists (
    select 1 from public.flows f
    where f.company_id = co.id and f.catalogo_id = ca.id
  );


-- ── 3. La vista, con el estado dicho como lo ve el cliente ───────────────────
drop view if exists public.empresa_catalogo;
create view public.empresa_catalogo
with (security_invoker = on) as
select
  co.id    as company_id,
  co.name  as empresa,
  ca.id    as catalogo_id,
  ca.clave,
  ca.tipo,
  ca.nombre,
  ca.descripcion,
  ca.beneficio,
  ca.estado   as estado_pieza,
  ca.visible_cliente,
  ca.vendible,
  ca.orden,
  coalesce(f.veces, 0)          as veces,
  coalesce(f.ids, '{}'::uuid[]) as flow_ids,
  f.nombres                     as nombres_para_el_cliente,
  -- Ojo con la condición: un `count(*)` sin `group by` dentro de un `lateral`
  -- SIEMPRE devuelve una fila, con cero. Nunca null. Comprobarlo con `is null`
  -- hacía que las 88 celdas salieran encendidas.
  case
    when coalesce(f.veces, 0) = 0 then 'no'
    when f.alguno_activo          then 'activo'
    else                               'proximamente'
  end as estado_empresa
from public.companies co
cross join public.catalogo ca
-- `lateral` y no un join simple: una empresa puede tener la MISMA pieza varias
-- veces —FerreteríaYa imprime pedidos de Rappi en Bogotá y en Medellín— y con
-- un join normal esa empresa aparecía dos veces en la misma casilla.
left join lateral (
  select count(*)::int                       as veces,
         array_agg(fl.id)                    as ids,
         array_agg(fl.name order by fl.name)  as nombres,
         bool_or(fl.status = 'activo')        as alguno_activo
  from public.flows fl
  where fl.company_id = co.id and fl.catalogo_id = ca.id
) f on true
where ca.activo;

comment on view public.empresa_catalogo is
  'La matriz empresa x pieza. estado_empresa usa las mismas palabras que ve el cliente en su panel: activo o proximamente.';

grant select on public.empresa_catalogo to authenticated;


-- ── 4. El resumen que va en la tarjeta de cada empresa ───────────────────────
-- Tres números y nada más: usuarios, productos contratados y lo que lleva
-- gastado en IA. Es lo que hay que saber para decidir a quién mirar.
drop view if exists public.empresa_resumen;
create view public.empresa_resumen
with (security_invoker = on) as
select
  co.id   as company_id,
  co.name as empresa,
  co.slug,
  co.status,
  co.created_at,
  (select count(*)::int from public.profiles p where p.company_id = co.id)               as usuarios,
  -- Solo lo VENDIBLE: contar el Portal y el Simulador haría que todos parezcan
  -- tener tres productos aunque no hayan contratado ninguno.
  (select count(distinct f.catalogo_id)::int
     from public.flows f join public.catalogo c2 on c2.id = f.catalogo_id
    where f.company_id = co.id and c2.vendible and f.status = 'activo')                  as productos_activos,
  (select count(distinct f.catalogo_id)::int
     from public.flows f join public.catalogo c2 on c2.id = f.catalogo_id
    where f.company_id = co.id and c2.vendible and f.status <> 'activo')                 as productos_proximamente,
  (select coalesce(sum(u.cost_usd), 0)::numeric(12,4) from public.ai_usage u where u.company_id = co.id) as ia_usd,
  (select coalesce(sum(u.cost_usd), 0)::numeric(12,4) from public.ai_usage u
    where u.company_id = co.id and u.created_at >= date_trunc('month', now()))           as ia_usd_mes
from public.companies co;

comment on view public.empresa_resumen is
  'Los tres numeros de la tarjeta de una empresa: usuarios, productos contratados y consumo de IA. Solo cuenta productos vendibles.';

grant select on public.empresa_resumen to authenticated;
