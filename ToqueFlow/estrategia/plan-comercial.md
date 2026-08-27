# ToqueFlow — Plan comercial por fases

> De idea a escalabilidad. Cinco fases con puerta de salida en cada una.
> Complemento operativo de [captacion-leads.md](captacion-leads.md), que tiene el detalle de la máquina de outbound.
> Fecha: 2026-08-27.

---

## Lo que ya sabemos (respondido el 27-ago-2026)

Ya no son supuestos. Este es el punto de partida real:

| Dato | Realidad |
|---|---|
| Clientes pagando | **Uno: Bejauha, $620.000/mes, 3 meses seguidos** |
| Los otros cinco | No cerraron. Tres de ellos **se enfriaron sin que nadie pidiera una decisión** |
| Precios negociados de verdad | Savia $450k/mes · Zoe $350k/mes · Bejauha $620k/mes. **El pago único nunca se probó** |
| Horas por implementación | 45–90 h, de las cuales **20–40 solo en afinar el prompt** |
| Cómo llegaron todos | Por Ferney, socio 50/50, que es quien tiene los contactos |
| Dedicación | **Ambos con empleo de tiempo completo.** ~6 h diarias, noches y fines de semana |
| Meta a 6 meses | 10 clientes pagando ($6.000.000/mes) |

**Las dos consecuencias que ordenan todo el plan:**

1. **El problema no es el producto ni el mercado: es que no se corre un proceso de venta.** Tres negocios murieron sin que nadie mandara una propuesta con fecha de decisión. Se arregla con calendario, no con código. Ver [plantilla-propuesta.md](plantilla-propuesta.md).
2. **La meta de 10 clientes exige el producto estándar.** A 45–90 h cada uno son 450–900 horas: imposible. A 11–14 h son 120: cabe. Ver [producto-estandar.md](producto-estandar.md).

**El reparto que tapa el hueco de la sociedad:** Ferney es dueño del cierre — propuestas, precios, seguimiento, el «¿lo hacemos?». Diego estandariza la entrega. Bolsillos de tiempo distintos, en paralelo, sin competir.

**La regla que atraviesa las fases:** no se construye tecnología de *adquisición* hasta que un número lo justifique. La de *entrega* va primero, porque es el multiplicador de cada hora escasa.

---

# Fase 0 — Casa en orden

**Duración:** semana 1, en paralelo con la Fase 1.

### Objetivo
Que el negocio aguante que alguien te mire.

### Qué hacer
- **Mandar propuesta con precio y fecha a los cuatro tibios** (SM Grand, Savia, Zoe, LuxeSmile). ~12 h de Ferney. Es el trabajo con mejor retorno disponible. Ver [plantilla-propuesta.md](plantilla-propuesta.md).
- **Encender WhatsApp en Bejauha** con warm-up y prueba a número propio. Tu caso de referencia tiene que estar vivo antes de venderlo.
- **Arreglar el logo y el favicon.** Vas a mandar prospectos a un sitio con la marca rota.
- **Comprar el dominio de outbound y arrancar el warm-up.** Tarda 3–4 semanas y no se puede acelerar. Va hoy aunque el resto no esté listo.
- **Pedir dos referidos a Bejauha**, con incentivo explícito: un mes de operación gratis por referido que cierre.
- **Revisar el extracto: ¿Vassco está pagando?** No se puede planear sin saber cuánto factura el negocio.

### Qué NO hacer
- No tocar la plataforma para "mejorarla" antes de vender.
- No rediseñar el sitio.

### Herramientas
Las que ya tienes. Dominio de outbound: Google Workspace o Zoho (~$30.000/mes por buzón).

### Automatizaciones
Ninguna.

### Métricas
Los cinco datos obtenidos. Bejauha enviando. Dominio comprado y calentándose.

### Criterio de salida
Los cuatro puntos hechos. **Esta fase no bloquea la Fase 1**, corre en paralelo.

---

# Fase 1 — Validación: ¿alguien paga?

