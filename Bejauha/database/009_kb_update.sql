-- =====================================================================
-- Bejauha — Actualización de la KB (pendiente #21)
-- Refleja las decisiones tomadas hasta el 2026-05-28:
--   - Membresías: se compran SOLO por web (https://bejauha.com/planes)
--   - Paquetes presenciales: NO tienen link, se coordinan con el equipo
--   - Clase suelta virtual: por web; presencial: con el equipo
--   - Aclaraciones de horario virtual + nuevas FAQ explícitas
-- Versión: 009 · Fecha: 2026-05-28
-- =====================================================================
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 009_kb_update.sql
-- Idempotente: ON CONFLICT (clave) DO UPDATE.
-- =====================================================================

SET search_path TO bejauha, public;

-- ---------------------------------------------------------------------
-- 1) Servicios — la membresía ya está disponible (no "en construcción")
-- ---------------------------------------------------------------------
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES
('serv_membresia', 'servicio', 'Membresía Bejauha',
 'Servicio mensual disponible: la persona se suscribe en línea desde nuestra página https://bejauha.com/planes y empieza el mismo día. Incluye clases virtuales en vivo, grabadas, material y comunidad. Hay dos planes: Virtual ($79.900) y Bejauha completa ($160.000).')
ON CONFLICT (clave) DO UPDATE
  SET categoria=EXCLUDED.categoria, titulo=EXCLUDED.titulo, contenido=EXCLUDED.contenido,
      activo=TRUE, updated_at=now();

-- ---------------------------------------------------------------------
-- 2) Precios — añadir link de membresías y aclarar canal de pago
-- ---------------------------------------------------------------------
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES
('precio_membresia', 'precio', 'Membresías mensuales',
 'Dos opciones de membresía mensual, ambas se compran y se pagan EN LÍNEA en https://bejauha.com/planes (no se pagan con el equipo):
  - Membresía Virtual: $79.900/mes. Clases virtuales en vivo ilimitadas + grabaciones.
  - Membresía Bejauha: $160.000/mes. Incluye lo de la virtual + presenciales + cursos + acceso anticipado a eventos + descuentos.'),
('precio_paquetes', 'precio', 'Paquetes de clases presenciales',
 'Paquetes presenciales para asistir a los Domingos de Bienestar en el Parque El Country. NO se compran por la web: se coordinan directamente con el equipo de Bejauha por WhatsApp.
  - Paquete 4 clases: $92.000 (vence en 2 meses).
  - Paquete 8 clases: $170.000 (vence en 3 meses, con opción de pausa).'),
('precio_suelta', 'precio', 'Clase suelta',
 'Clase suelta presencial: $40.000 COP — se coordina con el equipo. Clase suelta virtual: $35.000 COP — se compra por la web.')
ON CONFLICT (clave) DO UPDATE
  SET categoria=EXCLUDED.categoria, titulo=EXCLUDED.titulo, contenido=EXCLUDED.contenido,
      activo=TRUE, updated_at=now();

-- ---------------------------------------------------------------------
-- 3) Horario virtual — reformatear para que sea más legible
-- ---------------------------------------------------------------------
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES
('horario_virtual', 'horario', 'Horario de clases virtuales en vivo',
 'Las clases virtuales en vivo son de lunes a viernes:
  - Lunes 8:30pm — Yoga (Amy)
  - Martes 5:30am — Yoga (Amy)
  - Martes 8:00pm — Meditación (María Elvira)
  - Miércoles 8:30pm — Yoga (Amy)
  - Jueves 8:30pm — Yoga (María Elvira)
  - Viernes 5:30am — Yoga (Amy)
Todas quedan grabadas para verlas después.')
ON CONFLICT (clave) DO UPDATE
  SET categoria=EXCLUDED.categoria, titulo=EXCLUDED.titulo, contenido=EXCLUDED.contenido,
      activo=TRUE, updated_at=now();

-- ---------------------------------------------------------------------
-- 4) Nuevas FAQ explícitas sobre compra y renovación
-- ---------------------------------------------------------------------
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES
('faq_comprar_paquete', 'faq', '¿Cómo compro un paquete presencial?',
 'El paquete presencial no se compra por la web. Te conectamos con alguien del equipo para coordinar fecha, hora y método de pago. Te escriben por WhatsApp en unos minutos.'),
('faq_suscribir_membresia', 'faq', '¿Cómo me suscribo a la membresía?',
 'La membresía se compra en línea, en https://bejauha.com/planes. Ahí ves los dos planes (Virtual $79.900 o Bejauha $160.000) y la pagas con tarjeta. Empieza el mismo día.'),
('faq_renovar', 'faq', '¿Cómo renuevo mi paquete cuando se acaba?',
 'Te avisamos automáticamente cuando estés por agotar las clases o cuando el paquete esté por vencer. Si quieres renovar, te conectamos con el equipo para coordinar.'),
('faq_diferencia_paquete_membresia', 'faq', '¿Cuál es la diferencia entre paquete y membresía?',
 'El paquete es para clases presenciales sueltas (4 u 8 clases con vencimiento). La membresía es mensual y da acceso ilimitado a las clases virtuales en vivo (y a presenciales si es la Membresía Bejauha completa).'),
('faq_quien_atiende', 'faq', '¿Quién contesta los mensajes?',
 'Aquí en WhatsApp te atiende el equipo de Bejauha (Camila, Amanda, Estefanía). Cuando hay temas que necesitan agendar o cobrar, te conectamos directamente con la persona que te puede ayudar.')
ON CONFLICT (clave) DO UPDATE
  SET categoria=EXCLUDED.categoria, titulo=EXCLUDED.titulo, contenido=EXCLUDED.contenido,
      activo=TRUE, updated_at=now();

\echo '--- KB actualizada ---'
SELECT clave, categoria, titulo FROM bejauha.knowledge_base ORDER BY categoria, clave;
\echo '--- Total activas: ---'
SELECT count(*) AS total_activas FROM bejauha.knowledge_base WHERE activo = TRUE;

-- =====================================================================
-- FIN 009_kb_update.sql
-- =====================================================================
