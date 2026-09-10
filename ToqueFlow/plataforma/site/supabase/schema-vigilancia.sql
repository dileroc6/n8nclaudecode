-- ============================================================================
-- ToqueFlow — Enterarse cuando algo se rompe, sin que un cliente lo cuente
-- ----------------------------------------------------------------------------
-- Hay DOS averías distintas y hasta ahora no se veía ninguna:
--
--   LO QUE FALLA GRITANDO   el flujo corre y revienta. n8n lo sabe y no se lo
--                           dice a nadie: 67 de 74 flujos activos no avisan.
--
--   LO QUE SE MUERE CALLADO el flujo deja de correr. No falla — simplemente no
--                           pasa nada. Así llevaba 16 días caído el WhatsApp
--                           de FerreteríaYa: sus cuatro instancias pasaron a
--                           «connecting» y dejaron de llegar mensajes. Ningún
--                           error, ninguna ejecución, ningún aviso posible.
--
-- El segundo es el que importa y el que no se puede detectar desde n8n, porque
-- lo que hay que mirar es una AUSENCIA. Se detecta desde aquí, contando.
--
-- LA REGLA QUE HACE QUE ESTO NO NECESITE CONFIGURACIÓN POR CLIENTE:
-- la historia no basta. Un agente recién encendido no tiene historia, y esos
-- primeros días son justo cuando las cosas se rompen —la instancia mal
-- escrita, el QR sin escanear—. Así que lo que decide si el silencio es
-- sospechoso NO es cuánto recibía antes, sino si el agente está ENCENDIDO.
-- Eso ya está escrito en `agent_config.activo`, y el día que se encienda un
-- agente la vigilancia cambia de opinión en ese instante, sin esperar a
-- aprender nada.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Lo que n8n reporta cuando algo revienta ──────────────────────────────
create table if not exists public.fallos (
  id           uuid primary key default gen_random_uuid(),
  -- Nulo cuando el fallo no es de un cliente concreto: un cron, el receptor.
  company_id   uuid references public.companies (id) on delete cascade,

  workflow     text not null,
  nodo         text,
  mensaje      text,
  ejecucion    text,

  -- Cuántas veces seguidas ha pasado lo mismo. Un flujo que revienta 200 veces
  -- en una hora es UNA avería, no 200: se suma aquí en vez de crear 200 filas
  -- y mandar 200 correos.
  veces        int not null default 1,
  primera_at   timestamptz not null default now(),
  ultima_at    timestamptz not null default now(),

  avisado_at   timestamptz,
  visto_at     timestamptz,
  visto_por    uuid references auth.users (id) on delete set null
);

create index if not exists fallos_abiertos_idx on public.fallos (visto_at, ultima_at desc);
create index if not exists fallos_empresa_idx  on public.fallos (company_id, ultima_at desc);

comment on table public.fallos is
  'Lo que reporta n8n cuando un flujo revienta. Se agrupa por flujo y nodo: 200 fallos iguales son una averia, no 200 correos.';


