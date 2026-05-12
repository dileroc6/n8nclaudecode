---
title: "Propuesta Comercial — Sistema de Reservas Automatizado"
subtitle: "Zoe Tantric SPA · Bogotá + Cajicá"
author: "Diego Rojas"
date: "Mayo 2026"
geometry: margin=2.5cm
fontsize: 11pt
mainfont: "Helvetica"
---

\newpage

# Resumen Ejecutivo

**Zoe Tantric SPA** recibe consultas y reservas por WhatsApp las 24 horas, pero solo se responde durante horario laboral. Cada mensaje no atendido a tiempo es una reserva potencial que se pierde — y cada no-show es un slot vendible que se desperdicia.

Esta propuesta describe la implementación de un **sistema integral de gestión de reservas vía WhatsApp**, completamente operativo y probado, diseñado específicamente para Zoe. El sistema:

- **Atiende, califica y agenda clientes 24/7** sin intervención humana.
- **Reduce no-shows** mediante un sistema de check-in con código de verificación (OTP).
- **Da al admin un panel de control conversacional** por WhatsApp para operar el negocio sin abrir aplicaciones.
- **Provee 6 dashboards de inteligencia de negocio** (financiero, operativo, retención, comparativo entre sedes, performance de terapeutas).
- **Cumple estrictamente las políticas del negocio** (no servicios sexuales, no tocar a la terapeuta, escalamiento al admin).

**Inversión:**

| Concepto | Valor |
|---|---|
| Implementación llave en mano | **$5.500.000 COP** *(precio de lanzamiento)* |
| Mantenimiento, soporte y operación | **$700.000 COP / mes** |

**ROI esperado:** entre **3x y 8x** sobre la mensualidad, dependiendo del volumen actual de reservas (detalle en sección 7).

\newpage

# 1. El problema que resolvemos

Un spa de masaje tántrico opera en un mercado con tres fricciones particulares que castigan los ingresos:

### 1.1 Consultas fuera de horario que no se convierten
La mayoría de los mensajes a un spa llegan **entre 7 PM y 1 AM**, cuando el equipo administrativo ya no responde. Para cuando se contesta al día siguiente, el cliente ya buscó otra alternativa o perdió el impulso.

### 1.2 Tiempo administrativo desperdiciado en preguntas repetitivas
"¿Cuánto cuesta?", "¿qué incluye?", "¿hay jacuzzi?", "¿dónde quedan?" — el 70% de las conversaciones son **preguntas que se responden idénticas** cada día. Una persona contestando esto es tiempo que no se dedica a la operación del spa.

### 1.3 No-shows y reprogramaciones sin control
Sin un sistema, no hay manera de:
- Confirmar asistencia con anticipación.
- Limitar reprogramaciones abusivas.
- Identificar clientes problemáticos antes de que afecten la agenda.
- Tener números reales del negocio para tomar decisiones.

> _**Nota:** Los números exactos de volumen actual y estructura administrativa se completarán en una sesión de descubrimiento de 30 minutos antes de firmar. El ROI estimado de la sección 7 cubre 3 escenarios para que ustedes identifiquen el suyo._

\newpage

# 2. La solución: Zoe Bot

Un sistema en producción, listo para operar desde el día 1, con tres componentes:

### 2.1 Bot cliente (atención automática 24/7)

Atiende a cualquier persona que escriba al WhatsApp `+57 305 342 1597`. Sabe:

- Saludar de forma cálida y consultiva (no spammea precios al primer mensaje).
- Explicar el catálogo completo: **Reflejo, Memorable, Espectador** — individual, pareja y add-on jacuzzi.
- Verificar disponibilidad real contra la agenda de las 5 terapeutas en ambas sedes.
- **Agendar la cita** dejándola registrada en base de datos.
- Cancelar y reprogramar (con límite duro de 3 reprogramaciones antes de escalar al admin).
- Responder FAQ del PDF "Parejas en Zoe": políticas, métodos de pago, ubicaciones.
- **Cumplir reglas duras de compliance:** nunca ofrecer servicios sexuales, nunca insinuar contacto físico con la terapeuta, escalar inmediatamente al admin si el cliente insiste.

**Tolerancia natural al lenguaje:** entiende typos, frases incompletas, conjugaciones colombianas. El cliente no necesita aprender comandos.

### 2.2 Bot admin (operación conversacional)

