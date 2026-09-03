# ToqueFlow — Tablero

> Estado al **28 de agosto de 2026**, después del diagnóstico comercial.
> Organizado por tema. Lo que decide el negocio está arriba; lo técnico heredado, abajo.

**Dónde estamos:** un cliente pagando (Bejauha, $620.000/mes, 3 meses). Cinco implementaciones entregadas sin cobrar, tres de ellas muertas porque nadie pidió una decisión. Meta: **4.000.000 libres al mes** (2 millones cada socio) que son unos 9 clientes. **Hoy el negocio neto es cero:** lo que paga Bejauha cubre el VPS y Claude Max.

**Las dos consecuencias que ordenan todo:**
1. El problema no es el producto ni el mercado — **es que no se corre un proceso de venta.** Se arregla con calendario, no con código.
2. **La meta exige el producto estándar.** Nueve clientes a 45–90 h son 400–800 horas; a 11–14 h son 110. Y **subir el precio es la única palanca que no cuesta horas.**

**El reparto:** Ferney es dueño del cierre. Diego estandariza la entrega. Bolsillos de tiempo distintos, en paralelo.

---

## 🔥 Esta semana

| # | Tarea | Quién |
|---|---|---|
| 1 | **Propuesta con precio y fecha a SM Grand Hotel** — es el más caliente, está en negociación | Ferney |
| 2 | **Recotizar Zoe a $1.200.000 + $600.000/mes** — le pasaste $5.5M y nunca supiste si ese fue el freno | Ferney |
| 3 | **Propuesta con precio y fecha a Savia y LuxeSmile** | Ferney |
| 4 | **Revisar el extracto: ¿Vassco está pagando?** Cinco minutos. No se puede planear sin saber cuánto factura el negocio | Cualquiera |
| 5 | ~~El correo de tu sitio estaba muerto~~ | ✅ **Resuelto.** Casilla hola@toqueflow.com creada. Verificado: MX, SPF, DKIM y DMARC configurados automáticamente por Hostinger. El correo del sitio ya funciona | — |
| 6 | 🔑 **Crear una llave de Anthropic propia de ToqueFlow** | **Las tres que había están muertas** (`LeadAI`, `Anthropic account`, `AP`: las tres devuelven 401). El agente está corriendo **prestado, con la credencial `Anthropic - Ferre Rappi`**, que es de otro proyecto — funciona, pero el costo se mezcla. En console.anthropic.com: cargar saldo ($5 sobra), crear un **Workspace `ToqueFlow` con tope de gasto**, y ahí la llave. En n8n, credencial nueva llamada exactamente `Toque - Anthropic (Agente)` | Diego |
| 7 | ~~Apuntar la credencial de Postgres del workflow~~ | ✅ **Hecho el 27-ago.** No había que crear nada: `Toque - Supabase Postgres (n8n_worker)` ya existía en n8n desde julio. Quedó apuntada en los dos nodos | — |
| 8 | ~~🔑 Generar un `SUPABASE_ACCESS_TOKEN`~~ | ✅ **Hecho el 30-ago.** Ya están desplegadas las dos edge functions que esperaban por él |
| 9 | **Arrancar el cargador de conocimiento** — el 40% del costo de implementar está ahí | Diego |
| 10 | **¿Pueden facturar formalmente ya?** Si SM Grand dice que sí la otra semana, tienen que poder emitir factura. Un "podríamos manejarlo" se vuelve un freno en el peor momento | Ambos |
| 11 | **Pasar los números exactos de Claude Max y del VPS** | Diego |

Plantilla lista en [estrategia/plantilla-propuesta.md](estrategia/plantilla-propuesta.md): correo, seguimiento en 4 toques, y la pregunta que hay que hacer cuando dicen que no.

---

## 💰 Ventas

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 12 | Pedir dos referidos a Bejauha | Incentivo: un mes de operación gratis por referido que cierre | Ferney |
| 13 | Fijar el precio y no moverlo | $1.200.000 + $600.000/mes, sin excepciones, los primeros tres clientes | Ambos |
| 14 | Definir el techo de una demo gratis | Pediste un día (8 h). Con la agenda de ustedes eso es dos tercios de una semana | Ambos |
| 15 | Armar la lista del segmento | Clínicas estéticas, odontológicas y spas de Bogotá. Los contactos de Ferney son el canal, no un segmento aparte | Ferney |
| 16 | Cronometrar el próximo cliente, hora por hora | Es la hipótesis que decide si esto es negocio o empleo | Diego |

---

## 🏗️ Producto estándar

Seis capacidades: responder y sugerir · agendar · capturar · recordar · enrutar · registrar.
Especificación completa en [estrategia/producto-estandar.md](estrategia/producto-estandar.md).

**En orden de retorno sobre hora invertida:**

