# ToqueFlow — Tablero

> Estado al **27 de agosto de 2026**, después del diagnóstico comercial.
> Organizado por tema. Lo que decide el negocio está arriba; lo técnico heredado, abajo.

**Dónde estamos:** un cliente pagando (Bejauha, $620.000/mes, 3 meses). Cinco implementaciones entregadas sin cobrar, tres de ellas muertas porque nadie pidió una decisión. Meta a 6 meses: 10 clientes pagando.

**Las dos consecuencias que ordenan todo:**
1. El problema no es el producto ni el mercado — **es que no se corre un proceso de venta.** Se arregla con calendario, no con código.
2. **La meta de 10 clientes exige el producto estándar.** A 45–90 h cada uno son 450–900 horas; a 11–14 h son 120.

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

Plantilla lista en [estrategia/plantilla-propuesta.md](estrategia/plantilla-propuesta.md): correo, seguimiento en 4 toques, y la pregunta que hay que hacer cuando dicen que no.

---

## 💰 Ventas

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 6 | Pedir dos referidos a Bejauha | Incentivo: un mes de operación gratis por referido que cierre | Ferney |
| 7 | Fijar el precio y no moverlo | $1.200.000 + $600.000/mes, sin excepciones, los primeros tres clientes | Ambos |
| 8 | Definir el techo de una demo gratis | Pediste un día (8 h). Con la agenda de ustedes eso es dos tercios de una semana | Ambos |
| 9 | Armar la lista del segmento | Clínicas estéticas, odontológicas y spas de Bogotá. Los contactos de Ferney son el canal, no un segmento aparte | Ferney |
| 10 | Cronometrar el próximo cliente, hora por hora | Es la hipótesis que decide si esto es negocio o empleo | Diego |

---

## 🏗️ Producto estándar

Seis capacidades: responder y sugerir · agendar · capturar · recordar · enrutar · registrar.
Especificación completa en [estrategia/producto-estandar.md](estrategia/producto-estandar.md).

**En orden de retorno sobre hora invertida:**

| # | Pieza | Por qué ahí | Quién |
|---|---|---|---|
| 11 | **Cargador de conocimiento** | Que el agente aprenda del sitio web o un PDF en vez de escribir el prompt a mano. **20–40 h de las 45–90 actuales** | Diego |
| 12 | Tabla `agent_config` + RLS | Una fila por empresa: tono, fuentes, campos, reglas, límites | Diego |
| 13 | Workflow genérico de n8n | Uno solo parametrizado por `company_id`. Se acaban los workflows por cliente | Diego |
| 14 | Agenda simple | Franjas, duración por servicio, cupos simultáneos, bloqueos. **No** contra personas o recursos | Diego |
| 15 | Cron de recordatorios | Barato y es el mayor argumento de venta: el no-show duele en el bolsillo | Diego |
| 16 | Pantalla de configuración | Para no editar JSON a mano. Puede esperar al tercer cliente | Diego |

---

## 🖼️ Sitio y operación

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 17 | **El logo y el favicon dan 404 en producción** | Los archivos se perdieron: no están en el repo, ni en el portátil viejo, ni en R2. Roto en el nav y footer de todas las páginas del portal | Diego |
| 18 | Resembrar `last-good-site.zip` cuando el logo vuelva | El punto de restauración actual no tiene imágenes | Claude |
| 19 | **Configurar `VASSCO_SHARED_SECRET`** y redesplegar las dos edge functions | La de Vassco deja de responder hasta que se haga | Diego |
| 20 | **Plan de respaldo del VPS de Evolution** | Cada cliente pone su número, pero Evolution corre en un solo VPS. Un baneo tumba a uno; una caída los tumba a todos. **Decidir antes del cliente cinco** | Diego |
| 21 | Encender WhatsApp en Bejauha | Sigue apagado desde el incidente de julio. Tu caso de referencia tiene que estar vivo | Diego |

---

## 🔐 Seguridad e higiene

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 22 | Rotar el token de Hostinger | Opcional. Quedó impreso en terminal, no se filtró | Diego |
| 23 | Limpiar el historial de git | Opcional. Exige `push --force` | Diego |
| 24 | Skill `/nuevo-flow` | Encoda el contrato y el modo prueba obligatorio | Claude |
| 25 | Skill `/migracion` | SQL numerado e idempotente | Claude |
| 26 | Instalar Python | Opcional, un solo script de Bejauha | Diego |

---

## ❓ Preguntas abiertas

| # | Pregunta | Por qué importa |
|---|---|---|
| 27 | **¿La auditoría pagada aplica solo a prospectos fríos?** Mi propuesta: sí. A los cuatro tibios se les vende directo, sin paso intermedio; la auditoría de $450.000 es el filtro para desconocidos | Cambia el embudo según el origen del prospecto |
| 28 | **¿Cuánto tendría que facturar el negocio para dejar el empleo?** Dijiste que la meta es esa; necesito el número | Define si el plan es de 6 meses o de 2 años |
| 29 | **¿Qué es el trato con FerreteríaYa?** Trabajo a cambio de que el amigo de Ferney traiga clientes. ¿Cuántos ha traído? ¿Hasta cuándo va? | Es trabajo sin cobrar con retorno incierto |
| 30 | **¿Cuánto cuesta el VPS de Evolution y quién lo paga?** | Es tu costo fijo por cliente. Sin ese número no hay margen calculable |
| 31 | **¿Tienen con qué facturar y contratar formalmente?** Factura electrónica, cuenta, contrato simple | Una pyme seria no paga $1.200.000 sin factura |
| 32 | **¿Quién atiende un cliente caído un martes a las 3 PM?** Los dos tienen empleo de tiempo completo | Con diez clientes esto deja de ser hipotético |

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
