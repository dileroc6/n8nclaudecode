# CLAUDE.md — Zoe Tantric SPA WhatsApp Bot
### Bot de reservas + check-in OTP | Tantra Spa Bogotá + Cajicá

> Fuente de verdad del proyecto Zoe para Claude Code.
> Contiene contexto de negocio, decisiones de arquitectura, restricciones críticas
> y políticas confirmadas con el cliente. No repetir este contexto en prompts individuales.

---

## 1. Identidad del cliente

| Campo | Valor |
|---|---|
| **Negocio** | Zoe Tantric SPA |
| **Industria** | Spa de masaje tántrico — terapias sensoriales (NO sexuales) |
| **Sedes** | Bogotá + Cajicá (sabana de Bogotá) |
| **Servicios** | Reflejo (lencería) / Memorable (desnudas) / Espectador — individual y pareja |
| **Add-ons** | Decoración romántica + jacuzzi ($100k) |
| **Niveles** | Principiante / Experto / Incógnito |
| **Idioma del bot** | Español colombiano neutro |
| **Web** | https://www.zoetantricspa.com |
| **WhatsApp Business** | `+57 305 342 1597` (instancia Evolution `zoe`) |
| **Admin (humano)** | `+57 301 266 1158` |

---

## 2. Reglas duras de compliance (NO transgredir)

Estas reglas son **innegociables** — vienen del PDF "PAREJAS EN ZOE" y de las FAQ del cliente. Cualquier cambio al system prompt debe preservarlas.

1. **NO ofrecemos servicios sexuales.** El bot nunca ofrece, negocia, ni insinúa. Si el cliente insiste tras 2 turnos, escala al admin.
2. **No tocar a la terapeuta.** Frase fija: "En nuestras terapias no es posible tocar a la terapeuta. Podrías hablar directamente con ella y, si accede, hay un costo adicional."
3. **Identidad del bot**: nunca decir "como modelo de IA". Es Zoe.
4. **Sin alucinación**: precios, servicios, terapeutas, sedes, horarios — todo viene del schema `zoe`. Si no está, pedir o devolver `requiere_db: true`.

---

## 3. Stack técnico

| Componente | Detalle |
|---|---|
| **Canal** | WhatsApp vía Evolution API v2 (instancia `zoe`) |
| **Orquestador** | n8n self-hosted (VPS Hostinger) |
| **IA** | OpenAI GPT-4o-mini con JSON mode (`response_format: json_object`) |
| **Base de datos** | PostgreSQL — schema dedicado `zoe` en la instancia compartida del VPS |
| **Dashboard admin** | Metabase self-hosted en VPS (container `zoe-metabase`, puerto 3001, network `n8n_default`) — **solo lectura** con `zoe_readonly`. Acceso vía túnel SSH `ssh -L 3001:localhost:3001 root@srv1398596.hstgr.cloud` o exponiendo el puerto |
| **Acciones admin** | Comandos WhatsApp parseados determinísticamente en WF1 (NO van al GPT) |
| **Pagos** | En sitio: efectivo / tarjeta / transferencia QR. NO hay pago online por ahora. |
| **Recordatorios** | Cron diario 9 AM Bogotá (24h antes de la cita) |
| **OTP de check-in** | Generado 30 min después de `slot_inicio`, expira 1h después |

---

## 4. Catálogo (PDF "PAREJAS EN ZOE")

| Servicio | Modalidad | Precio COP | Duración | Notas |
|---|---|---|---|---|
| Reflejo individual | individual | $250.000 | 60 min | Terapeuta en lencería |
| Reflejo pareja | pareja | $590.000 | 60 min | 1 o 2 terapeutas (mismo precio) |
| Memorable individual | individual | $320.000 | 60 min | Terapeuta desnuda |
| Memorable pareja | pareja | $660.000 | 60 min | 1 o 2 terapeutas |
| Espectador Reflejo | espectador | $410.000 | 60 min | Tú observas, no participas |
| Espectador Memorable | espectador | $480.000 | 60 min | Tú observas, no participas |
| Add-on jacuzzi | — | +$100.000 | — | Decoración romántica + jacuzzi |

