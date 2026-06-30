-- =====================================================================
-- Bejauha — KB + plantillas: paquetes son legacy (decisión 2026-05-28)
-- El negocio dejó de vender paquetes nuevos. Los ~60 clientes actuales con
-- paquete vigente siguen activos. El producto nuevo es la membresía mensual.
-- Esta migración:
--   1) Actualiza la KB para reflejar el nuevo modelo.
--   2) Suaviza las plantillas de PROSPECCIÓN y CLASES que mencionaban paquete.
-- Versión: 010 · Fecha: 2026-05-28
-- =====================================================================

SET search_path TO bejauha, public;

-- ---------------------------------------------------------------------
-- 1) KB — marcar paquetes como legacy + redirigir nuevos a membresía
-- ---------------------------------------------------------------------
INSERT INTO bejauha.knowledge_base (clave, categoria, titulo, contenido) VALUES
('precio_paquetes', 'precio', 'Paquetes de clases presenciales (legacy)',
 'Servicio LEGACY/TRANSITORIO: actualmente no se venden paquetes nuevos. Los paquetes existentes (4 y 8 clases) siguen activos para clientes que ya los compraron, pero no se ofrecen a nuevos clientes. Para empezar con nosotros, recomendamos la membresía mensual en https://bejauha.com/planes.
  - Paquete 4 clases (legacy): $92.000 (vence en 2 meses).
  - Paquete 8 clases (legacy): $170.000 (vence en 3 meses, con pausa).'),
('faq_comprar_paquete', 'faq', '¿Puedo comprar un paquete de clases?',
 'Por ahora no estamos vendiendo paquetes nuevos. La forma de empezar con nosotros es la membresía mensual, que puedes ver y comprar en línea en https://bejauha.com/planes. Si quieres una clase suelta presencial para conocernos, también podemos coordinarte una.'),
('faq_renovar', 'faq', '¿Cómo renuevo mi paquete cuando se acaba?',
 'Cuando estés por agotar tus clases o tu paquete vaya a vencer, te avisamos automáticamente. Si quieres seguir con nosotros, te conectamos con el equipo para mirar juntos las opciones, incluyendo nuestra membresía mensual (que es lo que ofrecemos hoy para clientes nuevos).'),
('faq_diferencia_paquete_membresia', 'faq', '¿Cuál es la diferencia entre paquete y membresía?',
 'El paquete es un servicio que ya no se vende a clientes nuevos; solo aplica a quienes ya lo tenían. La membresía es el producto actual: mensual, con clases virtuales en vivo ilimitadas (plan Virtual $79.900) o virtuales + presenciales + cursos + descuentos (plan Bejauha $160.000). Se compra en https://bejauha.com/planes.')
ON CONFLICT (clave) DO UPDATE
  SET categoria=EXCLUDED.categoria, titulo=EXCLUDED.titulo, contenido=EXCLUDED.contenido,
      activo=TRUE, updated_at=now();

-- ---------------------------------------------------------------------
-- 2) Plantillas PROSPECCIÓN — quitar mención "paquetes y modalidades"
-- ---------------------------------------------------------------------
UPDATE bejauha.plantillas_seguimiento
SET texto = 'Hola {{nombre}} 😊 ¡Pasaba a saludarte! ¿Qué tal te pareció la clase? Me encantaría saber cómo te fue. Si te gustó y quieres seguir con nosotros, cuéntame — te puedo dar más info 🙌'
WHERE tipificacion = 'Cortesía Consumida' AND destino = 'prospeccion';

-- ---------------------------------------------------------------------
-- 3) Plantillas CLASES — suavizar P3 (deudor) y abrir P5 (ex-cliente) a membresía
-- ---------------------------------------------------------------------
UPDATE bejauha.plantillas_seguimiento
SET texto = 'Hola {{nombre}} 👋 Vi que ya tomaste una clase de tu próximo paquete — qué bueno que no paraste. Te paso con alguien del equipo para que hablemos cómo seguir.'
WHERE tipificacion IN ('Activo + Deudor', 'Deudor (cliente)') AND destino = 'clases';

UPDATE bejauha.plantillas_seguimiento
SET texto = 'Hola {{nombre}} 😊 ¿Cómo estás? Vi que hace un tiempo no has vuelto y no podía quedarme sin escribirte — nos has hecho falta. ¿Qué pasó? Si quieres retomar, cuéntame y miramos juntos las opciones que tenemos hoy (incluyendo nuestra membresía) 🙌'
WHERE tipificacion = 'No activo (ex-cliente)' AND destino = 'clases';

\echo '--- KB actualizada ---'
SELECT clave, categoria, titulo FROM bejauha.knowledge_base
WHERE clave IN ('precio_paquetes','faq_comprar_paquete','faq_renovar','faq_diferencia_paquete_membresia')
ORDER BY clave;
\echo '--- Plantillas actualizadas ---'
SELECT tipificacion, destino, left(texto, 80) AS preview
FROM bejauha.plantillas_seguimiento
WHERE tipificacion IN ('Cortesía Consumida','Activo + Deudor','Deudor (cliente)','No activo (ex-cliente)')
ORDER BY destino, tipificacion;

-- =====================================================================
-- FIN 010_kb_paquetes_legacy.sql
-- =====================================================================
