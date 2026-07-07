# Bejauha — Yoga & Bienestar · Agentes WhatsApp IA

> **Única Fuente de Verdad (SSOT)** del proyecto. Toda decisión de
> arquitectura, credencial teórica, estado de datos y regla de negocio se
> documenta aquí. Si algo cambia en el código o la infraestructura, se
> actualiza este archivo primero.
>
> Estado: **Sprint 1 — cimientos.** Falta información que el cliente irá
> entregando; las secciones marcadas con ⏳ están pendientes.

---

## 1. Qué es Bejauha (resumen del Punto 3 del documento)

Bejauha es un **producto/comunidad digital de yoga y bienestar integral**.
Su identidad gira en torno a tres ejes: **bienestar · comunidad · digital**
(simbolizados por los 7 chakras de su marca). Ofrece clases **online** y
**presenciales** — incluida una clase recurrente el **domingo en el parque**.

### El problema central (Punto 3)
- Existe una **base de 1.300 contactos dormidos** que ya conocen la marca.
- Hoy se contactan **~10 personas/semana de forma manual** → recorrer la
  base completa una sola vez tomaría ~4 meses.
- No hay automatización: cada conversación depende de tiempo humano.

### La oportunidad
Activar esa base con agentes conversacionales que **hablan como Bejauha**
(cálido, conocedor, cercano — "no suena a bot, suena a Bejauha"), califican
el interés y escalan a un humano solo cuando hay intención real. Es el
servicio de **mayor ROI inmediato**: el dinero ya está en la base, falta el
sistema para desbloquearlo.

### Tono de marca (regla transversal para los 3 agentes)
En 3 palabras (cliente): **Amistoso · Cercano · Honesto**. Comunidad de
bienestar, no tienda. Guía completa (con ejemplos reales) en
[`prompts/_tono-bejauha.md`](prompts/_tono-bejauha.md): saludo "Holaa [Nombre]!",
emojis suaves ✨🤍💛🌿, empatía de bienestar, cierre con abracito, sin presión.
**Prohibido:** lenguaje mega formal/rebuscado, decir "chicos", tono corporativo
(salvo con empresas). **Nunca inventar apodos**; usar el primer nombre real.

### Reglas de calificación (Punto 3)
El agente recoge: interés en yoga · modalidad (online/presencial/ambas) ·
frecuencia disponible · experiencia previa · disposición a pagar. Con eso
clasifica en **Frío / Tibio / Caliente**.

### Catálogo operativo (levantamiento — mayo 2026)

> Fuente de verdad de la base de conocimiento del agente. Se codificará en
> `database/002_seed_kb.sql`.

**Servicios**
1. **Membresía Bejauha** (Hotmart) — digital, *en construcción*. Incluirá biblioteca de clases grabadas, material descargable y grupo privado de WhatsApp.
2. **Clases presenciales dominicales** — Parque El Country. 1h40: primera mitad funcional/pilates, segunda mitad yoga.
3. **Clases virtuales en vivo** (Hotmart) — yoga y meditación; grabaciones disponibles después.
4. **Eventos mensuales** — experiencias presenciales con temática especial.
5. **Bienestar corporativo** — clases para equipos, presencial o virtual.

**Horarios — virtuales en vivo**

| Día | Hora | Clase | Instructor |
|-----|------|-------|-----------|
| Lun | 8:30 pm | Yoga | Amy (Amanda) |
| Mar | 5:30 am | Yoga | Amy |
| Mar | 8:00 pm | Meditación | María Elvira |
| Mié | 8:30 pm | Yoga | Amy |
| Jue | 8:30 pm | Yoga | María Elvira |
| Vie | 5:30 am | Yoga | Amy |

**Presencial:** Dom 8:30 am — *Domingo de Bienestar* (funcional + yoga), Parque El Country.

**Precios y productos (COP)**

