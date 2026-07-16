-- ============================================================================
-- ToqueFlow — Esquema de NEGOCIO (capa que consume/alimenta n8n)
-- ----------------------------------------------------------------------------
-- Contrato Supabase↔n8n. Multi-tenant por company_id (se reusa el modelo
-- `companies` de schema.sql — NO existe `tenant_id`). n8n lee/escribe estas
-- tablas con el rol de servicio; la plataforma dispara eventos por el outbox.
--
-- Requisitos: correr PRIMERO schema.sql (define companies, profiles y los
-- helpers is_super_admin() / my_company_id()). Este archivo es idempotente.
--
-- HOLD: el disparo real hacia n8n (Database Webhook / pg_net que hace POST) NO
-- se activa aquí — falta la URL del receptor n8n. El outbox `n8n_events` sí se
-- crea; el trigger de egreso queda listo comentado al final.
-- ============================================================================

-- ── Helper: touch updated_at ─────────────────────────────────────────────────
create or replace function public.tf_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── contacts — contactos / leads (genérico, todos los clientes) ───────────────
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid        not null references public.companies (id) on delete cascade,
  phone           text,                       -- E.164 (+57...)
  full_name       text,
  email           text,
  service_type    text        check (service_type in ('karma','beja','uja','paquete')),
  status          text        not null default 'prospecto'
                              check (status in ('activo','no_activo','prospecto','deudor','embajador')),
  -- lead_stage: temperatura comercial, INDEPENDIENTE de status. La actualiza el
  -- flujo de reactivación (ej. tibio→caliente). Ver contrato n8n.
  lead_stage      text        check (lead_stage in ('cliente','caliente','tibio','frio')),
  -- Saldo de clases: SOLO aplica a service_type='paquete'. Sin dimensión `tipo`
  -- (modelo final): un único saldo + fecha de renovación como columnas del
  -- contacto. Para karma/beja/uja quedan en NULL.
  clases_restantes int,
  fecha_renovacion date,
  segment         jsonb       not null default '[]',   -- tags/segmentos
  source          text,
  last_contact_at timestamptz,
  follow_up_at    timestamptz,
  metadata        jsonb       not null default '{}',
  created_at      timestamptz not null default now()
);
-- email: la fuente (Sheet Bejauha) lo trae; additivo para instalaciones ya creadas.
alter table public.contacts add column if not exists email text;
create unique index if not exists contacts_company_phone_uidx on public.contacts (company_id, phone);
create index if not exists contacts_company_status_idx on public.contacts (company_id, status);
create index if not exists contacts_company_stage_idx  on public.contacts (company_id, lead_stage);

