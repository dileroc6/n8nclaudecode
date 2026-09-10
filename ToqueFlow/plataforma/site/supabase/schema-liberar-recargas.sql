-- ============================================================================
-- ToqueFlow — Toque Recargas y las piezas sueltas quedan liberadas
-- ----------------------------------------------------------------------------
-- Se libera AHORA y no antes por la regla 2: no se ofrece lo que no se puede
-- ejecutar. Hasta hoy las funciones existían y estaban probadas, pero no había
-- workflow que las llamara. Ya lo hay, activo, y probado por su webhook:
--
--   tool-registrar-consumo    ILqw2ODtVwdqDsM6
--   tool-matricular-cliente   GM6uDwE5yAxtQsNH
--   tool-recargar-saldo       Bhg3htDcnhmZIAq7
--   tool-registrar-reclamo    vIeYMjgGD8ETsG9p
--
-- Las cuatro devuelven 403 sin la firma del contrato. Comprobado.
--
-- `reactivacion` NO se libera: manda mensajes sola, y eso exige el candado de
-- confirmación que ya tienen las campañas. Queda la consulta —a quién hay que
-- escribirle— que es la mitad que sí se puede mirar antes de mandar nada.
-- Idempotente.
-- ============================================================================

update public.catalogo set liberado = true, estado = 'funcionando'
where clave in ('registrar-consumo', 'matricular-cliente', 'recargar-saldo', 'registrar-reclamo');

-- El paquete se libera con sus tres piezas dentro.
update public.catalogo set liberado = true, estado = 'funcionando'
where clave = 'paquete-recargas';

-- Y consultar el saldo vuelve al paquete: se había retirado como pieza suelta
-- del producto —el saldo llega dentro de la ficha— pero dentro de Toque
-- Recargas es una de las cuatro cosas que el negocio compra.
update public.catalogo set contiene =
  array['matricular-cliente', 'registrar-consumo', 'recargar-saldo']
where clave = 'paquete-recargas';
