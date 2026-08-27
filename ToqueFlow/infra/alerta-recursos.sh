#!/usr/bin/env bash
#
# alerta-recursos.sh — Vigila la memoria, el swap y el disco del VPS y avisa
# ANTES de que el OOM killer tumbe un contenedor.
#
# Corre como cron del sistema, no dentro de n8n: si n8n se cae por falta de
# memoria, que es justo el escenario que queremos evitar, una alerta que
# viviera ahí adentro se caería con él.
#
# Instalación (como root en el VPS):
#   mkdir -p /opt/toque
#   # subir este archivo a /opt/toque/alerta-recursos.sh
#   chmod +x /opt/toque/alerta-recursos.sh
#   # editar WEBHOOK_URL abajo
#   crontab -e   →   */15 * * * * /opt/toque/alerta-recursos.sh
#
set -uo pipefail

# ── Configuración ────────────────────────────────────────────────────────────
# A dónde avisar. Un webhook de n8n que enrute a WhatsApp, Telegram o correo.
WEBHOOK_URL="${TOQUE_ALERTA_WEBHOOK:-}"

# Umbrales. Se avisa cuando se cruzan.
MIN_RAM_MB=600          # memoria disponible mínima antes de avisar
MAX_SWAP_PCT=25         # si el swap usado pasa esto, la RAM ya no alcanza
MAX_DISCO_PCT=85        # disco lleno rompe Postgres y Docker

ESTADO="/var/tmp/toque-alerta.estado"
LOG="/var/log/toque-alerta.log"

# ── Medición ─────────────────────────────────────────────────────────────────
ram_disp_mb=$(free -m | awk '/^Mem:/ {print $7}')
swap_total_mb=$(free -m | awk '/^Swap:/ {print $2}')
swap_usado_mb=$(free -m | awk '/^Swap:/ {print $3}')
disco_pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')

if [ "${swap_total_mb:-0}" -gt 0 ]; then
  swap_pct=$(( swap_usado_mb * 100 / swap_total_mb ))
else
  swap_pct=0
fi

# Contenedor que más memoria usa, para que la alerta diga a quién mirar
top_contenedor=$(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' 2>/dev/null \
  | sort -k2 -h -r | head -1)

# ── Evaluación ───────────────────────────────────────────────────────────────
motivos=()
[ "${ram_disp_mb:-9999}" -lt "$MIN_RAM_MB" ] && motivos+=("RAM disponible en ${ram_disp_mb} MB (umbral ${MIN_RAM_MB})")
[ "$swap_pct" -gt "$MAX_SWAP_PCT" ]          && motivos+=("swap al ${swap_pct}% (umbral ${MAX_SWAP_PCT}%)")
[ "${disco_pct:-0}" -gt "$MAX_DISCO_PCT" ]   && motivos+=("disco al ${disco_pct}% (umbral ${MAX_DISCO_PCT}%)")

ts=$(date '+%Y-%m-%d %H:%M:%S')
echo "$ts ram=${ram_disp_mb}MB swap=${swap_pct}% disco=${disco_pct}% alertas=${#motivos[@]}" >> "$LOG"

# ── Anti-spam ────────────────────────────────────────────────────────────────
# Solo avisa al CRUZAR el umbral, no cada 15 minutos mientras siga cruzado.
# Y avisa de nuevo cuando se recupera, para saber que ya pasó.
estado_previo=$(cat "$ESTADO" 2>/dev/null || echo "ok")

if [ "${#motivos[@]}" -gt 0 ]; then
  estado_actual="alerta"
  nivel="alerta"
  texto="⚠️ VPS ToqueFlow: $(IFS='; '; echo "${motivos[*]}"). Mayor consumo: ${top_contenedor:-desconocido}"
else
  estado_actual="ok"
  nivel="recuperado"
  texto="✅ VPS ToqueFlow: recursos normales otra vez. RAM disponible ${ram_disp_mb} MB, swap ${swap_pct}%, disco ${disco_pct}%"
fi

[ "$estado_actual" = "$estado_previo" ] && exit 0   # sin cambio, no molestar
echo "$estado_actual" > "$ESTADO"
[ "$estado_actual" = "ok" ] && [ "$estado_previo" = "ok" ] && exit 0

# ── Aviso ────────────────────────────────────────────────────────────────────
echo "$ts AVISO ($nivel): $texto" >> "$LOG"

if [ -n "$WEBHOOK_URL" ]; then
  curl -s -m 15 -X POST "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "$(printf '{"nivel":"%s","texto":"%s","ram_disponible_mb":%s,"swap_pct":%s,"disco_pct":%s,"top_contenedor":"%s"}' \
          "$nivel" "$texto" "${ram_disp_mb:-0}" "$swap_pct" "${disco_pct:-0}" "${top_contenedor:-}")" \
    >> "$LOG" 2>&1
else
  echo "$ts (sin WEBHOOK_URL configurado: el aviso solo quedó en este log)" >> "$LOG"
fi
