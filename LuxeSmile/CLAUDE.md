# CLAUDE.md — Luxe Smile WhatsApp Bot
### Proyecto LeadAI | Turismo médico dental | Pacientes internacionales

> Este archivo es la fuente de verdad del proyecto para Claude Code.
> Contiene toda la lógica de negocio, decisiones de arquitectura, restricciones críticas
> y contexto necesario para construir, modificar o depurar cualquier workflow de este cliente.
> No repetir este contexto en los prompts individuales de cada sesión.

---

## 1. Identidad del cliente

| Campo | Valor |
|---|---|
| **Clínica** | Luxe Smile |
| **Industria** | Turismo médico dental |
| **Servicios principales** | Carillas de porcelana (superiores + inferiores), contorno de encías, limpieza profunda |
| **Mercado objetivo** | Pacientes internacionales (precios en USD) |
| **Idioma del bot** | Dinámico — responde en el mismo idioma que el lead (98% inglés, ~2% español) |
| **WhatsApp Business** | `[NÚMERO — completar antes del deploy]` |
| **Responsable técnico** | `[NOMBRE DEL CONTACTO — completar]` |

---

## 2. Stack técnico

| Componente | Detalle |
|---|---|
| **Canal** | WhatsApp Business vía Evolution API v2 |
| **Orchestrador** | n8n self-hosted (VPS Hostinger) |
| **IA** | Claude API — AI Agent nativo de n8n con tools |
| **Base de datos** | PostgreSQL — schema dedicado `luxe_smile` (un schema por cliente en la misma instancia) |
| **Pagos online** | PayPal Checkout API (no email directo — ver sección Pagos) |
| **Pagos manuales** | Pantallazo → grupo WhatsApp `Confirmación de Pagos` |
| **CRM** | Webhook entrante al sistema Node.js del cliente (nodemailer) |
| **Agendamiento** | Google Calendar API |
| **Imagen referencial** | URL pública en variable de entorno `LUXE_PHOTO_GUIDE_URL` |
| **Canal admin** | WhatsApp personal del administrador → número autorizado en `ADMIN_PHONES` |

---

## 3. Grupos de WhatsApp (human-in-the-loop)

| Grupo | Función | Quién responde |
|---|---|---|
| `Revisión de Casos` | Recibe fotos del lead con contexto + SKU | Odontólogo + laboratorio |
| `Confirmación de Pagos` | Recibe pantallazos de pagos manuales con contexto + SKU | Administrador |

### Reglas críticas de los grupos

- **Nunca hacer dump automático.** Cada reenvío lleva siempre: SKU del lead, nombre, fecha de contacto, procedimiento de interés.
- **Sistema de SKU obligatorio.** Cada lead recibe un identificador único (`0001`, `0002`, etc.) generado al inicio de la conversación y almacenado en PostgreSQL (`luxe_smile.leads`). Es el mecanismo por el que los humanos en el grupo identifican a qué lead se refieren.
- **Formato de respuesta humana en el grupo `Revisión de Casos`:**
  ```
  [SKU] VIABLE: [cotización en texto libre]
  [SKU] FALTA INFO: [qué información falta]
  [SKU] NO VIABLE: [motivo opcional]
  ```
  El bot parsea ese texto, extrae el SKU y el resultado, y actúa en consecuencia.

---

## 4. Flujo de negocio completo (7 etapas)

### ETAPA 1 — Captación
- Lead entra por anuncio de pago o botón WhatsApp del perfil
- Bot saluda y detecta el idioma del primer mensaje → responde en el mismo idioma durante toda la conversación
- Bot presenta el paquete de beneficios completo:
  - 10 carillas superiores + 10 inferiores
  - Contorno de encías + limpieza profunda
  - Hotel 5 noches + traslados aeropuerto ↔ clínica ↔ hotel
- **Estrategia de comunicación:** beneficios primero, precio y detalles del procedimiento "escondidos" dentro de la propuesta — no se mencionan antes del interés claro

