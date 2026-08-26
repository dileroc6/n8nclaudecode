# ToqueFlow — Estrategia de captación de leads

> Cómo conseguir clientes para ToqueFlow de forma automática y profesional.
> Decisiones tomadas: **Colombia**, **1–2 verticales**, canal **outbound automatizado por email** con listas construidas desde **Google Maps**.
> Documento de estrategia + plan de implementación. Fecha: 2026-08-25.

---

## 0. La idea en una frase

Construir para ToqueFlow la misma máquina que ToqueFlow le vende a sus clientes: un sistema que identifica negocios con un dolor concreto y verificable, les demuestra el valor **antes** de pedirles nada, y solo escala a una conversación humana cuando el prospecto ya levantó la mano.

El activo diferencial no es el volumen de correos. Es que **ToqueFlow puede entregarle a cada prospecto un bot que ya conoce su negocio**, generado automáticamente, gratis, antes de la primera reunión. Eso ya está construido en el repo — solo hay que apuntarlo hacia afuera.

---

## 1. Verticales objetivo

### Por qué solo dos

Un mensaje genérico ("automatizamos tu negocio") compite con cientos de agencias y no dice nada. Un mensaje vertical ("sabemos que un spa pierde reservas entre 7 PM y 1 AM porque nadie contesta") es específico, verificable y difícil de imitar sin haberlo hecho antes. ToqueFlow ya lo hizo.

Además, verticalizar convierte cada implementación en la siguiente: el segundo spa cuesta una fracción del primero.

### Vertical A — Spas, centros de estética y bienestar

**Por qué:** existe [Zoe](../../Zoe/PROPUESTA_COMERCIAL.md), un sistema completo en producción con propuesta comercial, precios y ROI ya modelado. Es el caso de éxito listo para citar.

| Dolor | Evidencia que ya tienes |
|---|---|
| El 70% de las consultas llegan fuera de horario y no se convierten | Documentado en la propuesta de Zoe |
| El 70% de las conversaciones son las mismas 4 preguntas | Ídem |
| No-shows sin control ni forma de confirmar asistencia | Sistema de check-in con OTP ya construido |
| Cero visibilidad de números reales del negocio | 6 dashboards ya construidos |

**Universo:** spas, centros de estética, masajes, depilación láser, medicina estética en Bogotá, Medellín, Cali, Barranquilla. Todos son negocios físicos con ficha en Google Maps.

### Vertical B — Estudios de clases por paquetes

Yoga, pilates, danza, crossfit, funcional, natación, academias de música.

**Por qué:** [Bejauha](../../Bejauha/docs/estado-mvp.md) es el cliente más integrado con el portal, y su lógica de negocio —saldo de clases, asistencia que descuenta, recarga, aviso automático al quedar 1 clase, campañas de reactivación— **no es un proyecto, es un producto**. Ningún competidor genérico tiene eso resuelto.

| Dolor | Lo que Bejauha ya resuelve |
|---|---|
| Control de saldos de paquetes en cuadernos o Excel | Tabla `contacts` con saldo, asistencia −1, recarga +N |
| El cliente se queda sin clases y nadie se entera | Recordatorio automático al llegar a 1 clase |
| Alumnos inactivos que nunca se reactivan | Campañas segmentadas con `ejecutar_campana` |
| El admin no puede operar sin abrir el computador | Agente admin por WhatsApp en lenguaje natural |

### Recomendación de arranque

**Empezar solo con Vertical A (spas), en una sola ciudad (Bogotá).** Una vertical, una ciudad, un mensaje. Si funciona, se replica a Medellín antes de abrir la segunda vertical. Abrir dos frentes a la vez impide saber cuál de los dos falló.

---

## 2. Perfil del cliente ideal (ICP)

No todo spa de Google Maps sirve. El scoring debe filtrar antes de gastar un correo.

### Califica

