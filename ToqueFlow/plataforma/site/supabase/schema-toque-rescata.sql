-- ============================================================================
-- ToqueFlow — Toque Rescata: la plata que ya estaba y se está yendo
-- ----------------------------------------------------------------------------
-- Las piezas ya existían sueltas: se detectan los huecos de la agenda, se sabe
-- quién no vino, y se puede segmentar por una fecha guardada en un campo propio.
-- Pero sueltas no se venden. Algo que hay que explicar en cinco pasos no se
-- vende — y lo peor, algo que el cliente tiene que acordarse de ir a mirar no
-- se usa.
--
-- Este paquete las junta y les pone el nombre de lo que hacen: **recuperar
-- plata que el negocio ya se había ganado y está perdiendo en silencio.**
--
--   · una hora libre mañana no se vende dos veces
--   · quien faltó y no volvió a agendar se pierde sin que nadie lo note
--   · una propuesta sin respuesta es una venta a medio cerrar que se enfría
--
-- Ninguna de las tres aparece en un informe. Nadie factura un hueco, nadie
-- factura al que no vino, y nadie factura la propuesta que nunca se contestó.
-- Ese es exactamente el motivo por el que se pierden.
--
-- DE QUÉ DEPENDE, Y POR QUÉ
--
-- Requiere `paquete-agenda`. Dos de sus tres piezas —huecos y plantones— no
-- significan nada sin una agenda: no hay huecos que llenar ni citas a las que
-- faltar. La tercera funciona sin ella, pero vender el paquete a quien no tiene
-- agenda seria entregarle un tercio.
--
-- LO QUE NO HACE
--
-- No manda nada solo. Detectar es barato y no se equivoca; escribirle a cuarenta
-- personas porque un cálculo vio un día flojo es como se gana un baneo de
-- WhatsApp. Deja la campaña armada con el filtro correcto y darle a enviar sigue
-- siendo de una persona. Es la misma regla del `confirmar_envio`.
--
-- Idempotente.
-- ============================================================================

-- ── Las tres piezas ─────────────────────────────────────────────────────────
insert into public.catalogo
  (clave, tipo, nombre, descripcion, beneficio, estado, liberado, vendible, visible_cliente, orden)
values
  ('huecos-agenda', 'automatizacion', 'Cero vacío',
   'Mira los próximos días y avisa qué horas van a quedar libres, con cuánta gente hay sin cita a quien ofrecérselas. Deja la invitación armada.',
   'Una hora libre no se vende dos veces. Si mañana a las 4 no entra nadie, esa hora no se recupera nunca — y no sale en ningún informe, porque nadie factura un hueco.',
   'funcionando', true, false, true, 40),

  ('seguimiento-plantones', 'automatizacion', 'Los que no vinieron',
   'Encuentra a quien faltó a una cita y no ha vuelto a agendar, y deja el mensaje armado para invitarlo de nuevo.',
   'El que no vino se pierde en silencio: nadie lo llama porque nadie lleva la cuenta. Y ya había dicho que sí una vez.',
   'funcionando', true, false, true, 41),

  ('seguimiento-propuestas', 'automatizacion', 'Propuestas sin respuesta',
   'Encuentra a quien recibió un presupuesto o una cotización hace más de unos días y no ha contestado, y deja el recordatorio armado.',
   'Una propuesta sin respuesta es una venta a medio cerrar. No se cae por el precio: se cae porque nadie volvió a preguntar.',
   'funcionando', true, false, true, 42)
on conflict (clave) do update set
  tipo = excluded.tipo, nombre = excluded.nombre,
  descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  estado = excluded.estado, liberado = excluded.liberado,
  vendible = excluded.vendible, visible_cliente = excluded.visible_cliente,
  orden = excluded.orden;


-- ── El paquete ──────────────────────────────────────────────────────────────
insert into public.catalogo
  (clave, tipo, nombre, descripcion, beneficio, contiene, precio_cop,
   requiere, estado, liberado, vendible, visible_cliente, orden, tool_url)
values
  ('paquete-rescata', 'paquete', 'Toque Rescata',
   'Encuentra la plata que el negocio ya se había ganado y está perdiendo: las horas que van a quedar vacías, los que no vinieron y las propuestas sin contestar. Deja cada campaña armada; enviarla sigue siendo del negocio.',
   'Ninguna de las tres pérdidas aparece en un informe — nadie factura un hueco, ni al que no vino, ni la propuesta que nunca se contestó. Por eso se pierden.',
   array['huecos-agenda','seguimiento-plantones','seguimiento-propuestas'],
   -- Mismo precio que los otros paquetes. Es un valor por defecto para poder
   -- venderlo, no una decision tomada: la fila 122 del tablero sigue abierta.
   250000,
   'paquete-agenda', 'funcionando', true, true, true, 33, 'agenda.html')
on conflict (clave) do update set
  tipo = excluded.tipo, nombre = excluded.nombre,
  descripcion = excluded.descripcion, beneficio = excluded.beneficio,
  contiene = excluded.contiene, requiere = excluded.requiere,
  estado = excluded.estado, liberado = excluded.liberado,
  vendible = excluded.vendible, visible_cliente = excluded.visible_cliente,
  orden = excluded.orden, tool_url = excluded.tool_url;


