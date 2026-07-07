# Bejauha — Manual de admins (versión completa)

> Actualizado **10 junio 2026**

Esta es la versión larga, con todo el detalle, ejemplos y casos de uso. Para una referencia rápida, ver `manual-admins.md`.

---

## Tabla de contenido

1. [Introducción: qué hace el agente](#1-introducción-qué-hace-el-agente)
2. [Cómo lo usan en el día a día](#2-cómo-lo-usan-en-el-día-a-día)
3. [Dashboard web (ver datos)](#3-dashboard-web-ver-datos)
4. [Hablándole por WhatsApp (hacer acciones)](#4-hablándole-por-whatsapp-hacer-acciones)
5. [Asistencias](#5-asistencias)
6. [Paquete: recargar, ajustar, pausar, consultar](#6-paquete-recargar-ajustar-pausar-consultar)
7. [Datos del cliente](#7-datos-del-cliente)
8. [Conversacional: saludos, ayuda y mensajes sociales](#8-conversacional-saludos-ayuda-y-mensajes-sociales)
9. [Handoffs (cuando el agente les pasa la conversación)](#9-handoffs-cuando-el-agente-les-pasa-la-conversación)
10. [El grupo "Leads Calientes Bejauha"](#10-el-grupo-leads-calientes-bejauha)
11. [Estrategia comercial: paquete vs. membresía](#11-estrategia-comercial-paquete-vs-membresía)
12. [Proceso outbound (prospección automática)](#12-proceso-outbound-prospección-automática)
13. [Casos de uso paso a paso](#13-casos-de-uso-paso-a-paso)
14. [FAQ extendida](#14-faq-extendida)
15. [Glosario](#15-glosario)

---

## 1. Introducción: qué hace el agente

El **agente de Bejauha** (que se presenta como **Beja** ante los clientes) es un asistente automatizado que vive en WhatsApp. Su trabajo es:

- **Atender prospects nuevos** que escriben por primera vez (clases, planes, precios, sede, horarios).
- **Llevar el control operativo** de los clientes con paquete vigente: registrar asistencias, descontar saldo, recargar paquetes, ajustar saldos, pausar.
- **Prospectar de forma automática** a la base dormida ofreciendo la clase de cortesía.
- **Pasarles el balón a ustedes** cuando hay algo que no puede resolver solo (un handoff).

El agente **nunca improvisa con dinero ni con políticas**. Si alguien pide algo fuera de su alcance (precio especial, cambio de sede, hablar con humano), genera un handoff.

> **El agente no reemplaza a las admins.** Es un primer filtro y un sistema de registro. Las decisiones comerciales (cerrar venta, hacer excepción, atender insistente) siguen siendo de ustedes.

---

## 2. Cómo lo usan en el día a día

Hay **dos formas** de interactuar con el sistema:

| Para... | Cómo | Cuándo |
|---|---|---|
| **Ver datos** (clientes, saldos, handoffs) | Dashboard web (link privado) | Cuando quieras revisar, buscar o auditar |
| **Hacer acciones** (registrar, recargar, editar) | Hablándole por WhatsApp con prefijo `BEJA` | En el momento — después de cada clase, cuando llega un pago, etc. |

> **Regla de oro:** el agente **solo se activa con `BEJA` al inicio del mensaje en el grupo de admins**. En chat privado con BEJA NO necesitan el prefijo (pueden escribirle natural), pero pueden usarlo igual si quieren — funciona de las dos formas.

### ¿Por qué `BEJA` en el grupo?

El agente está conectado al WhatsApp Business y al grupo de admins. Si respondiera a todo lo que se escribe en el grupo, sería un ruido constante. El prefijo es un interruptor explícito en ese contexto. En chats privados no hace falta porque ahí toda la conversación es con el agente.

---

## 3. Dashboard web (ver datos)

```
https://n8n.srv1398596.hstgr.cloud/webhook/bejauha-dashboard?token=<TOKEN_PRIVADO>
```

El token completo se les comparte aparte (es un secreto, no se envía por canales públicos).

### Qué muestra

3 pestañas en una sola página, todo en vivo:

- **Todos los leads**: toda la base de prospects y clientes. Búsqueda por nombre o teléfono.
- **Clientes paquete**: solo los que tienen saldo activo. Click → ves saldo, fecha de vencimiento, si está pausado, historial de asistencias.
- **Handoffs activos**: lo que está pendiente de que ustedes atiendan ahora mismo.

### Cómo usarlo

- Búsqueda en vivo mientras escribes (no hay que dar Enter).
- Click en cualquier item → abre detalle con todos los campos.
- **Solo lectura.** Para hacer cambios, igual hay que escribir `BEJA ...` por WhatsApp.

### Tip de acceso rápido

Guarden la URL en la **pantalla de inicio del celular** para que se abra como una app:

- **iPhone (Safari):** botón compartir → "Añadir a pantalla de inicio"
- **Android (Chrome):** menú de 3 puntos → "Añadir a pantalla de inicio"

Para datos actualizados, simplemente refrescar la página.

### Seguridad

- Cualquiera con el link entra. **No compartir** por canales públicos (stories, grupos abiertos, etc.).
- Si el celular se pierde o el link se filtra, **avisar de una** para rotarlo. El link viejo queda inservible al rotarlo.

---

## 4. Hablándole por WhatsApp (hacer acciones)

En el grupo, los comandos siguen este formato:

```
BEJA <lo que quieres hacer en lenguaje natural>
```

En chat privado con BEJA, el prefijo es opcional — pueden escribirle natural.

El agente entiende variaciones — no hay que aprenderse comandos exactos. Lo que sí importa:

1. **En el grupo, empezar con `BEJA`** (o el agente ignora).
2. **Ser específicos**: nombre completo o teléfono cuando hay ambigüedad.
3. **Confirmar con `BEJA sí` / `BEJA no`** cuando el agente pregunta.

### Desde dónde se puede comandar

- **Chat directo** entre admin y el WhatsApp Business: sí, sin BEJA.
- **Grupo de admins** ("Leads Calientes Bejauha"): sí, con BEJA. Cualquiera de las admins puede escribir `BEJA ...` y el agente le responde en el grupo.

---

## 5. Asistencias

Cuando un cliente con paquete viene a clase, le registras la asistencia. El agente descuenta una clase del saldo automáticamente.

### Una sola persona

```
BEJA Mariana asistió
```

El agente responde con el saldo nuevo:

> Listo, registré la asistencia de Mariana López. Le quedan 3 clase(s) presencial.

### Varias personas a la vez (bulk)

```
BEJA asistieron:
Mariana López
Sofía Mendez
Carolina Pérez
```

El agente:
1. Busca cada nombre en la base
2. Te muestra preview con ✓ (encontrada), ⚠️ (homónimos) o ✗ (no encontrada)
3. Pide confirmación
4. Al confirmar, registra todas y reporta una por una con el saldo nuevo

### Asistencias virtuales (modalidad)

Si la clase es **virtual** (no presencial), incluye la palabra en el mensaje:

```
BEJA asisten a clase virtual de hoy:
Catalina Medina
Tatiana Forero
```

El agente detectará la modalidad y mostrará un aviso claro en el preview:

> Voy a registrar asistencia **VIRTUAL** de:
> ✓ Catalina Medina ...
>
> ⚠️ Atención: estás registrando asistencias VIRTUALES (lo más común es presencial). Si te equivocaste, responde "no" y reenvía sin la palabra "virtual".

Por defecto (si no se menciona modalidad), el agente registra como **presencial**.

### Si hay ambigüedad (dos clientas se llaman igual)

El agente te pregunta:

> Encontré varias personas con ese nombre: Mariana López, Mariana Gómez. ¿A cuál te refieres? Dime el apellido o el celular para no equivocarme 🌿

Tú respondes con apellido completo o los últimos dígitos del teléfono.

### Si la clienta no tiene saldo (acabó su paquete)

La asistencia **se registra igual**, marcada como **deudora**. Esto te permite no dejar de cobrar clases que sí se dieron. Además, el agente abre automáticamente un handoff de renovación al grupo:

> 📌 X acabó su paquete. Asistió hoy en deuda. Candidato a migrar a membresía.

### ¿Y si te equivocas al registrar?

Avisas en el grupo. Por ahora la corrección de asistencias se hace **directo en la base** (no hay comando para "deshacer"). Para próximos sprints.

---

## 6. Paquete: recargar, ajustar, pausar, consultar

### Recargar paquete (cualquier cantidad)

Cuando una clienta paga un paquete, tú lo cargas. **Ya no hay restricción a solo 4 u 8 clases** — puedes recargar cualquier cantidad:

```
BEJA recarga 4 a Laura
BEJA recarga 8 a Laura
BEJA recarga 12 a Pedro
BEJA recarga 20 a María
```

El agente confirma y aplica:

> Recarga aplicada a Laura Martínez. Saldo actual: 9 clase(s) presencial. Vence el 2026-09-04.

**Vencimiento automático**:
- Menos de 8 clases → 2 meses
- 8 o más clases → 3 meses

### Si no especificas cantidad

El agente te pregunta:

> ¿Cuántas clases vas a recargar a Laura? Responde con el número (ej. 4, 8, 12...).

Tú respondes con el número:

```
BEJA 8
```

### Pago + asistencia en un solo mensaje (combo)

Si la clienta paga el paquete Y toma la clase el mismo día, díselo todo junto:

```
BEJA Laura pagó 4 y tomó clase
BEJA Pedro pagó 8 y vino hoy
```

El agente recarga el paquete **y** descuenta la asistencia, todo en una sola operación:

> Listo ✓ Recarga aplicada a Laura Rubio y asistencia de hoy registrada. Saldo final: 3 clase(s) presencial. Vence el 2026-08-04.

### Ajustar saldo manualmente (corregir errores)

Si hay un error en el conteo, puedes corregir el saldo directamente:

```
BEJA ajusta a 2 las clases de María
BEJA Ximena tiene 1 clase no 3
BEJA corrige el saldo de Pedro a 4
```

El agente pide confirmación con preview:

> Voy a ajustar el saldo de María García:
>   Actual: 5 clase(s) presencial
>   Nuevo:  2 clase(s) presencial
>
> ¿Confirmas? (responde sí o no)

### Pausar paquete

El cliente puede pausar su paquete **1 vez por paquete, máximo 1 mes**. Es una concesión, no algo libre.

```
BEJA pausa a Laura
```

El agente registra la fecha de pausa, deja de contar vencimiento, y deja saldo congelado. El paquete vuelve a correr automáticamente al mes (auto-despausa) o cuando tú escribas:

```
BEJA despausa a Laura
```

### Consultar saldo

```
BEJA cuántas le quedan a Laura
```

El agente responde con variación natural (no siempre la misma redacción):

> A Laura Martínez le quedan 3 clases presencial disponibles. Vence el 2026-07-14.

O:

> Laura Martínez cuenta con 3 clases presencial pendientes. Vence el 2026-07-14.

---

## 7. Datos del cliente

### Editar un campo

```
BEJA actualiza el nombre del 573001234567 a María García
BEJA actualiza el email del 573001234567 a maria@correo.com
```

El agente pide confirmación antes de aplicar.

### Cargar varios clientes nuevos de una

Útil cuando llega una lista por un evento, alianza, o registro masivo:

```
BEJA carga estos clientes:
573001234567 Laura Martínez
573009876543 Pedro Gómez
573004445566 Ana Ríos
```

El agente ahora verifica **qué teléfonos ya existen** en la base antes de proceder:

> Voy a crear 1 lead nuevo:
> • Ana Ríos (573004445566)
>
> Estos ya están registrados y los voy a ignorar:
> • Laura Martínez (573001234567)
> • Pedro Gómez (573009876543) — tú lo nombraste "Pedro Gómez Carrillo"
>
> ¿Confirmas crear 1 nuevo? (responde sí o no)

Si el nombre que mandaste es distinto al que está guardado (como "Pedro Gómez" vs "Pedro Gómez Carrillo"), el agente te lo señala para que decidas si actualizar el nombre con `BEJA actualiza el nombre del 573XXX a NuevoNombre`.

### Pegar nombres sin teléfono (ayuda contextual)

Si pegas la lista solo con nombres (sin teléfonos), el agente busca en la base y te dice qué encuentra:

```
BEJA carga estos clientes:
Claudia Murcia
Maria de la Oz
Luis Guillermo
```

Respuesta:

> Estos ya están en la base (no hay que crearlos):
> • Claudia Murcia — 573226142394
> • Luis Guillermo — 573115310523
>
> Estos no están en la base, para crearlos necesito su teléfono:
> • Maria de la Oz
>
> Mándame así:
> BEJA carga estos clientes:
> 573001112233 Maria de la Oz

### Eliminar un cliente (con su historial)

Eliminar un cliente borra al lead **y todo su historial** (saldos, asistencias, recargas, handoffs, mensajes). Es destructivo y requiere confirmación.

**Por teléfono:**

```
BEJA elimina al 573132800644
```

Preview:

> ⚠️ Vas a ELIMINAR a Tatiana Forero (573132800644) de la base, junto con todo su historial (saldo, asistencias, recargas, handoffs y conversación).
>
> Esta acción NO se puede deshacer.
>
> ¿Confirmas? (responde sí o no)

**Por nombre (un único match):**

```
BEJA elimina a Tatiana Forero
```

Mismo preview destructivo con teléfono resuelto.

**Por nombre con varios homónimos:**

```
BEJA elimina a Maria
```

Respuesta:

> ⚠️ Encontré varios clientes con "Maria":
> • Maria García (573001112233)
> • Maria López (573004445566)
> • Maria Rodríguez (573009998877)
>
> Dime el número exacto del que quieres eliminar (ej. "BEJA elimina al 573XXX").

**Sin nombre ni teléfono:**

```
BEJA elimina
```

> Para eliminar un cliente necesito el número de teléfono. Mándame así: "BEJA elimina al 573001112233". Si no recuerdas el número, búscalo primero en el dashboard.

### Eliminar varios clientes a la vez (bulk_delete)

Cuando necesites borrar una lista entera, lo haces en un solo comando con preview y una sola confirmación:

```
BEJA elimina estos clientes:
+57 311 8544318 Estefania Guevara
+57 313 8024553 Flor Mara Boada
+57 300 4814967 Francisco Ovalle
```

Preview:

> ⚠️ Vas a ELIMINAR 3 cliente(s) de la base, junto con TODO su historial (saldos, asistencias, recargas, handoffs, mensajes):
> • Estefania Guevara (573118544318)
> • Flor Mara Boada (573138024553)
> • Francisco Ovalle (573004814967)
>
> Esta acción NO se puede deshacer.
>
> ¿Confirmas? (responde sí o no)

Si alguno **no existe** en la base, lo marca con ⚠️:

> • Estefania Guevara (573118544318)
> • Pedro Inexistente (573009998877) — ⚠️ no existe en la base

Al confirmar:

> Hecho ✓ 3 cliente(s) eliminado(s) con todo su historial:
> • Estefania Guevara (573118544318)
> • Flor Mara Boada (573138024553)
> • Francisco Ovalle (573004814967)

Aplica la misma cascada que `delete_lead` individual: saldos, asistencias, recargas, handoffs, logs y recibidos — todo se borra para cada uno.

### Nombres limpios automáticamente (bulk_load y bulk_delete)

A partir del 10 jun, **el LLM limpia los nombres antes de guardarlos**. Si escribes:

```
BEJA carga este cliente +57 311 8544318 Estefania Guevara
```

El nombre se guarda como **"Estefania Guevara"** (no "carga este cliente Estefania Guevara"). El sistema sigue extrayendo los teléfonos con regex (precisión, sin alucinaciones del LLM) pero usa los nombres ya limpios del LLM.

Aplica para `bulk_load`, `bulk_delete` y cualquier comando con listas.

---

## 8. Conversacional: saludos, ayuda y mensajes sociales

El agente reconoce mensajes conversacionales y responde de forma natural en colombiano. **No** te suelta el "no entendí" cuando solo lo saludas o agradeces.

| Lo que escribes | Respuesta del agente |
|---|---|
| `BEJA hola` · `BEJA buenas` · `BEJA qué tal` | Saludo cálido + recordatorio breve de capacidades (variación generada por LLM) |
| `BEJA gracias` · `BEJA listo` · `BEJA ok` | Respuesta corta y amable |
| `BEJA chao` · `BEJA nos vemos` | Despedida cordial |
| `BEJA ayuda` · `BEJA qué puedes hacer` · `BEJA comandos` | Lista completa de capacidades + URL del dashboard |

Los saludos son **generados por LLM**, así que rotan en tono y redacción (no suenan a respuesta enlatada).

### Si el agente no entiende lo que pediste

Si dices algo ambiguo que tampoco es social ni un comando reconocible, el agente da pistas útiles:

- *"corrige las clases de X"* → sugiere `BEJA ajusta a N las clases de X`
- *"qué personas activas tenemos"* → te da el link del dashboard
- *"deshacer asistencia"* → te dice que esa función aún no existe
- *"incluye a Pepito"* → te recuerda que para crear cliente necesitas el teléfono

Solo como **último recurso** (cosa totalmente desconocida), te lanza el mensaje genérico con ejemplos.

---

## 9. Handoffs (cuando el agente les pasa la conversación)

Un **handoff** es cuando el agente se hace a un lado y **les pasa el cliente a ustedes** porque hay algo que no puede resolver. Mientras hay handoff:

- **El agente deja de responder a ese cliente.**
- Le aparece un aviso en el grupo "Leads Calientes Bejauha".
- Una de ustedes lo atiende desde su WhatsApp personal o desde el WhatsApp Business directamente.

### Cuándo se genera un handoff

| Situación | Aviso al grupo | Por qué |
|---|---|---|
| Cliente sin saldo (acabó paquete) | **Renovación necesaria** — *"X acabó su paquete, candidato a migrar a membresía"* | Decisión comercial — push a membresía o renovación |
| Prospect nuevo insiste en paquete (después de proponerle membresía) | **Lead caliente** — *"Quiere el paquete, no aceptó membresía"* | El agente respeta la estrategia, pero si insiste es decisión de ustedes |
| Pide clase suelta presencial | **Lead caliente** — *"Quiere coordinar día"* | Requiere coordinación de horario que el agente no maneja |
| Pide hablar con persona | **Lead caliente** — *"Pidió hablar con persona"* | Cuando lo solicita explícitamente |

### Cómo se cierra un handoff

Hay dos formas:

1. **Auto-cierre a las 48h** sin actividad. Esto evita que se acumulen handoffs viejos que nadie atendió.
2. **El cliente vuelve a escribir** después del cierre — el agente retoma la conversación como prospect normal.

Por ahora **no hay comando manual para cerrar handoffs**. Si ya atendiste a un cliente y quieres que el agente vuelva a operar con él, deja que pase el tiempo o que el cliente vuelva a escribir.

> **Por qué importa atender rápido:** mientras el handoff está abierto, el cliente recibe **silencio** del agente. Si demoran mucho, el cliente puede pensar que no hay nadie del otro lado.

---

## 10. El grupo "Leads Calientes Bejauha"

Es el **centro de operaciones**. Allí llegan los avisos del agente y desde allí pueden comandarlo.

### Tipos de avisos que llegan

| Tipo | Qué significa | Cuándo atender |
|---|---|---|
| **Lead caliente** | Alguien que llegó por primera vez y está listo para cerrar venta | **Minutos importan** — atender rápido |
| **Renovación** | Cliente con paquete que acabó saldo y candidato a migrar a membresía | **Mismo día** — la idea es proponerle membresía antes que paquete |
| **Auto-cierre** | Handoffs viejos (>48h) que se cerraron solos a las 9am | Solo informativo — no requiere acción |
| **Auto-despausa** | Paquetes que cumplieron el mes en pausa y volvieron a correr | Solo informativo — no requiere acción |

### Ejemplo de aviso "lead caliente"

> 🔥 Nuevo lead caliente
>
> **Mariana López** (573001234567)
> Quiere el paquete — no aceptó membresía.
>
> Mensaje original:
> *"Hola, vi sus precios pero prefiero el paquete por ahora, no quiero suscripción. ¿Cómo pago?"*

### Cómo atender desde el grupo

1. **Una de ustedes responde al lead directo por WhatsApp** (chat 1-a-1).
2. **Una vez resuelto**, dejan que el handoff expire (48h) o que el cliente vuelva a escribir.
3. Si recargan paquete después de cerrar venta, lo hacen como cualquier comando: `BEJA recarga 8 a Mariana`.

---

## 11. Estrategia comercial: paquete vs. membresía

### Política actual

- **No se venden paquetes nuevos** a prospects que llegan por primera vez. Push directo a membresía (`bejauha.com/planes`).
- **Los clientes con paquete vigente** siguen normales hasta que se les acabe. La idea es **migrarlos a membresía** progresivamente, no cortárselos.
- Cuando se acaba un paquete, el aviso al grupo no dice "renovar paquete", dice **"candidato a migrar a membresía"** — para que el discurso sea coherente.
- En conversaciones inbound, el agente se presenta como **Beja** en su primer mensaje (identidad de marca).

### Clase de cortesía con tracking de conversión

Cuando un prospect acepta la clase de cortesía (gratis), el agente automáticamente:

1. **Crea el lead** en la base de datos (si no existe ya)
2. **Carga 1 clase presencial** al saldo (vence en 30 días)
3. **Marca al lead** con `tomo_cortesia=true` y `cortesia_at=<fecha>`
4. **Genera handoff** al grupo: "Aceptó clase de cortesía, coordinar día y hora"

Cuando la persona viene a la clase, el admin hace `BEJA <Nombre> asistió` normal → saldo va de 1→0 → handoff de renovación dispara.

**Para marketing**: después se puede medir conversión cortesía → cliente con queries simples sobre `tomo_cortesia=true` cruzado con `bejauha.recargas`. Ver `database/014_cortesia.sql` para queries listas.

### Qué hace el agente con esto

- A **prospects nuevos**: propone membresía primero. Si insisten en paquete, genera handoff (ustedes deciden).
- A **clientes paquete existentes**: opera normal (registra asistencias, descuenta saldo). Cuando se acaba el saldo, dispara el handoff de renovación.

### Qué deben hacer ustedes

- Cuando llega un handoff de **renovación**: tratar de migrar a membresía. Si insiste en paquete, está bien recargarlo manualmente.
- Cuando llega un handoff de **lead caliente que quiere paquete**: ustedes deciden. Si dicen que sí, lo registran y le cargan saldo.

---

## 12. Proceso outbound (prospección automática)

El agente también corre un **proceso de prospección saliente**:

- **Volumen:** 20 mensajes por día.
- **Base:** la base de contactos dormidos.
- **Mensaje:** invitación a la clase de cortesía (gratis, 1 vez).
- **Resultado:** si la persona responde positivo o pregunta algo, entra como handoff de lead caliente al grupo. Si no responde, se queda en la base.

> **Ustedes no tienen que hacer nada con esto.** El proceso corre en automático. Solo notarán que aparecen "leads calientes" al grupo de gente que ustedes no recuerdan haber contactado — es por esto.

---

## 13. Casos de uso paso a paso

### Caso A — Llega una clienta del paquete a clase

1. Termina la clase.
2. Tú escribes en el chat con el WhatsApp Business: `BEJA Mariana asistió`.
3. El agente responde: *"Listo, registré la asistencia de Mariana López. Le quedan 3 clase(s) presencial."*
4. Listo. La próxima vez que Mariana abra el chat con Bejauha, no nota nada raro — el agente la sigue tratando normal.

### Caso B — Llegan 4 clientas a la misma clase

1. Termina la clase.
2. Escribes:
   ```
   BEJA asistieron:
   Mariana López
   Sofía Mendez
   Carolina Pérez
   Andrea Ruiz
   ```
3. El agente procesa las 4 y reporta:
   > Asistencias presenciales registradas para 4 persona(s).
   > • Mariana López: ahora 3 restantes
   > • Sofía Mendez: ahora 5 restantes
   > • Carolina Pérez: ahora 0 restantes (deudora, handoff abierto)
   > • Andrea Ruiz: ahora 2 restantes
4. Notas que **Carolina** quedó en 0. Al grupo le llegó automáticamente un handoff de renovación. Una de ustedes la contacta hoy.

### Caso C — Clase virtual del domingo

1. Después de la clase virtual, escribes:
   ```
   BEJA asisten a clase virtual de hoy:
   Catalina Medina
   Tatiana Forero
   ```
2. El agente muestra:
   > Voy a registrar asistencia **VIRTUAL** de: ✓ Catalina, ✓ Tatiana
   > ⚠️ Atención: estás registrando asistencias VIRTUALES (lo más común es presencial). Si te equivocaste, responde "no" y reenvía sin la palabra "virtual".
3. Tú confirmas `BEJA sí` (si era virtual) o `BEJA no` (si era presencial).

### Caso D — Llega un prospect nuevo que quiere paquete

1. Persona desconocida escribe al WhatsApp Business: *"hola, cuánto vale el paquete de 8?"*
2. El agente se presenta como Beja y le explica que ya no venden paquetes nuevos, le pasa el link de membresía.
3. La persona insiste: *"no quiero membresía, quiero solo el paquete".*
4. El agente abre handoff y avisa al grupo: **Lead caliente — Quiere el paquete, no aceptó membresía.**
5. Una de ustedes le escribe al chat directo. Decide si vender paquete (excepción) o seguir insistiendo en membresía.
6. Si decide vender paquete: cobra, registra cliente con `BEJA carga estos clientes:` (si no estaba), y `BEJA recarga 8 a <nombre>`.

### Caso E — Cliente pagó y vino el mismo día

1. Laura llega a clase y trae el pago en efectivo.
2. Escribes: `BEJA Laura pagó 4 y tomó clase`
3. El agente aplica recarga + asistencia atómicamente: *"Listo ✓ Recarga aplicada a Laura Rubio y asistencia de hoy registrada. Saldo final: 3 clase(s) presencial. Vence el 2026-08-04."*

### Caso F — Corregir un saldo mal contado

1. Notas que Ximena Espitia aparece con 3 clases pero en realidad debería tener 1.
2. Escribes: `BEJA ajusta a 1 las clases de Ximena Espitia`
3. El agente muestra: *"Voy a ajustar el saldo de Ximena Espitia: Actual: 3 → Nuevo: 1. ¿Confirmas?"*
4. Confirmas con `BEJA sí`.

### Caso G — Vienen tres clientas nuevas por una alianza

1. Te llega una lista por correo con 3 contactos nuevos.
2. Escribes:
   ```
   BEJA carga estos clientes:
   573001112233 Laura Vega
   573004445566 María Salas
   573007778899 Ana Torres
   ```
3. El agente verifica que ninguno exista, te muestra el resumen con duplicados (si los hay) y pide confirmación.
4. `BEJA sí` → quedan cargadas como leads.
5. Si una de ellas paga después un paquete, le cargas saldo con `BEJA recarga 8 a Laura Vega`.

### Caso H — Saludo casual

1. Escribes en el grupo: `BEJA hola`
2. El agente responde algo como: *"¡Hola! Soy el agente de Bejauha para ayudarte con asistencias, recargas y ajustes. Dime qué necesitas o escribe 'ayuda' para ver todo lo que puedo hacer."*
3. No tiras un "no entendí" técnico — el agente entiende el contexto social.

### Caso I — Eliminar un cliente que se cargó mal

1. Notas que se cargó "Tatiana Forero le quedan 3 clases" como nombre completo (un error).
2. Escribes: `BEJA elimina al 573132800644` (si tienes el tel) o `BEJA elimina a Tatiana Forero` (si solo el nombre)
3. Si hay varios homónimos, el agente los lista con sus teléfonos para que elijas
4. El agente muestra preview destructivo. Confirmas con `BEJA sí`.
5. Cliente y todo su historial eliminado. Queda audit log con todo lo borrado.

### Caso K — Limpieza masiva de clientes mal cargados

Imagina que durante la prueba inicial cargaste 5 clientes y todos quedaron con nombre prefijado tipo "carga este cliente Pedro García". Para limpiarlos de golpe:

1. Escribes:
   ```
   BEJA elimina estos clientes:
   573001111111 Pedro García
   573002222222 Maria López
   573003333333 Ana Rodríguez
   573004444444 Carlos Pérez
   573005555555 Sandra Gómez
   ```
2. Agente muestra preview destructivo con los 5
3. Confirmas con `BEJA sí`
4. Los 5 se eliminan en una sola transacción con todo su historial
5. Vuelves a cargarlos limpios (con el nuevo parser de nombres limpios)

### Caso J — Prospect acepta la clase de cortesía

1. Un prospect escribe: *"Hola, quiero probar una clase para conocerlas"*
2. El agente (Beja) responde algo cálido y le ofrece la cortesía
3. El prospect dice: *"Sí, dale, coordinemos"*
4. **El agente detecta la aceptación automáticamente y:**
   - Lo crea en la base con su número y push_name de WhatsApp
   - Le carga 1 clase presencial al saldo (vence 30 días)
   - Lo marca con `tomo_cortesia=true` + `cortesia_at=ahora`
   - Genera handoff al grupo: *"🔥 Lead aceptó clase de cortesía, coordinar día y hora"*
5. Una admin coordina por WhatsApp el día/hora.
6. Cuando viene a la clase, admin hace `BEJA <Nombre> asistió` → saldo 1→0 → handoff de renovación normal.
7. **Para tracking**: queda registrado en `bejauha.leads.tomo_cortesia` para medir si compró después.

---

## 14. FAQ extendida

**¿El agente no me responde, qué pasa?**
Si estás en el grupo, verifica que el mensaje empieza con `BEJA`. En chat privado con BEJA, escribe natural — no hace falta prefijo.

**¿El agente respondió "no entendí la acción"?**
Reformula más simple. Ejemplos que funcionan: `BEJA Laura asistió`, `BEJA recarga 4 a Pedro`, `BEJA cuántas le quedan a Ana`. Si quieres ver todo lo que puede, escribe `BEJA ayuda`.

**¿Una clienta dice que escribió y no le respondieron, qué pasó?**
Probablemente tiene un **handoff activo** — el agente no le contesta hasta que se cierre. Búscala en la pestaña "Handoffs activos" del dashboard y atiéndela.

**Cargué un cliente y dice "duplicado", ¿qué pasó?**
El teléfono ya existía en la base, posiblemente con un nombre distinto. El agente te muestra cómo está guardado actualmente. Si quieres cambiar el nombre al que mandaste, usa `BEJA actualiza el nombre del 573XXX a NuevoNombre`. **¡Cuidado!** Si el apellido es totalmente distinto, verifica con la persona — puede ser otra cliente.

**El agente no encuentra a alguien en la lista de asistencia, ¿por qué?**
El nombre debe parecerse a como está guardado en la base. Revisen el dashboard para ver el nombre exacto. Si no aparece, probablemente sea un cliente nuevo que aún no se ha cargado.

**¿Puedo deshacer una asistencia que registré mal?**
Por ahora no hay comando para deshacer. Avisar en el grupo y se hace manual en la base. Como alternativa: usa `BEJA ajusta` para corregir el saldo.

**¿Por qué el grupo recibe avisos a las 9am de "auto-cierre" y "auto-despausa"?**
Son tareas programadas que corren una vez al día. Solo informativas — no requieren acción de ustedes.

**¿Qué pasa si dos personas escriben `BEJA` al mismo tiempo en el grupo?**
El agente responde a cada una por separado. No hay conflicto.

**¿Por qué algunos avisos dicen "candidato a migrar a membresía" y otros "lead caliente"?**
Son flujos distintos: "candidato a migrar" es para **clientes existentes** que acabaron paquete; "lead caliente" es para **prospects nuevos** que llegan interesados.

**¿El dashboard me deja exportar la lista?**
Por ahora no. Es solo lectura. Si necesitan exportar, avisar y se hace manual.

**¿Se puede integrar más adelante con el sitio web (membresías)?**
Sí, está en lista de pendientes. Cuando se integre, los miembros activos serán reconocidos automáticamente.

**¿Cuánto vence un paquete recargado?**
Menos de 8 clases → 2 meses. 8 o más → 3 meses. Cuenta desde el día de la recarga.

**¿Puedo recargar 12 o 20 clases en lugar de 4 u 8?**
Sí. El agente acepta cualquier cantidad. Antes estaba limitado a paquetes de 4 u 8, ahora ya no.

**¿El agente se presenta como "Beja" cuando habla con clientes?**
Sí, en su primer mensaje con un cliente nuevo se presenta: "Hola, soy Beja del equipo de Bejauha 🌿...". Después no se vuelve a presentar para no sonar repetitivo.

**¿Puedo eliminar un cliente cargado por error?**
Sí. `BEJA elimina al 573XXX` o `BEJA elimina a Nombre`. El agente pide confirmación con advertencia destructiva. Se borra el lead y TODO su historial (saldos, asistencias, recargas, handoffs, mensajes). No se puede deshacer.

**¿Puedo eliminar varios a la vez?**
Sí. `BEJA elimina estos clientes:` + lista con uno por línea (tel + nombre). Una sola confirmación elimina todos. Si alguno no existe lo marca con ⚠️ antes de confirmar.

**¿Por qué los nombres ya no aparecen con basura como "carga este cliente Pedro"?**
Desde el 10 jun, el LLM limpia los nombres antes de guardarlos. Los teléfonos siguen viniendo del regex (más confiable), pero los nombres pasan por el LLM para quitar prefijos de comandos, info irrelevante y texto sobrante.

**¿Qué pasa cuando un prospect acepta la cortesía?**
Automáticamente el agente lo crea en la base, le carga 1 clase presencial al saldo (vence 30 días), lo marca con `tomo_cortesia=true` y genera handoff al grupo para que coordinen día/hora. Una admin solo tiene que coordinar — no hay que cargarlo manualmente.

**¿Cómo veo después quiénes tomaron cortesía y quiénes compraron?**
Hay queries listas en [`database/014_cortesia.sql`](../database/014_cortesia.sql). La tasa de conversión se calcula cruzando `bejauha.leads.tomo_cortesia=true` con la existencia de entradas en `bejauha.recargas`.

---

## 15. Glosario

| Término | Qué significa |
|---|---|
| **Agente** / **Beja** | El asistente automatizado que vive en WhatsApp y atiende prospects, clientes y comandos. Ante los clientes se presenta como "Beja". |
| **Prospect** | Persona que aún no es cliente — solo está preguntando. |
| **Cliente paquete** | Cliente con saldo activo de clases. |
| **Lead caliente** | Prospect que mostró intención clara de comprar o pidió hablar con persona. |
| **Handoff** | Cuando el agente le pasa la conversación a ustedes. Mientras está abierto, el agente no responde a ese cliente. |
| **Recarga** | Sumar clases al saldo de un cliente paquete (cualquier cantidad). |
| **Ajuste de saldo** | Cambiar manualmente el saldo de un cliente (sobrescribe, no suma). Útil para corregir errores. |
| **Combo pago+asistencia** | Comando que ejecuta recarga y asistencia en una sola operación. |
| **Eliminar cliente** | Borrar el lead y todo su historial (saldos, asistencias, recargas, handoffs, mensajes). Destructivo. |
| **Eliminar varios (bulk_delete)** | Borrar una lista de leads en un solo comando con una sola confirmación. Mismo cascade que el individual pero aplicado a todos a la vez. |
| **Nombres limpios (LLM)** | El LLM ahora limpia los nombres antes de guardarlos: quita prefijos como "carga este cliente", "incluye al", info extra como "le quedan 3 clases", etc. Los teléfonos siguen viniendo del regex (sin alucinaciones). |
| **Cortesía aceptada** | Cuando el agente detecta que un prospect acepta la clase gratis: lo crea, le carga 1 clase y lo marca con `tomo_cortesia=true` para tracking de conversión. |
| **Pausa** | Congelar saldo y vencimiento por hasta 1 mes (1 vez por paquete). |
| **Modalidad** | Tipo de clase: `presencial` (default) o `virtual`. El agente detecta la palabra en tu mensaje. |
| **Deudor** | Cliente que asistió a clase pero ya no tenía saldo. La asistencia queda registrada pero no descuenta. |
| **Auto-cierre** | Cierre automático de handoffs viejos (>48h) que corre a las 9am. |
| **Auto-despausa** | Reactivación automática de paquetes pausados al mes, a las 9am. |
| **PROSPECCIÓN** | Proceso outbound automático que escribe a 20 contactos dormidos por día. |
| **Membresía** | El modelo de suscripción de bejauha.com/planes (lo que se vende a prospects nuevos). |
| **BEJA** | El prefijo obligatorio en el grupo para que el agente reconozca un comando. En chat privado es opcional. |

---

> Si algo falla: avisen en el grupo. Mientras se resuelve, atiendan al cliente desde su WhatsApp personal — el agente no debe ser un cuello de botella.
