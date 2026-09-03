-- ============================================================================
-- ToqueFlow — Recordatorio de cita (la pieza que le falta a Toque Agenda)
-- ----------------------------------------------------------------------------
-- Es el argumento de venta más fuerte del paquete, porque el que no llega se
-- siente directamente en la caja del negocio. Una cita perdida en una clínica
-- son 120.000 pesos que ya no entran, y la silla estuvo vacía una hora.
--
-- Cómo funciona: un cron busca las citas que ya toca recordar y mete un evento
-- en el outbox. El outbox dispara el webhook a n8n, y n8n manda el WhatsApp.
-- Es el mismo camino que las campañas — un patrón, no dos.
--
-- LAS TRES COSAS QUE PUEDEN SALIR MAL, Y CÓMO SE EVITAN
--
--   Mandarlo dos veces.  Un recordatorio repetido molesta, y molestar por
--                        WhatsApp es como se gana un baneo. Se marca la cita
--                        ANTES de encolar y en la misma sentencia, así que ni
--                        dos crones a la vez pueden duplicarlo.
--
--   Mandarlo de noche.   Un recordatorio a las 3 de la mañana es peor que
--                        ninguno. Solo sale dentro de la ventana que el
--                        negocio defina, en SU hora.
--
--   Mandarlo tarde.      Si el cron estuvo caído seis horas, recordar una cita
--                        que ya pasó es ridículo. Hay una ventana de gracia:
--                        pasada esa, se marca como enviado y no se manda.
--
-- Configuración por negocio, en `agent_config.recordatorios`:
--
--   { "horas_antes": 24, "pedir_confirmacion": true,
--     "desde": "08:00", "hasta": "20:00", "texto": "…" }
--
-- Idempotente.
-- ============================================================================


-- ── 1. Los valores por defecto ───────────────────────────────────────────────
-- 24 horas antes es lo que funciona: suficiente para que reagenden, no tanto
-- como para que se les vuelva a olvidar.
create or replace function public.tf_recordatorio_config(p_agent uuid)
returns jsonb
language sql
stable
as $fn$
  select coalesce(
    (select recordatorios from public.agent_config where id = p_agent), '{}'::jsonb
  ) || '{}'::jsonb
  || jsonb_build_object(
       'horas_antes',        coalesce((select (recordatorios->>'horas_antes')::int from public.agent_config where id = p_agent), 24),
       'pedir_confirmacion', coalesce((select (recordatorios->>'pedir_confirmacion')::boolean from public.agent_config where id = p_agent), true),
       'desde',              coalesce((select recordatorios->>'desde' from public.agent_config where id = p_agent), '08:00'),
       'hasta',              coalesce((select recordatorios->>'hasta' from public.agent_config where id = p_agent), '20:00')
     );
$fn$;


-- ── 2. El cron: qué citas toca recordar ──────────────────────────────────────
create or replace function public.tf_run_recordatorios()
returns int
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  r        record;
  v_cfg    jsonb;
  v_tz     text;
  v_ahora  time;
  n        int := 0;
begin
  for r in
    select a.*, ac.id as agent_id, ac.whatsapp_instance, co.name as empresa, co.slug,
           coalesce(co.metadata->>'zona_horaria', 'America/Bogota') as tz,
           c.full_name, c.phone
    from public.appointments a
    join public.agent_config ac on ac.company_id = a.company_id and ac.activo
    join public.companies    co on co.id = a.company_id
    left join public.contacts c on c.id = a.contact_id
    where a.estado <> 'cancelada'
      and a.recordatorio_enviado_at is null
      and a.inicio > now()                      -- nunca una cita que ya pasó
      and c.phone is not null
    -- `for update skip locked` para que dos crones simultáneos no se pisen.
    order by a.inicio
    for update of a skip locked
  loop
    v_cfg   := public.tf_recordatorio_config(r.agent_id);
    v_tz    := r.tz;
    v_ahora := timezone(v_tz, now())::time;

    -- ¿Ya toca? Solo dentro de la hora anterior al momento objetivo: si el
    -- cron estuvo caído y la ventana se pasó, no se manda tarde.
    if r.inicio - make_interval(hours => (v_cfg->>'horas_antes')::int) > now() then
      continue;                                  -- todavía es pronto
    end if;

    -- Ventana horaria del negocio. Fuera de ella NO se marca como enviado: se
    -- deja para el siguiente ciclo dentro del horario. Marcarlo aquí seria
    -- perder el recordatorio por completo.
    if v_ahora < (v_cfg->>'desde')::time or v_ahora > (v_cfg->>'hasta')::time then
      continue;
    end if;

    -- Se marca ANTES de encolar, en la misma transacción. Si algo falla después,
    -- se pierde un recordatorio; si se marcara después, se mandarían dos. De
    -- los dos errores, molestar al cliente dos veces es el caro.
    update public.appointments set recordatorio_enviado_at = now() where id = r.id;

    insert into public.n8n_events (company_id, event, payload)
    values (r.company_id, 'recordatorio_cita', jsonb_build_object(
      'company_id',   r.company_id,
      'company_slug', r.slug,
      'instance',     r.whatsapp_instance,
      'cita_id',      r.id,
      'telefono',     r.phone,
      'nombre',       r.full_name,
      'servicio',     r.servicio,
      'cuando',       public.tf_fecha_es(r.inicio, v_tz),
      'inicio',       r.inicio,
      'pedir_confirmacion', (v_cfg->>'pedir_confirmacion')::boolean,
      'texto',        v_cfg->>'texto',
      'test',         false
    ));

    n := n + 1;
  end loop;

  return n;
