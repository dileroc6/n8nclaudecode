-- ============================================================================
-- El contexto entrega lo que el agente ya averiguó
-- ----------------------------------------------------------------------------
-- Va en la raíz del contexto y no dentro de `contacto`, porque existe aunque
-- la persona todavía no sea un contacto —en el sandbox pasa— y porque el
-- workflow lo mete en los MENSAJES, no en el prefijo cacheado.
--
-- Eso último no es un detalle: el caché de Anthropic es un match de prefijo
-- byte a byte, y esto cambia en cada turno. Metido en el bloque estable,
-- multiplicaría la factura por diez.
--
-- ⚠ EL ANCLA TIENE QUE SER ÚNICA. La primera versión de este parche enganchó
-- con `'asignado_humano'`, que aparece DOS veces —la clave del JSON y el campo
-- de donde sale su valor—, así que el reemplazo se metió en las dos y dejó la
-- función rota: «cannot cast type record to boolean», y el agente dejó de
-- contestar. Se ancla en `'historial', v_hist`, que aparece una sola vez, y se
-- comprueba que sea así antes de tocar nada.
--
-- Idempotente. Requiere schema-agente-averiguado.sql.
-- ============================================================================
do $$
declare
  v_def   text;
  v_nuevo text;
  v_veces int;
  v_ancla text := '''historial'', v_hist';
begin
  select pg_get_functiondef(oid) into v_def from pg_proc where proname = 'tf_agente_contexto' limit 1;

  if position('tf_agente_averiguado(' in v_def) > 0 then
    raise notice 'ya entregaba lo averiguado'; return;
  end if;

  -- Cuántas veces aparece el ancla. Si no es exactamente una, se para: un
  -- reemplazo que pega en dos sitios rompe la función para TODOS los clientes.
  v_veces := (length(v_def) - length(replace(v_def, v_ancla, ''))) / length(v_ancla);
  if v_veces <> 1 then
    raise exception 'el ancla aparece % veces, tiene que aparecer 1 — revisar a mano', v_veces;
  end if;

  v_nuevo := replace(v_def, v_ancla,
    '''averiguado'', public.tf_agente_averiguado(v_rt.company_id, p_telefono, coalesce(p_test, false)),' ||
    chr(10) || '    ' || v_ancla);

  execute v_nuevo;
  raise notice 'el contexto ya entrega lo averiguado';
end $$;