-- ── campaigns — campaña parametrizable (la configura el cliente) ──────────────
create table if not exists public.campaigns (
  id               uuid        primary key default gen_random_uuid(),
  company_id       uuid        not null references public.companies (id) on delete cascade,
  name             text        not null,
  filters          jsonb       not null default '{}',   -- {status, lead_stage, service_type, ...}
  message_template text,                                -- soporta {nombre}
  quantity         int,                                 -- cuántos contactar
  frequency        text        not null default 'una_vez',  -- una_vez | diaria | semanal
  batch_size       int         not null default 5,      -- anti-baneo
  status           text        not null default 'borrador'
                               check (status in ('borrador','activa','pausada','finalizada')),
  scheduled_at     timestamptz,                          -- null = enviar ahora; si no, programada
  created_by       uuid        references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists campaigns_company_idx on public.campaigns (company_id, created_at desc);
drop trigger if exists trg_campaigns_touch on public.campaigns;
create trigger trg_campaigns_touch before update on public.campaigns
  for each row execute function public.tf_touch_updated_at();

-- ── campaign_runs — resultado de envío por contacto (lo escribe n8n) ──────────
create table if not exists public.campaign_runs (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies (id) on delete cascade,
  campaign_id uuid        references public.campaigns (id) on delete cascade,
  contact_id  uuid        references public.contacts (id) on delete set null,
  status      text        not null default 'queued'
                          check (status in ('queued','sent','failed','replied')),
  batch_no    int,
  error       text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists campaign_runs_campaign_idx on public.campaign_runs (campaign_id, created_at desc);
create index if not exists campaign_runs_company_idx  on public.campaign_runs (company_id, created_at desc);

-- ── message_log — bitácora WhatsApp (in/out, lo escribe n8n) ──────────────────
create table if not exists public.message_log (
  id            uuid        primary key default gen_random_uuid(),
  company_id    uuid        not null references public.companies (id) on delete cascade,
  contact_id    uuid        references public.contacts (id) on delete set null,
  direction     text        not null check (direction in ('in','out')),
  channel       text        not null default 'wa',
  body          text,
  wa_message_id text,
  created_at    timestamptz not null default now()
);
create index if not exists message_log_company_idx on public.message_log (company_id, created_at desc);
create index if not exists message_log_contact_idx on public.message_log (contact_id, created_at desc);

-- ── payments — estado/histórico de pagos (lo escribe la Edge Function) ────────
create table if not exists public.payments (
  id           uuid        primary key default gen_random_uuid(),
  company_id   uuid        not null references public.companies (id) on delete cascade,
  contact_id   uuid        references public.contacts (id) on delete set null,
  amount       numeric,
  currency     text        not null default 'COP',
  status       text        not null default 'pending'
                           check (status in ('paid','failed','pending','refunded')),
  provider     text,                                    -- wompi, ...
  external_ref text,                                    -- id/referencia de la pasarela
  reason       text,                                    -- motivo del fallo
  attempt      int         not null default 1,
  raw          jsonb       not null default '{}',       -- payload crudo de la pasarela
  created_at   timestamptz not null default now()
);
-- Idempotencia: una pasarela no debe duplicar el mismo evento.
create unique index if not exists payments_provider_ref_uidx
  on public.payments (company_id, provider, external_ref)
  where external_ref is not null;
create index if not exists payments_company_idx on public.payments (company_id, created_at desc);

-- ── n8n_events — OUTBOX. La plataforma inserta; n8n consume (o el DB Webhook) ──
create table if not exists public.n8n_events (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        references public.companies (id) on delete cascade,
  event       text        not null,                     -- ejecutar_campana | pago_fallido | ...
  payload     jsonb       not null default '{}',
  status      text        not null default 'pending'
                          check (status in ('pending','sent','failed')),
  attempts    int         not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index if not exists n8n_events_status_idx  on public.n8n_events (status, created_at);
create index if not exists n8n_events_company_idx on public.n8n_events (company_id, created_at desc);

-- ============================================================================
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Patrón: super_admin todo; member SOLO-VE lo de su empresa; las escrituras de
-- sistema las hace el service role (salta RLS). Excepción: `campaigns` y el
-- enqueue de `ejecutar_campana`, que el propio cliente (member) SÍ puede crear.
-- ============================================================================

alter table public.contacts        enable row level security;
alter table public.campaigns       enable row level security;
alter table public.campaign_runs   enable row level security;
alter table public.message_log     enable row level security;
alter table public.payments        enable row level security;
alter table public.n8n_events      enable row level security;

-- contacts: member ve lo suyo; escribe el service role
drop policy if exists contacts_select on public.contacts;
create policy contacts_select on public.contacts
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists contacts_admin on public.contacts;
create policy contacts_admin on public.contacts
  for all using (public.is_super_admin()) with check (public.is_super_admin());
-- el cliente (member) puede AGREGAR y EDITAR contactos de SU empresa (no borrar)
drop policy if exists contacts_member_insert on public.contacts;
create policy contacts_member_insert on public.contacts
  for insert with check (company_id = public.my_company_id());
drop policy if exists contacts_member_update on public.contacts;
create policy contacts_member_update on public.contacts
  for update using (company_id = public.my_company_id())
           with check (company_id = public.my_company_id());
drop policy if exists contacts_member_delete on public.contacts;
create policy contacts_member_delete on public.contacts
  for delete using (company_id = public.my_company_id());

-- campaigns: el cliente (member) las gestiona dentro de su empresa
drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists campaigns_write_own on public.campaigns;
create policy campaigns_write_own on public.campaigns
  for all using (public.is_super_admin() or company_id = public.my_company_id())
          with check (public.is_super_admin() or company_id = public.my_company_id());

-- campaign_runs: member ve lo suyo; escribe el service role
drop policy if exists campaign_runs_select on public.campaign_runs;
create policy campaign_runs_select on public.campaign_runs
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists campaign_runs_admin on public.campaign_runs;
create policy campaign_runs_admin on public.campaign_runs
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- message_log: member ve lo suyo; escribe el service role
drop policy if exists message_log_select on public.message_log;
create policy message_log_select on public.message_log
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists message_log_admin on public.message_log;
create policy message_log_admin on public.message_log
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- payments: member ve lo suyo; escribe el service role (Edge Function)
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- n8n_events: member ve lo suyo y SOLO puede encolar 'ejecutar_campana' de su
-- empresa (no puede fabricar pago_fallido ni eventos de otro tenant). El resto
-- lo maneja el service role.
drop policy if exists n8n_events_select on public.n8n_events;
create policy n8n_events_select on public.n8n_events
  for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists n8n_events_enqueue_campaign on public.n8n_events;
create policy n8n_events_enqueue_campaign on public.n8n_events
  for insert with check (
    public.is_super_admin()
    or (company_id = public.my_company_id() and (
      event in ('ejecutar_campana','mensaje_prueba')
      or (event = 'pago_fallido' and (payload->>'test') = 'true')   -- solo modo prueba
    ))
  );
drop policy if exists n8n_events_admin on public.n8n_events;
create policy n8n_events_admin on public.n8n_events
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ============================================================================
-- (2) ROL DEDICADO n8n_worker  — least-privilege para el motor n8n [ACTIVO]
-- ----------------------------------------------------------------------------
-- n8n autentica con un JWT firmado (JWT secret del proyecto) con claim
-- role=n8n_worker. GRANTs SOLO a tablas de negocio; nunca auth/profiles.
-- Nota: para PROBAR el pipe no hace falta (el receptor solo hace ACK). Se
-- necesita en GO-LIVE, cuando n8n empiece a leer/escribir Supabase.
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    create role n8n_worker nologin;
  end if;
end $$;

-- Para que PostgREST pueda cambiar a este rol vía el JWT claim role=n8n_worker.
grant n8n_worker to authenticator;
grant usage on schema public to n8n_worker;

-- Escribe: contacts, campaign_runs, message_log, n8n_events. Lee: campaigns, payments.
grant select, insert, update on
  public.contacts, public.campaign_runs, public.message_log, public.n8n_events
  to n8n_worker;
grant select on public.campaigns, public.payments to n8n_worker;

-- RLS para el worker: es el motor multi-tenant (filtra por company_id él mismo),
-- así que ve todos los tenants en las tablas que se le concedieron. Least-privilege
-- lo da el GRANT (qué tablas), no el RLS (qué filas).
drop policy if exists contacts_n8n on public.contacts;
create policy contacts_n8n on public.contacts to n8n_worker using (true) with check (true);
drop policy if exists campaign_runs_n8n on public.campaign_runs;
create policy campaign_runs_n8n on public.campaign_runs to n8n_worker using (true) with check (true);
drop policy if exists message_log_n8n on public.message_log;
create policy message_log_n8n on public.message_log to n8n_worker using (true) with check (true);
drop policy if exists n8n_events_n8n on public.n8n_events;
create policy n8n_events_n8n on public.n8n_events to n8n_worker using (true) with check (true);
drop policy if exists campaigns_n8n on public.campaigns;
create policy campaigns_n8n on public.campaigns for select to n8n_worker using (true);
drop policy if exists payments_n8n on public.payments;
create policy payments_n8n on public.payments for select to n8n_worker using (true);

-- ============================================================================
-- (3) DISPARO HACIA n8n — Database Webhook (pg_net)  [ACTIVO]
-- ----------------------------------------------------------------------------
-- Trigger AFTER INSERT en n8n_events → POST al receptor único de n8n.
-- Envelope ANIDADO: { event, event_id, company_id, company_slug, payload:{...} }.
-- La URL y el secreto (header X-Toque-Signature) NO se comitean: viven en una
-- tabla PRIVADA `private.tf_config` (fuera del schema public → invisible a la
-- API REST). Los valores se cargan una vez con wire-n8n.local.sql (gitignored).
-- (En Supabase el rol postgres no puede ALTER DATABASE SET, por eso tabla y no GUC.)
-- ----------------------------------------------------------------------------
create extension if not exists pg_net;

create schema if not exists private;
create table if not exists private.tf_config (
  key   text primary key,
  value text
);

create or replace function public.tf_dispatch_n8n_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_url    text;
  v_secret text;
  v_slug   text;
begin
  select value into v_url    from private.tf_config where key = 'n8n_webhook_url';
  select value into v_secret from private.tf_config where key = 'n8n_shared_secret';

  -- Sin URL configurada aún → no dispares (deja la fila 'pending' para reintento).
  if v_url is null or v_url = '' then
    return new;
  end if;

  -- company_slug autoritativo desde companies; fallback al que venga en el payload.
  select slug into v_slug from public.companies where id = new.company_id;
  v_slug := coalesce(v_slug, new.payload ->> 'company_slug');

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'X-Toque-Signature', coalesce(v_secret, '')),
    body    := jsonb_build_object(
                 'event',        new.event,
                 'event_id',     new.id,
                 'company_id',   new.company_id,
                 'company_slug', v_slug,
                 'payload',      new.payload)
  );
  return new;
end $$;

drop trigger if exists trg_n8n_events_dispatch on public.n8n_events;
create trigger trg_n8n_events_dispatch
  after insert on public.n8n_events
  for each row execute function public.tf_dispatch_n8n_event();
-- ============================================================================

-- ============================================================================
-- (4) SANDBOX / MODO PRUEBA — test_messages
-- ----------------------------------------------------------------------------
-- Chat de pruebas: probar flujos de n8n sin WhatsApp real. El member (cliente)
-- escribe 'in'; n8n escribe 'out' (lo que habría enviado). Ver _docs/modo-prueba-sandbox.md.
-- ============================================================================
create table if not exists public.test_messages (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  contact_id  uuid references public.contacts(id) on delete set null,
  telefono    text,
  direction   text not null check (direction in ('in','out')),
  author      text not null default 'sistema' check (author in ('cliente','bot','admin','sistema')),
  body        text,
  flow        text,
  meta        jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists test_messages_company_idx on public.test_messages(company_id, created_at);
alter table public.test_messages enable row level security;
drop policy if exists test_messages_select on public.test_messages;
create policy test_messages_select on public.test_messages for select using (public.is_super_admin() or company_id = public.my_company_id());
drop policy if exists test_messages_member_insert on public.test_messages;
create policy test_messages_member_insert on public.test_messages for insert with check (company_id = public.my_company_id());
drop policy if exists test_messages_member_delete on public.test_messages;
create policy test_messages_member_delete on public.test_messages for delete using (company_id = public.my_company_id());
drop policy if exists test_messages_admin on public.test_messages;
create policy test_messages_admin on public.test_messages for all using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists test_messages_n8n on public.test_messages;
create policy test_messages_n8n on public.test_messages to n8n_worker using (true) with check (true);
grant select, insert on public.test_messages to n8n_worker;
-- ============================================================================

-- ============================================================================
-- (5) SCHEDULER de campañas programadas (Opción A: la plataforma es el reloj)
-- ----------------------------------------------------------------------------
-- pg_cron corre cada minuto; dispara ejecutar_campana para las campañas cuya
-- scheduled_at ya venció (status='activa'). una_vez → finalizada; diaria/semanal
-- → avanza scheduled_at a la próxima ocurrencia futura (salta las perdidas).
-- El evento lleva programado_para (ISO -05:00) para el candado de frescura de n8n.
-- ============================================================================
create extension if not exists pg_cron;

create or replace function public.tf_run_due_campaigns()
returns int language plpgsql security definer set search_path=public as $fn$
declare r record; step interval; v_next timestamptz; n int := 0;
begin
  for r in
    select * from public.campaigns
    where scheduled_at is not null and scheduled_at <= now() and status = 'activa'
    order by scheduled_at
    for update skip locked
  loop
    insert into public.n8n_events (company_id, event, payload)
    values (r.company_id, 'ejecutar_campana', jsonb_build_object(
      'company_id', r.company_id,
      'company_slug', (select slug from public.companies where id = r.company_id),
      'campaign_id', r.id,
      'filtros', r.filters,
      'mensaje', r.message_template,
      'cantidad', r.quantity,
      'frecuencia', r.frequency,
      'batch_size', r.batch_size,
      'programado_para', to_char(r.scheduled_at at time zone 'America/Bogota', 'YYYY-MM-DD"T"HH24:MI:SS') || '-05:00',
      'test', false
    ));
    step := case r.frequency when 'diaria' then interval '1 day' when 'semanal' then interval '7 days' else null end;
    if step is null then
      update public.campaigns set status='finalizada' where id=r.id;
    else
      v_next := r.scheduled_at + step;
      while v_next <= now() loop v_next := v_next + step; end loop;
      update public.campaigns set scheduled_at = v_next where id=r.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $fn$;

-- Programar el job (idempotente):
--   select cron.unschedule('tf-run-due-campaigns');  -- si ya existe
--   select cron.schedule('tf-run-due-campaigns', '* * * * *', 'select public.tf_run_due_campaigns()');
-- ============================================================================
