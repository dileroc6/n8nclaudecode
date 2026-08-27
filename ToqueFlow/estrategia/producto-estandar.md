# El producto estándar — Agente de Atención

> Un solo producto, configurable por datos, que sirve para todos los clientes del segmento.
> **Estado: especificación acordada.** Se construye contra el primer cliente que pague.
> Actualizado: 2026-08-27 con la revisión de capacidades (agenda y recordatorios entran al núcleo).

---

## Por qué esto es lo más importante

Hoy cada cliente es un proyecto. Bejauha, Zoe y LuxeSmile tienen carpetas separadas con workflows, prompts y esquemas propios, y los tres hacen esencialmente lo mismo. Esa duplicación es la razón por la que implementar cuesta **45–90 horas**, de las cuales **20 a 40 se van solo en afinar el prompt a mano**.

El objetivo: que el cliente número tres cueste **11–14 horas**, y que puedas venderlo describiéndolo en dos minutos porque siempre es lo mismo.

Con la meta de 10 clientes en 6 meses, esto no es opcional. A 45–90 horas cada uno, diez clientes son 450–900 horas: imposible. A 12 horas, son 120: **eso sí cabe.** La meta que quieres exige exactamente la pieza que quieres construir.

---

## Las seis capacidades

### 1. Responder y sugerir
Contesta desde una **fuente de conocimiento** cargada en la configuración: el sitio web del cliente, un PDF, un documento de preguntas frecuentes. Sabe qué servicios hay, qué cuestan, dónde queda, qué horario tiene, qué políticas aplica. Y **sugiere** — no solo responde lo que le preguntan, propone la opción que encaja.

### 2. Agendar
Propone horarios contra una **disponibilidad configurada en la plataforma** y confirma la cita. Conversa para encontrar el mejor momento, no muestra una lista y ya.

**Alcance exacto:** franjas horarias configurables por día, duración por tipo de servicio, cupos simultáneos, y bloqueos manuales. **No** asigna contra personas ni recursos individuales — eso es el módulo avanzado (ver abajo).

### 3. Capturar
Pide **datos estructurados** cuando la conversación lo amerita: nombre, teléfono, servicio de interés, lo que se haya configurado. No los pide de entrada.

### 4. Recordar
Confirma la cita al agendar y **envía recordatorio antes**, con confirmación de asistencia. Si el cliente no confirma, avisa al negocio.

Esta es la capacidad que más plata devuelve y la más barata de construir: un cron y un mensaje. **El no-show es el dolor que el dueño siente en el bolsillo cada semana**, y es el argumento de venta más fácil de explicar.

### 5. Enrutar
Entrega la conversación a donde corresponda: un humano por WhatsApp, un grupo interno, una página del sitio. Con reglas: si pide hablar con alguien, si insiste en un tema sensible, si está fuera de alcance.

### 6. Registrar
Todo queda en Supabase: el contacto en `contacts`, la conversación en `message_log`, la cita en su tabla. **El cliente lo ve en su portal**, filtra, exporta y le manda campañas después. Esto es lo que separa esto de un bot suelto: los datos se quedan en la plataforma, no en el WhatsApp de alguien.

---

## Config, no código

La diferencia entre un cliente y otro vive **en una fila de base de datos**, no en un workflow distinto.

```jsonc
{
  "identidad": {
    "negocio": "Clínica Dental Ejemplo",
    "tono": "cercano y profesional, sin tecnicismos",
    "saludo": "¡Hola! Soy el asistente de …"
  },
  "conocimiento": {
    "fuentes": [
      { "tipo": "web", "url": "https://clinica.com" },
      { "tipo": "pdf", "ref": "servicios-y-precios.pdf" }
    ],
    "faq_manual": [ { "p": "¿Atienden urgencias?", "r": "…" } ]
  },
  "agenda": {
    "franjas": [
      { "dias": ["lun","mar","mie","jue","vie"], "desde": "08:00", "hasta": "18:00" },
      { "dias": ["sab"], "desde": "09:00", "hasta": "13:00" }
    ],
    "servicios": [
      { "nombre": "Limpieza",  "duracion_min": 45, "cupos_simultaneos": 2 },
      { "nombre": "Valoración", "duracion_min": 30, "cupos_simultaneos": 2 }
    ],
    "anticipacion_min_horas": 4,
    "bloqueos": []
  },
  "recordatorios": {
    "confirmacion_al_agendar": true,
    "recordatorio_horas_antes": 24,
    "pedir_confirmacion": true,
    "avisar_negocio_si_no_confirma": true
  },
  "captura": {
    "campos": [
      { "clave": "full_name", "etiqueta": "nombre",   "obligatorio": true },
      { "clave": "phone",     "etiqueta": "teléfono", "obligatorio": true },
      { "clave": "servicio",  "etiqueta": "qué le interesa", "obligatorio": true }
    ]
  },
  "enrutamiento": {
    "reglas": [
      { "si": "pide hablar con alguien", "accion": "notificar_humano", "destino": "+57300…" },
      { "si": "tema fuera de alcance",   "accion": "responder_y_cerrar" }
    ]
  },
  "registro": { "status_inicial": "prospecto", "source": "bot_inbound" },
  "limites": {
    "nunca": ["dar diagnósticos médicos", "prometer descuentos", "cancelar sin confirmar"],
    "escalar_si": ["reclamo", "insistencia tras dos negativas"]
  }
}
```

