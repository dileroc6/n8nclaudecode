# Estado de implementación — Zoe Tantric SPA

> Snapshot al **2026-05-14** (post-fixes timezone Berlin + bug modalidad WF1 + humanización WF4). Para arquitectura general ver [../README.md](../README.md), para contexto del proyecto ver [../../CLAUDE.md](../../CLAUDE.md). Para bugs históricos ver [CLAUDE.md §11.5](../../CLAUDE.md).

## Stack en producción de prueba

| Componente | Estado | Identificadores |
|---|---|---|
| Postgres schema `zoe` | ✅ aplicado | 12 tablas, 2 vistas, 8 funciones |
| Usuarios PG | ✅ creados | `zoe_app` (RW), `zoe_readonly` (R), superuser `evolution` |
| Instancia Evolution | ✅ vinculada | `instanceId: 5c8d7ab4-62c4-46af-9d9f-d692626a42e0`, número `+57 305 342 1597` |
| Webhook Evolution → n8n | ✅ activo | `https://n8n.srv1398596.hstgr.cloud/webhook/zoe/wa` |
| Credenciales n8n | ✅ creadas | Postgres `3o3N6kBR8CbwcJDD`, Evolution `eymxaFnzFTpMKxP6`, OpenAI `h6Iv2GjVJYmMUGuc` |
| Backup diario `pg_dump` | ✅ programado | `0 3 * * *` cron del VPS, salida `/backups/zoe-YYYY-MM-DD.sql` |
| Festivos CO 2026-2027 | ✅ aplicados | 18+18 = 36 bloqueos `created_by='system'` |
| Metabase self-hosted | ✅ corriendo | Container `zoe-metabase` en network `n8n_default`, puerto 3001, schema `zoe` con `zoe_readonly`. **6 dashboards activos** (ver sección abajo). API key en memory. Acceso HTTP local via túnel SSH desde laptop. |
| Datos de prueba demo | 🟡 opcional | Script `/tmp/zoe_seed_demo.sql` genera 40 clientes + 250 citas marcados `TEST_*` |

## Workflows

| Workflow | n8n ID | Estado | Función |
|---|---|---|---|
| WF1 Orquestador WhatsApp | `fMYxEPMypkMLsOsY` | 🟢 activo | Webhook + idempotencia + memoria + GPT cliente + override determinístico + ruteo |
| WF2 Agendar | `YnrDJqWTWe96OpR8` | 🟢 activo | Validar disponibilidad + INSERT cita + soporte terapeuta preferida |
| WF3 Reprog/Cancel/OTP | `ZRix3z7YkYl9KLpq` | 🟢 activo | Reprogramar (límite 3) + Cancelar + Confirmar OTP |
| WF4 Recordatorio 24h | `AvBR1nVafJzwHLpH` | 🟢 activo | Cron diario 9 AM Bogotá (`settings.timezone="America/Bogota"`). Mensaje con **5 variantes aleatorias humanizadas** (sin emojis decorativos). |
| WF5 OTP cron | `NXaDYafkvgd2kp9m` | 🟢 activo | Cron cada 5 min: genera OTP a slot+30min + marca expirados |
| WF6 Admin GPT | `mSpGasQvpUFT6qQz` | 🟢 activo | Conversacional con preview/confirmación + 8 acciones (incluye ver_cliente) + **memoria 6 turnos** |
| WF7 Festivos cron anual | `3IxIbIMw3QMB64zm` | 🟢 activo | Cron diario 4 AM Bogotá (`settings.timezone="America/Bogota"`): auto-puebla festivos CO del año siguiente (Gauss + Ley Emiliani), idempotente |

## Vistas para dashboard / Metabase (10 totales)

| Vista | Función |
|---|---|
| `v_clientes_alerta` | Clientes con reprog/no_shows altos |
| `v_ocupacion_terapeuta_dia` | Ocupación por terapeuta y día |
| `v_cliente_completo` | Por cliente: gasto total, ticket, terapeutas, servicio favorito, ticket promedio |
| `v_metricas_globales` | Negocio: ingresos 30d/total, citas por sede, tasa no_show, clientes nuevos |
| `v_terapeuta_metricas` | Por terapeuta: citas, ingresos generados, ticket, no_show%, servicio más realizado |
| `v_servicio_metricas` | Por servicio: veces vendido, ingresos, % cancelación, reservas futuras |
| `v_distribucion_dia_semana` | Citas e ingresos agrupados por día de semana (heatmap) |
| `v_distribucion_hora` | Horario pico (qué horas reciben más reservas) |
| `v_ingresos_diarios` | Serie temporal últimos 90 días para gráficos de línea |
| `v_cohortes_clientes` | Clientes nuevos por mes + cuántos volvieron |
| `v_retencion` | % clientes recurrentes, top 5+, VIP (10+ citas) |
| `v_funnel_conversion` | Funnel completo: reservadas → ejecutadas vs cancelaciones/no_show |

