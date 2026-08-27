# El producto estándar — Agente de Atención

> Un solo producto, configurable por datos, que sirve para todos los clientes del segmento.
> **Estado: especificación para acordar.** Se construye contra el primer cliente que pague, no antes.
> Fecha: 2026-08-27.

---

## Por qué esto es lo más importante que podemos definir

Hoy cada cliente es un proyecto. Bejauha, Zoe y LuxeSmile tienen carpetas separadas con workflows, prompts y esquemas propios, y sin embargo **los tres hacen esencialmente lo mismo**. Esa duplicación es la razón por la que implementar cuesta semanas y por la que el negocio no escala con más leads: escala el segundo cliente igual al primero, no un cliente distinto cada vez.

El objetivo de este documento es que implementar el cliente número tres cueste **10 horas en vez de 80**, y que puedas venderlo describiéndolo en dos minutos porque siempre es lo mismo.

---

## Las cuatro capacidades

Este es el denominador común. Todo cliente del segmento necesita estas cuatro, ni una más:

### 1. Responder
Contesta desde una **fuente de conocimiento** que se carga en la configuración: el sitio web del cliente, un PDF, un documento de preguntas frecuentes. Sabe qué servicios hay, qué cuestan, dónde queda, qué horario tiene, qué políticas aplica.

### 2. Capturar
Cuando la conversación lo amerita, pide **datos estructurados**: nombre, teléfono, servicio de interés, fecha deseada, lo que se haya configurado. No los pide de entrada — los pide cuando la conversación llegó a donde tiene que llegar.

### 3. Enrutar
Entrega la conversación a donde corresponda: **un humano por WhatsApp**, un enlace de agenda, una página del sitio, un grupo interno. Con reglas: si el cliente pide algo fuera de alcance, si insiste en un tema sensible, si pide hablar con una persona.

### 4. Registrar
Todo queda en Supabase: el contacto en `contacts`, la conversación en `message_log`. **El cliente lo ve en su portal**, filtra, exporta y le manda campañas después. Esto es lo que separa esto de un bot suelto: los datos se quedan en la plataforma, no en el WhatsApp de alguien.

---

## Config, no código

La diferencia entre un cliente y otro debe vivir **en una fila de base de datos**, no en un workflow distinto. Propuesta de configuración:

```jsonc
{
  "identidad": {
    "negocio": "Clínica Dental Ejemplo",
    "tono": "cercano y profesional, sin tecnicismos",
    "saludo": "¡Hola! Soy el asistente de …",
    "horario_humano": "L-V 8am-6pm"
  },
  "conocimiento": {
    "fuentes": [
      { "tipo": "web",  "url": "https://clinica.com" },
      { "tipo": "pdf",  "ref": "servicios-y-precios.pdf" }
    ],
    "faq_manual": [ { "p": "¿Atienden urgencias?", "r": "…" } ]
  },
  "captura": {
    "disparador": "cuando el interesado pregunta por precio o disponibilidad",
    "campos": [
      { "clave": "full_name", "etiqueta": "nombre",   "obligatorio": true },
      { "clave": "phone",     "etiqueta": "teléfono", "obligatorio": true },
      { "clave": "servicio",  "etiqueta": "qué le interesa", "obligatorio": true },
      { "clave": "fecha_deseada", "etiqueta": "cuándo le queda bien", "obligatorio": false }
    ]
  },
  "enrutamiento": {
    "reglas": [
      { "si": "datos completos",         "accion": "notificar_humano", "destino": "+57300…" },
      { "si": "pide hablar con alguien", "accion": "notificar_humano", "destino": "+57300…" },
      { "si": "tema fuera de alcance",   "accion": "responder_y_cerrar" },
      { "si": "pide agendar",            "accion": "enviar_link",      "destino": "https://cal.com/…" }
    ]
  },
  "registro": {
    "status_inicial": "prospecto",
    "lead_stage_inicial": "caliente",
    "source": "bot_inbound"
  },
  "limites": {
    "nunca": ["dar diagnósticos médicos", "prometer descuentos", "confirmar citas sin humano"],
    "escalar_si": ["reclamo", "insistencia tras dos negativas"]
  }
}
```

Vive en una tabla nueva `agent_config`, una fila por empresa, con RLS igual que el resto. **Un solo workflow de n8n** lee esa config según el `company_id` del evento y se comporta distinto. Se acabaron los workflows por cliente.

