#!/bin/bash
# =====================================================================
# Savia — Despliegue del schema PostgreSQL en VPS Hostinger
# =====================================================================
# Uso:
#   1) Sube esta carpeta al VPS:
#        scp -r ./database TU_USUARIO@srv1398596.hstgr.cloud:/tmp/savia_db/
#   2) SSH al VPS y ejecuta:
#        ssh TU_USUARIO@srv1398596.hstgr.cloud
#        cd /tmp/savia_db
#        bash deploy.sh
#
# Variables opcionales (defaults son los estándar del proyecto):
#   PG_USER       (default: leadai_user)
#   PG_DB         (default: leadai)
#   PG_CONTAINER  (default: auto-detecta el container postgres corriendo)
# =====================================================================

set -euo pipefail

cd "$(dirname "$0")"

PG_USER="${PG_USER:-leadai_user}"
PG_DB="${PG_DB:-leadai}"

# Auto-detectar container de Postgres si no se forzó
if [ -z "${PG_CONTAINER:-}" ]; then
  PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -iE 'postgres|^pg-' | head -1 || true)
fi

if [ -z "${PG_CONTAINER:-}" ]; then
  echo "❌ No se encontró ningún container de Postgres corriendo."
  echo "   Containers activos:"
  docker ps --format 'table {{.Names}}\t{{.Image}}'
  echo
  echo "   Volvé a ejecutar con: PG_CONTAINER=nombre-correcto bash deploy.sh"
  exit 1
fi

echo "──────────────────────────────────────────────────────"
echo "  Savia · Despliegue de schema PostgreSQL"
echo "──────────────────────────────────────────────────────"
echo "  Container Postgres : $PG_CONTAINER"
echo "  Usuario            : $PG_USER"
echo "  DB                 : $PG_DB"
echo "──────────────────────────────────────────────────────"

if [ ! -f 001_schema.sql ] || [ ! -f 002_seed_kb.sql ]; then
  echo "❌ No se encontraron 001_schema.sql o 002_seed_kb.sql en este directorio."
  echo "   Estás en: $(pwd)"
  ls -la
  exit 1
fi

echo
echo "→ [1/3] Ejecutando 001_schema.sql (schema + 7 tablas + índices)..."
docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" < 001_schema.sql
echo "✓ Schema creado"

echo
echo "→ [2/3] Cargando 002_seed_kb.sql (KB inicial)..."
docker exec -i "$PG_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" < 002_seed_kb.sql
echo "✓ KB inicial cargado"

echo
echo "→ [3/3] Verificación..."
echo
echo "  Tablas creadas:"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "\dt savia.*"

echo "  Tópicos en kb_documentos:"
docker exec -i "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" \
  -c "SELECT topico, count(*) FROM savia.kb_documentos GROUP BY 1 ORDER BY topico;"

echo
echo "✅ Despliegue completado."
echo "   Próximo paso: configurar credenciales y env vars en n8n."
