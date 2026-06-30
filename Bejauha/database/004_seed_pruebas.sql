-- =====================================================================
-- Bejauha — DATOS DE PRUEBA (borrables)
-- 11 contactos de prueba + saldos para probar el Agente 2 y WF04.
-- Versión: 004 · Fecha: 2026-05-25
-- =====================================================================
-- Para BORRAR todo lo de prueba después:
--   DELETE FROM bejauha.asistencias WHERE telefono LIKE '5739900000%' OR telefono='573012661158';
--   DELETE FROM bejauha.recargas    WHERE telefono LIKE '5739900000%' OR telefono='573012661158';
--   DELETE FROM bejauha.saldos_clases WHERE telefono LIKE '5739900000%' OR telefono='573012661158';
--   DELETE FROM bejauha.leads       WHERE telefono LIKE '5739900000%' OR telefono='573012661158';
--
-- Ejecutar como leadai_user:
--   docker exec -i evolution_postgres psql -U leadai_user -d leadai -f - < 004_seed_pruebas.sql
-- =====================================================================

SET search_path TO bejauha, public;

-- Contacto #1 usa el número real del usuario (admin de prueba) para que
-- las alertas al cliente lleguen a su WhatsApp durante las pruebas.
INSERT INTO bejauha.leads (telefono, nombre, origen) VALUES
('573012661158', 'Laura Gomez (test)',      'import'),
('573990000002', 'Andrea Mendez (test)',    'import'),
('573990000003', 'Camila Ruiz (test)',      'import'),
('573990000004', 'Daniela Torres (test)',   'import'),
('573990000005', 'Mariana Lopez (test)',    'import'),
('573990000006', 'Valentina Diaz (test)',   'import'),
('573990000007', 'Sara Jimenez (test)',     'import'),
('573990000008', 'Juliana Castro (test)',   'import'),
('573990000009', 'Paula Vargas (test)',     'import'),
('573990000010', 'Carolina Rojas (test)',   'import'),
('573990000011', 'Natalia Suarez (test)',   'import')
ON CONFLICT (telefono) DO NOTHING;

-- Saldos para escenarios de prueba (7 con saldo; 4 sin saldo para probar recarga)
INSERT INTO bejauha.saldos_clases (telefono, tipo, clases_restantes, vence_at) VALUES
('573012661158', 'presencial', 2, current_date + 80),  -- "Laura asistió" -> 1 (alerta) -> 0 (Mensaje 1) a TU número
('573990000002', 'presencial', 4, current_date + 14),  -- vence en 14 días -> dispara WF04
('573990000003', 'presencial', 1, current_date + 30),  -- ya en 1 clase
('573990000004', 'presencial', 2, current_date + 45),
('573990000005', 'presencial', 8, current_date + 14),  -- vence en 14 días -> dispara WF04
('573990000006', 'presencial', 5, current_date + 60),
('573990000007', 'presencial', 3, current_date + 50)
ON CONFLICT (telefono, tipo) DO UPDATE
  SET clases_restantes = EXCLUDED.clases_restantes,
      vence_at = EXCLUDED.vence_at;
-- 008..011 quedan SIN saldo: úsalos para probar "X pagó 4/8 clases" (recarga que crea saldo).

SELECT l.nombre, l.telefono, s.tipo, s.clases_restantes, s.vence_at
FROM bejauha.leads l
LEFT JOIN bejauha.saldos_clases s ON s.telefono = l.telefono
WHERE l.nombre LIKE '%(test)%'
ORDER BY l.nombre;
