# Plan de integración con CRM Cima Labs

> Documento vivo. Última actualización: 2026-05-19
> Source: API documentada en `https://panelcml.cimalabs.cloud/api-docs` (base real: `https://ayozqkwmpwdqxiggvrnq.supabase.co/functions/v1/api-v1`)

---

## Resumen de decisiones de diseño

| Decisión | Elegida | Alternativas descartadas |
|---|---|---|
| **¿Cuándo creamos el lead en el CRM?** | **Híbrido** — recién en Etapa 3 cuando el odontólogo dice `VIABLE` | A: incremental desde el "hola" (ensucia CRM con leads basura) · B: solo al cerrar (pierde visibilidad de embudo) |
| **¿Quién es source of truth de qué dato?** | **Local delgado + CRM dueño del negocio** — `luxe_smile.leads` guarda solo estado conversacional; CRM guarda monto/procedimientos/agenda/datos personales | B: duplicar todo (sincronización pesadilla) · C: eliminar DB local (bot dependería del uptime de Cima Labs) |
| **¿Quién manda en la disponibilidad de agenda?** | **Google Calendar = disponibilidad real · CRM `/agenda` = log de citas registradas** | Solo CRM: no tiene horarios laborales ni slots, solo registra fechas — confirmar con Cima Labs (Fase 0) |

---

## Modelo de datos resultante

```sql
-- luxe_smile.leads (versión slim post-migración)
sku             VARCHAR(10)   -- inventado por el bot (0042)
phone           VARCHAR(30)   -- teléfono WhatsApp
name            VARCHAR(120)  -- nombre detectado por el bot (puede diferir del CRM)
language        CHAR(2)       -- 'en' o 'es'
estado          VARCHAR(30)   -- máquina de estados del bot
crm_lead_id     BIGINT        -- devuelto por POST /leads (Fase 2)
crm_paciente_id BIGINT        -- devuelto por POST /pacientes (Fase 3)
created_at, updated_at

-- DEPRECATED (se eliminan en Fase 6):
-- cotizacion_usd, mes_preferido, payment_method, deposit_paid,
-- first_name, last_name, email, phone_full, calendar_event_id, crm_draft_id

-- Tablas que se quedan locales SIN cambio:
-- luxe_smile.mensajes        (historial conversacional para el AI Agent)
-- luxe_smile.pagos           (trazabilidad local de pagos)
-- luxe_smile.agenda_bloques  (bloqueos del admin WF-07)
```

| Dato | Local | CRM |
|---|---|---|
| SKU, teléfono, idioma, estado del bot | ✅ | — |
| Historial de mensajes | ✅ | — |
| Bloqueos de agenda (admin) | ✅ | — |
| Nombre, email, fecha nac., identificación | — | ✅ |
| Monto, procedimientos, closer, fuente | — | ✅ |
| Fechas (cita1, cita2, llegada, despegue) | — | ✅ + Google Calendar |
| Pagos confirmados | ✅ (trazabilidad) | ✅ (`monto_deposito`, `deposito_transaction_id`) |

---

## API CRM — referencia rápida

**Base URL:** `https://ayozqkwmpwdqxiggvrnq.supabase.co/functions/v1/api-v1`
**Auth:** `Authorization: Bearer $KEY` · **Rate limit:** 60 req/min/IP
**Respuesta éxito:** `{ "ok": true, "data": { "items": [...] } }` para colecciones · `{ "ok": true, "data": {...} }` para singulares
**Respuesta error:** `{ "ok": false, "error": {...} }`

