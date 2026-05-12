# Guía de import — Zoe Tantric SPA en n8n

Pasos ordenados para llevar este diseño a tu instancia n8n
(`https://n8n.srv1398596.hstgr.cloud/`). El SQL crea un schema aislado dentro
del Postgres existente del VPS.

---

## 1. Aplicar el schema en Postgres

```bash
psql -h <host> -U <user> -d <db> -f sql/01_schema.sql
psql -h <host> -U <user> -d <db> -f sql/02_helpers.sql
psql -h <host> -U <user> -d <db> -f sql/03_seed.sql
```

Verificación rápida:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'zoe' ORDER BY 1;
SELECT nombre, modalidad, precio_cop FROM zoe.servicios ORDER BY precio_cop;
SELECT nombre, ciudad FROM zoe.sedes;
SELECT * FROM zoe.fn_slot_disponible(
    (SELECT id FROM zoe.terapeutas LIMIT 1),
    NULL,
    (SELECT id FROM zoe.sedes WHERE ciudad = 'Bogotá'),
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '1 day' + INTERVAL '1 hour'
);
```

---

## 2. Crear credenciales en n8n

| Credential        | Tipo               | Configuración                                                |
|-------------------|--------------------|--------------------------------------------------------------|
| `Zoe — Postgres`  | Postgres           | host/db/user del VPS, **Search Path: `zoe,public`**          |
| `Zoe — OpenAI`    | OpenAI API         | API key, default model: `gpt-4o-mini`                        |
| `Zoe — Evolution` | HTTP Header Auth   | Header name: `apikey`, value: API key de Evolution           |

`.env` del proyecto (no subir al repo):

```
N8N_API_URL=https://n8n.srv1398596.hstgr.cloud/
N8N_API_KEY=...
PG_HOST=...
PG_DB=...
PG_USER=...
PG_PASSWORD=...
EVOLUTION_BASE_URL=http://evolution:8080
EVOLUTION_INSTANCE=zoe
EVOLUTION_API_KEY=...
OPENAI_API_KEY=...
ADMIN_WHATSAPP_ID=57300XXXXXXX
```

---

## 3. Workflows n8n

5 workflows separados (más fácil de testear y mantener):

### `Zoe — WF1 Orquestador WhatsApp` (entry point)

```
[Webhook POST /zoe/wa]
   ↓
[Code: normalizar_payload]                    ← extrae from, body, message_id, type
   ↓
[Postgres: INSERT zoe.mensajes_recibidos]      ← idempotencia (PK = message_id)
   ↓
[IF rowsAffected = 0]                          ← duplicado, salir
   ↓ (no duplicado)
[Switch: from == ADMIN_PHONES]
   │
   ├─── (rama Admin — modo híbrido conversacional) ───
   │   [Postgres: fn_limpiar_admin_pending()]                   ← borra pendientes vencidas
   │   [Postgres: SELECT accion_pendiente activa de este admin] ← si existe
   │   [Postgres: SELECT sedes + terapeutas + servicios]
   │   [OpenAI Chat: system_prompt_admin.md, JSON mode]          ← credencial id h6Iv2GjVJYmMUGuc
   │   [Switch: modo]
   │   ├ lectura:
   │   │   [Postgres: ejecutar query según `query.tipo` y `query.params`]
   │   │   [Code: formatear respuesta_admin con datos reales]
   │   │   [HTTP Evolution: send text al admin]
   │   │
   │   ├ preview_confirmacion:
   │   │   [Postgres: INSERT zoe.admin_pending_actions (admin, accion, preview, expires_at = NOW()+5min)]
   │   │   [HTTP Evolution: send preview_text al admin]
   │   │
   │   ├ ejecutar:
   │   │   [Postgres: UPDATE admin_pending_actions SET consumed_at=NOW() WHERE id=...]
   │   │   [Switch: accion_a_ejecutar.tipo]
   │   │   ├ crear_bloqueo       → Postgres INSERT
   │   │   ├ eliminar_bloqueo    → Postgres DELETE
   │   │   ├ cancelar_cita       → Postgres UPDATE
   │   │   ├ ejecutar_cita_manual → Postgres UPDATE estado='ejecutada'
   │   │   ├ marcar_no_show      → Postgres UPDATE estado='no_show'
   │   │   ├ bloquear_cliente    → Postgres UPDATE
   │   │   ├ desbloquear_cliente → Postgres UPDATE
   │   │   └ reset_reprog_cliente → Postgres UPDATE
   │   │   [Code: armar mensaje final con resultado real (IDs creados, citas afectadas)]
   │   │   [HTTP Evolution: send confirmación al admin]
   │   │
   │   └ cancelar:
   │       [Postgres: DELETE FROM admin_pending_actions WHERE id=...]
   │       [HTTP Evolution: send respuesta_admin]
   │
   └─── (rama Cliente) ───
       [Postgres: SELECT cliente + cita_pendiente_otp + citas_activas]
       [Postgres: SELECT servicios + addons + sedes + terapeutas activos]
       [OpenAI Chat: system_prompt.md, JSON mode]
       [Code: parsear respuesta JSON]
       [Switch: intent]
       ├ agendar         → Execute Workflow: WF2 Agendar
       ├ confirmar_otp   → Execute Workflow: WF3 Confirmar
       ├ reprogramar     → Execute Workflow: WF3 (rama reprog)
       ├ cancelar        → Execute Workflow: WF3 (rama cancel)
       ├ saludo | listar_servicios | preguntar_faq | ruido → enviar respuesta_cliente directo
       └ escalar_admin   → notificar admin + responder al cliente