| # | Pieza | Por qué ahí | Quién |
|---|---|---|---|
| 17 | 🟡 **Construir las piezas que faltan** | ✅ **Toque Agenda casi entero** (30-ago): `ver-disponibilidad` y `agendar-cita` hechas y probadas en conversación real; falta `recordatorio-cita`. **Falta Toque Recargas** —matricular, descontar, recargar— con la regla que no se negocia: **matricular y recargar los confirma SIEMPRE una persona.** El cliente final los pide por WhatsApp, el agente registra la solicitud, y al dueño le llega el aviso para aprobar; un agente que recarga solo es un agente que regala. **Falta Toque Tienda** —estado del pedido, confirmar pago—, que necesita integrar contra la tienda de cada cliente: **es otro precio, y la integración es por PLATAFORMA y no por cliente** (la primera tienda WooCommerce cuesta construirla; la segunda ya está hecha). Y `registrar-reclamo`, suelta | Diego |
| 18 | ~~⭐ Varios agentes por empresa~~ | ✅ **Hecho el 28-ago.** `agent_config` tiene ahora su propia llave y un nombre; una empresa puede tener los agentes que necesite, cada uno con su número de WhatsApp, su tono y sus herramientas. **El cambio fue pequeño porque el diseño ya lo permitía sin saberlo:** todo se resuelve por la instancia, que siempre fue única — el agente nunca preguntó «¿cuál es el agente de esta empresa?» sino «¿de quién es esta instancia?». El conocimiento se comparte, y lo que cambia entre sedes se carga solo para un agente. Probado con dos agentes de FerreteríaYa: Bogotá ve 2 documentos, Medellín 1 |
| 19 | 🔴 **El ensayo de go-live falló, y destapó algo que hay que arreglar antes** | Diego escribió el 30-ago y **no recibió respuesta**. El agente sí entendió y redactó bien («Holaa 🤍 Tenemos dos planes: Virtual $79.900/mes…»); falló al enviarlo. El motivo: WhatsApp mandó `remoteJid = "30146492928046@lid"` con `addressingMode: "lid"` — **ya no siempre manda el número, manda un identificador opaco**. El agente le quita el `@lid`, se queda con dígitos que no son un teléfono, y Evolution lo rechaza. **A quien llegue así, el agente ni le puede contestar ni lo reconoce en la base**, porque busca por teléfono. Es el mismo tipo de fallo que el del «+» en los 46 contactos, y ninguna prueba lo vio porque todas usan números inventados. Y no es un caso raro: el WhatsApp de Diego llegó así. **El arreglo toca el workflow compartido**, así que va con el protocolo de la fila 65 | Claude |
| 20 | ~~Sacar las columnas de Bejauha de la tabla compartida~~ | ✅ **Hecho el 28-ago**, aplicando la regla que dio Diego: *si es un módulo estándar debe servirle a TODOS los sectores; las herramientas sí cambian por sector*. Se retiró la lista fija de productos de Bejauha en `service_type`, y **el saldo se mudó a su propia tabla** — una tienda o un hotel ya no cargan con dos columnas que nunca van a llenar. `status` se amplió sin quitar lo que Bejauha usa. **Falta borrar las columnas viejas** de `contacts`: las leen `contactos.html` y el simulador, y romper el panel de un cliente que sí paga por limpiar un nombre feo no vale la pena | Diego |
| 21 | **El logo de Bejauha** | El de FerreteríaYa apareció en el repo y ya está arriba. El de Bejauha no existe en ninguna parte: por ahora sale el respaldo con iniciales. Pedírselo al cliente | Diego |
| 22 | ~~🚨 El agente no habría reconocido a ningún cliente real de Bejauha~~ | ✅ **Arreglado el 28-ago.** Los 46 contactos tienen el teléfono guardado como `+573185478900`; WhatsApp lo entrega sin el «+». Todas las búsquedas comparaban el texto crudo, así que el día del go-live **el agente les habría creado un contacto duplicado a los 46** y cada cliente que volviera habría parecido nuevo, sin nombre ni historial. **No lo vio ninguna prueba porque todas usaban teléfonos inventados, escritos sin «+».** Ahora se compara por dígitos con `tf_telefono()`, con índice. Verificado contra un contacto real |
| 23 | **Normalizar los teléfonos guardados** | El arreglo compara bien pero no toca los datos: siguen mezclables. Falta decidir un formato único y migrar, revisando que no rompa campañas ni la pantalla de contactos. Y de paso: hay teléfonos sin indicativo en otros clientes, que es un problema peor porque no se puede adivinar el país | Diego |
| 24 | ~~Probar contra datos reales, no inventados~~ | ✅ **Hecho.** El banco admite escenarios con teléfono fijo, y hay uno —`usa-herramienta`— que corre contra **Laura Rubio, contacto real de Bejauha con 1 clase**. La limpieza distingue: de los inventados borra todo, de los reales solo los mensajes de prueba. **14 de 14 pasan** |
| 25 | ⭐ **Cortar Bejauha del sistema viejo al estándar** | Comprobado el 28-ago: Bejauha corre en **los dos a la vez**. El genérico lleva 115 llamadas en el sandbox; y siguen activos **seis workflows viejos suyos**, incluido `Bejauha - Inbound Bot Planes (Sheet)`, que es el agente anterior leyendo de un Google Sheet. **No es «prender el interruptor»: es un corte.** Hay que decidir qué se apaga, en qué orden, y qué pasa con lo que el viejo hace y el nuevo todavía no —consultar saldo, recargas, asistencia— porque eso hoy vive en el agente admin. Mientras no se resuelva, encender el nuevo con la instancia real dejaría dos bots contestando el mismo WhatsApp | Diego |
| 26 | **Decidir qué se hace con los otros clientes que tienen agente viejo** | FerreteríaYa (3 agentes de WhatsApp + 2 de Telegram), Savia (bot de ventas de 63 nodos) y LuxeSmile tienen agentes propios anteriores al estándar. Cada uno es la misma pregunta que la fila anterior. **Normalizarlos es lo que de verdad retira las 45–90 horas por cliente** — pero hacerlo mal rompe algo que hoy funciona | Diego |
| 27 | **Cargador de conocimiento (web)** | 🟡 **Escrito y con el rastreador probado contra sitios reales el 29-ago; falta desplegarlo.** Recorre el sitio del cliente, limpia el HTML y le pide a Haiku que lo ordene en servicios, precios, horarios y políticas. **Probarlo destapó cuatro fallos, ninguno visible leyendo el código:** (a) el recorte se hacía sobre el HTML y no sobre el texto, y como una web moderna es casi todo marcado, se perdía la mitad donde suelen estar los precios — 1.289 caracteres en vez de 7.775; (b) las rutas que buscaba suponían una clínica, así que en la tienda de Savia no casaba ni un enlace y se cargaba solo la portada; (c) un dominio puede resolver con `www` y no sin él —`www.zoetantricspa.com` da ENOTFOUND y sin `www` responde 200— así que a un cliente entero le decía que su sitio no existe; (d) quitaba el `<footer>`, que es donde vive el teléfono, y el documento salía sin «Ubicación y contacto». **Ahora los tres sitios de cliente dan entre 7.000 y 9.000 caracteres utilizables.** Queda `pruebas/calidad/cargador-conocimiento.cjs`, que ejecuta el código de la función de verdad —no una copia, que se desincroniza— contra Bejauha, Savia y Zoe. **Bloqueado para desplegar:** `SUPABASE_ACCESS_TOKEN` (fila 8) y una llave propia de Anthropic (fila 6). PDF sigue pendiente | Diego |
| 28 | ~~Tabla `agent_config` + RLS~~ | ✅ **Aplicado en Supabase el 27-ago.** `agent_config`, `agent_knowledge` + vista, y `appointments`. RLS activo con 10 políticas, y `n8n_worker` con permisos mínimos: lee configuración y conocimiento, escribe citas, nunca borra | — |
| 29 | ~~Workflow genérico de n8n~~ | ✅ **Escrito y probado el 27-ago:** `ToqueFlow/workflows/agente-atencion-generico.json`, 15 nodos, uno solo para todos los clientes. La empresa se resuelve por la instancia de Evolution, no por la URL. Probado contra la base: prefijo cacheable idéntico byte a byte entre clientes distintos, alternancia de roles correcta. **Falta antes de importarlo:** apuntar la credencial de Postgres (viene con `"id": "REEMPLAZAR"`) y cargar `ANTHROPIC_API_KEY` en n8n | Diego |
| 30 | ~~Caché de prompt con TTL de 1 hora~~ | ✅ **Hecho, y con un hallazgo:** el bloque estable va en `system` con `cache_control` de 1 h, y se verificó que sale idéntico byte a byte. **Pero un cliente de 12 KB no cachea:** su prefijo son ~3.400 tokens y Haiku 4.5 exige 4.096. No es grave —pagarlo entero cuesta ~$17/mes contra ~$12 de uno grande cacheado— pero el número de la estrategia quedó corregido. El workflow marca `cachea:false` y alerta si un prefijo cacheable no se lee | Diego |
| 31 | ~~Banco de pruebas de conversación (evals del agente)~~ | ✅ **Construido y corriendo el 27-ago.** `plataforma/pruebas/correr-pruebas.cjs` + `escenarios-agente.json`. **12 escenarios, 12 pasan**, 6 centavos de dólar la corrida completa. Los escenarios son **datos**: agregar uno es agregar un objeto al JSON, sin tocar código. Además de lo que pide cada escenario, revisa en TODA respuesta que no aparezca **ninguna URL ni ningún precio que no esté en el documento** — la lista de lo válido se saca del conocimiento, así que si Bejauha sube un precio la prueba se entera sola. **Verificado que sabe fallar:** tres sabotajes deliberados los cazó, y el detector de invenciones caza la URL corrupta de esta misma tarde | — |
| 32 | **Correr el banco de pruebas antes de cada cambio del agente** | Es la regla, no la herramienta. Con un solo flujo para todos los clientes, un cambio malo los rompe a todos a la vez: `node pruebas/correr-pruebas.cjs` antes de tocar nada | Diego |
| 33 | **Cron semanal del banco de pruebas** | Que corra solo y avise **solo si algo falla**, reusando el webhook de alertas del VPS. El agente puede degradarse sin que nadie toque nada: si el cliente edita su conocimiento y borra un precio, o si cambia el modelo. Cuesta 6 centavos por corrida. Sin esto, el banco solo protege cuando alguien se acuerda de correrlo | Diego |
| 34 | ~~Agenda simple~~ | ✅ **Construida y probada el 29-ago.** Franjas por día con cupos, duración por servicio, y bloqueos para festivos o una tarde cerrada. **No** agenda contra personas ni recursos, como decía la nota. Todo es del cliente y lo maneja él. `tf_agenda_libre()` devuelve las horas realmente libres contando franjas, duración, cupos, citas tomadas y bloqueos — **una sola definición de «libre»** para el agente y para el portal, porque tener dos es cómo se termina ofreciendo una hora que ya estaba ocupada. **La prueba encontró un bug de raíz:** mezclaba la hora de RELOJ del negocio con instantes en UTC, y por eso ofrecía un hueco a las 23:00, no contaba las citas y los bloqueos no tapaban nada — los tres eran el mismo error. Ahora todo se calcula en la zona del negocio (`companies.metadata.zona_horaria`, Bogotá por defecto). Sobre esto se montan `ver-disponibilidad` y `agendar-cita` | — |
| 35 | **Conectar el agente con Google Calendar** | El agente ya sabe **decir** que alguien quiere una cita (`accion: "agendar"`), pero no la crea: por ahora ese caso se comporta como escalamiento. Es el único brazo que le falta al workflow genérico | Diego |
| 36 | ~~Cron de recordatorios~~ | ✅ **Hecho el 3-sep. Toque Agenda queda completo y vendible.** Un cron cada 5 minutos busca las citas que toca recordar y las encola en el outbox; de ahí sale el WhatsApp por el mismo camino que las campañas — un patrón, no dos. **Las tres cosas que podían hacer daño, tapadas:** se marca la cita ANTES de encolar (repetir molesta, y molestar por WhatsApp es como se gana un baneo); solo sale dentro del horario que el negocio defina, en SU hora, y fuera de él NO se marca como enviado para que no se pierda; y nunca se manda una cita que ya pasó. Configurable por negocio: cuántas horas antes, si pide confirmación y qué texto. Se agregó `confirmar-cita`: cuando la persona contesta, el agente marca si viene — **y si dice que no, la hora se libera para venderla otra vez.** La cita se busca por el teléfono de quien escribe, nunca por un id que venga de fuera. Probado de punta a punta: cron → outbox → receptor → mensaje, por las dos ramas (WhatsApp y simulador) |
| 37 | Pantalla de configuración | Para no editar JSON a mano. Puede esperar al tercer cliente | Diego |
| 38 | ~~El cliente edita su propio conocimiento desde el portal~~ | ✅ **Hecho el 30-ago.** Los permisos ya estaban desde julio —un miembro podía escribir, editar y borrar lo suyo— pero **sin pantalla, «el cliente puede» es teoría**. Ahora en Ajustes: escribe documentos, corrige un precio, apaga sin borrar (una promoción de diciembre se apaga en enero y se reenciende sin reescribirla) y ve el medidor. **La prueba encontró que mi propia pantalla habría fallado:** escribía `tipo: texto` y la tabla solo acepta `web`, `pdf` o `manual`. Va en `pruebas/seguridad/` porque el riesgo es peor que el del tono: quien escriba en el documento de otra empresa decide lo que el agente de esa empresa le responde a sus clientes, precios incluidos |