Vive en una tabla `agent_config`, una fila por empresa, con RLS igual que el resto. **Un solo workflow de n8n** lee esa config según el `company_id` y se comporta distinto. Se acaban los workflows por cliente.

---

## Qué NO hace

La lista que te permite decir que no en una venta sin improvisar:

- **No asigna citas a personas o recursos individuales.** Agenda contra cupos, no contra "la terapeuta María en la sede norte". Eso es el **módulo de agenda avanzada**, cotizado aparte. *Fue exactamente donde se dispararon las horas en Zoe.*
- **No se integra con el software de agenda propio del sector** (Dentalink, Agenda Pro y similares). A medida, cotizado aparte.

> **Sobre Calendly:** no es un calendario sino una página de reservas, y debajo siempre hay un Google o un Outlook del que lee la disponibilidad. Si es Google —lo más común— el agente trabaja **directo contra ese calendario** y Calendly deja de ofrecer el horario solo, porque mira el mismo sitio. No hay que integrar nada con Calendly. La alternativa es mandar su link, que es el modo `ninguna`: funciona, pero cada paso extra pierde gente. El valor del agente está en cerrar la cita dentro de la conversación.
- **No cobra ni procesa pagos.**
- **No atiende en otro idioma** en el precio base.
- **No hace campañas de salida.** Eso es `campanas.html`, otro módulo.
- **No reemplaza a una persona.** Atiende, agenda y entrega. Lo complejo lo resuelve un humano.

Cada excepción fuera de esta lista te devuelve al modelo de proyectos a medida.

---

## Qué cubre de tus casos

| Caso | ¿Lo cubre? |
|---|---|
| Bejauha — bot inbound | **Sí** |
| Zoe — bot cliente del spa | **El núcleo sí.** Asignar a terapeutas por sede es el módulo avanzado |
| LuxeSmile — clínica dental | **Sí** |
| SM Grand Hotel | Probablemente sí |
| Bejauha — agente admin de saldos de clases | **No.** Otro producto: gestión de paquetes |
| FerreteríaYa — impresión Rappi | **No.** Otro producto |
| Vassco — retenciones contables | **No.** Otro producto |

**El producto estándar y el segmento objetivo son la misma cosa:** negocios de servicios con cita previa. FerreteríaYa y Vassco son trabajo legítimo pero no replicable — no entran en el precio ni en el discurso estándar.

---

## Implementación cuando esto exista

| Paso | Horas |
|---|---|
| Cargar la fuente de conocimiento | 1–2 |
| Configuración (campos, reglas, tono, límites) | 1 |
| Configurar disponibilidad y servicios | 1–2 |
| Probar en el sandbox (`test: true` → `test_messages`) | 2 |
| Conectar el WhatsApp del cliente | 1 |
| Go-live y warm-up | 2 |
| Ajustes de la primera semana | 3–4 |
| **Total** | **11–14 h** |

Contra 45–90 hoy. **Ese salto es todo el modelo de negocio.**

---

## Qué falta construir

Ya existe: multi-tenant con RLS verificado, `contacts`, `message_log`, el sandbox `test_messages`, el receptor `toque-events` y el portal.

| Pieza | Qué es | Prioridad |
|---|---|---|
| Tabla `agent_config` | Una fila por empresa, con RLS | 1 |
| Cargador de conocimiento | Scrapea la web o procesa el PDF y lo deja consultable. **Elimina las 20–40 h de afinar prompts** | 1 — el mayor ahorro |
| Workflow genérico | Un solo n8n parametrizado por `company_id` | 2 |
| Tablas `appointments` + disponibilidad | La agenda simple | 3 |
| Cron de recordatorios | Confirmación y aviso previo | 4 — barato y de alto valor |
| Pantalla de configuración | Para no editar JSON a mano | 5 — puede esperar al tercer cliente |

Orden por retorno sobre hora invertida: **el cargador de conocimiento primero.** Es donde está el 40% del costo actual.

---

## Riesgo operativo a vigilar

Cada cliente pone su propio número de WhatsApp y ustedes ponen Evolution. Eso está bien: **un baneo tumba a un cliente, no a todos.**

Pero Evolution corre en un solo VPS. **Si ese VPS cae, caen todos los clientes a la vez.** Con uno o dos clientes es un susto; con diez es el negocio entero parado y diez llamadas al tiempo. Antes del cliente cinco hace falta decidir: respaldo, redundancia o un plan de recuperación escrito.

---

## Cómo se vende

> «Un asistente que atiende tu WhatsApp las 24 horas. Sabe todo lo que hay en tu sitio web, responde como responderías tú, **agenda la cita** y le manda el recordatorio al paciente para que no se le olvide. Todo queda en tu panel: quién escribió, qué preguntó, qué agendó. Y desde ahí les puedes escribir después.»

Sin decir n8n, ni Supabase, ni webhook. Tu comprador no sabe qué es eso y no le importa.

**El gancho más fuerte es el no-show**, no el bot. "¿Cuántas citas se te caen al mes porque la gente no llega?" es la pregunta que abre la venta.

---

## Referencias

- [plan-comercial.md](plan-comercial.md) — las cinco fases
- [plantilla-propuesta.md](plantilla-propuesta.md) — cómo se cierra
- [../arquitectura/contrato-n8n.md](../arquitectura/contrato-n8n.md) · [../arquitectura/modo-prueba-sandbox.md](../arquitectura/modo-prueba-sandbox.md)
