-- ============================================================================
-- ToqueFlow — El negocio decide cuándo sale el recordatorio
-- ----------------------------------------------------------------------------
-- `tf_recordatorio_config` existe desde que existe el recordatorio y devuelve
-- los valores por defecto —24 horas antes, entre las 8 y las 20— pero **nadie
-- podía cambiarlos**. Estaban en `agent_config.recordatorios` y esa tabla el
-- cliente no la toca: un UPDATE abierto ahí dejaría mover la instancia de
-- WhatsApp, que es de lo que cuelga todo el aislamiento.
--
-- Así que un negocio que quisiera avisar 48 horas antes —una clínica con
-- tratamientos largos— o dejar de pedir confirmación, tenía que pedirlo por
-- correo y que alguien corriera SQL. Eso no es un producto estándar.
--
-- Esta función escribe SOLO las cuatro claves del recordatorio, y solo en un
-- agente de su propia empresa. Es el mismo candado de `tf_agente_tono`.
--
-- Idempotente.
-- ============================================================================

create or replace function public.tf_agente_recordatorios(
  p_agent              uuid,
  p_horas_antes        int,
  p_pedir_confirmacion boolean,
  p_desde              text,
  p_hasta              text
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_dueno uuid;
  v_h     int  := coalesce(p_horas_antes, 24);
  v_d     text := coalesce(nullif(btrim(coalesce(p_desde, '')), ''), '08:00');
  v_t     text := coalesce(nullif(btrim(coalesce(p_hasta, '')), ''), '20:00');
begin
  select company_id into v_dueno from public.agent_config where id = p_agent;
  if v_dueno is null then
    return json_build_object('ok', false, 'motivo', 'ese agente no existe');
  end if;
  if not public.tf_es_mia(v_dueno) then
    return json_build_object('ok', false, 'motivo', 'ese agente no es tuyo');
  end if;

  -- Un recordatorio a 2 horas no le da tiempo a nadie a reorganizarse, y a 30
  -- dias se olvida igual. Los topes no son burocracia: fuera de ese rango el
  -- recordatorio deja de servir para lo que existe.
  if v_h < 1 or v_h > 168 then
    return json_build_object('ok', false, 'motivo', 'el aviso va entre 1 hora y 7 días antes');
  end if;

  -- Las horas tienen que ser horas. Guardar «8am» deja el cron sin poder
  -- comparar y el recordatorio no sale nunca — en silencio, que es lo peor.
  if v_d !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or v_t !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    return json_build_object('ok', false, 'motivo', 'la hora va como HH:MM, por ejemplo 08:00');
  end if;
  if v_d >= v_t then
    return json_build_object('ok', false, 'motivo', 'la hora de inicio tiene que ser antes que la de fin');
  end if;

  update public.agent_config
     set recordatorios = coalesce(recordatorios, '{}'::jsonb) || jsonb_build_object(
           'horas_antes',        v_h,
           'pedir_confirmacion', coalesce(p_pedir_confirmacion, true),
           'desde',              v_d,
           'hasta',              v_t),
         actualizado_at = now()
   where id = p_agent;

  return json_build_object('ok', true, 'horas_antes', v_h,
    'pedir_confirmacion', coalesce(p_pedir_confirmacion, true), 'desde', v_d, 'hasta', v_t);
end;
$fn$;

comment on function public.tf_agente_recordatorios(uuid, int, boolean, text, text) is
  'El negocio decide cuando sale su recordatorio. Escribe SOLO las cuatro claves del recordatorio y solo en un agente de su empresa: un UPDATE abierto sobre agent_config dejaria mover la instancia de WhatsApp.';

grant execute on function public.tf_agente_recordatorios(uuid, int, boolean, text, text) to authenticated;
revoke execute on function public.tf_agente_recordatorios(uuid, int, boolean, text, text) from public, anon;


-- ── Y poder leerla desde el portal ──────────────────────────────────────────
-- `tf_recordatorio_config(p_agent)` es STABLE y no comprueba de quien es el
-- agente, porque hasta hoy solo la llamaba el cron. Si el portal la va a
-- llamar, tiene que comprobarlo: devuelve los valores de CUALQUIER agente con
-- solo saber su id.
create or replace function public.tf_mi_recordatorio(p_agent uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare v_dueno uuid;
begin
  select company_id into v_dueno from public.agent_config where id = p_agent;
  if v_dueno is null or not public.tf_es_mia(v_dueno) then
    return null;
  end if;
  return public.tf_recordatorio_config(p_agent);
end;
$fn$;

grant execute on function public.tf_mi_recordatorio(uuid) to authenticated;
revoke execute on function public.tf_mi_recordatorio(uuid) from public, anon;
