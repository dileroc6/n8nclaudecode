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
  select ac.company_id, public.tf_zona(ac.company_id)
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
-- tf_tool_agendar_cita NO se define aqui: vive en schema-fecha-y-hora.sql.
--
-- Estaba definida en los dos archivos, con cuerpos distintos. Reaplicar los
-- esquemas en un orden u otro decidia en silencio cual de las dos corria — y
-- eso rompio la herramienta de verdad: la version de aqui pedia un timestamp ISO y la buena pide fecha y hora por
-- separado, asi que el agente contestaba «no se pudo por un error tecnico».
--
-- Una funcion, un archivo. `pruebas/calidad/una-funcion-un-archivo.cjs` lo
-- vigila.


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
