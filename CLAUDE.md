# ToqueFlow

## Qué es

**ToqueFlow es una plataforma de soluciones de automatización, con o sin IA, para pequeñas y medianas empresas.**

No es una agencia que entrega workflows sueltos: es un **producto multi-cliente**. Cada empresa contrata automatizaciones (bots de WhatsApp, campañas, recordatorios, agentes con IA, integraciones) y las opera desde un **portal web** donde entra con su usuario y ve sus propios flujos, datos y resultados.

Este repositorio contiene **la plataforma, el portal y las automatizaciones de todos los clientes**.

---

## Arquitectura — las 3 reglas de oro

1. **La plataforma es dueña de los datos.** Supabase es la única fuente de verdad. Ni n8n ni una hoja de cálculo guardan el estado del negocio.
2. **n8n es un worker sin estado.** Solo integra y ejecuta (WhatsApp, IA, crons, envíos). La plataforma lo dispara; él reporta de vuelta.
3. **Se hablan por un contrato.** Outbox + webhooks entre plataforma y n8n. Nada de bases compartidas ni lógica duplicada.

```
Cliente (pyme) ──> Portal ToqueFlow (HTML en Hostinger)
                        │
                        ▼
                   Supabase  ← FUENTE DE VERDAD
                   (BD multi-tenant por company_id + Auth + RLS + Edge Functions)
                        │  outbox n8n_events → Database Webhook (pg_net)
                        ▼
                   n8n (VPS Hostinger, Docker)  ← worker
                        │  rol n8n_worker, Postgres directo, mínimos privilegios
                        ▼
              WhatsApp (Evolution) · IA/LLM · Pagos (Wompi) · Email
                        │
                        ▼
              Usuarios finales (los clientes de cada pyme)
```

**Escala:** sumar un cliente = configurarlo en la plataforma, no rehacer flujos.

Detalle: [arquitectura](ToqueFlow/arquitectura/arquitectura-toque.md) · [contrato n8n](ToqueFlow/arquitectura/contrato-n8n.md) · [modo prueba](ToqueFlow/arquitectura/modo-prueba-sandbox.md)

## Crecimiento

Cómo consigue clientes ToqueFlow: [captacion-leads.md](ToqueFlow/estrategia/captacion-leads.md) — ICP por vertical, escalera de oferta, máquina outbound sobre Google Maps y plan de implementación por fases.

---

## Estructura del repositorio

```
toque-flow/
├── ToqueFlow/            # ★ TODO LO QUE ES TOQUEFLOW
│   ├── TABLERO.md        #   estado vivo de las tareas — empezar por aquí
│   ├── estrategia/       #   captación de clientes
│   ├── arquitectura/     #   las 3 reglas de oro, contrato n8n, sandbox (CANÓNICO)
│   ├── workflows/        #   los n8n de la máquina de leads
│   ├── prompts/          #   scoring y correos outbound
│   └── plataforma/       #   ★ EL CÓDIGO: sitio público + portal + Supabase + deploy
│       ├── site/         #     frontend (público y panel del cliente)
│       ├── site/supabase/#     schema, RLS, edge functions (NO se publica)
│       └── _docs/        #     docs del sitio: deploy, Cloudflare R2
│
├── Bejauha/              # ★ CLIENTE DE REFERENCIA (el más integrado) — ver abajo
├── FerreteríaYa/         # catálogo, agentes e impresión Rappi
├── Savia/                # workflows n8n + BD + prompts
├── Zoe/                  # backend spa + propuesta comercial
├── LuxeSmile/            # clínica dental: workflows, prompts, schemas
├── Vassco/               # contable: ingesta y retenciones (Edge Function)
├── ContentOps-Engine/    # motor de contenido/SEO (Ferretería Blog, Bigotes)
│
├── Websites/QDMP/        # sitio de cliente (estático)
├── Websites/insighta/    # sitio de cliente (estático)
│
├── n8n-mcp/              # vacío: el MCP corre por npx, ya no hace falta la carpeta
└── n8n-skills/           # los 7 skills de n8n (plugin de czlonkowski/n8n-skills)
```

Cada carpeta de cliente es autónoma: su propio `CLAUDE.md`, `.mcp.json`, `.env` y `.claude/settings.json`.

**Dentro de `ToqueFlow/`:** las carpetas de arriba son el negocio —qué vendes, a quién y cómo está diseñada la plataforma— y `plataforma/` es el código que corre en producción. `Websites/` quedó solo con sitios estáticos de clientes.

---

## El portal del cliente

Frontend HTML/CSS/JS puro (sin framework, sin CMS), desplegado estático en Hostinger sobre `toqueflow.com`. Auth y datos por Supabase, aislados por `company_id` con RLS.

| Página | Para qué |
|---|---|
| [login.html](ToqueFlow/plataforma/site/login.html) | entrada del cliente |
| [dashboard.html](ToqueFlow/plataforma/site/dashboard.html) | cards de sus flows (tabla `flows`; `tool_url` abre la herramienta) |
| [contactos.html](ToqueFlow/plataforma/site/contactos.html) | base de datos: ver, filtrar, agregar, editar, importar (sin borrar) |
| [campanas.html](ToqueFlow/plataforma/site/campanas.html) | segmentar, redactar, programar y medir campañas |
| [modo-prueba.html](ToqueFlow/plataforma/site/modo-prueba.html) | sandbox: probar flujos reales sin WhatsApp real |
| [admin.html](ToqueFlow/plataforma/site/admin.html) | administración (superadmin ToqueFlow) |

