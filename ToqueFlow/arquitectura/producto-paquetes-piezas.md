# Producto, paquetes y piezas

> **Este documento es la hoja de ruta de lo que ToqueFlow vende.**
> Si hay que decidir dónde va algo nuevo, se decide aquí primero.
> Decisiones cerradas el 8 de septiembre de 2026. No se vuelven a discutir hasta los 5 clientes.

## La línea que lo divide todo

Antes de los niveles, la pregunta que los produce:

> **¿Necesita una conversación para existir?**
> **Sí** → es un **pin**. Cuelga de una placa base y no se vende solo.
> **No** → es una **placa base**. Se vende sola.

Esa pregunta reemplaza a la duda que dio vueltas tres días —«¿por qué Toque Atiende es
producto y Toque Agenda paquete, si se llaman igual?»—. Se llaman igual porque **para el
que compra son la misma cosa: cajas que se suman.** Lo único que las distingue es de qué
dependen, y eso no lo dice el nombre: lo dice la hoja de precios.

## Los tres niveles

| Nivel | Qué es | Quién lo ve | Ejemplos |
|---|---|---|---|
| **Placa base** *(producto)* | Lo que se contrata. Se vende sola | Se vende | Toque Atiende · Toque Imprime · Toque Escribe |
| **Pin** *(paquete)* | Lo que se le suma según el negocio | Se vende, colgado | Toque Agenda · Toque Recargas · Toque Tienda · Toque Rescata |
| **Pieza** *(herramienta)* | Lo que el agente llama por dentro | No se vende suelta | `agendar-cita`, `recargar-saldo` |

Nadie compra «`ver-disponibilidad`». Compra **que agende**. El pin es la caja en la que se
vende; la pieza es lo que hay dentro.

**El vocabulario, y quién usa cuál:**

| Palabra | Quién la usa |
|---|---|
| **Toque X** y **«requiere»** | El cliente y Ferney. Es todo lo que hace falta para vender |
| **Placa base** y **pin** | Nosotros dos, para pensar la estructura |
| **Producto**, **paquete**, **pieza** | El sistema: `catalogo.tipo`. Decide si algo se expande en piezas |

**Por qué existen los pines.** El catálogo tenía 22 piezas sueltas, y vender piezas
sueltas significa que cada venta es una cotización a medida — que es el problema de las
45–90 horas por cliente, en su versión comercial. Con pines hay tres precios en vez de
infinitas combinaciones.

**Las piezas siguen existiendo.** Un cliente que solo quiera recordatorios lo puede tener.
El pin es una capa de venta encima, no un reemplazo.

---

## Las tres placas base

### 🟧 Toque Atiende — la principal

Trae el chat. Es la única que tiene pines, y la que compra prácticamente todo cliente.

| ● Va siempre | |
|---|---|
| **Responder con conocimiento** | Contesta con lo que el negocio cargó, sin inventarse nada |
| **Pasar la conversación a una persona** | Cuando no sabe, cuando alguien se molesta, o cuando lo piden |
| **Ver la ficha de quien escribe** | Sabe con quién habla y no vuelve a preguntar lo que ya le dijeron |
| **Guardar lo que le acaban de decir** | La base se llena sola con lo que la gente cuenta por WhatsApp |

Las cuatro llegan en el mismo turno, sin llamadas extra.

**Precio:** $1.200.000 de implementación + $600.000 al mes. Fijo, sin excepciones, los
primeros tres clientes (decisión del 28-ago).

### 🟦 Toque Imprime

Los pedidos de las plataformas de domicilio salen impresos en el local sin que nadie los
transcriba. **Funciona sin chat**, así que es placa base, no pin.

Llevaba meses en producción —9.301 impresiones desde junio— **sin nombre**, y sin nombre
no se puede vender ni referir. Se llamaba «Impresión de pedidos».

Todavía no tiene pines. Aplica la regla de abajo: no se le construyen hasta que haga falta.

### 🟩 Toque Escribe

La base de contactos y las campañas, **sin agente**: ver, filtrar, importar, crear campos
propios, y mandarle a un segmento el mensaje que quiera, programado y medido.

