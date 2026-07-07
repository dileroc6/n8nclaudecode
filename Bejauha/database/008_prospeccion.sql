-- =====================================================================
-- Bejauha — PROSPECCIÓN (Agente 1 outbound)
-- 1) Contador del "ciclo eterno" en leads (cuántas veces y cuándo se tocó)
-- 2) Tabla editable de plantillas de seguimiento, sembrada por tipificación
-- Versión: 008 · Fecha: 2026-05-27
-- =====================================================================
-- Ejecutar UNA vez como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 008_prospeccion.sql
-- Requiere haber corrido 006 (migración CRM) y 007 (carga de la base).
-- =====================================================================

SET search_path TO bejauha, public;

-- ---------------------------------------------------------------------
-- 1) Contador del ciclo de seguimiento eterno (comentario Camila 2026-05-26)
--    toques_outbound = cuántas veces le hemos escrito en outbound.
--    ultimo_toque    = fecha del último envío. prx_contacto (ya existe) = próximo.
--    El cron decide el salto: 0→+3m, 1→+6m, 2→+12m, 3+→+12m (anual perpetuo).
-- ---------------------------------------------------------------------
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS toques_outbound INT NOT NULL DEFAULT 0;
ALTER TABLE bejauha.leads ADD COLUMN IF NOT EXISTS ultimo_toque    DATE;

-- ---------------------------------------------------------------------
-- 2) plantillas_seguimiento — copy editable, una fila por tipificación.
--    El workflow hace JOIN leads.tipificacion = plantillas.tipificacion
--    (string EXACTO tal como quedó cargado por el importador 007).
--    'variante' permite rotar copys en el futuro (pendiente #7b); hoy = 1.
--    destino: 'prospeccion' (outbound automático) | 'clases' (las usa Agente 2).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bejauha.plantillas_seguimiento (
  id            BIGSERIAL    PRIMARY KEY,
  tipificacion  VARCHAR(40)  NOT NULL,
  variante      INT          NOT NULL DEFAULT 1,
  grupo         INT          NOT NULL,            -- 1 clientes · 2 tibios · 3 fríos
  destino       VARCHAR(12)  NOT NULL CHECK (destino IN ('prospeccion','clases')),
  nombre_corto  VARCHAR(60),
  texto         TEXT         NOT NULL,            -- usa {{nombre}}
  canal         VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (tipificacion, variante)
);

-- --- Grupo 2 (tibios) → PROSPECCIÓN -----------------------------------
INSERT INTO bejauha.plantillas_seguimiento (tipificacion, grupo, destino, nombre_corto, texto) VALUES
('Cortesía Consumida', 2, 'prospeccion', 'Cortesía consumida (seguimiento)',
 'Hola {{nombre}} 😊 ¡Pasaba a saludarte! ¿Qué tal te pareció la clase? Me encantaría saber cómo te fue. Si te gustó y quieres seguir, cuéntame — ¿te explico los paquetes y modalidades que tenemos? 🙌'),
('Re agendar cortesía', 2, 'prospeccion', 'Re-agendar cortesía',
 'Hola {{nombre}} 😊 Vi que todavía no has agendado tu clase de cortesía — ¡y no quería que se te pasara! Es completamente gratis y sin compromiso. ¿Cuándo puedes esta semana para apartarte el espacio? 🙌')
ON CONFLICT (tipificacion, variante) DO NOTHING;

-- --- Grupo 3 (fríos) → PROSPECCIÓN ------------------------------------
INSERT INTO bejauha.plantillas_seguimiento (tipificacion, grupo, destino, nombre_corto, texto) VALUES
('Mensaje enviado', 3, 'prospeccion', 'Frío — primer contacto WhatsApp',
 '¡Holaaaa {{nombre}}! ¿Cómo estás? 😊 Vi que tienes nuestro contacto en WhatsApp y quería escribirte personalmente — ¡qué bueno tenerte por aquí! 🌿 Quería regalarte una clase de cortesía para que nos conozcas y vivas la experiencia Bejauha de primera mano. ¿Te gustaría tomarla? Y si quieres, puedes traer a un amig@ también 🙌'),
-- Plantilla 9 SUAVIZADA: cierra el ciclo SIN despedir (comentario Camila: "el no es no por ahora").
('No responde', 3, 'prospeccion', 'Frío — sin respuesta (cierra ciclo, no despide)',
 'Hola {{nombre}} 😊 Sé que quizá ahora no es el momento, y está perfecto 🤍 Te dejo la puerta abierta: cuando quieras moverte, respirar y reconectar contigo, aquí vamos a estar para recibirte. Un abrazo y que tengas un lindo día 🌿')
ON CONFLICT (tipificacion, variante) DO NOTHING;

-- --- Grupo 1 (clientes) → CLASES (Agente 2), NO salen por PROSPECCIÓN --
INSERT INTO bejauha.plantillas_seguimiento (tipificacion, grupo, destino, nombre_corto, texto) VALUES
('Activo → Confirmar clase', 1, 'clases', 'Activo — confirmar/usar clase',
 'Hola {{nombre}} 🌿 Revisé que todavía tienes clases dentro de tu paquete, no queremos que te quedes sin usarlas. ¿Tenemos cupos este domingo o prefieres pasarte a una clase virtual? Dinos cuál te funciona y nos vemos 🙌'),
('Activo → Pago pendiente', 1, 'clases', 'Activo — renovación',
 'Hola {{nombre}}, ¿cómo estás? 🌿 Tu paquete está próximo a renovarse y no queremos que pierdas tu ritmo. ¿Lo renovamos igual o quieres cambiar algo? Dinos y lo dejamos listo hoy mismo 🙌'),
('Activo + Deudor', 1, 'clases', 'Activo + deudor',
 'Hola {{nombre}} 👋 Ya tomaste una clase de tu próximo paquete — ¡qué bueno que no paraste! ¿Seguimos con esa clase individual o te va mejor arrancar el paquete de 4 u 8 clases?'),
('Deudor (cliente)', 1, 'clases', 'Deudor (cliente)',
 'Hola {{nombre}} 👋 Ya tomaste una clase de tu próximo paquete — ¡qué bueno que no paraste! ¿Seguimos con esa clase individual o te va mejor arrancar el paquete de 4 u 8 clases?'),
('Pausa', 1, 'clases', 'Pausa',
 'Hola {{nombre}} 😊 Hace un tiempo pausaste tus clases y queríamos escribirte. ¿Todo bien? Cuéntanos qué pasó — y si en algún momento quieres retomar, aquí estamos para ayudarte a arrancar de nuevo 🙌'),
('No activo (ex-cliente)', 1, 'clases', 'Ex-cliente — reactivación',
 'Hola {{nombre}} 😊 ¿Cómo estás? Vi que hace un tiempo no has vuelto y no podía quedarme sin escribirte — ¡Nos has hecho falta! ¿Qué pasó? Si quieres retomar, cuéntame y miramos cómo te agendamos o qué se puede hacer 🙌')
ON CONFLICT (tipificacion, variante) DO NOTHING;

\echo '--- plantillas_seguimiento sembradas: ---'
SELECT tipificacion, grupo, destino, left(texto,40) AS preview FROM bejauha.plantillas_seguimiento ORDER BY destino, grupo, tipificacion;

-- =====================================================================
-- FIN 008_prospeccion.sql
-- =====================================================================