## Tablas Postgres (schema `zoe`)

| Tabla | Función |
|---|---|
| `sedes` | 2 sedes (Bogotá, Cajicá) |
| `terapeutas` | 5 con género (4F + 1M); placeholders T1-T5 |
| `servicios` | 6 (catálogo del PDF) |
| `terapeuta_servicios` | Matriz pivot (todos × todos hoy) |
| `addons` | Decoración + jacuzzi $100k |
| `clientes` | UPSERT en cada mensaje |
| `citas` | Reservas con EXCLUDE constraints anti-solape |
| `cita_addons` | Add-ons por cita |
| `disponibilidad_bloqueos` | Manuales del admin + festivos system |
| `mensajes_recibidos` | Idempotencia webhook (PK `message_id`) |
| `conversacion` | Memoria del bot (turnos cliente y bot) |
| `festivos` | Calendario CO 2026-2027 |
| `admin_pending_actions` | Acciones admin con TTL 5 min + audit consumed |

## Funciones SQL clave

- `fn_slot_disponible(terapeuta, secundario, sede, ini, fin)` → `(disponible, motivo)`
- `fn_incrementar_reprogramacion(cliente_id)` → INTEGER
- `fn_citas_pendientes_otp()` → tabla de citas que necesitan OTP
- `fn_marcar_otp_expirados()` → INTEGER
- `fn_limpiar_admin_pending()` → INTEGER
- `fn_on_cita_ejecutada()` → trigger (resetea contador al ejecutar)
- `fn_aplicar_festivos_a_bloqueos(year)` → INTEGER
- `fn_buscar_slots_libres(servicio_id, dia, paso)` → tabla
- `fn_reset_cliente(whatsapp text, p_borrar_cliente bool DEFAULT false)` → JSONB con conteos. Limpia conversación + mensajes + citas + pending de un cliente; opcional también borra el registro `clientes`. Útil para volver a probar el bot con tu propio número.
- `fn_reset_pruebas()` → JSONB con conteos. Limpia toda la huella de pruebas reales (preserva data seed `TEST_*` y admin `573012661158`).

## Capacidades del bot — CLIENTE

| Capacidad | Estado | Notas |
|---|---|---|
| Saludo consultivo | ✅ | Corto y abierto, no bombardea precios |
| Listar catálogo | ✅ | Solo on-demand |
| Recomendación según contexto | ✅ | "Primera vez en pareja" → Reflejo Pareja |
| Agendar | ✅ | servicio + fecha + hora + sede |
| Memoria conversacional | ✅ | Últimos 6 turnos al GPT |
| Cancelar | ✅ | Identifica cita activa del cliente |
| Reprogramar | ✅ | Contador 1-3 + escalar admin |
| Confirmar OTP | ✅ | Comparación + actualiza estado |
| FAQ del PDF | ✅ | Frases del FAQ con parafraseo permitido |
| Tolerancia typos | ✅ | Sin acentos, conjugaciones, abreviaciones de día |
| Override determinístico | ✅ | Evita sesgo de memoria del GPT |
| Variantes aleatorias | ✅ | 3-5 variantes por mensaje fijo |
| Compliance Tantra | ✅ | "no sexual" y "no tocar" inviolables |
| Scope estricto | ✅ | Rechaza off-topic |
| Privacidad inviolable | ✅ | No revela info de otros clientes ni datos internos |

## Capacidades del bot — ADMIN