---

## Qué NO hace (y esto vale tanto como lo que sí hace)

Necesitas poder decir que no en una venta sin improvisar:

- **No agenda contra la agenda real del cliente.** Captura la solicitud y la enruta. Agendar contra disponibilidad real —con terapeutas, sedes, duraciones y bloqueos— es donde se dispararon las horas en Zoe. Va como módulo aparte, cobrado aparte.
- **No cobra ni procesa pagos.**
- **No se integra con el software de agenda o el CRM del cliente.** A medida, cotizado aparte.
- **No atiende en otro idioma** en el precio base.
- **No hace campañas de salida.** Eso es `campanas.html`, otro módulo.
- **No reemplaza a una persona.** Atiende, califica y entrega. El cierre lo hace un humano.

Cada excepción que aceptes fuera de esta lista te devuelve al modelo de proyectos a medida.

---

## Qué cubre y qué no, de tus casos actuales

| Caso | ¿Lo cubre el estándar? |
|---|---|
| Bejauha — bot inbound | **Sí**, tal cual |
| Zoe — bot cliente del spa | **Sí** el núcleo; el agendamiento contra terapeutas es el módulo aparte |
| LuxeSmile — clínica dental | **Sí**, tal cual |
| SM Grand Hotel | Probablemente sí |
| Bejauha — agente admin (saldos de clases) | **No.** Es un producto distinto: gestión de paquetes |
| FerreteríaYa — impresión Rappi | **No.** Es otro producto |
| Vassco — retenciones contables | **No.** Es otro producto |

Esto confirma algo importante: **el producto estándar y el segmento objetivo son la misma cosa.** Negocios de servicios con cita previa. FerreteríaYa y Vassco son de otro negocio — legítimos, pero no replicables, y no deberían entrar en el precio ni en el discurso estándar.

---

## Cómo se ve la implementación cuando esto exista

| Paso | Horas |
|---|---|
| Cargar la fuente de conocimiento (web o PDF) | 1–2 |
| Llenar la configuración (campos, reglas, tono, límites) | 1 |
| Probar en el sandbox (`test: true` → `test_messages`) | 2 |
| Conectar el WhatsApp del cliente | 1 |
| Warm-up y go-live | 2 |
| Ajustes de la primera semana | 3–4 |
| **Total** | **10–12 h** |

Contra 80–120 horas hoy. **Ese salto es todo el modelo de negocio.**

---

## Qué falta construir

Ya existe casi todo: multi-tenant con RLS verificado, `contacts`, `message_log`, el sandbox `test_messages`, el receptor `toque-events` y el portal donde el cliente ve sus datos.

Falta:

| Pieza | Qué es | Cuándo |
|---|---|---|
| Tabla `agent_config` | Una fila por empresa, con RLS | Contra el primer cliente que pague |
| Workflow genérico | Un solo n8n parametrizado por `company_id` | Ídem |
| Cargador de conocimiento | Scrapea la web o procesa el PDF y lo deja consultable | Ídem |
| Pantalla de configuración | Para no editar JSON a mano. Puede esperar | Al tercer cliente |

**Nada de esto se construye especulativamente.** Se construye entregando al primer cliente que pague, extrayendo el patrón mientras lo haces. Es la única forma de que la abstracción salga correcta: si la diseñas antes, vas a abstraer lo que imaginas en vez de lo que el cliente necesita.

---

## Cómo se vende

> «Un asistente que atiende tu WhatsApp las 24 horas. Sabe todo lo que hay en tu sitio web y tus documentos, responde como responderías tú, toma los datos del que quiere agendar y te lo pasa listo. Todo queda en tu panel: quién escribió, qué preguntó, qué quería. Y desde ahí les puedes escribir después.»

Sin decir n8n, ni Supabase, ni webhook, ni RLS. Tu comprador no sabe qué es eso y no le importa.

---

## Referencias

- [plan-comercial.md](plan-comercial.md) — las cinco fases
- [cuestionario-decisiones.md](cuestionario-decisiones.md) — sección E: las decisiones abiertas sobre este producto
- [../arquitectura/contrato-n8n.md](../arquitectura/contrato-n8n.md) — cómo se comunican plataforma y n8n
- [../arquitectura/modo-prueba-sandbox.md](../arquitectura/modo-prueba-sandbox.md) — el sandbox donde se prueba antes del go-live
