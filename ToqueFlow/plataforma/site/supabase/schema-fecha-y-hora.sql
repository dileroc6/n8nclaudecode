-- ============================================================================
-- ToqueFlow — Al modelo se le pide la fecha y la hora, no un timestamp
-- ----------------------------------------------------------------------------
-- Lo destapó la prueba de conversación con una clínica:
--
--   Paciente: «la mía, la de las 10, me la puedes pasar a las 11?»
--   El modelo llamó a la herramienta con:
--       nuevo_inicio = "2026-09-16T16:00:00-05:00"
--       motivo       = "pide cambiar su cita de las 10 a las 11 de la mañana"
--
-- Sabía perfectamente que eran las 11 de la mañana —lo escribió— y mandó las
-- 4 de la tarde. Convirtió a UTC y volvió a marcar el desfase, restándolo dos
-- veces.
--
-- Pedirle a un modelo un ISO con offset es pedirle aritmética de husos, y la
-- hace mal de forma intermitente — que es peor que hacerla mal siempre, porque
-- pasa las pruebas la mitad de las veces.
--
-- **La base sí sabe en qué huso vive el negocio.** Así que el modelo dice lo
-- único que de verdad sabe —«el 16 a las 11:00»— y la conversión la hace quien
-- tiene el dato.
--
-- Se sigue aceptando el ISO por compatibilidad, pero la fecha y la hora mandan.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_momento(
  p_tz    text,
  p_fecha text,
  p_hora  text,
  p_iso   text default null
)
returns timestamptz
language plpgsql
immutable
as $fn$
declare
  v_f date;
  v_h time;
begin
  -- Fecha + hora gana: es lo que el modelo sí sabe decir sin equivocarse.
  if nullif(btrim(coalesce(p_fecha, '')), '') is not null
     and nullif(btrim(coalesce(p_hora, '')), '') is not null then
    begin
      v_f := btrim(p_fecha)::date;
      -- Acepta «9», «9:00», «09:00», «09:00:00».
      v_h := (case when btrim(p_hora) ~ '^[0-9]{1,2}$'
                   then btrim(p_hora) || ':00' else btrim(p_hora) end)::time;
    exception when others then
      return null;
    end;
    -- Aquí está el punto: el huso lo pone la base, no el modelo.
    return timezone(p_tz, (v_f + v_h)::timestamp);
  end if;

  if nullif(btrim(coalesce(p_iso, '')), '') is not null then
    begin
      return p_iso::timestamptz;
    exception when others then
      return null;
    end;
  end if;

  return null;
end;
$fn$;

comment on function public.tf_momento(text, text, text, text) is
  'Convierte «la fecha y la hora que dijo la persona» en un instante, usando el huso del negocio. Existe porque pedirle a un modelo un ISO con offset es pedirle aritmetica de husos: dijo «las 11 de la manana» y mando las 16:00.';

grant execute on function public.tf_momento(text, text, text, text) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_momento(text, text, text, text) to n8n_worker;
  end if;
end $$;


-- ── Lo que se le pide al modelo ──────────────────────────────────────────────
-- `fecha` y `hora` obligatorias. El ISO sigue aceptándose en la función para no
-- romper lo que ya llama así, pero deja de ofrecérsele al modelo: si está en el
-- esquema, lo usa, y vuelve a equivocarse.
update public.catalogo set entrada = jsonb_build_object(
  'type', 'object',
  'properties', jsonb_build_object(
    'servicio', jsonb_build_object('type', 'string',
      'description', 'El servicio, con el nombre exacto del negocio.'),
    'fecha', jsonb_build_object('type', 'string',
      'description', 'El dia de la cita en formato AAAA-MM-DD. Calculalo desde la fecha de HOY que aparece arriba. Ejemplo: 2026-09-16.'),
    'hora', jsonb_build_object('type', 'string',
      'description', 'La hora en formato de 24 horas, HH:MM, TAL COMO LA DICE LA PERSONA en la hora del negocio. Las 11 de la manana son 11:00 y las 3 de la tarde son 15:00. NO conviertas a UTC ni le sumes nada: de eso se encarga el sistema.'),
    'nombre', jsonb_build_object('type', 'string',
      'description', 'Como se llama la persona, si lo dijo.'),
    'notas', jsonb_build_object('type', 'string',
      'description', 'Algo que el negocio deba saber antes de la cita.')),
  'required', jsonb_build_array('servicio', 'fecha', 'hora')
) where clave = 'agendar-cita';