Todas las terapias incluyen **estimulación manual** al final (definición del cliente: "estimulación en el área genital con las manos, de manera íntima"). Las parejas tienen opción de **15 min a solas** al final del masaje.

---

## 5. Modelo de datos (schema `zoe`)

```
sedes ──┬──< terapeutas (genero M/F) >──┬─< terapeuta_servicios >── servicios
        │                                │
        └──< citas >─────────────────────┘
              │
              ├── cliente_id              ──> clientes (contador_reprogramaciones, contador_no_shows, bloqueado)
              ├── terapeuta_id            (principal, NOT NULL)
              ├── terapeuta_secundario_id (opcional, para parejas con 2 terapeutas)
              ├── servicio_id
              ├── sede_id
              └── otp_code (NULLABLE — se genera 30 min DESPUÉS de slot_inicio)

cita_addons (m:n con addons)
disponibilidad_bloqueos (admin manual; sede y/o terapeuta y/o global)
mensajes_recibidos (idempotencia webhook Evolution; PK = message_id)
```

**Estados de cita**: `reservada → en_curso → ejecutada` (camino feliz).
También: `cancelada`, `reprogramada`, `no_show`.

**Vistas Metabase** (12 totales): `v_clientes_alerta`, `v_ocupacion_terapeuta_dia`, `v_cliente_completo`, `v_metricas_globales`, `v_terapeuta_metricas`, `v_servicio_metricas`, `v_distribucion_dia_semana`, `v_distribucion_hora`, `v_ingresos_diarios`, `v_cohortes_clientes`, `v_retencion`, `v_funnel_conversion`.

Detalles completos en [spa-backend/sql/01_schema.sql](spa-backend/sql/01_schema.sql).

---

## 6. Políticas de negocio confirmadas

| Política | Decisión | Implementación |
|---|---|---|
| **OTP timing** | Se genera 30 min DESPUÉS de `slot_inicio`, expira 1h después | `WF5 OTP cron` cada 5 min llama `fn_citas_pendientes_otp()` |
| **OTP propósito** | Check-in / validación de asistencia. Cliente lo recibe por WhatsApp y responde con el código → cita pasa a `ejecutada` | Si no responde en 1h → `fn_marcar_otp_expirados()` la pasa a `no_show` |
| **OTP por cita** | Cada cita tiene su propio código aunque sea el mismo cliente | `citas.otp_code` por fila |
| **Reprogramaciones** | Límite duro 3. Al 4º intento → `escalar_admin` | `clientes.contador_reprogramaciones` |
| **Reset contador** | Vuelve a 0 al pasar cita a `ejecutada` | Trigger `fn_on_cita_ejecutada` |
| **Contador vitalicio** | Se mantiene `contador_reprog_vitalicio` (nunca se resetea) | Solo informativo / alertas Metabase |
| **No-shows** | NO auto-bloqueo. Solo alerta al admin via Metabase | Vista `v_clientes_alerta` |
| **Bloqueo cliente** | Solo manual por comando del admin | `clientes.bloqueado=true` |
| **Recordatorios** | Solo 24h antes (no 2h) | `WF4 cron 9 AM Bogotá` |
| **Anticipación reserva** | Mismo día, sujeto a disponibilidad | Sin lógica adicional |
| **Métodos de pago** | Solo informativo (en sitio) | Campo `citas.metodo_pago` para registro post-ejecución |

---

## 7. Workflows n8n (5 piezas)

| Workflow | Trigger | Función |
|---|---|---|
| **WF1 Orquestador** | Webhook POST `/zoe/wa` | Idempotencia → switch admin/cliente → GPT JSON → switch intent |
| **WF2 Agendar** | Execute Workflow desde WF1 | Busca terapeuta disponible, INSERT cita, envía `reserva_creada` |
| **WF3 Confirm/Reprog/Cancel** | Execute Workflow desde WF1 | OTP, reprogramación con `fn_incrementar_reprogramacion`, cancelación |
| **WF4 Recordatorio 24h** | Cron `0 9 * * *` Bogotá | SELECT citas mañana → enviar recordatorio |
| **WF5 OTP cron** | Cron `*/5 * * * *` | Genera OTP a citas con `slot_inicio + 30 min`, marca expirados |