---

## 🖥️ Consola de administración de ToqueFlow

Que dar de alta y configurar un cliente se haga **desde el portal, sin correr código**. Hoy cada alta es un script y cada configuración es editar JSON a mano.

| # | Tarea | Nota |
|---|---|---|
| 39 | ~~Que el CLIENTE pueda configurar su propio agente~~ | ✅ **Completa el 29-ago.** Los campos ya los manejaba (fila 52); ahora también **cómo habla su agente**, desde Ajustes en su propio portal. **Se hizo con una puerta estrecha a propósito:** darle un UPDATE sobre `agent_config` habría sido lo cómodo y habría abierto un agujero de aislamiento — podría mover `whatsapp_instance` y apuntar su agente a la instancia de otra empresa, y desde ahí leer conversaciones ajenas, porque todo el sistema resuelve el inquilino por la instancia. En vez de eso, `tf_agente_tono()` solo escribe el tono y solo en un agente suyo. Probado con sesión de miembro: sí cambia el suyo; NO el de otra empresa, NO mueve la instancia, NO enciende el agente saltándose el sandbox, NO se da herramientas sin contratar, y NO acepta un tono desmedido — el tono va en cada mensaje, así que uno de tres páginas se cobra en cada conversación | — |
| 40 | ~~Conectar el WhatsApp desde la consola, con el QR~~ | ✅ **Construido el 28-ago.** Encender un producto no valía de nada si detrás no había un WhatsApp conectado. Ahora en la configuración del agente se crea la instancia en Evolution, sale el **código QR** para escanear desde el celular del negocio, y la pantalla se entera sola cuando conecta. **El webhook con la firma queda puesto desde la creación** — dejarlo para después es como se olvida y se termina con una instancia abierta que nadie protege. La autorización es el token de Supabase de quien pide: comprobado que rechaza sin token y a un miembro, y que solo pasa un super admin |
| 41 | ~~Encender un producto sin nada detrás~~ | ✅ **Resuelto el 28-ago.** Ya no se puede: si se pulsa encender en Toque Atiende y esa empresa no tiene ningún agente, el botón dice **«configurar para encender»** y lleva a crearlo, con su tono, sus campos, sus herramientas y el código QR. Encender deja de ser cambiar una etiqueta |
| 42 | ~~Decidir el nombre del producto estándar~~ | ✅ **«Toque Atiende»**, aprobado y ya puesto en el catálogo. Abre familia: Toque Agenda, Toque Factura |
| 52 | ~~⭐ Guardar clientes con campos propios, dentro de Toque Atiende~~ | ✅ **Construido, probado y desplegado el 28-ago**, cerrando la regla que diste: *si es un módulo estándar debe servirle a TODOS los sectores*. **Los campos dejaron de ser del agente y pasaron a ser de la empresa** (`contact_campos`), y eso es lo que cambia todo: el cliente entra a su base de contactos, pulsa **«Campos de la ficha»** y crea los suyos —talla, placa, cumpleaños— con **listas cerradas de opciones** cuando quiere poder contar después. Los ve como una columna más, los edita en cada ficha y los borra. Y una casilla decide si el asistente los pregunta por WhatsApp: **una definición, dos usos**, sin que nadie toque la configuración del agente. Probado con sesión de miembro, no de admin: 13 comprobaciones, incluidas las tres que importan —no ve, no crea ni borra los campos de otra empresa | — |
| 53 | ~~La ficha de contactos estaba escrita para Bejauha~~ | ✅ **Hecho el 28-ago.** Las columnas del saldo aparecen solo donde hay algo que contar, y con las palabras del negocio: Bejauha ve «Membresía» y «Clases»; FerreteríaYa, Savia y SM Grand no las ven. «Qué compró» pasó a ser texto libre con sugerencias de lo que ese negocio ya guardó. La importación acepta los campos propios y valida contra la lista cuando es cerrada. **Prueba nueva `nada-de-un-cliente.cjs`:** busca vocabulario de un cliente en las pantallas que ve cualquiera — encontró el id `f-clases`, que se renombró | — |
| 54 | **El simulador sigue escrito alrededor de las clases de Bejauha** | `modo-prueba.html` tiene pestañas «gestión de clases», recarga de saldo y un botón que pregunta «¿con cuántas clases quieres dejar el contacto?». Es lo último que queda del molde viejo en el portal. Se dejó aparte a propósito: **tocarlo es tocar el sandbox**, y la regla es que el sandbox no puede comportarse distinto de producción | Diego |
| 55 | ~~Las herramientas del estándar no eran estándar~~ | ✅ **Corregido el 28-ago, por tu observación:** *«¿Consultar saldo? ¿De qué, si no todos tienen paquetes? Debe ser consultar la información de un cliente y editarla.»* Toque Atiende ahora lleva SIEMPRE cuatro piezas —responder · **escalar a una persona** · ver la ficha · anotar en la ficha— y el resto se enciende por caso de uso. Escalar existía desde el principio dentro del workflow pero no estaba en el catálogo, así que no se veía ni se podía vender. **Y al construirlo apareció que el agente ya hacía las dos cosas sin llamar a nadie**, así que en vez de dos herramientas nuevas (una llamada extra a Claude cada vez) se completó lo que ya había: la ficha y el saldo llegan en el contexto de cada turno con las etiquetas del negocio, y **al guardar ahora sí hay candado** — antes `tf_agente_registrar` metía en la ficha cualquier cosa que llegara, incluida una opción fuera de la lista cerrada. Un prompt no es un candado | — |
| 116 | ~~⭐ Los paquetes: el nivel entre el producto y las piezas~~ | ✅ **Definido y construido el 30-ago**, por decisión de Diego: *«eso de matricular y recargar deberíamos unirlos y llamarlos Paquete Recargas, y otro Paquete Tienda, y de esa misma manera venderlo»*. Es una decisión comercial antes que técnica: **el catálogo tenía 22 piezas sueltas, y vender piezas sueltas significa que cada venta es una cotización a medida** — el problema de las 45–90 horas por cliente en su versión comercial. Tres niveles: **producto** (Toque Atiende, lo que se contrata) · **paquete** (Agenda · Recargas · Tienda, lo que se le suma) · **pieza** (lo que el agente llama). Las piezas siguen existiendo: el paquete es capa de venta, no reemplazo. La expansión ocurre al USAR y no al contratar, así que un paquete que mañana gane una herramienta se la da a quien ya lo tenía. Documentado en [arquitectura/producto-paquetes-piezas.md](arquitectura/producto-paquetes-piezas.md), que es la hoja de ruta | — |
| 117 | ~~Los tres niveles se ven en las dos pantallas~~ | ✅ **30-ago.** En la consola: el producto con lo que va siempre, los paquetes con sus piezas a la vista —incluidas las que faltan por construir, que es lo que hay que saber antes de prometerle un paquete a un cliente— y las sueltas aparte. En el portal del cliente: qué contrató, qué se le puede sumar, y al abrir cada paquete qué hace por dentro. **Los que no tiene se muestran sin botón de compra**, a propósito: que sepa que existen, no venderle desde una pantalla |
| 43 | **El cliente ve qué más existe** | La consola ya muestra el catálogo completo por empresa. Del lado del cliente falta decidir si ve las piezas que **no** tiene —abre venta adicional pero puede sentirse a presión— y con qué tono | Ambos |
| 44 | ~~⭐ Herramientas conectables: el mecanismo del lego~~ | ✅ **Construido y probado el 28-ago.** El agente puede llamar sub-flujos por nombre: se declaran en `agent_config.herramientas`, el contexto las resuelve contra el catálogo y el workflow ejecuta la que corresponda. **El agente no sabe qué hacen por dentro.** Cada herramienta es un workflow aparte con su propio webhook, protegido por la misma firma — así se puede probar sola, con curl, que es como apareció el bug de los teléfonos. **Una sola vuelta, sin bucle:** en la segunda llamada se fuerza `responder`, porque un bucle sin tope en n8n es un bucle que algún día se queda gastando dinero. Primera herramienta real funcionando: consultar saldo |
| 45 | ~~Catálogo maestro de piezas + `flows` que lo referencie~~ | ✅ **Aplicado el 28-ago.** Tabla `catalogo` con **22 piezas** (9 productos, 7 herramientas, 6 automatizaciones), `flows.catalogo_id` y la vista `empresa_catalogo`. Las 13 filas que existían quedaron enganchadas, ninguna huérfana. **Se agrega, no reemplaza:** una migración que rompe el panel de un cliente que sí paga no vale la pena |
| 46 | ~~Pantalla de productos por cliente~~ | ✅ **Desplegada el 28-ago.** Pestaña **Productos** en la consola: la matriz de empresas × piezas, y activar un producto pasa de teclear una fila a pulsar una casilla. Tres estados: activo · **prometido** (aparece como «próximamente» en su panel — es una deuda, no un logro) · nada. Una celda agrupa varias sedes y las cambia todas a la vez |
| 47 | ~~Pantalla de alta de cliente~~ | ✅ **Construida y desplegada el 28-ago.** Paso a paso de cinco pantallas: la empresa · quién la usa · qué contrata (**solo lo liberado**) · cómo tiene que atender · listo. Crea empresa, usuario, filas de productos y configuración del agente en un solo recorrido. **Lo que más importa y está probado: el agente nace apagado y con una instancia de WhatsApp que no existe.** Encenderlo es un acto aparte, después del sandbox — un alta que deja un bot contestando de una no es rápida, es peligrosa |
| 48 | ~~Pantalla de configuración del agente~~ | ✅ **Construida y desplegada el 27-ago.** Pestaña **Agentes** en la consola: una tarjeta por empresa con su estado, y un formulario que llena `agent_config` — tono, campos a capturar, reglas de enrutamiento, límites y agenda. **Se acabó editar JSON a mano.** El formulario explica lo que importa: que la instancia de WhatsApp apuntando a una que no existe es el interruptor más seguro para probar, y que los campos a capturar necesitan su **clave** explícita (el bug del nombre de Marcela, convertido en diseño) |
| 49 | ~~Carga de conocimiento desde el portal~~ | ✅ **Construida y desplegada el 27-ago.** Pegar el texto tal cual —de un Word, de un WhatsApp, de donde sea— con el **medidor visible**: barra que cambia de color al 75% y al pasarse, y el mensaje correcto en cada estado. Pasarse **no bloquea**: dice «sigue funcionando, hablemos del plan». Ver, activar, desactivar y borrar documentos. **Falta solo la carga por URL**, que necesita desplegar la edge function |
| 50 | ~~Panel de consumo por cliente~~ | ✅ **Estaba hecho** desde el 28-ago en la consola: costo del mes, contra el mes anterior, por producto, con selector de mes y el % de la mensualidad que se va en IA. Verificado con datos reales (Bejauha $1,51 · FerreteríaYa $6,34). **Y el 29-ago se agregó la mitad que faltaba:** el cliente ve en su propio panel *lo que hizo su asistente* — conversaciones atendidas, mensajes respondidos y personas nuevas en su base. **A propósito no ve el costo:** Bejauha paga $620.000 y la IA de su agente cuesta $1,51; poner esa cifra en su pantalla es abrir la conversación del precio en el peor sitio. Lo que sí quiere ver es cuánto se le quitó de encima | — |
| 51 | **Avisar al admin cuando un cliente se pasa del límite** | **Ya se ve en la consola** (tarjeta de la empresa y medidor). Falta el aviso que llega solo, sin que nadie entre a mirar. Escalonado: con 1–3 clientes basta un script `revisar-uso.cjs` que se corre cuando uno quiera; con 4 o más, un cron diario que avise **solo si alguien está en `cerca` o `excedido`**, reusando el webhook de alertas del VPS. **Un cliente que se pasa es la mejor señal de venta adicional que hay** — llega sola |
| 110 | ~~Plantilla de lo que entrega el cliente~~ | ✅ **Escrita el 27-ago:** [estrategia/levantamiento-informacion.md](estrategia/levantamiento-informacion.md). **No es solo pedir precios.** Siete puntos, ordenados por cuánto cambian la respuesta del agente: qué hacen, cómo lo hacen, **el valor agregado** (el que más cambia el cierre y el que menos gente entrega solo), precios, logística, las preguntas que ya reciben a diario, y los límites. Incluye cómo pedirlo sin espantar al cliente —llamada de 30 min grabada para lo que no está escrito— y tres preguntas de prueba que revientan un documento incompleto |
| 111 | 🚨 **La recuperación de contraseña está rota en producción** | Para **todos** los usuarios, no solo para ti. Supabase genera el enlace apuntando a `http://localhost:3000` porque la **Site URL** y la lista de redirecciones permitidas nunca se configuraron. Cualquiera que pulse «olvidé mi contraseña» aterriza en una dirección que no existe — y con clientes reales usando el portal, eso es una llamada de soporte por cada uno. Se arregla en el panel de Supabase → Authentication → URL Configuration: `https://toqueflow.com` como Site URL y `https://toqueflow.com/**` en las redirecciones | Diego |
| 109 | **Cambiar las dos contraseñas temporales** | El 27-ago se pusieron contraseñas temporales a `feruroc@gmail.com` e `ing_diegolrc@hotmail.com` porque la recuperación no funciona (fila anterior) y la guardada en `credentials.env` ya no servía. **Claude las vio al ponerlas.** Cambiarlas desde `perfil.html` apenas se entre | Diego |
| 112 | **Decidir qué se hace con `ing.diegolrc@gmail.com`** | Existía como `member` desde antes. La cuenta nueva de super admin es la de **hotmail**. Si la de gmail ya no se usa, desactivarla: una cuenta viva que nadie vigila es una puerta abierta | Diego |
| 56 | **Levantar la información de Bejauha con la guía nueva** | Es el cliente de referencia y hoy su conocimiento en la plataforma está **vacío**. Sirve doble: deja el caso de referencia bien armado y es el primer ensayo real de la guía, cronometrado | Diego |

