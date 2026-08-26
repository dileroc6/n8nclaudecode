-- ============================================================================
-- ToqueFlow — Supabase schema (auth + empresas + usuarios + roles)
-- ----------------------------------------------------------------------------
-- Cómo usarlo:
--   1. Crea un proyecto en https://supabase.com
--   2. Abre  SQL Editor → New query  y pega TODO este archivo
--   3. Run.  (Es idempotente: lo puedes correr más de una vez sin romper nada)
--   4. Crea tu super admin (ver bloque "PRIMER SUPER ADMIN" al final)
-- ============================================================================

-- ── Tablas ──────────────────────────────────────────────────────────────────

-- Empresas / clientes de ToqueFlow (nivel 1)
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique,
  city        text,
  logo_url    text,
  status      text        not null default 'active'
                          check (status in ('active', 'paused', 'archived')),
  created_at  timestamptz not null default now()
);

-- Usuarios (nivel 2). Cada fila se enlaza 1:1 con un usuario de Supabase Auth.
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  company_id      uuid references public.companies (id) on delete set null,
  full_name       text,
  email           text,
  phone           text,
  role            text        not null default 'member'
                              check (role in ('super_admin', 'member')),  -- member = "usuario"
  status          text        not null default 'active'
                              check (status in ('active', 'disabled')),
  last_sign_in_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles (company_id);
create index if not exists profiles_role_idx        on public.profiles (role);

-- Sedes / sucursales de una empresa (nivel intermedio). Una empresa tiene N sedes.
create table if not exists public.sedes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies (id) on delete cascade,
  name        text        not null,
  city        text,
  status      text        not null default 'active'
                          check (status in ('active', 'paused')),
  created_at  timestamptz not null default now()
);

create index if not exists sedes_company_id_idx on public.sedes (company_id);

-- Flows / automatizaciones de una empresa (su dashboard). sede_id NULL = aplica
-- a toda la empresa ("ambas sedes").
create table if not exists public.flows (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid        not null references public.companies (id) on delete cascade,
  sede_id     uuid        references public.sedes (id) on delete set null,
  name        text        not null,
  type        text,                       -- chat, admin, invoice, chart, ads, follow...
  kind        text,                       -- 'agente' | 'automatización'
  status      text        not null default 'activo'
                          check (status in ('activo', 'pausado')),
  description text,
  channels    jsonb       not null default '[]',   -- ['wa','tg',...]
  stats       jsonb       not null default '[]',   -- [{n,l}, ...]
  spark       jsonb       not null default '[]',   -- [n, n, ...]
  last_label  text,                       -- "hace 3 min"
  tool_url    text,                       -- si el flow abre una herramienta interna (ej. rappi-bogota.html)
  position    int         not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists flows_company_id_idx on public.flows (company_id);
create index if not exists flows_sede_id_idx     on public.flows (sede_id);

-- Registro/backup de cada pedido procesado por la automatización (Impresión Rappi, etc.)
create table if not exists public.rappi_orders (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid        not null references public.companies (id) on delete cascade,
  sede_id         uuid        references public.sedes (id) on delete set null,
  order_id        text,
  customer_name   text,
  items           jsonb       not null default '[]',
  subtotal        numeric,
  discount        numeric,
  total           numeric,
  order_timestamp text,
  raw_text        text,
  created_by      uuid        references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists rappi_orders_company_idx on public.rappi_orders (company_id, created_at desc);

-- Consumo de IA por llamada (tokens + costo USD). La escribe la Edge Function (service role).
create table if not exists public.ai_usage (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references public.companies (id) on delete set null,
  sede          text,
  tool          text,
  model         text,
  input_tokens  int  not null default 0,
  output_tokens int  not null default 0,
  cost_usd      numeric not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists ai_usage_company_idx on public.ai_usage (company_id, created_at desc);

-- ── Helpers (SECURITY DEFINER: corren sin RLS, evitan recursión en políticas) ─

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and status = 'active'
  );
$$;

create or replace function public.my_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_role()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── Trigger: crea automáticamente el profile al registrarse un usuario ────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- El rol SIEMPRE arranca en 'member'. Elevarlo a admin/super_admin solo se
  -- hace desde el panel del super admin (update protegido por RLS). Así nadie
  -- puede auto-asignarse un rol alto mandando metadata en el signup.
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'member',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.companies enable row level security;
alter table public.profiles  enable row level security;
alter table public.sedes     enable row level security;

-- sedes: el usuario ve las de su empresa; solo el super admin las gestiona
drop policy if exists sedes_select on public.sedes;
create policy sedes_select on public.sedes
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists sedes_write on public.sedes;
create policy sedes_write on public.sedes
  for all using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.flows enable row level security;

-- flows: el usuario ve los de su empresa (solo-ver); solo el super admin los gestiona
drop policy if exists flows_select on public.flows;
create policy flows_select on public.flows
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists flows_write on public.flows;
create policy flows_write on public.flows
  for all using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.rappi_orders enable row level security;

-- rappi_orders: el usuario ve y agrega los de su empresa; el super admin todo
drop policy if exists rappi_orders_select on public.rappi_orders;
create policy rappi_orders_select on public.rappi_orders
  for select using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists rappi_orders_insert on public.rappi_orders;
create policy rappi_orders_insert on public.rappi_orders
  for insert with check (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists rappi_orders_admin on public.rappi_orders;
create policy rappi_orders_admin on public.rappi_orders
  for all using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.ai_usage enable row level security;
-- el super admin ve todo el consumo; el usuario el de su empresa (la escritura la hace el service role, que salta RLS)
drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage
  for select using (public.is_super_admin() or company_id = public.my_company_id());

-- companies: el super admin ve/gestiona todas; el resto solo ve la suya
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (
    public.is_super_admin() or id = public.my_company_id()
  );

drop policy if exists companies_write on public.companies;
create policy companies_write on public.companies
  for all using (public.is_super_admin())
          with check (public.is_super_admin());

-- profiles: cada quien ve el suyo; el super admin ve todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid() or public.is_super_admin()
  );

-- super admin actualiza cualquier profile; cada usuario actualiza el suyo
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- el super admin puede insertar/borrar profiles manualmente si hace falta
drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
  for insert with check (public.is_super_admin() or id = auth.uid());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete using (public.is_super_admin());

-- ============================================================================
-- PRIMER SUPER ADMIN
-- ----------------------------------------------------------------------------
-- 1) Authentication → Users → "Add user" → crea tu correo + contraseña
--    (marca "Auto Confirm User" para no tener que confirmar por email).
-- 2) Copia su UID y córrelo aquí para volverlo super admin:
--
--    update public.profiles
--    set role = 'super_admin', full_name = 'Ferney Rojas'
--    where email = 'feruroc@gmail.com';
--
-- (El profile ya existe porque el trigger lo creó al dar de alta el usuario.)
-- ============================================================================

-- ── (Opcional) Empresa de ejemplo ────────────────────────────────────────────
-- insert into public.companies (name, slug, city)
-- values ('FerreteríaYa', 'ferreteriaya', 'Bogotá · Colombia')
-- on conflict (slug) do nothing;
