-- =====================================================================
-- Bejauha — Pausa real del paquete (#11c)
-- Decisión 2026-05-28 PM (cliente): pausa máximo 1 mes, máximo 1 vez por paquete,
-- admin la activa por chat con "BEJA pausa a X".
-- Versión: 012 · Fecha: 2026-05-28
-- =====================================================================

SET search_path TO bejauha, public;

ALTER TABLE bejauha.saldos_clases
  ADD COLUMN IF NOT EXISTS pausa_inicio DATE;

ALTER TABLE bejauha.saldos_clases
  ADD COLUMN IF NOT EXISTS pausa_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN bejauha.saldos_clases.pausa_inicio IS
  'Fecha en que comenzó la pausa actual (NULL si no está pausado). Se resetea al despausar.';
COMMENT ON COLUMN bejauha.saldos_clases.pausa_count IS
  'Cuántas pausas se han usado en este paquete. Máximo 1 (regla negocio 2026-05-28).';

-- Índice para que WF04 encuentre rápido a quienes hay que auto-despausar
CREATE INDEX IF NOT EXISTS idx_saldos_pausa_inicio
  ON bejauha.saldos_clases(pausa_inicio) WHERE pausado = true;

\echo '--- Migración 012 aplicada ---'
\d bejauha.saldos_clases

-- =====================================================================
-- FIN 012_pausa_real.sql
-- =====================================================================