**Duración:** semanas 1–6. **Hipótesis: H1.**

> **Corre en paralelo con la estandarización de la entrega.** Son bolsillos de tiempo distintos: Ferney vende, Diego construye el producto estándar (ver [producto-estandar.md](producto-estandar.md)). El cargador de conocimiento va primero: ahí está el 40% del costo actual de implementar.

### Objetivo
Que un desconocido te transfiera **$450.000 por una auditoría** de atención. Nada más. No implementación, no contrato anual: una transferencia de un extraño.

Esa transferencia es la única prueba real de disposición a pagar. Todo lo demás es opinión.

### Qué hacer
1. **Segmento acordado:** clínicas estéticas, odontológicas y spas de Bogotá — negocios de servicios con cita previa. Los contactos de Ferney son el **canal** para llegar ahí, no un segmento aparte.
2. **Armar 100 fichas a mano.** Google Maps, filtradas por ti mirando reseñas: 30–800 reseñas, 3.8–4.8 estrellas, cierra antes de 9 PM, agenda por WhatsApp, 1–3 sedes.
3. **Definir el entregable de la auditoría.** Sin entregable tangible no se puede cobrar. Propuesta: informe de 4–6 páginas con horas sin cobertura, consultas perdidas estimadas al mes, señales encontradas en sus reseñas, y un plan de 3 pasos. Una hora de reunión para presentarlo.
4. **Escribir la página de la auditoría:** qué incluye, qué recibes, cuánto cuesta, que se abona a la implementación.
5. **Enviar 100 correos escritos a mano.** 25 por día, cuatro días. Sin plantilla, sin secuencia. Cada uno con algo cierto y verificable de ese negocio.
6. **Leer todas las respuestas, incluidas las negativas.** Ahí está el aprendizaje que ninguna métrica te da.

### Qué NO hacer
- **No construir nada de la máquina de adquisición.** Scraping, scoring, secuencias: nada. Las horas de construcción van al producto estándar, que es entrega, no adquisición.
- No ofrecer la auditoría gratis "solo por esta vez". El precio es el experimento.
- No bajar el precio para cerrar. Si nadie paga $450.000, el dato es que nadie paga — no que el precio esté alto.
- No abrir un segundo segmento porque el primero va lento.
- No hacer contenido, redes ni pauta.

### Herramientas
Gmail y una hoja de cálculo. Nada más. Google Maps a mano o con Places API si prefieres. Cal.com para agendar (gratis).

### Automatizaciones
**Ninguna.** A propósito.

### Métricas
| Métrica | Meta |
|---|---|
| Correos enviados a mano | 100 |
| Respuestas de cualquier tipo | ≥10 |
| Conversaciones reales | ≥3 |
| **Auditorías pagadas** | **≥1** |

### Criterio de salida
**≥1 auditoría pagada por un desconocido.**

- Si sale: pasas a Fase 2.
- Si hubo conversaciones pero nadie pagó: el problema es la oferta. Ajusta el entregable o el precio y repite con 100 fichas nuevas.
- Si no hubo ni conversaciones: el problema es el mensaje o el segmento. Cambia uno solo de los dos y repite.
- **Tres rondas sin una auditoría pagada = el segmento no es este.** Cambia de vertical antes de gastar más.

---

# Fase 2 — Primer cliente y entrega medida

**Duración:** semanas 5–10. **Hipótesis: H2 y H3.**

### Objetivo
Cerrar la primera implementación del segmento **y cronometrar cuánto te cuesta entregarla**. El segundo dato importa tanto como el primero.

### Qué hacer
- Convertir la auditoría en propuesta **en la misma reunión**. No "te la envío mañana": se presenta el informe y se cierra con la propuesta en la mano.
- Vender **activación $1.200.000 + operación $600.000/mes obligatoria, mínimo 6 meses.** Precio fijo, sin excepciones, para los primeros tres clientes.
- **Cronometrar cada hora** de la implementación, por etapa: descubrimiento, carga de conocimiento, construcción, pruebas, go-live, ajustes.
- Documentar cada decisión que tuviste que tomar a medida. Eso es lo que después se estandariza.
- Anotar cada pregunta que hizo el cliente en la venta. Es tu futuro material de contenido y tu FAQ de la propuesta.