También estaba mal clasificada —como «automatización»— y por eso no se le podía ofrecer a
nadie que no llevara ya el agente. Pasa el test: le sirve a alguien que no tiene Toque
Atiende.

**Cómo se vende, y esto importa tanto como el nombre: no va de frente.** Es la respuesta
para el prospecto que dice que el agente es mucho para él — queda adentro, con sus datos en
la plataforma, y sube a Toque Atiende cuando le duela contestar. De frente **compite con el
producto principal**, y el que compra el portal ya no compra el agente.

> El nombre es lo más fácil de cambiar de todo esto. «Toque Escribe» se eligió por ser la
> palabra de todos los días —un negocio dice «le escribo a mis clientes»— sobre «Toque
> Convoca», que dice mejor para qué sirve pero suena a otra cosa.

---

## Los pines

Los cuatro cuestan **$250.000 al mes** y **ninguno cobra implementación**. Que el precio sea
igual no es pereza: no se ha vendido ni un pin todavía, así que cualquier diferencia hoy
sería inventada. Un solo número que Ferney no tiene que calcular vale más que una
optimización adivinada. Se parte cuando haya datos.

### 🗓 Toque Agenda

Para clínicas, spas, talleres, consultorios — cualquiera que trabaje con cita.

| | Estado |
|---|---|
| Ver disponibilidad | ✅ |
| Agendar la cita | ✅ |
| Recordatorio de cita | ✅ *(3-sep)* |
| Confirmar la cita | ✅ *(3-sep)* |
| Mover la cita | ✅ *(14-sep)* |
| **Que el negocio la configure solo** | ✅ *(17-sep)* |

**Completo y liberado, y por fin entregable.** Hasta el 17-sep este pin se vendía como listo
y **no había ninguna pantalla que llenara sus horarios**: solo las pruebas tocaban
`agenda_franjas`. Un cliente lo compraba, el alta le creaba la tarjeta, y la agenda quedaba
vacía hasta que alguien entrara a la base a mano — lo contrario de un producto estándar, y
la razón por la que «11 a 14 horas por cliente» no era un número real. Ahora el negocio pone
sus horarios, sus servicios, sus días cerrados y su recordatorio desde Ajustes.

El recordatorio sale por un cron cada 5 minutos —en la
hora del negocio, nunca dos veces, nunca una cita ya pasada— y `confirmar-cita` cierra el
círculo: cuando la persona contesta, el agente marca si viene, **y si dice que no, la hora
se libera para venderla otra vez**. Recordar sin poder confirmar deja al negocio igual de
a ciegas, por eso las dos piezas entraron juntas al mismo pin.

**Lo que vende:** la conversación termina con la cita puesta, no con un «escríbenos para
agendar» — que es donde se cae la mitad.

**Lo que no hace, a propósito:** no agenda contra personas ni contra recursos. Nada de «la
cita es con Marcela» o «la sala 2». La mayoría de negocios de este tamaño no lo necesitan:
les basta con saber si a las 3 todavía cabe alguien.

### 🎟 Toque Recargas

Para quien vende por paquetes, clases, sesiones o bonos.

| | Estado |
|---|---|
| Matricular a un cliente | ✅ |
| Descontar del saldo | ✅ |
| Recargar el saldo | ✅ |
| **Aprobar las recargas desde el portal** | ✅ *(22-sep)* |
| **Escribirle a quien se le están acabando** | ✅ *(22-sep)* |

**Lo que vende:** el negocio deja de llevar el saldo en una hoja de cálculo, y nadie se
queda sin saber cuántas clases le quedan.

**La regla que no se negocia:** *matricular* y *recargar* **siempre los confirma una
persona**. El cliente final los pide por WhatsApp, el agente registra la solicitud, y al
dueño le llega el aviso para aprobar. Un agente que recarga solo es un agente que regala.

**Completo y liberado desde el 22-sep.** Hasta ese día el pin hacía su trabajo por dentro
y se quedaba a mitad de camino dos veces. Una: la regla de arriba decía que una persona
confirma —y el agente se lo promete al cliente final— pero **no había ninguna pantalla
donde confirmar**. Dos: el negocio veía en su base de contactos a quién se le estaban
acabando las clases y **no le podía escribir**, porque la segmentación de campañas no
sabía nada de saldos. El dato estaba; la acción no.