> ⚠️ **Hallazgos del smoke test (2026-05-19):**
> - **Colecciones** vienen envueltas en `data.items` (no `data` plano). Usar `{{ $json.data.items }}`.
> - **Recursos singulares** (`GET /leads/:id`, `POST /leads`, `PATCH /leads/:id`) devuelven `data` directo, sin `items`.
> - **Los IDs son UUID** (ej: `612b5a57-93ce-442d-a0d1-7728a960b4ac`), no enteros. Schema local usa `UUID` para `crm_lead_id` y `crm_paciente_id`.
>
> ⚠️ **Hallazgos del workflow de exploración (2026-05-19):**
> - `/agenda` NO valida horarios laborales ni cupos — acepta fechas absurdas (probado con `2099-12-31`). Confirma que **Google Calendar debe seguir siendo source of truth de disponibilidad**.
> - `POST /agenda { lead_id, tipo, fecha }` no crea un evento separado: actualiza directamente el campo `fecha_cita1/2/llegada/despegue` del lead.
> - `closer` espera el string exacto del nombre (ej: `"Hernan Lopez"`), no un id.
> - `pipeline_stage: "Cotizado"` aceptado en PATCH (responde parcialmente pregunta 20 del cuestionario).
> - Defaults al crear lead sin esos campos: `pipeline_stage: null`, `status: null`, contadores=0, booleanos=false, arrays=[].
> - Campos descubiertos no documentados: `unidad_negocio`, `status` (separado de `pipeline_stage`), `pagaduria`, `comision_cobrada`, `fotos_antes/rx/despues`, `foto_perfil`, `collab`, `organico`, `referido`, `ads`, `codigo_referido`, `ad_reference_id`, `pais_origen`, `ciudad_origen`, `deposito_transaction_id`.

| Recurso | Endpoints |
|---|---|
| Leads (no cerrados) | `GET /leads`, `GET /leads/search?q=`, `GET /leads/:id`, `POST /leads`, `PATCH /leads/:id`, `DELETE /leads/:id` |
| Pacientes (cerrados) | `GET /pacientes`, `POST /pacientes` |
| Agenda | `GET /agenda`, `POST /agenda`, `PATCH /agenda/:lead_id`, `DELETE /agenda/:lead_id` |
| Stats | `GET /stats/sales`, `GET /stats/agendados`, `GET /stats/atendidos`, `GET /stats/resumen` |
| Recordatorios | `GET/POST/PATCH/DELETE /recordatorios` |
| Llamadas | `GET/POST/PATCH/DELETE /llamadas` |
| Tags | `GET /tags`, `POST /leads/:id/tags`, `DELETE /leads/:id/tags/:tag_id` |
| Aux | `GET /closers`, `GET /health` (sin auth) |

### Campos de `POST /pacientes`
- **Identidad:** `nombre, telefono, email, instagram, closer, fuente`
- **Cierre:** `monto_negociado, comision_cierre, fecha_cierre`
- **Depósito:** `monto_deposito, metodo_deposito, deposito_transaction_id, reservo_con_deposito`
- **Agenda:** `fecha_cita1, fecha_cita2, fecha_llegada, fecha_despegue`
- **Hotel/transfer:** `hotel_asignado, hotel_reservado, travel_package, driver_package`
- **Personales:** `fecha_nacimiento, numero_identificacion, notas`
- **Procedimientos (enteros):** `carillas_superiores, carillas_inferiores, coronas, puente_superior, puente_inferior, fillings, caries_pequena, caries_grande, root_canal, remocion_resina, remocion_porcelana, remocion_braces, exodoncia`

---

## Mapeo etapa → endpoint del CRM

| Etapa | Workflow | Acción CRM |
|---|---|---|
| 1 — Captación | WF-01 | *(nada — bot maneja todo local)* |
| 2 — Calificación (fotos) | WF-01 | *(nada — bot maneja todo local)* |
| **3 — VIABLE del odontólogo** | **WF-02** | **`POST /leads` con `{ nombre, telefono, fuente, closer, monto_negociado, <procedimientos>, notas, pipeline_stage:"Cotizado" }` → guardar `crm_lead_id`** |
| 4 — Lead elige mes | WF-03 | `PATCH /leads/{crm_lead_id} { fecha_cita1: <tentativa> }` |
| 5 — Depósito confirmado | WF-04 / WF-05 | `POST /pacientes` con paquete completo → guardar `crm_paciente_id` |
| 6 — Datos finales | WF-06 | `PATCH /leads/{crm_paciente_id} { email, fecha_nacimiento, numero_identificacion }` |
| 7 — Agendamiento definitivo | WF-06 | `POST /agenda { lead_id, tipo:"cita1"|"llegada"|"despegue", fecha }` (uno por fecha) **+** evento en Google Calendar |
| Admin — consultas | WF-07 | `GET /stats/resumen`, `/stats/agendados`, `/agenda`, `/leads/:id` |