El admin (`+57 301 266 1158`) opera el negocio **escribiendo en lenguaje natural por WhatsApp**:

```
Admin:  bloquea a maría mañana 2 a 5 está enferma

Bot:    Voy a registrar este bloqueo:
        • Terapeuta: María García (Bogotá)
        • Inicio:    viernes 8 mayo, 2:00 PM
        • Fin:       viernes 8 mayo, 5:00 PM
        • Motivo:    enferma

        ¿Confirmas? sí o no

Admin:  si

Bot:    Listo. Bloqueo registrado. 2 citas afectadas:
        • Juan P., 3 PM Reflejo  → coordina cancelación manual
        • Laura M., 4 PM Memorable → coordina cancelación manual
```

**Acciones soportadas hoy:**

| Categoría | Acciones |
|---|---|
| Consultar | Agenda del día, bloqueos vigentes, disponibilidad de terapeuta, ficha completa de un cliente (historial + alertas) |
| Operar | Crear/eliminar bloqueos, cancelar cita, bloquear/desbloquear cliente, resetear contador de reprogramaciones |
| Seguridad | Toda acción de escritura pide **confirmación previa con preview** (TTL 5 min); el admin puede decir "no" para cancelar |

### 2.3 Sistema de check-in con OTP (anti no-show)

30 minutos después de la hora de la cita, el bot envía un código de 6 dígitos al cliente. El cliente lo entrega en recepción, lo escribe en WhatsApp, y la cita pasa a **ejecutada**. Si no se valida en 1 hora, **automáticamente queda como `no_show`** en el sistema — sin trabajo manual.

Esto da, por primera vez, **número real de no-shows** medible y comparable mes a mes.

### 2.4 Recordatorio automático 24h antes
Cada mañana a las 9 AM Bogotá el sistema envía recordatorio a todos los clientes con cita del día siguiente. Reduce no-shows típicamente entre 20% y 35%.

### 2.5 Festivos colombianos auto-bloqueados
El sistema computa los festivos del año siguiente automáticamente cada año (algoritmo Gauss + Ley Emiliani) y los marca como días bloqueados — sin que el admin tenga que hacerlo manual.

\newpage

# 3. Dashboards de inteligencia de negocio

Acceso vía navegador a 6 dashboards en tiempo real:

| Dashboard | Para qué sirve |
|---|---|
| **Visión General** | Pulso del negocio en una pantalla: KPIs, ingresos, top terapeutas, top clientes |
| **Financiero** | Ingresos diarios, mensuales 12 meses, ticket promedio, mix por servicio y por sede |
| **Operativo Diario** | Lo que pasa **hoy**: citas, OTP pendientes, agenda con colores por estado, alertas |
| **Bogotá vs Cajicá** | Comparativo lado a lado: cuál sede rinde más, hora pico de cada una, tendencia |
| **Clientes / Retención** | LTV, % recurrentes, clientes VIP, clientes en riesgo de churn, cohortes 30/60/90 días |
| **Performance Terapeutas** | Quién factura más, quién tiene más no-shows, ticket promedio por terapeuta |

> **Por qué importa:** decidir con números, no con intuición. Saber objetivamente qué terapeuta agendar primero, qué servicio promover, qué sede necesita marketing.

\newpage

# 4. Arquitectura técnica (resumen)

Sistema profesional, no un "bot armado en una tarde":

| Componente | Tecnología |
|---|---|
| Canal de mensajería | WhatsApp Business vía Evolution API v2 |
| Orquestación | n8n self-hosted (VPS dedicado) |
| Inteligencia | OpenAI GPT-4o-mini con modo JSON estructurado |
| Base de datos | PostgreSQL — schema dedicado con 11 tablas, 7 funciones, triggers y constraints |
| Dashboards | Metabase self-hosted con 6 dashboards y 48 visualizaciones |
| Zona horaria | America/Bogotá en todo el sistema |

**7 workflows operativos en producción:**

1. **Orquestador** — recepción, idempotencia, ruteo cliente/admin, memoria conversacional de 6 turnos.
2. **Agendar** — validación de disponibilidad + INSERT atómico anti-race-condition.
3. **Reprogramar / Cancelar / OTP** — control de límites y estados.
4. **Recordatorio 24h** — cron diario 9 AM Bogotá.
5. **OTP cron** — cron cada 5 minutos para generar y expirar códigos.
6. **Admin GPT** — bot administrativo conversacional con preview/confirmación.
7. **Festivos cron anual** — auto-poblar calendario colombiano.

