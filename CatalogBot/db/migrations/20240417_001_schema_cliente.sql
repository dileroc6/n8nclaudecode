-- =============================================================================
-- Migración 001: Schema por cliente
-- Placeholder {schema} es reemplazado por provision_cliente.js con el cliente_id real
-- NUNCA ejecutar directamente; siempre via provision_cliente.js o migrate.js
-- NUNCA modificar este archivo; crear una nueva migración para cambios
-- =============================================================================

-- Usuarios autorizados del cliente para operar via WhatsApp
CREATE TABLE IF NOT EXISTS {schema}.usuarios (
  telefono        VARCHAR(20) PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  rol             VARCHAR(20) NOT NULL CHECK (rol IN ('admin','editor','viewer')),
  activo          BOOLEAN DEFAULT true,
  fecha_registro  TIMESTAMPTZ DEFAULT NOW()
);

-- Estado de conversación activa por número de teléfono
-- Una fila por usuario; se upsert en cada interacción
CREATE TABLE IF NOT EXISTS {schema}.sesiones (
  telefono            VARCHAR(20) PRIMARY KEY,
  estado              VARCHAR(50) NOT NULL DEFAULT 'idle',
  paso                VARCHAR(100),
  datos_pendientes    JSONB,
  timestamp_inicio    TIMESTAMPTZ DEFAULT NOW(),
  timestamp_update    TIMESTAMPTZ DEFAULT NOW(),
  expira              TIMESTAMPTZ,
  lock_timestamp      TIMESTAMPTZ
);

-- Historial de mensajes para reconstruir contexto en cada turno del AI Agent
-- Se consulta con ORDER BY turno DESC LIMIT 10 y se invierte para Claude
CREATE TABLE IF NOT EXISTS {schema}.historial_conversacion (
  id           SERIAL PRIMARY KEY,
  telefono     VARCHAR(20) NOT NULL,
  turno        INTEGER NOT NULL,
  rol          VARCHAR(20) NOT NULL CHECK (rol IN ('user','assistant')),
  contenido    TEXT NOT NULL,
  tokens_aprox INTEGER,
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_historial_telefono_turno
  ON {schema}.historial_conversacion (telefono, turno DESC);

-- Registro inmutable de todos los cambios para auditoría y reversión
CREATE TABLE IF NOT EXISTS {schema}.auditoria (
  id              SERIAL PRIMARY KEY,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  telefono        VARCHAR(20) NOT NULL,
  usuario_nombre  VARCHAR(255),
  rol             VARCHAR(20),
  accion          VARCHAR(100) NOT NULL,
  producto_id     VARCHAR(100),
  producto_nombre VARCHAR(255),
  campo           VARCHAR(100),
  valor_anterior  TEXT,
  valor_nuevo     TEXT,
  revertido       BOOLEAN DEFAULT false,
  revertido_en    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp
  ON {schema}.auditoria (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_producto
  ON {schema}.auditoria (producto_id)
  WHERE producto_id IS NOT NULL;

-- Cambios programados para ejecución diferida via WF-E
CREATE TABLE IF NOT EXISTS {schema}.programados (
  id                  SERIAL PRIMARY KEY,
  timestamp_creacion  TIMESTAMPTZ DEFAULT NOW(),
  timestamp_ejecucion TIMESTAMPTZ NOT NULL,
  telefono            VARCHAR(20) NOT NULL,
  accion              VARCHAR(100) NOT NULL,
  datos_json          JSONB NOT NULL,
  estado              VARCHAR(20) DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','ejecutado','cancelado','error')),
  timestamp_ejecutado TIMESTAMPTZ,
  intentos            INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_programados_ejecucion
  ON {schema}.programados (timestamp_ejecucion, estado)
  WHERE estado = 'pendiente';

-- Errores del sistema para monitoreo y circuit breaker en WF-E
CREATE TABLE IF NOT EXISTS {schema}.errores (
  id            SERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ DEFAULT NOW(),
  workflow      VARCHAR(50),
  nodo          VARCHAR(100),
  telefono      VARCHAR(20),
  error_tipo    VARCHAR(100),
  error_detalle TEXT,
  notificado    BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_errores_timestamp_tipo
  ON {schema}.errores (timestamp DESC, error_tipo);

-- Métricas diarias agregadas por WF-E para el comando "estado del sistema"
CREATE TABLE IF NOT EXISTS {schema}.metricas_diarias (
  fecha               DATE PRIMARY KEY,
  total_mensajes      INTEGER DEFAULT 0,
  total_cambios       INTEGER DEFAULT 0,
  total_errores       INTEGER DEFAULT 0,
  tokens_consumidos   INTEGER DEFAULT 0,
  costo_estimado_usd  NUMERIC(10,4) DEFAULT 0
);
