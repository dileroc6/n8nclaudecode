-- ============================================================================
-- ToqueFlow — Mover la cita, no cancelarla
-- ----------------------------------------------------------------------------
-- El hueco que destapó el lead de clínicas de Workana. Su «Blindaje de Agenda»
-- pide confirmaciones, recordatorios, **cambios** y cancelaciones. Teníamos
-- tres de cuatro.
--
-- Y el que faltaba es el que más plata mueve. Lo primero que contesta alguien a
-- un recordatorio no es «sí» ni «no»:
--
--     «no puedo el jueves, ¿me lo pasas al viernes?»
--
-- Hoy el agente lo trata como cancelación. El paciente se queda sin cita, la
-- clínica pierde un ingreso que YA TENÍA, y encima la persona tiene que volver
-- a escribir para agendar. Es peor que no ofrecer la función.
--
-- Mover una cita no es cancelar y crear: es una sola operación que tiene que
-- ser atómica. Si se cancelara primero y la hora nueva estuviera ocupada, la
-- persona se queda sin ninguna de las dos — el peor final posible.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_tool_reagendar_cita(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company  uuid;
  v_tz       text;
  v_tel      text := public.tf_telefono(p_payload->>'telefono');
  v_cita     public.appointments%rowtype;
  v_srv      public.agenda_servicios%rowtype;
  v_nuevo    timestamptz;
  v_fin      timestamptz;
  v_cupos    int;
  v_tomados  int;
  v_antes    text;
begin
  select ac.company_id, coalesce(co.metadata->>'zona_horaria', 'America/Bogota')
    into v_company, v_tz
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_payload->>'instance';

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  -- La cita se busca por el teléfono de quien escribe. Igual que al confirmar:
  -- no se acepta un id de fuera, porque mover la cita de otro es peor que no
  -- mover ninguna.
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
    return json_build_object('ok', false,
      'motivo', 'no encontre una cita proxima de esta persona para mover');
  end if;

  v_antes := public.tf_fecha_es(v_cita.inicio, v_tz);

  begin
    v_nuevo := (p_payload->>'nuevo_inicio')::timestamptz;
  exception when others then
    return json_build_object('ok', false, 'motivo', 'no entendi la fecha y hora nueva',
      'cita_actual', v_antes);
  end;

  if v_nuevo is null then
    return json_build_object('ok', false, 'motivo', 'falta la fecha y hora nueva',
      'cita_actual', v_antes);
  end if;
  if v_nuevo < now() then
    return json_build_object('ok', false, 'motivo', 'esa hora ya paso',
      'cita_actual', v_antes);
  end if;

  -- Dura lo mismo que el servicio que ya tenía: mover una cita no la cambia de
  -- servicio. Si quiere otra cosa, eso es una cita nueva.
  select * into v_srv from public.agenda_servicios
  where company_id = v_company and lower(nombre) = lower(coalesce(v_cita.servicio, ''));

  v_fin := v_nuevo + make_interval(mins => coalesce(v_srv.minutos,
             (extract(epoch from (v_cita.fin - v_cita.inicio)) / 60)::int));

  -- El mismo candado que al agendar. Entre lo que el agente ofrece y lo que
  -- escribe cabe otra cita.
  perform pg_advisory_xact_lock(hashtextextended(v_company::text, 0));

  select f.cupos into v_cupos
  from public.agenda_franjas f
  where f.company_id = v_company
    and f.activa
    and extract(dow from timezone(v_tz, v_nuevo))::int = f.dia
    and timezone(v_tz, v_nuevo)::time >= f.desde
    and timezone(v_tz, v_fin)::time    <= f.hasta
  limit 1;

  if v_cupos is null then
    return json_build_object('ok', false, 'motivo', 'a esa hora el negocio no atiende',
      'cita_actual', v_antes);
  end if;

  if exists (
    select 1 from public.agenda_bloqueos b
    where b.company_id = v_company and b.desde < v_fin and b.hasta > v_nuevo
  ) then
    return json_build_object('ok', false, 'motivo', 'ese dia el negocio esta cerrado',
      'cita_actual', v_antes);
  end if;

  -- Los cupos tomados EXCLUYENDO esta misma cita: si no, moverla una hora
  -- dentro de su propia franja se bloquearía a sí misma.
  select coalesce(sum(coalesce(sv.ocupa, 1))::int, 0) into v_tomados
  from public.appointments a
  left join public.agenda_servicios sv
    on sv.company_id = a.company_id and lower(sv.nombre) = lower(a.servicio)
  where a.company_id = v_company
    and a.id <> v_cita.id
    and a.estado <> 'cancelada'
    and a.inicio < v_fin and a.fin > v_nuevo;

  if v_tomados + coalesce(v_srv.ocupa, 1) > v_cupos then
    return json_build_object('ok', false, 'motivo', 'esa hora esta ocupada',
      'cita_actual', v_antes,
      'sugerencia', 'ofrecele otra hora de las que quedan libres');
  end if;

  -- Un solo UPDATE. Nunca se cancela y se vuelve a crear: si la hora nueva
  -- fallara a mitad, la persona se quedaria sin ninguna de las dos.
  update public.appointments
     set inicio = v_nuevo,
         fin    = v_fin,
         -- Se movió: lo que había confirmado era la otra hora, y el
         -- recordatorio de la nueva todavía no ha salido.
         confirmada_por_cliente  = null,
         recordatorio_enviado_at = null,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
           'movida_desde', v_cita.inicio, 'movida_at', now())
   where id = v_cita.id;

  return json_build_object(
    'ok', true,
    'movida', true,
    'cita_id', v_cita.id,
    'servicio', v_cita.servicio,
    'antes', v_antes,
    'ahora', public.tf_fecha_es(v_nuevo, v_tz)
  );