| Producto | Precio | ¿Saldo? (Agente 2) |
|----------|--------|---------------------|
| Paquete 4 clases presenciales | $92.000 (vence 2 meses) | **sí** (`presencial`) |
| Paquete 8 clases presenciales | $170.000 (vence 3 meses, con pausa) | **sí** (`presencial`) |
| Clase suelta presencial | $40.000 | **sí** · cuenta 1 (`presencial`) |
| Clase suelta virtual | $35.000 | **no** — se paga en la **web** |
| Virtual / Membresía básica | $79.900/mes | **no** — virtuales ilimitadas (pasarela) |
| Membresía Bejauha | $160.000/mes | **no** — ilimitado: virtual + presencial + cursos + eventos + descuentos (pasarela) |

> **Qué gestiona el Agente 2: SOLO lo presencial** (paquetes 4/8 y clase suelta
> presencial). Todo lo **virtual y las membresías se pagan por la web/pasarela**
> y NO pasan por el agente. En la práctica el `tipo` de saldo es siempre
> `presencial`; `virtual`/`membresia` quedan reservados pero sin uso real.

Sin estructura fija de descuentos/grupos (según promociones vigentes).

**Pagos:** Nequi · DaviPlata · Llave · Nu. (Sin pasarela web aún.)

**Equipo / instructores:** Amanda ("Amy"), Pablo, María Elvira, Juliana (apoyo ocasional domingos).

**Contacto y canales**
- WhatsApp Business principal (recibe leads calientes): **312 2011349** — ⏳ confirmar verificación como cuenta de negocio.
- Correo: **camilasuarez@bejauha.com** · Dominio deseado: **bejauha** (Fase sitio web).
- IG **@bejauha** · TikTok **@bejauhacomunidad**.

> **Alcance confirmado (2026-05-22): 3 agentes.**
> 1. **Filtrado / Prospección** (outbound, base 1.300).
> 2. **Admin / Control de Clases** (saldos, recargas, avisos) — prioridad día 1.
> 3. **Atención / Inbound Nurturing** (reactivo, FAQ, handoff).
>
> **Email marketing → fuera de alcance de este proyecto.**

---

## 2. Arquitectura e infraestructura

| Capa | Tecnología | Detalle |
|------|------------|---------|
| Servidor | **VPS Hostinger** | Gestionado con **Docker** |
| Automatización | **n8n** | `https://n8n.srv1398596.hstgr.cloud/` (Docker) |
| Canal WhatsApp | **Evolution API** | `https://evolution.srv1398596.hstgr.cloud` · instancia `dev-router` (prueba, compartida con Savia) hasta tener número oficial |
| Base de datos | **PostgreSQL 15** | Contenedor `evolution_postgres` · DB compartida `leadai` · **esquema independiente `bejauha`** (owner `leadai_user`, igual que savia/zoe/luxe_smile) |
| LLM | GPT-4o / Claude Sonnet | Clasificación + conversación (credenciales de Savia, en env vars de n8n) |

> **Fuera de alcance de este proyecto:** email marketing. Los leads
> frío/tibio quedan registrados en la BD para seguimiento futuro, sin
> automatización de correo en este Sprint.

> **Restricción crítica:** toda la persistencia de Bejauha vive en el
> esquema `bejauha`. Nunca escribir en `public` ni en esquemas de otros
> clientes (`savia`, `zoe`, …).

> **Timezone:** el container n8n corre en **Europe/Berlin**. Todo workflow
> con cron DEBE fijar `settings.timezone = "America/Bogota"` o disparará
> horas antes de lo esperado.

### Estructura de directorios