Detalles en [spa-backend/docs/IMPORT_GUIDE.md](spa-backend/docs/IMPORT_GUIDE.md).

---

## 8. Operación del admin (modo híbrido conversacional)

El admin opera en **lenguaje natural por WhatsApp**, NO con comandos rígidos. El flujo:

1. WF1 detecta `from == ADMIN_PHONES` → enruta a la rama admin (NO al system prompt del cliente).
2. Carga contexto admin: sedes, terapeutas, servicios, `accion_pendiente` activa (si existe).
3. Llama a GPT-4o-mini con [system_prompt_admin.md](spa-backend/system_prompt_admin.md).
4. GPT devuelve uno de 4 modos:
   - `lectura` → ejecuta query y responde directo.
   - `preview_confirmacion` → guarda `accion_pendiente` en `zoe.admin_pending_actions` (TTL 5 min) y envía preview.
   - `ejecutar` → confirma "sí", ejecuta la acción guardada, marca `consumed_at`, envía resultado.
   - `cancelar` → admin dijo "no", descarta la acción.

### Intents soportados

**Lectura (sin confirmación):**
- listar citas (rango / hoy)
- ver detalle de cita
- ver cliente (historial + contadores)
- ver disponibilidad de terapeuta o sede
- ver alertas (clientes con reprog/no_shows altos)
- ver bloqueos vigentes
- ayuda

**Escritura (con preview + confirmación):**
- crear / eliminar bloqueo
- cancelar cita
- forzar ejecutada (si OTP falló)
- forzar no_show
- bloquear / desbloquear cliente
- resetear contador de reprogramaciones

### Ejemplo de interacción

```
Admin: bloquea a maria mañana 2 a 5 está enferma

Bot:   Voy a registrar este bloqueo:
       • Terapeuta: María García (Bogotá)
       • Inicio:    viernes 8 mayo, 2:00 PM
       • Fin:       viernes 8 mayo, 5:00 PM
       • Motivo:    enferma

       ¿Confirmas? *sí* o *no*

Admin: si

Bot:   ✅ Bloqueo blk-7a9f registrado. 2 citas afectadas:
       • c-12 (Juan P., 3 PM Reflejo) → cancelar manualmente
       • c-15 (Laura M., 4 PM Memorable) → cancelar manualmente
```

Ambigüedades: si dice "María" y hay 2, el bot pregunta cuál antes de generar preview. Si la `accion_pendiente` expira (5 min sin confirmar), el siguiente "sí" se ignora y se trata como ruido.

---

## 9. Estructura del proyecto

```
Zoe/
├── CLAUDE.md           ← este archivo
├── README.md
├── .env                ← gitignored, credenciales reales
├── .env.example        ← template para nuevos environments
├── .mcp.json           ← MCP server n8n
├── .gitignore
├── .claude/
│   └── settings.json   ← permissions específicas del proyecto
└── spa-backend/        ← artifacts de ingeniería (importables a n8n + Postgres)
    ├── sql/            ← 01_schema.sql, 02_helpers.sql, 03_seed.sql
    ├── n8n-nodes/      ← Code nodes JS para los workflows
    ├── system_prompt.md ← prompt GPT-4o-mini
    ├── README.md
    └── docs/
        └── IMPORT_GUIDE.md
```

---

## 10. Convenciones del proyecto

- **Nombres de workflow en n8n**: `Zoe — WF1 Orquestador WhatsApp`, `Zoe — WF2 Agendar`, etc.
- **Tags en n8n**: `zoe`, `tantra-spa`, y por tipo (`webhook`, `cron`, `agendar`).
- **Credenciales en n8n**: prefijo `Zoe — ` (ej. `Zoe — Postgres`, `Zoe — Evolution`, `Zoe — OpenAI`).
- **Modo n8n Code node**: salvo excepción, usar "Run Once for All Items" (consistente con los archivos en `n8n-nodes/`).
- **Zona horaria**: `America/Bogota` en todo el sistema. Crons configurados con TZ explícita.

---

## 11. Estado de implementación (actualizado 2026-05-08)

### Infraestructura — ✅ completa

