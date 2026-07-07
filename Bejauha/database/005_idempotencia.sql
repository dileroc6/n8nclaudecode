-- =====================================================================
-- Bejauha — Idempotencia de mensajes entrantes (orquestador WF00)
-- Evita procesar dos veces el mismo mensaje si Evolution reenvía el webhook
-- (clave para no descontar una clase dos veces).
-- Versión: 005 · Fecha: 2026-05-25
-- =====================================================================
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 005_idempotencia.sql
-- =====================================================================

SET search_path TO bejauha, public;

CREATE TABLE IF NOT EXISTS bejauha.mensajes_recibidos (
  message_id   VARCHAR(80)  PRIMARY KEY,   -- id del mensaje de Evolution (data.key.id)
  telefono     VARCHAR(20),
  recibido_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Limpieza opcional (los ids viejos no aportan): se puede purgar > 30 días.
CREATE INDEX IF NOT EXISTS idx_msg_recibidos_fecha ON bejauha.mensajes_recibidos(recibido_at);
