# Toque Tienda — con qué se integra y qué se le exige al sitio

> **Para qué sirve este documento:** cuando Ferney esté frente a un cliente que
> quiere Toque Tienda, esto contesta en dos minutos *«¿se puede?»*, *«cuánto
> vale?»* y *«qué necesito de usted?»*. Y cuando toque construir, dice qué se
> construye y qué no.

---

## La respuesta corta: ¿con qué tienda funciona?

| El cliente tiene… | ¿Funciona? | Qué hay que pedirle |
|---|---|---|
| **WooCommerce** | **Sí** | una llave de API — la genera él en su panel, 2 minutos |
| **Shopify** | **Sí** | que instale la app de ToqueFlow |
| **Siigo** | **Sí** | usuario y llave de API de Siigo |
| **Otra tienda o ERP** | **Sí, si cumple los 3 requisitos** | ver abajo |
| **Nada — Excel, PDF, la cabeza del dueño** | **Sí** | que nos pase la lista |

**No se promete nada más.** Si aparece un cliente con PrestaShop, Magento o un
desarrollo propio, la respuesta no es «sí» ni «no» de una: es *«déjame revisar
tres cosas»*.

### Los 3 requisitos para una plataforma que no está en la lista

1. **Una forma automática de entregar los productos.** Una API, o un archivo
   CSV/JSON en una URL fija. Si la única forma de sacar el catálogo es que
   alguien lo exporte a mano cada semana, eso es el último renglón de la tabla,
   no este.
2. **Un código estable por producto (SKU).** Es la llave para actualizar sin
   duplicar. Es el requisito que más se cae, y el que hay que mirar primero.
3. **Accesible desde internet, con HTTPS.** Un ERP que solo vive en la red
   interna del cliente no se puede consultar.

Si cumple los tres, se construye el conector y funciona igual que Woo. **Lo que
cambia es el precio de la primera vez**, porque ese conector no está hecho.

---

## Lo único que cambia entre una y otra: qué tan al día está el dato

No cambia lo que el agente *hace*. Cambia lo que el agente puede **prometer**.

| El cliente tiene… | Cómo se entera la plataforma | Qué dice el agente |
|---|---|---|
| Woo, Shopify, Siigo | la tienda **avisa** cuando algo cambia | «quedan 12» |
| otra con API | se **pregunta** cada 15 min el inventario, y el catálogo una vez al día | «quedan 12» |
| nada en línea | alguien subió la lista | «según la última lista, quedan 12» |

Y en los tres casos igual: **ofrecer se hace con la copia; comprometerse se
confirma.** Equivocarse mientras alguien curiosea no cuesta nada. Equivocarse
al aceptar el pedido es vender lo que no hay.

---

## Qué se copia de cada producto

| Se copia | Por qué importa |
|---|---|
| código (SKU) | es la llave para sincronizar sin duplicar |
| nombre y descripción | es lo que el cliente busca en sus palabras |
| categoría | para agrupar |
| precio | **el agente nunca lo calcula ni lo recuerda: lo lee de aquí** |
| existencias | y se distingue «no hay» (0) de «no se sabe» (vacío) |
| **variantes** | talla, color, presentación — con su propio precio y sus propias existencias |
| link del producto | para poder mandarlo |

**Lo de las variantes no es opcional.** Si el agente no las sabe, contesta
«sí tenemos guantes» cuando lo que hay es talla XL y el cliente usa M. Cada
variante es una cosa vendible distinta, con su precio y su inventario; lo que
se agrega es que el agente sepa que son hermanas.

**Lo que NO se copia:** imágenes, impuestos, precios al mayor, promociones.
Si un cliente los pide, es trabajo aparte.

---

## El pago: las dos formas, y ninguna la cierra el agente

Se ofrecen las dos, porque en Colombia conviven.

| | **Link de pago** | **Transferencia** |
|---|---|---|
| Qué recibe el cliente | un link (ePayco / Wompi) | los datos de la cuenta |
| Quién confirma | **la pasarela**, automático | **una persona** |
| Cuánto tarda | segundos | lo que tarde alguien en mirar |
| Qué necesita el cliente del negocio | cuenta en la pasarela | nada |

## Se prende por cliente, uno, otro o los dos

Ningún negocio cobra de las dos formas por defecto. **Se prende en la consola,
en la ficha del cliente**, igual que el tono o el horario.

| Si está prendido | El agente… |
|---|---|
| solo transferencia | dicta los datos de la cuenta. **No ofrece link: no existe** |
| solo link | manda el link. **No da datos de cuenta** |
| los dos | deja que la persona escoja |
| **ninguno** | **no se inventa nada.** Dice que confirma cómo pagar y escala |

Esa última fila es la que importa. Un agente que se inventa una cuenta bancaria
es peor que un agente que no sabe: el precio mal dicho se corrige, una
transferencia a un desconocido no.

Y por lo mismo, **los datos de la cuenta se dictan tal cual**, sin resumir ni
reordenar. Es la regla del precio subida de gravedad.

---

**En la transferencia el agente recibe el comprobante, lo anota contra el
pedido y le avisa a quien decida** — no lo da por bueno. Confirmar un pago que
no entró es despachar mercancía regalada.

**En el link de pago, el agente tampoco confirma:** confirma la pasarela, que ya
le avisa a la plataforma por su cuenta. La diferencia no es quién puede menos;
es que una máquina puede verificar y una conversación no.

---

## Lo que se construye una vez y lo que se construye por cliente

Es el argumento comercial, y conviene tenerlo claro antes de cotizar:

```
   por PLATAFORMA (una vez)          por CLIENTE (siempre)
   ─────────────────────────         ─────────────────────
   el conector con Woo               conectar sus llaves
   el conector con Siigo             revisar su catálogo
   el conector con Shopify           su tono y sus palabras
                                     a quién le llegan los avisos
```

**La primera tienda WooCommerce cuesta construirla. La segunda ya está hecha.**
Eso es cierto solo porque el catálogo se copia a la plataforma y el agente
consulta la copia: así hay **una** herramienta de búsqueda para todas las
plataformas, y lo único que cambia es el conector.

---

## Lo que hay que preguntarle a un cliente antes de prometerle nada

1. ¿Tiene tienda en línea? ¿Cuál?
2. ¿Cada producto tiene un código propio?
3. ¿Maneja tallas, colores o presentaciones?
4. ¿Cobra por transferencia, por link de pago, o las dos?
5. ¿Quién confirma un pedido, y por dónde quiere que le llegue el aviso?

La 5 es la que más se olvida y la que más duele: un aviso que va a «el equipo»
en vez de a un número **no le llega a nadie**, y el cliente se queda esperando.

---

Ver también: [producto, paquetes y piezas](producto-paquetes-piezas.md) ·
[contrato n8n](contrato-n8n.md) · [arquitectura](arquitectura-toque.md)
