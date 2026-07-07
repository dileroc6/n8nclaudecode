-- ============================================================================
-- Luxe Smile — Schema PostgreSQL (luxe_smile)
-- ============================================================================
-- DB compartida: leadai · Schema dedicado: luxe_smile · Usuario: leadai_user
-- Refleja el estado de la DB después de la migración Fase 1 del 2026-05-19.
--
-- Modelo: local = estado conversacional del bot · CRM Cima Labs = datos de
-- negocio. Ver LuxeSmile/CLAUDE.md sección 6 y docs/crm-integration-plan.md.
--
-- Idempotente: se puede correr sobre una DB vacía o sobre una existente sin
-- destruir datos (uso de IF NOT EXISTS).
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS luxe_smile;

-- ============================================================================
-- Función auxiliar: trigger para mantener updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION luxe_smile.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Tabla: luxe_smile.leads (modelo slim post-integración CRM)
-- ============================================================================
-- Solo guarda lo que el bot necesita para mantener la conversación.
-- Los datos de negocio (monto, procedimientos, agenda, datos personales) viven
-- en el CRM Cima Labs y se acceden vía crm_lead_id / crm_paciente_id.
CREATE TABLE IF NOT EXISTS luxe_smile.leads (
  id              SERIAL PRIMARY KEY,
  sku             VARCHAR(10)   NOT NULL UNIQUE,        -- inventado por el bot: '0042'
  phone           VARCHAR(30)   NOT NULL UNIQUE,        -- número WhatsApp del lead
  name            VARCHAR(120),                         -- nombre detectado por el bot
  language        CHAR(2)       NOT NULL DEFAULT 'en',  -- 'en' o 'es'
  estado          VARCHAR(30)   NOT NULL DEFAULT 'captacion',
                  -- valores válidos:
                  --   captacion | fotos_enviadas | revision_pendiente
                  --   cotizacion_enviada | pago_pendiente | pago_confirmado
                  --   datos_recopilados | agendado | descartado
                  --   reprogramar_pendiente (admin canceló)
  crm_lead_id     UUID,                                 -- devuelto por POST /leads (Etapa 3)
                                                        -- ej: '612b5a57-93ce-442d-a0d1-7728a960b4ac'
  crm_paciente_id UUID,                                 -- devuelto por POST /pacientes (Etapa 5)
  notas           TEXT,                                 -- campo libre para el equipo humano
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  pago_at         TIMESTAMPTZ,                          -- timestamp de confirmación de pago
  agendado_at     TIMESTAMPTZ                           -- timestamp de creación del evento
);

DROP TRIGGER IF EXISTS trg_leads_touch_updated ON luxe_smile.leads;
CREATE TRIGGER trg_leads_touch_updated
  BEFORE UPDATE ON luxe_smile.leads
  FOR EACH ROW EXECUTE FUNCTION luxe_smile.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_leads_phone        ON luxe_smile.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_estado       ON luxe_smile.leads(estado);
