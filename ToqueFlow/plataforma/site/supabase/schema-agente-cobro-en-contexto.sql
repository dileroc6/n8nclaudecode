-- ============================================================================
-- Cómo cobra el negocio va en el contexto, no en la respuesta de una herramienta
-- ----------------------------------------------------------------------------
-- EL HUECO QUE ESTO TAPA, y lo encontró una conversación de prueba:
--
--   cliente:  «listo me lleva 1 martillo. ¿a qué cuenta le consigno?»
--   agente:   «Para el pago por transferencia necesito que me confirmes y te
--              paso la cuenta.»
--
-- No estaba siendo evasivo: **no tenía la cuenta**. Los datos llegaban dentro
-- de la respuesta de `crear-pedido`, así que el agente solo los conocía después
-- de armar un pedido. Y la gente pregunta antes.
--
-- Cómo cobra un negocio es CONFIGURACIÓN, igual que el tono o el horario: tiene
-- que estar ahí desde el primer mensaje. Además va en el bloque cacheado del
-- prompt, que cambia una vez cada mucho — mandarlo en cada herramienta era
-- pagarlo en cada turno.
--
-- Se deja también en la respuesta de `crear-pedido`: no estorba, y ahí llega
-- justo cuando se necesita.
--
-- Idempotente.
-- ============================================================================

do $$
declare
  v_def text;
  v_nuevo text;
begin
  select pg_get_functiondef(oid) into v_def
  from pg_proc where proname = 'tf_agente_contexto' limit 1;

  if v_def is null then
    raise notice 'tf_agente_contexto no existe; nada que hacer';
    return;
  end if;

  if position('''cobro'', public.tf_cobro_de' in v_def) > 0 then
    raise notice 'el cobro ya estaba en el contexto';
    return;
  end if;

  -- Se agrega una clave al objeto `config`, sin tocar nada más. Reescribir la
  -- funcion entera aqui significaria mantener dos copias de una funcion larga,
  -- y la que se quedara vieja rompe algo en silencio.
  v_nuevo := replace(
    v_def,
    '''herramientas'', v_tools' || chr(10) || '    )',
    '''herramientas'', v_tools,' || chr(10) ||
    '      -- Como cobra este negocio. Va aqui y no dentro de una herramienta' || chr(10) ||
    '      -- porque la gente pregunta «a que cuenta le consigno» ANTES de que' || chr(10) ||
    '      -- exista un pedido, y el agente tiene que poder contestar.' || chr(10) ||
    '      ''cobro'', public.tf_cobro_de(v_rt.company_id)' || chr(10) ||
    '    )');

  if v_nuevo = v_def then
    raise exception 'no encontre donde meter el cobro en tf_agente_contexto — revisar a mano';
  end if;

  execute v_nuevo;
  raise notice 'cobro agregado al contexto del agente';
end
$$;
