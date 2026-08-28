# Qué información pedirle al cliente

> El agente no responde con lo que el cliente **dijo**. Responde con lo que
> quedó **escrito**. Todo lo que no entre en este documento, no existe para él.

Esta es la parte más subestimada de la implementación. Es tentador tratarla como
un trámite —"mándanos tu lista de precios"— y es justamente donde se decide si
el agente suena como la empresa o como un formulario con buenos modales.

---

## El error de pedir solo precios

Un agente que solo tiene precios contesta bien **una** pregunta: *"¿cuánto
vale?"*. Y esa no es la pregunta que trae clientes.

Mira la diferencia con un caso real:

> **Cliente:** «Hola, tengo la piel muy sensible, ¿el láser me sirve?»

| Con solo la lista de precios | Con el contexto completo |
|---|---|
| «El tratamiento láser está en $350.000 la sesión. ¿Te agendo?» | «Con piel sensible sí se puede, pero usamos el equipo de diodo, que es más suave. Lo que hacemos es una valoración gratis primero para ver tu tipo de piel — así no compras a ciegas. ¿Te sirve esta semana?» |

La segunda respuesta no es más inteligente. **Tiene más información escrita.**
Sabe que hay dos equipos, que existe una valoración gratis, y que ese es el
diferenciador que el negocio usa para cerrar. Nada de eso está en una lista de
precios.

---

## Las siete cosas que hay que levantar

Ordenadas por cuánto cambian la respuesta del agente. Las tres primeras son
las que casi nadie entrega solo y las que más se notan.

### 1. Qué hace el negocio, en sus propias palabras

Una descripción de tres o cuatro frases, escrita por ellos. No la del sitio web
—esa suele estar escrita para Google— sino cómo se lo explicarían a un amigo.

> *"Somos una clínica de estética facial en Chapinero. Llevamos ocho años. No
> hacemos cirugía, solo tratamientos no invasivos. La mayoría de la gente llega
> por manchas, acné o rejuvenecimiento."*

**Por qué importa:** define de qué NO habla el agente. Sin esto, contesta
preguntas de cirugía que el negocio no ofrece.

### 2. Cómo lo hacen — el proceso

Qué pasa desde que alguien escribe hasta que sale atendido. Los pasos, quién
interviene, cuánto se demora, qué se necesita traer.

> *"Primero una valoración de 20 minutos, gratis. Ahí se define el plan. Los
> tratamientos son de 45 minutos. Se paga la sesión el mismo día o el paquete
> completo con 10% de descuento."*

**Por qué importa:** es lo que convierte al agente de contestador en asesor.
Puede decirle a alguien qué sigue, en vez de mandarlo a preguntar.

### 3. El valor agregado — por qué a ellos y no al de la esquina

Lo que el dueño dice cuando le preguntan *"¿y ustedes qué tienen de distinto?"*.

> *"Somos los únicos en la zona con el equipo de diodo, que sirve para piel
> morena. Los demás usan alejandrita y no pueden. Y la valoración es gratis y
> sin compromiso: nadie más lo hace."*

**Por qué importa:** sin esto el agente compite por precio, que es la única
comparación que le queda. **Este es el campo que más cambia la tasa de cierre y
el que menos gente entrega espontáneamente.**

### 4. Servicios y precios

Ahora sí. Todos, con nombre exacto, precio, duración y qué incluye. Con las
excepciones escritas: descuentos por paquete, promociones vigentes y hasta
cuándo, qué no está incluido.

> ⚠️ **Escribir "consultar" es peor que no poner nada.** El agente lo repite
> literal y el cliente se va.

### 5. Horarios, sedes y logística

Días y horas de atención, dirección, cómo llegar, parqueadero, si atienden sin
cita. Los cierres por festivos si aplican.

### 6. Las preguntas que ya les hacen todos los días

**El campo con mejor retorno de todos, y sale gratis.** Que abran el WhatsApp y
copien las diez preguntas que más se repiten, con la respuesta que dan hoy.

Esto no hay que inventarlo ni redactarlo: ya está escrito, en su celular. Y como
son las preguntas reales, cubren el 80% de las conversaciones desde el día uno.

### 7. Los límites — qué NO debe hacer el agente

Lo que nunca debe responder, y lo que debe pasar a una persona.

> *"Nunca dar consejo médico. Nunca prometer resultados. Si preguntan por un
> tratamiento que salió mal, pasarlo de inmediato a la doctora."*

**Por qué importa:** es lo único que protege al negocio de una respuesta que le
cueste un cliente o algo peor. Se pregunta explícitamente, porque nadie lo
ofrece solo.

---

## Cómo pedirlo sin espantar al cliente

Un formulario de siete secciones asusta, y lo que llega son siete campos
llenados a las carreras. Funciona mejor así:

**1. Una llamada de 30 minutos, grabada.** Se preguntan los puntos 1, 2, 3 y 7
—los que el dueño tiene en la cabeza y no por escrito— y se transcribe. Es más
rápido y sale mucho mejor que cualquier documento que ellos redacten.

**2. Lo que ya existe, tal cual está.** Precios, horarios y FAQ los tienen en
algún lado: un Word, una imagen, un mensaje fijado de WhatsApp. Que lo manden
como esté. **No pedir que lo pasen a limpio** — ahí es donde se atasca la
implementación una semana.

**3. El sitio web, como complemento y nunca como fuente única.** Probado contra
`bejauha.com`: sitio en Next.js, la página de precios no se puede leer, el FAQ
está en un acordeón cerrado. Total aprovechable: 3 KB **sin los precios**. Es
común y va a pasar seguido.

> **La pregunta correcta en el onboarding no es "¿cuál es tu página web?" sino
> "¿dónde está tu lista de precios actualizada?"** — y la respuesta casi siempre
> es un documento o un WhatsApp, no el sitio.

**4. La devolución.** Se arma el documento, se les manda y se les pide que lo
lean **como si fueran un cliente preguntando**. Ahí aparece lo que faltaba, que
es siempre más de lo que uno cree.

---

## Cómo saber si quedó bien antes de encender nada

Se prueba en el sandbox con las diez preguntas del punto 6, más estas tres, que
son las que revientan un documento incompleto:

| Pregunta | Qué revela si falla |
|---|---|
| «¿Cuánto vale [el servicio más pedido]?» | Falta el punto 4, o dice "consultar" |
| «¿Por qué ustedes y no otro?» | Falta el punto 3 — el agente compite por precio |
| «Tengo [una condición particular], ¿me sirve?» | Falta el punto 2 — no sabe orientar, solo cotizar |

Si el agente contesta *«no tengo esa información»* a cualquiera de las tres,
**el documento no está listo y encenderlo es quemar la primera impresión.**

---

## El límite de tamaño

40 KB. Todo lo de arriba, bien escrito, ocupa entre 8 y 20 KB: la barandilla
casi nunca se activa. Si un negocio necesita más, es señal de que su caso no es
el producto estándar, y esa conversación es mejor tenerla en la venta que en la
factura. Ver [producto-estandar.md](producto-estandar.md) § La economía por
mensaje.
