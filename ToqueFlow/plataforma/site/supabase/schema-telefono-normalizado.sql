-- ============================================================================
-- ToqueFlow — El teléfono se compara siempre igual
-- ----------------------------------------------------------------------------
-- Encontrado el 28-ago-2026 probando la primera herramienta contra datos
-- REALES, no inventados.
--
-- Los 46 contactos de Bejauha tienen el teléfono guardado como `+573185478900`.
-- WhatsApp entrega `573185478900`, sin el más. Todas las búsquedas del agente
-- comparaban `phone = p_telefono`, así que:
--
--   · el agente no habría reconocido a NINGUNO de sus 46 clientes reales
--   · les habría creado un contacto DUPLICADO a cada uno, sin el «+»
--   · cada cliente que vuelve habría parecido nuevo, sin nombre ni historial
--
-- No lo vio ninguna prueba porque todas usaban teléfonos inventados, escritos
-- sin «+». Es el ejemplo perfecto de por qué probar con datos de verdad no es
-- lo mismo que probar.
--
-- El arreglo compara por dígitos y no toca lo guardado. Cambiar 46 filas
-- afectaría a las campañas y a la pantalla de contactos; normalizar los datos
-- queda como tarea aparte, con su prueba.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Una sola forma de comparar un teléfono ────────────────────────────────
-- Solo dígitos. Sirve igual para `+57 318 547 8900`, `573185478900` y
-- `(318) 547-8900` — aunque este último pierde el indicativo, que es un
-- problema distinto y peor, y por eso hay una tarea para normalizar de verdad.
create or replace function public.tf_telefono(p text)
returns text language sql immutable as $fn$
  select nullif(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '');
$fn$;

comment on function public.tf_telefono(text) is
  'Un telefono comparable: solo digitos. Los contactos viejos se guardaron con + y WhatsApp los entrega sin el.';

-- Buscar por dígitos sin esto sería un recorrido completo de la tabla en cada
-- mensaje que llega.
create index if not exists contacts_company_telnorm_idx
  on public.contacts (company_id, public.tf_telefono(phone));


-- ── 2. El agente encuentra a quien ya existe ─────────────────────────────────
-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.



-- ── 3. Al guardar, actualiza al que ya está en vez de duplicarlo ─────────────
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


-- ── 4. La herramienta también ────────────────────────────────────────────────
-- tf_tool_consultar_saldo NO se define aqui: vive en schema-saldos-aparte.sql.
--
-- Estaba definida en varios archivos. Reaplicar los esquemas en un orden u
-- otro decidia EN SILENCIO cual version corria — y eso ya rompio cosas de
-- verdad tres veces: la herramienta de agendar, el cobro dentro del contexto
-- del agente, y la memoria de lo que averiguo en la conversacion. Ninguna
-- fallo al romperse; simplemente dejaron de hacer lo que hacian.
--
-- Una funcion, un archivo. `pruebas/calidad/una-funcion-un-archivo.cjs` lo
-- vigila y falla si aparece una nueva.


-- ── 5. Permisos ──────────────────────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_telefono(text) to n8n_worker;
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
    grant execute on function public.tf_agente_registrar(
      text, text, text, text, jsonb, text, text, int, int, int, int, boolean) to n8n_worker;
  end if;
end $$;