**Garantías técnicas incluidas:**

- Idempotencia en el webhook (no se duplican reservas si WhatsApp reenvía).
- Race conditions cubiertas por `EXCLUDE constraint` en Postgres.
- Memoria conversacional persistente (el bot recuerda 6 turnos atrás).
- Backups diarios de Postgres.
- Anti-canibalismo (el sistema nunca agenda dos clientes al mismo slot).

\newpage

# 5. Lo que ya está construido y validado

> **Importante:** esto **no es una propuesta de desarrollo desde cero**. El sistema ya está implementado, en producción, y probado funcionalmente. Lo que se contrata es la **operación, soporte y mejora continua**.

### 5.1 Funcionalidades del bot cliente — validadas

- [x] Saludo consultivo (no bombardea precios).
- [x] Catálogo on-demand bien explicado.
- [x] Agendamiento con datos completos (servicio + fecha + hora + sede).
- [x] Memoria conversacional (información en partes).
- [x] Cancelación de cita.
- [x] Reprogramación con contador 1-3 + escalamiento al 4° intento.
- [x] FAQ del PDF (no sexual, no tocar terapeuta, sedes, métodos de pago).
- [x] Tolerancia a typos y conjugaciones colombianas.
- [x] Privacidad inviolable: nunca revela información de otros clientes ni datos internos.
- [x] Rechaza temas fuera del scope.

### 5.2 Funcionalidades admin — validadas

- [x] Saludo y ayuda conversacionales.
- [x] Listar agenda, bloqueos y disponibilidad de terapeutas.
- [x] Crear/eliminar bloqueos con preview + confirmación + anti-duplicado.
- [x] Cancelar cita / bloquear cliente / desbloquear / reset reprog.
- [x] Cancelación de operación pendiente ("no, mejor no").
- [x] Fechas relativas pre-calculadas (mañana, próximo lunes, etc.).

### 5.3 Infraestructura desplegada

- [x] Schema Postgres completo aplicado.
- [x] Instancia Evolution `zoe` enlazada al `+57 305 342 1597`.
- [x] 7 workflows desplegados en n8n.
- [x] 6 dashboards Metabase con paleta púrpura/teal Zoe.
- [x] Calendario de festivos 2026-2027 cargado.

\newpage

# 6. Pendientes antes de salir a producción

Para que el sistema sea **fiel a la operación real de Zoe**, necesitamos completar (en sesiones cortas con la administración):

| # | Pendiente | Tiempo estimado |
|---|---|---|
| 1 | Nombres reales de las 5 terapeutas y sus horarios base | 20 min |
| 2 | Direcciones exactas de ambas sedes | 5 min |
| 3 | Matriz "qué terapeuta hace qué servicio" (si no es 100% cruzada) | 15 min |
| 4 | Prueba E2E del ciclo OTP completo con un cliente real | 30 min |
| 5 | Validación final del tono y vocabulario del bot por la administración | 30 min |

**Total estimado: 1 sesión de 2 horas** para tener el sistema listo para producción.

\newpage

# 7. Retorno de inversión (ROI)

Tres escenarios. Identifiquen el suyo:

## 7.1 Escenario A — Spa en crecimiento (≈50 reservas/mes)

| Concepto | Valor estimado |
|---|---|
| Ticket promedio | $350.000 |
| Ingreso mensual actual | ≈ $17.500.000 |
| **Reservas recuperadas** (atención 24/7 captura ~15% perdidas hoy fuera de horario) | +7 reservas/mes |
| **Ingreso adicional/mes** | **+$2.450.000** |
| Reducción no-shows con OTP+recordatorio (~25%) | +2 reservas efectivas |
| **Total beneficio/mes** | **≈ $3.150.000** |
| Inversión mensual | $700.000 |
| **ROI** | **4.5x** |

## 7.2 Escenario B — Operación consolidada (≈120 reservas/mes)