-- Lo llama el flujo `Toque - Algo fallo` de n8n. Agrupa por su cuenta.
create or replace function public.tf_fallo_registrar(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_wf   text := coalesce(nullif(btrim(coalesce(p_payload->>'workflow', '')), ''), 'desconocido');
  v_nodo text := nullif(btrim(coalesce(p_payload->>'nodo', '')), '');
  v_co   uuid;
  v_id   uuid;
  v_avisar boolean := false;
begin
  -- La empresa se deriva de la instancia si vino; nunca se acepta un
  -- company_id del payload, igual que en el resto del sistema.
  if coalesce(p_payload->>'instance', '') <> '' then
    select company_id into v_co from public.agent_config
    where whatsapp_instance = p_payload->>'instance';
  end if;

  -- ¿Ya hay una avería abierta de lo mismo? Se le suma.
  select id into v_id from public.fallos
  where workflow = v_wf
    and coalesce(nodo, '') = coalesce(v_nodo, '')
    and visto_at is null
  order by ultima_at desc limit 1;

  if v_id is not null then
    update public.fallos
       set veces = veces + 1, ultima_at = now(),
           mensaje = coalesce(nullif(btrim(coalesce(p_payload->>'mensaje','')),''), mensaje),
           ejecucion = coalesce(nullif(btrim(coalesce(p_payload->>'ejecucion','')),''), ejecucion)
     where id = v_id
    -- Se vuelve a avisar solo si el último aviso fue hace más de una hora. Es
    -- el anti-spam: sin esto el aviso se vuelve ruido y en dos semanas nadie
    -- lo mira, que es lo mismo que no tenerlo.
    returning (avisado_at is null or avisado_at < now() - interval '1 hour') into v_avisar;
  else
    insert into public.fallos (company_id, workflow, nodo, mensaje, ejecucion)
    values (v_co, v_wf, v_nodo,
            nullif(btrim(coalesce(p_payload->>'mensaje','')),''),
            nullif(btrim(coalesce(p_payload->>'ejecucion','')),''))
    returning id into v_id;
    v_avisar := true;
  end if;

  if v_avisar then
    update public.fallos set avisado_at = now() where id = v_id;
  end if;

  -- `avisar` le dice al workflow si mandar el correo o callarse.
  return json_build_object('ok', true, 'fallo_id', v_id, 'avisar', v_avisar);
end;
$fn$;

comment on function public.tf_fallo_registrar(jsonb) is
  'Anota un fallo de n8n y responde si hay que avisar. Agrupa los repetidos y no deja mandar mas de un correo por hora por averia.';


-- ── 2. La salud de cada empresa ──────────────────────────────────────────────
-- Cuenta lo que llegó y lo compara con lo que suele llegar, PERO solo le da
-- significado al silencio cuando el agente está encendido.
create or replace function public.tf_salud()
returns table (
  company_id    uuid,
  empresa       text,
  agente_activo boolean,
  hoy           int,
  normal_dia    numeric,
  ultimo_mensaje timestamptz,
  fallos_abiertos int,
  estado        text,
  detalle       text
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
          and m.created_at > now() - interval '24 hours')                       as hoy,
      -- Lo normal: lo que entró en 14 días, repartido. Se excluyen las últimas
      -- 24 h para que un día malo no baje su propia referencia.
      (select round(count(*)::numeric / 13, 1) from public.message_log m
        where m.company_id = co.id and m.direction = 'in'
          and m.created_at between now() - interval '14 days' and now() - interval '24 hours') as normal,
      (select max(m.created_at) from public.message_log m
        where m.company_id = co.id and m.direction = 'in')                      as ultimo,
      (select count(*)::int from public.fallos f
        where f.company_id = co.id and f.visto_at is null)                      as fallos
    from public.companies co
    join public.agent_config ac on ac.company_id = co.id
    where v_super or co.id = v_mia
    group by co.id, co.name
  )
  select
    b.id, b.name, b.activo, b.hoy, b.normal, b.ultimo, b.fallos,
    case
      -- Apagado: el silencio es lo esperado y no se dice nada.
      when not b.activo                          then 'apagado'
      -- Encendido y nunca ha recibido NADA. No hace falta historia para saber
      -- que esto está mal: es el go-live que no quedó bien.
      when b.ultimo is null                      then 'sin_estrenar'
      -- Venía recibiendo y hoy nada.
      when b.hoy = 0 and b.normal >= 1           then 'callado'
      -- Mucho más de lo suyo. No es solo un susto: cuesta plata en tokens.
      when b.normal >= 5 and b.hoy > b.normal * 3 then 'pico'
      when b.normal < 5  and b.hoy > 50           then 'pico'
      -- Bastante menos de lo suyo, con historia suficiente para que signifique
      -- algo. Un domingo flojo no debería sonar igual que una caída.
      when b.normal >= 10 and b.hoy < b.normal * 0.25 then 'flojo'
      else 'ok'
    end as estado,
    case
      when not b.activo then 'el agente está apagado'
      when b.ultimo is null then 'está encendido y nunca le ha llegado un mensaje'
      when b.hoy = 0 and b.normal >= 1 then
        'sin mensajes hace ' || greatest(1, extract(day from now() - b.ultimo)::int) || ' día(s); lo normal son ' || b.normal || ' al día'
      when b.normal >= 5 and b.hoy > b.normal * 3 then
        b.hoy || ' mensajes hoy contra ' || b.normal || ' de costumbre'
      when b.normal < 5 and b.hoy > 50 then b.hoy || ' mensajes hoy, y no suele recibir'
      when b.normal >= 10 and b.hoy < b.normal * 0.25 then
        'solo ' || b.hoy || ' hoy; lo normal son ' || b.normal
      else 'andando'
    end as detalle
  from base b
  order by
    case when not b.activo then 3
         when b.hoy = 0 and (b.ultimo is null or b.normal >= 1) then 0
         else 1 end,
    b.name;
