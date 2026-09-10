-- ============================================================================
-- ToqueFlow — Cuánto paga cada cliente, y cuánto de eso se come la IA
-- ----------------------------------------------------------------------------
-- `consumo_vs_plan` ya decía cuánto gasta cada empresa en IA. Lo que no podía
-- decir es qué PORCENTAJE de lo que paga se va en eso, porque la mensualidad
-- vive en `companies.metadata->>'mensualidad_cop'`: un número escrito a mano
-- que hoy solo tiene Bejauha. Con los demás en nulo, el margen no se puede
-- mirar — y el margen es la pregunta que decide si esto es negocio.
--
-- Ya no hace falta escribirlo: desde el 8-sep el catálogo tiene `precio_cop` y
-- `flows` dice qué tiene encendido cada empresa. La mensualidad se SUMA.
--
-- LA REGLA, y no es un detalle: si hay un número escrito a mano, ESE MANDA.
-- El catálogo dice el precio de lista; lo que el cliente paga de verdad puede
-- ser otro —Bejauha paga $620.000 y la lista dice $600.000— y para mirar el
-- margen sirve lo que entra, no lo que debería entrar. El calculado rellena
-- donde no hay nada, que es el caso de todos los demás.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Lo que suma lo contratado ─────────────────────────────────────────────
create or replace function public.tf_mensualidad_lista(p_company uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $fn$
  -- Solo lo ACTIVO. Lo prometido todavía no se cobra, y contarlo haría que el
  -- margen se viera mejor de lo que es.
  select coalesce(sum(distinct_precio), 0) from (
    select distinct c.clave, c.precio_cop as distinct_precio
    from public.flows f
    join public.catalogo c on c.id = f.catalogo_id
    where f.company_id = p_company
      and f.status = 'activo'
      and c.precio_cop is not null
  ) t;
$fn$;

comment on function public.tf_mensualidad_lista(uuid) is
  'Lo que costaria al mes lo que esta empresa tiene ENCENDIDO, a precio de lista. Se cuenta cada pieza una vez aunque este en varias sedes: el precio es por pieza, no por sede.';


-- ── 2. La vista, con el margen ya calculado ─────────────────────────────────
drop view if exists public.consumo_vs_plan;
create view public.consumo_vs_plan
with (security_invoker = on) as
select
  co.id   as company_id,
  co.name as empresa,
  -- Lo escrito a mano manda; el calculado rellena.
  coalesce((co.metadata->>'mensualidad_cop')::numeric,
           nullif(public.tf_mensualidad_lista(co.id), 0))  as mensualidad_cop,
  ((co.metadata->>'mensualidad_cop') is not null)          as mensualidad_a_mano,
  public.tf_mensualidad_lista(co.id)                       as mensualidad_lista,
  coalesce(sum(u.cost_usd) filter (
    where u.created_at >= date_trunc('month', now())), 0)  as usd_mes,
  coalesce(sum(u.cost_usd) filter (
    where u.created_at >= date_trunc('month', now()) - interval '1 month'
      and u.created_at <  date_trunc('month', now())), 0)  as usd_mes_anterior,
  coalesce(sum(u.cost_usd), 0)                             as usd_total,
  min(u.created_at)                                        as primer_consumo,
  -- Qué parte de lo que paga se va en IA. Es EL numero: si sube de 15-20% de
  -- forma sostenida, el precio o el modelo estan mal puestos.
  case
    when coalesce((co.metadata->>'mensualidad_cop')::numeric,
                  nullif(public.tf_mensualidad_lista(co.id), 0)) is null then null
    else round(
      (coalesce(sum(u.cost_usd) filter (where u.created_at >= date_trunc('month', now())), 0) * 4200)
      / coalesce((co.metadata->>'mensualidad_cop')::numeric,
                 nullif(public.tf_mensualidad_lista(co.id), 0)) * 100, 1)
  end                                                      as pct_del_plan
from public.companies co
left join public.ai_usage u on u.company_id = co.id
group by co.id, co.name, co.metadata;

comment on view public.consumo_vs_plan is
  'Cuanto paga cada empresa y que parte se va en IA. La mensualidad sale de lo que tiene ENCENDIDO a precio de lista, salvo que haya un numero escrito a mano — ese manda, porque para el margen sirve lo que entra y no lo que deberia entrar. A 4.200 pesos por dolar: es una referencia para dimensionar, no contabilidad.';

grant select on public.consumo_vs_plan to authenticated;
revoke all on function public.tf_mensualidad_lista(uuid) from public, anon;
grant execute on function public.tf_mensualidad_lista(uuid) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_mensualidad_lista(uuid) to n8n_worker;
  end if;
end $$;


-- ── 3. Quién se está pasando ─────────────────────────────────────────────────
-- La llama el vigilante diario. Devuelve solo lo que hay que mirar, para que
-- el correo no traiga a todo el mundo cada dia.
--
-- Los dos umbrales no son simetricos a proposito: al 20% todavia hay negocio y
-- es una conversacion de venta —«se te quedo chico el plan»—; al 40% es un
-- problema tecnico o de precio y hay que mirarlo ya.
create or replace function public.tf_consumo_alerta()
returns table (
  company_id uuid, empresa text, mensualidad numeric,
  usd_mes numeric, pct numeric, nivel text, detalle text
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    v.company_id, v.empresa, v.mensualidad_cop, v.usd_mes, v.pct_del_plan,
    case when v.pct_del_plan >= 40 then 'excedido' else 'cerca' end,
    'la IA lleva ' || v.pct_del_plan || '% de lo que paga este mes ($' ||
      round(v.usd_mes, 2) || ' USD de $' || round(v.mensualidad_cop / 4200, 0) || ' USD)'
  from public.consumo_vs_plan v
  where v.pct_del_plan is not null
    and v.pct_del_plan >= 20
  order by v.pct_del_plan desc;
$fn$;

comment on function public.tf_consumo_alerta() is
  'Las empresas cuya IA se esta comiendo mas del 20% de lo que pagan. Al 20% es una conversacion de venta; al 40% es un problema. Un cliente que se pasa es la mejor señal de venta adicional que hay, y llega sola.';

revoke all on function public.tf_consumo_alerta() from public, anon;
grant execute on function public.tf_consumo_alerta() to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_consumo_alerta() to n8n_worker;
  end if;
end $$;