**Orden:** la **23 primero** (es un documento, cuesta una tarde y la necesitas en la primera venta). La **22 después** (los datos ya están, es solo leerlos). Las 19–21 cuando duela configurar a mano — realistamente al tercer cliente.

---

## 🖼️ Sitio y operación

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 57 | 🚨 **El WhatsApp de FerreteríaYa lleva 6 días caído** | Sus cuatro instancias —`ferreteriaya`, `ferreteriaya-med`, `FERREB`, `FERREM`— pasaron a «connecting» el **23 de agosto a las 03:12, todas al mismo minuto**. Eso no son cuatro fallos: es un reinicio que se llevó las sesiones. Y ninguna de las cuatro registra un solo mensaje. Lo de Rappi sí funciona —9.301 impresiones desde junio, 4.121 solo en agosto— así que el cliente ve movimiento y puede no haberse dado cuenta. Se arregla volviendo a escanear el QR de cada una | Diego |
| 58 | **El logo y el favicon dan 404 en producción** | Los archivos se perdieron: no están en el repo, ni en el portátil viejo, ni en R2. Roto en el nav y footer de todas las páginas del portal | Diego |
| 59 | Resembrar `last-good-site.zip` cuando el logo vuelva | El punto de restauración actual no tiene imágenes | Claude |
| 60 | **Configurar `VASSCO_SHARED_SECRET`** y redesplegar las dos edge functions | La de Vassco deja de responder hasta que se haga | Diego |
| 61 | **Plan de respaldo del VPS de Evolution** | Cada cliente pone su número, pero Evolution corre en un solo VPS. Un baneo tumba a uno; una caída los tumba a todos. **Decidir antes del cliente cinco** | Diego |
| 62 | Encender WhatsApp en Bejauha | Sigue apagado desde el incidente de julio. Tu caso de referencia tiene que estar vivo | Diego |
| 63 | **Verificar cuántos workflows quedan tras la limpieza** | El usuario está borrando los de blogs y otros proyectos. Volver a contar activos e inactivos y medir la RAM de n8n antes y después | Claude |
| 64 | ~~Alerta automática de recursos~~ | ✅ **Funcionando.** Cron cada 15 min en el VPS, correo desde hola@toqueflow.com a los dos socios. Probada de punta a punta: alerta, recuperación y anti-spam | — |
| 65 | **Protocolo de cambios del flujo compartido** | Un error en el flujo único rompe a todos a la vez. Tres reglas: probar siempre en el sandbox contra una empresa de prueba, guardar la versión anterior en n8n para revertir en un clic, y activar primero para un solo cliente y esperar un día antes de extenderlo | Diego |
| 66 | **Manejo de errores aislado por ejecución** | Que la config mala de un cliente no tumbe la ejecución de otro, más un `Error Trigger` que avise | Diego |
| 67 | **Tomar un snapshot manual del VPS** | Consultado hoy: **no hay ninguno** (viene vacío). Los backups automáticos sí existen —semanales, dos retenidos, restauran en ~30 min— pero un snapshot antes de cada cambio riesgoso cuesta un minuto | Diego |
| 68 | **Escribir el documento de recuperación** | Una página: qué contenedores, en qué orden, qué variables. Hoy eso está solo en tu cabeza | Diego |
| 69 | **Probar la restauración una vez** | Antes del cliente cinco. Un respaldo que nunca se probó no es un respaldo | Diego |