---

# Plan de trabajo

## Fase 0 — Setup, validación y preguntas pendientes

### F0.1 — Pedir API key a Cima Labs ⏳ bloqueante
Necesitamos la API key real para todas las fases siguientes.

### F0.2 — Preguntas a Cima Labs ⭐ ⏳ bloqueante de diseño

**Sobre agendamiento y disponibilidad:**
- ¿El endpoint `/agenda` tiene noción de **disponibilidad** (slots ocupados/libres) o es solo un log de "qué paciente tiene qué fecha"?
- ¿Hay algún endpoint tipo `GET /agenda/disponibilidad?from=...&to=...` que devuelva fechas/slots disponibles?
- ¿El CRM gestiona **horarios laborales** de la clínica (días/horas de atención)? ¿O las fechas en `/agenda` admiten cualquier valor sin validación?
- ¿Hay un **límite de pacientes** por día/semana configurado en el CRM (cupos), o el CRM acepta cuantas citas se le manden para la misma fecha?
- ¿`POST /agenda` valida que la fecha no choque con otra ya registrada para el mismo closer, o permite overlap?
- ¿Existe algún mecanismo para **bloquear rangos de fechas** desde el CRM (vacaciones, días no laborales)? El WF-07 admin lo necesita.

**Sobre el ciclo de vida lead → paciente:**
- Cuando hacemos `POST /pacientes` después de tener un lead creado con `POST /leads`, ¿debemos:
  - (a) pasar el `lead_id` para que el CRM lo "promueva" automáticamente,
  - (b) hacer `DELETE /leads/:id` manualmente después del POST `/pacientes`, o
  - (c) el CRM detecta el duplicado por teléfono y resuelve solo?
- ¿`POST /pacientes` devuelve un `id` propio (`paciente_id`) distinto al `lead_id`, o reutiliza el mismo identificador?

**Sobre el closer del bot:** ⭐ bloqueante para F2
- Los leads que genera el bot **no deben asignarse a un humano** (Hernan/Joshe/Mariana) porque el bot hace todo el trabajo y luego un humano coordina el seguimiento desde otro paso del flujo.
- ¿Podemos pedir que creen un closer especial llamado `"Bot"`, `"Sistema"` o `"Luxe Smile Bot"` en el CRM, sin WhatsApp asociado, para usarlo como dueño de los leads autogenerados?
- ¿O hay alguna semántica del API que represente "creado automáticamente" — por ejemplo `closer: null`, omitir el campo, o un closer reservado?
- ¿Es posible **reasignar** un lead a un closer humano después (PATCH `/leads/:id { closer: "Hernan Lopez" }`) cuando alguien humano tome el caso?

**Sobre integración Google Calendar:**
- ¿El CRM tiene integración nativa con Google Calendar (lee/escribe eventos), o queda 100% a cargo de n8n sincronizar ambos lados?

**Otros:**
- ¿El campo `closer` en `POST /leads` debe ser el `nombre` exacto del closer (`"Hernan Lopez"`) o un id? `GET /closers` ayuda a saberlo.
- ¿Qué valores admite `fuente`? (vemos `"WhatsApp"` en el ejemplo, pero ¿hay un enum?)
- ¿Qué valores admite `pipeline_stage` para leads? Vemos `"Cotizado"`, `"Cerrado"`, pero queremos el enum completo.
- ¿Webhooks salientes del CRM? Si el cliente edita un paciente desde su panel (cambia fecha, monto, etc.), ¿hay forma de que n8n se entere o tenemos que hacer polling?

