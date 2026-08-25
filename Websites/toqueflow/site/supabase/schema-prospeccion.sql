-- ============================================================================
-- ToqueFlow — Esquema de PROSPECCIÓN (la máquina de leads de ToqueFlow)
-- ----------------------------------------------------------------------------
-- Decisión de arquitectura: ToqueFlow se da de alta como UNA EMPRESA MÁS en su
-- propia plataforma. Sus prospectos (los spas que queremos como clientes) son
-- filas de `contacts` con esa company_id y status='prospecto'. Así se reusa
-- todo lo que ya corre: contactos.html (vista Prospectos), campanas.html,
-- campaign_runs, message_log y el aislamiento por RLS.
--
-- Este archivo solo agrega lo que NO existe todavía. Ver la estrategia completa
-- en _docs/estrategia-leads.md §5.
--
-- Requisitos: correr PRIMERO schema.sql y schema-negocio.sql. Idempotente.
-- ============================================================================

-- ── 1. Deduplicación por place_id de Google Maps ─────────────────────────────
-- El índice único de contacts es (company_id, phone), pero muchas fichas de
-- Google Maps no traen teléfono útil y el scraper corre repetidamente. El
-- place_id es la llave estable de Google (la única que se puede almacenar de
-- forma indefinida según sus términos), y vive en contacts.metadata.
create unique index if not exists contacts_company_placeid_uidx
  on public.contacts (company_id, (metadata ->> 'place_id'))
  where (metadata ->> 'place_id') is not null;

-- Consulta rápida de la cola de prospección por score.
create index if not exists contacts_company_score_idx
  on public.contacts (company_id, ((metadata ->> 'score')::int) desc)
  where (metadata ->> 'score') is not null;


-- ── 2. outreach_events — aperturas, clics y rebotes del correo ────────────────
-- campaign_runs cubre enviado/fallido/respondido, pero no abrió ni hizo clic.
-- Esta tabla registra cada evento que reporta el proveedor de email.
create table if not exists public.outreach_events (
  id          uuid        primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies (id) on delete cascade,
  contact_id  uuid        references public.contacts (id)  on delete cascade,
  campaign_id uuid        references public.campaigns (id) on delete set null,
  step        int,                                  -- paso de la secuencia (1..4)
  event       text        not null
              check (event in ('sent','delivered','opened','clicked',
                               'replied','bounced','complained','unsubscribed')),
  provider_id text,                                 -- id del mensaje en el proveedor
  metadata    jsonb       not null default '{}',    -- url del clic, motivo del rebote, etc.
  created_at  timestamptz not null default now()
);
create index if not exists outreach_events_company_idx on public.outreach_events (company_id, created_at desc);
create index if not exists outreach_events_contact_idx on public.outreach_events (contact_id, created_at desc);
create index if not exists outreach_events_event_idx   on public.outreach_events (company_id, event, created_at desc);


-- ── 3. outreach_optouts — lista de exclusión permanente ──────────────────────
-- Obligación legal (Ley 1581/2012 + Decreto 1377/2013): honrar la baja de
-- inmediato y no volver a contactar. Se consulta ANTES de cada envío.
-- Sobrevive al borrado del contacto a propósito: la baja es permanente.
create table if not exists public.outreach_optouts (
  id         uuid        primary key default gen_random_uuid(),
  company_id uuid        not null references public.companies (id) on delete cascade,
  email      text,
  phone      text,
  reason     text,                                  -- 'baja' | 'queja' | 'rebote_duro' | manual
  source     text,                                  -- de dónde vino la solicitud
  created_at timestamptz not null default now(),
  check (email is not null or phone is not null)
);
create unique index if not exists outreach_optouts_company_email_uidx
  on public.outreach_optouts (company_id, lower(email)) where email is not null;
create unique index if not exists outreach_optouts_company_phone_uidx
  on public.outreach_optouts (company_id, phone) where phone is not null;


-- ── 4. demos — landing personalizada + bot demo por prospecto ────────────────
-- El diferenciador de la estrategia: cada prospecto recibe una página propia
-- (toqueflow.com/d/<slug>) con su diagnóstico y un bot cargado con SU
-- información. Reusa el sandbox de test_messages.
create table if not exists public.demos (
  id         uuid        primary key default gen_random_uuid(),
  company_id uuid        not null references public.companies (id) on delete cascade,
  contact_id uuid        references public.contacts (id) on delete cascade,
  slug       text        not null,                  -- la URL: /d/<slug>
  config     jsonb       not null default '{}',     -- servicios, precios, horarios, ángulo
  visits     int         not null default 0,
  messages   int         not null default 0,        -- mensajes intercambiados con el bot
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists demos_slug_uidx    on public.demos (slug);
create index        if not exists demos_company_idx  on public.demos (company_id, created_at desc);
create index        if not exists demos_contact_idx  on public.demos (contact_id);

drop trigger if exists demos_touch on public.demos;
create trigger demos_touch before update on public.demos
  for each row execute function public.tf_touch_updated_at();


-- ── 5. RLS — mismo patrón que schema-negocio.sql ─────────────────────────────
alter table public.outreach_events  enable row level security;
alter table public.outreach_optouts enable row level security;
alter table public.demos            enable row level security;

drop policy if exists outreach_events_select on public.outreach_events;
create policy outreach_events_select on public.outreach_events
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists outreach_events_admin on public.outreach_events;
create policy outreach_events_admin on public.outreach_events
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists outreach_optouts_select on public.outreach_optouts;
create policy outreach_optouts_select on public.outreach_optouts
  for select using (public.is_super_admin() or company_id = public.my_company_id());

-- La baja la puede registrar el propio miembro (desde el panel) o el admin.
drop policy if exists outreach_optouts_member_insert on public.outreach_optouts;
create policy outreach_optouts_member_insert on public.outreach_optouts
  for insert with check (company_id = public.my_company_id());

drop policy if exists outreach_optouts_admin on public.outreach_optouts;
create policy outreach_optouts_admin on public.outreach_optouts
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists demos_select on public.demos;
create policy demos_select on public.demos
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists demos_admin on public.demos;
create policy demos_admin on public.demos
  for all using (public.is_super_admin()) with check (public.is_super_admin());


-- ── 6. Permisos del rol n8n_worker ───────────────────────────────────────────
-- Mínimos privilegios, igual que en el resto: n8n escribe eventos y demos,
-- lee la lista de exclusión, y NUNCA borra.
-- OJO: el rol debe existir (lo crea schema-negocio.sql). Si no existe, esta
-- sección falla — es esperado en una instalación limpia sin n8n todavía.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select, insert         on public.outreach_events  to n8n_worker;
    grant select                 on public.outreach_optouts to n8n_worker;
    grant select, insert, update on public.demos            to n8n_worker;
  end if;
end $$;


-- ── Notas ────────────────────────────────────────────────────────────────────
-- · Los prospectos NO viven aquí: viven en `contacts` con status='prospecto'.
--   metadata guarda place_id, rating, reseñas, horarios, señales y el ángulo.
--   lead_stage guarda la temperatura (caliente/tibio/frio).
-- · La secuencia de correos usa `campaigns` + `campaign_runs` tal cual.
-- · Cada correo enviado y recibido va a `message_log` con channel='email'.
-- · ANTES de cada envío hay que consultar outreach_optouts. No es opcional.
