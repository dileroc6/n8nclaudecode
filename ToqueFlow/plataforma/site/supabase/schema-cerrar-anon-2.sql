-- ============================================================================
-- ToqueFlow — `anon` vuelve a quedarse sin funciones que escriban
-- ----------------------------------------------------------------------------
-- La regla está desde el 28-ago y la auditoría la vigila:
--
--     `anon` no ejecuta NINGUNA función que pueda escribir.
--
-- `anon` es cualquiera en internet: su llave está en el HTML del portal, a la
-- vista de quien mire el código fuente.
--
-- Cuatro funciones nuevas se saltaron la regla sin que nadie hiciera nada mal.
-- Postgres le da EXECUTE a `public` en cada función que se crea, y `anon`
-- hereda de `public`. El `alter default privileges` que se puso aquel día solo
-- aplica a lo que cree ESE rol: una migración corrida desde otra conexión vuelve
-- a abrir la puerta.
--
-- Las dos que más importan:
--
--   tf_tool_confirmar_pago   marca un pago como reportado
--   tf_pago_verificar        lo da por verificado
--
-- O sea que un desconocido podía decirle a la plataforma que alguien pagó.
--
-- Idempotente.
-- ============================================================================

do $$
declare f record; n int := 0;
begin
  for f in
    select p.oid::regprocedure as firma, p.proname
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public'
      and p.prokind = 'f'
      and p.provolatile = 'v'                       -- puede escribir
      and has_function_privilege('anon', p.oid, 'execute')
      -- Lo que traen las extensiones (pg_trgm, pgcrypto…) no es nuestro y
      -- quitarle permisos puede romperlas. No escriben datos de nadie.
      and not exists (
        select 1 from pg_depend d
        join pg_extension e on e.oid = d.refobjid
        where d.objid = p.oid and d.deptype = 'e'
      )
  loop
    execute format('revoke execute on function %s from public, anon', f.firma);
    raise notice 'cerrada: %', f.proname;
    n := n + 1;
  end loop;
  raise notice '% funcion(es) cerradas a anon', n;
end $$;


-- Y el defecto, otra vez. Se repite a propósito: es barato y es lo único que
-- evita que la próxima función nazca abierta.
alter default privileges in schema public revoke execute on functions from public;
