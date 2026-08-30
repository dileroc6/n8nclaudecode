-- ============================================================================
-- ToqueFlow — Agenda simple (tarea 34)
-- ----------------------------------------------------------------------------
-- Cuatro cosas, ni una más: cuándo atiende el negocio, cuánto dura cada cosa,
-- a cuántos puede atender a la vez, y qué días no.
--
--   franjas    los lunes de 6:00 a 20:00, hasta 12 personas
--   servicios  «Corte de cabello», 45 minutos, 2 a la vez
--   bloqueos   el 25 de diciembre no; el 3 de marzo de 2 a 5 tampoco
--
-- Lo que NO hace, a propósito (era la nota de la tarea): no agenda contra
-- PERSONAS ni contra RECURSOS. Nada de «la cita es con Marcela» o «la sala 2».
-- Eso es un problema distinto y mucho más grande, y la mayoría de los negocios
-- de este tamaño no lo necesitan: les basta con saber si a las 3 de la tarde
-- todavía cabe alguien.
--
-- Y la prueba de siempre: ¿le sirve igual a una peluquería, un taller, un
-- consultorio y un hotel? Sí — todos tienen horario, duración y cupo. Lo que
-- cambia son las palabras, y esas ya las pone el negocio.
--
-- Sobre esto se montan después `ver-disponibilidad` y `agendar-cita`, que son
-- las herramientas que van a pedir las clínicas y los spas.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Cuándo atiende ────────────────────────────────────────────────────────
create table if not exists public.agenda_franjas (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  -- 0 = domingo … 6 = sábado, como lo devuelve `extract(dow)`. Se guarda el
  -- número y no el nombre para no depender del idioma ni de la configuración
  -- regional del servidor.
  dia        int  not null check (dia between 0 and 6),
  desde      time not null,
  hasta      time not null,

  -- Cuánta gente cabe A LA VEZ en esta franja. Una peluquería con dos sillas
  -- pone 2; un salón de clases, 15. Es lo que evita agendar veinte citas a la
  -- misma hora sin que nadie se dé cuenta.
  cupos      int  not null default 1 check (cupos > 0),

  activa     boolean not null default true,
  created_at timestamptz not null default now(),

  check (hasta > desde),
  unique (company_id, dia, desde, hasta)
);

comment on table public.agenda_franjas is
  'Cuando atiende el negocio, por dia de la semana. `cupos` es cuanta gente cabe a la vez.';

create index if not exists agenda_franjas_company_idx on public.agenda_franjas (company_id, dia);


-- ── 2. Qué se agenda y cuánto dura ───────────────────────────────────────────
create table if not exists public.agenda_servicios (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,

  nombre     text not null,
  minutos    int  not null default 60 check (minutos between 5 and 600),

  -- Si este servicio ocupa más de un cupo. Una clase grupal ocupa uno por
  -- persona; un servicio que bloquea el local entero ocupa todos.
  ocupa      int  not null default 1 check (ocupa > 0),

  activo     boolean not null default true,
  orden      int  not null default 100,
  created_at timestamptz not null default now(),

  unique (company_id, nombre)
);

comment on table public.agenda_servicios is
  'Que se puede agendar y cuanto dura. El nombre lo pone el negocio: corte, valoracion, masaje, revision tecnomecanica.';


-- ── 3. Cuándo NO, aunque sea su horario ──────────────────────────────────────
-- Festivos, vacaciones, una tarde que cerraron. Sin esto, el agente ofrece el
-- 25 de diciembre a las 10 de la mañana con total seguridad.
create table if not exists public.agenda_bloqueos (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  desde      timestamptz not null,
  hasta      timestamptz not null,
  motivo     text,
  created_at timestamptz not null default now(),
  check (hasta > desde)
);

comment on table public.agenda_bloqueos is
  'Ratos en los que el negocio NO atiende aunque sea su horario: festivos, vacaciones, una tarde cerrada.';

create index if not exists agenda_bloqueos_company_idx on public.agenda_bloqueos (company_id, desde, hasta);