**Lo que más vende, ahora que se puede armar:** «te queda una clase, ¿te la recargo?» y
«tu paquete se vence en una semana y aún te quedan clases». Las dos salen de un botón.

**Y a quién NO se le escribe:** a quien nunca compró un paquete. Decirle «te queda una
clase» a alguien que nunca tuvo ninguna es el mensaje que hace que un negocio apague las
campañas para siempre. Lo ya vencido tampoco entra: eso no es un aviso, es un reclamo, y
es otra conversación.

### 🛒 Toque Tienda

Para quien tiene tienda en línea.

| | Estado |
|---|---|
| Estado del pedido | ✅ |
| Buscar en el catálogo | ✅ |
| Crear el pedido | ✅ |
| Confirmar pago | 🟡 *anota, no verifica* |
| **Cargar el catálogo desde el portal** | ✅ *(22-sep)* |
| **Elegir su pasarela de pagos** | ✅ *(22-sep)* |

**Lo que vende:** dejar de contestar «déjame reviso» veinte veces al día por el mismo pedido.

**Por qué sigue en amarillo, y es honesto:** `confirmar-pago` **anota** que la persona dice
que pagó, con la referencia que dicte, y se lo pone a alguien del negocio en el portal. No
lo comprueba contra el banco. Eso no es una pieza a medio hacer: es exactamente lo que
hace, y así se vende.

**La pasarela es de cada negocio, no de la plataforma.** Hasta el 22-sep había una sola
—las llaves de ePayco de Bejauha como secretos globales—, que funciona con un cliente y se
rompe con dos: el segundo que cobrara estaría cobrando a la cuenta del primero. Ahora cada
uno elige la suya desde Ajustes, con las más usadas sugeridas y **transferencia/Nequi de
primera**, que es la que más se usa y no cuesta comisión.

**Las llaves no salen del servidor.** Se guardan en un esquema que la API no expone, y el
portal **nunca las recibe de vuelta** — ve los últimos cuatro caracteres para reconocer
cuál puso. Una llave privada que el navegador puede pedir viaja en cada carga de la
pantalla y sale en cualquier captura que el cliente mande pidiendo ayuda.

**Lo que falta para cobrar de verdad** —crear el cobro contra cada pasarela y conciliar su
respuesta— es trabajo por pasarela y necesita credenciales reales para probarse. La
configuración ya está; el cobro es la decisión de con cuál se empieza.

**La única excepción a «los pines no cobran implementación»:** la integración es **por
plataforma, no por cliente**. La primera tienda WooCommerce cuesta construirla; la segunda
ya está hecha. Se cobran **$800.000 por única vez** al primer cliente de cada plataforma, y
va como línea aparte y explicada en la propuesta: *«conexión con su plataforma»*. Esa es la
diferencia entre producto y consultoría, y cambia cómo se cobra.

### 🔁 Toque Rescata

Para cualquiera que ya tenga agenda y esté perdiendo plata sin verlo. **Es el primer pin
que no le suma herramientas al agente**: sus tres piezas no son cosas que el agente llame
en una conversación, son cosas que la plataforma mira por su cuenta y le pone al negocio
delante.

| | Estado |
|---|---|
| Cero vacío — las horas que van a quedar libres | ✅ *(14-sep)* |
| Los que no vinieron | ✅ *(14-sep)* |
| Propuestas sin respuesta | ✅ *(14-sep)* |
| El aviso diario por correo | ✅ *(14-sep)* |

**Completo y liberado: 4 de 4.**

**Y llega solo.** Esto es lo que separa un servicio de una pantalla: cada mañana —la del
negocio, no la de un servidor en Ohio— sale un correo a las personas de la empresa con lo
que hay para recuperar y el enlace para hacerlo. Un negocio con pacientes en la sala no
entra al portal a mirar.

Tres reglas que deciden si ese correo se lee o se aprende a ignorar: **no se repite si no
cambió nada** (salvo que pasen 7 días, para que un problema parado tampoco desaparezca en
silencio), **si no hay nada que recuperar no escribe**, y **no lleva dentro el teléfono ni
el nombre de ningún paciente** — es un aviso interno, y un dato de paciente ahí es una fuga
esperando a que alguien reenvíe el correo.

