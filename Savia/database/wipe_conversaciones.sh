#!/usr/bin/env bash
#
# wipe_conversaciones.sh — Borra TODO el historial conversacional del schema savia.
#
# Borra: mensajes_logs, contactos_dia, pedidos, eventos_pago, metricas_dia, clientes.
# NO toca: kb_documentos, fichas_producto (catálogo/KB — datos de configuración).
#
# Uso en el VPS:
#   bash wipe_conversaciones.sh
#
# ⚠️  IRREVERSIBLE. Borra todas las conversaciones, pedidos y clientes de Savia.
#     No afecta el catálogo WC ni el KB.

set -euo pipefail

PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -iE 'postgres|^pg-' | head -1)

if [ -z "$PG_CONTAINER" ]; then
  echo "❌ No se encontró el contenedor de Postgres."
  exit 1
fi

echo "Container PG: $PG_CONTAINER"
echo ""
echo "⚠️  Vas a BORRAR todo el historial conversacional del schema savia:"
echo "    - mensajes_logs"
echo "    - contactos_dia"
echo "    - pedidos"
echo "    - eventos_pago"
echo "    - metricas_dia"
echo "    - clientes"
echo ""
echo "    NO se tocan: kb_documentos, fichas_producto"
echo ""
read -rp "¿Continuar? (escribe 'BORRAR' para confirmar): " CONFIRM

if [ "$CONFIRM" != "BORRAR" ]; then
  echo "Cancelado."
  exit 0
fi

docker exec -i "$PG_CONTAINER" psql -U leadai_user -d leadai <<'SQL'
SET search_path = savia, public;

-- Orden respeta FKs: primero las que referencian clientes
TRUNCATE TABLE savia.mensajes_logs   RESTART IDENTITY CASCADE;
TRUNCATE TABLE savia.contactos_dia   RESTART IDENTITY CASCADE;
TRUNCATE TABLE savia.pedidos         RESTART IDENTITY CASCADE;
TRUNCATE TABLE savia.eventos_pago    RESTART IDENTITY CASCADE;
TRUNCATE TABLE savia.metricas_dia    RESTART IDENTITY CASCADE;
TRUNCATE TABLE savia.clientes        RESTART IDENTITY CASCADE;

-- Verificación
SELECT 'mensajes_logs' AS tabla, COUNT(*) AS filas FROM savia.mensajes_logs
UNION ALL SELECT 'contactos_dia', COUNT(*) FROM savia.contactos_dia
UNION ALL SELECT 'pedidos',       COUNT(*) FROM savia.pedidos
UNION ALL SELECT 'eventos_pago',  COUNT(*) FROM savia.eventos_pago
UNION ALL SELECT 'metricas_dia',  COUNT(*) FROM savia.metricas_dia
UNION ALL SELECT 'clientes',      COUNT(*) FROM savia.clientes;
SQL

echo ""
echo "✅ Historial borrado. Todas las tablas conversacionales en 0 filas."
echo "   (kb_documentos y fichas_producto intactas)"
