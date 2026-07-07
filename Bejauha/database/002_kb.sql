-- =====================================================================
-- Bejauha — Base de conocimiento (KB) para el Agente 3 (Inbound)
-- Schema: bejauha · DB: leadai · contenedor: evolution_postgres
-- Versión: 002 · Fecha: 2026-05-22
-- =====================================================================
-- Tabla que alimenta al LLM con datos reales (precios, horarios, FAQ).
-- El workflow de n8n hace SELECT de las filas activas y las inyecta en el
-- contexto. Así el equipo actualiza precios sin tocar el prompt.
--
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 002_kb.sql
-- Fuente: levantamiento Bejauha (mayo 2026).
-- =====================================================================

SET search_path TO bejauha, public;

CREATE TABLE IF NOT EXISTS bejauha.knowledge_base (
  clave       VARCHAR(60)  PRIMARY KEY,        -- slug estable
  categoria   VARCHAR(20)  NOT NULL
                CHECK (categoria IN ('servicio','horario','precio','pago','faq','contacto','general')),
  titulo      VARCHAR(120) NOT NULL,
  contenido   TEXT         NOT NULL,
  activo      BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Upsert idempotente: re-ejecutar el archivo actualiza el contenido.
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES

-- ---------- SERVICIOS ----------
('serv_membresia', 'servicio', 'Membresía Bejauha',
 'Membresía digital (Hotmart), en construcción. Incluirá biblioteca de clases grabadas, material descargable y grupo privado de WhatsApp.'),
('serv_presencial', 'servicio', 'Clases presenciales dominicales',
 'Cada domingo en el Parque El Country. Duran 1h40: la primera mitad es funcional/pilates y la segunda es yoga. Se llama "Domingo de Bienestar".'),
('serv_virtual', 'servicio', 'Clases virtuales en vivo',
 'Yoga y meditación en vivo (Hotmart). Las grabaciones quedan disponibles después para verlas cuando quieras.'),
('serv_eventos', 'servicio', 'Eventos mensuales',
 'Experiencias presenciales con una temática especial, para la comunidad y para quienes recién llegan.'),
('serv_corporativo', 'servicio', 'Bienestar corporativo',
 'Clases para equipos de trabajo, presenciales o virtuales.'),

-- ---------- HORARIOS ----------
('horario_virtual', 'horario', 'Horario de clases virtuales en vivo',
 'Lun 8:30pm Yoga (Amy) · Mar 5:30am Yoga (Amy) · Mar 8:00pm Meditación (María Elvira) · Mié 8:30pm Yoga (Amy) · Jue 8:30pm Yoga (María Elvira) · Vie 5:30am Yoga (Amy).'),
('horario_presencial', 'horario', 'Horario presencial',
 'Domingos 8:30am en el Parque El Country — Domingo de Bienestar (funcional + yoga).'),

-- ---------- PRECIOS ----------
('precio_suelta', 'precio', 'Clase suelta',
 'Clase suelta presencial: $40.000 COP. Clase suelta virtual: $35.000 COP (la virtual se paga por la web).'),
('precio_paquetes', 'precio', 'Paquetes de clases presenciales',
 'Paquete 4 clases presenciales: $92.000 (vence en 2 meses). Paquete 8 clases presenciales: $170.000 (vence en 3 meses, con opción de pausa).'),
('precio_membresia', 'precio', 'Membresías mensuales',
 'Virtual / Membresía básica: $79.900 al mes — clases virtuales en vivo ILIMITADAS. Membresía Bejauha: $160.000 al mes — incluye lo de la virtual + clases presenciales + cursos + acceso anticipado a eventos y descuentos. Las membresías se pagan por la pasarela.'),
('precio_descuentos', 'precio', 'Descuentos y grupos',
 'No hay una estructura fija de descuentos; se definen según promociones vigentes.'),

-- ---------- PAGOS ----------
('pago_medios', 'pago', 'Medios de pago',
 'Se recibe por Nequi, DaviPlata, Llave y Nu.'),

-- ---------- FAQ ----------
('faq_experiencia', 'faq', '¿Necesito experiencia previa?',
 'No, las clases reciben a todos los niveles. Si eres principiante, el equipo te acompaña en tu ritmo.'),
('faq_ubicacion', 'faq', '¿Dónde son las clases presenciales?',
 'En el Parque El Country, los domingos a las 8:30am.'),
('faq_grabaciones', 'faq', '¿Las clases virtuales quedan grabadas?',
 'Sí, las clases virtuales en vivo quedan grabadas y disponibles para verlas después.'),
('faq_modalidad', 'faq', '¿Hay clases online y presenciales?',
 'Ambas: clases virtuales en vivo entre semana y una clase presencial los domingos en el parque.')

ON CONFLICT (clave) DO UPDATE
  SET categoria  = EXCLUDED.categoria,
      titulo     = EXCLUDED.titulo,
      contenido  = EXCLUDED.contenido,
      activo     = TRUE,
      updated_at = now();

-- =====================================================================
-- FIN 002_kb.sql · Para ver: SELECT categoria, titulo FROM bejauha.knowledge_base ORDER BY categoria;
-- =====================================================================
