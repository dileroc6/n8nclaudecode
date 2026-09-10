-- ============================================================================
-- ToqueFlow — Las dos piezas que no caben en ningún paquete
-- ----------------------------------------------------------------------------
-- `registrar-reclamo` y `reactivacion` no son de un sector: le sirven a una
-- clínica, a una ferretería y a un gimnasio por igual. Por eso no entran en
-- Agenda, ni en Recargas, ni en Tienda — se le suman sueltas a Toque Atiende.
--
--   REGISTRAR RECLAMO   el agente ya sabía escalar. Lo que no sabía era dejar
--                       el caso ESCRITO. Un reclamo escalado y no anotado vive
--                       en un chat, y en un chat se pierde. Con número de
--                       seguimiento, el cliente puede volver a preguntar por
--                       él y alguien puede contestar.
--
--   REACTIVACION        corre sola, sin conversación: busca a quien lleva
--                       tiempo sin volver. Aquí va SOLO la pregunta —a quién
--                       hay que escribirle—; el envío es de n8n. Separarlo es
--                       lo que permite mirar la lista antes de mandar nada.
--
-- Requisitos: schema-agente-runtime.sql. Idempotente.
-- ============================================================================


-- ── 1. Los reclamos ──────────────────────────────────────────────────────────
-- `numero` es por empresa y corto a propósito: es lo que se le dice a la
-- persona por WhatsApp, y un uuid no se dicta por teléfono.
create table if not exists public.reclamos (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  contact_id  uuid references public.contacts (id) on delete set null,

  numero      int  not null,
  texto       text not null,
  -- En las palabras del negocio si las tiene; si no, lo que entendió el agente.
  sobre       text,

  estado      text not null default 'abierto' check (estado in ('abierto', 'en_curso', 'resuelto')),
  nota        text,
  resuelto_por uuid references auth.users (id) on delete set null,
  resuelto_at timestamptz,
  created_at  timestamptz not null default now()
);

-- El único que importa: dos reclamos con el mismo número en la misma empresa
-- harían inútil el número. Si dos entran a la vez, uno falla y reintenta.
create unique index if not exists reclamos_numero_idx on public.reclamos (company_id, numero);
create index if not exists reclamos_abiertos_idx on public.reclamos (company_id, estado, created_at desc);

comment on table public.reclamos is
  'Las quejas que llegan por WhatsApp, con un numero corto que se le puede dictar a la persona. Escalar sin anotar deja el caso en un chat, y en un chat se pierde.';


create or replace function public.tf_tool_registrar_reclamo(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_c       public.contacts%rowtype;
  v_texto   text := nullif(btrim(coalesce(p_payload->>'texto', '')), '');
  v_numero  int;
  v_id      uuid;
  v_intento int := 0;
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  if v_texto is null then
    return json_build_object('ok', false,
      'motivo', 'falta que me digas cual es el reclamo, en las palabras de la persona');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_payload->>'telefono');

  -- Si la persona ya tiene un reclamo abierto, se le devuelve ESE número en
  -- vez de abrir otro. Alguien que insiste tres veces no tiene tres problemas;
  -- tiene uno y está molesto, y darle tres números empeora las dos cosas.
  if v_c.id is not null then
    select id, numero into v_id, v_numero from public.reclamos
    where company_id = v_company and contact_id = v_c.id and estado <> 'resuelto'
    order by created_at desc limit 1;

    if v_id is not null then
      update public.reclamos
         set texto = texto || E'\n---\n' || v_texto
       where id = v_id;
      return json_build_object('ok', true, 'numero', v_numero, 'ya_existia', true,
        'que_decir', 'Ya tienes el caso ' || v_numero || ' abierto; le sumé lo que me acabas de decir.');
    end if;
  end if;

  -- El número se saca y se inserta en el mismo intento. Si dos reclamos entran
  -- a la vez el índice único lo impide, y se reintenta: es más simple que una
  -- secuencia por empresa y no deja huecos raros.
  loop
    v_intento := v_intento + 1;
    select coalesce(max(numero), 0) + 1 into v_numero
    from public.reclamos where company_id = v_company;
    begin
      insert into public.reclamos (company_id, contact_id, numero, texto, sobre)
      values (v_company, v_c.id, v_numero, v_texto,
              nullif(btrim(coalesce(p_payload->>'sobre', '')), ''))
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_intento >= 5 then raise; end if;
    end;
  end loop;

  return json_build_object(
    'ok', true,
    'numero', v_numero,
    'ya_existia', false,
    'que_decir', 'Queda registrado con el numero ' || v_numero || '. Alguien lo revisa y te responde.'
  );
end;
$fn$;

comment on function public.tf_tool_registrar_reclamo(jsonb) is
  'Anota una queja y devuelve un numero corto para decirselo a la persona. Si ya tenia uno abierto, le suma lo nuevo en vez de abrir otro.';