---

## 📊 Capacidad: cuánto aguanta el flujo compartido

**Línea base medida hoy (24 h, con un solo cliente activo):**

| Recurso | Uso | Lectura |
|---|---|---|
| CPU | 4,4% promedio · 5,5% pico | Sobra muchísimo. **No es el cuello** |
| **RAM** | **3,24 GB de 4 GB — 81%** | **Aquí está el techo** |
| Disco | 11,6 GB de 50 GB — 23% | Sin problema |
| Uptime | 144 días | Estable |

**La conclusión operativa:** el riesgo no es que diez clientes vivan en el mismo flujo de n8n — el CPU está en 4%. El riesgo es la **memoria**, porque cada cliente suma una conexión permanente de WhatsApp en Evolution que consume RAM todo el tiempo, y ya se está usando el 81% con uno solo.

✅ **Resuelto abajo con la medición dentro del VPS.**

### Ejecutado el 27-ago — crons de Zoe desactivados

**Sin borrar nada.** Solo desactivados, reversibles en un clic si Zoe reactiva el negocio.

| Workflow | Frecuencia que tenía | Estado |
|---|---|---|
| Zoe — WF5 OTP cron | cada 5 min · **288 ejecuciones/día** | ⏸️ Desactivado |
| Zoe — WF4 Recordatorio 24h | diario 9 AM | ⏸️ Desactivado |
| Zoe — WF7 Festivos cron anual | anual | ⏸️ Desactivado |

**Efecto: se va el ~70% del volumen de ejecuciones diarias.** De unas 410 al día a unas 120.

**Los que atienden WhatsApp quedaron activos a propósito** — WF1 Orquestador, WF2 Agendar, WF3 Reprogramar, WF6 Admin GPT. Solo consumen si alguien escribe, y **Ferney va a recotizar a Zoe esta semana**: si apagamos su bot justo ahora y alguien escribe, no responde nada. Esa decisión es de negocio, no técnica.

**Hallazgo adicional:** el servidor trae los **100+ workflows de plantilla** de la imagen de n8n de Hostinger (nombres tipo `67-Automatic_Shopify_Order_Fulfillment`, de julio 2025). Están **inactivos**, así que no ejecutan, pero n8n igual los carga. Archivarlos podría bajar parte de los 731 MB que consume el contenedor.


### Resultado de la C1 — medido dentro del VPS el 27-ago

**El 39% de la RAM del servidor se la está comiendo un cliente que nunca cerró.**

| Contenedor | RAM | % del VPS | ¿Sirve a quien paga? |
|---|---|---|---|
| **zoe-metabase** | **1,505 GiB** | **39,4%** | **No. Zoe nunca cerró** |
| n8n | 731 MiB | 18,7% | Sí |
| evolution_api | 142 MiB | 3,6% | Sí |
| evolution_postgres | 92 MiB | 2,3% | Sí |
| traefik | 32 MiB | 0,8% | Sí |
| redis | 8 MiB | 0,2% | Sí |
| parqueadero-portal | 2 MiB | 0,06% | Otro proyecto |

**Memoria del sistema:** 3,8 GiB totales · 3,1 GiB comprometidos · **777 MiB disponibles** · **sin swap**.
**Disco:** 11 GB de 48 GB (23%). Sobra espacio; la tabla de ejecuciones de n8n no es un problema de almacenamiento.

**Lo que significa:**

1. **Metabase es un tablero de inteligencia de negocio corriendo sobre Java, instalado para los seis dashboards que se le prometieron a Zoe.** Zoe no pagó. Lleva desde mayo consumiendo 1,5 GB las 24 horas, y además es el contenedor que más CPU y más disco mueve del servidor.
2. **Detenerlo libera el 39% de la RAM al instante** y sube lo disponible de 777 MiB a ~2,3 GB.
3. **Con eso, el techo de capacidad prácticamente desaparece.** Evolution usa apenas 142 MB para atender su carga actual, así que sumar clientes cuesta muy poco. Las tareas de cotizar un VPS más grande y de partir la infraestructura **dejan de ser urgentes**.
4. **No hay swap configurado.** Con 777 MiB disponibles, un pico puede activar el OOM killer y tumbar contenedores sin aviso. Un archivo de swap es un seguro de dos minutos.

**Sumando con la W1: Zoe —el cliente que nunca cerró— es el mayor consumidor de la infraestructura.** Se lleva el 39% de la memoria con Metabase y el 70% de las ejecuciones con su cron de OTP.

| # | Acción | Efecto | Riesgo |
|---|---|---|---|
| 70 | ~~docker stop zoe-metabase~~ | ✅ **Hecho el 27-ago.** Liberó 1,6 GiB. Reversible con `docker start zoe-metabase` | — |
| 71 | ~~Desactivar los crons de Zoe~~ | ✅ **Hecho.** Los tres desactivados, sin borrar. Se va el ~70% de las ejecuciones | — |
| 72 | ~~Habilitar swap de 2 GB~~ | ✅ **Hecho.** Activo, 0 usado | — |
| 73 | **Decidir qué se hace con los datos de Metabase** | Si Zoe no vuelve, el volumen también se libera | Confirmar antes de borrar nada |

