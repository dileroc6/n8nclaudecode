-- ============================================================================
-- ToqueFlow — Cada negocio con su propia pasarela de pagos
-- ----------------------------------------------------------------------------
-- Hoy hay UNA pasarela para toda la plataforma: las llaves de ePayco de Bejauha
-- viven como secretos globales de la edge function (`EPAYCO_P_CUST_ID`,
-- `EPAYCO_P_KEY`). Funciona con un cliente y se rompe con dos: el segundo
-- negocio que cobre estaría cobrando a la cuenta del primero.
--
-- DÓNDE VIVEN LAS LLAVES, Y POR QUÉ AHÍ
--
-- En el esquema `private`, que no está expuesto ni a `anon` ni a
-- `authenticated`: no se puede leer por la API ni con sesión de portal. El
-- cliente las ESCRIBE por una función y nunca las vuelve a leer — la pantalla
-- le muestra los últimos cuatro caracteres para que reconozca cuál puso, y
-- nada más.
--
-- Esa asimetría es a propósito. Una llave privada de pasarela que se puede leer
-- de vuelta desde el navegador es una llave que viaja en cada carga de la
-- pantalla, queda en la caché y sale en cualquier captura de pantalla que el
-- cliente mande por WhatsApp pidiendo ayuda.
--
-- LO QUE ESTO NO HACE
--
-- No cobra. Guarda con qué cobra cada negocio y con qué llaves, para que el
-- receptor de pagos sepa de quién es cada transacción y con qué firma
-- comprobarla. Construir el cobro contra cada pasarela es trabajo por pasarela
-- y necesita credenciales reales para probarse.
--
-- Idempotente.
-- ============================================================================

-- ── 1. Las que se ofrecen ───────────────────────────────────────────────────
-- Es información pública —qué pasarelas soporta ToqueFlow y qué pide cada una—
-- así que va en `public`: la pantalla la lee para armar el formulario sola.
-- Agregar una pasarela nueva es una fila, no un cambio de código.
create table if not exists public.pasarelas_soportadas (
  clave       text primary key,
  nombre      text not null,
  pais        text,
  -- Qué hay que pedirle al negocio. Cada una: { campo, etiqueta, secreto }.
  -- `secreto` decide si se enmascara al mostrarla de vuelta.
  campos      jsonb not null default '[]'::jsonb,
  ayuda_url   text,
  -- Para ordenar la lista por lo que de verdad usa la gente, no alfabético.
  orden       int  not null default 100,
  activa      boolean not null default true,
  nota        text
);

comment on table public.pasarelas_soportadas is
  'Las pasarelas que ToqueFlow soporta y que campos pide cada una. Publica a proposito: la pantalla arma el formulario leyendo de aqui, asi que sumar una pasarela es una fila y no un cambio de codigo.';