-- ── 2. Los reclamos abiertos, para la pantalla ──────────────────────────────
drop view if exists public.reclamos_abiertos;
create view public.reclamos_abiertos
with (security_invoker = on) as
select
  r.id, r.company_id, r.numero, r.texto, r.sobre, r.estado, r.created_at,
  c.full_name as persona,
  c.phone     as telefono,
  (now() - r.created_at) as lleva
from public.reclamos r
left join public.contacts c on c.id = r.contact_id
where r.estado <> 'resuelto';

comment on view public.reclamos_abiertos is
  'Los reclamos sin resolver, con quien los puso y cuanto llevan esperando.';


-- ── 3. A quién hay que escribirle — la reactivación ─────────────────────────
-- Devuelve la lista, NO manda nada. Que sean dos pasos es lo que permite mirar
-- a quién se le va a escribir antes de escribirle, y es la misma regla del
-- candado de las campañas: un envío masivo que sale sin que nadie lo mire es
-- como se gana un baneo.
create or replace function public.tf_reactivacion_candidatos(
  p_company uuid,
  p_dias    int default 60,
  p_limite  int default 100
)
returns table (
  contact_id uuid,
  nombre     text,
  telefono   text,
  ultimo     timestamptz,
  dias_sin_volver int
)
language sql
stable
security definer
set search_path = public
as $fn$
  select
    c.id, c.full_name, c.phone, c.last_contact_at,
    extract(day from now() - c.last_contact_at)::int
  from public.contacts c
  where c.company_id = p_company
    and c.last_contact_at is not null
    and c.last_contact_at < now() - make_interval(days => greatest(1, p_dias))
    -- Quien se dio de baja no vuelve a recibir nada. Es lo primero que se
    -- comprueba y no una opción: escribirle a quien pidió que no le
    -- escribieran es como se pierde un número de WhatsApp.
    and not exists (
      select 1 from public.outreach_optouts o
      where o.company_id = p_company
        and public.tf_telefono(o.phone) = public.tf_telefono(c.phone)
    )
    -- Ni a quien ya está marcado como perdido: eso es una decisión que alguien
    -- del negocio tomó, y un cron no la revierte.
    and coalesce(c.status, '') not in ('perdido', 'baja', 'no_contactar')
  order by c.last_contact_at asc
  limit greatest(1, p_limite);
$fn$;

comment on function public.tf_reactivacion_candidatos(uuid, int, int) is
  'A quien no se le ve el pelo hace mas de N dias. Devuelve la lista y no manda nada: mirarla antes de escribir es el punto. Excluye a quien se dio de baja y a quien el negocio marco como perdido.';


-- ── 4. RLS y permisos ────────────────────────────────────────────────────────
alter table public.reclamos enable row level security;

drop policy if exists reclamos_suyos on public.reclamos;
create policy reclamos_suyos on public.reclamos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

-- Cerrar un reclamo sí lo hace una persona desde el portal.
drop policy if exists reclamos_resolver on public.reclamos;
create policy reclamos_resolver on public.reclamos
  for update to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id())
  with check (public.is_super_admin() or company_id = public.my_company_id());

grant select, update on public.reclamos to authenticated;
grant select on public.reclamos_abiertos to authenticated;

revoke all on function public.tf_tool_registrar_reclamo(jsonb) from public, anon, authenticated;
revoke all on function public.tf_reactivacion_candidatos(uuid, int, int) from public, anon;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_registrar_reclamo(jsonb) to n8n_worker;
    grant execute on function public.tf_reactivacion_candidatos(uuid, int, int) to n8n_worker;
    grant select on public.reclamos to n8n_worker;
  end if;
end $$;


-- ── 5. El catálogo ───────────────────────────────────────────────────────────
update public.catalogo set
  estado  = 'funcionando',
  entrada = '{"type":"object","required":["texto"],"properties":{
      "texto":{"type":"string","description":"El reclamo en las palabras de la persona, tal cual."},
      "sobre":{"type":"string","description":"De que es la queja: un pedido, una cita, un cobro."}
    }}'::jsonb
where clave = 'registrar-reclamo';

update public.catalogo set
  estado     = 'a_medias',
  parametros = array['Cuanto tiempo sin volver cuenta como inactivo (dias)',
                     'El mensaje que se le manda',
                     'De a cuantos por lote']
where clave = 'reactivacion';

-- Sin liberar: las funciones existen y están probadas, pero el agente no las
-- puede llamar hasta que sus workflows estén importados en n8n. Liberar algo
-- que no se puede ejecutar es lo que la regla 2 dice que no se hace.
update public.catalogo set liberado = false
where clave in ('registrar-reclamo', 'reactivacion');
