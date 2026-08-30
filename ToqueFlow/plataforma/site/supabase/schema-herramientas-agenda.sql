-- ============================================================================
-- ToqueFlow — Ver disponibilidad y agendar, dentro de la conversación (tarea 17)
-- ----------------------------------------------------------------------------
-- Las dos herramientas que cierran la cita sin sacar a nadie de WhatsApp. Es
-- donde está el valor para una clínica o un spa: hoy la conversación termina
-- en «escríbenos para agendar» y ahí se cae la mitad.
--
-- Se apoyan en la agenda (schema-agenda.sql), que ya sabe qué horas están
-- libres contando franjas, duración, cupos, citas tomadas y bloqueos.
--
-- Lo que decide si esto sirve o hace daño
-- ----------------------------------------
-- **No puede agendar dos personas en el mismo cupo.** Que el agente ofrezca
-- una hora y otro la tome medio segundo antes es un caso normal, no raro: dos
-- conversaciones a la vez es lo esperado en un negocio que funciona. Y el
-- resultado sería alguien que llega y no lo pueden atender — el peor fallo
-- posible, porque el cliente del cliente lo ve en la cara.
--
-- Por eso la disponibilidad se vuelve a comprobar AL ESCRIBIR, dentro de la
-- misma transacción y con un candado por empresa y hora. Preguntar antes no
-- sirve: entre la pregunta y la escritura cabe otra cita.
--
-- Idempotente.
-- ============================================================================


