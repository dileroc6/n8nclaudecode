-- ============================================================================
-- ToqueFlow — Toque Recargas: matricular · descontar · recargar
-- ----------------------------------------------------------------------------
-- El paquete para quien vende por clases, sesiones, bonos o cupos. Hasta ahora
-- el agente sabía CONSULTAR el saldo y nada más, que es media herramienta:
-- consultar sin poder descontar deja el número desactualizado, y termina
-- diciendo un número que no es.
--
-- LA REGLA QUE NO SE NEGOCIA, y es la que da forma a todo el archivo:
--
--   MATRICULAR y RECARGAR los confirma SIEMPRE una persona.
--   DESCONTAR lo hace el agente solo.
--
-- No es prudencia genérica: es que las dos primeras REGALAN algo. Un agente al
-- que le escriban «ya te consigné, súbeme 10 clases» y las suba es un agente
-- que regala. Descontar va en la dirección contraria —le quita saldo a quien
-- lo usó— así que el peor caso de un error es un cliente molesto, no plata
-- perdida. Por eso una se aplica sola y las otras dos piden permiso.
--
-- Cómo se implementa esa regla: matricular y recargar NO tocan el saldo.
-- Escriben una SOLICITUD y avisan. Alguien la aprueba desde el portal, y ahí
-- se aplica. El agente puede contestar «queda pedido, te confirmo», que es la
-- verdad.
--
-- Y TODO deja rastro. Un saldo sin historia no se puede auditar: el día que
-- alguien diga «me descontaron una clase que no tomé» tiene que haber una
-- respuesta, y no puede ser «pues el número dice esto».
--
-- Requisitos: schema-saldos-aparte.sql (contact_saldo). Idempotente.
-- ============================================================================


-- ── 1. El libro de movimientos ───────────────────────────────────────────────
-- Cada cambio del saldo deja una línea. `saldo_despues` se guarda aunque se
-- pueda calcular: si mañana alguien corrige un movimiento viejo, el histórico
-- tiene que seguir contando lo que de verdad pasó ese día.
create table if not exists public.saldo_movimientos (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies (id) on delete cascade,
  contact_id    uuid not null references public.contacts (id) on delete cascade,

  tipo          text not null check (tipo in ('matricula', 'consumo', 'recarga', 'ajuste')),
  -- Con signo: negativo descuenta. Así el libro se suma y da el saldo.
  unidades      int  not null,
  saldo_despues int  not null,

  motivo        text,
  -- De dónde vino: el agente por WhatsApp, una persona en el portal, o un cron.
  origen        text not null default 'agente' check (origen in ('agente', 'portal', 'n8n')),
  solicitud_id  uuid,
  hecho_por     uuid references auth.users (id) on delete set null,

  -- El candado contra el doble descuento. Si el agente reintenta —y n8n
  -- reintenta— la misma referencia no se cobra dos veces. Sin esto, un timeout
  -- de red le cuesta una clase al cliente.
  referencia    text,

  created_at    timestamptz not null default now()
);

create index if not exists saldo_mov_contacto_idx on public.saldo_movimientos (contact_id, created_at desc);
create index if not exists saldo_mov_empresa_idx  on public.saldo_movimientos (company_id, created_at desc);
create unique index if not exists saldo_mov_referencia_idx
  on public.saldo_movimientos (company_id, contact_id, referencia)
  where referencia is not null;

comment on table public.saldo_movimientos is
  'El libro del saldo: cada matricula, consumo o recarga deja una linea con el saldo que quedo. Un saldo sin historia no se puede auditar.';


-- ── 2. Lo que espera aprobación ──────────────────────────────────────────────
create table if not exists public.saldo_solicitudes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,
  contact_id  uuid not null references public.contacts (id) on delete cascade,

  tipo        text not null check (tipo in ('matricula', 'recarga')),
  unidades    int  not null check (unidades > 0),
  que_compro  text,
  vence       date,
  -- Lo que dijo la persona, tal cual. Quien aprueba necesita el contexto, no
  -- solo un número: «dice que consignó ayer al Nequi» decide más que «+10».
  dicho       text,

  estado      text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota        text,
  resuelta_por uuid references auth.users (id) on delete set null,
  resuelta_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists saldo_sol_pendientes_idx
  on public.saldo_solicitudes (company_id, estado, created_at desc);

