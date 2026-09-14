-- ============================================================================
-- ToqueFlow — El catálogo dice la verdad sobre lo que está funcionando
-- ----------------------------------------------------------------------------
-- Cinco piezas construidas, probadas y en producción seguían marcadas como
-- «en papel». El campo se puso al crearlas y nadie lo movió al terminarlas.
--
-- No es cosmético: `estado` es lo que sale en la ficha del catálogo en la
-- consola, o sea lo que uno mira antes de prometerle algo a un cliente. Un
-- catálogo que dice «en papel» de lo que lleva semanas andando hace lo mismo
-- que uno que dice «listo» de lo que no existe — deja de servir para decidir.
--
-- Y en una demostración se contradice solo: le enseñas al prospecto la pantalla
-- donde su propio servicio aparece como no construido.
--
-- Lo que NO se toca: `confirmar-pago` sigue en «a medias» a propósito. Deja el
-- registro del pago pero no lo verifica contra el banco, y eso es exactamente
-- «a medias».
--
-- Idempotente.
-- ============================================================================

update public.catalogo
   set estado = 'funcionando'
 where clave in (
   -- Las cuatro que trae Toque Atiende. Llegan en el mismo turno del agente,
   -- sin llamada aparte, y están cubiertas por las pruebas de conversación.
   'consultar-cliente',
   'actualizar-cliente',
   'escalar-a-humano',
   -- Las dos de Toque Agenda que faltaban. Probadas contra el agente real:
   -- ofrece horas que existen, agenda de verdad, y cuatro intentos
   -- simultáneos por el mismo cupo dejan una sola cita.
   'ver-disponibilidad',
   'agendar-cita'
 )
   and liberado
   and estado <> 'funcionando';


-- Un paquete no puede estar «a medias» si todas sus piezas funcionan. Se
-- calcula en vez de escribirlo a mano: así no vuelve a quedarse viejo.
update public.catalogo p
   set estado = case
     when not exists (
       select 1 from public.catalogo x
       where x.clave = any(p.contiene) and x.activo and coalesce(x.estado, '') <> 'funcionando'
     ) then 'funcionando'
     when exists (
       select 1 from public.catalogo x
       where x.clave = any(p.contiene) and x.activo and x.estado = 'funcionando'
     ) then 'a_medias'
     else 'en_papel'
   end
 where p.tipo = 'paquete' and p.activo and coalesce(array_length(p.contiene, 1), 0) > 0;