- [x] Schema Postgres `zoe` aplicado (11 tablas, 2 vistas, 7 funciones, datos seed).
- [x] Tabla `zoe.conversacion` con memoria conversacional (cliente y bot turns).
- [x] Tabla `zoe.festivos` con calendario CO 2026-2027 + función `fn_aplicar_festivos_a_bloqueos()`.
- [x] Helpers de testing: `zoe.fn_reset_cliente(whatsapp, p_borrar_cliente)` y `zoe.fn_reset_pruebas()` para limpiar historial entre pruebas (preservan seed `TEST_*` y admin).
- [x] Usuarios Postgres dedicados: `zoe_app` (CRUD schema zoe), `zoe_readonly` (SELECT, para Metabase).
- [x] Instancia Evolution `zoe` (instanceId `5c8d7ab4-62c4-46af-9d9f-d692626a42e0`) creada y vinculada al `+57 305 342 1597`.
- [x] Webhook Evolution → n8n configurado (`/zoe/wa`).
- [x] Credenciales en n8n:
  - `Zoe — Postgres` → ID `3o3N6kBR8CbwcJDD` (usuario `zoe_app`)
  - `Zoe — Evolution` → ID `eymxaFnzFTpMKxP6` (Header Auth)
  - `OpenAi account` → ID `h6Iv2GjVJYmMUGuc`
- [x] `ADMIN_PHONES=573012661158` y `ZOE_WHATSAPP_BUSINESS=573053421597` en `.env`.

### Workflows desplegados — ✅ funcionales

| Workflow | n8n ID | Funciones |
|---|---|---|
| **WF1 Orquestador** | `fMYxEPMypkMLsOsY` | Webhook + idempotencia + memoria conversacional (6 turnos) + GPT-4o-mini cliente + override determinístico + tolerancia typos + ruteo a WF2/WF3/WF6. **Contexto inyectado al GPT**: clientes, servicios, addons, sedes, terapeutas con `horario_base`, `citas_activas` del cliente (evita alucinar citas previas), `cita_pendiente_otp`. |
| **WF2 Agendar** | `YnrDJqWTWe96OpR8` | Validar disponibilidad + INSERT cita + soporte terapeuta preferida + alternativas |
| **WF3 Reprog/Cancel/OTP** | `ZRix3z7YkYl9KLpq` | Reprogramar (límite 3) + Cancelar + Confirmar OTP |
| **WF4 Recordatorio 24h** | `AvBR1nVafJzwHLpH` | Cron diario 9 AM Bogotá, mensaje a citas del día siguiente |
| **WF5 OTP cron** | `NXaDYafkvgd2kp9m` | Cron cada 5 min: genera OTP a slot+30min + marca expirados |
| **WF6 Admin GPT** | `mSpGasQvpUFT6qQz` | Conversacional admin con preview/confirmación: listar_citas, listar_bloqueos, ver_disponibilidad, **ver_cliente** (historial + contadores + próxima cita), crear_bloqueo (anti-duplicado), eliminar_bloqueo, cancelar_cita, bloquear/desbloquear cliente, reset_reprog. Variantes aleatorias + fechas pre-calculadas. **Memoria conversacional admin activa** (carga últimos 6 turnos de `zoe.conversacion` con `canal=admin` y los inyecta como `messages[]` al GPT). |
| **WF7 Festivos cron anual** | `3IxIbIMw3QMB64zm` | Cron diario 4 AM Bogotá. Computa festivos colombianos del año siguiente con algoritmo Gauss (Pascua) + Ley Emiliani. Inserta en `zoe.festivos` ON CONFLICT DO NOTHING (idempotente). Aplica como bloqueos `created_by=system` via `fn_aplicar_festivos_a_bloqueos(year)`. Notifica al admin solo si hubo inserts. |

### Funcionalidades validadas en pruebas

**Cliente:**
- [x] Saludo consultivo (no bombardea precios)
- [x] Catálogo on-demand
- [x] Agendar con datos completos (servicio + fecha + hora + sede)
- [x] Memoria conversacional — info en partes
- [x] Cancelar cita
- [x] Reprogramar con contador 1-3 + escalar al 4° intento
- [x] FAQ del PDF (no sexual, no tocar terapeuta, sedes, métodos pago)
- [x] Tolerancia a typos (sin acentos, conjugaciones, abreviaciones)
- [x] Override determinístico contra sesgo de memoria GPT
- [x] Variantes aleatorias en respuestas (3-5 por mensaje)
- [x] Scope estricto: rechaza off-topic
- [x] Privacidad inviolable: no revela info de otros clientes ni datos internos

