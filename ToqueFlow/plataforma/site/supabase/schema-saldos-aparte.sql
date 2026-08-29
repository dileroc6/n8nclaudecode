-- ============================================================================
-- ToqueFlow — El saldo sale de la tabla que usan todos
-- ----------------------------------------------------------------------------
-- Diego lo dijo mejor de lo que yo lo había dicho:
--
--   «Si es un módulo estándar debería aplicar para TODOS los sectores,
--    y ya las herramientas pues sí van cambiando por sector.»
--
-- Esa es la regla, y hay que auditar el esquema contra ella. Lo que quedaba
-- violándola:
--
--   contacts.clases_restantes    solo le sirve a quien vende por paquetes
--   contacts.fecha_renovacion    lo mismo
--
-- Están en la tabla que usan TODOS. Una tienda, un hotel y una agencia cargan
-- con dos columnas que no van a llenar nunca — y peor: sugieren que la
-- plataforma supone un modelo de negocio que no es el suyo.
--
-- El saldo es de una HERRAMIENTA, no del contacto. Se muda a su propia tabla,
-- que solo tiene filas para quien use esa herramienta.
--
-- Las columnas viejas NO se borran todavía: las lee `contactos.html` y el
-- simulador. Se migran los datos, la herramienta pasa a leer de la tabla
-- nueva, y quitarlas queda como tarea con su prueba. Romper el panel de un
-- cliente que sí paga por limpiar un nombre feo no vale la pena.
--
-- Idempotente.
-- ============================================================================


-- ── La tabla del saldo ───────────────────────────────────────────────────────
create table if not exists public.contact_saldo (
  contact_id  uuid primary key references public.contacts (id) on delete cascade,
  company_id  uuid not null references public.companies (id) on delete cascade,

  -- Cuántas unidades le quedan. Cómo se llaman lo dice el vocabulario del
  -- negocio: clases, sesiones, cupos, créditos, bonos.
  unidades    int not null default 0,
  vence       date,

  -- Qué compró, en las palabras del negocio. Sin lista fija a propósito.
  que_compro  text,

  actualizado_at timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

comment on table public.contact_saldo is
  'Cuantas unidades le quedan a alguien de lo que compro. Solo tiene filas para las empresas que usen las herramientas de saldo: un hotel o una tienda no aparecen aqui. Antes esto vivia en dos columnas de `contacts`, que las cargaba todo el mundo.';

create index if not exists contact_saldo_company_idx on public.contact_saldo (company_id);


-- ── Se traen los datos que ya existen ────────────────────────────────────────
insert into public.contact_saldo (contact_id, company_id, unidades, vence, que_compro)
select c.id, c.company_id, coalesce(c.clases_restantes, 0), c.fecha_renovacion, c.service_type
from public.contacts c
where c.clases_restantes is not null
on conflict (contact_id) do update set
  unidades   = excluded.unidades,
  vence      = excluded.vence,
  que_compro = excluded.que_compro,
  actualizado_at = now();


-- ── Permisos ─────────────────────────────────────────────────────────────────
alter table public.contact_saldo enable row level security;

drop policy if exists contact_saldo_select on public.contact_saldo;
create policy contact_saldo_select on public.contact_saldo
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists contact_saldo_admin on public.contact_saldo;
create policy contact_saldo_admin on public.contact_saldo
  for all to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id())
  with check (public.is_super_admin() or company_id = public.my_company_id());

grant select, insert, update, delete on public.contact_saldo to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select, insert, update on public.contact_saldo to n8n_worker;
  end if;
end $$;


-- ── La herramienta lee de la tabla nueva ─────────────────────────────────────
create or replace function public.tf_tool_consultar_saldo(
  p_instance text,
  p_telefono text
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_voc     jsonb;
  v_c       public.contacts%rowtype;
  v_s       public.contact_saldo%rowtype;
begin
  select ac.company_id, coalesce(co.metadata->'vocabulario', '{}'::jsonb)
    into v_company, v_voc
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_telefono);

  if not found then
    -- Decir que no se encontró a la persona es MEJOR que devolver cero: cero
    -- suena a «se le acabaron» y es una respuesta falsa.
    return json_build_object('ok', false, 'motivo', 'no encontre a esta persona en la base');
  end if;

  select * into v_s from public.contact_saldo where contact_id = v_c.id;

  if not found then
    -- Que exista la persona pero no tenga saldo tampoco es cero: es que nunca
    -- compró un paquete. Son cosas distintas y el agente debe poder decirlas
    -- distinto.
    return json_build_object(
      'ok', true, 'nombre', v_c.full_name, 'tiene_saldo', false,
      'motivo', 'esta persona no tiene ningun paquete activo'
    );
  end if;

  return json_build_object(
    'ok', true,
    'tiene_saldo', true,
    'nombre', v_c.full_name,
    'saldo', v_s.unidades,
    -- Cómo llamar a lo que le queda, en las palabras de ESTE negocio. Sin
    -- esto el agente diría «clases» en una clínica estética.
    'unidad', coalesce(v_voc->>'unidad', 'unidad'),
    'unidad_plural', coalesce(v_voc->>'unidad_plural', 'unidades'),
    'vence', v_s.vence,
    'que_compro', v_s.que_compro,
    'estado', v_c.status
  );
end;
$fn$;

revoke all on function public.tf_tool_consultar_saldo(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
  end if;
end $$;


-- ── Los estados que la plataforma sí puede imponer ───────────────────────────
-- `status` traía «deudor» y «embajador», que son categorías de Bejauha. Se
-- amplía en vez de sustituir: quitarlas rompería sus 46 contactos. Lo que se
-- agrega es lo que cualquier negocio necesita.
alter table public.contacts drop constraint if exists contacts_status_check;
alter table public.contacts add constraint contacts_status_check
  check (status = any (array[
    'prospecto',   -- escribió, todavía no compra
    'activo',      -- es cliente y está andando
    'no_activo',   -- fue cliente y se fue
    'deudor',      -- debe algo
    'embajador',   -- recomienda
    'perdido'      -- se descartó
  ]));

comment on column public.contacts.status is
  'En que anda esta persona con el negocio. Son estados de relacion, que sirven igual para una tienda, un hotel o un gimnasio — a diferencia de lo que compro, que cambia por sector y va en service_type sin lista fija.';
