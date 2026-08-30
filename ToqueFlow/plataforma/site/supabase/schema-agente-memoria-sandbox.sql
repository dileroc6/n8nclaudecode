-- ============================================================================
-- ToqueFlow — El sandbox también tiene memoria
-- ----------------------------------------------------------------------------
-- Encontrado el 28-ago-2026 midiendo por qué el agente saludaba en 6 de 6
-- mensajes. No era el prompt: era que EN MODO PRUEBA NO TENÍA HISTORIAL.
--
--   tf_agente_registrar  en modo prueba escribe en `test_messages`
--   tf_agente_contexto   leía el historial siempre de `message_log`
--
-- Esas dos tablas no se tocan. Resultado: en el sandbox cada mensaje era el
-- primero. El agente saludaba de nuevo, volvía a preguntar lo que la persona ya
-- había dicho, y se veía mucho peor de lo que en realidad es.
--
-- POR QUÉ IMPORTA MÁS DE LO QUE PARECE: el sandbox es donde el cliente prueba
-- su agente ANTES de encenderlo. Si ahí se ve con amnesia, el cliente concluye
-- que el producto es malo — o peor, se ajusta el prompt para arreglar un
-- problema que en producción no existía. Un sandbox que miente es peor que no
-- tener sandbox.
--
-- Y de paso deja al descubierto una prueba que pasaba por la razón equivocada:
-- el escenario «recuerda lo que ya se dijo» preguntaba «¿cómo me llamo?», y el
-- agente acertaba leyendo el nombre del CONTACTO, no del historial.
--
-- Requisitos: schema-agente-fuga-vistas.sql. Idempotente.
-- ============================================================================

-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.


comment on function public.tf_agente_contexto(text, text, boolean) is
  'Todo lo que el agente necesita para responder un WhatsApp, en un solo viaje. En modo prueba lee el historial de test_messages: si no, el sandbox se ve con amnesia y miente sobre cómo se comporta el agente de verdad.';

-- La versión de dos argumentos ya no se usa: el workflow siempre manda el
-- flag. Se elimina para que nadie la llame por error y vuelva a quedarse sin
-- historial en el sandbox sin enterarse.
drop function if exists public.tf_agente_contexto(text, text);

revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;
