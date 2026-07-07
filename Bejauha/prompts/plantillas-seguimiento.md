# PROSPECCIÓN — Plantillas de mensaje por tipificación

> Base del agente de seguimiento (PROSPECCIÓN). El agente identifica la
> `tipificacion` del contacto, elige la plantilla, personaliza `{{nombre}}` y
> envía por **WhatsApp**. Las plantillas se editan sin tocar la lógica (irán a
> una tabla `bejauha.plantillas_seguimiento`). Fuente: doc del cliente 2026-05-27.

## Grupo 1 — Clientes con paquete
> ⚠️ **No salen por PROSPECCIÓN** (son clientes activos, no outbound frío). Estas 5
> plantillas alimentan a **CLASES (Agente 2)**: P1→WF04 recordatorio de saldo por
> vencer · P2→mensaje de renovación (link, pendiente #22) · P3/P4/P5→reactivación.


**1. Activo → Confirmar clase** (45)
> Hola {{nombre}} 🌿 Revisé que todavía tienes clases dentro de tu paquete, no queremos que te quedes sin usarlas. ¿Tenemos cupos este domingo o prefieres pasarte a una clase virtual? Dinos cuál te funciona y nos vemos 🙌

**2. Activo → Pago pendiente** (3)
> Hola {{nombre}}, ¿cómo estás? 🌿 Tu paquete está próximo a renovarse y no queremos que pierdas tu ritmo. ¿Lo renovamos igual o quieres cambiar algo? Dinos y lo dejamos listo hoy mismo 🙌

**3. Activo + Deudor** (3)
> Hola {{nombre}} 👋 Ya tomaste una clase de tu próximo paquete — ¡qué bueno que no paraste! ¿Seguimos con esa clase individual o te va mejor arrancar el paquete de 4 u 8 clases?

**4. Pausa** (6)
> Hola {{nombre}} 😊 Hace un tiempo pausaste tus clases y queríamos escribirte. ¿Todo bien? Cuéntanos qué pasó — y si en algún momento quieres retomar, aquí estamos para ayudarte a arrancar de nuevo 🙌

**5. No activo (ex-cliente)** (20)
> Hola {{nombre}} 😊 ¿Cómo estás? Vi que hace un tiempo no has vuelto y no podía quedarme sin escribirte — ¡Nos has hecho falta! ¿Qué pasó? Si quieres retomar, cuéntame y miramos cómo te agendamos o qué se puede hacer 🙌

## Grupo 2 — Leads con clase de cortesía

**6. Cortesía Consumida** (33)
> Hola {{nombre}} 😊 ¡Pasaba a saludarte! ¿Qué tal te pareció la clase? Me encantaría saber cómo te fue. Si te gustó y quieres seguir, cuéntame — ¿te explico los paquetes y modalidades que tenemos? 🙌

**7. Re agendar cortesía** (81)
> Hola {{nombre}} 😊 Vi que todavía no has agendado tu clase de cortesía — ¡y no quería que se te pasara! Es completamente gratis y sin compromiso. ¿Cuándo puedes esta semana para apartarte el espacio? 🙌

## Grupo 3 — Leads fríos

**8. Mensaje enviado** (1.375) — *opción según de dónde viene*
> (WhatsApp) ¡Holaaaa {{nombre}}! ¿Cómo estás? 😊 Vi que tienes nuestro contacto en WhatsApp y quería escribirte personalmente — ¡qué bueno tenerte por aquí! 🌿 Quería regalarte una clase de cortesía para que nos conozcas y vivas la experiencia Bejauha de primera mano. ¿Te gustaría tomarla? Y si quieres, puedes traer a un amig@ también 🙌

> (Instagram) ¡Holaaaa {{nombre}}! ¿Cómo estás? 😊 Vi que nos sigues en Instagram y quería escribirte personalmente — ¡me alegra que estés por aquí! 🌿 Quería regalarte una clase de cortesía… (mismo cierre)

**9. No responde** (464) — *cierra ciclo, NO despide*
> Hola {{nombre}} 😊 ¡Último mensaje de mi parte! Entiendo que quizás no es el momento o simplemente no te llama la atención, y está perfecto. Pero si algún día quieres moverte, respirar y conectar contigo, aquí voy a estar. Cuídate mucho 🌿

> ⚠️ **Comentario del cliente (Camila Suárez, 2026-05-26):** *"no sé si este sea necesario, para mí el seguimiento es eterno, pasa a mensaje de 3 meses, 6 meses, 1 año y así de nuevo. El no es no **por ahora**."*
>
> **Implicación de diseño:** el "no responde" **no termina el contacto, lo recicla**. El agente reprograma `prx_contacto` (+3m → +6m → +12m → anual) en vez de marcar al lead como agotado. El copy de arriba **debe suavizarse** porque hoy suena a despedida ("último mensaje… aquí voy a estar"), justo lo contrario del ciclo eterno que pide el cliente. → Pendiente: nueva versión que cierre el ciclo dejando la puerta abierta, sin decir "es el último".

---

**Nota:** el agente envía por **WhatsApp** (Instagram queda fuera de automatización por ahora).
