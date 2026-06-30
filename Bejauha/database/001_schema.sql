-- =====================================================================
-- Bejauha — Yoga & Bienestar · Agentes WhatsApp IA
-- Schema PostgreSQL: bejauha
-- DB target: leadai (dentro del contenedor Docker `evolution_postgres`, pg15)
-- Owner esperado: leadai_user (igual que savia, zoe, luxe_smile)
-- Versión: 001 (Sprint 1 — cimientos)
-- Fecha:   2026-05-19
-- =====================================================================
-- RESTRICCIÓN CRÍTICA: toda la persistencia de Bejauha vive en el
-- esquema independiente `bejauha`. Nunca escribir en `public` ni en
-- esquemas de otros clientes (savia, zoe, etc.).
--
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 001_schema.sql
-- Idempotente: usa IF NOT EXISTS y ON CONFLICT cuando aplica.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS bejauha;

SET search_path TO bejauha, public;

-- ---------------------------------------------------------------------
-- 1. leads — identidad estable del lead (PK = teléfono normalizado E.164)
-- ---------------------------------------------------------------------
-- Es el núcleo del proyecto. Aquí viven los 1.300 contactos dormidos y
-- todos los que entren orgánicamente (inbound). El estado de clasificación
-- [frio | tibio | caliente] gobierna el ruteo entre agentes y marketing.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.leads (
  telefono          VARCHAR(20)  PRIMARY KEY,         -- E.164 sin '+': '573001234567'
  nombre            VARCHAR(120),
  email             VARCHAR(160),
  idioma            CHAR(2)      NOT NULL DEFAULT 'es',

  -- Origen y ruteo --------------------------------------------------
  origen            VARCHAR(12)  NOT NULL DEFAULT 'outbound'
                      CHECK (origen IN ('outbound', 'inbound', 'import')),

  -- Clasificación de temperatura (la regla de negocio central) ------
  clasificacion     VARCHAR(10)
                      CHECK (clasificacion IN ('frio', 'tibio', 'caliente')),
  score             INT          NOT NULL DEFAULT 0,  -- 0–100, lo calcula el LLM

  -- Estado del ciclo outbound --------------------------------------
  --   pendiente    → en la base, aún no entra a un lote
  --   en_lote      → reservado por un lote semanal en curso
  --   enviado      → plantilla enviada vía Evolution API
  --   respondido   → el lead contestó (dispara clasificación)
  --   sin_respuesta→ no contestó tras la ventana definida
  --   descartado   → opt-out o número inválido
  estado_outbound   VARCHAR(14)  NOT NULL DEFAULT 'pendiente'
                      CHECK (estado_outbound IN
                        ('pendiente','en_lote','enviado','respondido','sin_respuesta','descartado')),

  -- Datos de calificación (Punto 3 del documento) ------------------
  interes_yoga      BOOLEAN,
  modalidad         VARCHAR(12)  CHECK (modalidad IN ('online','presencial','ambas')),
  frecuencia        VARCHAR(40),                       -- texto libre: "2 veces/semana", etc.
  experiencia       VARCHAR(20)  CHECK (experiencia IN ('ninguna','principiante','intermedia','avanzada')),
  disposicion_pago  VARCHAR(12)  CHECK (disposicion_pago IN ('baja','media','alta')),

  -- Marketing / cumplimiento ---------------------------------------
  asignado_humano   BOOLEAN      NOT NULL DEFAULT FALSE, -- TRUE cuando hay handoff activo
  opt_out_marketing BOOLEAN      NOT NULL DEFAULT FALSE,
  habeas_data_at    TIMESTAMPTZ,                        -- aceptación tratamiento de datos (Ley 1581)

  -- Trazabilidad ----------------------------------------------------
  lote_id           BIGINT,                             -- FK lógica → lotes_outbound.id
  metadata          JSONB        NOT NULL DEFAULT '{}'::jsonb,
  primer_contacto   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  ultimo_contacto   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_estado_outbound
  ON bejauha.leads(estado_outbound);

CREATE INDEX IF NOT EXISTS idx_leads_clasificacion
  ON bejauha.leads(clasificacion)
  WHERE clasificacion IS NOT NULL;

-- Índice parcial clave: selección rápida del próximo lote outbound
CREATE INDEX IF NOT EXISTS idx_leads_pendientes
  ON bejauha.leads(ultimo_contacto)
  WHERE estado_outbound = 'pendiente' AND opt_out_marketing = FALSE;

-- ---------------------------------------------------------------------
-- 2. lotes_outbound — control de los lotes semanales (100 leads/sem)
-- ---------------------------------------------------------------------
-- El Agente 1 reserva 100 leads pendientes cada semana, los marca
-- 'en_lote' y los procesa. Esta tabla da idempotencia y reporting.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.lotes_outbound (
  id            BIGSERIAL    PRIMARY KEY,
  semana        DATE         NOT NULL,                 -- lunes de la semana (truncado)
  tamano        INT          NOT NULL DEFAULT 100,
  enviados      INT          NOT NULL DEFAULT 0,
  respondidos   INT          NOT NULL DEFAULT 0,
  calientes     INT          NOT NULL DEFAULT 0,
  tibios        INT          NOT NULL DEFAULT 0,
  frios         INT          NOT NULL DEFAULT 0,
  estado        VARCHAR(12)  NOT NULL DEFAULT 'en_curso'
                  CHECK (estado IN ('en_curso','cerrado')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lotes_semana ON bejauha.lotes_outbound(semana DESC);

-- ---------------------------------------------------------------------
-- 3. mensajes_logs — log conversacional append-only (in/out)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.mensajes_logs (
  id          BIGSERIAL    PRIMARY KEY,
  ts          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  telefono    VARCHAR(20)  NOT NULL,
  direccion   CHAR(3)      NOT NULL CHECK (direccion IN ('in','out')),
  agente      VARCHAR(12)  CHECK (agente IN ('outbound','inbound','humano','sistema')),
  canal       VARCHAR(20)  NOT NULL DEFAULT 'evolution_api',
  texto       TEXT,
  media_url   TEXT,
  intent      VARCHAR(40),  -- saludo|info_clases|precios|modalidad|objecion|intencion_compra|otro
  metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mensajes_tel_ts
  ON bejauha.mensajes_logs(telefono, ts DESC);

-- ---------------------------------------------------------------------
-- 4. handoffs — traspasos a asesor humano (lead caliente)
-- ---------------------------------------------------------------------
-- Tanto el Agente 1 (outbound) como el Agente 2 (inbound) crean una fila
-- aquí cuando detectan intención alta. Dispara la alerta inmediata.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.handoffs (
  id            BIGSERIAL    PRIMARY KEY,
  telefono      VARCHAR(20)  NOT NULL REFERENCES bejauha.leads(telefono),
  origen_agente VARCHAR(12)  NOT NULL CHECK (origen_agente IN ('outbound','inbound')),
  resumen       TEXT,                                  -- contexto que el LLM pasa al humano
  estado        VARCHAR(12)  NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','atendido','perdido')),
  asesor        VARCHAR(80),                           -- humano que tomó el lead
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  atendido_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_handoffs_pendientes
  ON bejauha.handoffs(created_at)
  WHERE estado = 'pendiente';

-- ---------------------------------------------------------------------
-- 5. contactos_dia — contador de contactos únicos por día
-- ---------------------------------------------------------------------
-- PK compuesta → INSERT ... ON CONFLICT DO NOTHING idempotente.
-- Útil para rate-limiting del outbound y para métricas.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.contactos_dia (
  fecha       DATE         NOT NULL,
  telefono    VARCHAR(20)  NOT NULL,
  primer_ts   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (fecha, telefono)
);

-- =====================================================================
-- FIN 001_schema.sql
-- Próximos scripts sugeridos:
--   002_seed_kb.sql   → base de conocimiento del Agente 2 (clases, precios, FAQ)
--   003_views.sql     → vistas de reporting (embudo, tasa de respuesta por lote)
-- =====================================================================