-- ── 1. ¿Cuándo hay campo? ────────────────────────────────────────────────────
-- Envuelve `tf_agenda_libre` resolviendo la empresa por la instancia, como
-- todas las herramientas: el company_id NUNCA viene del payload.
create or replace function public.tf_tool_ver_disponibilidad(
  p_instance text,
  p_servicio text default null,
  p_dias     int  default 7
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_tz      text;
  v_libre   json;
  v_huecos  json;
begin
  select ac.company_id, coalesce(co.metadata->>'zona_horaria', 'America/Bogota')
    into v_company, v_tz
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  -- Si el negocio no ha configurado su agenda, decirlo claro. Devolver una
  -- lista vacía haría que el agente contestara «no hay horas disponibles», que
  -- es mentira y además espanta al cliente.
  if not exists (select 1 from public.agenda_franjas where company_id = v_company and activa) then
    return json_build_object('ok', false, 'motivo', 'este negocio todavia no tiene horarios cargados');
  end if;

  v_libre := public.tf_agenda_libre(v_company, p_servicio, p_dias, now());
  if not (v_libre->>'ok')::boolean then return v_libre; end if;

  -- Se le entregan al modelo ya escritas en la hora del negocio. Mandarle un
  -- timestamptz en UTC es pedirle que haga cuentas de zona horaria, y eso lo
  -- hace mal: dice «las 2 de la tarde» cuando son las 9 de la mañana.
  select coalesce(json_agg(json_build_object(
           'cuando', public.tf_fecha_es((h->>'inicio')::timestamptz, v_tz),
           'inicio', h->>'inicio',
           'quedan', (h->>'libres')::int
         ) order by (h->>'inicio')::timestamptz), '[]'::json)
    into v_huecos
  from json_array_elements(v_libre->'huecos') h;

  return json_build_object(
    'ok', true,
    'servicio', v_libre->>'servicio',
    'minutos', (v_libre->>'minutos')::int,
    'horas_libres', v_huecos
  );
end;
$fn$;

comment on function public.tf_tool_ver_disponibilidad(text, text, int) is
  'Las horas libres, ya escritas en la hora del negocio para que el modelo no tenga que hacer cuentas de zona horaria.';


-- ── 2. Agendar ───────────────────────────────────────────────────────────────
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

  -- El servicio marca la duración. Sin servicio no se agenda: «una cita» sin
  -- saber de qué no le sirve a nadie, y el negocio no puede prepararla.
  select * into v_srv from public.agenda_servicios
  where company_id = v_company and activo and lower(nombre) = lower(btrim(p_payload->>'servicio'));
  if not found then
    return json_build_object('ok', false, 'motivo', 'no ofrecemos ese servicio',
      'servicios', (select coalesce(json_agg(nombre order by orden), '[]'::json)
                    from public.agenda_servicios where company_id = v_company and activo));
  end if;

  begin
    v_inicio := (p_payload->>'inicio')::timestamptz;
  exception when others then
    return json_build_object('ok', false, 'motivo', 'no entendi la fecha y hora');
  end;
  if v_inicio is null then
    return json_build_object('ok', false, 'motivo', 'falta la fecha y hora');
  end if;
  if v_inicio < now() then
    return json_build_object('ok', false, 'motivo', 'esa hora ya paso');
  end if;

  v_fin := v_inicio + make_interval(mins => v_srv.minutos);

  -- ── El candado ────────────────────────────────────────────────────────────
  -- Serializa a todos los que intenten agendar en ESTA empresa. Se libera solo
  -- al terminar la transacción. Sin esto, dos conversaciones simultáneas
  -- pueden meter dos citas en el último cupo — y el segundo llega y no lo
  -- pueden atender.
  perform pg_advisory_xact_lock(hashtextextended(v_company::text, 0));

  -- ¿Sigue libre? Se comprueba AQUÍ, no antes: entre la pregunta del agente y
  -- esta línea cabe otra cita.
  select f.cupos into v_cupos
  from public.agenda_franjas f
  where f.company_id = v_company
    and f.activa
    and extract(dow from timezone(v_tz, v_inicio))::int = f.dia
    and timezone(v_tz, v_inicio)::time >= f.desde
    and timezone(v_tz, v_fin)::time    <= f.hasta
  limit 1;

  if v_cupos is null then
    return json_build_object('ok', false, 'motivo', 'a esa hora el negocio no atiende');
  end if;

  if exists (
    select 1 from public.agenda_bloqueos b
    where b.company_id = v_company and b.desde < v_fin and b.hasta > v_inicio
  ) then
    return json_build_object('ok', false, 'motivo', 'ese dia el negocio esta cerrado');
  end if;

  select coalesce(sum(coalesce(sv.ocupa, 1))::int, 0) into v_tomados
  from public.appointments a
  left join public.agenda_servicios sv
    on sv.company_id = a.company_id and lower(sv.nombre) = lower(a.servicio)
  where a.company_id = v_company
    and a.estado <> 'cancelada'
    and a.inicio < v_fin and a.fin > v_inicio;

  if v_tomados + v_srv.ocupa > v_cupos then
    return json_build_object('ok', false, 'motivo', 'esa hora se acaba de ocupar',
      'sugerencia', 'ofrecele otra hora de las que quedan libres');
  end if;

  -- ── La persona ────────────────────────────────────────────────────────────
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
    'ok', true,
    'cita_id', v_id,
    'servicio', v_srv.nombre,
    -- Escrita en la hora del negocio, para que el agente la repita tal cual.
    'cuando', public.tf_fecha_es(v_inicio, v_tz),
    'nombre', v_contact.full_name
  );
end;
$fn$;

comment on function public.tf_tool_agendar_cita(jsonb) is
  'Agenda una cita comprobando la disponibilidad AL ESCRIBIR, con candado por empresa: entre lo que el agente ofrece y lo que escribe cabe otra cita, y dos personas en el mismo cupo significa alguien que llega y no lo pueden atender.';


-- ── 3. Permisos ──────────────────────────────────────────────────────────────
revoke all on function public.tf_tool_ver_disponibilidad(text, text, int) from public, anon, authenticated;
revoke all on function public.tf_tool_agendar_cita(jsonb) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_ver_disponibilidad(text, text, int) to n8n_worker;
    grant execute on function public.tf_tool_agendar_cita(jsonb) to n8n_worker;
    grant select, insert, update on public.appointments to n8n_worker;
  end if;
end $$;


-- ── 4. Quedan liberadas ──────────────────────────────────────────────────────
update public.catalogo
   set liberado = true, activo = true
 where clave in ('ver-disponibilidad', 'agendar-cita');
