-- Migración 005: campos de oferta/descuento en fichas_producto
-- Permite que la rama determinística de fotos muestre "antes $X ahora $Y (oferta!)"
-- cuando WC marca el producto como on_sale=true.

SET search_path = savia, public;

ALTER TABLE savia.fichas_producto
  ADD COLUMN IF NOT EXISTS en_oferta      BOOLEAN       NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS precio_regular NUMERIC(10,0),
  ADD COLUMN IF NOT EXISTS precio_oferta  NUMERIC(10,0),
  ADD COLUMN IF NOT EXISTS oferta_hasta   TIMESTAMPTZ;

-- Verificación: la tabla debe tener ahora estas 4 columnas nuevas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'savia'
  AND table_name = 'fichas_producto'
  AND column_name IN ('en_oferta','precio_regular','precio_oferta','oferta_hasta')
ORDER BY column_name;
