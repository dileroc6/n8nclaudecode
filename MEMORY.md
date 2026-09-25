# Memoria del proyecto

> Lo que hay que saber **antes de tocar nada**, y que no se deduce leyendo el código.
>
> No repite lo que ya está en otro sitio: la arquitectura está en [`CLAUDE.md`](CLAUDE.md),
> qué se vende en [`producto-paquetes-piezas.md`](ToqueFlow/arquitectura/producto-paquetes-piezas.md),
> las tareas en [`TABLERO.md`](ToqueFlow/TABLERO.md) y el detalle de los días
> grandes en [`ToqueFlow/bitacora/`](ToqueFlow/bitacora/). Aquí va lo que cuesta
> aprender a golpes.

---

## Dónde estamos, en un párrafo

**Un solo cliente pagando** (Bejauha, $620.000/mes) y **casi ninguno operando**.
Desde septiembre de 2026 el modo de trabajo es explícito: no se está trabajando
para reactivar a los clientes parados — se está **completando la plataforma para
clientes nuevos**.

Eso cambia cómo se prioriza. Una avería de un cliente parado no bloquea nada; lo
que bloquea es cualquier cosa que un cliente nuevo no pueda hacer solo.

La restricción del negocio no es conseguir clientes: es **poder implementarlos**.
El costo marginal por cliente es casi cero; lo que se acaba son las horas.

---

## Las cinco cosas que más han costado

### 1. Una función, un archivo

Reaplicar los esquemas en un orden u otro decide **en silencio** qué versión
corre. Rompió cosas de verdad tres veces:

| Cuándo | Qué se rompió |
|---|---|
| 14-sep | `tf_tool_agendar_cita` — el agente contestaba «no se pudo por un error técnico» |
| 17-sep | El agente dejó de saber **cómo le pagan** a su negocio |
| 17-sep | Perdió **la memoria de la conversación** y **qué instrucción lee** de cada herramienta |

**Ninguna falló al romperse.** Simplemente dejaron de hacer lo que hacían.

Lo vigila `pruebas/calidad/una-funcion-un-archivo.cjs`, con la lista en cero
desde el 24-sep. Vaciarla no fue cerrarla: es el estado en el que tiene que
mantenerse.

**Y no se parchea una función desde fuera.** Había tres archivos que reescribían
`tf_agente_contexto` por fuera. Estaban bien hechos —contaban anclas, fallaban
ruidoso— y aun así eran segundos escritores, que es lo único que hace falta.

### 2. Una pieza no está lista hasta que el **negocio** puede hacer su parte

Tres pines se vendieron a $250.000/mes sin que el negocio pudiera operarlos:
Agenda no dejaba decir a qué horas se atiende, Recargas no dejaba aprobar una
recarga, Tienda no dejaba cargar el catálogo. La herramienta funcionaba y las
pruebas pasaban.

Es la **regla 6** del documento de producto. La pregunta antes de marcar algo
liberado: *¿puede un cliente nuevo usarlo de punta a punta sin que nadie entre a
la base?*

### 3. Un chequeo que grita lobo se acaba ignorando

Todo chequeo se prueba **de las dos formas**: que cace lo malo y que **no marque
lo bueno**. Un hook que bloquea commits con falsas alarmas es un empujón hacia
`--no-verify`, y ahí deja de proteger nada.

Ya pasó tres veces: la auditoría marcando los `GRANT` de Supabase (33 falsos),
la llave `anon` (pública por diseño), y `agente-agenda` fallando al azar.

Y su reverso: **una prueba que pasa por no haber respuesta no está pasando.**

### 4. Probar desde afuera, y exigir el hecho

El aislamiento se comprueba con **la llave pública y sesión de miembro**, nunca
con el rol de servicio — que legítimamente lo ve todo. Y montando **dos**
empresas: «no ve lo del otro» no se prueba con una.

Un escenario que prueba una acción tiene que exigir **el hecho en la base**, no
palabras. *«Listo, queda anotado tu pedido»* pasaba en verde con cero pedidos.

### 5. El tablero va por detrás de la realidad