insert into public.pasarelas_soportadas (clave, nombre, pais, campos, ayuda_url, orden, nota) values
  ('transferencia', 'Transferencia, Nequi o Daviplata', 'CO',
   '[{"campo":"instrucciones","etiqueta":"Qué le dices a quien va a pagar","secreto":false}]'::jsonb,
   null, 10,
   'Sin pasarela. El agente le dice a la persona cómo pagar y deja anotado que dice que pagó; alguien del negocio lo verifica. Es lo que más se usa, y no cuesta comisión.'),

  ('wompi', 'Wompi (Bancolombia)', 'CO',
   '[{"campo":"llave_publica","etiqueta":"Llave pública","secreto":false},
     {"campo":"llave_privada","etiqueta":"Llave privada","secreto":true},
     {"campo":"secreto_eventos","etiqueta":"Secreto de eventos","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://docs.wompi.co/', 20, null),

  ('bold', 'Bold', 'CO',
   '[{"campo":"llave_identidad","etiqueta":"Llave de identidad","secreto":false},
     {"campo":"llave_secreta","etiqueta":"Llave secreta","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://developers.bold.co/', 30, null),

  ('epayco', 'ePayco', 'CO',
   '[{"campo":"p_cust_id","etiqueta":"P_CUST_ID","secreto":false},
     {"campo":"p_key","etiqueta":"P_KEY","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://docs.epayco.com/', 40, null),

  ('mercadopago', 'Mercado Pago', 'CO',
   '[{"campo":"access_token","etiqueta":"Access token","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://www.mercadopago.com.co/developers', 50, null),

  ('payu', 'PayU', 'CO',
   '[{"campo":"merchant_id","etiqueta":"Merchant ID","secreto":false},
     {"campo":"api_key","etiqueta":"API key","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://developers.payulatam.com/', 60, null),

  ('stripe', 'Stripe', 'ES',
   '[{"campo":"llave_publica","etiqueta":"Clave publicable","secreto":false},
     {"campo":"llave_secreta","etiqueta":"Clave secreta","secreto":true},
     {"campo":"secreto_webhook","etiqueta":"Secreto del webhook","secreto":true},
     {"campo":"link_pago","etiqueta":"Link de pago (si usas uno fijo)","secreto":false}]'::jsonb,
   'https://stripe.com/docs', 70, null),

  ('redsys', 'Redsys', 'ES',
   '[{"campo":"codigo_comercio","etiqueta":"Código de comercio","secreto":false},
     {"campo":"terminal","etiqueta":"Terminal","secreto":false},
     {"campo":"clave_secreta","etiqueta":"Clave secreta de firma","secreto":true}]'::jsonb,
   'https://pagosonline.redsys.es/', 80, null)
on conflict (clave) do update set
  nombre = excluded.nombre, pais = excluded.pais, campos = excluded.campos,
  ayuda_url = excluded.ayuda_url, orden = excluded.orden, nota = excluded.nota;

alter table public.pasarelas_soportadas enable row level security;
drop policy if exists pasarelas_publicas on public.pasarelas_soportadas;
create policy pasarelas_publicas on public.pasarelas_soportadas
  for select to authenticated using (activa);
grant select on public.pasarelas_soportadas to authenticated;


-- ── 2. La de cada negocio ───────────────────────────────────────────────────
-- En `private`: ni `anon` ni `authenticated` tienen USAGE sobre ese esquema, así
-- que esta tabla no existe para la API. Solo se llega por las funciones de
-- abajo, y ninguna devuelve un secreto.
create table if not exists private.tf_pasarela (
  company_id     uuid primary key references public.companies (id) on delete cascade,
  proveedor      text not null references public.pasarelas_soportadas (clave),
  llaves         jsonb not null default '{}'::jsonb,
  actualizado_at timestamptz not null default now(),
  actualizado_por uuid references auth.users (id) on delete set null
);

comment on table private.tf_pasarela is
  'Con que cobra cada negocio y con que llaves. Vive en `private` porque una llave privada de pasarela que se puede leer de vuelta desde el navegador viaja en cada carga de la pantalla y sale en cualquier captura que el cliente mande pidiendo ayuda.';


-- ── 3. Guardarla ────────────────────────────────────────────────────────────
create or replace function public.tf_pasarela_guardar(
  p_company   uuid,
  p_proveedor text,
  p_llaves    jsonb
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_def     record;
  v_campo   jsonb;
  v_clave   text;
  v_valor   text;
  v_nuevas  jsonb := '{}'::jsonb;
  v_viejas  jsonb;
  v_faltan  text[] := array[]::text[];
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;

  select * into v_def from public.pasarelas_soportadas
   where clave = p_proveedor and activa;
  if not found then
    return json_build_object('ok', false, 'motivo', 'esa pasarela no está soportada');
  end if;

  select llaves into v_viejas from private.tf_pasarela where company_id = p_company;
  v_viejas := coalesce(v_viejas, '{}'::jsonb);

  for v_campo in select * from jsonb_array_elements(v_def.campos) loop
    v_clave := v_campo->>'campo';
    v_valor := nullif(btrim(coalesce(p_llaves->>v_clave, '')), '');

    -- Un campo que llega vacío conserva lo que ya había. Sin esto, quien entra a
    -- cambiar solo el link de pago borraría sus llaves secretas sin darse
    -- cuenta — precisamente porque la pantalla nunca se las devolvió.
    if v_valor is null then
      if v_viejas ? v_clave then
        v_nuevas := v_nuevas || jsonb_build_object(v_clave, v_viejas->v_clave);
      end if;
    else
      v_nuevas := v_nuevas || jsonb_build_object(v_clave, v_valor);
    end if;
  end loop;

  -- Qué falta para poder cobrar de verdad. No se bloquea: un negocio puede
  -- dejarlo a medias y volver mañana con la llave que le falta. Pero se dice.
  for v_campo in select * from jsonb_array_elements(v_def.campos) loop
    v_clave := v_campo->>'campo';
    if v_clave <> 'link_pago'
       and nullif(btrim(coalesce(v_nuevas->>v_clave, '')), '') is null then
      v_faltan := v_faltan || (v_campo->>'etiqueta');
    end if;
  end loop;

  insert into private.tf_pasarela (company_id, proveedor, llaves, actualizado_at, actualizado_por)
  values (p_company, p_proveedor, v_nuevas, now(), auth.uid())
  on conflict (company_id) do update set
    proveedor = excluded.proveedor, llaves = excluded.llaves,
    actualizado_at = now(), actualizado_por = excluded.actualizado_por;

  return json_build_object('ok', true, 'proveedor', p_proveedor,
    'completa', array_length(v_faltan, 1) is null, 'faltan', to_jsonb(v_faltan));
end;
$fn$;


-- ── 4. Verla, sin poder leerla ──────────────────────────────────────────────
create or replace function public.tf_pasarela_ver(p_company uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_row    private.tf_pasarela%rowtype;
  v_def    record;
  v_campo  jsonb;
  v_clave  text;
  v_valor  text;
  v_vista  jsonb := '{}'::jsonb;
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;

  select * into v_row from private.tf_pasarela where company_id = p_company;
  if not found then
    return json_build_object('ok', true, 'proveedor', null, 'llaves', '{}'::jsonb);
  end if;

  select * into v_def from public.pasarelas_soportadas where clave = v_row.proveedor;

  for v_campo in select * from jsonb_array_elements(coalesce(v_def.campos, '[]'::jsonb)) loop
    v_clave := v_campo->>'campo';
    v_valor := v_row.llaves->>v_clave;
    if v_valor is null then continue; end if;

    -- Lo secreto se devuelve TAPADO, con los últimos cuatro para que el negocio
    -- reconozca cuál puso. Devolverlo entero sería ponerlo en el navegador de
    -- vuelta y perder todo lo que se gana guardándolo en `private`.
    if coalesce((v_campo->>'secreto')::boolean, false) then
      v_vista := v_vista || jsonb_build_object(v_clave,
        '····' || right(v_valor, 4));
    else
      v_vista := v_vista || jsonb_build_object(v_clave, v_valor);
    end if;
  end loop;

  return json_build_object('ok', true, 'proveedor', v_row.proveedor,
    'llaves', v_vista, 'actualizado_at', v_row.actualizado_at);
end;
$fn$;


-- ── 5. Quitarla ─────────────────────────────────────────────────────────────
create or replace function public.tf_pasarela_quitar(p_company uuid)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;
  delete from private.tf_pasarela where company_id = p_company;
  return json_build_object('ok', true);
end;
$fn$;


-- ── 6. Para el receptor de pagos ────────────────────────────────────────────
-- La usa la edge function con `service_role` para saber de quién es cada
-- transacción y con qué firma comprobarla. NO se concede a nadie más: es la
-- única que devuelve las llaves sin tapar.
create or replace function public.tf_pasarela_del_slug(p_slug text)
returns json
language sql
stable
security definer
set search_path = public
as $fn$
  select json_build_object(
    'company_id', c.id, 'proveedor', p.proveedor, 'llaves', p.llaves)
  from public.companies c
  join private.tf_pasarela p on p.company_id = c.id
  where c.slug = p_slug;
$fn$;


grant execute on function public.tf_pasarela_guardar(uuid, text, jsonb) to authenticated;
grant execute on function public.tf_pasarela_ver(uuid)                  to authenticated;
grant execute on function public.tf_pasarela_quitar(uuid)               to authenticated;
revoke execute on function public.tf_pasarela_guardar(uuid, text, jsonb) from public, anon;
revoke execute on function public.tf_pasarela_ver(uuid)                  from public, anon;
revoke execute on function public.tf_pasarela_quitar(uuid)               from public, anon;
-- Esta devuelve las llaves EN CLARO. Solo la edge function, que va con
-- service_role. Ni el portal ni el worker de n8n la pueden llamar.
revoke execute on function public.tf_pasarela_del_slug(text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    revoke execute on function public.tf_pasarela_del_slug(text) from n8n_worker;
  end if;
end $$;