### ETAPA 2 — Calificación del caso
- Si el lead muestra interés claro → bot explica el proceso paso a paso
- Bot envía la imagen referencial de ángulos fotográficos desde `LUXE_PHOTO_GUIDE_URL`
  - La URL está en env var para que el cliente pueda actualizarla sin tocar el workflow
- Solicita fotos de la sonrisa del lead (frente, perfil izquierdo, perfil derecho, sonrisa abierta)
- Confirma recepción: *"I've sent your photos to our specialists. Response time: up to 3 hours."*
- Genera y asigna SKU al lead — INSERT en `luxe_smile.leads` con estado `fotos_enviadas`

### ETAPA 3 — Revisión humana (Human-in-the-loop #1)
- Bot reenvía las fotos al grupo `Revisión de Casos` con el siguiente contexto:
  ```
  📋 NUEVO CASO
  SKU: 0042
  Nombre: Monica
  Idioma: English
  Procedimiento de interés: Veneers (20 piezas)
  Fecha de contacto: 2025-01-15 14:32
  [fotos adjuntas]
  ```
- **Wait inteligente:** el bot no hace follow-up inmediato
  - Si el mensaje original llegó entre 08:00–21:00 (hora local clínica): espera máximo 3 horas antes de notificar al equipo
  - Si el mensaje llegó fuera de ese horario (madrugada): el wait se extiende hasta el inicio del horario laboral del siguiente día — no interrumpir al equipo
  - Si no hay respuesta en el tiempo límite: el bot envía recordatorio al grupo (no al lead)
- Humano determina y escribe en el grupo: `0042 VIABLE: carillas 5500 USD porque ya tiene carillas previas que hay que retirar`
- Bot parsea la respuesta, reformatea con IA en mensaje elegante y la envía al lead

### ETAPA 4 — Cotización y cierre
- Bot envía al lead: *"Hi Monica, after reviewing your case with our specialists..."*
- Incluye cotización estructurada + llamado a acción (¿mes mayo o junio?)
- Lead elige mes → bot activa **nodo Wait de 90 segundos** (obligatorio e intencional)
  - Durante el wait: *"Let me check availability for you, I'll be right back..."*
  - Este delay es un mecanismo de persuasión por escasez — nunca eliminarlo
- Bot confirma disponibilidad (consulta Google Calendar — no bloquear horarios nocturnos de la clínica)
- Bot solicita depósito de reserva de **$500 USD** con política de reagendamiento:
  - Reagendamiento permitido con mínimo 5 días de anticipación
  - Sin penalización si se notifica a tiempo

### ETAPA 5 — Pago

**Vía A — PayPal (online):**
- Bot genera un link de pago único vía **PayPal Checkout API** (no transferencia directa a correo)
  - Cada reserva genera su propio link para trazabilidad
- Webhook de PayPal confirma el pago automáticamente → continúa al flujo de datos

**Vía B — Pago manual (transferencia / Zelle / consignación):**
- Lead envía pantallazo del comprobante al bot
- Bot reenvía al grupo `Confirmación de Pagos` con contexto:
  ```
  💰 PAGO PENDIENTE VERIFICACIÓN
  SKU: 0042
  Nombre: Monica
  Monto esperado: $500 USD
  [imagen del comprobante]
  ```
- **Wait inteligente** (mismas reglas horarias que Etapa 3)
- Administrador responde en el grupo haciendo reply al mensaje del bot: `0042 CONFIRMADO`
- Bot notifica al lead: *"We've received your payment. Welcome to the Luxe Smile family! 🎉"*

### ETAPA 6 — Recopilación de datos y CRM
- Bot solicita secuencialmente: nombre completo, correo electrónico, teléfono con código de país
- Envía al CRM del cliente vía webhook (formato JSON):
  ```json
  {
    "sku": "0042",
    "first_name": "Monica",
    "last_name": "García",
    "email": "monica@example.com",
    "phone": "+1-555-0000",
    "procedure": "veneers_20",
    "deposit_paid": true,
    "payment_method": "paypal",
    "language": "en"
  }
  ```
