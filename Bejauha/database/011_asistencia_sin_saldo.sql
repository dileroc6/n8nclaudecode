-- =====================================================================
-- Bejauha — Marcar asistencias "sin saldo" (deudor) en lugar de bloquearlas
-- Decisión 2026-05-28: si un cliente asiste y ya estaba en saldo 0, el bot
-- registra la asistencia y la marca como deudor (no descuenta saldo, no
-- re-avisa al cliente, no crea handoff duplicado). Útil para coordinar cobro.
-- Versión: 011 · Fecha: 2026-05-28
-- =====================================================================

SET search_path TO bejauha, public;

ALTER TABLE bejauha.asistencias
  ADD COLUMN IF NOT EXISTS sin_saldo BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN bejauha.asistencias.sin_saldo IS
  'TRUE si la asistencia se registro pero el cliente ya estaba en saldo 0 (deudor o cortesia)';

CREATE INDEX IF NOT EXISTS idx_asistencias_sin_saldo
  ON bejauha.asistencias(sin_saldo) WHERE sin_saldo = true;

\echo '--- Migración 011 aplicada ---'
\d bejauha.asistencias

-- =====================================================================
-- FIN 011_asistencia_sin_saldo.sql
-- =====================================================================
