# Zoe Tantric SPA — Backend de automatización n8n + WhatsApp

Backend de reservas para Zoe Tantric SPA (sedes Bogotá y Cajicá), integrado con n8n self-hosted (Hostinger) y Evolution API. Stack: Postgres (schema `zoe`), n8n, GPT-4o-mini, Evolution API, Metabase para dashboard admin.

## Estructura

```
spa-backend/
├── sql/
│   ├── 01_schema.sql       # Schema, tipos, tablas, EXCLUDE constraints, multi-sede
│   ├── 02_helpers.sql      # Funciones (fn_slot_disponible, fn_citas_pendientes_otp, ...) + triggers + vistas Metabase
│   └── 03_seed.sql         # Catálogo real del PDF (Reflejo, Memorable, Espectador) + sedes + addons
├── n8n-nodes/
│   ├── 01_validar_disponibilidad.js     # Pre-validación slot vs citas + bloqueos + horario (multi-sede + 2 terapeutas)
│   ├── 02_generar_otp.js                # OTP de check-in 4 dígitos (cron WF5, no al reservar)
│   ├── 03_verificar_reprogramaciones.js # Política límite 3
│   └── 04_evolution_payloads.js         # 7 tipos de mensaje WhatsApp (reserva_creada, checkin_otp, ejecutada, ...)
├── system_prompt.md        # Prompt GPT-4o-mini para CLIENTES — guardrails Tantra (no servicios sexuales) + FAQ del PDF
├── system_prompt_admin.md  # Prompt GPT-4o-mini para ADMIN — modo híbrido conversacional con confirmación
└── docs/
    └── IMPORT_GUIDE.md     # 5 workflows + Metabase + pruebas
```

## Decisiones clave

- **Schema aislado** (`zoe`) en el Postgres existente del VPS.
- **Multi-sede** (Bogotá + Cajicá) con tabla `sedes` y FK en `terapeutas`/`citas`.
- **EXCLUDE constraints** (terapeuta principal y secundario) impiden solapes a nivel BD.
- **OTP de check-in tardío**: se genera 30 min DESPUÉS de `slot_inicio`, expira 1h después. Workflow cron WF5. Si no llega respuesta → `no_show`.
- **Reset del contador de reprogramaciones** al pasar cita a `ejecutada` (trigger).
- **No auto-bloqueo**: solo alerta al admin vía Metabase para clientes con contador alto.
- **GPT-4o-mini con guardrails duros**: NO ofrece servicios sexuales, NO insinúa. FAQ del spa hardcodeado en el prompt.
- **Idempotencia webhooks** vía `mensajes_recibidos` (PK = `message_id` Evolution).
- **Catálogo modelado**: 6 servicios reales (Reflejo / Memorable / Espectador × individual / pareja) + add-on jacuzzi.

## Modelo de datos (resumen)

```
sedes ──┬──< terapeutas >──┬─< terapeuta_servicios >── servicios
        │                   │                              │
        └──< citas >────────┘                              │
              │                                            │
              ├── cliente                                  │
              ├── terapeuta_principal + secundario? ───────┘
              ├── servicio
              └── cita_addons >── addons

disponibilidad_bloqueos  (admin manual; sede o terapeuta o global)
mensajes_recibidos       (idempotencia webhook Evolution)
v_clientes_alerta        (vista Metabase: clientes con reprog/no_shows altos)
v_ocupacion_terapeuta_dia (vista Metabase: ocupación diaria)
```

## Workflows n8n

1. **WF1 Orquestador** — webhook Evolution → idempotencia → switch admin/cliente → GPT JSON → switch intent.
2. **WF2 Agendar** — busca terapeuta disponible, INSERT cita (estado=`reservada`, OTP=NULL), envía `reserva_creada`.
3. **WF3 Confirmar/Reprog/Cancelar** — gestiona OTP, reprogramación con `fn_incrementar_reprogramacion`, cancelación.
4. **WF4 Recordatorio 24h** — cron diario 9 AM, mensaje día anterior.
5. **WF5 OTP cron** — cada 5 min: genera OTP a citas con `slot_inicio + 30min` cumplido + marca expirados como `no_show`.

## Estado actual (2026-05-08)

### Workflows desplegados y activos en n8n

| Workflow | n8n ID | Versión |
|---|---|---|
| WF1 Orquestador | `fMYxEPMypkMLsOsY` | v10 |
| WF2 Agendar | `YnrDJqWTWe96OpR8` | v3 |
| WF3 Reprog/Cancel/OTP | `ZRix3z7YkYl9KLpq` | v2 |

### Funcionalidades adicionales implementadas (post-inicial)

- **Memoria conversacional**: tabla `zoe.conversacion` + carga de últimos 10 turnos al GPT como `messages` array.
- **Override determinístico de intent**: parser detecta palabras inequívocas (cancelar/mover/reflejo+fecha) y fuerza el intent correcto sobre el GPT, evitando que la memoria sesgue la clasificación.
- **Extractor regex de datos**: complementa lo que extrae el GPT con regex (servicio, fecha relativa, hora con AM/PM, sede). Funciona sobre texto normalizado (sin acentos, lowercase, sin puntuación).
- **Tolerancia a typos comunes**: `bogota` sin acento, `manana` sin ñ, conjugaciones (`cancelame`, `muévela`), abreviaciones de día (`sab`, `mart`).
- **Festivos colombianos**: tabla `zoe.festivos` + función `fn_aplicar_festivos_a_bloqueos(year)` para convertirlos en bloqueos automáticos.
- **system_prompt admin** (no aplicado todavía a workflow): modo conversacional con confirmación + 4 modos (lectura / preview / ejecutar / cancelar).

## Próximos pasos

| Prioridad | Pendiente |
|---|---|
| 🔴 alta | WF5 OTP cron (genera código check-in 30 min post-slot) |
| 🟡 media | WF4 Recordatorio 24h |
| 🟡 media | Aplicar festivos a bloqueos en producción |
| 🟡 antes de prod | Nombres y horarios reales de los 5 terapeutas |
| 🟡 antes de prod | Direcciones reales de las dos sedes |
| 🟡 antes de prod | Backup automático `pg_dump zoe` daily |
| 🟢 baja | WF1 admin GPT (hoy admin solo recibe dummy) |
| 🟢 baja | Metabase + dashboards |
| 🟢 baja | Levenshtein para typos extremos |
