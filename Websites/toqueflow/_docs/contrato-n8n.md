# Contrato de integración Toque ↔ n8n

> Cómo la plataforma (Supabase) y n8n se comunican. Multi-tenant. Actualizado 2026-07-09.
> Regla base: **la plataforma es dueña de los datos; n8n es un worker sin estado** que integra WhatsApp/IA/envíos.

## 1. Autenticación

### Plataforma → n8n (disparar eventos)
- Egreso único: la plataforma inserta una fila en **`n8n_events`** (outbox); un **Database Webhook (pg_net)** hace `POST` al receptor de n8n.
- **URL receptor:** `https://n8n.srv1398596.hstgr.cloud/webhook/toque-events`
- **Header:** `X-Toque-Signature: <secreto compartido>` (bearer estático en el piloto; a HMAC después). n8n rechaza lo que no coincida.
- **Envelope (anidado):**
  ```json
  { "event":"<tipo>", "event_id":"<uuid n8n_events.id>", "company_id":"<uuid>", "company_slug":"bejauha",
    "payload": { ... } }
  ```
- El receptor rutea por `event` y `company_slug` (multi-tenant). Al terminar, n8n marca `n8n_events.status='sent'`.

### n8n → Supabase (leer/escribir)
- **Conexión directa Postgres** con rol **`n8n_worker`** (usuario/contraseña, mínimos privilegios) vía pooler `aws-1-us-east-2.pooler.supabase.com:5432`, db `postgres`.
- GRANTs del rol: **SELECT** `contacts`,`campaigns` · **INSERT** `campaign_runs`,`message_log`,`test_messages` · **UPDATE** `contacts`,`n8n_events`. Sin acceso a `auth`/`profiles`.
- Credencial n8n: `Toque - Supabase Postgres (n8n_worker)` (`ybgnIi1YfqZ3UpVX`). Connection string en `n8n-worker-pg.local.txt` (gitignored). **`maxConnections=4`** (Supabase Free: pool chico para no acaparar el tope global; n8n ya reutiliza el pool, no abre una conexión por ejecución).

## 2. Tablas de negocio que toca n8n
| Tabla | n8n lee | n8n escribe |
|---|:--:|:--:|
| `contacts` | ✅ (segmentos, match por nombre/teléfono) | ✅ (status, lead_stage, clases_restantes) |
| `campaigns` | ✅ | — |
| `campaign_runs` | — | ✅ (queued/sent/failed) |
| `message_log` | — | ✅ (in/out) *(al ir a producción)* |
| `payments` | — | — (los escribe la Edge Function) |
| `n8n_events` | ✅ (recibe) | ✅ (marca `sent`) |
| `test_messages` | ✅ (sandbox) | ✅ (sandbox) |

## 3. Eventos (envelope anidado)

### `ejecutar_campana`
```json
{ "event":"ejecutar_campana", "event_id":"<uuid>", "company_id":"<uuid>", "company_slug":"bejauha",
  "payload":{ "campaign_id":"<uuid>",
    "filtros":{ "status":["no_activo"], "lead_stage":["tibio"], "service_type":["karma"] },
    "mensaje":"Hola {nombre}...", "cantidad":50, "batch_size":5, "frecuencia":"una_vez",
    "programado_para": null, "test": false } }
```
n8n: consulta `contacts` con `filtros` → arma el segmento → personaliza `{nombre}` → escribe `campaign_runs` (`queued`) → enviaría en lotes de `batch_size` (envío hoy APAGADO). Fail-safe: sin filtros no selecciona a nadie.

**Ritmo de envío (anti-baneo):** lote de **5** mensajes, **1 lote cada 12 min** (`batchInterval=720000` en el nodo "Enviar (Evolution)") → ~25 msg/hora. **Sin tope diario** (decisión del cliente). El ritmo fino (jitter + espaciado entre mensajes del lote) se cierra en el go-live según el estado del número.

**Agendamiento (Opción A — la plataforma es el reloj):** la plataforma guarda la campaña (columna `scheduled_at`), calcula la hora de Colombia y **dispara el evento en el momento exacto del envío**. Para n8n, **todo evento = "enviar ahora"** (no hay Wait ni crons por campaña → evita el bug de zona horaria Berlin). La **frecuencia** (`una_vez`/`diaria`/`semanal`) la maneja la plataforma **re-emitiendo un evento por cada ocurrencia**.
- `programado_para`: ISO 8601 con offset Colombia (ej. `"2026-07-15T09:00:00-05:00"`). `null` = envío inmediato.
- **Candado de frescura (n8n):** si `programado_para` tiene valor y el evento llega **> 120 min tarde** (n8n estuvo caído), n8n **NO envía**, marca `n8n_events.status='failed'` + `last_error='stale_skip…'` y no segmenta. Cálculo por epoch (timezone-safe). Ventana parametrizable (`VENTANA_MIN` en "Extraer campaña").