| Criterio | Umbral | Por qué importa |
|---|---|---|
| Reseñas en Google | 30 – 800 | Menos de 30 = muy pequeño, sin presupuesto. Más de 800 = probablemente ya tiene software |
| Calificación | 3.8 – 4.8 | Debajo de 3.8 el problema es el servicio, no la operación. Arriba de 4.8 con pocas reseñas suele ser falso |
| Horario de cierre | Cierra antes de 9 PM | Toda consulta nocturna se pierde: el argumento central |
| Presencia digital | Tiene WhatsApp o Instagram como canal principal de reserva | Confirma que el canal a automatizar existe |
| Sitio web | Sin web, o web básica / Linktree | Señal de operación manual |
| Sedes | 1 – 4 | Más de 4 suele tener sistema propio y decisión corporativa |

### Descalifica

- Cadenas nacionales y franquicias (decisión centralizada, ciclo de venta de meses).
- Fichas sin teléfono ni web (no hay cómo contactar ni cómo demostrar nada).
- Negocios con reseñas por debajo de 3.5 (el problema no es el que resolvemos).
- Cualquier ficha marcada como cerrada permanentemente.

### Señales de compra (suben el score)

Estas son las que convierten un correo genérico en uno imposible de ignorar:

1. **Reseñas que mencionan el dolor exacto.** "No contestan", "nunca me respondieron", "difícil agendar", "llamé y nadie". Es el dolor, escrito por sus propios clientes, en público.
2. **Reseñas que mencionan la espera o el no-show.** "Llegué y no había cita", "me cancelaron el mismo día".
3. **Instagram activo con muchos comentarios de "info?" / "precios?" sin responder.** Demanda desatendida, visible.
4. **Cierra temprano pero publica contenido de noche.** Hay actividad después del horario, pero no atención.

---

## 3. La oferta

### El problema del precio

El sistema completo de Zoe se cotizó en **$5.500.000 COP + $700.000/mes**. Es un precio correcto para el valor entregado, pero es un salto imposible desde un correo en frío. Hace falta una escalera.

### Escalera de oferta

| Nivel | Qué es | Precio | Función |
|---|---|---|---|
| **0. Diagnóstico de Atención** | Informe automático de 1 página sobre ESE negocio: horas sin cobertura, señales encontradas en sus reseñas, estimado de reservas perdidas al mes | **Gratis, sin reunión** | Imán. Se entrega en el primer correo, sin pedir nada a cambio |
| **1. Demo con su propia información** | Un bot real, funcionando, cargado con sus servicios, precios y horarios. El prospecto le escribe y ve su propio negocio atendiendo solo | **Gratis** | Convierte curiosidad en deseo. Es el momento de la venta |
| **2. Piloto 30 días** | Bot de agendamiento acotado: responde FAQ, verifica disponibilidad, agenda y recuerda | **~$1.500.000 COP + $350.000/mes** *(a validar)* | Baja la barrera de entrada. Compra de bajo riesgo |
| **3. Sistema completo** | El de Zoe: bot cliente + bot admin + panel + dashboards + campañas + control de no-shows | **$5.500.000 + $700.000/mes** | El ticket real. Se vende desde adentro, no en frío |
| **4. Operación y crecimiento** | Campañas de reactivación gestionadas, reportes mensuales, mejoras continuas | Mensualidad mayor | Retención y expansión |

Los precios de los niveles 2 y 4 son propuesta y hay que validarlos con los primeros cierres. El nivel 3 tiene precio real de mercado ya cotizado.

### La regla

**Nunca vender el nivel 3 en frío.** El outbound vende el nivel 0. El nivel 0 vende el nivel 1. El nivel 1 vende el nivel 2. El nivel 3 se vende cuando el cliente ya está adentro y pide más.

---

## 4. La máquina de captación

