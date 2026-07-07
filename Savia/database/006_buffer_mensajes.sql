-- Migración 006: buffer de mensajes para debounce de turnos rápidos
-- Cuando el cliente manda 2-3 mensajes seguidos rápido, el bot los acumula
-- durante una ventana corta (5s) y responde UNA vez con todo el contexto.
-- Patrón: winner-takes-all — gana la ejecución más reciente (por recibido_at).
-- Las ejecuciones anteriores ven que hay un mensaje posterior pendiente y salen.

SET search_path = savia, public;

CREATE TABLE IF NOT EXISTS savia.buffer_mensajes (
  id            BIGSERIAL PRIMARY KEY,
  telefono      TEXT NOT NULL,
  texto         TEXT NOT NULL,
  message_id    TEXT,
  push_name     TEXT,
  tipo_mensaje  TEXT NOT NULL DEFAULT 'text',
  instance      TEXT,
  recibido_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  procesado_at  TIMESTAMPTZ
);

-- Índice para el lookup principal: pendientes por teléfono ordenados por tiempo
CREATE INDEX IF NOT EXISTS idx_buffer_tel_pending
  ON savia.buffer_mensajes(telefono, recibido_at)
  WHERE procesado_at IS NULL;

-- Cleanup: TTL de 7 días para no llenar la tabla
-- (los procesados ya no se usan, los no-procesados de hace 7 días son anomalías)
CREATE INDEX IF NOT EXISTS idx_buffer_old
  ON savia.buffer_mensajes(recibido_at);

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'savia' AND table_name = 'buffer_mensajes'
ORDER BY ordinal_position;