update public.catalogo set entrada = jsonb_build_object(
  'type', 'object',
  'properties', jsonb_build_object(
    'fecha', jsonb_build_object('type', 'string',
      'description', 'El dia nuevo en formato AAAA-MM-DD. Si la persona solo cambia la hora, repite el dia que ya tenia la cita.'),
    'hora', jsonb_build_object('type', 'string',
      'description', 'La hora nueva en formato de 24 horas, HH:MM, TAL COMO LA DICE LA PERSONA en la hora del negocio. Las 11 de la manana son 11:00 y las 3 de la tarde son 15:00. NO conviertas a UTC ni le sumes nada.')),
  'required', jsonb_build_array('fecha', 'hora')
) where clave = 'reagendar-cita';


-- ── Agendar usa el momento ───────────────────────────────────────────────────
create or replace function public.tf_tool_agendar_cita(p_payload jsonb)
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
  v_contact  public.contacts%rowtype;
  v_srv      public.agenda_servicios%rowtype;
  v_inicio   timestamptz;
  v_fin      timestamptz;
  v_cupos    int;
  v_tomados  int;
  v_id       uuid;
begin
  select ac.company_id, coalesce(co.metadata->>'zona_horaria', 'America/Bogota')
    into v_company, v_tz
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_payload->>'instance';

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_srv from public.agenda_servicios
  where company_id = v_company and activo and lower(nombre) = lower(btrim(p_payload->>'servicio'));
  if not found then
    return json_build_object('ok', false, 'motivo', 'no ofrecemos ese servicio',
      'servicios', (select coalesce(json_agg(nombre order by orden), '[]'::json)
                    from public.agenda_servicios where company_id = v_company and activo));
  end if;

  v_inicio := public.tf_momento(v_tz, p_payload->>'fecha', p_payload->>'hora', p_payload->>'inicio');
  if v_inicio is null then
    return json_build_object('ok', false, 'motivo', 'no entendi para cuando es la cita');
  end if;
  if v_inicio < now() then
    return json_build_object('ok', false, 'motivo', 'esa hora ya paso');
  end if;

  v_fin := v_inicio + make_interval(mins => v_srv.minutos);

  perform pg_advisory_xact_lock(hashtextextended(v_company::text, 0));

  select f.cupos into v_cupos
  from public.agenda_franjas f
  where f.company_id = v_company and f.activa
    and extract(dow from timezone(v_tz, v_inicio))::int = f.dia
    and timezone(v_tz, v_inicio)::time >= f.desde
    and timezone(v_tz, v_fin)::time    <= f.hasta
  limit 1;

  if v_cupos is null then
    return json_build_object('ok', false, 'motivo', 'a esa hora el negocio no atiende');
  end if;

  if exists (select 1 from public.agenda_bloqueos b
             where b.company_id = v_company and b.desde < v_fin and b.hasta > v_inicio) then
    return json_build_object('ok', false, 'motivo', 'ese dia el negocio esta cerrado');
  end if;

  select coalesce(sum(coalesce(sv.ocupa, 1))::int, 0) into v_tomados
  from public.appointments a
  left join public.agenda_servicios sv
    on sv.company_id = a.company_id and lower(sv.nombre) = lower(a.servicio)
  where a.company_id = v_company and a.estado <> 'cancelada'
    and a.inicio < v_fin and a.fin > v_inicio;

  if v_tomados + v_srv.ocupa > v_cupos then
    return json_build_object('ok', false, 'motivo', 'esa hora se acaba de ocupar',
      'sugerencia', 'ofrecele otra hora de las que quedan libres');
  end if;

  select * into v_contact from public.contacts
  where company_id = v_company and public.tf_telefono(phone) = v_tel;

  if not found then
    insert into public.contacts (company_id, phone, full_name, status, metadata)
    values (v_company, p_payload->>'telefono',
            nullif(btrim(coalesce(p_payload->>'nombre', '')), ''),
            'prospecto', jsonb_build_object('origen', 'agente'))
    returning * into v_contact;
  elsif v_contact.full_name is null and nullif(btrim(coalesce(p_payload->>'nombre','')), '') is not null then
    update public.contacts set full_name = btrim(p_payload->>'nombre')
     where id = v_contact.id returning * into v_contact;
  end if;

  insert into public.appointments (company_id, contact_id, servicio, inicio, fin, estado, origen, notas)
  values (v_company, v_contact.id, v_srv.nombre, v_inicio, v_fin, 'confirmada', 'agente',
          nullif(btrim(coalesce(p_payload->>'notas', '')), ''))
  returning id into v_id;

  return json_build_object(
    'ok', true, 'cita_id', v_id, 'servicio', v_srv.nombre,
    'cuando', public.tf_fecha_es(v_inicio, v_tz), 'nombre', v_contact.full_name);