**Admin:**
- [x] Saludo y ayuda conversacionales (sin menús de bullets)
- [x] Listar agenda + listar bloqueos + ver disponibilidad de un terapeuta
- [x] Crear bloqueo con preview + confirmación + anti-duplicado
- [x] Eliminar bloqueo (por id o por terapeuta+fecha)
- [x] Cancelar cita / bloquear cliente / desbloquear / reset reprog
- [x] Cancelación de operación pendiente ("no, mejor no")
- [x] Fechas relativas pre-calculadas (lunes_proximo, etc.)
- [x] Variantes aleatorias en mensajes de éxito
- [x] Scope estricto

### Metabase — ✅ desplegado con 6 dashboards

Container `zoe-metabase` (network `n8n_default`, puerto 3001). Acceso vía túnel SSH desde laptop:
`ssh -L 3001:localhost:3001 root@srv1398596.hstgr.cloud` → `http://localhost:3001`.

| Dashboard | id | Cards | Filtros | Propósito |
|---|---|---|---|---|
| **Visión General** | 3 | 8 | Desde / Hasta | KPIs, funnel estados, top terapeutas/clientes, ingresos diarios combo, día semana, hora |
| **Financiero / Negocio** | 4 | 8 | Desde / Hasta | KPIs (ingresos/ticket/citas/clientes), ingresos diarios área, mensuales 12m, top servicios, por sede pie |
| **Operativo Diario** | 5 | 8 | (sin filtros) | Citas hoy, OTP pendientes, agenda con colores por estado, bloqueos, alertas |
| **Bogotá vs Cajicá** | 6 | 8 | Desde / Hasta | Ingresos/citas/ticket/no-show por sede, hora pico comparada, mix stacked, tendencia mensual |
| **Clientes / Retención** | 7 | 8 | Desde / Hasta (parcial) | LTV, % recurrentes, top VIP, distribución gasto, en riesgo 60d+, cohortes 30/60/90 |
| **Performance Terapeutas** | 8 | 8 | Desde / Hasta | Top, promedio, ingresos, ticket, no-show, citas, mix modalidades, tendencia mensual |

Paleta Zoe: púrpura `#7B1FA2` (Bogotá) + teal `#00ACC1` (Cajicá) + ámbar/rosa/oro como acentos.

**Patrón aprendido**: filtros dinámicos en native SQL deben usar sintaxis opcional `[[ AND col >= {{fecha_desde}}::timestamp ]]`. `COALESCE({{tag}}, default)` falla porque Metabase trata el tag como obligatorio fuera de `[[ ]]`. Lib helpers en `/tmp/zoe_dash_lib.py`.

### Pendientes

| # | Pendiente | Prioridad |
|---|---|---|
| P1 | ~~Memoria conversacional admin~~ → ✅ ya estaba implementado en WF6 (`Cargar contexto admin` inserta turno + carga últimos 6, `Ensamblar prompt admin` los inyecta en `messages[]`) | ✅ |
| P2 | Nombres y horarios reales de los 5 terapeutas (placeholders T1-T5) | 🟡 antes de prod |
| P3 | Direcciones reales de Bogotá y Cajicá | 🟡 antes de prod |
| P4 | Refinar matriz `terapeuta_servicios` (hoy todos hacen todo) | 🟡 antes de prod |
| P5 | Test E2E completo del ciclo OTP en producción real | 🟡 antes de prod |
| P6 | Captura del WhatsApp del acompañante en modalidad pareja | 🟢 baja |
| P7 | ~~Metabase + dashboards admin de solo lectura~~ → ✅ hecho (6 dashboards) | ✅ |
| P8 | ~~Cron anual auto-poblar festivos~~ → ✅ hecho (WF7 `3IxIbIMw3QMB64zm` cron diario 4 AM, algoritmo Gauss+Ley Emiliani, idempotente) | ✅ |
| P9 | Levenshtein para typos extremos (`rflejo`, `memrable`) | 🟢 baja |
| P10 | Pago previo / depósito anti no-show | 🟢 baja |
| P11 | WF6 Admin v2: ~~ver_cliente~~ ✅ hecho · pendiente: forzar ejecutada manual, no_show manual, ver_alertas | 🟢 baja |
| P12 | ~~Vista comparativa Bogotá vs Cajicá~~ → ✅ hecho (dashboard id=6) | ✅ |
| P13 | HTTPS Metabase para acceso desde celular (bloqueado por rate limit LE en `hstgr.cloud`; alternativas: BuyPass Go SSL o subdominio del cliente cuando contrate) | 🟢 baja |

