-- ============================================================================
-- ToqueFlow — La hora a la que sale una campaña es la del NEGOCIO
-- ----------------------------------------------------------------------------
-- La pantalla tenía un campo de fecha y hora, le pegaba '-05:00' a mano y lo
-- guardaba. Y para volver a pintarlo cortaba los 16 primeros caracteres de lo
-- que devuelve Supabase — que viene en UTC.
--
-- O sea que esto ya estaba roto EN COLOMBIA, no solo para un cliente de fuera:
--
--     se teclea         09:00
--     se guarda como    2026-09-20T09:00:00-05:00   (bien)
--     Supabase devuelve 2026-09-20T14:00:00+00:00   (el mismo instante, en UTC)
--     la pantalla pinta 14:00                        ← mentira
--
-- Y lo peor: al abrir esa campaña para editarla, el campo se rellenaba con
-- 14:00. Guardar la corría a las 19:00 UTC. **Cada edición la empujaba cinco
-- horas más tarde**, sin que nada fallara a la vista.
--
-- La conversión la hace la base, que es la que sabe en qué zona vive cada
-- negocio. Es la misma decisión que se tomó para el agente: se pide fecha y
-- hora por separado y la base las convierte, porque pedir un instante con zona
-- es pedirle a quien escribe que haga la cuenta — y ahí es donde se falla.
--
-- Idempotente.
-- ============================================================================

-- ── De «20 de septiembre a las 9:00» al instante exacto ─────────────────────
create or replace function public.tf_campana_momento(
  p_company uuid,
  p_fecha   text,
  p_hora    text
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $fn$
begin
  if not public.tf_es_mia(p_company) then
    return null;
  end if;
  -- tf_momento ya sabe hacer esto: es la misma que usa el agente al agendar.
  -- Tener dos formas de convertir «tal día a tal hora» en un instante es como
  -- una cita cae a una hora y la campaña que la recuerda, a otra.
  return public.tf_momento(public.tf_zona(p_company), p_fecha, p_hora, null);
end;
$fn$;

comment on function public.tf_campana_momento(uuid, text, text) is
  'La hora tecleada en el portal, convertida al instante exacto usando la zona del negocio. La cuenta la hace la base: pedirle un instante con zona a quien escribe es donde se falla.';

-- ── Y al revés, para pintarlo ───────────────────────────────────────────────
-- Devolver el instante y que la pantalla lo formatee tambien sirve, pero
-- entonces hay dos sitios que saben convertir. Aqui se devuelve ya escrito.
create or replace function public.tf_campana_cuando(
  p_company uuid,
  p_momento timestamptz
)
returns text
language sql
stable
security definer
set search_path = public
as $fn$
  select case
    when p_momento is null or not public.tf_es_mia(p_company) then null
    else to_char(timezone(public.tf_zona(p_company), p_momento), 'YYYY-MM-DD HH24:MI')
  end;
$fn$;

grant execute on function public.tf_campana_momento(uuid, text, text)    to authenticated;
grant execute on function public.tf_campana_cuando(uuid, timestamptz)    to authenticated;
revoke execute on function public.tf_campana_momento(uuid, text, text)   from public, anon;
revoke execute on function public.tf_campana_cuando(uuid, timestamptz)   from public, anon;
