-- ============================================================================
-- ToqueFlow — Quién vino y quién no
-- ----------------------------------------------------------------------------
-- La tabla `appointments` acepta 'asistio' y 'no_asistio' desde que existe, y
-- NADIE los pone nunca. Todas las citas del mundo se quedan en 'confirmada'
-- para siempre, así que la pregunta más cara de una clínica —«¿cuánta gente me
-- deja plantado?»— no tiene respuesta, y no se le puede escribir a quien faltó
-- porque no hay forma de saber quién faltó.
--
-- LO QUE ESTO NO HACE, A PROPÓSITO
--
-- No marca solo. La plataforma no tiene manera de saber si alguien entró por
-- la puerta: nadie hace check-in, el agente no está en la sala. Dar por
-- asistida una cita porque pasó la hora sería inventarse un dato, y el dato
-- inventado después sale en un informe como si fuera cierto.
--
-- Lo que hace es preguntar. `tf_citas_por_marcar` es la lista de «esto ya
-- pasó, ¿vino?», y es lo que la pantalla de agenda le pone al negocio encima.
-- Dos clics por cita, y a cambio el seguimiento de plantados existe.
--
-- Idempotente.
-- ============================================================================

-- ── Lo que ya pasó y nadie ha dicho si vino ─────────────────────────────────
-- Se mira una ventana, no toda la historia: si alguien no entró al portal en
-- tres meses, lo que necesita es empezar de hoy, no una lista de 400 citas que
-- nunca va a terminar de marcar.
create or replace function public.tf_citas_por_marcar(
  p_company uuid,
  p_dias    int default 14
)
returns table (
  id        uuid,
  contacto  text,
  telefono  text,
  servicio  text,
  inicio    timestamptz,
  cuando    text,
  estado    text
)
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare v_tz text;
begin
  if not public.tf_es_mia(p_company) then
    return;
  end if;
  v_tz := public.tf_zona(p_company);

  return query
  select a.id,
         coalesce(c.full_name, 'Sin nombre'),
         c.phone,
         a.servicio,
         a.inicio,
         -- En la hora de pared del negocio, que es la única que le sirve para
         -- reconocer la cita.
         to_char(timezone(v_tz, a.inicio), 'DD/MM HH24:MI'),
         a.estado
  from public.appointments a
  left join public.contacts c on c.id = a.contact_id
  where a.company_id = p_company
    and a.estado in ('propuesta', 'confirmada')
    and a.fin <= now()
    and a.fin >= now() - make_interval(days => greatest(coalesce(p_dias, 14), 1))
  order by a.inicio desc;
end;
$fn$;

comment on function public.tf_citas_por_marcar(uuid, int) is
  'Las citas que ya pasaron y nadie dijo si la persona vino. No marca sola: la plataforma no puede saber si alguien entro por la puerta, y un dato inventado despues sale en un informe como si fuera cierto.';


-- ── Decir si vino o no ──────────────────────────────────────────────────────
create or replace function public.tf_marcar_asistencia(
  p_cita uuid,
  p_vino boolean
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare v_a public.appointments%rowtype;
begin
  select * into v_a from public.appointments where id = p_cita;
  if not found then
    return json_build_object('ok', false, 'motivo', 'esa cita no existe');
  end if;

  -- La cita se comprueba contra QUIEN pregunta. Sin esto, cualquiera con una
  -- sesion podria marcar las citas de otra empresa — es la misma forma del
  -- agujero que ya aparecio tres veces en este proyecto.
  if not public.tf_es_mia(v_a.company_id) then
    return json_build_object('ok', false, 'motivo', 'esa cita no es tuya');
  end if;

  if p_vino is null then
    return json_build_object('ok', false, 'motivo', 'hay que decir si vino o no');
  end if;

  -- Una cita cancelada no se marca: nadie falto, se avisó. Mezclarlas
  -- convierte «me deja plantado el 20%» en un numero que no significa nada.
  if v_a.estado = 'cancelada' then
    return json_build_object('ok', false, 'motivo', 'esa cita estaba cancelada, no es un plantón');
  end if;

  -- Y una que todavia no ha pasado tampoco: marcarla es adivinar.
  if v_a.fin > now() then
    return json_build_object('ok', false, 'motivo', 'esa cita todavía no ha pasado');
  end if;

  update public.appointments
     set estado = case when p_vino then 'asistio' else 'no_asistio' end,
         updated_at = now()
   where id = p_cita;

  return json_build_object('ok', true, 'estado',
    case when p_vino then 'asistio' else 'no_asistio' end);
end;
$fn$;

comment on function public.tf_marcar_asistencia(uuid, boolean) is
  'Deja dicho si la persona vino a su cita. Rechaza las canceladas (nadie falto, se aviso) y las que no han pasado (marcarlas es adivinar).';


-- ── Cuánto le cuesta al negocio ─────────────────────────────────────────────
-- El número que justifica el seguimiento: sin esto, «te recupero plantones» es
-- una promesa; con esto es una cuenta.
create or replace function public.tf_asistencia_resumen(
  p_company uuid,
  p_dias    int default 30
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare v_asistio int; v_falto int; v_sin int;
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false);
  end if;

  select count(*) filter (where estado = 'asistio'),
         count(*) filter (where estado = 'no_asistio'),
         count(*) filter (where estado in ('propuesta', 'confirmada'))
    into v_asistio, v_falto, v_sin
  from public.appointments
  where company_id = p_company
    and fin <= now()
    and fin >= now() - make_interval(days => greatest(coalesce(p_dias, 30), 1));

  return json_build_object(
    'ok', true, 'dias', p_dias,
    'asistio', v_asistio, 'falto', v_falto, 'sin_marcar', v_sin,
    -- Solo sobre las marcadas. Contar las sin marcar como asistidas hace que
    -- el porcentaje mejore justo cuando el negocio deja de marcar.
    'porcentaje_planton', case when (v_asistio + v_falto) > 0
      then round(v_falto * 100.0 / (v_asistio + v_falto)) else null end);
end;
$fn$;


grant execute on function public.tf_citas_por_marcar(uuid, int)       to authenticated;
grant execute on function public.tf_marcar_asistencia(uuid, boolean)  to authenticated;
grant execute on function public.tf_asistencia_resumen(uuid, int)     to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_citas_por_marcar(uuid, int)      to n8n_worker;
    grant execute on function public.tf_marcar_asistencia(uuid, boolean) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_citas_por_marcar(uuid, int)      from public, anon;
revoke execute on function public.tf_marcar_asistencia(uuid, boolean) from public, anon;
revoke execute on function public.tf_asistencia_resumen(uuid, int)    from public, anon;
