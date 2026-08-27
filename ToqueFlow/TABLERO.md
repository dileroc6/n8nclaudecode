# ToqueFlow — Tablero

> Estado al **27 de agosto de 2026**, después del diagnóstico comercial.
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
| 6 | **Arrancar el cargador de conocimiento** — el 40% del costo de implementar está ahí | Diego |
| 7 | **¿Pueden facturar formalmente ya?** Si SM Grand dice que sí la otra semana, tienen que poder emitir factura. Un "podríamos manejarlo" se vuelve un freno en el peor momento | Ambos |
| 8 | **Pasar los números exactos de Claude Max y del VPS** | Diego |

Plantilla lista en [estrategia/plantilla-propuesta.md](estrategia/plantilla-propuesta.md): correo, seguimiento en 4 toques, y la pregunta que hay que hacer cuando dicen que no.

---

## 💰 Ventas

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 9 | Pedir dos referidos a Bejauha | Incentivo: un mes de operación gratis por referido que cierre | Ferney |
| 10 | Fijar el precio y no moverlo | $1.200.000 + $600.000/mes, sin excepciones, los primeros tres clientes | Ambos |
| 11 | Definir el techo de una demo gratis | Pediste un día (8 h). Con la agenda de ustedes eso es dos tercios de una semana | Ambos |
| 12 | Armar la lista del segmento | Clínicas estéticas, odontológicas y spas de Bogotá. Los contactos de Ferney son el canal, no un segmento aparte | Ferney |
| 13 | Cronometrar el próximo cliente, hora por hora | Es la hipótesis que decide si esto es negocio o empleo | Diego |

---

## 🏗️ Producto estándar

Seis capacidades: responder y sugerir · agendar · capturar · recordar · enrutar · registrar.
Especificación completa en [estrategia/producto-estandar.md](estrategia/producto-estandar.md).

**En orden de retorno sobre hora invertida:**

| # | Pieza | Por qué ahí | Quién |
|---|---|---|---|
| 14 | **Cargador de conocimiento** | Que el agente aprenda del sitio web o un PDF en vez de escribir el prompt a mano. **20–40 h de las 45–90 actuales** | Diego |
| 15 | Tabla `agent_config` + RLS | Una fila por empresa: tono, fuentes, campos, reglas, límites | Diego |
| 16 | Workflow genérico de n8n | Uno solo parametrizado por `company_id`. Se acaban los workflows por cliente | Diego |
| 17 | Agenda simple | Franjas, duración por servicio, cupos simultáneos, bloqueos. **No** contra personas o recursos | Diego |
| 18 | Cron de recordatorios | Barato y es el mayor argumento de venta: el no-show duele en el bolsillo | Diego |
| 19 | Pantalla de configuración | Para no editar JSON a mano. Puede esperar al tercer cliente | Diego |
| 20 | **El cliente edita su propio conocimiento desde el portal** | Si cambia un precio, que lo cambie él sin depender de ustedes. Es lo que evita que cada ajuste menor te consuma una hora | Diego |

---

## 🖥️ Consola de administración de ToqueFlow

Que dar de alta y configurar un cliente se haga **desde el portal, sin correr código**. Hoy cada alta es un script y cada configuración es editar JSON a mano.

| # | Tarea | Nota |
|---|---|---|
| 21 | **Pantalla de alta de cliente** | Crear empresa, usuario y flows desde el portal. Hoy es correr un `seed-<cliente>.cjs` |
| 22 | **Pantalla de configuración del agente** | Formularios que llenan `agent_config`: tono, campos a capturar, reglas de enrutamiento, límites |
| 23 | **Carga de la fuente de conocimiento desde el portal** | Pegar la URL o subir el PDF y que quede listo, sin tocar la base |
| 24 | **Panel de consumo por cliente** | Tokens, costo en USD y por mes. **Los datos ya existen:** la tabla `ai_usage` registra `input_tokens`, `output_tokens`, `cost_usd` y `model` por empresa desde hace rato. Falta solo la pantalla |
| 25 | **Plantilla del PDF que entrega el cliente** | El documento con "ciertos criterios" que debe traer: servicios, precios, horarios, políticas, preguntas frecuentes. Sirve como guion de venta y como checklist de onboarding |

**Orden:** la **23 primero** (es un documento, cuesta una tarde y la necesitas en la primera venta). La **22 después** (los datos ya están, es solo leerlos). Las 19–21 cuando duela configurar a mano — realistamente al tercer cliente.

---

