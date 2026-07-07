-- ============================================================================
-- 015_fk_on_update_cascade.sql
-- ============================================================================
-- Permite cambiar `bejauha.leads.telefono` en una sola operación: el UPDATE
-- se propaga automáticamente a saldos_clases, asistencias, recargas y handoffs.
-- (mensajes_logs y mensajes_recibidos NO tienen FK formal; se actualizan aparte
-- vía SQL si se necesita).
-- ============================================================================

ALTER TABLE bejauha.saldos_clases
  DROP CONSTRAINT IF EXISTS saldos_clases_telefono_fkey,
  ADD CONSTRAINT saldos_clases_telefono_fkey
    FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono)
    ON UPDATE CASCADE;

ALTER TABLE bejauha.asistencias
  DROP CONSTRAINT IF EXISTS asistencias_telefono_fkey,
  ADD CONSTRAINT asistencias_telefono_fkey
    FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono)
    ON UPDATE CASCADE;

ALTER TABLE bejauha.recargas
  DROP CONSTRAINT IF EXISTS recargas_telefono_fkey,
  ADD CONSTRAINT recargas_telefono_fkey
    FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono)
    ON UPDATE CASCADE;

ALTER TABLE bejauha.handoffs
  DROP CONSTRAINT IF EXISTS handoffs_telefono_fkey,
  ADD CONSTRAINT handoffs_telefono_fkey
    FOREIGN KEY (telefono) REFERENCES bejauha.leads(telefono)
    ON UPDATE CASCADE;