Comprobar contra el código antes de construir o de pedirle algo a alguien. Ha
habido filas abiertas estando hechas tres días, filas duplicadas describiendo la
misma tarea, y una fila referenciada que nunca se guardó.

---

## Quién es dueño de qué verdad

Cuando dos sitios dicen lo mismo, se separan. Estos son los dueños:

| La verdad sobre… | Vive en |
|---|---|
| A quién le llega una campaña | `tf_campana_destinatarios` — la llaman el portal **y** el envío |
| Qué horas están libres | `tf_agenda_libre` — la llaman el agente **y** el portal |
| Cómo cobra un negocio | `tf_cobro_de` — mira lo de la consola y lo del cliente |
| De quién es una empresa | `tf_es_mia` — devuelve true o false, **nunca NULL** |
| En qué hora vive un negocio | `tf_zona` — toda la agenda es su hora de pared |
| Qué se puede encender | `tf_puede_encender`, servido ya calculado por la vista |
| Qué trae cada pieza del producto | `catalogo` en la base; el documento de producto lo explica |
| Las tareas | `TABLERO.md` — `TASK.md` es una vista generada |

**Un NULL no es un «no».** `tf_es_mia` existe porque la comprobación estaba
copiada en cada función con dos errores que se tapaban: `current_user` dentro de
una `SECURITY DEFINER` nunca es quien llamó, y `false or NULL` es NULL — y
`if not NULL then` **no se ejecuta**. Cualquier sesión sin perfil se colaba.

---

## Lo que no puede hacer el agente

- **Nunca cierra.** Puede restar; no puede sumar, prometer ni dar por cierto.
  Matricular, recargar y confirmar un pedido **siempre los confirma una persona**.
- **No se inventa una cuenta.** Sin forma de cobro configurada dice «te confirmo
  cómo puedes pagar» y escala.
- **Un precio sale de la base, jamás del modelo.**
- **Distingue «no sé» de «no hay»**: `null` y `0` no son lo mismo, y decir «no
  hay» cuando no se sabe es una venta perdida.
- La empresa se deriva de la **instancia de WhatsApp**, nunca del payload.

## Lo que no puede hacer una campaña

- **Sin filtros no entra nadie.** Una campaña con el filtro vacío que le escribe
  a toda la base es como se gana un baneo de WhatsApp.
- **Las bajas se excluyen siempre**, fuera del filtro para que no se puedan
  desmarcar. Es obligación legal.
- **WhatsApp jamás en frío.** El primer contacto es email; WhatsApp entra después
  de que el prospecto responda. Hay antecedente de baneo.

---

## Higiene que ya costó un susto

- **Ningún secreto en texto plano.** El 24-sep se encontraron **dos contraseñas
  de portal en el repo público que todavía abrían sesión**. Lo vigilan el hook
  `.githooks/pre-commit` y `pruebas/seguridad/nada-literal-en-el-repo.cjs`, que
  mira los 1.070 archivos versionados — el hook solo protege del futuro.
- **Quitar un secreto del archivo no lo despublica.** Hay que rotarlo.
- **Una prueba limpia lo suyo.** Llegaron a quedar 23 super admins de prueba
  vivos, y un agente de pruebas encendido en producción durante semanas.
- **El repo es público** por decisión pendiente de revisar (fila 113).

---

## Cómo se trabaja aquí

1. **Mirar antes de construir.** El tablero puede estar desactualizado y la tarea
   mal planteada. Comprobar contra el código y contra la base.
2. **Correr el banco antes de dar algo por bueno.** Hay **un solo workflow de n8n
   para todos los clientes**: un cambio malo los rompe a todos a la vez.
3. **Los parches a archivos van en un `.cjs`, no en una línea de shell.** Las
   comillas y los `\n` se los come bash — ya truncó un archivo entero. Y el
   script **guarda después de cada reemplazo**, no al final: uno que falla a
   mitad y se lleva lo anterior es peor que uno que no arranca.
4. **Contar las ocurrencias del ancla y negarse si no es exactamente una.**
5. **Español neutro (Colombia)** de cara al usuario. Las pantallas compartidas no
   hablan de un solo sector — lo vigila `nada-de-un-cliente.cjs`.