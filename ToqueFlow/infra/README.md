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

### Instalación en el VPS

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

**Sin webhook configurado el script igual funciona**: mide y deja todo en `/var/log/toque-alerta.log`.

---

## El canal de aviso: correo desde hola@toqueflow.com

El flujo que recibe la alerta y manda el correo ya está en n8n: **`Toque - Alerta de Recursos del VPS`** (id `tDd8dhEhbg36jkJV`), validado sin errores y **desactivado** hasta completar la configuración.

Hace: recibe el webhook → arma el correo → lo envía por SMTP → responde `ok`.

### El dominio ya está listo para enviar

Verificado el 27-ago. Hostinger lo configuró automáticamente al crear la casilla:

| Registro | Estado |
|---|---|
| MX | `mx1.hostinger.com` (5) y `mx2.hostinger.com` (10) |
| SPF | `v=spf1 include:_spf.mail.hostinger.com ~all` |
| DKIM | 3 registros firmando |
| DMARC | `v=DMARC1; p=none` |

Eso es lo que decide si un correo llega a la bandeja o al spam. **No hace falta Gmail ni contraseñas de aplicación.**

### Pasos

**1. Credencial SMTP en n8n** — Credentials → New → SMTP:

| Campo | Valor |
|---|---|
| Host | `smtp.hostinger.com` |
| Port | `465` |
| SSL/TLS | activado |
| User | `hola@toqueflow.com` |
| Password | la contraseña de la casilla |

Es la misma contraseña con la que se entra al correo. Sin verificación en dos pasos de por medio.

**2. En el nodo «Envía el correo»**
Seleccionar la credencial. Remitente `hola@toqueflow.com`; destinatario el correo **personal** de cada socio, separados por coma.

Las alertas van al correo personal a propósito: así no ensucian el buzón comercial, que es el que se va a estar revisando por las propuestas.

**3. Activar el flujo** y copiar la URL de producción del webhook.

**4. Pegar esa URL** en `WEBHOOK_URL` dentro de `alerta-recursos.sh`, subir el script al VPS y programar el cron.

### Probar sin esperar a que falle algo

```bash
# editar MIN_RAM_MB=600  →  MIN_RAM_MB=99999
/opt/toque/alerta-recursos.sh
# debe llegar el correo de alerta

# devolver el umbral a 600 y correrlo otra vez
/opt/toque/alerta-recursos.sh
# debe llegar el correo de "recuperado"
```

Si llegan los dos, el anti-spam funciona y queda listo.

### Qué recibe el webhook

```json
{
  "nivel": "alerta",
  "texto": "VPS ToqueFlow: RAM disponible en 480 MB (umbral 600). Mayor consumo: n8n-n8n-1 731MiB",
  "ram_disponible_mb": 480,
  "swap_pct": 12,
  "disco_pct": 23,
  "top_contenedor": "n8n-n8n-1 731MiB"
}
```

### Línea base al instalarlo (27-ago-2026)

RAM disponible 2,3 GB · swap 0% · disco 23%. Muy lejos de los umbrales, que es como debe estar.

---

## Datos del correo, para configurar clientes de correo

| | |
|---|---|
| Casilla | `hola@toqueflow.com` |
| SMTP (salida) | `smtp.hostinger.com` · 465 SSL |
| IMAP (entrada) | `imap.hostinger.com` · 993 SSL |
| **Límite de envío** | **100 correos por día** |
| Alias por casilla | 5, más catch-all |

⚠️ **El límite de 100 diarios importa para la máquina de leads.** La fase manual contempla 25 correos al día, así que sobra. Pero cuando arranque el outbound automatizado ese es el techo de este plan: habría que subir de plan, o —lo recomendado en la estrategia— usar un dominio y proveedor aparte para el envío en frío, para no arriesgar la reputación del dominio principal.
