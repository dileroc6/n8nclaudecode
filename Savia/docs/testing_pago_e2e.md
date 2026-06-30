# Test end-to-end de pago — Savia Wear (Sprint 1)

> Runbook para validar el flujo completo desde "clienta confirma compra" hasta "pago confirmado y notificado".
>
> Tiempo estimado: 20-30 minutos la primera vez (con setup MP). 5-10 minutos las siguientes.

---

## Arquitectura del flujo

```
[Clienta WA]
    ↓ "me llevo el legging Terra, pago por MercadoPago"
[Bot WF-01]
    ↓ llama crear_pedido_woo
[Sub-workflow crear_pedido_woo]
    ↓ POST /wp-json/wc/v3/orders
[WooCommerce]
    ↓ devuelve checkout_payment_url
[Bot WF-01]
    ↓ envía link a la clienta vía Evolution
[Clienta WA]
    ↓ abre link, paga con tarjeta sandbox MP
[Mercado Pago]
    ↓ aprueba pago, notifica a WooCommerce
[WooCommerce]
    ↓ cambia order.status de pending → processing
    ↓ dispara webhook "Order updated" hacia n8n
[WF-02 Webhook WC]
    ↓ valida HMAC, UPDATE savia.pedidos.estado='pago_confirmado'
    ↓ envía confirmación a la clienta vía Evolution
[Clienta WA recibe: "Tu pago fue confirmado ✅"]
```

---

## SETUP PREVIO (solo la primera vez)

### A. Configurar MercadoPago modo TEST en WooCommerce

1. Entrar a WP Admin → WooCommerce → Ajustes → Pagos → **Mercado Pago**
2. Asegurarse de tener instalado el plugin oficial **Mercado Pago Payments para WooCommerce** (debe estar activo según el `WOO_PAYMENT_METHOD=woo-mercado-pago-basic` del docker-compose)
3. **Pestaña "Configuración del Plugin"** → activar la opción **"Modo de prueba"** o **"Sandbox"** (✅ ON)
4. **Pestaña "Credenciales"** → ingresar las credenciales TEST de tu cuenta de Mercado Pago:
   - **Public Key TEST**: `TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Access Token TEST**: `TEST-xxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx`
   - Obtener desde: [mercadopago.com.co/developers/panel/app](https://www.mercadopago.com.co/developers/panel/app) → tu app → Credenciales → **Credenciales de prueba**
5. Guardar cambios

### B. Crear cuenta de comprador de prueba MP

Para probar el pago necesitas una **cuenta de comprador test** (distinta a la real para no usar tu propia tarjeta):

1. Mercado Pago developers panel → **Cuentas de prueba** → **Crear cuenta**
2. Tipo: **Comprador**, País: **Colombia**, Dinero ficticio: cualquier monto
3. Guardar el usuario/password generado (lo necesitarás al pagar)

### C. Verificar webhook WC → n8n

Esto ya está configurado pero confirma:

1. WP Admin → WooCommerce → Ajustes → Avanzado → **Webhooks**
2. Debe existir uno con:
   - **Estado**: Activo
   - **Tema (Topic)**: `Order updated`
   - **URL de entrega**: `https://n8n.srv1398596.hstgr.cloud/webhook/savia/woo-order`
   - **Secreto**: el mismo valor que `WC_WEBHOOK_SECRET` del docker-compose
   - **Versión API**: WP REST API Integration v3

### D. Bajar threshold de tarifa premium (opcional)

Si quieres probar T2 (alerta) en la misma sesión: editar `docker-compose.yml`:
```yaml
SAVIA_TARIFA_PREMIUM_THRESHOLD=3
```
Reiniciar el container n8n. Recordar volver a `50` después.

### E. Limpiar historial de prueba antes de cada corrida