comment on table public.saldo_solicitudes is
  'Matriculas y recargas pedidas por WhatsApp, esperando que una persona las apruebe. El agente NUNCA las aplica solo: un agente que recarga solo es un agente que regala.';


-- ── 3. Descontar — la única que el agente aplica solo ───────────────────────
create or replace function public.tf_tool_registrar_consumo(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company  uuid;
  v_voc      jsonb;
  v_c        public.contacts%rowtype;
  v_s        public.contact_saldo%rowtype;
  v_cuantas  int  := greatest(1, coalesce((p_payload->>'unidades')::int, 1));
  v_ref      text := nullif(btrim(coalesce(p_payload->>'referencia', '')), '');
  v_nuevo    int;
  v_unidad   text;
begin
  select ac.company_id, coalesce(co.metadata->'vocabulario', '{}'::jsonb)
    into v_company, v_voc
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_payload->>'instance';

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_payload->>'telefono');
  if not found then
    return json_build_object('ok', false, 'motivo', 'no tengo a esta persona registrada');
  end if;

  -- El mismo consumo dos veces no se cobra dos veces. n8n reintenta ante un
  -- timeout, y sin esto el reintento le cuesta una clase a alguien.
  if v_ref is not null and exists (
    select 1 from public.saldo_movimientos
    where company_id = v_company and contact_id = v_c.id and referencia = v_ref
  ) then
    select * into v_s from public.contact_saldo where contact_id = v_c.id;
    return json_build_object('ok', true, 'repetido', true,
      'motivo', 'ese consumo ya estaba registrado',
      'quedan', coalesce(v_s.unidades, 0));
  end if;

  select * into v_s from public.contact_saldo where contact_id = v_c.id for update;
  if not found then
    -- Que no tenga saldo es una respuesta legítima, no un error. El agente
    -- tiene que poder decir «no tienes un paquete activo» sin inventarse uno.
    return json_build_object('ok', false, 'motivo', 'esta persona no tiene un paquete activo');
  end if;

  if v_s.unidades <= 0 then
    return json_build_object('ok', false, 'motivo', 'ya no le queda nada por usar', 'quedan', 0);
  end if;

  -- Nunca por debajo de cero. Si pide descontar 3 y le quedan 2, se descuentan
  -- 2 y se dice: un saldo negativo no significa nada para el negocio.
  v_cuantas := least(v_cuantas, v_s.unidades);
  v_nuevo   := v_s.unidades - v_cuantas;

  update public.contact_saldo
     set unidades = v_nuevo, actualizado_at = now()
   where contact_id = v_c.id;

  insert into public.saldo_movimientos
    (company_id, contact_id, tipo, unidades, saldo_despues, motivo, origen, referencia)
  values
    (v_company, v_c.id, 'consumo', -v_cuantas, v_nuevo,
     nullif(btrim(coalesce(p_payload->>'motivo', '')), ''), 'agente', v_ref);

  v_unidad := case when v_nuevo = 1
                then coalesce(v_voc->>'unidad', 'unidad')
                else coalesce(v_voc->>'unidad_plural', 'unidades') end;

  return json_build_object(
    'ok', true,
    'descontadas', v_cuantas,
    'quedan', v_nuevo,
    'unidad', v_unidad,
    'vence', v_s.vence
  );
end;
$fn$;

comment on function public.tf_tool_registrar_consumo(jsonb) is
  'Descuenta del saldo. La unica de las tres que el agente aplica solo: va en la direccion de quitar, no de regalar. Nunca baja de cero y no cobra dos veces la misma referencia.';


