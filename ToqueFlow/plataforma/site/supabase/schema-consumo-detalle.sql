-- ============================================================================
-- ToqueFlow — El consumo de IA, con suficiente detalle para decidir
-- ----------------------------------------------------------------------------
-- Un número total no sirve para nada. «FerreteríaYa lleva $13,84» no dice si
-- eso es mucho, si va subiendo, ni por cuál de sus cosas se está yendo.
--
-- Lo que sí sirve para decidir:
--   por qué producto     dónde se está yendo la plata de ese cliente
--   por mes              si va subiendo o bajando
--   por llamada          si el costo unitario cambió (un prompt que engordó)
--   cuánto de su plan    lo que de verdad importa: qué porcentaje de lo que
--                        paga se está yendo en IA
--
-- Idempotente.
-- ============================================================================


-- ── 1. Por producto y por mes ────────────────────────────────────────────────
drop view if exists public.consumo_detalle;
create view public.consumo_detalle
with (security_invoker = on) as
select
  u.company_id,
  co.name                                     as empresa,
  -- `tool` es lo que la pieza escribió al registrar. Se traduce a algo legible
  -- y, cuando corresponde, al nombre del producto del catálogo.
  u.tool,
  coalesce(c.nombre, u.tool)                  as producto,
  u.model,
  date_trunc('month', u.created_at)::date     as mes,
  count(*)::int                               as llamadas,
  sum(u.input_tokens)::bigint                 as tokens_entrada,
  sum(u.output_tokens)::bigint                as tokens_salida,
  sum(u.cost_usd)::numeric(12,5)              as usd,
  -- El costo unitario es el que avisa de un prompt que engordó sin que nadie
  -- se diera cuenta: el total puede subir por volumen, esto no.
  (sum(u.cost_usd) / nullif(count(*), 0))::numeric(12,6) as usd_por_llamada,
  count(*) filter (where u.success is false)::int        as fallidas
from public.ai_usage u
join public.companies co on co.id = u.company_id
-- El nombre del producto sale del catálogo cuando la herramienta coincide con
-- alguna clave conocida. Si no, se muestra tal cual: es mejor un nombre feo
-- que esconder un consumo que nadie sabe de dónde sale.
left join public.catalogo c
       on c.clave = case
            when u.tool like 'agente-atencion%' then 'agente-atencion'
            when u.tool like 'rappi%'           then 'impresion-pedidos'
            when u.tool like 'campana%'         then 'campanas'
            when u.tool like 'vassco%'          then 'retenciones'
            else u.tool
          end
group by u.company_id, co.name, u.tool, c.nombre, u.model, date_trunc('month', u.created_at);

comment on view public.consumo_detalle is
  'Consumo de IA por empresa, producto, modelo y mes. Incluye el costo por llamada, que es lo que avisa de un prompt que engordo.';

grant select on public.consumo_detalle to authenticated;


-- ── 2. Cuánto del plan se está yendo en IA ───────────────────────────────────
-- Es la pregunta que de verdad importa y la que nadie puede responder mirando
-- un total: si un cliente paga $600.000 y consume $50 USD al mes, la IA se está
-- comiendo un tercio de lo que deja.
--
-- La mensualidad vive en `companies.metadata->>'mensualidad_cop'` porque hoy no
-- hay tabla de contratos. Cuando la haya, esto lee de ahí.
alter table public.companies
  add column if not exists metadata jsonb not null default '{}';

comment on column public.companies.metadata is
  'Datos sueltos de la empresa. Por ahora: mensualidad_cop, para poder decir que porcentaje de lo que paga se va en IA.';

drop view if exists public.consumo_vs_plan;
create view public.consumo_vs_plan
with (security_invoker = on) as
select
  co.id                                        as company_id,
  co.name                                      as empresa,
  (co.metadata->>'mensualidad_cop')::numeric   as mensualidad_cop,
  (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u
    where u.company_id = co.id
      and u.created_at >= date_trunc('month', now()))::numeric(12,4) as usd_mes,
  (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u
    where u.company_id = co.id
      and u.created_at >= date_trunc('month', now()) - interval '1 month'
      and u.created_at <  date_trunc('month', now()))::numeric(12,4) as usd_mes_anterior,
  (select coalesce(sum(u.cost_usd), 0) from public.ai_usage u
    where u.company_id = co.id)::numeric(12,4)                       as usd_total,
  (select min(u.created_at) from public.ai_usage u where u.company_id = co.id) as primer_consumo
from public.companies co;

comment on view public.consumo_vs_plan is
  'Consumo del mes contra el anterior y contra lo que paga el cliente. Sin la mensualidad cargada, el porcentaje no se puede calcular y la pantalla lo dice.';

grant select on public.consumo_vs_plan to authenticated;


-- ── 3. Lo que ya se sabe de lo que pagan ─────────────────────────────────────
-- Solo Bejauha paga con certeza. Lo demás se deja vacío a propósito: inventar
-- una cifra para que el tablero se vea completo es peor que el hueco.
update public.companies
   set metadata = metadata || jsonb_build_object('mensualidad_cop', 620000)
 where slug = 'bejauha';