```
Bejauha/
├── claude.md              # ← este archivo (SSOT)
├── .env.example           # plantilla de variables (sin secretos)
├── .gitignore
├── .mcp.json              # servidor MCP de n8n (compartido)
├── workflows/             # JSONs de n8n (espejo de lo creado en la instancia)
│   ├── README.md
│   ├── wf00-orquestador.json          # router de entrada
│   ├── wf02-agente-admin-clases.json  # Agente 2
│   ├── wf02-agente-admin-clases.spec.md
│   └── wf03-agente-inbound-nurturing.json  # Agente 3
├── database/              # scripts SQL del esquema independiente
│   ├── 001_schema.sql     # leads, lotes, logs, handoffs, contactos
│   ├── 002_kb.sql         # base de conocimiento (catálogo) — Agente 3
│   └── 003_saldos_clases.sql # saldos, recargas, asistencias — Agente 2
├── prompts/               # System Prompts de los agentes (markdown)
│   ├── _tono-bejauha.md   # guía de tono compartida
│   ├── agente1-filtrado-prospeccion.md
│   ├── agente2-admin-control-clases.md
│   └── agente3-inbound-nurturing.md
├── config/                # mapa de configuración/credenciales
│   └── README.md
└── docs/                  # diagramas y documentación de apoyo
    ├── diagramas-flujo.md          # flujos Mermaid de los agentes
    ├── preguntas-pendientes.md     # preguntas para reunión con cliente
    └── pendientes-consolidado.md   # tablero único de seguimiento
```

---

## 3. Los tres agentes

> **Nombres (2026-05-27):** Orquestador = **RECEPCIÓN** · Agente 1 (outbound) =
> **PROSPECCIÓN** · Agente 2 (admin clases) = **CLASES** · Agente 3 (atención) =
> **ATENCIÓN** · WF04 (cron) = **RECORDATORIOS**.