| # | Tarea | Nota |
|---|---|---|
| 74 | ~~Medir la memoria real dentro del VPS~~ | ✅ **Hecho.** 3,1 GiB comprometidos de 3,8. El 39% se lo lleva `zoe-metabase`, de un cliente que no pagó |
| 75 | **Definir el umbral de upgrade antes de que duela** | Un número escrito: «al cliente N, o cuando la RAM comprometida pase el 75% sostenido, lo que llegue primero». Decidirlo ahora, no cuando un cliente se caiga |
| 76 | **Cotizar el KVM 2 y meterlo en el margen** | El upgrade es un costo fijo nuevo. Con 9 clientes a $600.000 apenas se nota, pero hay que tenerlo en la cuenta |
| 77 | ~~Alerta automática de recursos~~ | ✅ **Escrita.** Ver la sección de infraestructura. Pendiente instalarla en el VPS |
| 78 | **Revisar los límites de concurrencia antes del cliente cinco** | El pool de Postgres del rol `n8n_worker` está en `maxConnections=4`. Con más clientes y campañas simultáneas puede quedar corto |
| 79 | **Decidir el plan de partición si un VPS no alcanza** | Lo natural: mover Evolution a su propio VPS y dejar n8n y Postgres en el actual. Decidir el corte antes de necesitarlo, no improvisando |

---

### ✅ Cerrado el 27-ago — la capacidad dejó de ser un problema

**Ejecutado:** `docker stop zoe-metabase` + swap de 2 GB.

| | Antes | Después |
|---|---|---|
| Memoria usada | 3,1 GiB | **1,5 GiB** |
| **Disponible** | **777 MiB** | **2,3 GiB** |
| Swap | ninguno | **2,0 GiB activo, 0 usado** |
| Ejecuciones diarias | ~410 | **~120** |

Se liberaron **1,6 GiB** — algo más que Metabase, porque también soltó caché.

**Qué significa para el plan:** Evolution atiende su carga actual con 142 MB. Con 2,3 GB disponibles más 2 GB de swap, **el VPS aguanta los 9 clientes de la meta sin upgrade.** El techo que preocupaba no era el diseño del flujo compartido ni la base de datos: era un tablero de Java corriendo para un cliente que nunca pagó.

**Tareas de capacidad que se cierran o bajan de prioridad:**

| Tarea | Nuevo estado |
|---|---|
| Medir la memoria real dentro del VPS | ✅ Hecho |
| Definir el umbral de upgrade | 🟡 Baja a: revisar al cliente 8, no antes |
| Cotizar el KVM 2 | 🟡 **Ya no urgente.** No hace falta para llegar a la meta |
| Decidir cómo partir la infraestructura | 🟡 **Ya no urgente** |
| Alerta automática de recursos | 🟠 Sigue valiendo: avisa antes de que duela |
| Revisar el pool de Postgres (`maxConnections=4`) | 🟠 Sigue en pie, es otro límite distinto |


---

## 🧹 Los 85 workflows activos en n8n

**Consultado hoy con la API: hay 85 workflows ACTIVOS.** De esos, unos **10 sirven al único cliente que paga**:

| Grupo | Activos | ¿Sirve a un cliente que paga? |
|---|---|---|
| Bejauha | 6 | **Sí** |
| Toque (receptor, campañas, pago fallido, sandbox) | 4 | **Sí — es la plataforma** |
| Savia | 9 | No cerró |
| Zoe | 6 | No cerró |
| LuxeSmile | 3 | No cerró |
| FerreteríaYa / FERRE | 8 | Trato de referidos, sin cobrar |
| ContentOps (BC / BF — blogs SEO) | 15 | Proyectos propios |
| Sistema viejo (WF-01 … WF-07, Tool - *) | 14 | Legado, pausado en teoría |
| AP -, Parqueadero, Advalis, InsightA, Prueba | 10 | Varios |
| **`_test_exceljs_tmp`** | **5 copias** | **Basura de una prueba de mayo** |

**Por qué importa más que la base de datos:** un workflow activo con cron **se despierta y se ejecuta solo**. Ahí hay crons de Zoe (festivos, OTP), de los blogs (sincronización diaria de pilares, dashboard semanal de GSC), recordatorios y reportes del sistema viejo. **Están corriendo para clientes que no pagan.**

⚠️ **Y varios de los de blogs SEO llaman a modelos de IA.** Si alguno corre en cron y genera contenido, está gastando dinero real cada semana sin que nadie lo mire. Eso hay que revisarlo antes que cualquier otra cosa de esta lista.

### Resultado de la W1 — revisado el 27-ago

**La buena noticia: no hay sangrado de dinero en IA.** El workflow de blog SEO —el candidato obvio, 38 nodos— corre a diario a las 11:00 pero **termina en 3 segundos**, demasiado rápido para haber generado contenido. Sale temprano, probablemente porque no hay nada pendiente.

**Lo que sí hay es volumen desperdiciado.** Midiendo los IDs de ejecución: unas **410 ejecuciones al día**, y así se reparten:

| Workflow | Frecuencia | Al día | ¿Sirve a quien paga? |
|---|---|---|---|
| **Zoe — WF5 OTP cron** | cada 5 min | **288 (70%)** | **No.** Corriendo desde mayo para un cliente que nunca cerró |
| WF-05 Recordatorios (sistema viejo) | cada 30 min | 48 | No. Es el legado «pausado» |
| Agente FerreteríaYa 3.3 | por webhook | ~50 | Tráfico real: alguien lo está usando |
| Blog SEO (BF - WF1) | diario 11:00 | 2 | **Falla todos los días** desde al menos el 25-ago, en silencio |
| Resto | — | ~20 | Varios |

**El costo real no es dinero en IA: es carga de Postgres.** Cada ejecución escribe una fila en la base que vive **en el mismo VPS de 4 GB**. 288 ejecuciones diarias inútiles desde mayo son decenas de miles de filas, y eso conecta directo con la pregunta de la RAM.

**Con desactivar un solo workflow —el OTP de Zoe— se va el 70% del volumen.** Es la acción de mejor retorno de toda esta sección y toma treinta segundos.

**Y un hallazgo aparte:** FerreteríaYa tiene tráfico real y constante. Es el único de los que no pagan que se está usando de verdad — vale la pena saber quién lo usa y para qué antes de apagar nada suyo.

| # | Tarea | Nota |
|---|---|---|
| 80 | ~~Revisar qué workflows con cron llaman a IA~~ | ✅ **Hecho.** Sin gasto de IA relevante. El problema es volumen: 288 ejecuciones diarias del OTP de Zoe, 70% del total, para un cliente que no cerró |
| 81 | ~~Desactivar el cron OTP de Zoe~~ | ✅ **Hecho el 27-ago** |
| 82 | **Inventariar los 85 y marcar cuáles se apagan** | Decisión por grupo, no uno por uno. Los de prospectos que no cerraron son candidatos claros |
| 83 | ~~Desactivar, no borrar~~ | ✅ **Criterio aplicado.** Todo lo de Zoe quedó pausado sin borrar nada |
| 84 | **Archivar los 100+ workflows de plantilla de Hostinger** | Inactivos, no ejecutan, pero n8n los carga. Podría bajar parte de los 731 MB |
| 85 | ~~Borrar las 5 copias de `_test_exceljs_tmp`~~ | ✅ **Borradas el 29-ago.** Las cinco estaban ACTIVAS con un webhook abierto cada una y ninguna se había ejecutado nunca. Se guardó copia en `n8n-backup/2026-08-29-borrados/` antes de borrar. De paso bajó de 45 a 40 la cuenta de webhooks abiertos de la fila 103 | — |
| 86 | ~~Medir la RAM antes y después~~ | ✅ **Hecho.** De 777 MB disponibles a 2,3 GB |
| 87 | **Revisar si el Postgres del VPS sigue haciendo falta** | Evolution **sí** lo necesita para sus sesiones. Los esquemas viejos (`bejauha*`, y los de Savia/Zoe/Luxe) probablemente no. Ojo: liberan **disco**; la RAM que usa Postgres depende de su configuración, no de cuántos datos guarde |
| 88 | **Ajustar la configuración de Postgres para un VPS de 4 GB** | Si `shared_buffers` quedó en un valor alto por defecto, ahí puede haber más RAM que en los datos |