Guía de la plataforma: [ToqueFlow/plataforma/CLAUDE.md](ToqueFlow/plataforma/CLAUDE.md)

---

## Cliente de referencia: Bejauha

**Bejauha es el cliente más trabajado y el más integrado con el portal.** Cuando haya que decidir cómo hacer algo para un cliente nuevo, **mirar primero cómo se resolvió en Bejauha** — es el patrón vivo de la arquitectura.

Qué demuestra:

- **Migración completa a la plataforma:** el Google Sheet quedó cerrado; Supabase es la fuente de verdad.
- **Flujos en producción sobre el contrato:** agente admin (asistencia/recargas), bot inbound, campañas (`ejecutar_campana`), pago fallido (`pago_fallido`), recordatorio de última clase.
- **Sandbox real:** eventos con `test: true` corren el flujo real pero desvían la salida a `test_messages`, que el panel web lee como chat. Probar sin arriesgar el WhatsApp del cliente.
- **Seguridad por diseño:** rol `n8n_worker` con mínimos privilegios (sin DELETE, sin acceso a `auth`/`profiles`), candados en el outbound (exige `confirmar_envio`), nodos de envío apagados hasta el go-live.

Dónde mirar:

| Archivo | Qué es |
|---|---|
| [Bejauha/docs/estado-mvp.md](Bejauha/docs/estado-mvp.md) | **fuente única de verdad** del estado real |
| [ToqueFlow/arquitectura/contrato-n8n.md](ToqueFlow/arquitectura/contrato-n8n.md) | eventos, payloads, auth |
| [Bejauha/workflows/](Bejauha/workflows/) | los JSON de n8n |
| [Bejauha/prompts/](Bejauha/prompts/) | prompts de los agentes + tono de marca |
| [Bejauha/database/](Bejauha/database/) | migraciones SQL numeradas |

⚠ Ojo: `Bejauha/claude.md` y `docs/manual-admins*` describen el **sistema viejo de Postgres** y están obsoletos. No usarlos como referencia.

---

## Infraestructura compartida

### Supabase (backend de la plataforma)
- Proyecto `pyoauvbwqxuuzamnjwfd` — multi-tenant por `company_id` / `company_slug`.
- Esquemas idempotentes en `ToqueFlow/plataforma/site/supabase/`.
- Edge Functions: `admin-users`, `vassco-retencion`, `rappi-print`, `pago-webhook`.

### n8n (motor de automatización)
- Self-hosted en Hostinger, Docker: `https://n8n.srv1398596.hstgr.cloud/`
- Recibe eventos en el receptor `toque-events` (multi-tenant, valida `X-Toque-Signature`).
- Lee/escribe por Postgres directo con el rol `n8n_worker`.

### Servidor MCP de n8n
- Ruta: `n8n-mcp/` · entry point `n8n-mcp/dist/mcp/index.js`
- Requiere `N8N_API_URL` y `N8N_API_KEY`.
- Node en esta máquina (Windows): `C:\Program Files\nodejs\node.exe`

### Skills de n8n
- Ruta: `n8n-skills/` — 7 skills: Expression Syntax, MCP Tools Expert, Workflow Patterns, Validation Expert, Node Configuration, Code JavaScript, Code Python.

---

## Convenciones

- **Nombres de workflow:** `[Cliente] - [Función]` → ej. `Bejauha - Agente Admin`
- **Tags en n8n:** por cliente y por tipo de workflow
- **Un subdirectorio por cliente**, autónomo y con su propia configuración
- **Tono de cara al usuario:** español neutro (Colombia)

---

## Patrones de calidad

- Siempre incluir manejo de errores (`Error Trigger`)
- Credenciales por variables de entorno, **nunca hardcodeadas**
- Mínimos privilegios en BD: nada de `service_role` para el worker
- Todo flujo nuevo debe poder correr en **modo prueba** antes de tocar producción
- Envíos masivos: candado explícito (`confirmar_envio`) y warm-up anti-baneo
- Agregar logging para debugging
- Documentar cada workflow en el campo "Notes" de n8n
- Separar workflows complejos en sub-workflows reutilizables

---

## Estado del repo (2026-08-24)

Puntos a resolver, detectados al clonar en Windows:

1. **`n8n-mcp/` y `n8n-skills/` llegan vacíos.** Están commiteados como submódulos (gitlink, modo `160000`) pero **no hay `.gitmodules`**, así que git no sabe de dónde traerlos. Hay que registrar sus URLs o commitear el contenido.
2. **Los `.mcp.json` apuntan a rutas de Linux** (`/home/dileroc/...`) de la máquina anterior. No resuelven en Windows.
3. **Hay una `N8N_API_KEY` en texto plano dentro de los `.mcp.json` versionados.** Conviene rotarla y moverla a variables de entorno.
