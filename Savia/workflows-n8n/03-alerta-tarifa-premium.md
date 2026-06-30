# WF-03 — Savia · Alerta de Tarifa Premium

**Propósito:** notificar al administrador cuando el volumen diario cruza el umbral de **50 contactos únicos** por primera vez en el día. Idempotente: una sola alerta por día.

**Trigger:** invocado desde WF-01 (vía nodo `Execute Workflow`) cuando el contador atómico devuelve `contactos_unicos > SAVIA_TARIFA_PREMIUM_THRESHOLD` y `tarifa_premium_activada_ts IS NULL`.

**Canal de salida:** Evolution API (instancia `savia-admin`) → WhatsApp del administrador.

---

## Diagrama lógico

```
[Execute Workflow Trigger]
   input: { fecha, contactos_unicos }
   │
   ▼
[1. Marcar tarifa premium (idempotente)]
   UPDATE savia.metricas_dia
   SET tarifa_premium_activada_ts = now()
   WHERE fecha = $1
     AND tarifa_premium_activada_ts IS NULL
     AND contactos_unicos > $2     -- {{ $env.SAVIA_TARIFA_PREMIUM_THRESHOLD }}
   RETURNING contactos_unicos, mensajes_total,
             pedidos_link_generado, pedidos_pago_confirmado;
   │
   ▼
[2. ¿UPDATE afectó filas?]
   ├─► NO → ya estaba marcado por otra ejecución concurrente. Salir.
   │
   └─► SÍ
        │
        ▼
   [3. Calcular conversión y formatear mensaje]
   conversion = pago_confirmado / link_generado (si link_generado > 0)
   │
   ▼
   [4. Enviar a Evolution API → admin]
   foreach numero in $env.ADMIN_PHONES.split(','):
     POST {{$env.EVOLUTION_API_URL}}/message/sendText/{{$env.EVOLUTION_INSTANCE_SAVIA_ADMIN}}
     Header: apikey = {{$env.EVOLUTION_API_KEY}}
     {
       "number": "{{numero}}",
       "text": "{{mensaje formateado}}"
     }
```

---

## Formato del mensaje al admin

```
🔔 SAVIA — Tarifa Premium activada

📅 {fecha}
👥 Contactos únicos hoy: {contactos_unicos}
💬 Mensajes totales: {mensajes_total}
🛒 Links generados: {pedidos_link_generado}
✅ Pagos confirmados: {pedidos_pago_confirmado}
📈 Conversión hoy: {conversion}%

El bot sigue operando normalmente. Esta alerta es informativa para facturación.
```

---

## Por qué este flujo es atómico

El `UPDATE ... WHERE tarifa_premium_activada_ts IS NULL ... RETURNING` es la cláusula clave:

- Si dos invocaciones llegan al mismo tiempo (race condition), PostgreSQL serializa la actualización por fila.
- La primera obtiene el RETURNING con valores; la segunda obtiene 0 filas y no envía mensaje.
- No se necesita lock explícito ni transacción adicional.

---

## Configuración previa requerida

1. **Crear instancia Evolution `savia-admin`**:
   ```bash
   curl -X POST https://evolution.srv1398596.hstgr.cloud/instance/create \
     -H "apikey: $EVOLUTION_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceName": "savia-admin",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
     }'
   ```
2. Escanear el QR desde el WhatsApp del administrador.
3. Confirmar que `ADMIN_PHONES` en `.env` apunta al número correcto en E.164 con `+`.

---

## Testing en staging

Para probar sin esperar 50 contactos reales:

1. Setear temporalmente `SAVIA_TARIFA_PREMIUM_THRESHOLD=2` en n8n.
2. Disparar 3 conversaciones desde teléfonos distintos.
3. Verificar:
   - WhatsApp del admin recibió la alerta.
   - `savia.metricas_dia.tarifa_premium_activada_ts` está marcada.
   - Un cuarto contacto NO envía una segunda alerta.
4. Restaurar el threshold a 50.

---

## Variables n8n usadas

`SAVIA_TARIFA_PREMIUM_THRESHOLD`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_SAVIA_ADMIN`, `ADMIN_PHONES`.
