# Toque Tienda — con qué se integra y qué se le exige al sitio

> **Para qué sirve este documento:** cuando Ferney esté frente a un cliente que
> quiere Toque Tienda, esto contesta en dos minutos *«¿se puede?»*, *«cuánto
> vale?»* y *«qué necesito de usted?»*. Y cuando toque construir, dice qué se
> construye y qué no.

---

## La pregunta que define todo: ¿la tienda puede avisar cuando algo cambia?

De ahí salen los tres niveles. No es un detalle técnico: **decide qué puede
prometer el agente.**

| Nivel | Cómo se entera la plataforma | Qué puede decir el agente |
|---|---|---|
| **A · Conectada** | la tienda **avisa** cuando cambia precio o inventario | «quedan 12» — y es verdad ahora |
| **B · Sincronizada** | la plataforma **pregunta** cada cierto rato | «según lo último, quedan 12; confirmo antes de cerrar» |
| **C · Cargada** | alguien sube el catálogo | «quedan 12 según la última lista» |

**En los tres niveles, antes de armar el pedido se verifica en vivo lo que se
va a comprometer.** Es el único momento en que la exactitud importa de verdad:
equivocarse mientras alguien curiosea no cuesta nada; equivocarse al aceptar el
pedido significa vender lo que no hay.

---

## Nivel A — Conectada (casi tiempo real)

| Plataforma | Estado | Qué se necesita del cliente |
|---|---|---|
| **WooCommerce** | soportada al construir el conector | una llave de API (la genera él mismo en su panel, 2 minutos) |
| **Shopify** | soportada al construir el conector | instalar la app de ToqueFlow en su tienda |
| **Siigo** | soportada al construir el conector | usuario y llave de API de Siigo |

**Requisitos que el sitio debe cumplir para entrar aquí:**

1. Tener una **API de productos** que devuelva código, nombre, precio y existencias.
2. Poder **avisar cuando algo cambia** (webhooks), o dejarse preguntar por lo que cambió desde una fecha.
3. Que cada producto tenga un **código estable** (SKU). Es la llave: sin él no se puede sincronizar sin duplicar.
4. Ser accesible desde internet con HTTPS.

---

## Nivel B — Sincronizada (preguntando cada rato)

Para tiendas con API pero sin avisos: PrestaShop, Magento, un ERP con API, un
desarrollo propio.

| Qué se pregunta | Cada cuánto |
|---|---|
| existencias | **cada 15 minutos** — es lo único que se mueve solo |
| precios y productos nuevos | **una vez al día**, de madrugada |

**Requisito mínimo para entrar aquí:** cualquier forma de entregar la lista de
productos de manera automática — una API, un archivo CSV o JSON en una URL fija,
o un servicio que la plataforma pueda llamar. Nada más.

---

## Nivel C — Cargada (sin tienda en línea)

**No es el caso raro: es el caso común.** La mayoría de las pymes no tiene
tienda en línea. Tienen un Excel, un catálogo en PDF o el inventario en la
cabeza del dueño.

| Forma | Cómo |
|---|---|
| subir un archivo | Excel o CSV desde el portal |
| escribir a mano | pantalla de productos en el portal |

**Requisito:** que exista una lista. Si el negocio no sabe qué tiene ni a qué
precio, Toque Tienda no es lo que necesita todavía.

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