---

## 🔐 Seguridad e higiene

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 89 | ~~🚨 El webhook del agente no validaba nada~~ | ✅ **Arreglado el 28-ago.** Cualquiera que conociera la URL de n8n y el nombre de una instancia podía inyectarle mensajes al agente. El día del go-live eso significa que **un tercero hace que el WhatsApp del cliente escriba al número que él elija** —el destinatario sale del payload, no de la base— que es exactamente cómo se gana un baneo. Y el repo es público, así que la URL no era ningún secreto. **El contrato de la arquitectura ya lo decía (`X-Toque-Signature`) y yo no lo seguí al construir el workflow.** Comprobado: sin firma 403, con firma mala 403, con firma buena los 12 escenarios pasan | — |
| 90 | ~~Confirmar que Evolution puede mandar cabeceras~~ | ✅ **Confirmado el 28-ago.** Evolution **2.3.7**, y la configuración de webhook de cada instancia **incluye el campo `headers`** — está en `null` porque nadie lo puso, no porque no exista. Se le puede poner la firma. Falta ponerla el día del go-live |
| 91 | ~~⭐ Auditoría de seguridad con las mejores prácticas del mercado~~ | ✅ **Hecha el 28-29 de agosto, y quedó como cuatro pruebas que se corren solas** en `pruebas/seguridad/`: la base (RLS, vistas, `SECURITY DEFINER`, y qué alcanza de verdad la llave pública), los secretos (el sitio publicado, el repo y el historial), n8n (qué webhooks comprueban quién llama) y el registro abierto. **Pasa:** 24 tablas con RLS · 7 vistas con `security_invoker` · 11 funciones con `search_path` fijo · ninguna tabla deja leer ni escribir sin sesión · `n8n_worker` no borra, no ve `auth` ni perfiles · el sitio no publica ninguna llave · las 3 edge functions desplegadas piden credencial. Y 4 escenarios de inyección nuevos en el banco (18 en total). **Lo que sigue abierto son las filas 100 a 104.** **Dos veces me equivoqué escribiendo la auditoría, y es la misma trampa:** leer la configuración en vez de probar el comportamiento. La primera versión listaba los `GRANT` y daba 33 hallazgos graves, los 33 falsos —Supabase concede permisos amplios a `anon` a propósito y deja que RLS decida—; la de n8n daba 29 webhooks «abiertos» cuando muchos validan la firma por dentro. En los dos casos el hallazgo real se perdía en el ruido | — |
| 92 | ~~🚨 Las vistas del agente se saltaban el RLS~~ | ✅ **Encontrado, comprobado y arreglado el 27-ago.** `agent_config` y `agent_knowledge` tenían el RLS bien: un anónimo pedía sus filas y recibía cero. Pero las **vistas** encima (`agent_runtime`, `agent_knowledge_prompt`) pertenecen a `postgres`, y en Postgres una vista corre con los permisos de su DUEÑO salvo que se diga `security_invoker = on`. Estaban otorgadas a `anon`. **Comprobado contra producción con la llave pública del sitio: entregaban la configuración y el conocimiento completos sin iniciar sesión.** Con un cliente el daño es acotado; con cinco, cualquiera podía leerse los precios y las políticas de los otros cuatro | — |
| 93 | ~~Prueba de aislamiento desde afuera~~ | ✅ **`pruebas/aislamiento-rls.cjs`.** Recorre las 21 tablas y vistas con la llave pública —la que va en `supabase-config.js` y cualquiera puede leer del sitio— y falla si algo entrega datos sin sesión. **Por qué la fuga no se vio antes: todas las pruebas se habían hecho con el rol de servicio y con la conexión directa a Postgres, que legítimamente ven todo.** El aislamiento hay que probarlo desde donde llegaría un atacante | — |
| 94 | **Toda vista nueva nace con `security_invoker = on`** | La regla que evita que vuelva a pasar. No depende de acordarse: `aislamiento-rls.cjs` lo comprueba. Falta engancharlo al mismo cron semanal del banco de pruebas (tarea del producto) | Diego |
| 95 | ~~Regenerar el token de Hostinger~~ | ✅ **Hecho y verificado:** HTTP 200 contra la API. ⚠️ El MCP de Hostinger arrancó con el token viejo — **hay que reiniciar Claude Code** para que lo tome | — |
| 100 | ~~🚨 Una llave de n8n filtrada en el repo público, y seguía viva~~ | ✅ **Cerrado el 29-ago.** Un `N8N_API_KEY` en texto plano en el historial, commiteado el 27-abr y visible hasta el 25-ago: cuatro meses en un repo público. Daba acceso total —workflows, credenciales, usuarios, ejecuciones— o sea el control de la automatización de todos los clientes. **Y no se podía revocar borrándola:** ya no aparecía en la lista de n8n y seguía funcionando, porque n8n valida la firma pero no comprueba que la llave siga existiendo. Se rotó `N8N_USER_MANAGEMENT_JWT_SECRET` en el compose del VPS, que invalida toda llave firmada con el secreto viejo. Verificado: la filtrada da 401 `invalid signature` y la nueva 200. Ningún workflow activo llamaba a la API, así que producción no se enteró | — |
| 101 | ~~El candado para que no vuelva a pasar~~ | ✅ **Puesto el 29-ago,** a petición de Diego: *«no quiero que vuelvan a quedar secretos o tokens en texto plano»*. `.githooks/pre-commit` detiene el commit si lo que entra trae un JWT, una llave de Anthropic/OpenAI/Google/GitHub/Hostinger, una cadena de Postgres con contraseña, o un campo KEY/TOKEN con valor literal en vez de `${VARIABLE}`. Lee del índice, no del disco. Como `core.hooksPath` es configuración local y no viaja con el repo, `auditoria-secretos` comprueba que esté activo — un candado que nadie instaló no protege nada | — |
| 102 | ~~🟠 Cinco webhooks de la plataforma no comprueban quién llama~~ | ✅ **Cuatro cerrados el 29-ago.** Los tres del sandbox (`toque-campana-test`, `toque-pago-test`, `toque-msgprueba-test`) eran atajos de desarrollo que se saltaban justo la firma que valida el receptor. **No se les puso llave: se apagaron** — nadie los llamaba (cero ejecuciones, nada en el repo) y menos puertas es mejor que más puertas con llave. Los tres flujos siguen activos por su disparador real. **Falta `alerta-recursos`,** que sí lo llama algo: ver la fila 107 | — |
| 107 | ~~🟠 Subir al VPS el script de alertas con la firma~~ | ✅ **Cerrado el 30-ago.** Diego subió el script y puso la firma en el cron; se creó la credencial en n8n y se le puso al webhook. Verificado: sin firma **403**, con firma mala **403**, con la firma **200**. Ya solo el VPS puede mandar alertas |
| 108 | 🟡 **Lo nuevo tiene pruebas: quedan dos huecos de los cuatro** | ✅ **(a) cerrado el 30-ago** con `pruebas/calidad/agente-agenda.cjs`, que le habla al agente REAL sobre un negocio de mentira que la propia prueba crea y borra. **Encontró justo lo que existía para encontrar:** el agente le dijo a una clienta «Listo Marcela, tu cita está agendada para el miércoles a las 10» y no había ninguna cita. Tres causas: el agente le mandaba a la herramienta solo la instancia y el teléfono (cualquier herramienta que necesitara un dato estaba rota desde el principio); a Claude se le declaraban con un único campo `motivo`, así que no podía decir «a las 10» aunque quisiera; y cuando la herramienta respondía que no, el modelo decía que sí igual. **Faltan: (b)** las pantallas nuevas solo se comprueban a nivel de que compilan; **(c)** el paso de IA del cargador nunca se ha corrido (fila 6); **(d)** la auditoría es una foto, no una costumbre (fila 33) | Claude |
| 118 | 🟠 **El receptor de eventos sigue con el código del piloto** | `Toque - Receptor de Eventos` tiene **la firma escrita a mano dentro del nodo**, con un `TODO mover a variable de entorno` de julio, y un comentario que dice «PILOTO: solo recibe y hace ACK, no envía ni escribe nada» — que ya no es cierto: por ahí pasan campañas, pagos, mensajes de prueba y ahora recordatorios. **Y la validación no detiene nada:** cuando la firma es mala devuelve `{ok:false}` y el flujo SIGUE; lo que hoy lo frena es que ese objeto no trae `event`, así que ningún IF casa. Funciona por casualidad, no por diseño. Mover la firma a variable de entorno de n8n (hay que entrar al VPS) y hacer que un evento sin firma pare de verdad | Diego |
| 103 | 🟡 **27 webhooks abiertos en flujos viejos de clientes** | Anteriores al estándar: FerreteríaYa, Savia, LuxeSmile, Zoe, Bejauha y los de contenido. Hay que mirarlos **uno por uno**, no en bloque: los de WhatsApp dejan inyectar mensajes falsos —el mismo bug que se arregló en el agente nuevo, que es cómo un tercero hace que el WhatsApp de un cliente escriba a quien él elija— pero los de formularios y páginas puede que estén bien abiertos. Se cruza con normalizar a esos clientes (fila 26) | Diego |
| 104 | 🟡 **58 de 68 flujos activos no avisan si fallan** | Sin `Error Trigger` ni `errorWorkflow`. Fallan en silencio, y eso no es teoría: **así lleva días caído el WhatsApp de FerreteríaYa sin que nadie se enterara** (fila 57). Se cruza con la fila 66 | Diego |
| 105 | ~~🟡 El registro de Supabase está abierto~~ | ✅ **Cerrado por Diego el 30-ago.** Verificado: `signup_disabled` |
| 106 | ~~`pago-webhook` y `cargar-conocimiento` no están desplegadas~~ | ✅ **Desplegadas el 30-ago**, en cuanto llegó el `SUPABASE_ACCESS_TOKEN`. Las dos responden y piden credencial. ⚠️ `cargar-conocimiento` **todavía no puede ordenar el texto**: le falta `ANTHROPIC_API_KEY` en los secretos de la función (fila 6) |
| 96 | Limpiar el historial de git | La llave que estaba ahí ya no sirve, así que dejó de ser urgente — pero el historial sigue teniendo lo que se commiteó. Opcional. Exige `push --force` | Diego |
| 97 | Skill `/nuevo-flow` | Encoda el contrato y el modo prueba obligatorio | Claude |
| 98 | Skill `/migracion` | SQL numerado e idempotente | Claude |
| 99 | Instalar Python | Opcional, un solo script de Bejauha | Diego |

