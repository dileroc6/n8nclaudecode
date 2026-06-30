-- ============================================================================
-- 013_backup_y_reset_clientes.sql
-- ============================================================================
-- Objetivo: dejar bejauha.* vacío para que el cliente cargue desde cero por
-- WhatsApp, preservando todos los datos actuales en bejauha_legacy.*.
--
-- Lo que se MUEVE a bejauha_legacy y se VACÍA en bejauha:
--   - leads, saldos_clases, asistencias, recargas, handoffs
--   - mensajes_logs, mensajes_recibidos
--   - contactos_dia, lotes_outbound
--
-- Lo que NO se toca (data de configuración, sigue en bejauha):
--   - knowledge_base, plantillas_seguimiento
--
-- Restaurar más adelante:
--   INSERT INTO bejauha.leads          SELECT * FROM bejauha_legacy.leads;
--   INSERT INTO bejauha.saldos_clases  SELECT * FROM bejauha_legacy.saldos_clases;
--   ... (mismo patrón para cada tabla)
-- ============================================================================

BEGIN;

-- 1. Schema de respaldo
CREATE SCHEMA IF NOT EXISTS bejauha_legacy;

-- 2. Copia (datos solamente — no índices/constraints, no hace falta para respaldo)
DROP TABLE IF EXISTS bejauha_legacy.leads               CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.saldos_clases       CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.asistencias         CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.recargas            CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.handoffs            CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.mensajes_logs       CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.mensajes_recibidos  CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.contactos_dia       CASCADE;
DROP TABLE IF EXISTS bejauha_legacy.lotes_outbound      CASCADE;

CREATE TABLE bejauha_legacy.leads               AS SELECT * FROM bejauha.leads;
CREATE TABLE bejauha_legacy.saldos_clases       AS SELECT * FROM bejauha.saldos_clases;
CREATE TABLE bejauha_legacy.asistencias         AS SELECT * FROM bejauha.asistencias;
CREATE TABLE bejauha_legacy.recargas            AS SELECT * FROM bejauha.recargas;
CREATE TABLE bejauha_legacy.handoffs            AS SELECT * FROM bejauha.handoffs;
CREATE TABLE bejauha_legacy.mensajes_logs       AS SELECT * FROM bejauha.mensajes_logs;
CREATE TABLE bejauha_legacy.mensajes_recibidos  AS SELECT * FROM bejauha.mensajes_recibidos;
CREATE TABLE bejauha_legacy.contactos_dia       AS SELECT * FROM bejauha.contactos_dia;
CREATE TABLE bejauha_legacy.lotes_outbound      AS SELECT * FROM bejauha.lotes_outbound;

-- 3. Verificar que el respaldo quedó igual al original ANTES de vaciar
DO $$
DECLARE
  v_leads_orig INT; v_leads_back INT;
  v_saldo_orig INT; v_saldo_back INT;
  v_asis_orig  INT; v_asis_back  INT;
BEGIN
  SELECT COUNT(*) INTO v_leads_orig FROM bejauha.leads;
  SELECT COUNT(*) INTO v_leads_back FROM bejauha_legacy.leads;
  SELECT COUNT(*) INTO v_saldo_orig FROM bejauha.saldos_clases;
  SELECT COUNT(*) INTO v_saldo_back FROM bejauha_legacy.saldos_clases;
  SELECT COUNT(*) INTO v_asis_orig  FROM bejauha.asistencias;
  SELECT COUNT(*) INTO v_asis_back  FROM bejauha_legacy.asistencias;
  IF v_leads_orig <> v_leads_back THEN
    RAISE EXCEPTION 'Backup leads: % vs %', v_leads_orig, v_leads_back;
  END IF;
  IF v_saldo_orig <> v_saldo_back THEN
    RAISE EXCEPTION 'Backup saldos_clases: % vs %', v_saldo_orig, v_saldo_back;
  END IF;
  IF v_asis_orig <> v_asis_back THEN
    RAISE EXCEPTION 'Backup asistencias: % vs %', v_asis_orig, v_asis_back;
  END IF;
  RAISE NOTICE 'Backup verificado: % leads, % saldos, % asistencias',
    v_leads_orig, v_saldo_orig, v_asis_orig;
END $$;

-- 4. Vaciar tablas operativas (TRUNCATE CASCADE respeta FK)
--    Orden: primero las dependientes, luego leads (aunque CASCADE las arrastra)
TRUNCATE bejauha.handoffs           RESTART IDENTITY CASCADE;
TRUNCATE bejauha.asistencias        RESTART IDENTITY CASCADE;
TRUNCATE bejauha.recargas           RESTART IDENTITY CASCADE;
TRUNCATE bejauha.saldos_clases                       CASCADE;
TRUNCATE bejauha.mensajes_logs      RESTART IDENTITY CASCADE;
TRUNCATE bejauha.mensajes_recibidos                  CASCADE;
TRUNCATE bejauha.contactos_dia                       CASCADE;
TRUNCATE bejauha.lotes_outbound     RESTART IDENTITY CASCADE;
TRUNCATE bejauha.leads                               CASCADE;

-- 5. Verificación final
DO $$
DECLARE v_total INT;
BEGIN
  SELECT (SELECT COUNT(*) FROM bejauha.leads)
       + (SELECT COUNT(*) FROM bejauha.saldos_clases)
       + (SELECT COUNT(*) FROM bejauha.asistencias)
       + (SELECT COUNT(*) FROM bejauha.recargas)
       + (SELECT COUNT(*) FROM bejauha.handoffs)
       + (SELECT COUNT(*) FROM bejauha.mensajes_logs)
       + (SELECT COUNT(*) FROM bejauha.mensajes_recibidos)
  INTO v_total;
  IF v_total <> 0 THEN
    RAISE EXCEPTION 'Reset incompleto: quedaron % filas en bejauha.*', v_total;
  END IF;
  RAISE NOTICE 'Reset OK — bejauha.* está vacío, datos preservados en bejauha_legacy.*';
END $$;

COMMIT;

-- ============================================================================
-- Comprobación manual (correr después si quieres verlo)
-- ============================================================================
-- SELECT 'leads' AS tabla,
--        (SELECT COUNT(*) FROM bejauha.leads)         AS actual,
--        (SELECT COUNT(*) FROM bejauha_legacy.leads)  AS legacy
-- UNION ALL SELECT 'saldos_clases',
--        (SELECT COUNT(*) FROM bejauha.saldos_clases),
--        (SELECT COUNT(*) FROM bejauha_legacy.saldos_clases)
-- UNION ALL SELECT 'asistencias',
--        (SELECT COUNT(*) FROM bejauha.asistencias),
--        (SELECT COUNT(*) FROM bejauha_legacy.asistencias);
