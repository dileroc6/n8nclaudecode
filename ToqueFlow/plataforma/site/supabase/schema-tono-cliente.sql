-- ============================================================================
-- ToqueFlow — El cliente ajusta cómo habla su agente (tarea 39)
-- ----------------------------------------------------------------------------
-- La otra mitad de lo que Diego pidió: los campos de la ficha ya los maneja él
-- (schema-campos-cliente.sql); falta el TONO, que es lo que va a querer tocar
-- cada semana. «Que no salude con Holaa», «que no use tantos emojis», «que
-- trate de usted». Mientras eso viva en la consola de ToqueFlow, cada ajuste
-- menor pasa por una persona.
--
-- Por qué una función y no una política de UPDATE
-- ------------------------------------------------
-- Darle UPDATE sobre `agent_config` a un miembro abre un agujero de
-- aislamiento: podría cambiar `whatsapp_instance` y apuntar SU agente a la
-- instancia de otra empresa. A partir de ahí lee las conversaciones ajenas y
-- responde por ellas, porque todo el sistema resuelve el inquilino por la
-- instancia.
--
-- También podría encenderse el agente solo, saltándose el sandbox, o activarse
-- herramientas que todavía no están liberadas.
--
-- Así que en vez de una puerta ancha con reglas, una puerta estrecha: una
-- función que solo escribe el tono, y solo en un agente de su empresa.
--
-- Idempotente.
-- ============================================================================


-- El tope existe por dinero, no por capricho. El tono viaja en el prefijo
-- cacheado del prompt: cada mensaje lo paga. Un tono de tres páginas se cobra
-- en cada conversación, todos los días, para siempre.
create or replace function public.tf_agente_tono(
  p_agent uuid,
  p_tono  text
)
returns json
language plpgsql
volatile
security definer
set search_path = public
as $fn$
declare
  v_mio    uuid := public.my_company_id();
  v_dueno  uuid;
  v_tono   text := btrim(coalesce(p_tono, ''));
  v_limite int  := 2000;
begin
  if v_mio is null and not public.is_super_admin() then
    return json_build_object('ok', false, 'motivo', 'sin sesion');
  end if;

  select company_id into v_dueno from public.agent_config where id = p_agent;
  if v_dueno is null then
    return json_build_object('ok', false, 'motivo', 'ese agente no existe');
  end if;

  -- El candado que importa: solo un agente de SU empresa.
  if not public.is_super_admin() and v_dueno <> v_mio then
    return json_build_object('ok', false, 'motivo', 'ese agente no es de tu empresa');
  end if;

  if length(v_tono) > v_limite then
    return json_build_object('ok', false,
      'motivo', 'el tono es muy largo: ' || length(v_tono) || ' caracteres y el maximo son ' || v_limite ||
                '. Va en cada mensaje que manda el agente, asi que cuesta plata cada vez.');
  end if;

  update public.agent_config
     set identidad = coalesce(identidad, '{}'::jsonb) || jsonb_build_object('tono', v_tono)
   where id = p_agent;

  return json_build_object('ok', true, 'caracteres', length(v_tono), 'maximo', v_limite);
end;
$fn$;

comment on function public.tf_agente_tono(uuid, text) is
  'Lo unico que el cliente puede cambiarle a su agente por su cuenta: como habla. Puerta estrecha a proposito — un UPDATE abierto sobre agent_config le dejaria mover whatsapp_instance y apuntar su agente a la instancia de otra empresa.';

revoke all on function public.tf_agente_tono(uuid, text) from public, anon;
grant execute on function public.tf_agente_tono(uuid, text) to authenticated;


-- Y una vista mínima para que el portal sepa qué agentes tiene sin darle
-- acceso a la tabla entera: nada de instancias, límites ni herramientas.
drop view if exists public.mis_agentes;
create view public.mis_agentes
with (security_invoker = on) as
select
  c.id,
  c.company_id,
  coalesce(c.nombre, co.name) as nombre,
  c.activo,
  coalesce(c.identidad->>'tono', '') as tono,
  c.actualizado_at
from public.agent_config c
join public.companies co on co.id = c.company_id;

comment on view public.mis_agentes is
  'Lo que el cliente necesita ver de sus agentes: nombre, si esta encendido y como habla. Nada de la instancia de WhatsApp ni de las herramientas.';

grant select on public.mis_agentes to authenticated;