```
  Google Maps (Places API)
          │  nombre, teléfono, web, rating, reseñas, horarios, place_id
          ▼
  ┌─────────────────┐
  │  prospects      │  Supabase — tenant interno "ToqueFlow"
  └────────┬────────┘
           │
           ▼
   Enriquecimiento          web + Instagram → email, servicios, precios
           │
           ▼
   Scoring con IA           califica, descarta, y redacta el ángulo
           │                personalizado de ESE negocio
           ▼
  ┌─────────────────────────────────┐
  │  Diagnóstico automático         │  landing única: toqueflow.com/d/<slug>
  │  + Bot demo con SU información  │  ← reusa el sandbox que ya existe
  └────────────────┬────────────────┘
                   │
                   ▼
   Secuencia de email (4 toques, 12 días)
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Sin respuesta         Respuesta
        │                     │
   Nurturing            Clasificación IA
   (trimestral)         interesado / después / no
                              │
                              ▼
                     Agenda diagnóstico  →  Demo  →  Piloto
```

### 4.1 Fuente: Google Maps

**Usar la Places API oficial de Google, o un proveedor gestionado tipo Apify/Outscraper. No scrapear a mano.** El scraping directo de Google Maps viola sus términos de servicio, se rompe cada vez que cambian el HTML, y arriesga bloqueos de IP. La API tiene costo por consulta pero es predecible y legítima; presupuestarlo como costo de adquisición.

⚠️ **Restricción real de la Places API:** el `place_id` se puede almacenar de forma indefinida, pero el resto de los campos tienen límites de caché. El diseño correcto es guardar `place_id` como llave permanente y refrescar los demás datos cuando se vayan a usar.

Consulta tipo: `spa` / `centro de estética` / `masajes` + localidad, iterando por barrios de Bogotá para superar el límite de resultados por consulta.

### 4.2 Enriquecimiento

Por cada ficha con sitio web o Instagram, extraer: correo de contacto, lista de servicios, rango de precios, y cualquier mención de horario de atención. Esto alimenta tanto el scoring como el bot demo.

Si no hay correo público, el prospecto **no** pasa a la secuencia de email. Va a una lista aparte para otro canal (nunca WhatsApp en frío, ver §6).

### 4.3 Scoring y ángulo personalizado

Un agente de IA recibe la ficha completa + reseñas + servicios y devuelve:

- `score` 0–100 según los criterios de §2
- `descartar` con motivo, si aplica
- `angulo`: una frase específica y verificable sobre ESE negocio, para abrir el correo
- `servicios_detectados`: para cargar el bot demo

El ángulo es la pieza crítica. La diferencia entre esto y spam es que cada correo dice algo cierto y particular que solo aplica a ese destinatario.

**Regla de tono:** el ángulo señala una oportunidad, nunca acusa. No "sus clientes se quejan de que no contestan", sino "vi que varias personas escriben de noche buscando información — es la franja donde más se pierde reserva en este sector".

### 4.4 El diagnóstico automático

Una landing única por prospecto en `toqueflow.com/d/<slug>`, generada sin intervención humana, con:

- El nombre del negocio y su logo
- Sus horarios reales y cuántas horas a la semana quedan sin cobertura
- Las señales encontradas (planteadas como oportunidad, no como reproche)
- Un estimado de reservas perdidas al mes, con el supuesto explícito para que sea creíble
- Un botón: **"Pruebe su propio bot"**

Es medible: cada visita a esa URL es una señal de intención mucho más fuerte que una apertura de correo.

### 4.5 El bot demo — el diferenciador

**Esto ya está construido.** El sandbox de Bejauha (`test: true` → tabla `test_messages` → chat web en [modo-prueba.html](../plataforma/site/modo-prueba.html)) permite correr un flujo real de n8n y desviar la salida a un chat en el navegador, sin tocar WhatsApp.

Apuntado hacia afuera, se convierte en la mejor herramienta de ventas posible: el prospecto entra a una página, escribe *"¿cuánto cuesta el masaje de pareja?"* y **su propio negocio le responde correctamente**, con sus servicios y sus precios, a las 11 de la noche.

