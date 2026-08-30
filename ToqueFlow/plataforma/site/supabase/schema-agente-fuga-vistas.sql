-- ============================================================================
-- ToqueFlow — ARREGLO DE SEGURIDAD: las vistas del agente se saltaban el RLS
-- ----------------------------------------------------------------------------
-- Encontrado y comprobado el 27-ago-2026, antes de que hubiera un segundo
-- cliente con agente.
--
-- QUÉ PASABA
--
-- `agent_config` y `agent_knowledge` tienen RLS y funcionan bien: un usuario
-- anónimo pide sus filas y recibe cero. Pero las VISTAS que se construyeron
-- encima —`agent_knowledge_prompt` y `agent_runtime`— pertenecen a `postgres`,
-- y en Postgres una vista se ejecuta con los permisos de su DUEÑO salvo que se
-- le diga lo contrario. Resultado: la vista consultaba las tablas como
-- postgres, el RLS no se aplicaba, y las dos estaban otorgadas a `anon`.
--
-- Comprobado contra producción, sin iniciar sesión, solo con la llave pública
-- que va en supabase-config.js —o sea, la que cualquiera puede leer del sitio:
--
--   agent_config           HTTP 200   0 filas   ← el RLS de la tabla, bien
--   agent_knowledge        HTTP 200   0 filas   ← bien
--   agent_runtime          HTTP 200   1 fila    ← TODA la configuración
--   agent_knowledge_prompt HTTP 200   1 fila    ← TODO el conocimiento
--
-- Con un cliente el daño es acotado. Con cinco, cualquiera de ellos podría
-- leerse los precios, las políticas y el tono de los otros cuatro con abrir la
-- consola del navegador. Es exactamente el fallo que toda la arquitectura
-- multi-tenant existe para impedir.
--
-- POR QUÉ NO SE VIO ANTES
--
-- Porque las pruebas se hicieron con el rol de servicio y con la conexión
-- directa a Postgres, que legítimamente ven todo. El aislamiento hay que
-- probarlo desde afuera, con la llave pública, que es como llega un atacante.
-- Ver la prueba en `pruebas/aislamiento-rls.cjs`.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Que las vistas respeten a quien pregunta ──────────────────────────────
-- `security_invoker` hace que la vista consulte las tablas con los permisos y
-- el RLS de QUIEN LA LLAMA, no del dueño. Es lo que uno asume que hace una
-- vista, y no es lo que hace por defecto.
alter view public.agent_knowledge_prompt set (security_invoker = on);
alter view public.agent_runtime          set (security_invoker = on);


-- ── 2. `anon` no tiene nada que hacer aquí ───────────────────────────────────
-- El portal siempre trabaja con sesión iniciada. `anon` es el rol de quien
-- todavía no entró: no debería ver ni la existencia de estas vistas.
-- Defensa en profundidad: aunque el punto 1 ya lo cubre, quitar el permiso
-- significa que un error futuro en una política no vuelve a abrir la puerta.
revoke all on public.agent_knowledge_prompt from anon;
revoke all on public.agent_runtime          from anon;


-- ── 3. Que n8n siga funcionando ──────────────────────────────────────────────
-- Efecto secundario del punto 1: `tf_agente_contexto` leía la vista con los
-- permisos de quien llamaba, y ahora el rol `n8n_worker` —que no tiene sesión
-- de Supabase y por tanto no pasa ninguna política— recibiría cero filas. El
-- agente se quedaría mudo para todos los clientes a la vez.
--
-- La función pasa a SECURITY DEFINER, igual que su gemela de escritura. Es lo
-- correcto y no un parche: la función NECESITA mirar por encima de los
-- inquilinos para traducir «llegó un WhatsApp a esta instancia» a «es de esta
-- empresa», y el límite lo impone ella misma, adentro, con el WHERE por
-- instancia. No acepta un company_id de nadie.
-- La definición de `tf_agente_contexto` VIVÍA AQUÍ y se movió a
-- schema-agente-contexto.sql, que es el único archivo que la define.
--
-- Estaba repetida en nueve archivos: reaplicar cualquiera de los viejos la
-- devolvía a una versión anterior en silencio. Lo que este archivo hace
-- además sigue abajo.


-- Al ser SECURITY DEFINER, quién puede EJECUTARLA es toda la seguridad que
-- queda. Solo el worker.
revoke all on function public.tf_agente_contexto(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_agente_contexto(text, text) to n8n_worker;
  end if;
end $$;


-- ── 4. La regla, para que no vuelva a pasar ──────────────────────────────────
-- TODA vista nueva sobre una tabla con RLS nace con `security_invoker = on`.
-- No es opcional y no depende de acordarse: `pruebas/aislamiento-rls.cjs` lo
-- comprueba desde afuera, con la llave pública, y falla si alguna vista de
-- `public` se salta el RLS.