- El registro queda en estado `draft` en el CRM — humano revisa y confirma
- CRM envía correo de confirmación automáticamente vía Gmail/nodemailer

### ETAPA 7 — Agendamiento
- Bot confirma las fechas definitivas con el lead
- Crea evento en Google Calendar del cliente
- Google Calendar tiene horarios de atención configurados para no ofrecer slots nocturnos (nunca ofrecer disponibilidad fuera del horario operativo de la clínica)
- Bot envía resumen final: fechas, procedimientos, hotel, traslados, próximos pasos

---

## 5. Workflows en n8n

| ID | Nombre en n8n | Etapas que cubre | Estado |
|---|---|---|---|
| WF-01 | `Luxe Smile — Captación y Calificación` | 1 y 2 | ✅ creado — ID: `CuBrhx5KucZ4mMXX` |
| WF-02 | `Luxe Smile — Revisión de Caso (Human Loop)` | 3 | ✅ creado — ID: `jeFR0qJOte0JuzTf` |
| WF-03 | `Luxe Smile — Cotización y Cierre` | 4 | ✅ creado — ID: `bUzKAIBYmJvNa1ME` |
| WF-04 | `Luxe Smile — Confirmación de Pago PayPal` | 5-A | ✅ creado — ID: `k0RqPhnzM3ZjQeEe` |
| WF-05 | `Luxe Smile — Confirmación de Pago Manual` | 5-B | ✅ creado — ID: `Jxc1UVPoK4mGJVHJ` |
| WF-06 | `Luxe Smile — Datos y Agendamiento` | 6 y 7 | ✅ creado — ID: `cgAXqzntirV1uDb5` |
| WF-07 | `Luxe Smile — Admin Control` | Canal admin | ✅ creado — ID: `aSy1GEWhtUzIHncw` |

---

## 6. PostgreSQL — schema `luxe_smile`

### Convención de aislamiento por cliente
Cada proyecto/cliente usa su propio schema dentro de la misma instancia PostgreSQL del VPS.
Esto permite aislamiento de datos, backups selectivos y permisos por schema sin necesidad de múltiples bases de datos.

```sql
-- Crear el schema del cliente (ejecutar una sola vez en setup)
CREATE SCHEMA IF NOT EXISTS luxe_smile;
```

### Tabla principal: `luxe_smile.leads`

```sql
CREATE TABLE luxe_smile.leads (
  id            SERIAL PRIMARY KEY,
  sku           VARCHAR(10)   NOT NULL UNIQUE,        -- ej: '0042'
  phone         VARCHAR(30)   NOT NULL UNIQUE,        -- número WhatsApp del lead
  name          VARCHAR(120),                         -- nombre detectado o ingresado
  language      CHAR(2)       NOT NULL DEFAULT 'en',  -- 'en' o 'es'
  estado        VARCHAR(30)   NOT NULL DEFAULT 'captacion',
                -- valores válidos:
                -- captacion | fotos_enviadas | revision_pendiente
                -- cotizacion_enviada | pago_pendiente
                -- pago_confirmado | datos_recopilados | agendado
  procedure     VARCHAR(60),                          -- ej: 'veneers_20'
  cotizacion_usd NUMERIC(10,2),                       -- monto cotizado por el especialista
  mes_preferido VARCHAR(20),                          -- mes elegido por el lead
  payment_method VARCHAR(10),                         -- 'paypal' | 'manual'
  deposit_paid  BOOLEAN       NOT NULL DEFAULT FALSE,
  first_name    VARCHAR(60),
  last_name     VARCHAR(60),
  email         VARCHAR(120),
  phone_full    VARCHAR(30),                          -- teléfono con código de país (Etapa 6)
  crm_draft_id  VARCHAR(60),                          -- ID asignado por el CRM del cliente
  calendar_event_id VARCHAR(120),                     -- ID del evento en Google Calendar
  notas         TEXT,                                 -- campo libre para el equipo humano
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  pago_at       TIMESTAMPTZ,                          -- timestamp de confirmación de pago
  agendado_at   TIMESTAMPTZ                           -- timestamp de creación del evento
);
```

