# Producto, paquetes y piezas

> **Este documento es la hoja de ruta de lo que ToqueFlow vende.**
> Si hay que decidir dónde va algo nuevo, se decide aquí primero.

## Los tres niveles

| Nivel | Qué es | Quién lo ve | Ejemplos |
|---|---|---|---|
| **Producto** | Lo que se contrata. Todo cliente tiene uno | Se vende | Toque Atiende |
| **Paquete** | Lo que se le suma según el negocio | Se vende | Toque Agenda · Toque Recargas · Toque Tienda |
| **Pieza** | Lo que el agente llama por dentro | No se vende suelta | `agendar-cita`, `recargar-saldo` |

Nadie compra «`ver-disponibilidad`». Compra **que agende**. El paquete es la
caja en la que se vende; la pieza es lo que hay dentro.

**Por qué existen los paquetes.** El catálogo tenía 22 piezas sueltas, y vender
piezas sueltas significa que cada venta es una cotización a medida — que es el
problema de las 45–90 horas por cliente, en su versión comercial. Con paquetes
hay tres precios en vez de infinitas combinaciones.

**Las piezas siguen existiendo.** Un cliente que solo quiera recordatorios lo
puede tener. El paquete es una capa de venta encima, no un reemplazo.

---

## Toque Atiende — el producto

Va siempre. La prueba para entrar aquí: **¿le sirve igual a una tienda, un
hotel, una clínica y un gimnasio, sin cambiar nada?**

| ● | | |
|---|---|---|
| **Responder con conocimiento** | Contesta con lo que el negocio cargó, sin inventarse nada | |
| **Pasar la conversación a una persona** | Cuando no sabe, cuando alguien se molesta, o cuando lo piden | |
| **Ver la ficha de quien escribe** | Sabe con quién habla y no vuelve a preguntar lo que ya le dijeron | |
| **Guardar lo que le acaban de decir** | La base se llena sola con lo que la gente cuenta por WhatsApp | |

Las cuatro llegan en el mismo turno, sin llamadas extra.

---

## Los paquetes

### 🗓 Toque Agenda

Para clínicas, spas, talleres, consultorios — cualquiera que trabaje con cita.

| | Estado |
|---|---|
| Ver disponibilidad | ✅ |
| Agendar la cita | ✅ |
| Recordatorio de cita | ⬜ falta construirla |

**Lo que vende:** la conversación termina con la cita puesta, no con un
«escríbenos para agendar» — que es donde se cae la mitad.

**Lo que no hace, a propósito:** no agenda contra personas ni contra recursos.
Nada de «la cita es con Marcela» o «la sala 2». La mayoría de negocios de este
tamaño no lo necesitan: les basta con saber si a las 3 todavía cabe alguien.

### 🎟 Toque Recargas

Para quien vende por paquetes, clases, sesiones o bonos.

| | Estado |
|---|---|
| Matricular a un cliente | ⬜ |
| Descontar del saldo | ⬜ |
| Recargar el saldo | ⬜ |

**Lo que vende:** el negocio deja de llevar el saldo en una hoja de cálculo, y
nadie se queda sin saber cuántas clases le quedan.

**La regla que no se negocia:** *matricular* y *recargar* **siempre los
confirma una persona**. El cliente final los pide por WhatsApp, el agente
registra la solicitud, y al dueño le llega el aviso para aprobar. Un agente que
recarga solo es un agente que regala.

### 🛒 Toque Tienda

Para quien tiene tienda en línea.

| | Estado |
|---|---|
| Estado del pedido | ⬜ |
| Confirmar pago | ⬜ |

**Lo que vende:** dejar de contestar «déjame reviso» veinte veces al día por el
mismo pedido.

**Es otro precio, y por una razón que conviene entender:** la integración es
**por plataforma, no por cliente**. La primera tienda WooCommerce cuesta
construirla; la segunda ya está hecha. El primer cliente de cada plataforma
paga la construcción; los demás pagan el producto. Esa es la diferencia entre
producto y consultoría, y cambia cómo se cobra.

---

## Cómo se resuelve por dentro

`agent_config.herramientas` puede traer la clave de una **pieza** o la de un
**paquete**. `tf_piezas_del_agente()` lo convierte en la lista plana de piezas
que el agente puede llamar.

Que la expansión ocurra al **usar** y no al **contratar** tiene una
consecuencia buena: un paquete que mañana gane una herramienta se la da a todos
los que ya lo tienen, sin tocar a nadie.

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
| `contiene` | las piezas que van dentro de un paquete |
| `incluye` | lo que un producto trae **siempre** |
| `puede_llevar` | lo que se le puede **sumar** a un producto |
| `entrada` | qué datos necesita una pieza cuando el agente la llama (JSON Schema) |
| `parametros` | qué hay que **configurarle** a la pieza al venderla |
| `liberado` | si ya se puede vender |

`entrada` y `parametros` se parecen y no son lo mismo: uno es lo que el agente
le pasa a la herramienta, el otro es lo que hay que preguntarle al cliente al
darlo de alta.

---

## Dónde va lo nuevo

Antes de construir algo, decidir en qué nivel vive:

1. **¿Le sirve igual a todos los sectores, sin configurar nada?**
   → va en **Toque Atiende**.
2. **¿Le sirve a un tipo de negocio, y hay dos o tres piezas relacionadas?**
   → es un **paquete**, o va dentro de uno que ya existe.
3. **¿Es una pieza suelta que el agente llama?**
   → es una **herramienta**, y entra en el paquete que le corresponda.

Lo que **no** se hace: agregar una pieza suelta al producto porque un cliente
la pidió. Así se llegó a las 22 piezas sueltas.