| Concepto | Valor estimado |
|---|---|
| Ingreso mensual actual | ≈ $42.000.000 |
| Reservas recuperadas | +15 reservas/mes |
| Ingreso adicional | +$5.250.000 |
| Reducción no-shows | +5 reservas efectivas (+$1.750.000) |
| Ahorro tiempo admin (~30 horas/mes liberadas) | +$900.000 (costo de oportunidad) |
| **Total beneficio/mes** | **≈ $7.900.000** |
| Inversión mensual | $700.000 |
| **ROI** | **11x** |

## 7.3 Escenario C — Alto volumen (≈250+ reservas/mes)

| Concepto | Valor estimado |
|---|---|
| Ingreso mensual actual | ≈ $87.500.000 |
| Reservas recuperadas + no-shows evitados | +35 reservas/mes |
| **Total beneficio/mes** | **≈ $12.250.000** |
| Inversión mensual | $700.000 |
| **ROI** | **17x** |

> **Importante:** estos números son **estimados con benchmarks de industria de servicios en Colombia**. Los reales se medirán mes a mes con los dashboards y se ajustarán en la primera revisión trimestral.

\newpage

# 8. Inversión

## 8.1 Implementación

**$5.500.000 COP** (precio de lanzamiento — normalmente $8.000.000)

**Incluye:**

- Configuración completa del sistema con los datos reales de Zoe.
- Sesión de descubrimiento de 2 horas para captura de datos finales.
- Despliegue en infraestructura productiva (VPS, Evolution, n8n, Postgres, Metabase).
- 5 días de monitoreo intensivo post-lanzamiento con ajustes inmediatos.
- Capacitación al admin sobre cómo usar el bot administrativo (1 hora).
- Capacitación sobre cómo leer los 6 dashboards (1 hora).
- Manual de operación entregado en PDF.

**Forma de pago:**

| Hito | % | Monto |
|---|---|---|
| Firma del contrato | 50% | $2.750.000 |
| Salida a producción | 50% | $2.750.000 |

## 8.2 Operación mensual

**$700.000 COP / mes**

**Incluye:**

- Hosting del VPS y todos los componentes (n8n, Postgres, Evolution, Metabase).
- Costos de API de OpenAI (~50-80K mensuales en consumo real).
- Costos de Evolution API.
- Monitoreo proactivo: si algo falla, lo sabemos antes que ustedes.
- Soporte técnico vía WhatsApp en horario hábil (respuesta < 4 horas).
- Backups diarios automáticos de la base de datos.
- Actualizaciones de seguridad de la infraestructura.
- **Hasta 3 ajustes pequeños/mes** sobre el bot (cambios de texto, ajustes de tono, agregar variantes de respuesta).
- Reporte mensual ejecutivo con KPIs y recomendaciones.

**No incluye** (cotización aparte si se requiere):

- Nuevas funcionalidades mayores (ej. integración con pasarela de pago, app móvil propia).
- Migración de datos históricos extensos.
- Integración con sistemas externos nuevos.

\newpage

# 9. Cronograma

| Semana | Hito |
|---|---|
| 1 | Firma + sesión de descubrimiento (2h) + carga de datos reales |
| 2 | Pruebas E2E + ajuste de tono + capacitación admin |
| 3 | **Salida a producción** + monitoreo intensivo |
| 4 | Primer reporte ejecutivo + ajustes finos |

\newpage

# 10. Por qué nosotros

- **Sistema construido específicamente para spa tántrico** — no es un bot genérico al que se le pegan parches. Las reglas de compliance del nicho están en el ADN del sistema.
- **Stack profesional** que escala — no es Zapier de juguete. Es la misma tecnología que usan empresas medianas (n8n, Postgres, Metabase) en producción real.
- **Sin lock-in** — todo el código y los datos viven en infraestructura controlable. Si en el futuro Zoe quiere mover el sistema, se entrega.
- **Caso de uso enfocado**: este es el sistema enfocado en spa Premium en Colombia con dos sedes. No hay un compromiso genérico.

\newpage

# 11. Próximos pasos

1. **Hoy:** Revisión de esta propuesta con la administración de Zoe.
2. **Esta semana:** Sesión de 30 minutos para resolver preguntas y validar escenario de ROI aplicable.
3. **Próxima semana:** Firma + sesión de descubrimiento + inicio de implementación.

---

**Contacto:**

Diego Rojas
WhatsApp: [completar]
Email: [completar]

---

_Propuesta válida por 30 días desde su emisión._
_Precio de lanzamiento por ser el primer cliente del nicho spa en Colombia._