## 🖼️ Sitio y operación

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 26 | **El logo y el favicon dan 404 en producción** | Los archivos se perdieron: no están en el repo, ni en el portátil viejo, ni en R2. Roto en el nav y footer de todas las páginas del portal | Diego |
| 27 | Resembrar `last-good-site.zip` cuando el logo vuelva | El punto de restauración actual no tiene imágenes | Claude |
| 28 | **Configurar `VASSCO_SHARED_SECRET`** y redesplegar las dos edge functions | La de Vassco deja de responder hasta que se haga | Diego |
| 29 | **Plan de respaldo del VPS de Evolution** | Cada cliente pone su número, pero Evolution corre en un solo VPS. Un baneo tumba a uno; una caída los tumba a todos. **Decidir antes del cliente cinco** | Diego |
| 30 | Encender WhatsApp en Bejauha | Sigue apagado desde el incidente de julio. Tu caso de referencia tiene que estar vivo | Diego |
| 31 | **Verificar cuántos workflows quedan tras la limpieza** | El usuario está borrando los de blogs y otros proyectos. Volver a contar activos e inactivos y medir la RAM de n8n antes y después | Claude |
| 32 | ~~Alerta automática de recursos~~ | ✅ **Escrita:** `infra/alerta-recursos.sh`. Cron del host, no n8n — si n8n se cae por memoria, una alerta que viviera ahí se caería con él. Falta instalarla y decidir el canal de aviso | Diego |
| 33 | **Protocolo de cambios del flujo compartido** | Un error en el flujo único rompe a todos a la vez. Tres reglas: probar siempre en el sandbox contra una empresa de prueba, guardar la versión anterior en n8n para revertir en un clic, y activar primero para un solo cliente y esperar un día antes de extenderlo | Diego |
| 34 | **Manejo de errores aislado por ejecución** | Que la config mala de un cliente no tumbe la ejecución de otro, más un `Error Trigger` que avise | Diego |
| 35 | **Tomar un snapshot manual del VPS** | Consultado hoy: **no hay ninguno** (viene vacío). Los backups automáticos sí existen —semanales, dos retenidos, restauran en ~30 min— pero un snapshot antes de cada cambio riesgoso cuesta un minuto | Diego |
| 36 | **Escribir el documento de recuperación** | Una página: qué contenedores, en qué orden, qué variables. Hoy eso está solo en tu cabeza | Diego |
| 37 | **Probar la restauración una vez** | Antes del cliente cinco. Un respaldo que nunca se probó no es un respaldo | Diego |

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
| 38 | **`docker stop zoe-metabase`** | Libera 1,5 GB al instante | Reversible con `docker start`. Verificar antes que nadie lo esté usando |
| 39 | ~~Desactivar los crons de Zoe~~ | ✅ **Hecho.** Los tres desactivados, sin borrar. Se va el ~70% de las ejecuciones | — |
| 40 | ~~Habilitar swap de 2 GB~~ | ✅ **Hecho.** Activo, 0 usado | — |
| 41 | **Decidir qué se hace con los datos de Metabase** | Si Zoe no vuelve, el volumen también se libera | Confirmar antes de borrar nada |

| # | Tarea | Nota |
|---|---|---|
| 42 | ~~Medir la memoria real dentro del VPS~~ | ✅ **Hecho.** 3,1 GiB comprometidos de 3,8. El 39% se lo lleva `zoe-metabase`, de un cliente que no pagó |
| 43 | **Definir el umbral de upgrade antes de que duela** | Un número escrito: «al cliente N, o cuando la RAM comprometida pase el 75% sostenido, lo que llegue primero». Decidirlo ahora, no cuando un cliente se caiga |
| 44 | **Cotizar el KVM 2 y meterlo en el margen** | El upgrade es un costo fijo nuevo. Con 9 clientes a $600.000 apenas se nota, pero hay que tenerlo en la cuenta |
| 45 | ~~Alerta automática de recursos~~ | ✅ **Escrita.** Ver la sección de infraestructura. Pendiente instalarla en el VPS |
| 46 | **Revisar los límites de concurrencia antes del cliente cinco** | El pool de Postgres del rol `n8n_worker` está en `maxConnections=4`. Con más clientes y campañas simultáneas puede quedar corto |
| 47 | **Decidir el plan de partición si un VPS no alcanza** | Lo natural: mover Evolution a su propio VPS y dejar n8n y Postgres en el actual. Decidir el corte antes de necesitarlo, no improvisando |

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
| 48 | ~~Revisar qué workflows con cron llaman a IA~~ | ✅ **Hecho.** Sin gasto de IA relevante. El problema es volumen: 288 ejecuciones diarias del OTP de Zoe, 70% del total, para un cliente que no cerró |
| 49 | ~~Desactivar el cron OTP de Zoe~~ | ✅ **Hecho el 27-ago** |
| 50 | **Inventariar los 85 y marcar cuáles se apagan** | Decisión por grupo, no uno por uno. Los de prospectos que no cerraron son candidatos claros |
| 51 | **Desactivar, no borrar** | Reversible. Si Savia o Zoe cierran, se reactivan en un clic |
| 52 | **Archivar los 100+ workflows de plantilla de Hostinger** | Inactivos, no ejecutan, pero n8n los carga. Podría bajar parte de los 731 MB |
| 53 | **Borrar las 5 copias de `_test_exceljs_tmp`** | Basura de una prueba de mayo. Esas sí se borran |
| 54 | **Medir la RAM antes y después de desactivar** | Es la forma de saber cuánto libera de verdad, en vez de suponer |
| 55 | **Revisar si el Postgres del VPS sigue haciendo falta** | Evolution **sí** lo necesita para sus sesiones. Los esquemas viejos (`bejauha*`, y los de Savia/Zoe/Luxe) probablemente no. Ojo: liberan **disco**; la RAM que usa Postgres depende de su configuración, no de cuántos datos guarde |
| 56 | **Ajustar la configuración de Postgres para un VPS de 4 GB** | Si `shared_buffers` quedó en un valor alto por defecto, ahí puede haber más RAM que en los datos |

---

## 🔐 Seguridad e higiene

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 57 | ~~Regenerar el token de Hostinger~~ | ✅ **Hecho y verificado:** HTTP 200 contra la API. ⚠️ El MCP de Hostinger arrancó con el token viejo — **hay que reiniciar Claude Code** para que lo tome | — |
| 58 | Limpiar el historial de git | Opcional. Exige `push --force` | Diego |
| 59 | Skill `/nuevo-flow` | Encoda el contrato y el modo prueba obligatorio | Claude |
| 60 | Skill `/migracion` | SQL numerado e idempotente | Claude |
| 61 | Instalar Python | Opcional, un solo script de Bejauha | Diego |

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
