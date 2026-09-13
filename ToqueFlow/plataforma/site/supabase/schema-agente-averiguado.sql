-- ============================================================================
-- El agente se acuerda de lo que ya averiguó
-- ----------------------------------------------------------------------------
-- EL PROBLEMA (fila 158, encontrado por los escenarios de venta):
--
-- `message_log` guarda el TEXTO de la conversación, no lo que devolvieron las
-- herramientas. Así que en cada mensaje el agente empieza de cero:
--
--   turno 1   «mándeme 2 cajas de guantes»  → busca el catálogo, encuentra G-100
--   turno 2   «sí, confirmo las 2»          → VUELVE a buscar el catálogo
--                                             y ya gastó su única llamada
--
-- Solo puede pedir una herramienta por mensaje. Si la gasta re-descubriendo lo
-- que ya sabía, cuando llega el momento de registrar el pedido no le queda — y
-- contesta «listo, queda anotado» sin haber creado nada.
--
-- No es de la tienda: Bejauha re-consulta el saldo en cada turno por lo mismo,
-- y eso se paga en cada conversación.
--
-- ── LAS DOS DECISIONES QUE IMPORTAN ─────────────────────────────────────────
--
-- 1. SE GUARDA POR TELÉFONO, NO POR CONTACTO, Y CON LA MARCA DE PRUEBA.
--    Ya pasó una vez que el historial vivía en `message_log` y el sandbox leía
--    otra tabla: en modo prueba el agente tenía amnesia y parecía mucho peor de
--    lo que era. Con la marca `test` aquí, sandbox y producción se acuerdan
--    igual — y no se mezclan.
--
-- 2. LO QUE SE DEVUELVE VIENE CON SU EDAD, SIEMPRE.
--    Lo que le ahorra el viaje al agente es el IDENTIFICADOR —el SKU, que el
--    producto existe—, no el número. Repetir «quedan 12» de hace veinte
--    minutos como si fuera de ahora es justo el error que la frescura del
--    catálogo existe para evitar. Así que el dato va con los minutos que tiene
--    y con la instrucción de volver a consultar antes de prometer cantidades.
--
-- Idempotente.
-- ============================================================================

create table if not exists public.agente_averiguado (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies (id) on delete cascade,

  -- Por teléfono normalizado y no por contact_id: en el sandbox puede no haber
  -- contacto todavía, y sin esto el sandbox volveria a tener amnesia.
  telefono    text not null,
  test        boolean not null default false,

  herramienta text not null,
  resultado   jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists agente_averiguado_idx
  on public.agente_averiguado (company_id, telefono, test, created_at desc);

comment on table public.agente_averiguado is
  'Lo que devolvieron las herramientas, para que el agente no vuelva a averiguar lo mismo cada turno. Solo puede pedir UNA herramienta por mensaje: si la gasta re-buscando, no le queda para actuar.';
comment on column public.agente_averiguado.test is
  'Sandbox y produccion se acuerdan igual pero no se mezclan. Un sandbox con amnesia hace parecer malo un agente que no lo es.';


-- ── Guardar ─────────────────────────────────────────────────────────────────
create or replace function public.tf_agente_averiguado_guardar(p_payload jsonb)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_tel     text;
  v_test    boolean := coalesce((p_payload->>'test')::boolean, false);
  v_herr    text    := nullif(btrim(p_payload->>'herramienta'), '');
  v_res     jsonb   := p_payload->'resultado';
begin
  if v_herr is null or v_res is null then
    return json_build_object('ok', true, 'guardado', false, 'motivo', 'no hubo herramienta');
  end if;

  select company_id into v_company
  from public.agent_config where whatsapp_instance = p_payload->>'instance';
  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  v_tel := public.tf_telefono(p_payload->>'telefono');
  if v_tel is null or v_tel = '' then
    return json_build_object('ok', true, 'guardado', false, 'motivo', 'sin telefono');
  end if;

  -- Un resultado enorme no cabe en el prompt y encima lo encarece. Se guarda
  -- recortado: lo que hace falta de vuelta es el identificador, no el listado
  -- completo.
  if length(v_res::text) > 2000 then
    v_res := jsonb_build_object('recortado', true, 'texto', left(v_res::text, 2000));
  end if;

  insert into public.agente_averiguado (company_id, telefono, test, herramienta, resultado)
  values (v_company, v_tel, v_test, v_herr, v_res);

  -- Se deja solo lo reciente de esta persona. Sin esto la tabla crece para
  -- siempre con datos que nadie va a volver a mirar.
  delete from public.agente_averiguado a
   where a.company_id = v_company and a.telefono = v_tel and a.test = v_test
     and a.created_at < now() - interval '2 hours';

  return json_build_object('ok', true, 'guardado', true);
end;
$fn$;

comment on function public.tf_agente_averiguado_guardar(jsonb) is
  'Deja escrito lo que devolvio una herramienta, para que el agente no lo vuelva a averiguar el turno siguiente.';


-- ── Leer ────────────────────────────────────────────────────────────────────
create or replace function public.tf_agente_averiguado(
  p_company uuid, p_telefono text, p_test boolean default false)
returns json
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(json_agg(json_build_object(
           'herramienta', x.herramienta,
           'resultado', x.resultado,
           -- La edad va SIEMPRE. Es lo que separa «el SKU es G-100», que sigue
           -- valiendo, de «quedan 12», que a los veinte minutos ya no.
           'hace_minutos', floor(extract(epoch from (now() - x.created_at)) / 60)::int
         ) order by x.created_at), '[]'::json)
  from (
    select a.herramienta, a.resultado, a.created_at
    from public.agente_averiguado a
    where a.company_id = p_company
      and a.telefono = public.tf_telefono(p_telefono)
      and a.test = p_test
      -- Media hora. Más allá de eso ya no es «lo que acabo de averiguar»: es
      -- otra conversación, y arrastrarla confunde más de lo que ayuda.
      and a.created_at > now() - interval '30 minutes'
    order by a.created_at desc
    limit 4
  ) x;
$fn$;

comment on function public.tf_agente_averiguado(uuid, text, boolean) is
  'Lo que este agente ya averiguo de esta persona hace poco, con la EDAD de cada dato. Los identificadores siguen valiendo; las cantidades hay que volver a consultarlas antes de prometerlas.';


-- ── Permisos ────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_averiguado_guardar(jsonb) to n8n_worker;
    grant execute on function public.tf_agente_averiguado(uuid, text, boolean) to n8n_worker;
    grant select, insert, delete on public.agente_averiguado to n8n_worker;
  end if;
end
$$;

alter table public.agente_averiguado enable row level security;

-- Nadie lo lee desde el portal: es memoria interna del agente. Sin politica de
-- lectura, `authenticated` no ve nada — que es lo correcto.