end;
$fn$;

comment on function public.tf_salud() is
  'Como va cada empresa: si su agente esta encendido, cuanto recibio y si eso es normal para ella. El silencio solo cuenta como averia si el agente esta encendido — asi no hace falta configurar un umbral por cliente.';


-- ── 3. RLS y permisos ────────────────────────────────────────────────────────
alter table public.fallos enable row level security;

drop policy if exists fallos_suyos on public.fallos;
create policy fallos_suyos on public.fallos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

-- Marcar un fallo como visto lo hace una persona desde la consola.
drop policy if exists fallos_marcar on public.fallos;
create policy fallos_marcar on public.fallos
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select, update on public.fallos to authenticated;

revoke all on function public.tf_fallo_registrar(jsonb) from public, anon, authenticated;
revoke all on function public.tf_salud() from public, anon;
grant execute on function public.tf_salud() to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_fallo_registrar(jsonb) to n8n_worker;
    grant select on public.fallos to n8n_worker;
  end if;
end $$;


-- ── 4. La misma salud, para el cron ──────────────────────────────────────────
-- `tf_salud()` filtra por la sesión de quien mira, y el cron no tiene sesión:
-- llamada por el worker devolvería cero filas y el vigilante nunca avisaría de
-- nada. Se separa en vez de aflojar la de la consola — una función que decide
-- a quién enseñar según quién llama es donde se cuelan los errores.
create or replace function public.tf_vigilancia()
returns table (
  company_id uuid, empresa text, agente_activo boolean,
  hoy int, normal_dia numeric, ultimo_mensaje timestamptz,
  fallos_abiertos int, estado text, detalle text
)
language sql
stable
security definer
set search_path = public
as $fn$
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
        where f.company_id = co.id and f.visto_at is null) as fallos
    from public.companies co
    join public.agent_config ac on ac.company_id = co.id
    where co.status = 'active'
    group by co.id, co.name
  )
  select b.id, b.name, b.activo, b.hoy, b.normal, b.ultimo, b.fallos,
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
      when not b.activo then 'el agente esta apagado'
      when b.ultimo is null then 'esta encendido y nunca le ha llegado un mensaje'
      when b.hoy = 0 and b.normal >= 1 then
        'sin mensajes hace ' || greatest(1, extract(day from now() - b.ultimo)::int) || ' dia(s)'
      when b.normal >= 5 and b.hoy > b.normal * 3 then b.hoy || ' mensajes hoy contra ' || b.normal || ' de costumbre'
      when b.normal < 5 and b.hoy > 50 then b.hoy || ' mensajes hoy, y no suele recibir'
      when b.normal >= 10 and b.hoy < b.normal * 0.25 then 'solo ' || b.hoy || ' hoy; lo normal son ' || b.normal
      else 'andando'
    end
  from base b;
$fn$;

comment on function public.tf_vigilancia() is
  'Igual que tf_salud() pero sin filtrar por sesion: la llama el cron de n8n, que no tiene ninguna. Separada a proposito de la de la consola.';

revoke all on function public.tf_vigilancia() from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_vigilancia() to n8n_worker;
  end if;
end $$;