Ningún PDF, ningún video y ninguna reunión compiten con eso. Y el costo marginal por prospecto es casi cero porque el motor ya existe y es multi-tenant.

### 4.6 La secuencia de email

Cuatro toques en doce días. Se detiene sola en cuanto hay respuesta.

| # | Día | Asunto | Contenido |
|---|---|---|---|
| 1 | 0 | Específico del negocio, sin gancho de marketing | El ángulo + link al diagnóstico. **Sin pedir reunión.** |
| 2 | 3 | Seguimiento corto | "Le dejé esto listo" + link al bot demo |
| 3 | 7 | Prueba social | El caso Zoe con números concretos |
| 4 | 12 | Cierre de ciclo | "Cierro el tema por ahora, aquí queda" — el que más responde |

Principios: correos cortos (bajo 120 palabras), texto plano sin plantilla HTML corporativa, una sola llamada a la acción, firma con nombre real y teléfono real, y opción de baja visible en todos.

### 4.7 Respuestas

Un agente clasifica cada respuesta en `interesado` / `después` / `no` / `fuera de alcance`, actualiza el estado en `prospects`, y en el caso de interés genera la notificación inmediata para atención humana. **La primera conversación real la atiende una persona.** Automatizar el cierre en esta etapa es donde el outbound automatizado se vuelve spam.

---

## 5. Qué construir — arquitectura

Todo respeta las tres reglas de oro del proyecto: la plataforma es dueña de los datos, n8n es un worker sin estado, se hablan por el contrato. Ver [arquitectura-toque.md](../arquitectura/arquitectura-toque.md).

**ToqueFlow se vuelve un tenant más de su propia plataforma.** Esto tiene dos beneficios: se prueba el producto contra el caso más exigente (el propio), y la funcionalidad de prospección queda lista para vendérsela después a los clientes como un módulo más.

### Casi todo el modelo de datos ya existe

Revisando `site/supabase/schema-negocio.sql`, el esquema de negocio actual **ya sirve para prospección**. No hay que inventar tablas nuevas: hay que usar ToqueFlow como una empresa más y reusar lo que ya corre en producción.

| Ya existe | Cómo se usa para prospección |
|---|---|
| `contacts` | Un prospecto es un contacto de la empresa ToqueFlow con `status='prospecto'` y `source='google_maps'` |
| `contacts.lead_stage` | La temperatura comercial: `caliente` / `tibio` / `frio` — exactamente el scoring |
| `contacts.metadata` (jsonb) | Aquí caben `place_id`, calificación, número de reseñas, horarios, las señales detectadas y el ángulo personalizado |
| `contacts.segment` (jsonb) | Vertical y ciudad como tags |
| `contacts.last_contact_at` · `follow_up_at` | La cadencia de la secuencia: cuándo se tocó y cuándo toca el siguiente correo |
| `campaigns` + `campaign_runs` | La secuencia outbound y su estado por prospecto: `queued` / `sent` / `failed` / **`replied`** |
| `message_log` | Cada correo enviado y recibido — `channel` ya es un campo libre, basta con `'email'` |
| `contactos.html` — **vista Prospectos** | El CRM ya construido: tiles por temperatura, filtros, importación |
| `campanas.html` | Segmentar, redactar, programar y medir — ya funciona |

### Lo que sí falta agregar

Solo tres cosas:

1. **Deduplicación por `place_id`.** El índice único de `contacts` es por `(company_id, phone)`, y muchas fichas de Google Maps no traen teléfono útil. Hace falta un índice único parcial sobre `metadata->>'place_id'` para no reinsertar la misma ficha en cada corrida del scraper.
2. **Aperturas y clics de email.** `campaign_runs` cubre enviado/fallido/respondido, pero no abrió ni hizo clic. O se extiende esa tabla, o se agrega una tabla de eventos de outreach.
3. **`demos`** — la landing personalizada y el bot demo por prospecto: slug, configuración, visitas, mensajes intercambiados.

