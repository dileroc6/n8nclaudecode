-- ============================================================================
-- ToqueFlow — Los huecos de los próximos días
-- ----------------------------------------------------------------------------
-- Una hora libre en una agenda no se vende dos veces: si mañana a las 4 no
-- entra nadie, esa hora no se recupera nunca. Y es la pérdida más silenciosa
-- que tiene un negocio con agenda, porque no aparece en ningún lado — nadie
-- factura un hueco, así que nadie lo mira.
--
-- `tf_agenda_libre` ya sabe qué horas están libres: es la definición única que
-- usan el agente y el portal. Lo que falta no es el dato, es la LECTURA:
-- mañana está medio vacío y hoy es el último día para hacer algo.
--
-- Esto agrupa esas horas por día y dice qué tan vacío está cada uno. Con eso
-- el portal puede avisar en vez de esperar a que alguien entre a mirar.
--
-- POR QUÉ NO MANDA SOLO
--
-- Detectar es barato y no se equivoca; escribirle a cuarenta personas porque
-- un cálculo vio un día flojo es como se gana un baneo de WhatsApp. La
-- detección avisa y deja armada la campaña; darle a enviar sigue siendo de una
-- persona. Es la misma regla del `confirmar_envio`.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_huecos_pronto(
  p_company  uuid,
  p_dias     int  default 3,
  p_servicio text default null
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_tz      text;
  v_libre   json;
  v_dias    json;
  v_cands   int;
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;

  v_tz := public.tf_zona(p_company);

  -- La misma definición de «libre» que usa el agente cuando ofrece una hora.
  -- Calcularlo aquí otra vez es como se termina avisando de un hueco que en
  -- realidad estaba ocupado.
  select (public.tf_agenda_libre(p_company, p_servicio,
            greatest(coalesce(p_dias, 3), 1), now())) -> 'huecos'
    into v_libre;

  -- Agrupado por día de PARED del negocio: «mañana» es mañana allá.
  select coalesce(json_agg(d order by d.fecha), '[]'::json) into v_dias
  from (
    select
      to_char(timezone(v_tz, (h->>'inicio')::timestamptz), 'YYYY-MM-DD') as fecha,
      -- En español, y sin depender del idioma del servidor.
      (array['domingo','lunes','martes','miércoles','jueves','viernes','sábado'])[
        extract(dow from timezone(v_tz, (h->>'inicio')::timestamptz))::int + 1] as dia,
      count(*)::int                           as huecos,
      sum((h->>'libres')::int)::int           as cupos_libres,
      min(to_char(timezone(v_tz, (h->>'inicio')::timestamptz), 'HH24:MI')) as primera,
      max(to_char(timezone(v_tz, (h->>'inicio')::timestamptz), 'HH24:MI')) as ultima
    from json_array_elements(coalesce(v_libre, '[]'::json)) h
    group by 1, 2
  ) d;

  -- A cuánta gente se le podría ofrecer. Sin este número, «tienes 6 huecos
  -- mañana» no le dice al negocio si puede hacer algo al respecto.
  select count(*)::int into v_cands
  from public.contacts c
  where c.company_id = p_company
    and nullif(btrim(coalesce(c.phone, '')), '') is not null
    and not exists (
      select 1 from public.appointments a
      where a.contact_id = c.id and a.estado <> 'cancelada' and a.inicio > now())
    and not exists (
      select 1 from public.outreach_optouts o
      where o.company_id = p_company
        and public.tf_telefono(o.phone) = public.tf_telefono(c.phone));

  return json_build_object(
    'ok', true, 'zona', v_tz, 'dias', v_dias,
    'hoy', to_char(timezone(v_tz, now()), 'YYYY-MM-DD'),
    'a_quien_ofrecer', v_cands);
end;
$fn$;

comment on function public.tf_huecos_pronto(uuid, int, text) is
  'Las horas libres de los proximos dias, agrupadas por dia del negocio. Una hora libre no se vende dos veces. No manda sola: deja armada la campana y darle a enviar sigue siendo de una persona.';

grant execute on function public.tf_huecos_pronto(uuid, int, text) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_huecos_pronto(uuid, int, text) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_huecos_pronto(uuid, int, text) from public, anon;
