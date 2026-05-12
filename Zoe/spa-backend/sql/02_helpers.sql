-- ============================================================================
-- Zoe Tantric SPA — Funciones helper y triggers
-- ============================================================================

SET search_path TO zoe, public;

-- ----------------------------------------------------------------------------
-- Trigger genérico de updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_terapeutas_updated ON zoe.terapeutas;
CREATE TRIGGER trg_terapeutas_updated BEFORE UPDATE ON zoe.terapeutas
    FOR EACH ROW EXECUTE FUNCTION zoe.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_clientes_updated ON zoe.clientes;
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON zoe.clientes
    FOR EACH ROW EXECUTE FUNCTION zoe.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_citas_updated ON zoe.citas;
CREATE TRIGGER trg_citas_updated BEFORE UPDATE ON zoe.citas
    FOR EACH ROW EXECUTE FUNCTION zoe.fn_set_updated_at();

-- ----------------------------------------------------------------------------
-- Trigger: al pasar una cita a 'ejecutada', resetear contador de reprogramaciones
-- y setear ejecutada_at. El vitalicio NO se toca.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_on_cita_ejecutada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.estado = 'ejecutada' AND (OLD.estado IS DISTINCT FROM 'ejecutada') THEN
        IF NEW.ejecutada_at IS NULL THEN
            NEW.ejecutada_at = NOW();
        END IF;
        UPDATE zoe.clientes
           SET contador_reprogramaciones = 0
         WHERE id = NEW.cliente_id;
    END IF;

    IF NEW.estado = 'no_show' AND (OLD.estado IS DISTINCT FROM 'no_show') THEN
        UPDATE zoe.clientes
           SET contador_no_shows = contador_no_shows + 1
         WHERE id = NEW.cliente_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cita_estado_changed ON zoe.citas;
CREATE TRIGGER trg_cita_estado_changed BEFORE UPDATE OF estado ON zoe.citas
    FOR EACH ROW EXECUTE FUNCTION zoe.fn_on_cita_ejecutada();

-- ----------------------------------------------------------------------------
-- fn_slot_disponible
-- Verificación atómica server-side. Considera ambos terapeutas (principal y secundario)
-- y bloqueos a nivel sede/terapeuta/global.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_slot_disponible(
    p_terapeuta_id              UUID,
    p_terapeuta_secundario_id   UUID,
    p_sede_id                   UUID,
    p_slot_inicio               TIMESTAMPTZ,
    p_slot_fin                  TIMESTAMPTZ
)
RETURNS TABLE (disponible BOOLEAN, motivo TEXT)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_solape_cita    INTEGER;
    v_solape_bloqueo INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_solape_cita
    FROM zoe.citas
    WHERE estado IN ('reservada', 'en_curso')
      AND (
            terapeuta_id = p_terapeuta_id
         OR (p_terapeuta_secundario_id IS NOT NULL AND terapeuta_id = p_terapeuta_secundario_id)
         OR terapeuta_secundario_id = p_terapeuta_id
         OR (p_terapeuta_secundario_id IS NOT NULL AND terapeuta_secundario_id = p_terapeuta_secundario_id)
      )
      AND tstzrange(slot_inicio, slot_fin, '[)') &&
          tstzrange(p_slot_inicio, p_slot_fin, '[)');

    IF v_solape_cita > 0 THEN
        RETURN QUERY SELECT FALSE, 'solape_con_cita';
        RETURN;
    END IF;

    SELECT COUNT(*) INTO v_solape_bloqueo
    FROM zoe.disponibilidad_bloqueos
    WHERE (terapeuta_id = p_terapeuta_id
           OR (p_terapeuta_secundario_id IS NOT NULL AND terapeuta_id = p_terapeuta_secundario_id)
           OR terapeuta_id IS NULL)
      AND (sede_id = p_sede_id OR sede_id IS NULL)
      AND tstzrange(inicio, fin, '[)') &&
          tstzrange(p_slot_inicio, p_slot_fin, '[)');

    IF v_solape_bloqueo > 0 THEN
        RETURN QUERY SELECT FALSE, 'bloqueo_admin';
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'ok';
END;
$$;

-- ----------------------------------------------------------------------------
-- fn_incrementar_reprogramacion
-- Atómica: incrementa contador activo + vitalicio.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_incrementar_reprogramacion(
    p_cliente_id UUID
)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_nuevo INTEGER;
BEGIN
    UPDATE zoe.clientes
       SET contador_reprogramaciones = contador_reprogramaciones + 1,
           contador_reprog_vitalicio = contador_reprog_vitalicio + 1
     WHERE id = p_cliente_id
    RETURNING contador_reprogramaciones INTO v_nuevo;

    RETURN COALESCE(v_nuevo, -1);