### F0.3 — Crear credencial en n8n
- Tipo: **Header Auth** (no Bearer Token genérico de n8n — más limpio).
- Nombre: `CRM Cima Labs — Luxe Smile`
- Header: `Authorization` = `Bearer <API_KEY>`

### F0.4 — Variables de entorno en n8n
- `CRM_BASE_URL` = `https://ayozqkwmpwdqxiggvrnq.supabase.co/functions/v1/api-v1` ✅ listo para configurar
- `CRM_CLOSER_DEFAULT` = ⛔ **bloqueado** — decisión del cliente: el bot NO debe asignar leads a un closer humano. Esperando respuesta de Cima Labs sobre crear un closer especial `"Bot"`/`"Sistema"` (ver F0.2).
- Closers actuales reportados por `GET /closers` (2026-05-19): `Hernan Lopez (+17274234213)`, `Joshe Diaz (+13232978870)`, `Mariana Cambas (sin WhatsApp)`.

### F0.5 — Workflow de smoke test (desechable)
Crear `Luxe Smile — CRM Smoke Test`:
1. `GET /health` → debe responder 200 sin auth
2. `GET /closers` con auth → listar closers válidos
3. `GET /leads/search?q=+573000000000` con auth → debe responder 200 con `data: []`
Si los 3 pasan, la integración está lista para implementar.

---

## Fase 1 — Migración del schema local

### F1.1 — Migración SQL
```sql
ALTER TABLE luxe_smile.leads
  ADD COLUMN crm_lead_id     BIGINT,
  ADD COLUMN crm_paciente_id BIGINT;

CREATE INDEX idx_leads_crm_lead     ON luxe_smile.leads(crm_lead_id);
CREATE INDEX idx_leads_crm_paciente ON luxe_smile.leads(crm_paciente_id);

-- Marcar columnas deprecated (NO borrar todavía — se eliminan en Fase 6)
COMMENT ON COLUMN luxe_smile.leads.cotizacion_usd     IS 'DEPRECATED — vive en CRM (monto_negociado)';
COMMENT ON COLUMN luxe_smile.leads.mes_preferido      IS 'DEPRECATED — vive en CRM';
COMMENT ON COLUMN luxe_smile.leads.payment_method     IS 'DEPRECATED — vive en CRM (metodo_deposito)';
COMMENT ON COLUMN luxe_smile.leads.deposit_paid       IS 'DEPRECATED — derivar de CRM (reservo_con_deposito)';
COMMENT ON COLUMN luxe_smile.leads.first_name         IS 'DEPRECATED — vive en CRM (nombre)';
COMMENT ON COLUMN luxe_smile.leads.last_name          IS 'DEPRECATED — vive en CRM (nombre)';
COMMENT ON COLUMN luxe_smile.leads.email              IS 'DEPRECATED — vive en CRM';
COMMENT ON COLUMN luxe_smile.leads.phone_full         IS 'DEPRECATED — vive en CRM (telefono)';
COMMENT ON COLUMN luxe_smile.leads.calendar_event_id  IS 'DEPRECATED — Google Calendar es source of truth';
COMMENT ON COLUMN luxe_smile.leads.crm_draft_id       IS 'DEPRECATED — reemplazado por crm_lead_id';
```

### F1.2 — Actualizar `LuxeSmile/CLAUDE.md`
- Sección 6: reflejar el modelo slim.
- Sección 4 (Etapa 6): nota que el "webhook al CRM del cliente" ya no es un webhook único — son llamadas REST distribuidas en cada etapa.

### F1.3 — Actualizar `LuxeSmile/schemas/db-schema.sql`
Sincronizar el DDL del repo con lo aplicado en la DB real.

---

## Fase 2 — WF-02: crear lead en CRM cuando el odontólogo dice VIABLE ⭐

Es **el cambio principal** de toda la integración. Es el momento donde el lead "nace" en el CRM.