```

### `Zoe — WF2 Agendar`

```
[Trigger: Execute Workflow]
   ↓
[Postgres: SELECT servicio por nombre]                ← duracion_minutos, precio_cop, modalidad
   ↓
[Postgres: SELECT terapeutas habilitados según sede + género preferido]
   ↓
[Loop por terapeuta candidato]
   ├ [Postgres: SELECT citas activas en el rango de día]
   ├ [Postgres: SELECT bloqueos aplicables]
   └ [Code: 01_validar_disponibilidad.js]
   ↓
[IF al menos uno disponible]
   ├ (sí)
   │   [Postgres: SELECT/INSERT cliente por whatsapp_id]
   │   [Postgres: INSERT zoe.citas (estado='reservada', otp_code=NULL)]
   │   [IF errcode 23P01 → reintentar con siguiente terapeuta]
   │   [Postgres: INSERT zoe.cita_addons si hay add-ons]
   │   [Code: 04_evolution_payloads.js → tipo_mensaje='reserva_creada']
   │   [HTTP Request POST {evolution}/message/sendText/{instance}]
   │
   └ (no)
       [OpenAI: pedir alternativa con slots cercanos disponibles]
       [HTTP Request: enviar respuesta]
```

### `Zoe — WF3 Confirmar / Reprogramar / Cancelar`

```
[Trigger: Execute Workflow]
   ↓
[Switch: intent]

  ├ confirmar_otp:
  │   [Postgres: SELECT cita en estado='en_curso' del cliente, NOW() < otp_expira_at]
  │   [Code: comparar otp_recibido === otp_code]
  │   [IF match]
  │     [Postgres: UPDATE estado='ejecutada']           ← trigger resetea contador_reprogramaciones a 0
  │     [Code: 04_evolution_payloads → 'ejecutada']
  │   [ELSE]
  │     [HTTP Request: "código no coincide, revisa el último mensaje"]
  │
  ├ reprogramar:
  │   [Postgres: SELECT cita activa más reciente del cliente]
  │   [Code: 03_verificar_reprogramaciones.js]
  │   [IF permitido]
  │     [Trigger WF2 con nuevo slot]
  │     [Postgres: fn_incrementar_reprogramacion(cliente_id)]
  │     [Postgres: UPDATE cita vieja SET estado='reprogramada', cita nueva.cita_origen_id = vieja.id]
  │   [ELSE]
  │     [Code: 04_evolution_payloads → 'limite_reprogramaciones']
  │     [HTTP Request notificar admin]
  │
  └ cancelar:
      [Postgres: UPDATE estado='cancelada', cancelada_at=NOW()]
      [Code: 04_evolution_payloads → 'cancelacion']
      [HTTP Request]
```

### `Zoe — WF4 Recordatorio 24h` (cron diario 9 AM Bogotá)

```
[Schedule Trigger: 0 9 * * *  (TZ America/Bogota)]
   ↓
[Postgres: SELECT citas WHERE estado='reservada' AND DATE(slot_inicio) = CURRENT_DATE + 1]
   ↓
[Loop]
   ├ [Code: 04_evolution_payloads → 'recordatorio_24h']
   └ [HTTP Request POST {evolution}/message/sendText/{instance}]
```

### `Zoe — WF5 OTP cron` (cada 5 min)

Este workflow ejecuta dos pasos en cada tick:

```
[Schedule Trigger: */5 * * * *]
   ↓
─── Paso A: generar OTP para citas que cruzaron slot_inicio + 30 min ───
[Postgres: SELECT * FROM zoe.fn_citas_pendientes_otp()]
   ↓
[IF hay filas]
   ↓
[Code: 02_generar_otp.js]                              ← genera otp_code + otp_expira_at = NOW()+1h
   ↓
[Postgres: UPDATE zoe.citas SET otp_code, otp_generado_at, otp_expira_at, estado='en_curso']
   ↓
[Code: 04_evolution_payloads → 'checkin_otp']
   ↓
[HTTP Request: enviar al cliente — Y al pareja_acompanante si existe]

─── Paso B: marcar como no_show los OTP expirados ───
[Postgres: SELECT zoe.fn_marcar_otp_expirados()]
   ↓