-- ── 4. Matricular y recargar — piden permiso, no aplican ────────────────────
-- Las dos hacen lo mismo por dentro, así que comparten motor. Lo que cambia es
-- el tipo, y lo que el agente le dice a la persona.
create or replace function public.tf_saldo_pedir(p_payload jsonb, p_tipo text)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_c       public.contacts%rowtype;
  v_id      uuid;
  v_cuantas int := coalesce((p_payload->>'unidades')::int, 0);
begin
  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_payload->>'telefono');
  if not found then
    return json_build_object('ok', false, 'motivo', 'no tengo a esta persona registrada');
  end if;

  if v_cuantas <= 0 then
    return json_build_object('ok', false,
      'motivo', 'falta cuantas unidades; preguntale a la persona que fue lo que compro');
  end if;

  -- Una sola solicitud viva por persona y tipo. Si insiste tres veces, al
  -- dueño no le deben llegar tres avisos de lo mismo: se actualiza la que hay.
  select id into v_id from public.saldo_solicitudes
  where company_id = v_company and contact_id = v_c.id
    and tipo = p_tipo and estado = 'pendiente'
  limit 1;

  if v_id is not null then
    update public.saldo_solicitudes set
      unidades   = v_cuantas,
      que_compro = coalesce(nullif(btrim(coalesce(p_payload->>'que_compro','')),''), que_compro),
      vence      = coalesce((p_payload->>'vence')::date, vence),
      dicho      = coalesce(nullif(btrim(coalesce(p_payload->>'dicho','')),''), dicho),
      created_at = now()
    where id = v_id;
  else
    insert into public.saldo_solicitudes
      (company_id, contact_id, tipo, unidades, que_compro, vence, dicho)
    values (v_company, v_c.id, p_tipo, v_cuantas,
            nullif(btrim(coalesce(p_payload->>'que_compro','')),''),
            (p_payload->>'vence')::date,
            nullif(btrim(coalesce(p_payload->>'dicho','')),''))
    returning id into v_id;
  end if;

  -- Se devuelve `aplicado:false` explícito. Si algún día el workflow se
  -- equivoca y lo lee como hecho, que sea porque ignoró un campo que decía lo
  -- contrario, no porque la respuesta era ambigua.
  return json_build_object(
    'ok', true,
    'aplicado', false,
    'solicitud_id', v_id,
    'estado', 'pendiente',
    'que_decir', 'Queda registrada la solicitud. Alguien del negocio la revisa y te confirma.'
  );
end;
$fn$;

create or replace function public.tf_tool_matricular_cliente(p_payload jsonb)
returns json language sql volatile security definer set search_path = public as $fn$
  select public.tf_saldo_pedir(p_payload, 'matricula');
$fn$;

create or replace function public.tf_tool_recargar_saldo(p_payload jsonb)
returns json language sql volatile security definer set search_path = public as $fn$
  select public.tf_saldo_pedir(p_payload, 'recarga');
$fn$;

comment on function public.tf_tool_matricular_cliente(jsonb) is
  'Registra que alguien dice haber comprado un paquete. NO toca el saldo: deja una solicitud para que la apruebe una persona.';
comment on function public.tf_tool_recargar_saldo(jsonb) is
  'Registra que alguien pide recargar. NO toca el saldo: deja una solicitud para que la apruebe una persona.';


