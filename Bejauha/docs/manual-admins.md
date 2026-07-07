# Bejauha — Manual de admins (versión corta)

> Actualizado **10 junio 2026**

---

## Lo esencial en 30 segundos

El agente de Bejauha vive en WhatsApp. Lo usan en **dos formas**:

| Para... | Cómo |
|---|---|
| **Ver datos** (clientes, saldos, handoffs) | Dashboard web (link privado) |
| **Hacer acciones** (registrar, recargar, editar) | Hablándole por WhatsApp con prefijo `BEJA` |

> **Regla de oro:** el agente **solo se activa con `BEJA`** en el grupo de admins. En chat privado con BEJA NO necesitan el prefijo, pero pueden usarlo igual. Esto vale incluso para responder a una confirmación.

---

## Dashboard web

```
https://n8n.srv1398596.hstgr.cloud/webhook/bejauha-dashboard?token=<TOKEN_PRIVADO>
```

3 pestañas: **Todos los leads** · **Clientes paquete** · **Handoffs activos**.

Búsqueda en vivo · click en un item para ver detalle · **solo lectura** (los cambios siguen siendo por WhatsApp).

> Tip: guarden la URL en la pantalla de inicio del celular para abrirla como app. Refresquen para datos actualizados.

---

## Qué es un "handoff"

Es cuando el agente **les pasa la conversación a ustedes** porque hay algo que no puede resolver solo. Cuándo pasa:

| Caso | Lo que llega al grupo |
|---|---|
| Cliente sin saldo (acabó paquete) | Renovación necesaria · *"X acabó su paquete, candidato a migrar a membresía"* |
| Prospect insiste en paquete (después de proponerle membresía) | Lead caliente · *"Quiere el paquete, no aceptó membresía"* |
| Quiere clase suelta presencial | Lead caliente · *"Quiere coordinar día"* |
| Pide hablar con humano | Lead caliente · *"Pidió hablar con persona"* |

Mientras hay handoff, **el agente no responde a ese cliente**. Se cierra automáticamente a las 48h sin actividad, o cuando el cliente vuelve a escribir tras el cierre.

---

## Comandos al agente (con `BEJA` en el grupo)

Lenguaje natural — el agente entiende variaciones.

### Asistencias

| Lo que necesitas | Cómo escribirlo |
|---|---|
| Una persona | `BEJA Mariana asistió` |
| Varias a la vez | `BEJA asistieron:` (después una por línea) |
| Clase virtual | `BEJA asisten a clase virtual: ...` (preview muestra "VIRTUAL" con aviso) |
| Agente pide aclaración | Respondes con apellido o teléfono |
| Si saldo en 0 | Se registra como deudor automáticamente |

### Paquete

| Lo que necesitas | Cómo escribirlo |
|---|---|
| Recargar (cualquier cantidad) | `BEJA recarga 4 a Laura` · `BEJA recarga 12 a Pedro` |
| Pago + asistencia en un solo mensaje | `BEJA Laura pagó 4 y tomó clase` |
| Si no dices cantidad | Agente pregunta "¿Cuántas?" → respondes `BEJA 8` |
| **Ajustar saldo manualmente** | `BEJA ajusta a 2 las clases de María` |
| Pausar (máx 1 mes, 1 vez) | `BEJA pausa a Laura` |
| Despausar | `BEJA despausa a Laura` |
| Consultar saldo | `BEJA cuántas le quedan a Laura` |

> **Vencimiento:** < 8 clases → 2 meses · ≥ 8 clases → 3 meses (se calcula automático).

### Datos del cliente

| Lo que necesitas | Cómo escribirlo |
|---|---|
| Editar nombre/email/etc. | `BEJA actualiza el nombre del 573X a María García` |
| Cargar varios clientes nuevos | `BEJA carga estos clientes:` + uno por línea con tel + nombre |
| Pegar solo nombres (sin tel) | Agente busca en base, te dice cuáles ya existen y cuáles necesitan teléfono |
| **Eliminar cliente** (por tel) | `BEJA elimina al 573001234567` → preview destructivo + confirmación |
| **Eliminar cliente** (por nombre) | `BEJA elimina a Maria García` → si hay varios homónimos los lista con teléfono para que elijas |
| **Eliminar varios a la vez** | `BEJA elimina estos clientes:` + uno por línea con tel + nombre → preview con todos + confirmación única |

> El agente **siempre pide confirmación** antes de aplicar cambios. Confirman con `BEJA sí` o cancelan con `BEJA no`.

### Conversacional (saludos, ayuda)

| Lo que escribes | Respuesta |
|---|---|
| `BEJA hola` / `BEJA buenas` | Saludo cálido + recordatorio breve de capacidades |
| `BEJA gracias` / `BEJA listo` | Respuesta corta y amable |
| `BEJA ayuda` / `BEJA qué puedes hacer` | Lista completa de comandos + URL del dashboard |

---

## El grupo "Leads Calientes Bejauha"

Centro de operaciones. Hay 4 tipos de avisos:

| Tipo | Aviso | Atender |
|---|---|---|
| Lead caliente | Alguien listo para cerrar venta | **Rápido** — minutos importan |
| Renovación | Cliente acabó paquete, listo para renovar/migrar | **Rápido** — proponer membresía primero |
| Auto-cierre | Handoffs viejos que se limpian solos (9am) | Informativo |
| Auto-despausa | Paquetes que cumplieron el mes en pausa (9am) | Informativo |

Mientras un handoff esté activo, el agente **no responde a ese cliente** — por eso conviene atender pronto.

---

## Estrategia actual

- **No se venden paquetes nuevos.** Push a membresía (`bejauha.com/planes`).
- **Los clientes con paquete vigente** siguen normales — se irán migrando a membresía con el tiempo.
- El agente ya respeta esto: a prospects nuevos les propone membresía primero, y los avisos de renovación al grupo dicen "candidato a migrar".
- En conversaciones inbound, el agente se presenta como **Beja** en su primer mensaje.
- **Cortesía con tracking:** cuando un prospect acepta la clase de cortesía, el agente automáticamente lo crea en la base, le carga 1 clase presencial y lo marca con `tomo_cortesia=true`. Después se puede medir conversión cortesía → cliente que compró.

---

## Proceso outbound (no requiere acción)

El agente también corre **PROSPECCIÓN** automática: 20 mensajes/día a la base dormida con la oferta de la clase de cortesía. Si alguien responde positivo, entra como handoff normal al grupo. **No tienen que hacer nada con esto.**

---

## FAQ rápida

**¿El agente no me responde?** En el grupo, verificar que escribieron con `BEJA` al inicio.

**¿Cargué un cliente y dice "duplicado"?** El teléfono ya existía en la base. El agente te muestra cómo está guardado actualmente — si el nombre es distinto al que mandaste, lo puedes corregir con `BEJA actualiza el nombre del 573XXX a NuevoNombre`.

**¿El agente no encuentra a alguien en la lista de asistencia?** El nombre debe coincidir con como está guardado. Revisen el dashboard para ver el nombre exacto.

**¿Cliente parece "asignado a humano"?** Tiene un handoff activo. El agente no le contesta hasta que se cierre (auto a las 48h o cuando lo atiendan).

**¿Soy miembro de la web, por qué el agente no me reconoce?** Todavía no hay integración con la base del sitio. Lo trata como prospect.

---

> Si algo falla: avisen en el grupo. Mientras se resuelve, atiendan al cliente desde su WhatsApp personal — el agente no debe ser un cuello de botella.
