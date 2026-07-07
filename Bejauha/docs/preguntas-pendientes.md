# Bejauha — Preguntas pendientes para la reunión

> Lista para llevar al cliente. 🔴 = bloquea la construcción · 🟡 = importante
> pero no bloquea. Última actualización: 2026-05-27.

---

## Transversales (canal y marca)

- [x] **Líneas de WhatsApp** → DECIDIDO (2026-05-28, revisado): **una sola línea
  para todo** — la principal **312 2011349** cubre los 3 agentes (PROSPECCIÓN,
  CLASES y ATENCIÓN). Se descarta la línea dedicada. **Implicación:** un baneo
  tumbaría los 3 agentes → exige warm-up real y Habeas Data confirmada.
- [ ] 🔴 **¿El número 312 2011349 ya está conectado/verificado** y listo para
  escanear el QR en Evolution API?
- [ ] 🟡 **Tono de Bejauha en 3 palabras.** (Revisar con Isa.)
- [ ] 🟡 **Palabras o frases que NO se deben usar** con los clientes. (Con Isa.)

## Agente 1 — Filtrado y Prospección

- [ ] 🔴 **¿Cuál es la oferta para abordar los 1.300?**
  (clase de cortesía gratis / descuento / info de membresía). Decisión
  estratégica — de aquí sale el copy del primer mensaje.
- [ ] 🔴 **¿Qué pregunta clave define si alguien es cliente potencial?**
  (Depende de la oferta de arriba.)
- [ ] 🟡 **¿Qué señal exacta convierte un lead en "Caliente"** y dispara el
  paso a un humano?
- [ ] 🟡 **Export de los 1.300:** ¿formato final?, ¿qué columnas trae? y sobre
  todo **¿dieron consentimiento (habeas data) para escribirles?**

## Agente 2 — Admin / Control de Clases  *(prioridad día 1)*

- [ ] 🔴 **¿Qué pasa con la membresía mensual** ($79.900 / $160.000)?
  ¿El agente la controla por saldo de clases o es **acceso ilimitado**?
- [ ] 🔴 **¿El saldo de clases aplica solo a presenciales o también a
  virtuales?** Los paquetes 4/8 son presenciales — ¿las virtuales se cuentan,
  se venden sueltas o van por membresía?
- [ ] 🟡 **¿El agente controla los vencimientos?** (4 clases = 2 meses; 8 = 3
  meses con pausa). ¿Avisa cuando está por vencer?
- [ ] 🟡 **Números de los 3 admins** (Cami, Amanda, Isa) — confirmar.
- [ ] 🟡 **¿Cómo cargamos los saldos iniciales** de los clientes actuales?
  (Hoy se empieza desde cero.)

## Grupo 1 — Revisión diaria de clientes activos (CLASES)  *(NUEVO 2026-05-27)*

> Contexto: el cliente confirmó que **el Grupo 1 SÍ se incluye**, pero no como
> envío masivo: se **revisa a diario** y a cada cliente le entra su mensaje
> **solo cuando cumple una condición** (es un caso particular, no una tanda).
> Para automatizarlo necesitamos definir los umbrales y dos datos que hoy no
> existen en la base.

**Umbrales (¿cuándo dispara cada mensaje?):**
- [ ] 🔴 **"Confirmar clase"** (P1): un cliente con clases sin usar, ¿a los
  **cuántos días sin asistir** le escribimos para que agende?
- [ ] 🟡 **"Renovación"** (P2): **esto ya lo hace WF04** (avisa 14 días antes de
  vencer). Lo único por decidir: ¿quieren un aviso **adicional** cuando le
  **quede 1 sola clase**, o con el de vencimiento basta?
- [ ] 🔴 **"Ex-cliente / reactivación"** (P5): ¿a los **cuántos días/meses sin
  volver** se considera ex-cliente y se le escribe?

**Datos que faltan en la base (sin esto no se pueden disparar solos):**
- [ ] 🔴 **Deudor** (P3): ¿cómo sabemos que un cliente **tomó clase sin pagar**?
  ¿Quién y cómo lo marca? (No existe el concepto de "deuda" en la BD.)
- [ ] 🔴 **Pausa** (P4): dos cosas — (a) ¿cómo se entera el sistema de que un
  cliente **quedó en pausa**? ¿quién y cómo lo marca? (hoy nadie marca el campo
  `pausado`); y (b) ¿hasta **qué fecha** dura la pausa, para saber cuándo
  escribirle a retomar?

**Cobertura inmediata:** con los datos actuales ya podríamos disparar P1 y P5
(con umbrales por defecto) en cuanto se confirmen; P2 ya está cubierto por WF04.
P3 y P4 quedan en espera del dato faltante.

**¿Cómo inician estos datos por cliente?** (estado real al 2026-05-27: 60 con
saldo, 54 con clases, 7 en pausa, **51 sin fecha de vencimiento**)
- [ ] 🔴 **Backfill de los 60 clientes actuales:** ¿nos pueden pasar, por cliente,
  la **fecha en que vence** su paquete vigente? Sin eso, el aviso de vencimiento
  (WF04) no dispara para los clientes de hoy.
- [ ] 🔴 De los **7 en pausa**, ¿cuál es la **fecha de regreso** de cada uno?
- [ ] 🟡 Hacia adelante esto se inicializa **solo**: cada **recarga** que haga el
  Agente 2 setea clases + vencimiento automáticamente. El backfill es por una
  sola vez para los clientes que ya venían.

## Agente 3 — Atención e Inbound Nurturing

- [ ] 🟡 **¿El agente solo informa y hace handoff, o también puede
  agendar/cerrar venta?**
- [ ] 🟡 **¿Hay FAQ frecuentes** que deba cubrir sí o sí?

---

## Estado de las 5 preguntas originales

| # | Pregunta | Estado |
|---|----------|--------|
| 1 | Números de WhatsApp | 🟢 Resuelta (2026-05-28) — **1 sola línea** para todo: la principal 312 2011349 |
| 2 | Ángulo del mensaje outbound | 🔴 Pendiente decisión (P20) |
| 3 | Oferta real (clases, precios) | 🟢 Resuelta en el levantamiento |
| 4 | Qué define "Caliente" | 🔴 Pendiente |
| 5 | Export de los 1.300 + consentimiento | 🔴 Pendiente |
