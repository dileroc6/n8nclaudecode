-- ============================================================================
-- ToqueFlow — Encender y apagar los avisos de un cliente desde la consola
-- ----------------------------------------------------------------------------
-- La tabla `vigilancia_ignorar` ya existía, pero solo se podía tocar con SQL.
-- Y eso convierte una decisión de operación —«a este no me avises mientras lo
-- arreglo»— en una tarea de programador, que es como se termina no haciéndola
-- y aguantando el ruido.
--
-- Se silencia por EMPRESA y no por instancia, aunque la tabla sea por
-- instancia: quien mira la consola piensa en clientes, no en nombres de
-- instancia de Evolution. La función traduce.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_vigilancia_silenciar(
  p_company   uuid,
  p_silenciar boolean,
  p_motivo    text default null,
  p_hasta     date default null
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_nombre text;
  v_inst   text;
  v_n      int := 0;
begin
  if not public.is_super_admin() then
    return json_build_object('ok', false, 'motivo', 'solo un super admin puede cambiar esto');
  end if;

  select name into v_nombre from public.companies where id = p_company;
  if v_nombre is null then
    return json_build_object('ok', false, 'motivo', 'esa empresa no existe');
  end if;

  -- Todas sus instancias: una empresa puede tener un agente por sede.
  for v_inst in
    select whatsapp_instance from public.agent_config
    where company_id = p_company and whatsapp_instance is not null
  loop
    if p_silenciar then
      insert into public.vigilancia_ignorar (instancia, motivo, hasta, creado_por)
      values (v_inst,
              coalesce(nullif(btrim(coalesce(p_motivo, '')), ''), 'silenciado desde la consola'),
              p_hasta, auth.uid())
      on conflict (instancia) do update
        set motivo = excluded.motivo, hasta = excluded.hasta, creado_por = excluded.creado_por;
    else
      delete from public.vigilancia_ignorar where instancia = v_inst;
    end if;
    v_n := v_n + 1;
  end loop;

  if v_n = 0 then
    return json_build_object('ok', false,
      'motivo', v_nombre || ' no tiene ninguna instancia de WhatsApp configurada');
  end if;

  return json_build_object('ok', true, 'empresa', v_nombre,
    'instancias', v_n, 'silenciado', p_silenciar);
end;
$fn$;

comment on function public.tf_vigilancia_silenciar(uuid, boolean, text, date) is
  'Enciende o apaga los avisos de una empresa desde la consola. Silencia TODAS sus instancias: quien mira la consola piensa en clientes, no en nombres de instancia.';

revoke all on function public.tf_vigilancia_silenciar(uuid, boolean, text, date) from public, anon;
grant execute on function public.tf_vigilancia_silenciar(uuid, boolean, text, date) to authenticated;


-- ── La consola necesita saber quién está silenciado ─────────────────────────
-- Se agrega a `tf_salud()` en vez de crear otra consulta: la pantalla ya la
-- llama, y un dato más en la misma vuelta es gratis.
drop function if exists public.tf_salud();
create or replace function public.tf_salud()
returns table (
  company_id uuid, empresa text, agente_activo boolean,
  hoy int, normal_dia numeric, ultimo_mensaje timestamptz,
  fallos_abiertos int, estado text, detalle text,
  silenciado boolean, silencio_motivo text
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_super boolean := public.is_super_admin();
  v_mia   uuid    := public.my_company_id();
begin
  return query
  with base as (
    select
      co.id, co.name,
      bool_or(coalesce(ac.activo, false)) as activo,
      (select count(*)::int from public.message_log m
        where m.company_id = co.id and m.direction = 'in'
          and m.created_at > now() - interval '24 hours') as hoy,
      (select round(count(*)::numeric / 13, 1) from public.message_log m
        where m.company_id = co.id and m.direction = 'in'
          and m.created_at between now() - interval '14 days' and now() - interval '24 hours') as normal,
      (select max(m.created_at) from public.message_log m
        where m.company_id = co.id and m.direction = 'in') as ultimo,
      (select count(*)::int from public.fallos f
        where f.company_id = co.id and f.visto_at is null) as fallos,
      -- Silenciada si TODAS sus instancias lo están. Con una sola sin
      -- silenciar, sigue avisando: es lo prudente.
      (count(ac.whatsapp_instance) > 0 and count(ac.whatsapp_instance) = count(vi.instancia)) as callada,
      max(vi.motivo) as motivo_silencio
    from public.companies co
    join public.agent_config ac on ac.company_id = co.id
    left join public.vigilancia_ignorar vi
      on vi.instancia = ac.whatsapp_instance and (vi.hasta is null or vi.hasta >= current_date)
    where v_super or co.id = v_mia
    group by co.id, co.name
  )
  select
    b.id, b.name, b.activo, b.hoy, b.normal, b.ultimo, b.fallos,
    case
      when not b.activo then 'apagado'
      when b.ultimo is null then 'sin_estrenar'
      when b.hoy = 0 and b.normal >= 1 then 'callado'
      when b.normal >= 5 and b.hoy > b.normal * 3 then 'pico'
      when b.normal < 5  and b.hoy > 50 then 'pico'
      when b.normal >= 10 and b.hoy < b.normal * 0.25 then 'flojo'
      else 'ok'
    end,
    case
      when not b.activo then 'el agente está apagado'
      when b.ultimo is null then 'está encendido y nunca le ha llegado un mensaje'
      when b.hoy = 0 and b.normal >= 1 then
        'sin mensajes hace ' || greatest(1, extract(day from now() - b.ultimo)::int) || ' día(s); lo normal son ' || b.normal || ' al día'
      when b.normal >= 5 and b.hoy > b.normal * 3 then b.hoy || ' mensajes hoy contra ' || b.normal || ' de costumbre'
      when b.normal < 5 and b.hoy > 50 then b.hoy || ' mensajes hoy, y no suele recibir'
      when b.normal >= 10 and b.hoy < b.normal * 0.25 then 'solo ' || b.hoy || ' hoy; lo normal son ' || b.normal
      else 'andando'
    end,
    b.callada, b.motivo_silencio
  from base b
  order by
    case when not b.activo then 3
         when b.hoy = 0 and (b.ultimo is null or b.normal >= 1) then 0
         else 1 end,
    b.name;
end;
$fn$;

comment on function public.tf_salud() is
  'Como va cada empresa, y si sus avisos estan silenciados. El silencio solo cuenta como averia si el agente esta encendido — asi no hace falta configurar un umbral por cliente.';

revoke all on function public.tf_salud() from public, anon;
grant execute on function public.tf_salud() to authenticated;


-- ── Que un super admin pueda escribir la tabla ──────────────────────────────
drop policy if exists vigilancia_ignorar_admin on public.vigilancia_ignorar;
create policy vigilancia_ignorar_admin on public.vigilancia_ignorar
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
grant select, insert, update, delete on public.vigilancia_ignorar to authenticated;
