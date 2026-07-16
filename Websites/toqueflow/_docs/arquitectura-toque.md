# Toque — Arquitectura objetivo (multi-cliente)

> Cómo debería funcionar Toque para Bejauha y para cualquier servicio que llegue después.
> **Este documento es a nivel Toque** (no solo Bejauha); vive aquí por ahora, puede reubicarse.

```mermaid
flowchart TB
    subgraph TEN["Clientes de Toque (multi-tenant)"]
        direction LR
        C1["Bejauha"]
        C2["Cliente 2"]
        C3["Cliente N..."]
    end

    subgraph PLAT["Plataforma Toque — cerebro, datos y UI"]
        UI["Portal por cliente<br/>(dashboards, config de campañas, filtros)"]
        PAY["Pagos / Auth / Tenants"]
        DB[("Base de datos<br/>FUENTE DE VERDAD")]
        API["API + Webhooks (el contrato)"]
        UI --- DB
        PAY --- DB
        DB --- API
    end

    subgraph N8N["n8n — capa de integración / worker (sin estado)"]
        ORQ["Orquestador multi-cliente<br/>(parametrizado por tenant)"]
        F["Flujos: reactivación, bots,<br/>recordatorios, crons, envíos"]
        ORQ --> F
    end

    subgraph EXT["Servicios externos"]
        direction LR
        WA["WhatsApp (Evolution)"]
        IA["IA / LLM"]
        MAIL["Email / otros"]
    end

    EU["Usuarios finales<br/>(los clientes de cada negocio)"]

    C1 --> UI
    C2 --> UI
    C3 --> UI
    API -->|"dispara: ejecuta campaña del tenant Y"| ORQ
    F -->|"lee config y datos"| API
    F -->|"reporta resultados"| API
    F --> WA
    F --> IA
    F --> MAIL
    WA --> EU
    EU -->|"mensaje entrante"| WA
    WA --> ORQ

    style TEN fill:#f6f3ea,stroke:#d9cfb8
    style PLAT fill:#efe4c6,stroke:#c9a24b
    style N8N fill:#e6efe0,stroke:#7c8a6f
    style EXT fill:#eef1f5,stroke:#8b9aa8
```

## Vista de infraestructura — dónde vive cada cosa

Las mismas piezas por ubicación (VPS Hostinger vs externo).

```mermaid
flowchart TB
    subgraph HOST["Hostinger (misma cuenta)"]
        subgraph VPS["VPS (Docker)"]
            direction LR
            N8N["n8n<br/>(worker / motor de flujos)<br/>receptor toque-events<br/>+ handlers"]
            EVO["Evolution API<br/>(gateway WhatsApp)"]
            PG[("PostgreSQL<br/>(Evolution + otros clientes)")]
        end
        APP["Plataforma Toque<br/>(frontend HTML)"]
    end
    subgraph EXT["Externo (nube de terceros)"]
        direction LR
        subgraph SUPA["Supabase — FUENTE DE VERDAD"]
            SDB[("BD negocio<br/>contacts, campaigns,<br/>payments, message_log")]
            SOUT[("n8n_events<br/>outbox + pg_net")]
            SEDGE["Edge Function<br/>pago-webhook"]
        end
        WA["WhatsApp / Meta"]
        IA["IA / LLM (OpenAI)"]
        PAY["Pasarela de pagos<br/>(Wompi)"]
    end

    APP <-->|"lee/escribe"| SDB
    SOUT -->|"webhook: POST evento<br/>(X-Toque-Signature)"| N8N
    N8N -->|"rol n8n_worker<br/>Postgres directo<br/>(minimos privilegios)"| SDB
    N8N --> IA
    N8N -->|"envio (APAGADO)"| EVO
    EVO <--> WA
    N8N --- PG
    PAY --> SEDGE
    SEDGE --> SDB

    style HOST fill:#eaf0e4,stroke:#7c8a6f
    style VPS fill:#d8e6cd,stroke:#7c8a6f
    style EXT fill:#eef1f5,stroke:#8b9aa8
    style SUPA fill:#fff,stroke:#3ecf8e
```

> Plataforma Toque = frontend **HTML** en Hostinger (misma cuenta del VPS). Fuente de verdad = **Supabase** (BD + API + Auth). **Contrato con n8n:** la plataforma encola en el outbox `n8n_events` y un **Database Webhook (pg_net)** dispara el **receptor** de n8n; n8n lee/escribe con el rol **`n8n_worker`** (mínimos privilegios, Postgres directo, sin DELETE). Los pagos entran por la **Edge Function `pago-webhook`** (Wompi). **Envíos WhatsApp apagados** hasta el go-live.

## Las 3 reglas de oro
1. **La plataforma es dueña de los datos.** La BD de Toque es la única fuente de verdad; ni n8n ni un Sheet guardan el estado del negocio.
2. **n8n es un worker sin estado.** Solo integra y ejecuta (WhatsApp, IA, crons, envíos). La plataforma lo dispara; él reporta de vuelta.
3. **Se hablan por un contrato.** API + webhooks entre plataforma y n8n. Nada de bases compartidas ni lógica duplicada.

## Notas
- **Escala:** el mismo motor de n8n sirve a todos los clientes de Toque. Sumar un cliente = configurarlo en la plataforma, no rehacer flujos.
- **Estado (2026-07-09):** Bejauha **migrado a Supabase** (Sheet cerrado). Admin, inbound, campañas, pago fallido y recordatorio corren sobre Supabase vía rol **`n8n_worker` (mínimos privilegios, Postgres directo, `maxConnections=4`)**. **Campañas programadas** con Opción A (plataforma agenda y dispara a la hora; n8n envía al recibir + candado de frescura de 2h). **Sandbox** (`test:true` → `test_messages`) con ruteo por rol cliente/admin. **Envíos WhatsApp apagados** hasta el go-live. Detalle técnico: [contrato-n8n.md](contrato-n8n.md) · estado: [estado-mvp.md](estado-mvp.md).