### F2.1 — Modificar el WF-02 (ID `jeFR0qJOte0JuzTf`)
Después de parsear `0042 VIABLE: 5500 USD ...`:
1. SELECT desde `luxe_smile.leads` para obtener datos del lead (nombre, teléfono, idioma).
2. **NUEVO:** HTTP Request `POST {{$env.CRM_BASE_URL}}/leads` con:
   ```json
   {
     "nombre": "{{$json.name}}",
     "telefono": "{{$json.phone}}",
     "fuente": "WhatsApp",
     "closer": "{{$env.CRM_CLOSER_DEFAULT}}",
     "pipeline_stage": "Cotizado",
     "monto_negociado": 5500,
     "carillas_superiores": 10,
     "carillas_inferiores": 10,
     "notas": "[texto libre del odontólogo desde el grupo Revisión de Casos]"
   }
   ```
3. UPDATE en `luxe_smile.leads`: `crm_lead_id = $.data.id`.
4. Resto del flujo (formatear con IA + enviar al lead) sigue igual.

### F2.2 — Manejo de errores
- Si el `POST /leads` falla (4xx/5xx) → guardar el payload en una tabla `luxe_smile.crm_retries` y reintentar con un workflow scheduled. **No bloquear** el envío de la cotización al lead — el lead es prioridad, el CRM es secundario.
- Si `429 rate_limited` → respetar y reintentar con backoff.

### F2.3 — Caso NO VIABLE
- No crear nada en el CRM.
- UPDATE local: `estado = 'descartado'`.

### F2.4 — Test E2E manual
Simular un VIABLE en el grupo de prueba y verificar:
- Lead creado en el CRM con todos los datos.
- `crm_lead_id` guardado en `luxe_smile.leads`.
- Cotización enviada al lead.

---

## Fase 3 — WF-03, WF-04, WF-05: cotización + pagos

### F3.1 — WF-03 (ID `bUzKAIBYmJvNa1ME`)
Cuando el lead elige mes (después del Wait obligatorio de 90s):
- `PATCH {{$env.CRM_BASE_URL}}/leads/{{crm_lead_id}}` con `{ fecha_cita1: "<fecha tentativa según mes elegido>" }`.

### F3.2 — WF-04 (ID `k0RqPhnzM3ZjQeEe`) — PayPal confirmado
Al recibir el webhook de confirmación de PayPal:
- `POST {{$env.CRM_BASE_URL}}/pacientes` con paquete completo:
  ```json
  {
    "nombre": "...",
    "telefono": "...",
    "closer": "...",
    "fuente": "WhatsApp",
    "monto_negociado": 5500,
    "fecha_cierre": "{{today}}",
    "monto_deposito": 500,
    "metodo_deposito": "PayPal",
    "deposito_transaction_id": "{{paypal_order_id}}",
    "reservo_con_deposito": true,
    "fecha_cita1": "...",
    "fecha_llegada": "...",
    "fecha_despegue": "...",
    "<procedimientos>": ...
  }
  ```
- Guardar `crm_paciente_id`.
- ⚠️ **Pendiente F0.2:** decidir si hay que hacer `DELETE /leads/:id` después o si el CRM lo maneja solo.

### F3.3 — WF-05 (ID `Jxc1UVPoK4mGJVHJ`) — pago manual confirmado
Idéntico a WF-04 pero con `metodo_deposito: "Transferencia"` (o el método que indique el admin en el grupo).

---

## Fase 4 — WF-06: datos finales + agendamiento + matar el mock

### F4.1 — Datos finales (Etapa 6)
- Después de recopilar `email, fecha_nacimiento, numero_identificacion`:
- `PATCH {{$env.CRM_BASE_URL}}/leads/{{crm_paciente_id}}` con esos campos.
  - ⚠️ confirmar en F0.2 si pacientes se actualizan vía `/leads/:id` o tienen su propio endpoint.

### F4.2 — Agendamiento (Etapa 7) — depende de F0.2
Una vez que F0.2 nos diga cómo trabaja `/agenda`:
- **Si CRM `/agenda` es solo log:** Google Calendar valida disponibilidad → si OK, hacer ambas escrituras (POST a Google Calendar + POST a `/agenda`).
- **Si CRM `/agenda` ofrece disponibilidad:** evaluar si reemplazamos Google Calendar (probablemente no — el odontólogo lo necesita en su teléfono).

