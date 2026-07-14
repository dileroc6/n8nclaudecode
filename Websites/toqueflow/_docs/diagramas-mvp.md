# Bejauha — Diagramas de flujo del MVP

> Actualizado 2026-07-09. Fuente única de datos: **Supabase** (plataforma Toque). Envíos por **Evolution (WhatsApp)**.
>
> **Reparto:** lo que toca WhatsApp + IA + envíos → **n8n (worker sin estado)**. Interfaz, configuración, pagos, agendamiento y dashboards → **plataforma Toque**. Se comunican por un **contrato**: outbox `n8n_events` + webhook → receptor n8n, y n8n lee/escribe Supabase con el rol **`n8n_worker`** (mínimos privilegios). Detalle en [contrato-n8n.md](contrato-n8n.md).
>
> ⚠️ **Todos los envíos de WhatsApp están APAGADOS** (blindados) hasta el go-live controlado.

---

## Modelo de datos (resumen)

- **Tipos de servicio:** `karma` (sin pago / a reactivar) · `beja` (suscripción normal) · `uja` (premium, domingos permanentes) · `paquete` (único con saldo de clases + `fecha_renovacion` + estado deudor).
- **Solo `paquete`** descuenta clases (`clases_restantes`).
- **Estados:** activo · no_activo · prospecto · deudor (solo paquete) · embajador. **`lead_stage`:** cliente · caliente · tibio · frio.

---

## 0) Puente de eventos — cómo se comunican plataforma y n8n

```mermaid
flowchart LR
    subgraph PLAT["Plataforma Toque (Supabase)"]
        UI["Panel: campañas,<br/>chat de prueba, pagos"]
        OUT[("n8n_events<br/>(outbox)")]
        DBW["Database Webhook<br/>(pg_net)"]
        UI --> OUT --> DBW
    end
    subgraph N8N["n8n — worker sin estado"]
        RC["Receptor toque-events<br/>valida X-Toque-Signature"]
        H1["Handler ejecutar_campana"]
        H2["Handler pago_fallido"]
        H3["Handler mensaje_prueba"]
        RC -->|event=ejecutar_campana| H1
        RC -->|event=pago_fallido| H2
        RC -->|event=mensaje_prueba| H3
    end
    DB[("Supabase<br/>contacts, campaign_runs,<br/>message_log, test_messages")]
    DBW -->|POST envelope| RC
    H1 --> DB
    H2 --> DB
    H3 --> DB
    RC -.marca sent.-> OUT
    style PLAT fill:#efe4c6,stroke:#c9a24b
    style N8N fill:#e6efe0,stroke:#7c8a6f
```

---

## 1) Flujo PAQUETES — gestión de clases (agente admin)

```mermaid
flowchart TD
    DB[("Supabase · contacts")]
    subgraph N8N["n8n — Agente admin (WhatsApp)"]
        A["Admin escribe en el grupo<br/>(asistió / pagó / consulta)"] --> AG["Agente interpreta con IA"]
        AG --> AC{¿Qué acción?}
        AC -->|Asistencia PAQUETE| D1["Resta 1 clase"]
        AC -->|Pago Paquete| D3["Suma N clases"]
        AC -->|Consulta| D4["Lee el saldo"]
        AC -->|Beja / Uja / Karma| D2["No aplica (solo paquete)"]
        D1 --> RM{¿Queda 1 clase?}
        RM -->|Sí| AV["Avisa cliente + grupo<br/>(APAGADO)"]
    end
    AG <--> DB
    D1 --> DB
    D3 --> DB
    D4 --> DB
    style N8N fill:#e6efe0,stroke:#7c8a6f
    style DB fill:#fff,stroke:#8b9182
```

---

## 2) Flujo CAMPAÑAS — reactivación (`ejecutar_campana`, Opción A)

```mermaid
flowchart TD
    subgraph PLAT["Plataforma Toque"]
        CFG["Campaña parametrizable:<br/>filtros + mensaje + cantidad +<br/>batch_size + frecuencia"]
        SCH["Agenda: scheduled_at<br/>(hora Colombia -05:00)"]
        CFG --> SCH --> EV["Dispara evento<br/>a la hora exacta"]
    end
    subgraph N8N["n8n — Handler campañas"]
        EX["Extrae payload<br/>+ programado_para"]
        FR{"¿llegó >2h tarde?<br/>(candado de frescura)"}
        MK["Marca n8n_events=failed<br/>NO envía"]
        SEG["Segmenta contacts<br/>por filtros (fail-safe:<br/>sin filtros = nadie)"]
        LOT["Lotes de 5<br/>(anti-baneo)"]
        SND[["Envío WhatsApp<br/>APAGADO"]]
        CR["Registra campaign_runs"]
        EX --> FR
        FR -->|vencido| MK
        FR -->|vigente / inmediato| SEG
        SEG --> LOT --> SND
        SEG --> CR
    end
    EV --> EX
    style PLAT fill:#efe4c6,stroke:#c9a24b
    style N8N fill:#e6efe0,stroke:#7c8a6f
```