---

## 🟡 Todo lo de Zoe, pausado sin borrar

Zoe nunca cerró, pero seguía consumiendo infraestructura por tres vías distintas. Todo quedó **pausado y reversible** el 27-ago, por si el negocio se reactiva — Ferney lo va a recotizar esta semana.

| Qué | Consumía | Estado | Cómo se revierte |
|---|---|---|---|
| `zoe-metabase` | **1,5 GB de RAM (39% del VPS)**, 24 h al día desde mayo | ⏸️ Detenido | `docker start zoe-metabase` |
| Cron OTP (cada 5 min) | **288 ejecuciones diarias**, 70% del total | ⏸️ Desactivado | Activar el workflow en n8n |
| Cron Recordatorio 24 h | diario | ⏸️ Desactivado | Ídem |
| Cron Festivos | anual | ⏸️ Desactivado | Ídem |
| Respaldo diario del esquema | 112 archivos, 30 MB acumulados | ⏸️ Comentado en el crontab | Quitar el `#` de la línea |

**Lo que sigue vivo a propósito:** los cuatro workflows de Zoe que atienden WhatsApp (WF1 Orquestador, WF2 Agendar, WF3 Reprogramar, WF6 Admin GPT). Solo consumen si alguien escribe, y apagarlos justo antes de recotizar sería una decisión de negocio, no técnica.

**Los 112 respaldos siguen intactos** en `/backups`. No se borró nada.

**Efecto total:** de 777 MB de RAM disponible a 2,3 GB, y de ~410 ejecuciones diarias a ~120.


---

## 🤝 Sociedad y exposición

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 113 | **Pasar el repositorio de GitHub a privado** | Hoy `dileroc6/n8nclaudecode` es **público**. Ahí está: que solo Bejauha paga y cuánto, que Zoe rechazó los $5.500.000 y que se le va a recotizar $1.200.000, que SM Grand está en negociación, la estructura de precios y el piso, el reparto 50/50 y los datos tributarios de Vassco. **Ventana de riesgo:** Ferney manda propuestas esta semana; si un prospecto busca «ToqueFlow» encuentra el precio de respaldo y que es el único caliente. Settings → General → Danger Zone → Change visibility. 30 segundos, no rompe nada. *Aplazado por decisión del 27-ago* | Diego |
| 114 | **Dar acceso del repo a Ferney** | Es socio al 50% y el repo es el negocio: la plataforma, la estrategia y el tablero que le asigna tareas. Settings → Collaborators. Ojo: va a leer el diagnóstico de ventas, que lo toca directamente — mejor contárselo antes | Diego |
| 115 | **Gestor de contraseñas compartido** | Más importante que el acceso al repo. `credentials.env`, el token de Hostinger, la llave de n8n y la contraseña del correo **viven solo en la máquina de Diego**. Si le pasa algo, Ferney no puede desplegar el sitio, ni dar de alta un cliente, ni entrar a Supabase: el negocio se detiene. Bitwarden gratis resuelve. 15 minutos | Ambos |

---

## ❓ Preguntas abiertas

| # | Pregunta | Por qué importa |
|---|---|---|
| A | **¿Qué pasa si el trato con FerreteríaYa no trae clientes?** Arrancó hace poco. Sin un punto de revisión, «esperamos que traiga» es la misma espera pasiva que mató a Savia, Zoe y LuxeSmile. **Propongo: si a los 3 meses no ha traído uno que cierre, se renegocia** | Es trabajo sin cobrar con retorno incierto |
| B | ~~¿Se prueba $800.000/mes en el cuarto cliente?~~ **Decidido: se queda en $600.000.** Costo de la decisión: dos clientes más para la misma plata (~24 h de implementación extra y dos operaciones más que sostener). Se revisa con datos tras los primeros tres cierres | — |
| C | ~~¿Cuándo se decide el respaldo del VPS?~~ **Respondido con datos reales:** los backups automáticos ya existen (semanales, 2 retenidos, restauran en ~30 min) y al ser del VPS completo incluyen las sesiones de Evolution, así que restaurar **no exigiría re-escanear los QR**. Falta el snapshot manual, el documento de recuperación y probar la restauración: tareas 29–31 | — |

**Ya respondidas:** la auditoría pagada aplica solo a prospectos fríos · la meta son $4.000.000 libres al mes, no dejar el empleo (eso serían $40.000.000 y no es prioridad hoy) · los costos salen de lo que paga Bejauha · la facturación «se podría manejar», pendiente confirmarlo antes de que alguien diga que sí · las caídas las atiende cualquiera de los dos según su día, lo cual aguanta hasta el cliente cinco.

---

## Corrección: el dominio de outbound ya no es camino crítico

Lo puse como lo más urgente cuando pensaba que el canal principal iba a ser correo en frío. **No lo es: el canal principal son los contactos de Ferney.**

El outbound frío entra cuando el producto estándar exista y haya capacidad libre — realistamente en dos o tres meses. El warm-up del dominio tarda 3–4 semanas, así que se compra **un mes antes de necesitarlo**, no hoy.

Retiro esa urgencia. Comprarlo hoy sería adelantar un gasto para un canal que todavía no toca.

---

## Referencias

- [estrategia/plan-comercial.md](estrategia/plan-comercial.md) — las cinco fases con puerta de salida
- [estrategia/producto-estandar.md](estrategia/producto-estandar.md) — el Agente de Atención
- [estrategia/plantilla-propuesta.md](estrategia/plantilla-propuesta.md) — cómo se cierra
- [estrategia/captacion-leads.md](estrategia/captacion-leads.md) — la máquina de outbound, para cuando toque
- [estrategia/cuestionario-decisiones.md](estrategia/cuestionario-decisiones.md) — las decisiones ya tomadas
