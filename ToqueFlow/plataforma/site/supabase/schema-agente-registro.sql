-- ============================================================================
-- ToqueFlow — El agente guarda lo que pasó, en una sola llamada
-- ----------------------------------------------------------------------------
-- Contraparte de `tf_agente_contexto`. Después de responder hay que guardar
-- cinco cosas, y todas tienen que pasar o ninguna:
--
--   el contacto (si es la primera vez que escribe)
--   lo que dijo el cliente
--   lo que contestó el agente
--   los datos que se capturaron en el camino
--   cuántos tokens costó
--
-- Hacerlo con cinco nodos en n8n significa que un fallo en el tercero deja la
-- conversación a medias: el mensaje del cliente guardado, la respuesta no. La
-- próxima vez el agente lee un historial que miente. Una función = una
-- transacción = o queda todo o no queda nada.
--
-- Requisitos: schema-agente-runtime.sql. Idempotente.
-- ============================================================================


-- ── Precios del modelo, en un solo sitio ─────────────────────────────────────
-- Los mismos números que usa la edge function de conocimiento. Cuando cambien
-- —y van a cambiar— se cambian aquí y no en cinco archivos. USD por millón.
drop function if exists public.tf_precio_modelo(text);
create or replace function public.tf_precio_modelo(p_model text)
returns jsonb language sql immutable as $fn$
  select case
    when p_model like 'claude-sonnet%'
      then jsonb_build_object('input', 3.00, 'output', 15.00, 'cache_read', 0.30, 'cache_write', 6.00)
    -- Haiku 4.5 es el modelo del producto estándar y el default deliberado:
    -- si llega un modelo desconocido, se cobra como el barato antes que
    -- inflar el costo reportado con precios que no son.
    else jsonb_build_object('input', 1.00, 'output', 5.00, 'cache_read', 0.10, 'cache_write', 2.00)
  end;
$fn$;


-- ── El registro ──────────────────────────────────────────────────────────────
-- SECURITY DEFINER porque escribe en `ai_usage`, donde el worker de n8n no
-- tiene permiso —y no debe tenerlo: si pudiera escribir ahí libremente, un
-- error de código podría falsear el consumo que le facturamos al cliente.
-- Aquí el company_id no se acepta a ciegas: se deriva de la instancia de
-- WhatsApp, igual que en la lectura. El workflow no puede pedir que se
-- escriba en otra empresa aunque quisiera.
-- tf_agente_registrar NO se define aqui: vive en schema-captura-columnas.sql.
--
-- Estaba definida en varios archivos. Reaplicar los esquemas en un orden u
-- otro decidia EN SILENCIO cual version corria — y eso ya rompio cosas de
-- verdad tres veces: la herramienta de agendar, el cobro dentro del contexto
-- del agente, y la memoria de lo que averiguo en la conversacion. Ninguna
-- fallo al romperse; simplemente dejaron de hacer lo que hacian.
--
-- Una funcion, un archivo. `pruebas/calidad/una-funcion-un-archivo.cjs` lo
-- vigila y falla si aparece una nueva.

-- El comentario de la funcion vive con su definicion, en
-- schema-captura-columnas.sql. Aqui quedaba huerfano y SIN FIRMA — y como hay
-- dos sobrecargas, Postgres no sabia a cual referirse y el archivo dejaba de
-- poder aplicarse.


-- ── Permisos ─────────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_registrar(
      text, text, text, text, jsonb, text, text, int, int, int, int, boolean
    ) to n8n_worker;
    grant execute on function public.tf_precio_modelo(text) to n8n_worker;
  end if;
end $$;

revoke all on function public.tf_agente_registrar(
  text, text, text, text, jsonb, text, text, int, int, int, int, boolean
) from public, anon, authenticated;


-- ── La misma función, pero con un solo argumento ─────────────────────────────
-- No es azúcar sintáctica: es para que n8n pueda llamarla sin romperse.
--
-- El nodo de Postgres de n8n recibe los parámetros como una lista separada por
-- comas. Doce argumentos donde dos de ellos son texto libre —lo que escribió el
-- cliente y lo que contestó el agente— significa que la primera coma que
-- alguien escriba en un WhatsApp corre todos los parámetros un puesto. Ese es
-- exactamente el tipo de bug que aparece en producción, un martes, con un
-- cliente real, y no en ninguna prueba.
--
-- Un solo jsonb: no hay comas que contar.


revoke all on function public.tf_agente_registrar(jsonb) from public, anon, authenticated;