### `pago_fallido`
```json
{ "event":"pago_fallido", "event_id":"<uuid>", "company_id":"<uuid>", "company_slug":"bejauha",
  "payload":{ "contact_id":"<uuid>", "telefono":"+57...", "service_type":"paquete", "aplica_deudor":true,
    "payment":{ "monto":120000, "moneda":"COP", "referencia":"wompi_xxx", "proveedor":"wompi", "motivo":"DECLINED" },
    "test": false } }
```
n8n: si `service_type='paquete'` (candado defensivo, no solo `aplica_deudor`) → marca `contacts.status='deudor'` + avisaría al grupo admin. Para beja/uja/karma: solo avisaría, no marca deudor.

### `mensaje_prueba` (solo sandbox, siempre `test:true`)
```json
{ "event":"mensaje_prueba", "event_id":"<uuid>", "company_id":"<uuid>", "company_slug":"bejauha",
  "payload":{ "test":true, "rol":"cliente|admin", "flow":"agente_atencion|gestion_clases",
    "contact_id":"<uuid ZZ PRUEBA>", "telefono":"+573000000001", "texto":"..." } }
```
n8n rutea por **`rol`**:
- `cliente` (o ausente) → **agente inbound** → respuesta en `test_messages` (`out`/`bot`/`agente_atencion`).
- `admin` → **agente de gestión de clases** (recarga +N, consulta, asistencia −1) → respuesta en `test_messages` (`out`/`bot`/`gestion_clases`).

**Regla de datos en modo test:** solo el **contacto de prueba** (`+573000000001`) SÍ actualiza su `clases_restantes` — así se ven **recarga→consulta encadenadas de verdad**. Para cualquier **contacto real**, en modo test se **simula la respuesta sin escribir** (protege datos reales). Nunca hay envío por WhatsApp.

## 4. Sandbox — bandera `test: true`
Cuando un evento trae `test: true`, n8n corre el flujo real pero **desvía la salida a `test_messages`** (no Evolution, no admin, no muta datos reales). El chat web del panel hace polling de `test_messages`.

`test_messages(id, company_id, contact_id, telefono, direction, author, body, flow, meta, created_at)`

| Flujo | Trigger (panel) | Qué escribe en `test_messages` |
|---|---|---|
| Chat (cliente) | chat `mensaje_prueba` `rol:cliente` | `out` / `bot` / `agente_atencion` (+ `admin` si hay interés) |
| Chat (admin) | chat `mensaje_prueba` `rol:admin` | `out` / `bot` / `gestion_clases` (recarga/consulta/asistencia; escribe saldo solo del contacto de prueba) |
| Campaña test | botón → `ejecutar_campana` `test:true` | por contacto: `out` / `bot` / `campana` (sin `campaign_runs`) |
| Deudor test | botón → `pago_fallido` `test:true` | `out` / `admin` / `deudor` (sin marcar deudor) |

Campos clave para el panel: **`flow`** = `agente_atencion` \| `campana` \| `deudor`; **`author`** = `cliente` \| `bot` \| `admin`; **`direction`** = `in` \| `out`.

## 5. Modelo de datos (Bejauha)
- **Tipos de servicio:** `karma` (sin pago / a reactivar) · `beja` (suscripción normal) · `uja` (premium, domingos permanentes) · `paquete` (único con saldo de clases + `fecha_renovacion` + estado deudor).
- **Estados (`status`):** activo · no_activo · prospecto · deudor (solo paquete) · embajador.
- **`lead_stage`:** cliente · caliente · tibio · frio.
- **Solo `paquete` descuenta clases** (`clases_restantes`).
- `company_id` Bejauha: `3034fa2d-c918-41bb-9eae-84f2e7913db8`.

## 6. Estado / pendientes
- Todos los flujos construidos, migrados a Supabase y probados; **envíos apagados** (blindados) hasta el go-live controlado.
- Falta: encender envíos (warm-up + prueba a número propio + OK) y el orquestador de entrada de WhatsApp (Evolution → agentes).
