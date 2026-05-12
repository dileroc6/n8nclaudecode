-- ============================================================================
-- Zoe Tantric SPA — Schema Postgres
-- Schema aislado dentro del Postgres del VPS Hostinger.
-- Idempotente: re-ejecutable sin destruir datos.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE SCHEMA IF NOT EXISTS zoe;
SET search_path TO zoe, public;

-- ----------------------------------------------------------------------------
-- Tipos enum
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE zoe.estado_cita AS ENUM (
        'reservada',     -- creada, esperando que llegue el momento (no requiere OTP previo)
        'en_curso',      -- el slot_inicio ya pasó pero la ventana de OTP sigue abierta
        'ejecutada',     -- cliente envió OTP correcto dentro de la ventana
        'cancelada',     -- cancelada por cliente o admin antes del slot
        'reprogramada',  -- el cliente movió esta cita; existe otra cita con cita_origen_id apuntando aquí
        'no_show'        -- la ventana de OTP expiró sin respuesta (presunción, reversible por admin)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE zoe.modalidad_cita AS ENUM ('individual', 'pareja', 'espectador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE zoe.metodo_pago AS ENUM ('efectivo', 'tarjeta', 'qr_transferencia');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ----------------------------------------------------------------------------
-- Sedes (Bogotá, Cajicá, futuras)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.sedes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      TEXT        NOT NULL UNIQUE,
    ciudad      TEXT        NOT NULL,
    direccion   TEXT,
    activa      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Terapeutas
-- genero: 'M' o 'F'. Algunos servicios requieren terapeuta hombre o pareja mixta.
-- horario_base: jsonb por día con franjas. Una franja vacía = no trabaja ese día.
--   { "lunes": [{"inicio":"09:00","fin":"21:00"}], ..., "domingo": [] }
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.terapeutas (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          TEXT        NOT NULL,
    genero          CHAR(1)     NOT NULL CHECK (genero IN ('M', 'F')),
    sede_id         UUID        NOT NULL REFERENCES zoe.sedes(id),
    especialidad    TEXT,
    horario_base    JSONB       NOT NULL DEFAULT '{}'::jsonb,
    activo          BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terapeutas_sede ON zoe.terapeutas(sede_id) WHERE activo;

-- ----------------------------------------------------------------------------
-- Servicios (catálogo de terapias)
-- modalidad: individual | pareja | espectador (define cuántas personas y dinámica)
-- requiere_dos_terapeutas: las terapias de pareja pueden ser con 1 o 2 terapeutas.
--   Esta columna marca el caso "típico" pero el cliente puede elegir 1 al mismo precio.
-- nivel_sugerido: 'principiante' | 'experto' | 'incognito' | NULL (informativo).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.servicios (
    id                          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre                      TEXT            NOT NULL UNIQUE,
    descripcion                 TEXT,
    modalidad                   zoe.modalidad_cita NOT NULL,
    duracion_minutos            INTEGER         NOT NULL CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),
    precio_cop                  INTEGER         NOT NULL CHECK (precio_cop >= 0),
    requiere_dos_terapeutas     BOOLEAN         NOT NULL DEFAULT FALSE,
    nivel_sugerido              TEXT            CHECK (nivel_sugerido IN ('principiante','experto','incognito') OR nivel_sugerido IS NULL),
    activo                      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Habilitación terapeuta ↔ servicio
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.terapeuta_servicios (
    terapeuta_id    UUID NOT NULL REFERENCES zoe.terapeutas(id) ON DELETE CASCADE,
    servicio_id     UUID NOT NULL REFERENCES zoe.servicios(id)  ON DELETE CASCADE,
    PRIMARY KEY (terapeuta_id, servicio_id)
);

-- ----------------------------------------------------------------------------
-- Add-ons (decoración romántica + jacuzzi, futuros: pétalos, espumante, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.addons (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      TEXT        NOT NULL UNIQUE,
    descripcion TEXT,
    precio_cop  INTEGER     NOT NULL CHECK (precio_cop >= 0),
    activo      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Clientes
-- contador_reprogramaciones: se RESETEA a 0 al pasar una cita a 'ejecutada' (trigger).
-- contador_reprog_vitalicio: nunca se resetea — útil para alertas del admin.
-- contador_no_shows: solo informativo + alerta admin (NO auto-bloqueo).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.clientes (
    id                              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_id                     TEXT        NOT NULL UNIQUE,  -- "573001234567"
    nombre                          TEXT,
    correo                          TEXT,
    contador_reprogramaciones       INTEGER     NOT NULL DEFAULT 0 CHECK (contador_reprogramaciones >= 0),
    contador_reprog_vitalicio       INTEGER     NOT NULL DEFAULT 0 CHECK (contador_reprog_vitalicio >= 0),
    contador_no_shows               INTEGER     NOT NULL DEFAULT 0 CHECK (contador_no_shows >= 0),
    bloqueado                       BOOLEAN     NOT NULL DEFAULT FALSE,
    notas                           TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clientes_whatsapp ON zoe.clientes(whatsapp_id);

-- ----------------------------------------------------------------------------
-- Citas
-- otp_code: NULLABLE — se genera 30 min DESPUÉS de slot_inicio por cron (WF5).
-- otp_expira_at: ventana de validez (1h desde generación).
-- terapeuta_secundario_id: opcional. Servicios de pareja pueden tener 1 o 2 terapeutas (mismo precio según PDF).
-- pareja_acompanante_whatsapp_id: si modalidad='pareja', WhatsApp del acompañante (para enviar mensajes/recordatorios).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.citas (
    id                              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id                      UUID            NOT NULL REFERENCES zoe.clientes(id),
    sede_id                         UUID            NOT NULL REFERENCES zoe.sedes(id),
    servicio_id                     UUID            NOT NULL REFERENCES zoe.servicios(id),
    terapeuta_id                    UUID            NOT NULL REFERENCES zoe.terapeutas(id),
    terapeuta_secundario_id         UUID            REFERENCES zoe.terapeutas(id),
    slot_inicio                     TIMESTAMPTZ     NOT NULL,
    slot_fin                        TIMESTAMPTZ     NOT NULL,
    estado                          zoe.estado_cita NOT NULL DEFAULT 'reservada',
    otp_code                        CHAR(4),
    otp_generado_at                 TIMESTAMPTZ,
    otp_expira_at                   TIMESTAMPTZ,
    cita_origen_id                  UUID            REFERENCES zoe.citas(id),
    pareja_acompanante_whatsapp_id  TEXT,
    nivel_solicitado                TEXT            CHECK (nivel_solicitado IN ('principiante','experto','incognito') OR nivel_solicitado IS NULL),
    metodo_pago                     zoe.metodo_pago,
    canal                           TEXT            NOT NULL DEFAULT 'whatsapp',
    notas                           TEXT,
    ejecutada_at                    TIMESTAMPTZ,
    cancelada_at                    TIMESTAMPTZ,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT slot_valido            CHECK (slot_fin > slot_inicio),
    CONSTRAINT otp_4_digitos          CHECK (otp_code IS NULL OR otp_code ~ '^[0-9]{4}$'),
    CONSTRAINT terapeutas_distintos   CHECK (terapeuta_secundario_id IS NULL OR terapeuta_secundario_id <> terapeuta_id)
);

CREATE INDEX IF NOT EXISTS idx_citas_terapeuta_fecha    ON zoe.citas(terapeuta_id, slot_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_terapeuta2_fecha   ON zoe.citas(terapeuta_secundario_id, slot_inicio) WHERE terapeuta_secundario_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_citas_cliente            ON zoe.citas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_citas_estado             ON zoe.citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_sede_fecha         ON zoe.citas(sede_id, slot_inicio);
CREATE INDEX IF NOT EXISTS idx_citas_otp_expira         ON zoe.citas(otp_expira_at) WHERE estado = 'en_curso';

-- EXCLUDE: el terapeuta principal no puede tener solapes en estados activos.
ALTER TABLE zoe.citas DROP CONSTRAINT IF EXISTS no_solapamiento_terapeuta;
ALTER TABLE zoe.citas
    ADD CONSTRAINT no_solapamiento_terapeuta
    EXCLUDE USING GIST (
        terapeuta_id WITH =,
        tstzrange(slot_inicio, slot_fin, '[)') WITH &&
    ) WHERE (estado IN ('reservada', 'en_curso'));

-- EXCLUDE: el terapeuta secundario tampoco (constraint independiente).
ALTER TABLE zoe.citas DROP CONSTRAINT IF EXISTS no_solapamiento_terapeuta_secundario;
ALTER TABLE zoe.citas
    ADD CONSTRAINT no_solapamiento_terapeuta_secundario
    EXCLUDE USING GIST (
        terapeuta_secundario_id WITH =,
        tstzrange(slot_inicio, slot_fin, '[)') WITH &&
    ) WHERE (estado IN ('reservada', 'en_curso') AND terapeuta_secundario_id IS NOT NULL);

-- ----------------------------------------------------------------------------
-- Add-ons por cita (m:n)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.cita_addons (
    cita_id             UUID NOT NULL REFERENCES zoe.citas(id) ON DELETE CASCADE,
    addon_id            UUID NOT NULL REFERENCES zoe.addons(id),
    precio_cop_snapshot INTEGER NOT NULL,  -- precio al momento de la reserva (histórico)
    PRIMARY KEY (cita_id, addon_id)
);

-- ----------------------------------------------------------------------------
-- Bloqueos manuales del admin
-- terapeuta_id NULL = bloqueo de toda la sede o global.
-- sede_id NULL = aplica a todas las sedes.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.disponibilidad_bloqueos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sede_id         UUID        REFERENCES zoe.sedes(id),
    terapeuta_id    UUID        REFERENCES zoe.terapeutas(id),
    inicio          TIMESTAMPTZ NOT NULL,
    fin             TIMESTAMPTZ NOT NULL,
    motivo          TEXT,
    created_by      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bloqueo_valido CHECK (fin > inicio)
);

CREATE INDEX IF NOT EXISTS idx_bloqueos_terapeuta ON zoe.disponibilidad_bloqueos(terapeuta_id, inicio, fin);
CREATE INDEX IF NOT EXISTS idx_bloqueos_sede      ON zoe.disponibilidad_bloqueos(sede_id, inicio, fin);
CREATE INDEX IF NOT EXISTS idx_bloqueos_rango     ON zoe.disponibilidad_bloqueos USING GIST (tstzrange(inicio, fin, '[)'));

-- ----------------------------------------------------------------------------
-- Idempotencia de webhooks Evolution
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.mensajes_recibidos (
    message_id      TEXT        PRIMARY KEY,
    whatsapp_id     TEXT        NOT NULL,
    payload         JSONB       NOT NULL,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_recibidos_wa ON zoe.mensajes_recibidos(whatsapp_id, processed_at DESC);

-- ----------------------------------------------------------------------------
-- Acciones administrativas pendientes de confirmación (modo híbrido conversacional)
-- El admin escribe natural → GPT genera preview + accion_pendiente → se guarda aquí
-- → admin confirma con "sí/no" → si "sí" se ejecuta y se marca consumed_at.
-- Expira a los 5 minutos para evitar acciones colgadas.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zoe.admin_pending_actions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_whatsapp  TEXT        NOT NULL,
    accion          JSONB       NOT NULL,  -- { tipo, params: {...} }
    preview_text    TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
    consumed_at     TIMESTAMPTZ,
    resultado       JSONB
);

CREATE INDEX IF NOT EXISTS idx_admin_pending_active
    ON zoe.admin_pending_actions(admin_whatsapp, created_at DESC)
    WHERE consumed_at IS NULL;