```bash
PG_CONTAINER=$(docker ps --format '{{.Names}}' | grep -iE 'postgres|^pg-' | head -1)
docker exec -i "$PG_CONTAINER" psql -U leadai_user -d leadai <<'SQL'
SET search_path = savia, public;
DELETE FROM savia.mensajes_logs WHERE telefono = '34662908263';
DELETE FROM savia.contactos_dia WHERE telefono = '34662908263';
DELETE FROM savia.pedidos       WHERE telefono = '34662908263';
DELETE FROM savia.clientes      WHERE telefono = '34662908263';
SQL
```

Cambia `34662908263` por tu número de prueba.

---

## TEST EN VIVO — paso a paso

### Paso 1 — Saludo + intención de compra

Mandas al bot:
```
hola
tienen leggings?
```

**Esperado:**
- Saludo elegante con aviso privacidad
- Devuelve un legging real con precio (al final), foto, talla única

✅ Si el bot menciona producto + precio real de WC → OK

### Paso 2 — Confirmar compra

```
me llevo el Legging Terra
```

**Esperado:**
- Bot pregunta método de pago (MercadoPago web o Nequi/transferencia por WhatsApp)

✅ Si la pregunta sale natural → OK

### Paso 3 — Elegir MercadoPago

```
por MercadoPago
```

**Esperado:**
- Bot pide datos básicos (nombre completo) o confirma producto+talla y procede

### Paso 4 — Dar nombre

```
me llamo Ana López
```

**Esperado:**
- Bot llama internamente `crear_pedido_woo` (verás execution en n8n)
- WooCommerce crea el pedido (status: `pending`)
- Bot devuelve el **link de pago de MP**:
  - Algo como: `https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=xxxxx`

✅ Si llega un link válido → 50% del flujo OK

#### Validaciones en BD (antes de pagar)

```bash
docker exec -i "$PG_CONTAINER" psql -U leadai_user -d leadai -c "
SELECT id, woo_order_id, telefono, producto_nombre, precio_cop, estado, pago_url, created_at
FROM savia.pedidos
WHERE telefono = '34662908263'
ORDER BY created_at DESC LIMIT 1;"
```

Debe aparecer 1 fila con:
- `estado = 'link_generado'`
- `woo_order_id` con un número
- `pago_url` con el link de MP

### Paso 5 — Pagar con tarjeta sandbox

1. Abrir el link recibido en el navegador
2. Iniciar sesión con la **cuenta de comprador TEST** creada en SETUP B
3. Usar una de estas **tarjetas de prueba Colombia**:

| Tipo | Número | CVV | Fecha | Nombre titular | Resultado |
|---|---|---|---|---|---|
| Visa | `4013 5406 8274 6260` | 123 | 12/30 | **APRO** | ✅ Aprobado |
| Mastercard | `5031 7557 3453 0604` | 123 | 12/30 | **APRO** | ✅ Aprobado |
| Visa | `4013 5406 8274 6260` | 123 | 12/30 | **OTHE** | ❌ Rechazado por error general |
| Visa | `4013 5406 8274 6260` | 123 | 12/30 | **CONT** | 🟡 Pendiente |
| Visa | `4013 5406 8274 6260` | 123 | 12/30 | **FUND** | ❌ Fondos insuficientes |

El **nombre del titular** controla el resultado (no la tarjeta). Usa **APRO** para aprobar.

Documento: cualquier número válido (8 dígitos para CC).

### Paso 6 — Validar webhook WF-02 disparó

Después de pagar (toma 5-30 segundos):

1. n8n → Executions → Filtrar por workflow `Savia — Webhook WooCommerce Order (WF-02)` (id `qOwllAj32Pwo5l5g`)
2. Debe aparecer 1 ejecución reciente con status **success**
3. Click → ver que pasó por:
   - Verificar HMAC → OK
   - UPDATE pedido → 1 row affected
   - Send WA confirmation → 200 OK

### Paso 7 — Validar BD actualizada