end;
$fn$;

revoke all on function public.tf_tool_agendar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_agendar_cita(jsonb) to n8n_worker;
  end if;
end $$;


-- ── Y mover también ──────────────────────────────────────────────────────────
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
  v_fecha    text;
begin
  select ac.company_id, coalesce(co.metadata->>'zona_horaria', 'America/Bogota')
    into v_company, v_tz
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_payload->>'instance';

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

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

  -- Si solo cambia la hora, el día es el que ya tenía. Así el modelo no tiene
  -- que repetir una fecha que podría equivocarse al copiar.
  v_fecha := coalesce(nullif(btrim(coalesce(p_payload->>'fecha', '')), ''),
                      to_char(timezone(v_tz, v_cita.inicio), 'YYYY-MM-DD'));

  v_nuevo := public.tf_momento(v_tz, v_fecha, p_payload->>'hora', p_payload->>'nuevo_inicio');
  if v_nuevo is null then
    return json_build_object('ok', false, 'motivo', 'no entendi para cuando moverla',
      'cita_actual', v_antes);
  end if;
  if v_nuevo < now() then
    return json_build_object('ok', false, 'motivo', 'esa hora ya paso', 'cita_actual', v_antes);
  end if;

  select * into v_srv from public.agenda_servicios
  where company_id = v_company and lower(nombre) = lower(coalesce(v_cita.servicio, ''));

  v_fin := v_nuevo + make_interval(mins => coalesce(v_srv.minutos,
             (extract(epoch from (v_cita.fin - v_cita.inicio)) / 60)::int));

  perform pg_advisory_xact_lock(hashtextextended(v_company::text, 0));

  select f.cupos into v_cupos
  from public.agenda_franjas f
  where f.company_id = v_company and f.activa
    and extract(dow from timezone(v_tz, v_nuevo))::int = f.dia
    and timezone(v_tz, v_nuevo)::time >= f.desde
    and timezone(v_tz, v_fin)::time    <= f.hasta
  limit 1;

  if v_cupos is null then
    return json_build_object('ok', false, 'motivo', 'a esa hora el negocio no atiende',
      'cita_actual', v_antes);
  end if;

  if exists (select 1 from public.agenda_bloqueos b
             where b.company_id = v_company and b.desde < v_fin and b.hasta > v_nuevo) then
    return json_build_object('ok', false, 'motivo', 'ese dia el negocio esta cerrado',
      'cita_actual', v_antes);
  end if;

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

  update public.appointments
     set inicio = v_nuevo,
         fin    = v_fin,
         confirmada_por_cliente  = null,
         recordatorio_enviado_at = null,
         metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
           'movida_desde', v_cita.inicio, 'movida_at', now())
   where id = v_cita.id;

  return json_build_object(
    'ok', true, 'movida', true, 'cita_id', v_cita.id, 'servicio', v_cita.servicio,
    'antes', v_antes, 'ahora', public.tf_fecha_es(v_nuevo, v_tz));
end;
$fn$;

revoke all on function public.tf_tool_reagendar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_reagendar_cita(jsonb) to n8n_worker;
  end if;
end $$;
