-- ============================================================================
-- Las herramientas que registran algo ya no fallan por un contacto que no existe
-- ----------------------------------------------------------------------------
-- Ver `schema-contacto-asegurar.sql` para el porqué. En corto: el contacto se
-- crea al guardar el turno, que pasa DESPUÉS de ejecutar la herramienta. En el
-- primer mensaje de alguien nuevo, toda herramienta que necesite un contacto
-- fallaba — y la persona no veía un error, veía un agente diciéndole que quedó
-- anotado.
--
-- Se cambian solo las que REGISTRAN algo de esa persona. Las de consultar
-- —saldo, estado del pedido— siguen igual: si no hay contacto, no hay nada que
-- consultar y decirlo es la respuesta correcta.
--
--   crear-pedido          quien pide ES un contacto
--   matricular-cliente    existe justamente para gente nueva
--   registrar-reclamo     cualquiera puede reclamar
--   recargar-saldo        puede recargar quien aún no tiene ficha
--
-- Idempotente. Requiere schema-contacto-asegurar.sql.
-- ============================================================================
do $$
declare
  r record;
  v_def   text;
  v_nuevo text;
  v_veces int;
  -- El patrón exacto que hay que cambiar, tal como está escrito hoy en las
  -- cuatro. Si alguna no lo trae, se avisa en vez de tocarla a ciegas.
  v_viejo text := 'return json_build_object(''ok'', false, ''motivo'', ''no tengo a esta persona registrada'');';
begin
  for r in
    select oid, proname from pg_proc
     where proname in ('tf_tool_crear_pedido', 'tf_tool_registrar_reclamo')
  loop
    v_def := pg_get_functiondef(r.oid);

    if position('tf_contacto_asegurar' in v_def) > 0 then
      raise notice '% ya lo hacia', r.proname; continue;
    end if;

    v_veces := (length(v_def) - length(replace(v_def, v_viejo, ''))) / length(v_viejo);
    if v_veces <> 1 then
      raise notice '% : el patron aparece % veces, no la toco', r.proname, v_veces; continue;
    end if;

    -- En vez de rendirse, se crea el contacto y se vuelve a buscar. Queda como
    -- prospecto, que es lo que es: todavía no ha comprado nada.
    v_nuevo := replace(v_def, v_viejo,
      'perform public.tf_contacto_asegurar(v_company, p_payload->>''telefono'');' || chr(10) ||
      '    select * into v_c from public.contacts' || chr(10) ||
      '     where company_id = v_company' || chr(10) ||
      '       and public.tf_telefono(phone) = public.tf_telefono(p_payload->>''telefono'')' || chr(10) ||
      '     limit 1;' || chr(10) ||
      '    if not found then' || chr(10) ||
      '      return json_build_object(''ok'', false, ''motivo'', ''no pude registrar a esta persona'');' || chr(10) ||
      '    end if;');

    execute v_nuevo;
    raise notice '% ahora crea el contacto si falta', r.proname;
  end loop;
end $$;