CREATE INDEX IF NOT EXISTS idx_leads_crm_lead     ON luxe_smile.leads(crm_lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_crm_paciente ON luxe_smile.leads(crm_paciente_id);

-- Columnas LEGACY (presentes solo en DBs migradas desde el modelo pre-2026-05-19).
-- En setup fresco NO se crean. Se eliminan formalmente en Fase 6 de la
-- integración CRM. Si tu DB ya las tiene, quedan marcadas como DEPRECATED:
--   procedure, cotizacion_usd, mes_preferido, payment_method, deposit_paid,
--   first_name, last_name, email, phone_full, calendar_event_id, crm_draft_id

-- ============================================================================
-- Tabla: luxe_smile.mensajes (historial de conversación para el AI Agent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS luxe_smile.mensajes (
  id         SERIAL PRIMARY KEY,
  lead_sku   VARCHAR(10)  NOT NULL REFERENCES luxe_smile.leads(sku),
  rol        VARCHAR(10)  NOT NULL,                     -- 'user' | 'assistant' | 'system'
  contenido  TEXT         NOT NULL,
  media_url  TEXT,                                      -- URL de imagen/audio si aplica
  intent     VARCHAR(40),                               -- intención que la IA entendió (solo rol='assistant') — observabilidad
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensajes_sku ON luxe_smile.mensajes(lead_sku);

-- ============================================================================
-- Tabla: luxe_smile.pagos (trazabilidad local de pagos)
-- ============================================================================
-- El CRM Cima Labs guarda el pago confirmado en luxe_smile_crm.pacientes
-- (monto_deposito, metodo_deposito, deposito_transaction_id). Esta tabla local
-- guarda el flujo previo a la confirmación: pantallazo subido, intento de
-- PayPal, etc. Source of truth de un pago confirmado = CRM.
CREATE TABLE IF NOT EXISTS luxe_smile.pagos (
  id              SERIAL PRIMARY KEY,
  lead_sku        VARCHAR(10)  NOT NULL REFERENCES luxe_smile.leads(sku),
  metodo          VARCHAR(10)  NOT NULL,                -- 'paypal' | 'manual'
  monto_usd       NUMERIC(10,2) NOT NULL,
  estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
                  -- pendiente | confirmado | rechazado
  paypal_order_id VARCHAR(80),                          -- ID de la orden de PayPal
  confirmado_por  VARCHAR(60),                          -- nombre del admin que confirmó (pagos manuales)
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  confirmado_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pagos_sku ON luxe_smile.pagos(lead_sku);

-- ============================================================================
-- Tabla: luxe_smile.agenda_bloques (bloqueos del admin desde WF-07)
-- ============================================================================
-- Bloqueos de fechas que el admin programa por WhatsApp (vacaciones, días no
-- laborales, mantenimiento). Vive local porque el CRM no maneja bloqueos —
-- el bot consulta esta tabla + Google Calendar antes de ofrecer fechas.
CREATE TABLE IF NOT EXISTS luxe_smile.agenda_bloques (
  id           SERIAL PRIMARY KEY,
  tipo         VARCHAR(20)  NOT NULL,                   -- 'dia_completo' | 'rango' | 'cancelacion_masiva'
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE         NOT NULL,                   -- igual a fecha_inicio si es un solo día
  motivo       TEXT,                                    -- texto libre del admin (no se muestra al lead)
  mensaje_lead TEXT,                                    -- mensaje de disculpa generado por IA para los leads afectados
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por   VARCHAR(60),                             -- número de WhatsApp del admin que lo creó
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  procesado_at TIMESTAMPTZ                              -- cuándo se ejecutó la cancelación/notificación masiva
);

CREATE INDEX IF NOT EXISTS idx_bloques_rango ON luxe_smile.agenda_bloques(fecha_inicio, fecha_fin)
  WHERE activo = TRUE;

-- ============================================================================
-- Tabla: luxe_smile.mensajes_procesados (idempotencia de webhooks Evolution)
-- ============================================================================
-- Almacena el message_id de Evolution para detectar reintentos del webhook
-- y evitar respuestas duplicadas al lead. Migración aplicada 2026-05-19 como
-- parte del fix C3 del review de arquitectura.
--
-- Patrón de uso (al inicio del WF-01):
--   INSERT INTO mensajes_procesados (message_id) VALUES ($1)
--   ON CONFLICT (message_id) DO NOTHING
--   RETURNING message_id;
-- Si RETURNING devuelve 0 filas → es duplicado → cortar workflow.
CREATE TABLE IF NOT EXISTS luxe_smile.mensajes_procesados (
  message_id   VARCHAR(120)  PRIMARY KEY,
  processed_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msgproc_dt ON luxe_smile.mensajes_procesados(processed_at);

-- Mantenimiento sugerido: cron diario que purga registros con más de 30 días
-- de antigüedad (los reintentos de Evolution suceden en minutos, no días):
--   DELETE FROM luxe_smile.mensajes_procesados WHERE processed_at < NOW() - INTERVAL '30 days';

-- ============================================================================
-- Verificación final (opcional — descomentar al correr manualmente)
-- ============================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'luxe_smile' ORDER BY table_name;