END;
$$;

-- ----------------------------------------------------------------------------
-- fn_citas_pendientes_otp
-- Devuelve citas que necesitan OTP generado AHORA (slot_inicio + 30min ya alcanzado,
-- estado todavía 'reservada', sin otp_code). Usada por el cron WF5.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_citas_pendientes_otp()
RETURNS TABLE (
    id              UUID,
    cliente_id      UUID,
    cliente_whatsapp TEXT,
    pareja_whatsapp TEXT,
    slot_inicio     TIMESTAMPTZ,
    servicio_nombre TEXT,
    sede_nombre     TEXT
)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.cliente_id,
        cl.whatsapp_id,
        c.pareja_acompanante_whatsapp_id,
        c.slot_inicio,
        s.nombre,
        sd.nombre
    FROM zoe.citas c
    JOIN zoe.clientes cl  ON cl.id = c.cliente_id
    JOIN zoe.servicios s  ON s.id  = c.servicio_id
    JOIN zoe.sedes sd     ON sd.id = c.sede_id
    WHERE c.estado = 'reservada'
      AND c.otp_code IS NULL
      AND NOW() >= c.slot_inicio + INTERVAL '30 minutes'
      AND NOW() <  c.slot_inicio + INTERVAL '90 minutes';  -- no generar para citas muy viejas
END;
$$;

-- ----------------------------------------------------------------------------
-- fn_marcar_otp_expirados
-- Pasa a 'no_show' las citas cuyo OTP expiró sin haber sido validado.
-- Usada por cron WF5 (mismo cron, segundo paso).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_marcar_otp_expirados()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    v_filas INTEGER;
BEGIN
    UPDATE zoe.citas
       SET estado = 'no_show'
     WHERE estado = 'en_curso'
       AND otp_expira_at IS NOT NULL
       AND NOW() > otp_expira_at;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas;
END;
$$;

-- ----------------------------------------------------------------------------
-- fn_limpiar_admin_pending
-- Elimina acciones pendientes vencidas. Llamarla periódicamente o al inicio
-- de cada turno admin para mantener limpia la tabla.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zoe.fn_limpiar_admin_pending()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_n INT;
BEGIN
    DELETE FROM zoe.admin_pending_actions
    WHERE expires_at < NOW() AND consumed_at IS NULL;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    RETURN v_n;
END;
$$;

-- ----------------------------------------------------------------------------
-- Vista para Metabase: clientes problemáticos (alerta admin)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW zoe.v_clientes_alerta AS
SELECT
    c.id,
    c.whatsapp_id,
    c.nombre,
    c.contador_reprogramaciones,
    c.contador_reprog_vitalicio,
    c.contador_no_shows,
    c.bloqueado,
    (SELECT MAX(slot_inicio) FROM zoe.citas WHERE cliente_id = c.id) AS ultima_cita,
    (SELECT COUNT(*) FROM zoe.citas WHERE cliente_id = c.id AND estado = 'ejecutada') AS citas_ejecutadas
FROM zoe.clientes c
WHERE c.contador_reprogramaciones >= 2
   OR c.contador_no_shows >= 2
   OR c.bloqueado;

-- ----------------------------------------------------------------------------
-- Vista para Metabase: ocupación diaria por terapeuta
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW zoe.v_ocupacion_terapeuta_dia AS
SELECT
    DATE(c.slot_inicio AT TIME ZONE 'America/Bogota') AS dia,
    t.id AS terapeuta_id,
    t.nombre AS terapeuta_nombre,
    sd.nombre AS sede,
    COUNT(*) FILTER (WHERE c.estado IN ('reservada','en_curso','ejecutada')) AS citas_activas,
    COUNT(*) FILTER (WHERE c.estado = 'ejecutada') AS citas_ejecutadas,
    COUNT(*) FILTER (WHERE c.estado = 'no_show') AS no_shows,
    COUNT(*) FILTER (WHERE c.estado = 'cancelada') AS canceladas,
    SUM(EXTRACT(EPOCH FROM (c.slot_fin - c.slot_inicio)) / 60)
        FILTER (WHERE c.estado IN ('reservada','en_curso','ejecutada')) AS minutos_agendados
FROM zoe.citas c
JOIN zoe.terapeutas t ON t.id = c.terapeuta_id
JOIN zoe.sedes sd     ON sd.id = c.sede_id
GROUP BY 1, 2, 3, 4;
