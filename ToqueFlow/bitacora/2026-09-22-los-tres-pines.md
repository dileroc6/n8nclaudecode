# 22 de septiembre — Tres pines que se vendían y no se podían operar

> Qué se hizo, qué se rompió, y qué quedó abierto. Para retomar sin releer diez commits.

## De dónde salió el día

El enfoque lo fijó Diego el 17: **casi ningún cliente está operando y no se está
trabajando para reactivarlos. Se está completando la plataforma para clientes nuevos.**
Eso cambia qué es urgente: una avería de un cliente parado no bloquea nada; lo que bloquea
es cualquier cosa que un cliente nuevo no pueda hacer solo.

Con ese filtro, dos agentes revisaron el tablero y la documentación. El primero encontró
lo que importaba: **tres huecos que ninguna fila cubría**, todos con la misma forma.

## La forma del problema

| Pin | La herramienta hacía | Y el negocio no podía |
|---|---|---|
| Toque Agenda *(17-sep)* | ofrecer horas y agendar | **decir a qué horas atiende** |
| Toque Recargas | dejar la recarga pedida | **aprobarla** |
| Toque Tienda | buscar en el catálogo | **cargar el catálogo** |

Ninguno daba error. Las pruebas pasaban, el catálogo decía «liberado», y el pin se vendía
a $250.000/mes. Un cliente nuevo lo compraba y todo quedaba esperando a que alguien
entrara a la base a correr SQL.

Quedó escrito como la **regla 6** en
[producto-paquetes-piezas.md](../arquitectura/producto-paquetes-piezas.md).

## Lo que se construyó

**Recargas.** La pantalla para aprobar, en `pedidos.html` —que ya es «lo que espera que lo
confirmes»—. Se ve el saldo de **hoy** junto a la solicitud: aprobar sin verlo es como se
duplica una recarga ya aprobada por WhatsApp. Y **rechazar exige una nota**, porque sin
ella la persona se queda sin respuesta y el negocio sin memoria.

Después, lo que de verdad vende: **se veía a quién se le estaban acabando las clases y no
se le podía escribir.** La segmentación no sabía nada de saldos. Ahora sí, con dos botones
—«se les están acabando» y «se les vence pronto»—. Y lo que no puede pasar: escribirle a
**quien nunca compró un paquete**, que es el mensaje que hace que un negocio apague las
campañas para siempre.

**Tienda.** `productos.html`: carga el catálogo desde archivo o pegándolo. Reconoce los
encabezados en las palabras del negocio (`código`, `stock`, `cantidad`), acepta el punto y
coma que exporta un Excel en español, y limpia `$28.900` antes de mandarlo.

La decisión que más importa: **lo que no viene en el archivo NO se borra.** Un negocio que
suba «las novedades del mes» vaciaría su catálogo entero. Y se enseña qué va a pasar antes
de tocar nada.

**La pasarela de pagos, configurable.** Había UNA para toda la plataforma: las llaves de
ePayco de Bejauha como secretos globales. Funciona con un cliente y se rompe con dos — el
segundo que cobrara estaría cobrando a la cuenta del primero.

Ahora cada negocio elige la suya. La lista sale de la base, así que sumar una pasarela es
una fila. **Y de primera va transferencia/Nequi**, que es lo que más se usa y no cuesta
comisión: enseñar primero las pasarelas haría creer que hace falta una para vender.

Las llaves viven donde la API no llega, y **el portal nunca las recibe de vuelta** — ve
los últimos cuatro caracteres. Una llave privada que el navegador puede pedir viaja en
cada carga de la pantalla y sale en cualquier captura que el cliente mande pidiendo ayuda.

**El escalamiento que nacía roto.** El alta grababa `destino: 'equipo'` **fijo**, y la
consola sugería «grupo de ventas» como ejemplo — que es justo lo que no sirve, y así quedó
escrito en Bejauha. El defecto salía de fábrica en cada cliente nuevo y se descubría el
día del go-live.

## Lo que se rompió en el camino

**El receptor exportado fingía una variable.** Al sacarle el secreto quedó
`${TOQUE_EVENTS_SECRET}` dentro de un nodo de código, donde esa sintaxis no interpola
nada: quien reimportara ese JSON se quedaba con la cadena literal como secreto.

**La fila 169 nunca llegó al tablero.** El script que la escribía hacía los cambios en
memoria y guardaba al final; un ancla que falló a mitad se llevó por delante el reemplazo
anterior, que ya había impreso su «✓». **Un script que dice «hecho» y no guardó es peor
que uno que falla.** Los de ahora guardan después de cada cambio.

**Un agente de pruebas llevaba semanas encendido en producción.** `montar-tienda-prueba`
dejaba «Mostrador de prueba» activo y solo lo borraba con una bandera a mano.

**Mi validador de destinos daba por bueno un número de 10 dígitos** — exactamente el que
va sin indicativo. Lo cazó la prueba que escribí para él.

**Escribí «clases» en el borrador de una pantalla compartida.** Unas son clases, otras
sesiones o bonos. Lo cazó `nada-de-un-cliente.cjs`.

## Dos pruebas que hicieron su trabajo

`filtros-que-la-base-entiende.cjs` **se negó a dejar pasar** los dos filtros de saldo hasta
que se agregaron a su lista de formas probadas. Es para lo que existe: un filtro que la
base no lee no falla — manda la campaña a más gente de la que se eligió.

Y el canario se quedaba mudo en el primer mensaje por arranque en frío. Una respuesta
vacía en una prueba de fuga es lo peor que puede pasar: las comprobaciones «no filtró
nada» pasan porque no dijo **nada**. La prueba ya se negaba a pasar con el control mudo
—esa parte estaba bien pensada— pero quedarse mudo por lentitud no es estar roto.

## Lo que quedó abierto, y por qué

| | |
|---|---|
| **Cobrar de verdad** | La configuración está; crear el cobro contra cada pasarela es trabajo **por pasarela** y necesita credenciales reales. Esperar a que un cliente lo pida, para construir contra credenciales y no contra la documentación |
| **`confirmar-pago` en amarillo** | A propósito: anota que la persona dice que pagó, no lo comprueba contra el banco. No es una pieza a medio hacer — es lo que hace, y así se vende |
| **Fila 160** — 7 funciones en varios archivos | Riesgo medio-alto: hay que reaplicar esquemas en producción. Hacerla sola, no al final de una tanda |
| **Fila 168** — `agente-agenda` intermitente | Necesita decisión: ¿las comprobaciones de redacción se reintentan, o salen del banco por defecto? Las de hecho se quedan como fallo duro |

**48 de 51 pruebas.** Las tres conocidas: webhooks viejos de n8n, el sitio de Savia, y los
avisos de Bejauha esperando un número.

## Lo que sigue sin medirse

La mitad humana del alta. La de máquina ya está: **17 actos, ninguno entra a la base.**
Falta montar un cliente ficticio desde la consola con el cronómetro en la mano — que ahora
sí se puede, y antes del 17 de septiembre no.