-- ── 5. La persona aprueba ────────────────────────────────────────────────────
-- Se llama desde el portal, con la sesión de quien aprueba. `auth.uid()` y no
-- un parámetro: quién aprobó no se acepta del cliente, se lee de la sesión.
create or replace function public.tf_saldo_resolver(
  p_solicitud uuid,
  p_aprobar   boolean,
  p_nota      text default null
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_s      public.saldo_solicitudes%rowtype;
  v_saldo  public.contact_saldo%rowtype;
  v_nuevo  int;
  v_quien  uuid := auth.uid();
  v_mia    uuid;
begin
  select * into v_s from public.saldo_solicitudes where id = p_solicitud for update;
  if not found then
    return json_build_object('ok', false, 'motivo', 'esa solicitud no existe');
  end if;

  -- El aislamiento se comprueba aquí y no se confía en la pantalla: aprobar la
  -- solicitud de otra empresa sería tocarle el saldo a un cliente ajeno.
  --
  -- ⚠ ESTO ESTUVO MAL Y LA PRUEBA LO CAZÓ. La primera versión era:
  --      if not (is_super_admin() or v_s.company_id = my_company_id())
  --   Con un usuario SIN empresa, `my_company_id()` devuelve null, la
  --   comparación da null, `false or null` da null, `not null` da null — y un
  --   IF con condición nula NO SE DISPARA. O sea: el candado dejaba pasar
  --   justo a quien no tiene empresa. Cualquiera que se registrara solo y
  --   supiera el uuid de una solicitud podía aprobarla.
  --
  -- Se escribe en positivo y con la sesión exigida aparte, para que no haya
  -- una tercera respuesta posible entre «sí» y «no».
  if v_quien is null then
    return json_build_object('ok', false, 'motivo', 'hay que iniciar sesion para aprobar');
  end if;

  v_mia := public.my_company_id();
  if not (public.is_super_admin() or (v_mia is not null and v_mia = v_s.company_id)) then
    return json_build_object('ok', false, 'motivo', 'esa solicitud no es de tu empresa');
  end if;

  if v_s.estado <> 'pendiente' then
    return json_build_object('ok', false, 'motivo', 'esa solicitud ya se resolvio', 'estado', v_s.estado);
  end if;

  if not p_aprobar then
    update public.saldo_solicitudes
       set estado = 'rechazada', nota = p_nota, resuelta_por = v_quien, resuelta_at = now()
     where id = p_solicitud;
    return json_build_object('ok', true, 'estado', 'rechazada');
  end if;

  select * into v_saldo from public.contact_saldo where contact_id = v_s.contact_id for update;
  if not found then
    insert into public.contact_saldo (contact_id, company_id, unidades, vence, que_compro)
    values (v_s.contact_id, v_s.company_id, v_s.unidades, v_s.vence, v_s.que_compro);
    v_nuevo := v_s.unidades;
  else
    v_nuevo := v_saldo.unidades + v_s.unidades;
    update public.contact_saldo set
      unidades = v_nuevo,
      vence      = coalesce(v_s.vence, vence),
      que_compro = coalesce(v_s.que_compro, que_compro),
      actualizado_at = now()
    where contact_id = v_s.contact_id;
  end if;

  insert into public.saldo_movimientos
    (company_id, contact_id, tipo, unidades, saldo_despues, motivo, origen, solicitud_id, hecho_por)
  values
    (v_s.company_id, v_s.contact_id, v_s.tipo, v_s.unidades, v_nuevo,
     coalesce(p_nota, v_s.que_compro), 'portal', v_s.id, v_quien);

  update public.saldo_solicitudes
     set estado = 'aprobada', nota = p_nota, resuelta_por = v_quien, resuelta_at = now()
   where id = p_solicitud;

  return json_build_object('ok', true, 'estado', 'aprobada', 'quedan', v_nuevo);
end;
$fn$;

comment on function public.tf_saldo_resolver(uuid, boolean, text) is
  'Aprueba o rechaza una solicitud de matricula o recarga. Es el unico camino por el que el saldo SUBE. Comprueba la empresa aqui: aprobar la solicitud de otra seria tocarle el saldo a un cliente ajeno.';


-- ── 6. Lo que hay pendiente, para la pantalla ────────────────────────────────
drop view if exists public.saldo_pendientes;
create view public.saldo_pendientes
with (security_invoker = on) as
select
  s.id, s.company_id, s.tipo, s.unidades, s.que_compro, s.vence, s.dicho,
  s.created_at,
  c.full_name as persona,
  c.phone     as telefono,
  coalesce(sa.unidades, 0) as saldo_actual
from public.saldo_solicitudes s
join public.contacts c on c.id = s.contact_id
left join public.contact_saldo sa on sa.contact_id = s.contact_id
where s.estado = 'pendiente';

comment on view public.saldo_pendientes is
  'Las matriculas y recargas esperando aprobacion, con quien las pidio y cuanto tiene hoy.';


-- ── 7. RLS ───────────────────────────────────────────────────────────────────
alter table public.saldo_movimientos enable row level security;
alter table public.saldo_solicitudes enable row level security;

drop policy if exists saldo_mov_suyo on public.saldo_movimientos;
create policy saldo_mov_suyo on public.saldo_movimientos
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

drop policy if exists saldo_sol_suyo on public.saldo_solicitudes;
create policy saldo_sol_suyo on public.saldo_solicitudes
  for select to authenticated
  using (public.is_super_admin() or company_id = public.my_company_id());

-- Nadie escribe estas tablas a mano desde el navegador: se escriben por las
-- funciones, que son las que llevan las reglas. Sin política de insert ni de
-- update, RLS lo prohíbe por omisión.
grant select on public.saldo_movimientos to authenticated;
grant select on public.saldo_solicitudes to authenticated;
grant select on public.saldo_pendientes  to authenticated;


-- ── 8. Permisos de las funciones ─────────────────────────────────────────────
revoke all on function public.tf_saldo_pedir(jsonb, text)              from public, anon, authenticated;
revoke all on function public.tf_tool_registrar_consumo(jsonb)         from public, anon, authenticated;
revoke all on function public.tf_tool_matricular_cliente(jsonb)        from public, anon, authenticated;
revoke all on function public.tf_tool_recargar_saldo(jsonb)            from public, anon, authenticated;
revoke all on function public.tf_saldo_resolver(uuid, boolean, text)   from public, anon, authenticated;

-- Aprobar lo hace una persona con sesión. El worker de n8n NO puede aprobar:
-- si pudiera, la regla de la confirmación humana sería una sugerencia.
grant execute on function public.tf_saldo_resolver(uuid, boolean, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_registrar_consumo(jsonb)  to n8n_worker;
    grant execute on function public.tf_tool_matricular_cliente(jsonb) to n8n_worker;
    grant execute on function public.tf_tool_recargar_saldo(jsonb)     to n8n_worker;
    grant select on public.saldo_movimientos to n8n_worker;
    grant select on public.saldo_solicitudes to n8n_worker;
  end if;
end $$;


-- ── 9. El catálogo: qué recibe cada herramienta ─────────────────────────────
-- `entrada` es lo que el agente le pasa a la herramienta. Se declara aquí para
-- que el workflow arme la llamada sin que nadie lo adivine.
update public.catalogo set
  estado  = 'funcionando',
  entrada = '{"type":"object","properties":{
      "unidades":{"type":"integer","description":"Cuantas unidades uso. Casi siempre 1."},
      "motivo":{"type":"string","description":"Por que se descuenta, en una linea."},
      "referencia":{"type":"string","description":"Un identificador del hecho (el id del mensaje) para no cobrarlo dos veces."}
    }}'::jsonb
where clave = 'registrar-consumo';

update public.catalogo set
  entrada = '{"type":"object","required":["unidades"],"properties":{
      "unidades":{"type":"integer","description":"Cuantas unidades compro."},
      "que_compro":{"type":"string","description":"Que paquete compro, en las palabras del negocio."},
      "vence":{"type":"string","description":"Fecha de vencimiento, AAAA-MM-DD, si la dijo."},
      "dicho":{"type":"string","description":"Lo que dijo la persona, tal cual. Quien aprueba necesita el contexto."}
    }}'::jsonb
where clave in ('matricular-cliente', 'recargar-saldo');

-- Los tres quedan SIN liberar a propósito: las funciones existen y están
-- probadas, pero hasta que los tres workflows estén importados en n8n el
-- agente no las puede llamar. Liberar algo que no se puede ejecutar es
-- exactamente lo que la fila 2 de las reglas dice que no se hace.
update public.catalogo set liberado = false
where clave in ('matricular-cliente', 'registrar-consumo', 'recargar-saldo');