```bash
docker exec -i "$PG_CONTAINER" psql -U leadai_user -d leadai -c "
SELECT id, woo_order_id, estado, mp_transaction_id, pago_at
FROM savia.pedidos
WHERE telefono = '34662908263'
ORDER BY created_at DESC LIMIT 1;"
```

Debe mostrar:
- `estado = 'pago_confirmado'`
- `mp_transaction_id` con un valor
- `pago_at` con timestamp

### Paso 8 — Validar mensaje a clienta

En tu WhatsApp debe llegar el mensaje de confirmación del bot, algo como:
> *"¡Pago confirmado! ✅ Tu Legging Terra ya está siendo preparado para envío..."*

✅ Si llegó → **flujo end-to-end completo OK**

---

## Resultado esperado completo

| Paso | Resultado | Tabla/Log que validar |
|---|---|---|
| 1-4 | Bot crea pedido en WC | `savia.pedidos` con estado `link_generado` |
| 5 | Pago aprobado en MP | MP dashboard test muestra transacción |
| 6 | WF-02 procesa webhook | n8n executions: status success |
| 6 | WC dispara webhook | `savia.eventos_pago` con signature_ok=true |
| 7 | BD actualizada | `savia.pedidos.estado='pago_confirmado'` |
| 8 | Mensaje a clienta | WhatsApp recibe confirmación |

---

## TROUBLESHOOTING

### "El link de MP no carga / da 404"

- Verificar credenciales TEST configuradas en WP Admin → MP plugin
- Confirmar que `WOO_PAYMENT_METHOD=woo-mercado-pago-basic` matchea el slug del plugin (puede variar entre versiones)

### "Bot dice 'error al crear pedido'"

Revisar execution en n8n del sub-workflow `crear_pedido_woo`:
- ¿`POST /wp-json/wc/v3/orders` devolvió error? Probablemente credenciales WC mal o producto sin stock
- Si devuelve 401 → revisar `WOO_CONSUMER_KEY/SECRET`

### "Pagué pero el pedido sigue en estado 'link_generado'"

Webhook WC → n8n no llegó:
1. WP Admin → WooCommerce → Estado → **Webhooks** → ver delivery log del webhook "Order updated"
2. Si dice failed → ver el código HTTP. 401 = secret incorrecto. 500 = bug en WF-02.
3. Revisar n8n executions de WF-02 — ¿llegó algo?

```bash
docker exec -i "$PG_CONTAINER" psql -U leadai_user -d leadai -c "
SELECT evento_id, woo_order_id, woo_status, signature_ok, recibido_at
FROM savia.eventos_pago
ORDER BY recibido_at DESC LIMIT 5;"
```

Si `signature_ok = false` → el secreto del webhook en WP no coincide con `WC_WEBHOOK_SECRET` del docker-compose.

### "Webhook llega pero pedido no se actualiza"

- Posiblemente `mp_transaction_id` está vacío en el payload (algunos plugins MP no lo mandan en ciertos eventos)
- Revisar la rama del WF-02 que matchea `processing` — puede que no esté filtrando bien

### "Bot no me envía la confirmación al final"

- Revisar el último nodo del WF-02 (Send WA Evolution): ¿devolvió 200?
- Si Evolution `dev-router` está desconectado → no entrega. Reconectar.

---

## Re-ejecutar el test (después de la primera vez)

1. Borrar historial PG (script de SETUP E)
2. En WC: marcar el pedido test anterior como cancelado o eliminarlo (WP Admin → WooCommerce → Pedidos)
3. Repetir Test paso 1 a 8

---

## Cuando esto funciona → estamos listos para go-live

Lo único que faltaría tras este test es:
- Cambiar `EVOLUTION_INSTANCE_SAVIA=dev-router` → `savia` cuando el número oficial esté conectado
- En WC: pasar Mercado Pago de **TEST** a **PRODUCCIÓN** (credenciales reales)
- Validar 1 vez más con un pago real pequeño antes de anunciar a clientes