> **Opción A:** la plataforma es el reloj (agenda, calcula hora Colombia, dispara a la hora). n8n = "1 evento = 1 envío", sin Wait ni crons. **Frecuencia** (`una_vez`/`diaria`/`semanal`) = la plataforma re-emite un evento por ocurrencia. **Candado de frescura:** si `programado_para` llegó >2h tarde (n8n caído), no envía y marca el evento.

---

## 3) Flujo INBOUND — bot de dudas

```mermaid
flowchart TD
    subgraph INB["n8n — Inbound (bot de dudas)"]
        B1["Persona escribe al WhatsApp"] --> B2["Bot resuelve dudas de planes<br/>(karma/beja/uja/paquete)"]
        B2 --> B3{¿Interés real?}
        B3 -->|Sí| B4["Avisa al grupo admin<br/>+ sube lead_stage (APAGADO)"]
        B3 -->|No| B2
    end
    DB[("Supabase · contacts")]
    B2 <--> DB
    style INB fill:#e6efe0,stroke:#7c8a6f
    style DB fill:#fff,stroke:#8b9182
```

---

## 4) Flujo PAGO FALLIDO — deudor (`pago_fallido`)

```mermaid
flowchart TD
    subgraph PLAT["Plataforma Toque"]
        PW["Edge Function pago-webhook<br/>(Wompi) — pendiente deploy"]
        PE[("payments +<br/>evento pago_fallido")]
        PW --> PE
    end
    subgraph N8N["n8n — Handler pago"]
        PQ{"¿service_type<br/>= paquete?"}
        MD["Marca status=deudor<br/>+ avisa grupo (APAGADO)"]
        AVS["Solo avisa grupo<br/>(APAGADO)"]
        PQ -->|Sí| MD
        PQ -->|beja/uja/karma| AVS
    end
    PE --> PQ
    style PLAT fill:#efe4c6,stroke:#c9a24b
    style N8N fill:#e6efe0,stroke:#7c8a6f
```

---

## 5) SANDBOX — modo prueba (`test:true`, sin WhatsApp)

```mermaid
flowchart LR
    subgraph PLAT["Panel Toque"]
        CH["Chat de prueba<br/>(cliente / admin / campañas)"]
    end
    subgraph N8N["n8n — flujos REALES en modo test"]
        EVT["evento con test:true<br/>(rol: cliente|admin)"]
        FLOW["Corre el flujo real<br/>(inbound / gestión / campaña / deudor)"]
        EVT --> FLOW
    end
    TM[("test_messages")]
    CH --> EVT
    FLOW -->|escribe salida| TM
    TM -->|polling| CH
    FLOW -.->|NO Evolution<br/>NO datos reales*| X["🚫"]
    style PLAT fill:#efe4c6,stroke:#c9a24b
    style N8N fill:#e6efe0,stroke:#7c8a6f
    style TM fill:#fff,stroke:#8b9182
```

> \* La **única** escritura permitida en modo test es el saldo del **contacto de prueba** `+573000000001` (para ver recarga→consulta encadenadas). Cualquier contacto real se **simula sin escribir**.

---

### Notas

- **Reparto:** WhatsApp + IA + envíos → **n8n** (verde). Interfaz, configuración, pagos, **agendamiento** y dashboards → **plataforma Toque** (dorado). Contrato = outbox `n8n_events` + webhook al receptor; n8n escribe con rol `n8n_worker` (mínimos privilegios, sin DELETE).
- **Admin:** solo consultar, gestionar asistencias y cargar clases de **paquetes** (no crea leads).
- **Inbound:** resuelve dudas y avisa al grupo cuando hay interés real (no redirige a URL).
- **Envíos apagados:** todos los nodos de envío WhatsApp están físicamente desactivados hasta el go-live (encendido flujo por flujo + warm-up).