### Tabla de historial de conversación: `luxe_smile.mensajes`

```sql
CREATE TABLE luxe_smile.mensajes (
  id         SERIAL PRIMARY KEY,
  lead_sku   VARCHAR(10)  NOT NULL REFERENCES luxe_smile.leads(sku),
  rol        VARCHAR(10)  NOT NULL,   -- 'user' | 'assistant' | 'system'
  contenido  TEXT         NOT NULL,
  media_url  TEXT,                    -- URL de imagen/audio si aplica
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> El historial de conversación se carga en cada invocación del AI Agent para mantener contexto sin depender de memoria en n8n.

### Tabla de pagos: `luxe_smile.pagos`

```sql
CREATE TABLE luxe_smile.pagos (
  id             SERIAL PRIMARY KEY,
  lead_sku       VARCHAR(10)  NOT NULL REFERENCES luxe_smile.leads(sku),
  metodo         VARCHAR(10)  NOT NULL,   -- 'paypal' | 'manual'
  monto_usd      NUMERIC(10,2) NOT NULL,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
                 -- pendiente | confirmado | rechazado
  paypal_order_id VARCHAR(80),            -- ID de la orden de PayPal
  confirmado_por  VARCHAR(60),            -- nombre del admin que confirmó (pagos manuales)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmado_at  TIMESTAMPTZ
);
```

### Tabla de bloqueos de agenda: `luxe_smile.agenda_bloques`

```sql
CREATE TABLE luxe_smile.agenda_bloques (
  id          SERIAL PRIMARY KEY,
  tipo        VARCHAR(20)  NOT NULL,        -- 'dia_completo' | 'rango' | 'cancelacion_masiva'
  fecha_inicio DATE         NOT NULL,
  fecha_fin    DATE         NOT NULL,        -- igual a fecha_inicio si es un solo día
  motivo       TEXT,                         -- texto libre del admin (no se muestra al lead)
  mensaje_lead TEXT,                         -- mensaje de disculpa generado por IA para los leads afectados
  activo       BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_por   VARCHAR(60),                  -- número de WhatsApp del admin que lo creó
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  procesado_at TIMESTAMPTZ                   -- cuándo se ejecutó la cancelación/notificación masiva
);
```

### Estados válidos del lead (máquina de estados)

```
captacion
  └─► fotos_enviadas
        └─► revision_pendiente
              ├─► cotizacion_enviada   (caso VIABLE)
              │     └─► pago_pendiente
              │           └─► pago_confirmado
              │                 └─► datos_recopilados
              │                       └─► agendado  ✅
              └─► [fin de flujo]       (caso NO VIABLE)
```

### Índices recomendados

```sql
CREATE INDEX idx_leads_phone   ON luxe_smile.leads(phone);
CREATE INDEX idx_leads_estado  ON luxe_smile.leads(estado);
CREATE INDEX idx_mensajes_sku  ON luxe_smile.mensajes(lead_sku);
CREATE INDEX idx_pagos_sku     ON luxe_smile.pagos(lead_sku);
CREATE INDEX idx_bloques_rango ON luxe_smile.agenda_bloques(fecha_inicio, fecha_fin)
  WHERE activo = TRUE;
