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
| **Pin** *(paquete)* | Lo que se le suma según el negocio | Se vende, colgado | Toque Agenda · Toque Recargas · Toque Tienda |
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

Los tres cuestan **$250.000 al mes** y **ninguno cobra implementación**. Que el precio sea
igual no es pereza: no se ha vendido ni un pin todavía, así que cualquier diferencia hoy
sería inventada. Un solo número que Ferney no tiene que calcular vale más que una
optimización adivinada. Se parte cuando haya datos.

### 🗓 Toque Agenda

Para clínicas, spas, talleres, consultorios — cualquiera que trabaje con cita.

| | Estado |
|---|---|
| Ver disponibilidad | ✅ |
| Agendar la cita | ✅ |
| Recordatorio de cita | ⬜ falta construirla |

**Lo que vende:** la conversación termina con la cita puesta, no con un «escríbenos para
agendar» — que es donde se cae la mitad.

**Lo que no hace, a propósito:** no agenda contra personas ni contra recursos. Nada de «la
cita es con Marcela» o «la sala 2». La mayoría de negocios de este tamaño no lo necesitan:
les basta con saber si a las 3 todavía cabe alguien.

### 🎟 Toque Recargas

Para quien vende por paquetes, clases, sesiones o bonos.

| | Estado |
|---|---|
| Matricular a un cliente | ⬜ |
| Descontar del saldo | ⬜ |
| Recargar el saldo | ⬜ |

**Lo que vende:** el negocio deja de llevar el saldo en una hoja de cálculo, y nadie se
queda sin saber cuántas clases le quedan.

**La regla que no se negocia:** *matricular* y *recargar* **siempre los confirma una
persona**. El cliente final los pide por WhatsApp, el agente registra la solicitud, y al
dueño le llega el aviso para aprobar. Un agente que recarga solo es un agente que regala.

### 🛒 Toque Tienda

Para quien tiene tienda en línea.

| | Estado |
|---|---|
| Estado del pedido | ⬜ |
| Confirmar pago | ⬜ |

**Lo que vende:** dejar de contestar «déjame reviso» veinte veces al día por el mismo pedido.

**La única excepción a «los pines no cobran implementación»:** la integración es **por
plataforma, no por cliente**. La primera tienda WooCommerce cuesta construirla; la segunda
ya está hecha. Se cobran **$800.000 por única vez** al primer cliente de cada plataforma, y
va como línea aparte y explicada en la propuesta: *«conexión con su plataforma»*. Esa es la
diferencia entre producto y consultoría, y cambia cómo se cobra.

---

## Las reglas

| # | Regla | Qué evita |
|---|---|---|
| 1 | **Un pin nunca abre renglón solo** en una propuesta: va indentado, con «+», y sin implementación | Que se venda algo que no se puede instalar |
| 2 | **El estado va junto al nombre** — listo / a medias / en papel. Nunca una fecha para lo que está en papel | Prometer lo que no existe. Ya hay tres implementaciones muertas por eso |
| 3 | **No se abre placa base nueva hasta tener 5 clientes en Toque Atiende** | Cinco productos al 60% en vez de uno excelente |
| 4 | **Ferney llega con una configuración armada.** El cliente no escoge de la gama | Que el cliente diseñe su propio producto: sub-compra y se va, o sobre-compra y reclama |
| 5 | **Si piden algo que no existe, no se dice que no** — se anota | El segundo que lo pida ya lo paga hecho |

Sobre la 4, que fue lo único en lo que hubo discrepancia y quedó decidido así: la gama se
muestra **después** de la recomendación, como lo que existe además. El menú es para que el
cliente sepa que hay más, no para que arme su propio producto.

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