### Qué NO hacer
- **No prometas nada fuera del alcance para cerrar.** Cada excepción que aceptes se convierte en trabajo no cobrado y rompe la repetibilidad que estás midiendo.
- No arranques un segundo cliente en paralelo. Necesitas la medición limpia.
- No empieces a construir la máquina de outbound todavía.
- No hagas descuento por pagar todo adelantado si eso significa perder la mensualidad.

### Herramientas
Tu plataforma. Wompi para el cobro (ya integrado). Propuesta en PDF. Un cronómetro y una hoja.

### Automatizaciones
Solo lo que necesites para entregar a ese cliente. Nada especulativo.

### Métricas
| Métrica | Meta |
|---|---|
| Auditorías → propuestas | 100% |
| Propuestas → cierres | ≥33% |
| **Horas totales de implementación** | **medir, meta <20 h** |
| Días desde cierre hasta go-live | <21 |

### Criterio de salida
**Un cliente en producción, cobrado, con la primera mensualidad facturada** — y el número de horas escrito.

Si la implementación te tomó más de 80 horas, **no pases a Fase 3 todavía**: estandariza la entrega primero. Un negocio que necesita 80 horas por cliente no escala con más leads, se ahoga.

---

# Fase 3 — Repetibilidad

**Duración:** meses 3–5. **Hipótesis: H4.**

### Objetivo
Demostrar que el cliente 2 y el 3 del mismo vertical cuestan **la mitad** que el primero. Ahí es donde nace el negocio; hasta aquí solo tenías proyectos.

### Qué hacer
- Cerrar **dos clientes más del mismo segmento**, con la misma oferta y el mismo precio.
- **Estandarizar la entrega:** plantilla de configuración, base de conocimiento reutilizable, checklist de go-live, seed del cliente.
- **Ahora sí, construir la máquina** — y solo estas tres piezas, en este orden:
  1. Captura y calificación de fichas (que la lista llegue sola con el ángulo redactado).
  2. **El bot demo automático.** Tu única ventaja competitiva real.
  3. La secuencia de correos, con el mensaje que ya validaste a mano.
- Dar de alta ToqueFlow como empresa en su propia plataforma y usar la vista Prospectos como CRM.
- Empezar LinkedIn: dos publicaciones por semana, formato único — *problema real → qué costaba → cómo se resolvió*.

### Qué NO hacer
- **No construyas el CRM de prospección.** Ya lo tienes.
- No automatices la clasificación de respuestas. Con 15 respuestas al mes las lees en cinco minutos.
- No abras segunda ciudad ni segundo vertical.
- No contrates todavía.
- No hagas pauta.

### Herramientas
Places API o proveedor gestionado (Apify/Outscraper). Instantly o Smartlead para secuencias (~$40–100 USD/mes). Verificador de correos (NeverBounce). Tu plataforma como CRM.

### Automatizaciones a construir
| Workflow | Qué hace |
|---|---|
| `Toque - Captura Google Maps` | Cron por ciudad y vertical, inserta en `contacts` sin duplicar por `place_id` |
| `Toque - Enriquecimiento` | Web e Instagram → correo, servicios, precios |
| `Toque - Scoring` | Califica y redacta el ángulo personalizado |
| `Toque - Generar demo` | Landing + bot cargado con la info del prospecto |
| `Toque - Secuencia outbound` | 4 correos en 12 días, se detiene al responder |

### Métricas
| Métrica | Meta |
|---|---|
| Horas del cliente 3 vs el cliente 1 | ≤50% |
| Clientes pagando mensualidad a 3 meses | 3 de 3 |
| Tasa de respuesta positiva en frío | ≥2% |
| Prospectos que prueban el bot demo | ≥30% de los que visitan el diagnóstico |
| Ingreso recurrente mensual | ≥$1.800.000 |