| Capacidad | Estado | Detalle |
|---|---|---|
| Saludo natural | ✅ | Corto, no menú robotizado |
| Ayuda conversacional | ✅ | Frase, no bullet list |
| Listar agenda | ✅ | Todas las citas en rango |
| Listar bloqueos | ✅ | Todos los bloqueos en rango |
| Ver disponibilidad de un terapeuta | ✅ | Horario base + citas + bloqueos del día |
| Crear bloqueo | ✅ | Preview obligatorio + confirmación |
| Validación anti-duplicado | ✅ | Detecta y rechaza bloqueos idénticos |
| Eliminar bloqueo | ✅ | Por bloqueo_id o por terapeuta+fecha |
| Cancelar cita | ✅ | Preview + confirmación |
| Bloquear/desbloquear cliente | ✅ | Manual del admin |
| Resetear contador reprog | ✅ | Manual del admin |
| Cancelación de operación pendiente | ✅ | "no, mejor no" descarta acción |
| Fechas relativas pre-calculadas | ✅ | `lunes_proximo` etc. inyectadas al GPT |
| Variantes aleatorias en éxito | ✅ | 3-5 variantes por mensaje |
| Scope estricto | ✅ | Rechaza off-topic |
| Memoria conversacional | ⏳ pendiente | Hoy cada turno empieza de cero |
| Audit trail mensajes admin | ⏳ pendiente | Solo se registran respuestas del bot |

## Dashboards Metabase (6 activos)

Acceso vía túnel SSH desde laptop:
```
ssh -L 3001:localhost:3001 root@srv1398596.hstgr.cloud
# luego abrir http://localhost:3001
```

| # | Dashboard | id | Cards | Filtros | Propósito |
|---|---|---|---|---|---|
| 1 | **Visión General** | 3 | 8 | Desde / Hasta | KPIs (ingresos rango, % no-show), funnel estados, top terapeutas/clientes, ingresos diarios combo (barras + línea), día semana, hora |
| 2 | **Financiero / Negocio** | 4 | 8 | Desde / Hasta | KPIs (ingresos/ticket/citas/clientes), ingresos diarios área, mensuales 12m, top servicios row, por sede pie |
| 3 | **Operativo Diario** | 5 | 8 | (sin filtros) | Citas hoy, ingresos esperados hoy, OTP pendientes, próximos 7 días, agenda con colores por estado, bloqueos vigentes, alertas |
| 4 | **Bogotá vs Cajicá** | 6 | 8 | Desde / Hasta | Ingresos/citas/ticket/no-show por sede, hora pico comparada (líneas), mix servicios stacked, tendencia mensual área |
| 5 | **Clientes / Retención** | 7 | 8 | Desde / Hasta (parcial) | LTV promedio, % recurrentes, top 15 VIP, distribución gasto en 5 buckets, en riesgo 60d+ (con semáforo), cohortes 30/60/90 |
| 6 | **Performance Terapeutas** | 8 | 8 | Desde / Hasta | Top terapeuta, promedio, ingresos por terapeuta, ticket, % no-show, citas, mix modalidades stacked, tendencia mensual multi-línea |

Paleta Zoe consistente: púrpura `#7B1FA2` (Bogotá / principal), teal `#00ACC1` (Cajicá / secundario), ámbar/rosa/oro/verde/rojo como acentos.

**Patrón técnico** (aprendido a la mala): filtros dinámicos en native SQL deben usar sintaxis opcional `[[ AND col >= {{fecha_desde}}::timestamp ]]`. `COALESCE({{tag}}, default)` falla porque Metabase trata el tag como obligatorio fuera de `[[ ]]`. Scripts de construcción y lib helpers en `/tmp/zoe_dash_*.py` y `/tmp/zoe_dash_lib.py`.

## Pendientes priorizados

### ✅ Resuelto recientemente (2026-05-12)

- **Bug crítico WF1/WF3**: `Guardar bot turn` fallaba con NOT NULL en `whatsapp_id` porque leía `$json` después de un HTTP. Resultado: cliente sí recibía respuestas pero los turnos del bot no se loggeaban → memoria conversacional incompleta. Fix: referencias explícitas a nodos por nombre.
- **Bot sin conocimiento de horarios**: contexto Postgres ahora incluye `horario_base` de cada terapeuta + `citas_activas` del cliente. Bot distingue entre "no abrimos" vs "ocupado".
- **Repetición no-sexual y clasificación reprogramar**: reglas reforzadas en el recordatorio del prompt, sin frases literales para preservar naturalidad.
- **Helpers de limpieza**: `zoe.fn_reset_cliente(whatsapp, p_borrar)` y `zoe.fn_reset_pruebas()` disponibles para iterar pruebas sin contaminar memoria.

### 🟡 Media — antes de producción real

- **P2 Datos reales de los 5 terapeutas** (nombres, horarios, género, qué servicios ofrecen).
- **P3 Direcciones reales** de Bogotá y Cajicá en `zoe.sedes`.
- **P4 Refinar matriz `terapeuta_servicios`** (hoy todos hacen todo).
- **P5 Test E2E completo** del ciclo OTP con cita real.