### Orquestador (WF00) — router de entrada
**Creado en n8n** `rD794jC4vc9C1Ke7` ·
[`workflows/wf00-orquestador.json`](workflows/wf00-orquestador.json) · webhook
`bejauha-wa`. Recibe el webhook de Evolution (línea principal), normaliza el
payload, detecta si el remitente es admin (lista `ADMINS` en el nodo "Detectar
rol" — ⏳ poner números de Cami/Amanda/Isa) y llama vía `executeWorkflow` al
Agente 2 (admin) o Agente 3 (cliente). Los sub-workflows reciben por su
`Trigger sub-workflow` (executeWorkflowTrigger), además de su webhook propio
para pruebas aisladas.
> Setup producción: Bejauha tendrá su **propia instancia Evolution** (nº
> 312 2011349) cuyo webhook apunta directo a `…/webhook/bejauha-wa`.
> **Pruebas en dev-router (compartido):** un workflow compartido **"WA Router -
> Dev Multi-Proyecto"** (`IxpEmIZCHPPp4sC7`, webhook `wa-router`) reparte por
> **prefijo = primera palabra del mensaje**. Bejauha usa **`BEJA`** → se escribe
> p.ej. `BEJA Camila vino a clase` y el router lo reenvía a `bejauha-wa` (sin el
> prefijo). En producción no hay router.
> Idempotencia ✅: nodo "Idempotencia" (tabla `mensajes_recibidos`, dedup por
> `message_id`) — un reenvío de Evolution no se procesa dos veces.


### Agente 1 — Filtrado y Prospección (Outbound)
**Proactivo.** Reactiva la base de 1.300 contactos.

1. Toma un **lote de ~20 leads/día** (`estado_outbound = 'pendiente'`)
   del esquema `bejauha`, con **warm-up** progresivo (5/día → 10/día → 20/día).
2. Les envía un mensaje vía Evolution API, con copy rotado (3-4 variantes) e
   intervalos aleatorios (2-5 min) dentro de horario hábil Bogotá.
3. Clasifica la respuesta en **[Frío | Tibio | Caliente]**.
4. **Caliente** → crea `handoff` y **alerta inmediata** al WhatsApp principal
   (312 2011349). **Frío / Tibio** → permanece en la BD para seguimiento futuro.

→ Prompt: [`prompts/agente1-filtrado-prospeccion.md`](prompts/agente1-filtrado-prospeccion.md)
→ Workflow: `workflows/wf01-agente-filtrado-outbound.json` ⏳

### Agente 2 — Admin / Control de Clases  *(confirmado — prioridad)*
> **2026-05-25 (aclaración):** los **paquetes de clases SÍ se mantienen** (el
> agente admin los recarga); las **membresías** son un producto **aparte** que
> va por la **pasarela de pagos** (no las maneja este agente). Agente 2 activo.

**Operado por admins** (Cami, Amanda, Isa) sobre el número de Bejauha.
Gestiona el saldo de clases de cada cliente vía WhatsApp.

**Paquetes y vencimientos:**
- Paquete **4 clases → vence en 2 meses**.
- Paquete **8 clases → vence en 3 meses** (con opción de pausa).
- El reloj de vencimiento arranca en la **fecha de recarga** (`vence_at`).

**Recordatorios al cliente:**
- **2 semanas antes** de que caduque el paquete (vía cron — WF04).
- Cuando queda **1 clase** pendiente (al descontar asistencia — en WF02).

1. El admin reporta asistencia ("Juanito asistió") → **descuenta 1 clase**.
2. El admin recarga ("Juanito pagó 8 clases") → **suma al saldo**.
3. Avisa **automáticamente** al cliente cuando le queda **1 clase** y cuando
   llega a **0** (con opción de renovar: 4=$92.000 / 8=$170.000).
4. Sin listas de espera. Identifica al cliente por nombre + celular.

→ Prompt: [`prompts/agente2-admin-control-clases.md`](prompts/agente2-admin-control-clases.md)
→ Workflow: **creado en n8n** `sILA5Co9FD3JI5eJ` (inactivo, v1) ·
  [`workflows/wf02-agente-admin-clases.json`](workflows/wf02-agente-admin-clases.json) ·
  webhook `bejauha-admin-clases` · creds transversales (Postgres `vzzTNppBFKg9XCiK`,
  OpenAI `C6ueSke246Slwxww`, Evolution por `$env`) · instancia `dev-router` para prueba.
→ Tablas `saldos_clases` / `asistencias` / `recargas` ✅ creadas (003).
→ Recordatorio de vencimiento: **WF04** `SRCYX5c8qImyTYt9` (cron diario 9am,
  tz Bogotá), avisa 2 semanas antes de caducar a quien tenga clases sin usar.
→ **Contexto:** paquetes son transitorios (~11 clientes hoy); migrarán a
  suscripciones (membresía vía pasarela, producto aparte).
→ **v1 — falta probar en dev-router** (ver `wf02-...spec.md`). Limitación v1: el
  cliente debe existir en `bejauha.leads` (match por nombre ILIKE).

### Agente 3 — Atención / Inbound Nurturing (Inbound)
**Reactivo.** Atiende a quien escribe orgánicamente.

1. Responde dudas con la base de conocimiento (catálogo §1: precios, horarios).
2. Nutre con información de valor cuando la intención es media/baja.
3. Si detecta **alta intención (Caliente)** → **traspaso al asesor humano**.

→ Prompt: [`prompts/agente3-inbound-nurturing.md`](prompts/agente3-inbound-nurturing.md)
→ Workflow: **creado en n8n** `rctOPl2BpQ4UVjEk` (inactivo, v1) ·
  [`workflows/wf03-agente-inbound-nurturing.json`](workflows/wf03-agente-inbound-nurturing.json) ·
  webhook `bejauha-inbound` · lee la KB (`knowledge_base`), responde con tono real,
  clasifica y crea `handoff` si caliente · mismas creds transversales.
→ **Probado ✅.** El handoff crea la fila `handoffs`, marca `asignado_humano` y
  **alerta al asesor por WhatsApp** (nº del cliente + resumen). Nº asesor = constante
  `ASESOR` en WF03 (hoy el del usuario; cambiar al real en producción).
→ **Memoria de conversación:** carga los últimos 6 mensajes de `mensajes_logs`
  y los pasa al LLM como turnos previos (respuestas con contexto).
→ Robustez: `retryOnFail` (3 intentos) en nodos Postgres y OpenAI de WF02 y WF03.

---

## 4. Modelo de datos — esquema `bejauha`

Scripts ejecutados en `leadai` ✅: [`001_schema.sql`](database/001_schema.sql),
[`002_kb.sql`](database/002_kb.sql), [`003_saldos_clases.sql`](database/003_saldos_clases.sql),
[`005_idempotencia.sql`](database/005_idempotencia.sql) (+ `004_seed_pruebas.sql` con datos de prueba).
**9 tablas** en el esquema `bejauha` (las 8 + `mensajes_recibidos` para idempotencia).

> **CRM (006 + importador) — para cargar la base real de 2.033 contactos:**
> [`006_crm_migracion.sql`](database/006_crm_migracion.sql) hace `leads` un CRM
> completo (PK `id`, `telefono` UNIQUE *nullable*, + columnas `instagram`, `canal`,
> `tipificacion`, `estado_be`, `paquete`, `prx_contacto`, `ultimo_pago`).
> [`scripts/importar_seguimiento.py`](scripts/importar_seguimiento.py) genera el SQL
> de carga desde el CSV (normaliza tel→E.164, mapea Estado→origen/clasificación,
> siembra `saldos_clases` del Grupo 1). **Canal:** ~1.235 son solo Instagram (no
> alcanzables por WhatsApp/Evolution) · ~537 WhatsApp. **Instagram: sin
> automatización por ahora** (se cargan como CRM; el cliente definirá cómo seguir).

| Tabla | Script | Propósito |
|-------|--------|-----------|
| `leads` | 001 | Identidad del lead (PK = teléfono E.164). Clasificación, scoring, calificación. |
| `lotes_outbound` | 001 | Control idempotente de los lotes diarios del Agente 1 + métricas. |
| `mensajes_logs` | 001 | Log conversacional append-only (in/out, por agente). |
| `handoffs` | 001 | Traspasos a asesor humano (dispara alerta). |
| `contactos_dia` | 001 | Contador de contactos únicos/día (rate-limit + métricas). |
| `knowledge_base` | 002 | Catálogo (servicios, precios, horarios, FAQ) que alimenta al Agente 3. |
| `saldos_clases` | 003 | Saldo vigente por cliente y tipo (Agente 2). |
| `recargas` | 003 | Log de paquetes/membresías compradas (Agente 2). |
| `asistencias` | 003 | Log de clases consumidas (Agente 2). |

### Estados de los leads (reglas de negocio)

**`clasificacion`** (temperatura — gobierna el ruteo):

| Valor | Significado | Destino |
|-------|-------------|---------|
| `caliente` | Intención de compra/decisión inmediata | Handoff a humano + alerta |
| `tibio` | Interés real sin urgencia | BD → seguimiento futuro |
| `frio` | Solo curiosidad | BD → seguimiento futuro |

**`estado_outbound`** (ciclo del Agente 1):
`pendiente → en_lote → enviado → respondido` (o `sin_respuesta` / `descartado`).

**`origen`**: `outbound` (base 1.300) · `inbound` (orgánico) · `import` (carga inicial).

---

## 5. Credenciales necesarias (teóricas)

Ver [`.env.example`](.env.example) para la plantilla completa. Resumen:

| Grupo | Variables | Estado |
|-------|-----------|--------|
| Evolution API | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_BEJAUHA` (única línea: la principal **312 2011349**, compartida por los 3 agentes — decisión cliente 2026-05-28) | Reusa Savia (env vars n8n) · `dev-router` por ahora · falta verificar/conectar la principal |
| WhatsApp Business | `BEJAUHA_WHATSAPP_BUSINESS`, `BEJAUHA_ASESOR_PHONES` | Nº principal **312 2011349** (recibe calientes); admins Cami/Amanda/Isa en números distintos · ⏳ confirmar verificación |
| PostgreSQL | credencial n8n compartida `PostgreSQL — LeadAI` (`vzzTNppBFKg9XCiK`) | ✅ esquema `bejauha` creado (9 tablas) |
| LLM | OpenAI `openAiApi` "OpenAi account" (genérica) | ✅ usada en WF02/WF03 |
| Evolution | sin credencial — `$env.EVOLUTION_API_URL` + `$env.EVOLUTION_API_KEY` | ✅ patrón de Savia |

---

## 6. Convenciones del proyecto

- **Nombres en n8n:** `Bejauha - [Función]`.
- **Tags en n8n:** por cliente (`bejauha`) y por tipo de workflow.
- **Error handling:** `Error Trigger` + notificación en cada workflow.
- **Postgres en n8n:** pre-formatear `NULL` en nodos Code (evitar gotchas de
  `queryReplacement` que convierten `null` en el string `"null"`).
- **Sandbox n8n:** `require('crypto')` y `globalThis.crypto.subtle` están
  bloqueados; implementar hashing con `Buffer` + bitwise si hace falta.
- **Anti-baneo (Evolution API = no oficial):** no hay plantillas Meta; el
  baneo lo decide el antispam de WhatsApp y depende de la **tasa de
  bloqueo/reporte**, no del volumen. Reglas: warm-up progresivo (5→10→20/día),
  copy rotado, intervalos aleatorios 2-5 min, solo horario hábil Bogotá,
  primer mensaje que identifique a Bejauha + opt-out fácil. Respetar siempre
  `opt_out_marketing`.
- **⚠️ Riesgo concentrado por línea única (decisión cliente 2026-05-28):** el
  cliente decidió usar **la misma línea para los 3 agentes** (la principal
  312 2011349, no habrá línea dedicada para PROSPECCIÓN). Un baneo tumba TODO
  (PROSPECCIÓN + CLASES + ATENCIÓN). Mitigación obligatoria: warm-up real
  (arrancar PROSPECCIÓN con ≤5/día, no 20), Habeas Data confirmado antes de
  tocar al Grupo 3 frío, y `opt_out_marketing` honrado a rajatabla.

---

## 7. Estado del proyecto

### Hecho (al 2026-05-26)
- [x] Estructura del proyecto + SSOT + `.env.example`, `.gitignore`, `.mcp.json`.
- [x] Alcance: **3 agentes + orquestador + cron de recordatorios**.
- [x] Líneas: **una sola línea para los 3 agentes** — la principal **312 2011349** (decisión cliente 2026-05-28, revierte la idea previa de línea dedicada para PROSPECCIÓN).
- [x] Base de datos: **9 tablas** en `bejauha` (001+002+003+005), catálogo en `knowledge_base`.
- [x] 3 prompts con tono real + guía compartida `_tono-bejauha.md`.
- [x] Diagramas de flujo (Mermaid) actualizados — `docs/diagramas-flujo.md`.
- [x] **Workflows en n8n (todos v1, inactivos):** Orquestador `rD794jC4vc9C1Ke7`,
      Agente 2 `sILA5Co9FD3JI5eJ`, Agente 3 `rctOPl2BpQ4UVjEk`, WF04 `SRCYX5c8qImyTYt9`.
- [x] **PROBADOS en vivo (2026-05-25/26):** Agente 2 (asistencia/recarga+vence/consulta/
      Mensaje 1/homónimos), Agente 3 (info+handoff), Orquestador (ruteo + idempotencia),
      WF04 (cron envía recordatorio). dev-router conectado → envía WhatsApp real.
- [x] Robustez: `retryOnFail` (PG/OpenAI), `onError: continueRegularOutput` (envíos
      Evolution), idempotencia por `message_id`, desambiguación de homónimos,
      memoria de conversación en Agente 3.

### Pendiente
Tablero único en [`docs/pendientes-consolidado.md`](docs/pendientes-consolidado.md).
Lo crítico (del cliente): **oferta para los 1.300** (P20) + **export + habeas data**,
**link de renovación** real, **número/webhook de producción** en Evolution. Nuestro:
**construir el Agente 1** (espera la oferta) y el **push de alerta al asesor** en handoff.