-- ── Qué campo guarda la fecha de la propuesta ───────────────────────────────
-- Lo decide el negocio, porque el campo es suyo: una clínica lo llama
-- «presupuesto», un taller «cotización», una agencia «propuesta». Adivinarlo
-- por el nombre es como se termina persiguiendo a quien no tocaba.
create or replace function public.tf_rescate_config(
  p_company uuid,
  p_campo_fecha text,
  p_dias int default 7
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare v_c text := nullif(btrim(coalesce(p_campo_fecha, '')), '');
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;

  -- Se comprueba que el campo EXISTA y sea de fecha. Guardar el nombre de un
  -- campo que no existe deja el seguimiento sin encontrar nunca a nadie, y eso
  -- se lee como «no tengo propuestas pendientes» — que es mentira.
  if v_c is not null and not exists (
    select 1 from public.contact_campos
    where company_id = p_company and clave = v_c and tipo = 'fecha'
  ) then
    return json_build_object('ok', false,
      'motivo', 'ese campo no existe o no es de tipo fecha');
  end if;

  update public.companies
     set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
           'rescate', jsonb_build_object(
             'campo_fecha_propuesta', v_c,
             'dias', greatest(coalesce(p_dias, 7), 1)))
   where id = p_company;

  return json_build_object('ok', true, 'campo', v_c, 'dias', greatest(coalesce(p_dias, 7), 1));
end;
$fn$;


-- ── Cuánta plata hay sobre la mesa, ahora mismo ─────────────────────────────
create or replace function public.tf_rescate_pendiente(
  p_company uuid,
  p_dias    int default 3
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_h        json;
  v_cfg      jsonb;
  v_campo    text;
  v_dias     int;
  v_plant    int;
  v_prop     int;
  v_tiene_ag boolean;
begin
  if not public.tf_es_mia(p_company) then
    return json_build_object('ok', false, 'motivo', 'no es tuya');
  end if;

  select metadata->'rescate' into v_cfg from public.companies where id = p_company;
  v_campo := nullif(btrim(coalesce(v_cfg->>'campo_fecha_propuesta', '')), '');
  v_dias  := greatest(coalesce((v_cfg->>'dias')::int, 7), 1);

  select exists (select 1 from public.agenda_franjas where company_id = p_company and activa)
    into v_tiene_ag;

  -- 1. Las horas que van a quedar vacías. La misma definición que usa el
  --    agente al ofrecer una hora: calcularlo aparte es como se termina
  --    avisando de un hueco que en realidad estaba ocupado.
  if v_tiene_ag then
    v_h := public.tf_huecos_pronto(p_company, coalesce(p_dias, 3), null);
  end if;

  -- 2. Los que faltaron y no han vuelto a agendar. Se cuentan con la MISMA
  --    función que arma la campaña, así que el número de aquí y el de
  --    destinatarios no pueden separarse.
  select count(*)::int into v_plant
  from public.tf_campana_destinatarios(
    p_company,
    jsonb_build_object('no_asistio', jsonb_build_object('hace_menos_de_dias', 90),
                       'sin_cita_futura', true),
    null);

  -- 3. Las propuestas sin contestar. Solo si el negocio dijo qué campo es.
  if v_campo is not null then
    select count(*)::int into v_prop
    from public.tf_campana_destinatarios(
      p_company,
      jsonb_build_object('campo_fecha',
        jsonb_build_object('clave', v_campo, 'hace_mas_de_dias', v_dias)),
      null);
  end if;

  return json_build_object(
    'ok', true,
    'huecos', json_build_object(
      'hay_agenda', v_tiene_ag,
      'horas', case when v_h is null then 0
               else coalesce((select sum((d->>'huecos')::int)
                              from json_array_elements(v_h->'dias') d), 0) end,
      'a_quien_ofrecer', coalesce((v_h->>'a_quien_ofrecer')::int, 0),
      'dias', coalesce(v_h->'dias', '[]'::json)),
    'plantones', json_build_object('cuantos', coalesce(v_plant, 0)),
    -- `null` no es `0`: «no está configurado» y «no hay ninguna» son cosas
    -- distintas, y enseñar un 0 donde falta configurar es decirle al negocio
    -- que no tiene propuestas pendientes cuando nadie ha mirado.
    'propuestas', json_build_object(
      'configurado', v_campo is not null,
      'campo', v_campo, 'dias', v_dias,
      'cuantos', case when v_campo is null then null else coalesce(v_prop, 0) end));
end;
$fn$;

comment on function public.tf_rescate_pendiente(uuid, int) is
  'La plata que el negocio ya se habia ganado y esta perdiendo: horas que van a quedar vacias, los que no vinieron, y propuestas sin contestar. Cuenta con las MISMAS funciones que arman las campanas, para que el numero de aqui y el de destinatarios no puedan separarse.';

grant execute on function public.tf_rescate_config(uuid, text, int)  to authenticated;
grant execute on function public.tf_rescate_pendiente(uuid, int)     to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_rescate_pendiente(uuid, int) to n8n_worker;
  end if;
end $$;
revoke execute on function public.tf_rescate_config(uuid, text, int) from public, anon;
revoke execute on function public.tf_rescate_pendiente(uuid, int)    from public, anon;
