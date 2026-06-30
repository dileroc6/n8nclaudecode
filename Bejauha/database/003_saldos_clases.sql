-- =====================================================================
-- Bejauha — Control de clases (Agente 2 · Admin)
-- Schema: bejauha · DB: leadai · contenedor: evolution_postgres
-- Versión: 003 · Fecha: 2026-05-22
-- =====================================================================
-- Modela el saldo de clases por cliente + el log de asistencias y recargas.
-- Diseño flexible para soportar lo que aún está pendiente de confirmar:
--   • presencial vs virtual (campo `tipo`)
--   • membresía: tipo='membresia' con clases_restantes NULL = ilimitado
--
-- IMPORTANTE: el flujo del Agente 2 debe hacer UPSERT del cliente en
-- `bejauha.leads` (ON CONFLICT DO NOTHING) ANTES de tocar estas tablas,
-- para mantener una sola identidad por teléfono.
--
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 003_saldos_clases.sql
-- =====================================================================

SET search_path TO bejauha, public;

-- ---------------------------------------------------------------------
-- 1. saldos_clases — saldo vigente por cliente y tipo (contador denormalizado)
-- ---------------------------------------------------------------------
-- PK (telefono, tipo): un cliente puede tener saldo presencial y/o virtual
-- y/o una membresía a la vez. clases_restantes NULL = ilimitado (membresía).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.saldos_clases (
  telefono          VARCHAR(20)  NOT NULL REFERENCES bejauha.leads(telefono),
  tipo              VARCHAR(12)  NOT NULL CHECK (tipo IN ('presencial','virtual','membresia')),
  clases_restantes  INT,                                  -- NULL = ilimitado
  vence_at          DATE,                                 -- vencimiento del paquete/membresía
  pausado           BOOLEAN      NOT NULL DEFAULT FALSE,   -- paquete 8 admite pausa
  actualizado_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (telefono, tipo)
);

CREATE INDEX IF NOT EXISTS idx_saldos_agotados
  ON bejauha.saldos_clases(telefono)
  WHERE clases_restantes = 0;

-- ---------------------------------------------------------------------
-- 2. recargas — log de cada paquete/membresía comprado (auditable)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.recargas (
  id          BIGSERIAL    PRIMARY KEY,
  telefono    VARCHAR(20)  NOT NULL REFERENCES bejauha.leads(telefono),
  tipo        VARCHAR(12)  NOT NULL CHECK (tipo IN ('presencial','virtual','membresia')),
  paquete     VARCHAR(24)  NOT NULL,        -- '4_presencial','8_presencial','membresia_virtual','membresia_especial','suelta'
  clases      INT,                          -- nº de clases que agrega (NULL si membresía ilimitada)
  monto       NUMERIC(10,0),                -- COP
  vence_at    DATE,
  admin       VARCHAR(40),                  -- admin que registró la recarga
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recargas_tel ON bejauha.recargas(telefono, created_at DESC);

-- ---------------------------------------------------------------------
-- 3. asistencias — log de cada clase consumida (auditable)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.asistencias (
  id          BIGSERIAL    PRIMARY KEY,
  telefono    VARCHAR(20)  NOT NULL REFERENCES bejauha.leads(telefono),
  tipo        VARCHAR(12)  NOT NULL CHECK (tipo IN ('presencial','virtual','membresia')),
  clase_fecha DATE         NOT NULL DEFAULT current_date,
  admin       VARCHAR(40),                  -- admin que reportó la asistencia
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_tel ON bejauha.asistencias(telefono, clase_fecha DESC);

-- ---------------------------------------------------------------------
-- Lógica esperada (la implementa el workflow, documentada aquí):
--   ASISTENCIA → INSERT en asistencias + UPDATE saldos_clases
--                SET clases_restantes = clases_restantes - 1.
--                Si queda 1  → disparar aviso "te queda 1 clase".
--                Si llega 0  → disparar MENSAJE 1 (renovación) + recordar MSG 2 (+3 días).
--   RECARGA    → INSERT en recargas + UPSERT saldos_clases
--                SET clases_restantes = COALESCE(clases_restantes,0) + nuevas,
--                    vence_at = nueva fecha.
-- =====================================================================
-- FIN 003_saldos_clases.sql
-- =====================================================================