---

## 11.5 Bugs resueltos (2026-05-12)

- **$json post-HTTP nuking de datos** (WF1 + WF3): los nodos `Guardar respuesta bot` (WF1) y `Guardar bot turn` (WF3) leían `$json.cliente_whatsapp` del nodo previo, pero ese nodo era el HTTP a Evolution que sobrescribía `$json` con la respuesta del API → INSERT fallaba con NOT NULL violation. Fix: usar referencia explícita `$('Parsear respuesta GPT').first().json.X` y `$('Construir respuesta').first().json.X`. **Lección general**: en Zoe (y cualquier flujo con HTTP intermedio), siempre referenciar nodos por nombre, nunca confiar en `$json` después de un HTTP Request.
- **Bot no conocía horarios**: contexto solo enviaba `id/nombre/genero/sede_id` de terapeutas. Fix: agregar `horario_base` al SELECT y al `userMessage` del prompt. El system prompt instruye al bot a distinguir entre "fuera de horario" (cerrado) y "dentro de horario pero ocupado" (ofrecer alternativas).
- **Bot alucinaba citas previas → clasificaba agendar como reprogramar**: faltaba info de citas activas del cliente. Fix: nuevo campo `citas_activas` en el contexto Postgres (citas reservada/en_curso futuras) inyectado como `citas_activas_cliente` al GPT. Regla agregada: si la lista está vacía, NUNCA es reprogramar.
- **Repetición innecesaria "no servicios sexuales"**: el system prompt no especificaba que la frase es de UN turno. Fix: regla explícita en el recordatorio final — solo decirla si el cliente la trae en ESE turno, no porque salió antes en el historial.
- **Recordatorio reescrito sin frases literales**: la primera versión tenía textos hardcoded ("No abrimos a esa hora, atendemos de 10am a 10pm") que el GPT podía replicar verbatim → robotizaba el bot. Fix: dar el **intent** (qué decisión tomar) sin **prescribir el texto** (cómo redactar). El bot mantiene su naturalidad.

## 12. Riesgos / decisiones a discutir

- **Race condition en INSERT cita**: el `EXCLUDE constraint` cubre el caso. Hay que capturar `errcode 23P01` y reintentar con siguiente terapeuta. Configurar "Continue On Fail" en n8n.
- **Notificación al acompañante de pareja**: campo `pareja_acompanante_whatsapp_id` existe en `citas` pero el flujo de captura/envío se diseña en una segunda iteración.
- **Pago previo (anti no-show)**: hoy todo es en sitio. Si se requiere depósito por adelantado, agregar pasarela (PayPal o similar) en una iteración futura.
- **Multi-instancia Evolution**: si Cajicá necesita su propio número, agregar `EVOLUTION_INSTANCE_CAJICA` y enrutar por sede en el outbound.

---

## 13. Memoria de Claude Code

Este proyecto tiene memoria activa en `~/.claude/projects/-home-dileroc-Documentos-Chango-Proyectos-N8N-ClaudeCode/memory/`. Entradas relevantes:

- `zoe_spa_project.md` — contexto principal Zoe (catálogo, políticas, decisiones).
- `nano_banana_credencial_transversal.md` — credenciales Gemini compartidas BF/BC (no aplica a Zoe que usa OpenAI).
- `n8n_error_path_patterns.md` — patrones de Error Trigger en n8n (aplica al diseño de WF1-WF5).
- `n8n_execution_mode_test.md` — `$execution.mode='test'` en Code nodes (aplica al testing local).
