# Respuesta al lead de Workana — automatizaciones para clínicas (España)

> Contexto y estrategia detrás de esta respuesta: la vía elegida es **licencia marca
> blanca sobre ToqueFlow**, no desarrollo a medida. Su pregunta 24 —«cuánto cuesta
> dejarnos los tres sistemas listos para venderlos a distintas clínicas»— es literalmente
> pedir que le construyamos ToqueFlow. La respuesta que nos separa de los otros veinte
> candidatos es: *ya está construido, pagas por clínica activa*.
>
> **Números de esta propuesta:** 500 € de alta por clínica + 160 €/mes por clínica.
> Él revende alrededor de 900 € + 450 €/mes. Margen suyo ~60% sin invertir nada.
>
> Lo que **no** se promete: integración con el software de gestión de la clínica
> (Gesden, Dentalink, Clinic Cloud…) — eso es un conector por software, no por clínica,
> y va como línea aparte.

---

Hola,

Te respondo lo esencial y te propongo algo distinto a lo que imagino que te están
contestando los demás.

**No desarrollo estos sistemas desde cero. Ya los tengo construidos y funcionando.**

Llevo unos dos años trabajando en automatización e IA para empresas y desde hace uno
dejé de entregar proyectos sueltos: monté una plataforma multi-cliente propia
(ToqueFlow) sobre la que hoy operan varios negocios. Cada cliente entra a su propio
portal, ve sus contactos, su agenda, sus campañas y sus conversaciones, aislados de los
demás. La parte de integración —WhatsApp, IA, calendarios, CRMs, pagos— corre sobre n8n
autoalojado en mi VPS. Un dato de fiabilidad, más que de marketing: uno de los módulos
lleva 9.301 operaciones ejecutadas desde junio sin intervención.

De clínicas concretamente: tengo construido el sistema completo de una clínica dental
—captación por WhatsApp, calificación del caso con el odontólogo dentro del circuito,
cotización, cobro del depósito, agendamiento en Google Calendar e integración por API
REST con su CRM—. Ese cliente congeló el proyecto antes de conectar el número, así que
te lo puedo enseñar funcionando, pero no te voy a vender que está facturando.

### Tus tres servicios

| | Estado en mi plataforma |
|---|---|
| **1. Blindaje de Agenda** | **Listo hoy.** El agente consulta huecos, agenda dentro de la conversación, manda el recordatorio por cron (en horario del negocio, nunca dos veces) y procesa la confirmación. Si el paciente dice que no puede, **la hora se libera automáticamente para revenderla** |
| **2. Gabinete Cero Vacío** | La plataforma ya sabe qué huecos hay y a quién habría que escribirle. Falta el disparador automático: unos días de trabajo, no un desarrollo |
| **3. Presupuestos Rescatados** | Se **configura**, no se construye: campos propios por clínica, segmentación y seguimiento programado ya existen |

Una advertencia honesta, porque es donde mueren estos proyectos: los tres funcionan solos
si la clínica usa la agenda de la plataforma. Si su agenda y sus presupuestos viven en su
software de gestión (Gesden, Dentalink, Clinic Cloud…), hace falta un conector. Se
construye **una vez por software, no por clínica**: la primera clínica con Gesden lo paga,
la segunda ya lo encuentra hecho.

### Lo que te propongo

En vez de que pagues un desarrollo y esperes meses, te doy acceso en marca blanca:

| | Lo que me pagas | Lo que puedes cobrar |
|---|---|---|
| Alta por clínica | 500 € | 900 – 1.200 € |
| Mensual por clínica (los 3 servicios) | 160 € | 400 – 600 € |
| Conector con software de gestión | 1.500 €, una sola vez por software | línea aparte |

Incluye alojamiento, IA, portal del cliente, mantenimiento, correcciones y las mejoras que
vaya sacando. Tú asumes el número de WhatsApp oficial de cada clínica y su coste de
conversaciones con Meta. **Tu inversión inicial es cero y tu margen ronda el 60%.**

Primera clínica en marcha en 5–10 días laborables, no en meses. A partir de ahí, cada
clínica nueva es configuración: puedo llevar varias en paralelo sin que baje la calidad,
que es justo el problema que tiene quien desarrolla a medida.

Dos cosas que te van a preguntar tus clínicas y conviene cerrar antes de firmar: los datos
de pacientes son categoría especial del RGPD (hay que definir región de alojamiento y
contrato de encargado de tratamiento) y para clínicas europeas recomiendo WhatsApp Cloud
API oficial, no soluciones no oficiales que exponen el número de la clínica a bloqueos.

### Cómo seguimos

Te propongo **30 minutos de videollamada** y te lo enseño en vivo: monto una clínica
ficticia y verás el flujo real de principio a fin —conversación, cita agendada,
recordatorio, confirmación, hueco liberado— sin exponer datos de ningún cliente real,
porque la plataforma tiene un modo de prueba que ejecuta el flujo de producción y desvía
la salida a un panel.

Si después de verlo prefieres un desarrollo a medida del que seas propietario, también lo
hago y te paso presupuesto cerrado — pero quiero que veas antes lo que ya existe, porque
sale más barato, más rápido y con menos riesgo para ti.

Dime dos franjas que te vengan bien esta semana.

Un saludo,
Diego Rojas — ToqueFlow