### Criterio de salida
**Tres clientes del mismo vertical, los tres pagando mensualidad, y el tercero implementado en menos de la mitad de horas que el primero.**

Si alguno canceló la mensualidad a los 3 meses, **para y averigua por qué** antes de escalar. Escalar un producto que no retiene es multiplicar el problema.

---

# Fase 4 — Escalabilidad

**Duración:** meses 6–12.

### Objetivo
Que el negocio crezca sin que tú seas el cuello. Esto significa dos cosas a la vez: más demanda **y** más capacidad de entrega.

### Qué hacer
- **Definir el cupo mensual de implementación** y respetarlo. Frenar el volumen de outbound antes de saturarlo.
- **Contratar la primera persona** — y que sea de **implementación, no de ventas**. Tu cuello es entregar, no conseguir.
- Abrir **segunda ciudad** (Medellín) con el mismo mensaje antes de abrir segundo vertical.
- Después, **segundo vertical** reusando el motor completo.
- **Evaluar la pauta**, solo si se cumplen las tres señales de abajo.
- Considerar convertir el módulo de prospección en **producto vendible**: "consíguete clientes automáticamente" para los mismos spas y clínicas que ya te compraron el bot.

### Qué NO hacer
- No contrates vendedor antes que implementador.
- No abras vertical nuevo si el primero no está saturado.
- No pautes sin las tres señales.
- No aceptes clientes fuera del segmento porque "es plata". Cada excepción te devuelve al problema de las siete verticales.

### Las tres señales antes de gastar en pauta
1. Un mensaje en frío que convierte de forma **repetible**, no una vez.
2. Al menos un cliente que **renovó** la mensualidad después de 6 meses.
3. **Capacidad de implementación libre** el mes que viene.

Sin las tres, la pauta solo compra leads que no puedes atender. Cuando llegue: **Google Ads sobre intención de búsqueda** ("bot whatsapp para clínica", "agendamiento automático"), no Meta sobre interrupción.

### Herramientas
Las de Fase 3 más: un implementador. Google Ads si aplica.

### Automatizaciones
- CRM de prospección afinado sobre la vista Prospectos.
- Clasificación de respuestas por IA (ahora sí: con 60+ respuestas al mes ya se justifica).
- Onboarding de cliente semi-automatizado: seed + carga de conocimiento + checklist.

### Métricas
| Métrica | Meta |
|---|---|
| Clientes nuevos por mes | 2–4 |
| Ingreso recurrente mensual | ≥$6.000.000 |
| Horas tuyas por cliente nuevo | <15 |
| Retención a 6 meses | ≥80% |
| Costo de adquisición por cliente | <25% del primer año |

### Criterio de salida
Ya no hay salida: hay operación. La pregunta pasa a ser si abres un tercer vertical, subes precios o construyes producto.

---

## Las cuatro cosas que más te van a incomodar

1. **30 días sin construir nada.** Es el punto más duro y el más importante. Tu instinto es construir; el negocio necesita que vendas.
2. **Cobrar la auditoría.** Da miedo, y por eso funciona: es el filtro más barato que existe.
3. **Mensualidad obligatoria, no opcional.** Vas a perder algún cierre. Los que pierdas por eso no eran clientes, eran proyectos.
4. **Un solo vertical.** Vas a ver oportunidades en otros lados y vas a querer tomarlas. Cada una te devuelve al punto de partida.

---

## Referencias

- [captacion-leads.md](captacion-leads.md) — la máquina de outbound en detalle: ICP, escalera de oferta, arquitectura y cumplimiento
- [../TABLERO.md](../TABLERO.md) — estado de las tareas
- [../arquitectura/arquitectura-toque.md](../arquitectura/arquitectura-toque.md) — cómo está construida la plataforma