Todo multi-tenant por `company_id` con RLS, igual que el resto. Migraciones idempotentes y numeradas, siguiendo el patrón de [Bejauha/database/](../../Bejauha/database/).

> **Implicación:** la Fase 1 se acorta mucho. En vez de diseñar y migrar cinco tablas nuevas, es un índice, una tabla y dar de alta a ToqueFlow como empresa con su propio `seed-toqueflow.cjs`. El CRM de prospección de la Fase 6 **ya está construido** — es la vista Prospectos que se acaba de subir.

Precedente adicional: Bejauha tiene [008_prospeccion.sql](../../Bejauha/database/008_prospeccion.sql) y un [agente de filtrado](../../Bejauha/prompts/agente1-filtrado-prospeccion.md). Revisar antes de escribir nada.

### Workflows de n8n

| Workflow | Disparo | Qué hace |
|---|---|---|
| `Toque - Captura Google Maps` | Cron por ciudad + vertical | Consulta Places API, inserta en `prospects` sin duplicar por `place_id` |
| `Toque - Enriquecimiento` | Evento `prospecto_nuevo` | Visita web/Instagram, extrae email, servicios, precios |
| `Toque - Scoring` | Evento `prospecto_enriquecido` | IA califica y redacta el ángulo |
| `Toque - Generar diagnóstico` | Evento `prospecto_calificado` | Crea landing + configura el bot demo |
| `Toque - Secuencia outbound` | Cron diario | Envía el paso que corresponde, respeta límites y pausas |
| `Toque - Receptor de respuestas` | Webhook del proveedor de email | Clasifica, actualiza estado, notifica |

Todos se disparan por el outbox `n8n_events` y el receptor `toque-events` existente. Ver [contrato-n8n.md](../arquitectura/contrato-n8n.md).

### Portal

Un dashboard interno de ToqueFlow que es, en la práctica, el CRM de prospección: cola de prospectos por score, estado de cada secuencia, quién abrió el diagnóstico, quién probó el bot, y la bandeja de respuestas por atender.

Se construye con las mismas piezas que [contactos.html](../plataforma/site/contactos.html) y [campanas.html](../plataforma/site/campanas.html), que ya resuelven listar, filtrar, segmentar y medir.

---

## 6. Cumplimiento y entregabilidad

Esta sección no es opcional. Un error acá quema el dominio, la cuenta de WhatsApp o expone a una sanción.

### Datos personales (Colombia)

Aplica la **Ley 1581 de 2012** y el **Decreto 1377 de 2013**. En la práctica:

- Contactar únicamente **canales comerciales publicados** por el negocio (el `info@`, el correo del sitio web). No construir perfiles de personas naturales identificadas.
- **Identificarse plenamente** en cada correo: nombre real, empresa, teléfono, dirección.
- **Opción de baja visible y honrada de inmediato**, sin pedir explicaciones.
- **Registrar la fuente y la fecha** de cada dato en `prospects`, por si alguna vez hay que acreditar su origen.
- Si alguien pide supresión, borrar y marcar en una lista de exclusión permanente.

⚠️ El **Registro Nacional de Bases de Datos** ante la SIC puede aplicar según el volumen y el tipo de datos que se administren. Antes de escalar el volumen, vale una consulta con un abogado — es barata comparada con una sanción de la Superintendencia.

### WhatsApp en frío: no

**No usar WhatsApp para el primer contacto.** El riesgo de baneo es alto y el proyecto ya tuvo un incidente el 2026-07-07 que llevó a apagar físicamente todos los nodos de envío (ver [estado-mvp.md](../../Bejauha/docs/estado-mvp.md)). Perder el número no cuesta solo la campaña: cuesta la operación de los clientes que ya están corriendo.

WhatsApp entra **solo después** de que el prospecto responda o deje su número en el diagnóstico.

### Entregabilidad del correo