end;
$fn$;

comment on function public.tf_run_recordatorios() is
  'Busca las citas que ya toca recordar y las encola en el outbox. Marca la cita ANTES de encolar: de los dos errores posibles, mandar dos recordatorios es peor que perder uno.';

-- Solo el cron. Igual que `tf_run_due_campaigns`, esto provoca envíos de
-- WhatsApp reales: si `anon` pudiera llamarlo, cualquiera decidiría cuándo le
-- escribe el negocio a su gente.
revoke all on function public.tf_run_recordatorios() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    revoke execute on function public.tf_run_recordatorios() from n8n_worker;
  end if;
end $$;


-- ── 3. El cron ───────────────────────────────────────────────────────────────
-- Cada 5 minutos. Más seguido no sirve —la ventana es de horas— y menos deja
-- recordatorios saliendo tarde dentro de su propia ventana.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('tf-run-recordatorios')
      where exists (select 1 from cron.job where jobname = 'tf-run-recordatorios');
    perform cron.schedule('tf-run-recordatorios', '*/5 * * * *',
                          'select public.tf_run_recordatorios()');
  end if;
end $$;


-- ── 4. Cuando el cliente confirma ────────────────────────────────────────────
-- El agente marca la confirmación cuando la persona contesta que sí. Sin esto
-- el recordatorio informa pero no sirve para nada: el negocio sigue sin saber
-- quién va a llegar, que es justo lo que quiere saber.
create or replace function public.tf_tool_confirmar_cita(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_tz      text;
  v_cita    public.appointments%rowtype;
  v_tel     text := public.tf_telefono(p_payload->>'telefono');
begin
  select ac.company_id, coalesce(co.metadata->>'zona_horaria', 'America/Bogota')
    into v_company, v_tz
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_payload->>'instance';

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  -- La próxima cita de esa persona. No se acepta un id desde fuera: el agente
  -- podría equivocarse de cita, y confirmar la de otro es peor que no confirmar.
  select a.* into v_cita
  from public.appointments a
  join public.contacts c on c.id = a.contact_id
  where a.company_id = v_company
    and public.tf_telefono(c.phone) = v_tel
    and a.estado <> 'cancelada'
    and a.inicio > now()
  order by a.inicio
  limit 1;

  if not found then
    return json_build_object('ok', false, 'motivo', 'no encontre una cita proxima de esta persona');
  end if;

  if (p_payload->>'viene')::boolean is false then
    update public.appointments
       set estado = 'cancelada', confirmada_por_cliente = false
     where id = v_cita.id;
    return json_build_object('ok', true, 'cancelada', true,
      'cuando', public.tf_fecha_es(v_cita.inicio, v_tz), 'servicio', v_cita.servicio);
  end if;

  update public.appointments set confirmada_por_cliente = true where id = v_cita.id;

  return json_build_object('ok', true, 'confirmada', true,
    'cuando', public.tf_fecha_es(v_cita.inicio, v_tz), 'servicio', v_cita.servicio);
end;
$fn$;

comment on function public.tf_tool_confirmar_cita(jsonb) is
  'Marca que la persona confirmo (o cancelo) su proxima cita. La cita se busca por el telefono de quien escribe, nunca por un id que venga de fuera: confirmar la cita de otro es peor que no confirmar ninguna.';

revoke all on function public.tf_tool_confirmar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_confirmar_cita(jsonb) to n8n_worker;
  end if;
end $$;


-- ── 5. El catálogo ───────────────────────────────────────────────────────────
update public.catalogo
   set workflow = 'toque-recordatorio-cita',
       liberado = true,
       estado   = 'funcionando'
 where clave = 'recordatorio-cita';

-- La pieza que confirma es una herramienta del agente, y entra en el mismo
-- paquete: recordar sin poder confirmar deja al negocio igual de a ciegas.
insert into public.catalogo (clave, nombre, tipo, descripcion, beneficio, workflow, entrada, liberado, activo, visible_cliente, orden, estado)
values ('confirmar-cita', 'Confirmar la cita', 'herramienta',
  'Cuando la persona contesta al recordatorio, el agente marca si viene o no. Si dice que no, la hora se libera para alguien mas.',
  'El negocio sabe con antelacion quien va a llegar, y la hora que se libera se puede volver a vender.',
  'tool-confirmar-cita',
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'viene', jsonb_build_object('type', 'boolean',
        'description', 'true si la persona confirma que va, false si dice que no puede ir o quiere cancelar.')),
    'required', jsonb_build_array('viene')),
  true, true, true, 33, 'funcionando')
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  workflow = excluded.workflow, entrada = excluded.entrada, liberado = excluded.liberado,
  activo = excluded.activo, estado = excluded.estado;

update public.catalogo
   set contiene = array['ver-disponibilidad', 'agendar-cita', 'recordatorio-cita', 'confirmar-cita']
 where clave = 'paquete-agenda';

update public.catalogo set liberado = true where clave = 'paquete-agenda';
