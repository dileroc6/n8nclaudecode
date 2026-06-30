# Cuestionario para Cima Labs — integración del bot de WhatsApp de Luxe Smile

> Borrador para enviar al equipo técnico/producto de Cima Labs.
> Última actualización: 2026-05-19

---

## Contexto

Luxe Smile contrató el desarrollo de un bot de WhatsApp para automatizar la atención de pacientes internacionales que llegan por anuncios. El bot saluda al lead, le presenta el paquete (carillas + hotel + traslados), le pide las fotos de la sonrisa, las envía al grupo de revisión del odontólogo, le entrega la cotización ya formateada, cobra el depósito de USD 500 (por PayPal o pantallazo), recopila los datos finales y agenda las **citas dentales** dentro de la conversación de WhatsApp.

La coordinación operativa del hotel, los vuelos y los traslados — que están incluidos en el paquete — todavía no la tenemos definida. El bot deja registradas en el CRM las fechas tentativas de llegada y despegue que el lead indica, pero no nos queda claro quién (ni cuándo) hace las reservas reales y completa los campos del CRM como `hotel_asignado` o `hotel_reservado`. Es uno de los temas que necesitamos aclarar para terminar de diseñar el flujo.

La integración con el CRM no es solo para visualizar los leads: queremos que el CRM sea la fuente única de verdad de cada paciente, para que el equipo de Luxe Smile gestione desde ahí toda la operación post-venta (logística de viaje, recordatorios, comisiones), mida conversión del embudo y haga remarketing de los leads cotizados que no cerraron.

Ya validamos que la conexión y la API key funcionan correctamente (probamos `/health`, `/closers` y `/leads/search`). Antes de avanzar con la implementación productiva nos surgieron algunas dudas puntuales sobre cómo está pensado el flujo del CRM, para no asumir cosas y dejar la integración bien hecha.

---

## Flujo previsto (bot → CRM → equipo humano)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPAS 1-2 — Captación y fotos                          [SOLO BOT]      │
│                                                                          │
│  Lead WhatsApp ──▶ Bot ──▶ PostgreSQL local (SKU + estado conversacional)│
│  (sin tocar el CRM todavía — evitamos meter ruido de leads que no avanzan)│
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPA 3 — Revisión del odontólogo                  [BOT + HUMANO + CRM] │
│                                                                          │
│  Bot ──▶ reenvía fotos al grupo WhatsApp "Revisión de Casos"             │
│  Odontólogo ──▶ "0042 VIABLE 5500 USD" en el grupo                       │
│  Bot ──▶ POST /leads (con monto + procedimientos) ──▶ CRM crea el lead   │
│  Bot ──▶ guarda crm_lead_id en local                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPA 4 — Cotización + elección de mes                    [BOT + CRM]   │
│                                                                          │
│  Bot ──▶ envía cotización formateada al lead                             │
│  Lead ──▶ elige mes preferido                                            │
│  Bot ──▶ PATCH /leads/:id (fecha_cita1 tentativa) ──▶ CRM actualiza      │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPA 5 — Depósito USD 500                                [BOT + CRM]   │
│                                                                          │
│  Lead ──▶ paga por PayPal (link único) o sube pantallazo de transferencia│
│  Bot ──▶ POST /pacientes (paquete completo) ──▶ CRM cierra el caso       │
│  Bot ──▶ guarda crm_paciente_id en local                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPAS 6-7 — Datos finales + agenda dental                [BOT + CRM]   │
│                                                                          │
│  Bot ──▶ pide email, identificación, fecha nac.                          │
│  Bot ──▶ PATCH datos personales ──▶ CRM                                  │
│  Bot ──▶ POST /agenda (cita1, llegada, despegue) ──▶ CRM                 │
│  Bot ──▶ envía resumen final al lead y cierra su intervención            │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  POST-CIERRE — Coordinación operativa                       [❓ GAP ❓]   │
│                                                                          │
│  hotel_asignado   ──▶ ¿quién lo llena? ¿desde dónde? ¿catálogo o libre?  │
│  hotel_reservado  ──▶ ¿quién confirma la reserva con el hotel?           │
│  vuelos           ──▶ ¿los reserva Luxe Smile, el paciente o una agencia?│
│  driver_package   ──▶ ¿cuándo se confirma y quién coordina al chofer?    │
│                                                                          │
│  Este bloque NO está cubierto por el bot. Es lo que necesitamos          │
│  entender para diseñar el handoff y saber qué escribir en el CRM.        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Prioridad 1 — Bloqueantes (sin estas respuestas no podemos avanzar)

### A. Closer del bot

Los leads que entran por el bot **no deben asignarse automáticamente a un closer humano** (Hernan, Joshe o Mariana), porque el bot maneja toda la conversación solo y queremos que cuando un closer humano tome el caso lo haga de forma explícita, no por asignación automática.

1. ¿Pueden crear un closer especial en el CRM llamado `"Bot"`, `"Sistema"` o `"Luxe Smile Bot"` (sin WhatsApp asociado) que sea el dueño por defecto de los leads que crea el bot?
2. Si no es viable, ¿hay alguna alternativa nativa del API — por ejemplo, mandar `closer: null`, omitir el campo, o un valor reservado para representar "creado automáticamente"?
3. Cuando un closer humano decida tomar uno de esos leads, ¿lo hacemos vía `PATCH /leads/:id { closer: "Hernan Lopez" }` desde el bot, o el closer lo reasigna manualmente desde el panel?

### B. Agendamiento y disponibilidad