```

---

---

## 6b. WF-07 — Canal de Control Admin

### Propósito
Permitir al administrador de la clínica enviar comandos en lenguaje natural por WhatsApp para controlar la operación del bot: cancelar citas, bloquear rangos de agenda, y emitir notificaciones masivas a leads afectados — sin necesidad de acceder a n8n ni a la base de datos directamente.

### Seguridad — autenticación por número de teléfono
- El WF-07 se activa **únicamente** si el número de WhatsApp del remitente está en la lista `ADMIN_PHONES` (env var).
- Si un número no autorizado envía un mensaje al bot que empiece con un comando admin, el bot lo ignora silenciosamente y lo trata como un lead normal.
- Los números admin **nunca** pasan por WF-01 al WF-06.

### Comandos soportados (lenguaje natural — Claude los interpreta)

El admin escribe en español libre. Claude clasifica la intención en una de las siguientes acciones:

| Intención detectada | Ejemplo de mensaje admin | Acción ejecutada |
|---|---|---|
| `BLOQUEAR_DIA` | *"Mañana no podré atender"* | Bloquea el día siguiente en Calendar + notifica leads afectados |
| `BLOQUEAR_RANGO` | *"Bloquea del 15 al 30 de mayo"* | Inserta bloque en `agenda_bloques` + bloquea en Calendar |
| `CANCELAR_CITA` | *"Cancela la cita del SKU 0042"* | Cancela evento Calendar del lead + notifica al lead |
| `LISTAR_AGENDA` | *"¿Quiénes están agendados esta semana?"* | Consulta DB y responde resumen al admin |
| `CONSULTAR_SKU` | *"¿Qué estado tiene el 0038?"* | Consulta DB y responde ficha del lead al admin |
| `DESBLOQUEAR` | *"Quita el bloqueo del 20 de mayo"* | Marca bloque como `activo = FALSE` en DB + libera Calendar |
| `ESTADO_GENERAL` | *"¿Cuántos leads tenemos esta semana?"* | Resumen de métricas: leads por estado, pagos confirmados |

### Flujo interno del WF-07

```
WhatsApp entrante
  └─► WF-07 Trigger (Evolution API webhook)
        └─► IF: ¿remitente está en ADMIN_PHONES?
              ├─► NO → ignorar (no responder, no procesar como lead)
              └─► SÍ → Claude AI Agent (modo admin)
                        ├─► Clasifica intención del mensaje
                        ├─► Extrae parámetros (fechas, SKU, motivo)
                        └─► Ejecuta la acción correspondiente:
                              │
                              ├─► [BLOQUEAR_DIA / BLOQUEAR_RANGO]
                              │     ├─► INSERT en luxe_smile.agenda_bloques
                              │     ├─► Bloquear slots en Google Calendar (evento bloqueador)
                              │     ├─► SELECT leads con agendado_at en ese rango
                              │     ├─► Claude genera mensaje de disculpa personalizado por lead
                              │     ├─► Enviar mensaje a cada lead afectado vía Evolution API
                              │     ├─► UPDATE leads.estado → 'reprogramar_pendiente'
                              │     └─► Responder al admin: resumen de leads notificados
                              │
                              ├─► [CANCELAR_CITA — por SKU]
                              │     ├─► SELECT lead por SKU
                              │     ├─► DELETE / cancel evento en Google Calendar
                              │     ├─► Claude genera mensaje de disculpa para ese lead
                              │     ├─► Enviar mensaje al lead vía Evolution API
                              │     ├─► UPDATE leads.estado → 'reprogramar_pendiente'
                              │     └─► Responder al admin: confirmación de cancelación
                              │
                              ├─► [LISTAR_AGENDA]
                              │     ├─► SELECT leads WHERE estado = 'agendado'
                              │     │   AND agendado_at BETWEEN [rango solicitado]
                              │     └─► Responder al admin con lista formateada
                              │
                              ├─► [CONSULTAR_SKU]
                              │     ├─► SELECT * FROM leads WHERE sku = [extraído]
                              │     └─► Responder al admin con ficha completa del lead
                              │
                              └─► [ESTADO_GENERAL]
                                    ├─► Consultas agregadas por estado en DB
                                    └─► Responder resumen al admin
```

### Mensaje de disculpa generado por IA

Claude genera el mensaje en el **idioma del lead** (columna `language`) con el siguiente contexto:

```
Genera un mensaje de WhatsApp breve y cálido para un paciente llamado [nombre]
que tenía una cita agendada en Luxe Smile. Dile que debemos reprogramar su cita
por [motivo — solo si el admin lo indicó, sino usa: "circumstances beyond our control"].
Discúlpate sinceramente, asegúrale que su depósito está 100% garantizado y
que un miembro del equipo se pondrá en contacto pronto para reagendar.
Tono: profesional, empático, sin excesos. Idioma: [en/es]. Máximo 4 líneas.
```

### Estado adicional en `luxe_smile.leads`

El campo `estado` admite dos valores nuevos para el flujo admin:

```
agendado
  └─► reprogramar_pendiente   (admin canceló — esperando nueva fecha)
        └─► agendado           (se reagendó exitosamente)