**Lo que vende:** las tres pérdidas que **no aparecen en ningún informe**. Nadie factura
un hueco, ni al que no vino, ni la propuesta que nunca se contestó — y por eso nadie las
mira. Un negocio que ve «6 horas libres mañana y 40 personas sin cita» hace algo; el mismo
negocio sin verlo, no.

**Requiere Toque Agenda.** Dos de sus tres piezas no significan nada sin ella: no hay
huecos que llenar ni citas a las que faltar. La tercera funciona sola, pero venderlo a
quien no tiene agenda sería entregar un tercio.

**Lo que no hace, a propósito:** no manda nada solo. Detectar es barato y no se equivoca;
escribirle a cuarenta personas porque un cálculo vio un día flojo es como se gana un baneo.
Deja la campaña armada con el filtro correcto y el mensaje propuesto — **enviarla sigue
siendo del negocio**. Es la misma regla del `confirmar_envio`.

**Lo que hay que configurar:** cuál de sus campos guarda la fecha de la propuesta. Es suyo
y cada negocio lo llama distinto —presupuesto, cotización, propuesta— y adivinarlo por el
nombre es como se termina persiguiendo a quien no tocaba. Mientras no se configure, esa
tarjeta dice **«falta configurarlo»**, nunca «0»: un cero ahí le diría al negocio que no
tiene nada pendiente cuando nadie ha mirado.

---

## Las reglas

| # | Regla | Qué evita |
|---|---|---|
| 1 | **Un pin nunca abre renglón solo** en una propuesta: va indentado, con «+», y sin implementación | Que se venda algo que no se puede instalar |
| 2 | **El estado va junto al nombre** — listo / a medias / en papel. Nunca una fecha para lo que está en papel | Prometer lo que no existe. Ya hay tres implementaciones muertas por eso |
| 3 | **No se abre placa base nueva hasta tener 5 clientes en Toque Atiende** | Cinco productos al 60% en vez de uno excelente |
| 4 | **Ferney llega con una configuración armada.** El cliente no escoge de la gama | Que el cliente diseñe su propio producto: sub-compra y se va, o sobre-compra y reclama |
| 5 | **Si piden algo que no existe, no se dice que no** — se anota | El segundo que lo pida ya lo paga hecho |
| 6 | **Una pieza no está lista hasta que el NEGOCIO puede hacer su parte** — no basta con que la herramienta funcione | Vender lo que no se puede operar. Pasó con tres pines a la vez |

Sobre la 4, que fue lo único en lo que hubo discrepancia y quedó decidido así: la gama se
muestra **después** de la recomendación, como lo que existe además. El menú es para que el
cliente sepa que hay más, no para que arme su propio producto.

### Sobre la 6, que se aprendió caro el 17 y el 22 de septiembre

En una semana aparecieron **tres pines vendiéndose que no se podían operar**, y los tres
del mismo modo: la herramienta funcionaba, las pruebas pasaban, el catálogo decía
«liberado» — y el negocio no tenía dónde hacer lo suyo.

| Pin | La herramienta hacía | Y el negocio no podía |
|---|---|---|
| **Toque Agenda** | ofrecer horas y agendar | decir a qué horas atiende |
| **Toque Recargas** | dejar la recarga pedida | aprobarla — y el agente se lo prometía al cliente |
| **Toque Tienda** | buscar en el catálogo | cargar el catálogo |

Ninguno daba error. Un cliente nuevo los compraba, el alta le creaba la tarjeta, y todo
quedaba esperando a que alguien entrara a la base a correr SQL. **Es la razón por la que
«11 a 14 horas por cliente» no era un número real:** las horas que el plan dice que no se
van, se iban ahí.

Lo que falla es siempre lo mismo: se construye la pieza que el agente llama y se da por
terminada, porque eso es lo que tiene prueba. La otra mitad —la pantalla donde una persona
del negocio configura, aprueba o carga— no tiene a quién le duela hasta el día del
go-live.

