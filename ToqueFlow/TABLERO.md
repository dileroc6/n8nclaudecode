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
| 5 | **Arrancar el cargador de conocimiento** — el 40% del costo de implementar está ahí | Diego |
| 6 | **¿Pueden facturar formalmente ya?** Si SM Grand dice que sí la otra semana, tienen que poder emitir factura. Un "podríamos manejarlo" se vuelve un freno en el peor momento | Ambos |
| 7 | **Pasar los números exactos de Claude Max y del VPS** | Diego |

Plantilla lista en [estrategia/plantilla-propuesta.md](estrategia/plantilla-propuesta.md): correo, seguimiento en 4 toques, y la pregunta que hay que hacer cuando dicen que no.

---

## 💰 Ventas

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 8 | Pedir dos referidos a Bejauha | Incentivo: un mes de operación gratis por referido que cierre | Ferney |
| 9 | Fijar el precio y no moverlo | $1.200.000 + $600.000/mes, sin excepciones, los primeros tres clientes | Ambos |
| 10 | Definir el techo de una demo gratis | Pediste un día (8 h). Con la agenda de ustedes eso es dos tercios de una semana | Ambos |
| 11 | Armar la lista del segmento | Clínicas estéticas, odontológicas y spas de Bogotá. Los contactos de Ferney son el canal, no un segmento aparte | Ferney |
| 12 | Cronometrar el próximo cliente, hora por hora | Es la hipótesis que decide si esto es negocio o empleo | Diego |

---

## 🏗️ Producto estándar

Seis capacidades: responder y sugerir · agendar · capturar · recordar · enrutar · registrar.
Especificación completa en [estrategia/producto-estandar.md](estrategia/producto-estandar.md).

**En orden de retorno sobre hora invertida:**

| # | Pieza | Por qué ahí | Quién |
|---|---|---|---|
| 13 | **Cargador de conocimiento** | Que el agente aprenda del sitio web o un PDF en vez de escribir el prompt a mano. **20–40 h de las 45–90 actuales** | Diego |
| 14 | Tabla `agent_config` + RLS | Una fila por empresa: tono, fuentes, campos, reglas, límites | Diego |
| 15 | Workflow genérico de n8n | Uno solo parametrizado por `company_id`. Se acaban los workflows por cliente | Diego |
| 16 | Agenda simple | Franjas, duración por servicio, cupos simultáneos, bloqueos. **No** contra personas o recursos | Diego |
| 17 | Cron de recordatorios | Barato y es el mayor argumento de venta: el no-show duele en el bolsillo | Diego |
| 18 | Pantalla de configuración | Para no editar JSON a mano. Puede esperar al tercer cliente | Diego |

---

## 🖼️ Sitio y operación

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 19 | **El logo y el favicon dan 404 en producción** | Los archivos se perdieron: no están en el repo, ni en el portátil viejo, ni en R2. Roto en el nav y footer de todas las páginas del portal | Diego |
| 20 | Resembrar `last-good-site.zip` cuando el logo vuelva | El punto de restauración actual no tiene imágenes | Claude |
| 21 | **Configurar `VASSCO_SHARED_SECRET`** y redesplegar las dos edge functions | La de Vassco deja de responder hasta que se haga | Diego |
| 22 | **Plan de respaldo del VPS de Evolution** | Cada cliente pone su número, pero Evolution corre en un solo VPS. Un baneo tumba a uno; una caída los tumba a todos. **Decidir antes del cliente cinco** | Diego |
| 23 | Encender WhatsApp en Bejauha | Sigue apagado desde el incidente de julio. Tu caso de referencia tiene que estar vivo | Diego |

---

## 🔐 Seguridad e higiene

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 24 | ⚠️ **Regenerar el token de Hostinger** | **Ya no es opcional: el token está muerto (401 contra la API).** Sin él no funciona `deploy-safe.ps1` ni el MCP de Hostinger — no se puede publicar el sitio. Se genera en hPanel → API, y se pega en `.claude/settings.local.json` | Diego |
| 25 | Limpiar el historial de git | Opcional. Exige `push --force` | Diego |
| 26 | Skill `/nuevo-flow` | Encoda el contrato y el modo prueba obligatorio | Claude |
| 27 | Skill `/migracion` | SQL numerado e idempotente | Claude |
| 28 | Instalar Python | Opcional, un solo script de Bejauha | Diego |

---

## ❓ Preguntas abiertas

| # | Pregunta | Por qué importa |
|---|---|---|
| A | **¿Qué pasa si el trato con FerreteríaYa no trae clientes?** Arrancó hace poco. Sin un punto de revisión, «esperamos que traiga» es la misma espera pasiva que mató a Savia, Zoe y LuxeSmile. **Propongo: si a los 3 meses no ha traído uno que cierre, se renegocia** | Es trabajo sin cobrar con retorno incierto |
| B | **¿Se prueba $800.000/mes en el cuarto cliente?** Los primeros tres van a $600.000 para tener tres datos comparables. A $800.000 la meta baja de 9 clientes a 7: mismo dinero, menos carga operativa | Con tiempo escaso, el precio es la única palanca que no cuesta horas |
| C | **¿Cuándo se decide el respaldo del VPS?** Propongo fijarlo ahora: **antes del cliente cinco**, no cuando duela | Una caída tumba a todos los clientes a la vez |

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