```

### Respuesta de confirmación al admin

Después de ejecutar cualquier acción, el bot responde al admin con un resumen:

```
✅ Bloqueo registrado: 15 may – 30 may
📋 Leads afectados y notificados: 3
  · 0038 — Sarah Johnson (en)
  · 0041 — Carlos Méndez (es)
  · 0044 — Emily Torres (en)
📅 Slots bloqueados en Google Calendar: ✓
⚠️ Leads en estado pago_pendiente en ese rango: 1 (no notificados — sin cita aún)
```

---

## 7. Variables de entorno (`.env`)

```env
# Evolution API
EVOLUTION_API_URL=https://[tu-vps]/evolution
EVOLUTION_API_KEY=xxxx
EVOLUTION_INSTANCE_LUXE=luxe-smile

# Grupos WhatsApp (IDs de Evolution API)
WHATSAPP_GROUP_CASOS=120363xxxxxxxxx@g.us
WHATSAPP_GROUP_PAGOS=120363xxxxxxxxx@g.us

# PostgreSQL
PG_HOST=localhost          # mismo VPS donde corre n8n
PG_PORT=5432
PG_DB=leadai               # base de datos compartida entre todos los clientes
PG_SCHEMA=luxe_smile       # schema exclusivo de este cliente
PG_USER=leadai_user
PG_PASSWORD=xxxx

# Google Calendar
GOOGLE_CALENDAR_ID=xxxx@group.calendar.google.com
PAYPAL_CLIENT_ID=xxxx
PAYPAL_CLIENT_SECRET=xxxx
PAYPAL_ENV=production  # o sandbox para pruebas

# CRM del cliente
CRM_WEBHOOK_URL=https://[crm-cliente]/api/leads
CRM_API_KEY=xxxx

# Claude API
ANTHROPIC_API_KEY=xxxx
CLAUDE_MODEL=claude-opus-4-5

# Admin canal de control
ADMIN_PHONES=+57300xxxxxxx,+57311xxxxxxx   # números autorizados separados por coma
LUXE_PHOTO_GUIDE_URL=https://[hosting-publico]/luxe-smile/photo-guide.jpg
DEPOSIT_AMOUNT_USD=500
RESERVATION_POLICY_DAYS=5
```

---

## 8. Estructura de directorios del proyecto

```
luxe-smile/
├── CLAUDE.md                          ← este archivo
├── .env                               ← variables de entorno (nunca en git)
├── .env.example                       ← plantilla sin valores reales
├── README.md                          ← instrucciones de setup para el cliente
│
├── workflows/                         ← JSONs exportados de n8n
│   ├── WF-01_captacion-calificacion.json
│   ├── WF-02_revision-caso.json
│   ├── WF-03_cotizacion-cierre.json
│   ├── WF-04_pago-paypal.json
│   ├── WF-05_pago-manual.json
│   ├── WF-06_datos-agendamiento.json
│   └── WF-07_admin-control.json
│
├── prompts/                           ← prompts del AI Agent por etapa
│   ├── system-prompt.md               ← identidad base del bot (idioma dinámico)
│   ├── etapa1-captacion.md
│   ├── etapa2-calificacion.md
│   ├── etapa3-cotizacion-formatter.md ← reformatea input del humano
│   ├── etapa4-cierre.md
│   ├── etapa6-recopilacion-datos.md
│   └── admin-control.md               ← clasificación de intenciones + generación de mensajes de disculpa
│
├── schemas/                           ← esquemas y DDL
│   ├── db-schema.sql                  ← DDL completo del schema luxe_smile (leads, mensajes, pagos)
│   ├── crm-payload.json               ← estructura del webhook al CRM
│   └── calendar-event.json            ← estructura del evento en Calendar
│
├── docs/                              ← documentación para el cliente
│   ├── manual-grupos-whatsapp.md      ← cómo responder en los grupos (odontólogo + admin)
│   ├── manual-admin-control.md        ← comandos disponibles del canal admin con ejemplos
│   ├── sku-system.md                  ← cómo funciona el sistema de SKUs
│   └── paypal-setup.md                ← configuración de PayPal API
│
└── tests/                             ← simulaciones de flujo
    ├── test-lead-viable.md            ← caso feliz completo
    ├── test-lead-no-viable.md         ← caso rechazado por especialista
    └── test-pago-manual.md            ← flujo de pago manual
