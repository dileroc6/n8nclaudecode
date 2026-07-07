-- ============================================================================
-- 014_cortesia.sql
-- ============================================================================
-- Marcador de cortesía + saldo inicial cuando un lead acepta la clase gratis.
-- Objetivo: poder filtrar después quiénes tomaron cortesía y quiénes compraron
-- (=tienen alguna entrada en bejauha.recargas) para análisis de conversión de marketing.
-- ============================================================================

ALTER TABLE bejauha.leads
  ADD COLUMN IF NOT EXISTS tomo_cortesia BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cortesia_at   TIMESTAMPTZ NULL;

-- Índice para queries de marketing: leads que tomaron cortesía, más recientes primero.
CREATE INDEX IF NOT EXISTS idx_leads_cortesia
  ON bejauha.leads(cortesia_at DESC)
  WHERE tomo_cortesia = true;

-- ============================================================================
-- Queries útiles para marketing (no se ejecutan acá, son referencia):
-- ============================================================================
-- 1) Cuántos leads tomaron cortesía:
--    SELECT count(*) FROM bejauha.leads WHERE tomo_cortesia = true;
--
-- 2) De los que tomaron cortesía, cuántos compraron paquete después
--    (= tienen entrada en recargas):
--    SELECT count(DISTINCT l.telefono) FROM bejauha.leads l
--    JOIN bejauha.recargas r ON r.telefono = l.telefono
--    WHERE l.tomo_cortesia = true;
--
-- 3) Tasa de conversión:
--    SELECT
--      count(*) FILTER (WHERE tomo_cortesia)                                                            AS tomaron_cortesia,
--      count(*) FILTER (WHERE tomo_cortesia AND EXISTS(SELECT 1 FROM bejauha.recargas r WHERE r.telefono = leads.telefono)) AS compraron_despues,
--      round(100.0 * count(*) FILTER (WHERE tomo_cortesia AND EXISTS(SELECT 1 FROM bejauha.recargas r WHERE r.telefono = leads.telefono))
--            / NULLIF(count(*) FILTER (WHERE tomo_cortesia), 0), 1) AS porcentaje_conversion
--    FROM bejauha.leads;
--
-- 4) Lista de quienes tomaron cortesía y todavía no han comprado (target de remarketing):
--    SELECT l.telefono, l.nombre, l.cortesia_at
--    FROM bejauha.leads l
--    WHERE l.tomo_cortesia = true
--      AND NOT EXISTS (SELECT 1 FROM bejauha.recargas r WHERE r.telefono = l.telefono)
--    ORDER BY l.cortesia_at DESC;
-- ============================================================================
