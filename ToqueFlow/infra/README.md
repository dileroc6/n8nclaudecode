# Infraestructura

Scripts que corren **en el VPS**, no en el repo.

---

## `alerta-recursos.sh`

Vigila memoria, swap y disco, y avisa **antes** de que el OOM killer tumbe un contenedor.

### Por qué corre en el host y no en n8n

El escenario que queremos evitar es que el servidor se quede sin memoria y n8n se caiga. Una alerta que viviera dentro de n8n se caería con él justo cuando más falta hace. Un cron del sistema no depende de nada más.

### Qué vigila

| Señal | Umbral | Por qué |
|---|---|---|
| RAM disponible | < 600 MB | Antes había 777 MB y era el límite real |
| Swap usado | > 25% | Si empieza a usar swap, la RAM ya no alcanza |
| Disco | > 85% | Un disco lleno rompe Postgres y Docker |

Además reporta **cuál contenedor está consumiendo más**, para saber a quién mirar sin entrar al servidor.

### Anti-spam

Avisa **al cruzar** el umbral, no cada 15 minutos mientras siga cruzado. Y avisa otra vez cuando se recupera, para saber que ya pasó. Sin eso, la alerta se vuelve ruido y se ignora — que es como mueren todas las alertas.

### Instalación

```bash
mkdir -p /opt/toque
# subir alerta-recursos.sh a /opt/toque/
chmod +x /opt/toque/alerta-recursos.sh

# probar a mano primero
/opt/toque/alerta-recursos.sh && cat /var/log/toque-alerta.log

# programarlo cada 15 minutos
crontab -e
# agregar:  */15 * * * * /opt/toque/alerta-recursos.sh
```

### A dónde avisa

Editar `WEBHOOK_URL` dentro del script, o exportar `TOQUE_ALERTA_WEBHOOK`.

**Sin webhook configurado el script igual funciona**: mide y deja todo en `/var/log/toque-alerta.log`. Se puede instalar hoy y decidir el canal después.

El webhook recibe un JSON así:

```json
{
  "nivel": "alerta",
  "texto": "⚠️ VPS ToqueFlow: RAM disponible en 480 MB (umbral 600). Mayor consumo: n8n-n8n-1 731MiB",
  "ram_disponible_mb": 480,
  "swap_pct": 12,
  "disco_pct": 23,
  "top_contenedor": "n8n-n8n-1 731MiB"
}
```

### Línea base al instalarlo (27-ago-2026)

RAM disponible 2,3 GB · swap 0% · disco 23%. Muy lejos de los umbrales, que es como debe estar.
