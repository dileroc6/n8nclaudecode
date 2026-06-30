-- Migración 004: soporte para pedidos por transferencia/Nequi
-- Agrega estado 'pendiente_transferencia' y permite que woo_product_id sea NULL
-- (porque el pedido WC se crea SOLO cuando el admin confirma el pago).
--
-- metadata JSONB guarda:
--   confirmacion_token TEXT   — token único para validar el link de confirmación
--   nombre_cliente TEXT
--   direccion_envio TEXT
--   ciudad TEXT
--   metodo_pago TEXT          — 'nequi' | 'transferencia'

SET search_path = savia, public;

-- 1. Ampliar tipo de la columna estado: 'pendiente_transferencia' (23 chars) no entra en VARCHAR(20)
ALTER TABLE savia.pedidos ALTER COLUMN estado TYPE VARCHAR(40);

-- 2. Eliminar el CHECK viejo y crear uno nuevo con el estado adicional
ALTER TABLE savia.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE savia.pedidos ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('link_generado','pendiente_transferencia','pago_confirmado','pago_rechazado','expirado','cancelado'));

-- 3. Índice para búsqueda rápida por token de confirmación
CREATE INDEX IF NOT EXISTS idx_pedidos_token
  ON savia.pedidos((metadata->>'confirmacion_token'))
  WHERE estado = 'pendiente_transferencia';

-- 3. Verificación
SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'savia.pedidos'::regclass
  AND conname = 'pedidos_estado_check';