```

---

## 9. Restricciones críticas (no negociables)

1. **El delay de 90 segundos en verificación de disponibilidad es obligatorio.** Nunca eliminar ni acortar el nodo Wait de la Etapa 4. Es parte de la estrategia de conversión.

2. **Nunca confirmar disponibilidad de fecha sin haber pasado por el nodo Wait.** Sin excepción.

3. **El bot responde siempre en el idioma que detectó en el primer mensaje del lead.** No cambiar de idioma mid-conversación.

4. **Nunca hacer reenvío de medios sin contexto.** Fotos, pantallazos y cualquier medio va siempre acompañado del bloque de contexto (SKU, nombre, fecha, procedimiento).

5. **El odontólogo y el laboratorio no son perfiles técnicos.** Los mensajes al grupo `Revisión de Casos` deben ser simples, claros y autocontenidos. Nunca asumir que recuerdan conversaciones anteriores.

6. **Los waits nocturnos son inteligentes.** Si el lead escribe en la madrugada, el bot gestiona la conversación pero no presiona al equipo humano fuera del horario operativo (08:00–21:00 hora local de la clínica).

7. **El depósito de $500 USD es el evento de conversión principal.** Todo el flujo está diseñado para llegar a ese punto. Ningún paso posterior a la Etapa 4 puede ejecutarse sin pago confirmado.

8. **PayPal usa Checkout API, no transferencia directa a correo.** Cada reserva genera un link único para trazabilidad contable.

9. **La imagen referencial de ángulos fotográficos debe cargarse desde `LUXE_PHOTO_GUIDE_URL`.** El cliente puede actualizar la imagen reemplazando el archivo en el hosting sin tocar el workflow.

10. **Los SKUs son el lenguaje común entre el bot y los humanos.** Deben ser generados al inicio de la Etapa 2, almacenados en `luxe_smile.leads`, e incluidos en toda comunicación hacia los grupos.

11. **El canal admin es exclusivo y silencioso para no autorizados.** Si un número no está en `ADMIN_PHONES`, el bot nunca revela que existe un canal de control — simplemente trata el mensaje como lead normal. Nunca responder "no tienes permiso" a un número desconocido.

12. **Los mensajes de disculpa a leads deben generarse en el idioma del lead**, no en el del admin. El admin siempre escribe en español; los leads pueden estar en inglés.

---

## 10. Credenciales requeridas en n8n

- `Evolution API — Luxe Smile`
- `PostgreSQL — LeadAI` (apunta a DB `leadai`, schema `luxe_smile`)
- `Google Calendar — Luxe Smile`
- `PayPal API — Luxe Smile` (Checkout API)
- `HTTP Request — CRM Luxe Smile` (webhook con API key)
- `Anthropic API — LeadAI`
- `Anthropic API — LeadAI (Admin)` *(puede ser la misma key, con prompt distinto)*

---

## 11. Checklist de go-live

- [ ] Número de WhatsApp Business conectado a Evolution API
- [ ] IDs de grupos WhatsApp (`Revisión de Casos` y `Confirmación de Pagos`) en `.env`
- [ ] PostgreSQL corriendo en el VPS con usuario `leadai_user` creado
- [ ] Schema `luxe_smile` creado y DDL ejecutado (`schemas/db-schema.sql`)
- [ ] Credencial PostgreSQL configurada en n8n y conexión probada
- [ ] Google Calendar con horario operativo configurado (bloquear slots nocturnos)
- [ ] PayPal API en modo producción con webhook activo
- [ ] CRM del cliente probado con payload de prueba
- [ ] `LUXE_PHOTO_GUIDE_URL` apuntando a imagen accesible públicamente
- [ ] Prompts del AI Agent probados en español e inglés
- [ ] Sistema de SKU probado (generación, INSERT en DB, parseo desde grupos)
- [ ] Wait de 90 segundos verificado en staging
- [ ] `ADMIN_PHONES` configurado con los números autorizados del cliente
- [ ] WF-07 probado: bloqueo de día, bloqueo de rango y cancelación por SKU
- [ ] Verificar que números no admin no activan el canal de control
- [ ] Mensaje de disculpa generado correctamente en inglés y español
- [ ] Manual entregado al odontólogo y al administrador (`docs/manual-grupos-whatsapp.md`)

---

## 12. Estado del proyecto (actualizado por Claude Code)

> Esta sección se actualiza automáticamente al final de cada sesión de trabajo.
> Última actualización: 2026-04-17

### Setup completado ✅

| Tarea | Detalle |
|---|---|
| Credenciales n8n | Evolution API (`QT0zn550ysJh8VpI`), PostgreSQL (`vzzTNppBFKg9XCiK`), Anthropic placeholder (`6a9Pt3vI39KsmCa0`) |
| Base de datos | Schema `luxe_smile` creado en DB `leadai` — 4 tablas + índices |
| Evolution API | Instancia `luxe-smile` creada (ID: `249619a4-cd96-49ea-867b-0a148c061d65`) — QR pendiente de escanear |
| **WF-01** | Captación y Calificación — ID: `CuBrhx5KucZ4mMXX` |
| **WF-02** | Revisión de Caso (Human Loop) — ID: `jeFR0qJOte0JuzTf` |
| **WF-03** | Cotización y Cierre — ID: `bUzKAIBYmJvNa1ME` |
| **WF-04** | Confirmación de Pago PayPal — ID: `k0RqPhnzM3ZjQeEe` |
| **WF-05** | Confirmación de Pago Manual — ID: `Jxc1UVPoK4mGJVHJ` |
| **WF-06** | Datos y Agendamiento — ID: `cgAXqzntirV1uDb5` |
| **WF-07** | Admin Control — ID: `aSy1GEWhtUzIHncw` |

### Pendientes bloqueantes (sin esto no se puede activar ningún workflow)

1. **Anthropic API key real** — la key provista era de OpenAI. Necesita `sk-ant-api03-...` desde console.anthropic.com. Actualizar credencial `6a9Pt3vI39KsmCa0` en n8n UI.
2. **Escanear QR de WhatsApp** — conectar el número de Luxe Smile a la instancia `luxe-smile` de Evolution API.
3. **Variables de entorno en n8n** — configurar en n8n → Settings → Environment Variables:
   - `EVOLUTION_API_URL` = `https://evolution.srv1398596.hstgr.cloud`
   - `EVOLUTION_INSTANCE_LUXE` = `luxe-smile`
   - `EVOLUTION_API_KEY` = `leadai2024secreto`
   - `ADMIN_PHONES` = `+573012661158`
   - `CLAUDE_MODEL` = `claude-opus-4-5`
   - `LUXE_PHOTO_GUIDE_URL` = (URL de la imagen guía — pendiente del cliente)
   - `DEPOSIT_AMOUNT_USD` = `500`
   - `RESERVATION_POLICY_DAYS` = `5`

### Pendientes no bloqueantes (para etapas posteriores)

- **Google Calendar OAuth** — configurar desde n8n UI cuando el cliente entregue acceso
- **PayPal API** — client ID + secret pendientes del cliente
- **IDs de grupos WhatsApp** — obtener después de conectar la instancia (`WHATSAPP_GROUP_CASOS`, `WHATSAPP_GROUP_PAGOS`)
- **CRM webhook real** — actualmente mockeado en `https://httpbin.org/post`
- **`LUXE_PHOTO_GUIDE_URL`** — imagen referencial de ángulos fotográficos