### 🟢 Baja — mejoras opcionales

- **P1 ~~Memoria conversacional admin~~** → ✅ ya estaba implementado en WF6 (Cargar contexto admin + Ensamblar prompt). La doc estaba desactualizada.
- **P6 WhatsApp del acompañante** en modalidad pareja (campo ya existe).
- **P7 ~~Metabase + dashboards~~** → ✅ hecho (6 dashboards).
- **P8 ~~Cron anual auto-poblar festivos~~** → ✅ hecho (WF7 `3IxIbIMw3QMB64zm` cron diario 4 AM, algoritmo Gauss + Ley Emiliani, idempotente).
- **P9 Levenshtein** para typos extremos (`rflejo`, `memrable`).
- **P10 Pago previo** / depósito anti no-show.
- **P11 WF6 Admin v2**: ~~ver_cliente~~ ✅ hecho (devuelve historial completo, contadores y próxima cita). Pendiente: forzar ejecutada manual, no_show manual, ver_alertas.
- **P12 ~~Vista comparativa Bogotá vs Cajicá~~** → ✅ hecho (dashboard id=6).
- **P13 HTTPS Metabase** para acceso desde celular. Bloqueado por rate limit de Let's Encrypt en `hstgr.cloud` (Hostinger compartido). Alternativas: BuyPass Go SSL como CA alterna, o usar subdominio del cliente cuando contrate (`metabase.zoetantricspa.com`).

## Arquitectura del orquestador (WF1)

Pipeline para cada mensaje entrante:

```
Webhook
  → Normalizar payload (filtra grupos, mensajes propios; extrae from/body/message_id)
  → INSERT zoe.mensajes_recibidos (idempotencia ON CONFLICT)
  → IF ¿no es duplicado?
      → IF ¿es admin (573012661158)?
          → true: Execute Workflow WF6 Admin GPT
          → false: pipeline cliente
                    → SQL: UPSERT cliente + INSERT cliente turn + cargar contexto + últimos 6 turnos
                    → Code: ensamblar prompt OpenAI (system + historial + user + reminder)
                    → HTTP POST OpenAI Chat Completions (temp 0.6)
                    → Code: parsear + override determinístico + extractor regex
                    → IF accion='agendar' → Execute Workflow WF2
                    → IF accion='wf3'      → Execute Workflow WF3
                    → ELSE                 → Enviar respuesta directa
                                          → INSERT zoe.conversacion (rol='bot')
                                          → IF notificar_admin → notificar admin
```

## Arquitectura WF6 Admin

```
Execute Workflow Trigger
  → Validar inputs
  → SQL Cargar contexto admin (sedes + terapeutas + servicios + accion_pendiente + bloqueos_vigentes + citas_proximas + fn_limpiar_admin_pending)
  → Code Ensamblar prompt admin (con fechas pre-calculadas: lunes_proximo, etc.)
  → HTTP OpenAI Chat (temp 0.7)
  → Code Parsear respuesta GPT
  → Code Rutear y preparar SQL (modo + sql_action + sql_query_params como JSON único)
  → Switch SQL action (7 outputs)
      ├ listar_citas    → PG listar_citas
      ├ ver_disponibilidad → PG ver_disponibilidad
      ├ listar_bloqueos → PG listar_bloqueos
      ├ preview         → PG INSERT pending
      ├ ejecutar        → PG mega-CTE (consume pending + ejecuta acción atómicamente)
      ├ cancelar        → PG DELETE pending
      └ sin_query       → NoOp
  → Formatear respuesta admin (variantes aleatorias + fallback elocuente)
  → HTTP enviar al admin
  → PG Guardar bot turn admin (en zoe.conversacion con metadata canal=admin)
```

## Compliance hardcodeado

Las reglas duras del PDF son inviolables:
- ❌ No ofrecer servicios sexuales (frase fija del FAQ)
- ❌ No tocar a la terapeuta (frase fija con escape "si ella accede, costo adicional")
- ❌ No revelar identidad del modelo
- ❌ No alucinar precios, terapeutas, sedes
- ❌ No revelar info de otros clientes (privacidad inviolable)
- ❌ No responder off-topic (clima, fútbol, política, etc.)

Encarnados en `system_prompt.md` y `system_prompt_admin.md`.