**Antes de marcar una pieza como liberada, la pregunta es:** ¿puede un cliente nuevo
usarla de punta a punta sin que nadie entre a la base? Si la respuesta es no, está a
medias aunque la herramienta funcione. Y si la pieza le PROMETE algo al cliente final
—«alguien del negocio lo revisa y te confirma»— entonces esa promesa es parte de la pieza,
no algo aparte.

### Ejemplo de propuesta

```
  Toque Atiende .................... $1.200.000 implementación
                                       $600.000 al mes
     └ + Toque Agenda ...............   $250.000 al mes
  ─────────────────────────────────────────────────────────
  Primer mes $2.050.000  ·  Después $850.000/mes
```

Un producto abre renglón a la izquierda y tiene dos números. Un pin cuelga y tiene uno.
**Ahí no hay confusión posible, y por eso el nombre no tiene que cargar con esa diferencia.**

### La chuleta de Ferney

| Si el prospecto es… | Llega con | Al mes |
|---|---|---|
| Ferretería, tienda, restaurante | Toque Atiende | $600.000 |
| Clínica odontológica, estética, spa | Toque Atiende + Agenda | $850.000 |
| Gimnasio, estudio, academia | Toque Atiende + Agenda + Recargas | $1.100.000 |
| Tienda en línea | Toque Atiende + Tienda | $850.000 |
| Restaurante que vende por Rappi | Toque Atiende + Toque Imprime *(dos placas)* | por definir |

**El número que importa:** a $600.000 hacen falta ~9 clientes para la meta; a $1.100.000
hacen falta ~5. Vender un pin cuesta muchísimas menos horas que conseguir un cliente.

---

## Cómo se resuelve por dentro

`agent_config.herramientas` puede traer la clave de una **pieza** o la de un **pin**.
`tf_piezas_del_agente()` lo convierte en la lista plana de piezas que el agente puede llamar.

Que la expansión ocurra al **usar** y no al **contratar** tiene una consecuencia buena: un
pin que mañana gane una herramienta se la da a todos los que ya lo tienen, sin tocar a nadie.

```
  lo contratado          lo que el agente puede llamar
  ───────────────        ──────────────────────────────
  paquete-agenda    →    ver-disponibilidad
                         agendar-cita
                         recordatorio-cita
```

En el catálogo:

| Columna | Para qué |
|---|---|
| `tipo` | `producto` · `paquete` · `herramienta` · `automatizacion` |
| `requiere` | la clave de la placa que necesita. **Nulo = es placa base** |
| `contiene` | las piezas que van dentro de un pin |
| `incluye` | lo que una placa trae **siempre** |
| `puede_llevar` | lo que se le puede **sumar** a una placa |
| `precio_cop` | cuánto suma al mes |
| `implementacion_cop` | lo de una sola vez. **Los pines lo tienen en nulo a propósito** |
| `entrada` | qué datos necesita una pieza cuando el agente la llama (JSON Schema) |
| `parametros` | qué hay que **configurarle** a la pieza al venderla |
| `liberado` | si ya se puede vender |

`entrada` y `parametros` se parecen y no son lo mismo: uno es lo que el agente le pasa a la
herramienta, el otro es lo que hay que preguntarle al cliente al darlo de alta.

**El candado vive en la base, no solo en la pantalla.** `tf_puede_encender(empresa, clave)`
responde si una empresa puede encender algo: que esté liberado y que su placa esté activa.
La usan la consola y el alta — una regla que solo vive en el frontend es una regla que se
salta el primer script.

---

## Dónde va lo nuevo

Antes de construir algo, decidir en qué nivel vive:

1. **¿Funciona sin conversación?**
   → es **placa base**. Y entonces aplica la regla 3: no se abre hasta los 5 clientes.
2. **¿Necesita el chat, y son dos o tres piezas relacionadas de un mismo tipo de negocio?**
   → es un **pin**, o va dentro de uno que ya existe.
3. **¿Es una acción suelta que el agente llama?**
   → es una **pieza**, y entra en el pin que le corresponda.

Lo que **no** se hace: agregar una pieza suelta al producto porque un cliente la pidió. Así
se llegó a las 22 piezas sueltas.
