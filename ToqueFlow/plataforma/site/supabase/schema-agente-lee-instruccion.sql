-- ============================================================================
-- El modelo lee una instrucción, no la frase de venta
-- ----------------------------------------------------------------------------
-- `tf_agente_contexto` le entregaba a Claude `coalesce(beneficio, descripcion)`.
-- `beneficio` es la frase que se le dice al CLIENTE al vender el paquete —
-- «Deja de contestar "déjame reviso" veinte veces al día». Como instrucción
-- para decidir cuándo llamar una herramienta no sirve: no dice cuándo.
--
-- Lo pilló un escenario de venta. La persona decía «sí, confirmo las 2», el
-- agente contestaba «listo, queda anotado tu pedido»… y no había ningún
-- pedido. Nunca llamó a la herramienta.
--
-- Ahora lee `instruccion` si existe, y si no cae a lo de antes.
-- Idempotente.
-- ============================================================================
do $$
declare v_def text; v_nuevo text;
begin
  select pg_get_functiondef(oid) into v_def from pg_proc where proname='tf_agente_contexto' limit 1;
  if position('c.instruccion' in v_def) > 0 then
    raise notice 'ya entregaba la instruccion'; return;
  end if;
  v_nuevo := replace(v_def,
    '''descripcion'', coalesce(c.beneficio, c.descripcion)',
    '''descripcion'', coalesce(nullif(btrim(c.instruccion), ''''), c.beneficio, c.descripcion)');
  if v_nuevo = v_def then
    raise exception 'no encontre donde cambiar lo que lee el modelo';
  end if;
  execute v_nuevo;
  raise notice 'el modelo ahora lee la instruccion';
end $$;