- **Dominio separado para outbound.** Nunca enviar en frío desde `toqueflow.com`; un dominio secundario protege el correo transaccional y el de los clientes.
- SPF, DKIM y DMARC configurados antes del primer envío.
- **Warm-up de 3 a 4 semanas** antes de enviar en volumen. Esto arranca en la semana 1 porque es el camino crítico de todo el plan.
- Máximo 30–50 correos diarios por buzón. Para más volumen, más buzones, no más correos por buzón.
- Texto plano, sin imágenes ni rastreadores agresivos. Los correos que parecen boletín van a promociones.
- Verificar los correos antes de enviar. Un rebote alto destruye la reputación del dominio.

---

## 7. Números — modelo a calibrar

Los porcentajes son hipótesis de trabajo, no promesas. El propósito es saber qué medir y qué hay que corregir cuando no dé.

**Embudo mensual, con 1.000 fichas capturadas:**

| Etapa | Tasa supuesta | Resultado |
|---|---|---|
| Fichas capturadas | — | 1.000 |
| Califican (score y filtros) | 55% | 550 |
| Con correo válido y verificado | 70% | 385 |
| Abren algún correo de la secuencia | 40% | 154 |
| Visitan el diagnóstico | 12% de los que abren | 18 |
| Prueban el bot demo | 40% de las visitas | 7 |
| Responden con interés | 4% de los contactados | 15 |
| Agendan diagnóstico | 40% de los interesados | 6 |
| **Cierran piloto (nivel 2)** | **25% de los agendados** | **1 – 2** |

**Economía por cliente:**

- Piloto (nivel 2): $1.500.000 + $350.000/mes
- Si asciende a sistema completo (nivel 3): $5.500.000 + $700.000/mes
- A 12 meses, un cliente que asciende vale del orden de **$12.000.000 COP**

Con 1 a 2 pilotos al mes, la máquina se paga muy por encima de su costo operativo (API de Places, buzones, proveedor de correo, tokens de IA). El cuello de botella real no será la generación de leads: será la **capacidad de implementación**. Conviene definir desde ya cuántos clientes nuevos se pueden atender al mes y frenar el volumen antes de romper el servicio de los que ya están.

### Qué mirar cada semana

1. **Tasa de respuesta positiva** — si baja de 2%, el problema es el mensaje o el ICP, no el volumen.
2. **Visitas al diagnóstico** — mide si el ángulo personalizado funciona.
3. **Pruebas del bot demo** — el mejor predictor de cierre.
4. **Rebotes y quejas de spam** — por encima de 2% de rebote o 0.1% de queja, parar y arreglar.

---

## 8. Plan de implementación

Principio rector: **validar a mano antes de automatizar.** Automatizar un mensaje que no funciona solo escala el fracaso, y además quema el dominio mientras lo hace.

### Fase 0 — Semana 1: fundaciones

- [ ] Confirmar vertical y ciudad de arranque (recomendado: spas, Bogotá)
- [ ] Comprar el dominio de outbound y **arrancar el warm-up** (camino crítico, 3–4 semanas)
- [ ] Configurar SPF, DKIM, DMARC
- [ ] Cerrar el precio y el alcance exacto del nivel 2 (piloto)
- [ ] Elegir proveedor: Places API directa o servicio gestionado, y estimar costo por 1.000 fichas
- [ ] Revisar el precedente de [008_prospeccion.sql](../../Bejauha/database/008_prospeccion.sql)

### Fase 1 — Semanas 2–3: lista y calificación

- [ ] `seed-toqueflow.cjs` — dar de alta a ToqueFlow como empresa en su propia plataforma
- [ ] Migración corta: índice único por `place_id` + tabla de eventos de outreach (ver §5)
- [ ] Workflow `Toque - Captura Google Maps`, iterando por barrios de Bogotá
- [ ] Capturar 300–500 fichas de la vertical A hacia `contacts`
- [ ] Workflow de enriquecimiento y de scoring (escribe `lead_stage` y `metadata`)
- [ ] **Revisar a mano los primeros 50 resultados del scoring** y ajustar el prompt hasta que la calificación sea confiable
- [ ] Verificar la cola en la vista Prospectos de `contactos.html` — el CRM ya existe