### F4.3 — Eliminar webhook mock
Borrar el nodo HTTP que apunta a `https://httpbin.org/post` en WF-06.

---

## Fase 5 — WF-07 Admin: aprovechar `/stats` del CRM (opcional)

Reemplazar consultas SQL pesadas por endpoints de stats del CRM cuando aplique:
- *"¿Quiénes están agendados esta semana?"* → `GET /stats/agendados?from=...&to=...`
- *"¿Qué estado tiene el SKU 0038?"* → SELECT local para `crm_lead_id` → `GET /leads/:id`
- *"¿Cuántos leads cerraron este mes?"* → `GET /stats/resumen?month=2026-05`
- *"Cancelar cita del SKU 0042"* → `DELETE /agenda/{crm_lead_id}?tipo=cita1` + cancelar en Google Calendar + UPDATE local
- *"Bloquear del 15 al 30 de mayo"* → `GET /agenda?from=...&to=...` para listar pacientes afectados (más limpio que SELECT a local) → notificar a cada uno + bloquear Google Calendar + INSERT en `luxe_smile.agenda_bloques`

---

## Fase 6 — Limpieza

- `ALTER TABLE luxe_smile.leads DROP COLUMN cotizacion_usd, DROP COLUMN mes_preferido, ...` (las 10 columnas deprecated).
- Borrar el workflow de smoke test (Fase 0.5).
- Actualizar checklist de go-live en CLAUDE.md sección 11.
- Confirmar que no queda ninguna referencia a `httpbin.org/post` en el repo.

---

## Riesgos y consideraciones

| Riesgo | Mitigación |
|---|---|
| Rate limit 60 req/min/IP — n8n y el bot comparten IP del VPS | Implementar retry con backoff en cada HTTP Request del CRM. Cachear `GET /closers` y `GET /tags` (cambian raro). |
| CRM down → bot no puede crear pacientes en Etapa 5 | Cola `luxe_smile.crm_retries` + workflow scheduled de reintento. El pago al lead se confirma siempre; el CRM se actualiza después. |
| Cliente edita un paciente desde su panel → bot tiene datos viejos | Depende de F0.2 (¿hay webhooks salientes del CRM?). Si no, aceptar que el bot puede tener datos rancios y leer del CRM en cada consulta del WF-07. |
| `POST /pacientes` duplicado si el webhook de PayPal llega 2 veces | Usar `deposito_transaction_id` único + verificar antes con `GET /pacientes?q=<transaction_id>`. |
| Cambios al schema del CRM por parte de Cima Labs | Documentar la versión del API que usamos (`api-v1`) y pedir a Cima Labs aviso previo de breaking changes. |

---

## Estado de avance

| Fase | Estado | Notas |
|---|---|---|
| F0.3 — Credencial n8n | ✅ Completado | ID `bdFoVsi2qdFV3fvT` (Header Auth) |
| F0.5 — Smoke test | ✅ Completado | Workflow `MvDo4iHbD5Trxv1u` — los 3 endpoints respondieron `ok:true` el 2026-05-19 |
| F0.4 — Env vars | 🟡 Parcial | `CRM_BASE_URL` listo · `CRM_CLOSER_DEFAULT` bloqueado por F0.2 |
| F0.2 — Cuestionario Cima Labs | ⏳ Pendiente | Pregunta clave: ¿closer del bot? |
| F1 — Migración schema | ⏳ Pendiente | |
| F2 — WF-02 ⭐ | ⛔ Bloqueado | Espera respuesta sobre closer del bot |
| F3 — WF-03/04/05 | ⏳ Pendiente | |
| F4 — WF-06 | ⏳ Pendiente | Depende de F0.2 (agendamiento) |
| F5 — WF-07 admin | ⏳ Pendiente | Opcional |
| F6 — Limpieza | ⏳ Pendiente | |