El bot necesita ofrecerle al lead fechas disponibles para la cita (Etapa 4 del flujo) y luego registrar las fechas confirmadas en el CRM.

4. El endpoint `/agenda`, ¿es solo un registro/log de "qué paciente tiene qué fecha", o tiene noción real de **disponibilidad** (slots ocupados vs libres)?
5. ¿Existe algún endpoint tipo `GET /agenda/disponibilidad?from=...&to=...` que devuelva fechas o slots libres?
6. ¿El CRM tiene configurados los **horarios de atención** de la clínica (días/horas en que se puede agendar)? ¿O las fechas en `/agenda` admiten cualquier valor sin validación?
7. ¿Hay un **cupo máximo de pacientes** por día o semana configurado en el CRM? ¿O el CRM acepta cuantas citas se le manden para la misma fecha sin tope?
8. `POST /agenda`, ¿valida que la fecha no choque con otra ya registrada para el mismo closer/clínica, o permite overlap?
9. ¿Hay alguna forma de **bloquear rangos de fechas** desde el CRM (vacaciones del odontólogo, días no laborales, mantenimiento del consultorio)? Esto es importante porque el administrador necesita poder cancelar días desde su propio WhatsApp.

---

## Prioridad 2 — Importantes pero no bloqueantes

### C. Ciclo lead → paciente

Cuando el bot crea primero un lead (`POST /leads`) y luego ese lead paga el depósito y se convierte en paciente cerrado, no nos queda claro cómo se hace la transición.

10. Al hacer `POST /pacientes` para un lead que ya existe en el CRM, ¿qué pasa:
    - (a) ¿Hay que pasar el `lead_id` para que el CRM lo "promueva" automáticamente?
    - (b) ¿Tenemos que hacer `DELETE /leads/:id` manualmente después del POST `/pacientes`?
    - (c) ¿El CRM detecta el duplicado por teléfono y resuelve solo?
11. `POST /pacientes`, ¿devuelve un `id` propio (paciente_id) distinto al `lead_id`, o reutiliza el mismo identificador?
12. Si el bot necesita actualizar datos de un paciente ya cerrado (por ejemplo, completar `email` o `fecha_nacimiento` después del cierre), ¿se hace vía `PATCH /leads/:id` o existe un endpoint específico de pacientes?

### D. Coordinación post-cierre (hotel, vuelos, traslados)

En el body de `POST /pacientes` vimos campos como `hotel_asignado`, `hotel_reservado`, `travel_package`, `driver_package`, `fecha_llegada`, `fecha_despegue`. Necesitamos entender cómo está pensado el ciclo de vida de estos campos para diseñar bien el handoff bot → equipo humano.

13. ¿Quién es el responsable habitual de llenar `hotel_asignado` y `hotel_reservado`? ¿Lo hace el admin desde el panel del CRM, un coordinador de viajes externo, o se espera que llegue desde una integración?
14. ¿Existe en el panel un **catálogo de hoteles** preconfigurado para asignar (dropdown), o el campo `hotel_asignado` es texto libre?
15. `travel_package` y `driver_package` son booleanos: ¿representan que el paciente *contrató* el paquete, o que ya está *confirmado/reservado*? ¿Hay un campo separado para el estado de reserva?
16. ¿El CRM tiene alguna **sección dedicada** a la coordinación logística post-cierre (vista de "pacientes por llegar este mes", checklist de reservas, etc.), o vive todo dentro de la ficha del paciente?
17. Si en otros clientes ustedes han automatizado esta parte, ¿hay alguna integración recomendada (Booking API, agencias de viaje, traslados)?

### E. Sincronización CRM → bot

Si un closer humano edita un paciente directamente desde el panel del CRM (cambia fecha de cita, modifica monto, agrega notas), el bot debería enterarse para no operar con datos desactualizados.

18. ¿El CRM tiene **webhooks salientes** que nos avisen cuando un lead/paciente se modifica desde el panel?
19. Si no hay webhooks, ¿la única opción es polling periódico? ¿Hay algún campo `updated_at` o filtro tipo `?modified_since=...` para no traerse todo cada vez?

---

## Prioridad 3 — Convenciones y formatos

### F. Enums y formatos

Para evitar errores `400 validation` queremos saber exactamente qué valores acepta cada campo.

20. Campo `fuente` en `POST /leads`: ¿cuáles son los valores válidos? Vimos `"WhatsApp"` en el ejemplo de la documentación, pero ¿hay un enum cerrado (Instagram, TikTok, Ads, Referido, etc.) o admite cualquier string?
21. Campo `pipeline_stage`: vimos `"Cotizado"` y `"Cerrado"`, pero ¿cuál es el enum completo? ¿Hay estados como `"Nuevo"`, `"Contactado"`, `"Perdido"`, `"No viable"`?
22. Campo `metodo_deposito` en `POST /pacientes`: vimos `"PayPal"`, ¿cuáles son los demás valores válidos? (`"Transferencia"`, `"Zelle"`, `"Efectivo"`, ¿otros?)

### G. Integración con Google Calendar

23. ¿El CRM tiene integración nativa con Google Calendar (lee/escribe eventos automáticamente), o esa sincronización queda 100% a cargo de n8n?
24. Si la sincronización queda de nuestro lado, ¿hay alguna recomendación o convención que ustedes hayan visto funcionar bien con otros clientes?

---

## Cierre

Cualquiera de estas respuestas, aunque sea parcial, nos desbloquea para empezar la implementación productiva. Las prioridad 1 son las que realmente nos frenan; las demás las podemos resolver iterando.

Gracias por el tiempo.
