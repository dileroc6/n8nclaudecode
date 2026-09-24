-- ============================================================================
-- ToqueFlow — El mecanismo del lego: herramientas conectables
-- ----------------------------------------------------------------------------
-- Hasta ahora el agente tenía UNA herramienta: responder. Todo lo demás que un
-- cliente pudiera necesitar —consultar su saldo, mirar un pedido, verificar un
-- pago— habría terminado como un `if` dentro del flujo compartido. Rápido el
-- primer día, mortal el sexto: cada rama multiplica los caminos y a partir de
-- ahí ningún cambio es seguro porque cualquiera puede romper a alguien.
--
-- Con esto, agregarle una capacidad a un cliente es encender una fila.
--
-- CÓMO FUNCIONA, y por qué así:
--
--   agent_config.herramientas    las claves del catálogo que ese cliente tiene
--                                encendidas
--   catalogo.workflow            la ruta del webhook que la ejecuta
--
-- Cada herramienta es un workflow APARTE con su propio webhook. El agente la
-- llama por HTTP con la misma firma que protege su propia entrada. No se usan
-- sub-workflows de n8n a propósito: el nombre del workflow tendría que
-- resolverse en tiempo de ejecución, y n8n no lo hace bien. Un webhook por
-- herramienta es dinámico por naturaleza y además hace que cada una se pueda
-- probar sola, con curl.
--
-- LA REGLA QUE NO SE ROMPE: una herramienta es POR CAPACIDAD, no por cliente.
-- `ver_disponibilidad` es una sola y la usan todos los que tengan agenda.
-- `consultar_saldo` también es una sola — pasa que hoy solo Bejauha la usa, no
-- porque sea «suya» sino porque nadie más vende clases por paquete.
--
-- Requisitos: schema-catalogo-detalle.sql. Idempotente.
-- ============================================================================


-- ── 1. Qué herramientas tiene encendidas cada cliente ────────────────────────
alter table public.agent_config
  add column if not exists herramientas text[] not null default '{}';

comment on column public.agent_config.herramientas is
  'Claves del catálogo que este agente puede usar. Vacío = solo responde con su conocimiento.';


-- ── 2. El contexto ahora entrega también las herramientas ────────────────────
-- Se resuelven contra el catálogo aquí y no en n8n: así el workflow recibe la
-- lista lista para armar el prompt, con su descripción y su ruta, y no tiene
-- que saber nada del catálogo.
-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.


revoke all on function public.tf_agente_contexto(text, text, boolean) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text, boolean) to n8n_worker;
  end if;
end $$;


-- ── 3. La primera herramienta de verdad: consultar saldo ─────────────────────
-- Lee de `contacts`, que es donde la plataforma ya guarda las clases restantes
-- de los clientes de Bejauha. El company_id se deriva de la instancia, igual
-- que en todo lo demás: la herramienta no acepta que le digan de qué empresa es.
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

revoke all on function public.tf_tool_consultar_saldo(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
  end if;
end $$;


-- ── 4. La ruta de cada herramienta ───────────────────────────────────────────
-- El valor de `workflow` es la ruta del webhook, no un nombre bonito.
update public.catalogo set workflow = 'tool-consultar-saldo',
  descripcion = 'Cuántas clases o cupos le quedan a quien escribe. Lee de la ficha del contacto en la plataforma.',
  beneficio   = 'Consulta cuántas clases te quedan y cuándo se te renuevan.',
  estado = 'funcionando', liberado = true
where clave = 'consultar-saldo';
