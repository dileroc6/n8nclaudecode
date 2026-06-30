# Bejauha — Diagramas de flujo de los agentes

> Diagramas en Mermaid (vista previa de Markdown en VSCode o GitHub).
> Reflejan el estado real al **2026-05-26**. IDs en n8n:
> Orquestador `rD794jC4vc9C1Ke7` · Agente 2 `sILA5Co9FD3JI5eJ` ·
> Agente 3 `rctOPl2BpQ4UVjEk` · WF04 `SRCYX5c8qImyTYt9`.

---

## 0. Orquestador (WF00) — entrada + ruteo

Dos líneas de WhatsApp:
- **Línea dedicada** (futura) → solo Agente 1 (outbound).
- **Línea principal Bejauha (312 2011349)** → este orquestador → Agente 2 o 3.

```mermaid
flowchart TD
  IN["Webhook bejauha-wa<br/>(evento Evolution)"] --> N["Normalizar payload<br/>(extrae remitente y texto;<br/>ignora grupos / fromMe / no-texto)"]
  N --> IDEM["Idempotencia<br/>(INSERT message_id)"]
  IDEM --> Q1{"¿Nuevo?<br/>(inserted = 1)"}
  Q1 -->|No · duplicado| DUP["Ignorar"]
  Q1 -->|Sí| ROL["Detectar rol<br/>(¿el número está en ADMINS?)"]
  ROL --> Q2{"¿Es admin?"}
  Q2 -->|Sí| A2["AGENTE 2 · Admin<br/>(executeWorkflow)"]
  Q2 -->|No| A3["AGENTE 3 · Atención<br/>(executeWorkflow)"]
```

---

## 1. Agente 1 — Filtrado y Prospección (Outbound) · ⏳ pendiente

> Aún no construido (espera definir la oferta para los 1.300).

```mermaid
flowchart TD
  C["Cron diario · tz America/Bogota"] --> W{"Warm-up (5→10→20/día)"}
  W --> SEL["Seleccionar lote de leads<br/>estado = pendiente"]
  SEL --> SEND["Enviar mensaje (copy rotado)<br/>por la LÍNEA DEDICADA"]
  SEND --> RESP{"¿Responde?"}
  RESP -->|No (72h)| SR["estado = sin_respuesta"]
  RESP -->|Sí| CLA["LLM clasifica"]
  CLA --> T{"Temperatura"}
  T -->|Caliente| H["Handoff + alerta a humano"]
  T -->|"Tibio / Frío"| BD["Queda en BD (seguimiento)"]
```

---

## 2. Agente 2 — Admin / Control de Clases ✅

```mermaid
flowchart TD
  IN["Admin escribe (vía orquestador)"] --> LLM["LLM interpreta la orden"]
  LLM --> SQL["Ejecutar SQL<br/>(busca cliente por nombre)"]
  SQL --> Q1{"¿Cuántos clientes<br/>coinciden?"}
  Q1 -->|"0"| NF["Responde: no encontrado"]
  Q1 -->|">1 (homónimos)"| AMB["Pide aclarar<br/>apellido/celular · NO actúa"]
  Q1 -->|"1"| ACC{"Tipo de orden"}
  ACC -->|Asistencia| DESC["Descuenta 1 clase"]
  DESC --> CHK{"Saldo resultante"}
  CHK -->|"= 1"| AV1["Avisa al cliente: queda 1"]
  CHK -->|"= 0"| AV0["MENSAJE 1 (renovar, con link)"]
  CHK -->|"> 1"| OK1["Confirma al admin"]
  ACC -->|Recarga 4/8| REC["Suma saldo + calcula vence_at<br/>(4=2 meses, 8=3 meses)"]
  ACC -->|Consulta| QRY["Devuelve saldo"]
```

---

## 3. Agente 3 — Atención / Inbound ✅

```mermaid
flowchart TD
  IN["Cliente escribe (vía orquestador)"] --> CTX["Cargar contexto<br/>(¿asignado a humano? + KB + últimos 6 msgs)"]
  CTX --> ASG{"¿Asignado<br/>a humano?"}
  ASG -->|Sí| STOP["No interrumpir"]
  ASG -->|No| LLM["LLM responde con KB + memoria<br/>(tono Bejauha)"]
  LLM --> SQL["Guarda lead + logs"]
  SQL --> SEND["Responde al cliente"]
  SEND --> Q{"¿Intención de compra?<br/>(caliente)"}
  Q -->|Sí| H["Crea handoff + marca asignado_humano"]
  H --> AL["Alerta al asesor por WhatsApp<br/>(nº del cliente + resumen)"]
  Q -->|No| NUT["Queda como tibio/frío"]
```

---

## 4. WF04 — Recordatorios de vencimiento (cron) ✅

```mermaid
flowchart TD
  C["Cron diario 9am · tz Bogotá"] --> Q["Buscar paquetes que<br/>vencen en 14 días<br/>(con clases sin usar, no pausados)"]
  Q --> L["Por cada cliente"]
  L --> MSG["Armar recordatorio cálido"]
  MSG --> SEND["Enviar por Evolution"]
  SEND --> LOG["Registrar en mensajes_logs"]
```