### Fase 2 — Semanas 3–4: validar el mensaje a mano

- [ ] Redactar los cuatro correos de la secuencia
- [ ] **Enviar 20 correos escritos a mano**, uno por uno, a prospectos de score alto
- [ ] Medir respuesta y, sobre todo, **leer lo que contestan**
- [ ] Iterar hasta obtener respuesta positiva consistente

> Este es el punto de decisión del plan. Si 20 correos personalizados a mano no generan conversación, automatizarlos no lo va a arreglar. Volver a §2 y §3 antes de seguir.

### Fase 3 — Semanas 4–6: el diagnóstico automático

- [ ] Plantilla de la landing `/d/<slug>`
- [ ] Workflow que la genera desde los datos del prospecto
- [ ] Instrumentar visitas y clics
- [ ] Integrarla como el enlace principal del correo 1

### Fase 4 — Semanas 5–7: automatizar la secuencia

- [ ] Workflow `Toque - Secuencia outbound` con límites diarios y pausa automática al responder
- [ ] Workflow `Toque - Receptor de respuestas` con clasificación por IA
- [ ] Notificación inmediata para atención humana de los interesados
- [ ] Lista de exclusión y opción de baja funcionando de punta a punta

### Fase 5 — Semanas 7–9: el bot demo

- [ ] Adaptar el sandbox de `test_messages` para prospectos, no solo clientes
- [ ] Carga automática de servicios y precios detectados en el enriquecimiento
- [ ] Página pública de prueba, sin necesidad de cuenta
- [ ] Medir mensajes intercambiados por prospecto

### Fase 6 — Semana 10 en adelante: escalar

- [ ] Ajustar la vista Prospectos a las necesidades del outbound propio (el CRM base ya existe)
- [ ] Segunda ciudad (Medellín) con el mismo mensaje
- [ ] Segunda vertical (estudios de clases) reusando el motor completo
- [ ] Evaluar convertir el módulo de prospección en producto vendible a clientes

---

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Quemar el dominio principal | Dominio separado para outbound, warm-up completo, volumen bajo por buzón |
| Baneo de WhatsApp | WhatsApp jamás en frío. Solo tras respuesta u opt-in |
| Costo de la Places API se dispara | Presupuesto por campaña, filtros agresivos antes de pedir detalles, `place_id` como caché permanente |
| Generar más demanda que capacidad de entrega | Definir el cupo mensual de implementación y frenar el volumen antes de saturar |
| El mensaje personalizado suena invasivo | Tono de oportunidad, nunca de reproche. Validar a mano en la Fase 2 |
| Reclamo por tratamiento de datos | Solo canales comerciales públicos, fuente registrada, baja inmediata, consulta legal antes de escalar volumen |

---

## 10. Decisiones pendientes

1. ¿Vertical y ciudad de arranque confirmadas? (recomendación: spas, Bogotá)
2. ¿Cuántos clientes nuevos se pueden implementar al mes sin afectar a los actuales?
3. ¿Precio y alcance definitivos del piloto de nivel 2?
4. ¿Places API directa o proveedor gestionado?
5. ¿Qué dominio se usa para outbound?

---

## Referencias

- [Arquitectura Toque](../arquitectura/arquitectura-toque.md) — las tres reglas de oro
- [Contrato n8n](../arquitectura/contrato-n8n.md) — eventos, payloads, auth
- [Modo prueba / sandbox](../arquitectura/modo-prueba-sandbox.md) — la base del bot demo
- [Bejauha — estado del MVP](../../Bejauha/docs/estado-mvp.md) — el patrón de referencia
- [Zoe — propuesta comercial](../../Zoe/PROPUESTA_COMERCIAL.md) — precios y ROI del caso spa
