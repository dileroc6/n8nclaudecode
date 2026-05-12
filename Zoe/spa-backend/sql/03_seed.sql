-- ============================================================================
-- Zoe Tantric SPA — Datos semilla
-- Catálogo extraído del PDF "PAREJAS EN ZOE" + FAQ.
-- Reemplaza nombres reales de terapeutas antes de producción.
-- ============================================================================

SET search_path TO zoe, public;

-- ----------------------------------------------------------------------------
-- Sedes
-- ----------------------------------------------------------------------------
INSERT INTO zoe.sedes (nombre, ciudad, direccion) VALUES
    ('Zoe Bogotá',  'Bogotá', 'Dirección Bogotá pendiente'),
    ('Zoe Cajicá',  'Cajicá', 'Sabana de Bogotá — dirección pendiente')
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Servicios — catálogo del PDF
-- ----------------------------------------------------------------------------
INSERT INTO zoe.servicios
    (nombre, descripcion, modalidad, duracion_minutos, precio_cop, requiere_dos_terapeutas, nivel_sugerido)
VALUES
    -- Reflejo
    ('Reflejo individual',
     'Masaje tántrico relajante con movimientos sensoriales. Terapeuta en lencería. Estimulación manual al final.',
     'individual', 60, 250000, FALSE, 'principiante'),

    ('Reflejo pareja',
     'Masaje tántrico para pareja. 1 o 2 terapeutas en lencería (mismo precio). Conexión sensorial + estimulación manual al final. Opción de 15 min a solas con la pareja al final.',
     'pareja', 60, 590000, TRUE, 'principiante'),

    -- Memorable
    ('Memorable individual',
     'Masaje tántrico de mayor erotismo. Terapeuta desnuda. Estimulación manual al final.',
     'individual', 60, 320000, FALSE, 'experto'),

    ('Memorable pareja',
     'Masaje tántrico para pareja con mayor nivel de erotismo. 1 o 2 terapeutas desnudas (mismo precio). Estimulación manual al final. Opción de 15 min a solas con la pareja al final.',
     'pareja', 60, 660000, TRUE, 'experto'),

    -- Espectador (variantes)
    ('Espectador Reflejo',
     'Tu pareja recibe la terapia Reflejo y tú observas desde la silla con una copa. No se permite tocar ni participar. Costo total: $410.000 (Reflejo $250k + Espectador $160k).',
     'espectador', 60, 410000, FALSE, 'incognito'),

    ('Espectador Memorable',
     'Tu pareja recibe la terapia Memorable y tú observas. No se permite tocar ni participar. Costo total: $480.000 (Memorable $320k + Espectador $160k).',
     'espectador', 60, 480000, FALSE, 'incognito')
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Add-ons
-- ----------------------------------------------------------------------------
INSERT INTO zoe.addons (nombre, descripcion, precio_cop) VALUES
    ('Decoración romántica + Jacuzzi',
     'Habitación con decoración romántica (velas, pétalos) + acceso a jacuzzi.',
     100000)
ON CONFLICT (nombre) DO NOTHING;

-- ----------------------------------------------------------------------------
-- Terapeutas (placeholders — ajustar nombres y horarios reales)
-- Distribución sugerida según FAQ: terapeutas mujeres + 1 hombre para servicios mixtos.
-- ----------------------------------------------------------------------------
INSERT INTO zoe.terapeutas (nombre, genero, sede_id, especialidad, horario_base) VALUES
    ('Terapeuta 1 (F)', 'F',
     (SELECT id FROM zoe.sedes WHERE nombre = 'Zoe Bogotá'),
     'Reflejo / Memorable',
     '{"lunes":[{"inicio":"10:00","fin":"21:00"}],"martes":[{"inicio":"10:00","fin":"21:00"}],"miercoles":[{"inicio":"10:00","fin":"21:00"}],"jueves":[{"inicio":"10:00","fin":"21:00"}],"viernes":[{"inicio":"10:00","fin":"22:00"}],"sabado":[{"inicio":"10:00","fin":"22:00"}],"domingo":[{"inicio":"12:00","fin":"20:00"}]}'::jsonb),

    ('Terapeuta 2 (F)', 'F',
     (SELECT id FROM zoe.sedes WHERE nombre = 'Zoe Bogotá'),
     'Reflejo / Memorable',
     '{"lunes":[{"inicio":"12:00","fin":"22:00"}],"martes":[{"inicio":"12:00","fin":"22:00"}],"miercoles":[{"inicio":"12:00","fin":"22:00"}],"jueves":[{"inicio":"12:00","fin":"22:00"}],"viernes":[{"inicio":"12:00","fin":"23:00"}],"sabado":[{"inicio":"12:00","fin":"23:00"}],"domingo":[]}'::jsonb),

    ('Terapeuta 3 (F)', 'F',
     (SELECT id FROM zoe.sedes WHERE nombre = 'Zoe Bogotá'),
     'Reflejo / Memorable',
     '{"lunes":[{"inicio":"10:00","fin":"19:00"}],"martes":[{"inicio":"10:00","fin":"19:00"}],"miercoles":[],"jueves":[{"inicio":"10:00","fin":"19:00"}],"viernes":[{"inicio":"10:00","fin":"20:00"}],"sabado":[{"inicio":"10:00","fin":"20:00"}],"domingo":[{"inicio":"12:00","fin":"18:00"}]}'::jsonb),

    ('Terapeuta 4 (M)', 'M',
     (SELECT id FROM zoe.sedes WHERE nombre = 'Zoe Bogotá'),
     'Terapia para mujer y pareja',
     '{"lunes":[{"inicio":"14:00","fin":"22:00"}],"martes":[{"inicio":"14:00","fin":"22:00"}],"miercoles":[{"inicio":"14:00","fin":"22:00"}],"jueves":[{"inicio":"14:00","fin":"22:00"}],"viernes":[{"inicio":"14:00","fin":"23:00"}],"sabado":[{"inicio":"12:00","fin":"22:00"}],"domingo":[]}'::jsonb),

    ('Terapeuta 5 (F)', 'F',
     (SELECT id FROM zoe.sedes WHERE nombre = 'Zoe Cajicá'),
     'Reflejo / Memorable',
     '{"lunes":[{"inicio":"11:00","fin":"20:00"}],"martes":[{"inicio":"11:00","fin":"20:00"}],"miercoles":[{"inicio":"11:00","fin":"20:00"}],"jueves":[{"inicio":"11:00","fin":"20:00"}],"viernes":[{"inicio":"11:00","fin":"21:00"}],"sabado":[{"inicio":"11:00","fin":"21:00"}],"domingo":[{"inicio":"12:00","fin":"18:00"}]}'::jsonb)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- Habilitar todos los servicios para todos los terapeutas (matriz inicial).
-- Refina luego: por ejemplo, el terapeuta hombre solo para servicios donde aplica.
-- ----------------------------------------------------------------------------
INSERT INTO zoe.terapeuta_servicios (terapeuta_id, servicio_id)
SELECT t.id, s.id
FROM zoe.terapeutas t CROSS JOIN zoe.servicios s
ON CONFLICT DO NOTHING;