[IF rows > 0]
   [Code: 04_evolution_payloads → 'otp_expirado']     ← opcional, avisar al cliente
   [HTTP Request]
```

---

## 4. Conectar el webhook de Evolution

```bash
curl -X POST http://localhost:8080/webhook/set/zoe \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://n8n.srv1398596.hstgr.cloud/webhook/zoe/wa",
    "events": ["MESSAGES_UPSERT"]
  }'
```

---

## 5. Dashboard admin — Metabase self-hosted

1. **Levantar Metabase en el VPS**:

```yaml
# docker-compose.yml (agregar al stack del VPS)
metabase:
  image: metabase/metabase:latest
  container_name: zoe-metabase
  environment:
    MB_DB_TYPE: postgres
    MB_DB_DBNAME: metabase_app
    MB_DB_PORT: 5432
    MB_DB_USER: metabase_user
    MB_DB_PASS: ${METABASE_DB_PASSWORD}
    MB_DB_HOST: postgres
  ports:
    - "3001:3000"
  restart: unless-stopped
```

(Necesitas crear la BD `metabase_app` y el usuario aparte — Metabase guarda su propia metadata.)

2. **Crear usuario de solo lectura** en Postgres para que Metabase no rompa nada:

```sql
CREATE USER zoe_readonly WITH PASSWORD '<password>';
GRANT USAGE ON SCHEMA zoe TO zoe_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA zoe TO zoe_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA zoe GRANT SELECT ON TABLES TO zoe_readonly;
```

3. **Conectar Metabase a tu schema**: en la UI, Add Database → PostgreSQL → host=`postgres`, db=tu DB principal, user=`zoe_readonly`, schema=`zoe`.

4. **Dashboards iniciales** (consultas listas para pegar en Metabase):

```sql
-- Ocupación de hoy por terapeuta
SELECT * FROM zoe.v_ocupacion_terapeuta_dia
WHERE dia = CURRENT_DATE
ORDER BY sede, terapeuta_nombre;

-- Clientes con alerta (reprogramaciones o no_shows)
SELECT * FROM zoe.v_clientes_alerta
ORDER BY contador_reprogramaciones DESC, contador_no_shows DESC;

-- Efectividad últimos 30 días
SELECT
  estado,
  COUNT(*) AS n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct
FROM zoe.citas
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY estado
ORDER BY n DESC;

-- Ingresos confirmados últimos 30 días (ejecutadas)
SELECT
  DATE(c.ejecutada_at AT TIME ZONE 'America/Bogota') AS dia,
  s.modalidad,
  COUNT(*) AS citas,
  SUM(s.precio_cop) AS ingresos_cop
FROM zoe.citas c
JOIN zoe.servicios s ON s.id = c.servicio_id
WHERE c.estado = 'ejecutada'
  AND c.ejecutada_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC;
```

5. **Alertas automáticas** (Metabase Pulses): enviar al admin por email/Telegram cuando:
   - `v_clientes_alerta` tiene filas nuevas con `contador_reprogramaciones >= 3`.
   - `no_shows` del día > 2.

---

## 6. Pruebas mínimas antes de producción

- [ ] "Hola" desde número personal → saludo + lista del catálogo del PDF.
- [ ] "Hay sexo?" → respuesta fija del FAQ, sin ceder.
- [ ] "Reflejo pareja mañana viernes 8 pm Bogotá con jacuzzi" → reserva creada con `addons`.
- [ ] Cron OTP simulado: ajustar `slot_inicio` de una cita a `NOW() - 30min`, esperar tick → debe llegar el `checkin_otp` por WhatsApp.
- [ ] Responder con OTP correcto → cita pasa a `ejecutada`, contador de reprogramaciones baja a 0 (verificar trigger).
- [ ] OTP incorrecto → no consume el código, vuelve a pedir.
- [ ] No responder OTP en 1h → `fn_marcar_otp_expirados` lo pasa a `no_show`, contador_no_shows sube.
- [ ] Reprogramar 4 veces el mismo cliente → la 4ª escala al admin.
- [ ] Bloqueo manual del admin (`INSERT zoe.disponibilidad_bloqueos`) → ese rango no se ofrece.
- [ ] Mismo `message_id` reentregado → ignorado.
- [ ] Reserva en Cajicá → terapeuta de la sede correcta.

---

## 7. Riesgos / pendientes

- **Race conditions** en INSERT de citas: capturar `errcode 23P01` (`exclusion_violation`) y reintentar con siguiente terapeuta o responder "ya no disponible". Configurar "Continue On Fail" en n8n + IF posterior.
- **Notificación al acompañante de pareja**: el campo `pareja_acompanante_whatsapp_id` está en `citas` pero el flujo para capturarlo y enviarle mensajes lo definimos en una segunda iteración.
- **Pago en línea**: hoy todo es en sitio. Si quieren cobro previo (anti no-show), agregar pasarela.
- **Backup**: agregar `pg_dump -n zoe` al cron del VPS, daily.
