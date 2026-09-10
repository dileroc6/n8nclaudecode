# Los 28 webhooks abiertos — inventario para decidir

> Levantado el 10 de septiembre de 2026 contra n8n. **No se cerró nada:** cerrar
> mal rompe algo que hoy le funciona a un cliente que paga, y varias de estas
> puertas dependen de decisiones que no son técnicas (filas 25 y 26 del tablero).

## Qué cuenta como «abierto»

El mismo criterio que `pruebas/seguridad/auditoria-n8n.cjs`: el flujo **no lee la
cabecera y la compara** con un secreto, **ni** le pregunta a Supabase quién llama.

> **Un intento anterior mío daba 22 de estos por validados.** Buscaba palabras
> sueltas —«token», «apikey»— en el JSON del flujo, y eso lo cumple cualquiera
> que llame a una API con una llave. El clasificador bueno exige las dos cosas a
> la vez. Vale la pena recordarlo: aquí los permisos no se leen, se intentan.

## El dato que faltaba para poder decidir

**24 de los 28 no tienen ni una ejecución registrada.**

Eso cambia el problema. No es «hay que cerrar 28 puertas sin romper nada», es
«hay 4 puertas en uso y 24 que probablemente no le sirven ya a nadie».

⚠️ **Con una salvedad honesta:** n8n purga el historial de ejecuciones. «Sin
ejecuciones» puede significar que nunca corrió **o** que su historial se borró.
Lo que sí sostiene la lectura es el contexto: casi todas son de sistemas que ya
están muertos o pausados —el WhatsApp de FerreteríaYa lleva 18 días caído, Zoe
está pausada, y el sistema viejo de Bejauha es justo el que se va a cortar.

## Las 4 que sí se usan — estas NO se tocan sin mirar

| Ruta | Gravedad | Última | Qué es |
|---|---|---|---|
| `wa-router` | **ALTA** | hace 1 día | El router de desarrollo multi-proyecto. Es el que usa el ensayo de go-live |
| `savia-sync-catalogo` | MEDIA | hoy | Sincroniza el catálogo de WooCommerce de Savia |
| `fy-trigger-wf1` | MEDIA | hoy | Dispara el blog SEO de FerreteríaYa |
| `lau-newsletter` | BAJA | hace 2 días | Un formulario público. Probablemente está bien abierto |

**`wa-router` es la única ALTA que está viva**, y es de las nuestras. Es la
primera que yo cerraría: se le pone la firma como al agente, y se prueba con el
ensayo de go-live que ya existe.

## Las 24 dormidas, agrupadas por la decisión de la que dependen

| Grupo | Cuántas | De qué depende cerrarlas |
|---|---|---|
| **Sistema viejo de Bejauha** | 7 | **Fila 25** — cortar Bejauha al estándar. Cuando se corte, estas se van con él |
| **Agentes viejos de FerreteríaYa** | 4 | **Fila 26** — qué se hace con los clientes que tienen agente viejo |
| **Savia y LuxeSmile** | 4 | Fila 26, lo mismo |
| **Zoe** | 5 | Ya está pausada. Son las más fáciles: nadie las llama y el cliente no cerró |
| **Formularios y otros** | 4 | Puede que estén bien abiertos. Mirar uno por uno, sin prisa |

## Qué haría yo, en este orden

1. **Ponerle la firma a `wa-router`.** Es la única ALTA viva, es nuestra, y hay
   con qué probarla.
2. **Apagar los 5 de Zoe.** Está pausada, no las llama nadie, y apagar un
   workflow se deshace en un clic — es lo más reversible que hay.
3. **Los de Bejauha se van solos** cuando se haga el corte de la fila 25. No
   vale la pena tocarlos antes: sería trabajo que el corte va a repetir.
4. **FerreteríaYa, Savia y LuxeSmile** esperan a la fila 26, que es una decisión
   comercial antes que técnica.

Lo que **no** haría: cerrarlas en bloque. De las 24, la mayoría son de clientes
vivos aunque el flujo esté dormido, y descubrir en dos meses que una sí se
usaba es peor que la puerta abierta.

El detalle crudo, con rutas y fechas, está en
[`workflows/inventario-webhooks.json`](../workflows/inventario-webhooks.json).
