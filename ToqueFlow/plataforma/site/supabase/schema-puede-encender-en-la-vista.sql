-- ============================================================================
-- ToqueFlow — La regla de «¿se puede encender?» se contesta una sola vez
-- ----------------------------------------------------------------------------
-- `tf_puede_encender(empresa, pieza)` existe desde hace semanas y su propio
-- comentario dice «la usan la consola y el alta». **No la llama nadie.**
--
-- La regla sí se aplica — pero la consola la vuelve a deducir en JavaScript, a
-- partir de `liberado` y `placa_lista`:
--
--     const enObra  = p.liberado === false;
--     const sinBase = !enObra && esPin(p) && p.placa_lista === false;
--
-- O sea: la misma regla escrita dos veces, en dos lenguajes. Hoy coinciden.
-- Mañana alguien agrega una condición en un sitio —«tampoco si la empresa está
-- suspendida»— y la otra copia sigue diciendo que sí. Es la misma forma del
-- problema que ya costó tres parches borrados y dos funciones duplicadas.
--
-- LA SALIDA NO ES LLAMAR A LA FUNCION POR CADA FILA
--
-- La consola pinta una lista de piezas por empresa. Un viaje a la base por cada
-- fila cambia una pantalla instantánea por una que parpadea.
--
-- Se resuelve al revés: **la vista trae la respuesta ya calculada.** La regla
-- sigue viviendo en un solo sitio —la función— y la pantalla solo la lee.
--
-- Idempotente.
-- ============================================================================

-- La vista se redefine entera porque hay que sumarle columnas. Se conserva tal
-- cual estaba y solo se agregan las dos del final: tocar lo demas seria mover
-- algo que la consola ya usa.
do $$
declare v_def text;
begin
  select pg_get_viewdef('public.empresa_catalogo'::regclass, true) into v_def;

  if position('puede_encender' in v_def) > 0 then
    raise notice 'la vista ya trae la respuesta';
    return;
  end if;

  -- Se envuelve la vista actual en vez de reescribirla: asi no hay una segunda
  -- copia de una consulta larga que pueda quedarse vieja.
  execute
    'create or replace view public.empresa_catalogo with (security_invoker = on) as ' ||
    'select v.*, ' ||
    -- El JSON entero, para que la pantalla pueda decir POR QUE no se puede.
    -- Un boton gris sin motivo hace que alguien pregunte por WhatsApp.
    '  public.tf_puede_encender(v.company_id, v.clave) as encender ' ||
    'from (' || rtrim(v_def, ';' || chr(10) || chr(13) || ' ') || ') v';

  raise notice 'la vista ya trae si se puede encender cada pieza, y por que no';
end $$;

comment on view public.empresa_catalogo is
  'Que piezas tiene y que le falta a cada empresa. `encender` trae la respuesta de tf_puede_encender YA CALCULADA: la regla vive en la funcion y la pantalla solo la lee, en vez de deducirla otra vez en JavaScript.';