end;
$fn$;

comment on function public.tf_tool_reagendar_cita(jsonb) is
  'Mueve la proxima cita de quien escribe a otra hora, en un solo UPDATE. Nunca cancela y vuelve a crear: si la hora nueva fallara a mitad, la persona se queda sin ninguna de las dos. La cita se busca por el telefono, nunca por un id de fuera.';

revoke all on function public.tf_tool_reagendar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_reagendar_cita(jsonb) to n8n_worker;
  end if;
end $$;


-- ── El catálogo ──────────────────────────────────────────────────────────────
insert into public.catalogo
  (clave, nombre, tipo, descripcion, beneficio, instruccion, workflow, entrada,
   liberado, activo, visible_cliente, orden, estado)
values (
  'reagendar-cita', 'Mover la cita', 'herramienta',
  'Cuando la persona no puede a la hora que tenia, el agente le mueve la cita a otra en vez de cancelarla.',
  'Una cita que se mueve sigue siendo un ingreso; una que se cancela hay que volver a venderla.',
  -- Para el modelo: cuándo llamarla, y la distinción que importa.
  'ÚSALA EN CUANTO LA PERSONA PIDA CAMBIAR DE HORA una cita que ya tiene — «no puedo el jueves», «¿me lo pasas al viernes?», «se me cruzo». NO uses confirmar_cita para eso: confirmar con «no» CANCELA, y la persona queria mover, no cancelar. Si todavia no te dijo para cuando, preguntale primero y consulta las horas libres.',
  'tool-reagendar-cita',
  jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'nuevo_inicio', jsonb_build_object(
        'type', 'string',
        'description', 'La hora nueva, en formato ISO con la hora de Colombia. Ejemplo: 2026-09-18T15:00:00-05:00. Usa la fecha de HOY que aparece arriba para calcular «el viernes» o «manana». Si no estas seguro, pregunta en vez de adivinar.')),
    'required', jsonb_build_array('nuevo_inicio')),
  true, true, true, 34, 'funcionando')
on conflict (clave) do update set
  nombre = excluded.nombre, descripcion = excluded.descripcion,
  beneficio = excluded.beneficio, instruccion = excluded.instruccion,
  workflow = excluded.workflow, entrada = excluded.entrada,
  liberado = excluded.liberado, activo = excluded.activo, estado = excluded.estado;


-- Entra en Toque Agenda: mover una cita es parte de gestionarla, no un pin
-- aparte. Quien compró el pin la hereda sin que nadie toque su configuración —
-- para eso los paquetes se expanden al usar y no al contratar.
update public.catalogo
   set contiene = array['ver-disponibilidad', 'agendar-cita', 'recordatorio-cita',
                        'confirmar-cita', 'reagendar-cita']
 where clave = 'paquete-agenda';