-- ── 4. Permisos: la agenda es del cliente ────────────────────────────────────
-- Igual que los campos de la ficha: si para mover un horario hay que pedírselo
-- a ToqueFlow, cada cambio menor pasa por una persona. Un negocio cambia sus
-- horarios solo, y en fin de año los cambia varias veces.
do $$
declare t text;
begin
  foreach t in array array['agenda_franjas', 'agenda_servicios', 'agenda_bloqueos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (public.is_super_admin() or company_id = public.my_company_id())$p$, t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_manage', t);
    execute format($p$create policy %I on public.%I for all to authenticated
                     using (public.is_super_admin() or company_id = public.my_company_id())
                     with check (public.is_super_admin() or company_id = public.my_company_id())$p$, t || '_manage', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
      execute format('grant select on public.%I to n8n_worker', t);
    end if;
  end loop;
end $$;


-- ── 5. ¿Cuándo hay campo? ────────────────────────────────────────────────────
-- Devuelve las horas libres de los próximos N días: es la función que va a
-- llamar `ver-disponibilidad` y también la que dibuja el calendario del
-- portal. Una sola definición de «libre» para los dos, porque tener dos es
-- cómo se termina ofreciendo una hora que ya estaba tomada.
--
-- TODO el cálculo se hace en la hora de RELOJ del negocio y solo se convierte
-- a instante al final. Mezclarlas fue el bug de la primera versión: ofrecía
-- un hueco a las 23:00, no contaba las citas ya agendadas y los bloqueos no
-- tapaban nada — los tres eran el mismo error.

create or replace function public.tf_agenda_libre(
  p_company  uuid,
  p_servicio text default null,
  p_dias     int  default 7,
  p_desde    timestamptz default null
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_srv   public.agenda_servicios%rowtype;
  v_tz    text;
  v_ini   timestamptz := coalesce(p_desde, now());
  v_fin   timestamptz;
  v_paso  interval;
  v_libre json;
begin
  select coalesce(metadata->>'zona_horaria', 'America/Bogota') into v_tz
  from public.companies where id = p_company;
  if v_tz is null then
    return json_build_object('ok', false, 'motivo', 'empresa desconocida');
  end if;

  if p_servicio is not null then
    select * into v_srv from public.agenda_servicios
    where company_id = p_company and activo and lower(nombre) = lower(btrim(p_servicio));
    if not found then
      return json_build_object('ok', false, 'motivo', 'no ofrecemos ese servicio',
        'servicios', (select coalesce(json_agg(nombre order by orden), '[]'::json)
                      from public.agenda_servicios where company_id = p_company and activo));
    end if;
  end if;

  v_paso := make_interval(mins => coalesce(v_srv.minutos, 60));

  -- Hasta el FINAL del último día, no hasta la misma hora. «Los próximos tres
  -- días» incluye ese tercer día entero.
  v_fin := timezone(v_tz,
             date_trunc('day', timezone(v_tz, v_ini))
             + make_interval(days => greatest(1, least(p_dias, 30)) + 1));

  select coalesce(json_agg(json_build_object(
           'inicio', h.inicio, 'fin', h.inicio + v_paso,
           'libres', h.cupos - h.tomados
         ) order by h.inicio), '[]'::json)
    into v_libre
  from (
    select
      timezone(v_tz, s.ini_local) as inicio,
      f.cupos,
      coalesce((
        select sum(coalesce(sv.ocupa, 1))::int
        from public.appointments a
        left join public.agenda_servicios sv
          on sv.company_id = a.company_id and lower(sv.nombre) = lower(a.servicio)
        where a.company_id = p_company
          and a.estado <> 'cancelada'
          and a.inicio < timezone(v_tz, s.ini_local) + v_paso
          and a.fin    > timezone(v_tz, s.ini_local)
      ), 0) as tomados
    from (
      select generate_series(
        date_trunc('day', timezone(v_tz, v_ini)),
        date_trunc('day', timezone(v_tz, v_fin)),
        interval '1 day'
      ) as dia_local
    ) d
    join public.agenda_franjas f
      on f.company_id = p_company
     and f.activa
     and extract(dow from d.dia_local)::int = f.dia
    cross join lateral (
      select generate_series(
        d.dia_local + f.desde::interval,
        d.dia_local + f.hasta::interval - v_paso,
        v_paso
      ) as ini_local
    ) s
    where timezone(v_tz, s.ini_local) >= v_ini
      and timezone(v_tz, s.ini_local) <  v_fin
      and not exists (
        select 1 from public.agenda_bloqueos b
        where b.company_id = p_company
          and b.desde < timezone(v_tz, s.ini_local) + v_paso
          and b.hasta > timezone(v_tz, s.ini_local)
      )
  ) h
  where h.cupos > h.tomados;

  return json_build_object(
    'ok', true, 'servicio', v_srv.nombre, 'minutos', coalesce(v_srv.minutos, 60),
    'zona', v_tz, 'huecos', v_libre
  );
end;
$fn$;

comment on function public.tf_agenda_libre(uuid, text, int, timestamptz) is
  'Las horas libres de los proximos dias, en la hora de RELOJ del negocio. Cuenta franjas, duracion del servicio, cupos, citas ya tomadas y bloqueos. Una sola definicion de «libre» para el agente y para el portal.';

grant execute on function public.tf_agenda_libre(uuid, text, int, timestamptz) to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agenda_libre(uuid, text, int, timestamptz) to n8n_worker;
  end if;
end $$;
