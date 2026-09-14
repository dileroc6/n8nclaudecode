# ToqueFlow — Plataforma

Frontend HTML/JS custom (sin CMS) en Hostinger + backend en **Supabase** (BD + Auth + Edge Functions). Es la **plataforma Toque**, producto multi-cliente; el motor de automatización vive aparte en **n8n** y se comunican por un contrato.

## Backend (Supabase) y contrato con n8n

- **Proyecto:** `https://pyoauvbwqxuuzamnjwfd.supabase.co` (ref `pyoauvbwqxuuzamnjwfd`). Multi-tenant por `company_id` (+`company_slug`).
- **Esquema:** `site/supabase/schema.sql` (plataforma) + `site/supabase/schema-negocio.sql` (tablas de negocio: contacts, campaigns, campaign_runs, message_log, payments, n8n_events + RLS + rol `n8n_worker` + outbox + trigger pg_net). Idempotentes.
- **Edge functions:** `site/supabase/functions/` (admin-users, vassco-retencion, rappi-print, pago-webhook). Deploy: `node deploy-edge-fn.cjs <slug>` (requiere `SUPABASE_ACCESS_TOKEN`).
- **n8n:** lee/escribe por **Postgres directo** con el rol `n8n_worker` (least-privilege); la plataforma lo dispara por el outbox `n8n_events` → Database Webhook → `webhook/toque-events`.
- **Contrato completo (tablas, eventos, payloads, auth):** ver **`../../ToqueFlow/arquitectura/contrato-n8n.md`**.
- **Modo prueba / sandbox** (probar flujos n8n sin WhatsApp real): ver **`../../ToqueFlow/arquitectura/modo-prueba-sandbox.md`**.

### Páginas del panel del cliente (tool pages, self-contained, RLS por member)
- `site/dashboard.html` — cards de flows (desde tabla `flows`; `tool_url` abre la herramienta).
- `site/contactos.html` — Base de datos: ver/filtrar/**agregar/editar/importar** contactos (sin borrar). Card "Base de datos".
- `site/campanas.html` — Campañas: segmentación por lista, mensaje, cantidad/lote, repetición, **programar** (`programado_para`), ver destinatarios, resultados (`campaign_runs`), eliminar, **checkbox modo prueba**.
- `site/pedidos.html` — Pedidos y pagos: lo que el agente armó y espera confirmación, y los pagos que alguien dijo que hizo. **Antes de confirmar avisa qué cambió** desde que se armó: lo que ya no alcanza, lo que subió de precio, lo que desapareció del catálogo.
- `site/modo-prueba.html` — sandbox con **3 pestañas** (Cliente / Admin / Campañas) que filtran `test_messages` por `flow`; emite `mensaje_prueba` (rol) y `pago_fallido` test; utils: reiniciar saldo, simular pago fallido, borrar historial. Hash `#campana` abre esa pestaña.
Deploy de estas páginas = el deploy del sitio (abajo). Tono: español neutro (Colombia).
- **Credenciales:** todas en `credentials.env` (gitignored): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, y para deploys `SUPABASE_ACCESS_TOKEN`. Secretos varios en `*.local.txt` / `*.local.sql` (gitignored). Correr SQL: `NODE_PATH=$(pwd)/node_modules node <script>` (pg con `npm i pg --no-save`).

## El banco de pruebas — correrlo ANTES de dar algo por bueno

```
node pruebas/todo.cjs              ← las 30, seguridad primero  (~7 min)
node pruebas/todo.cjs --con-ia     ← también las de conversación (~$0,10 USD)
node pruebas/aplicar.cjs schema-<tema>.sql
```

Hay **un solo workflow de n8n para todos los clientes**, así que un cambio malo
los rompe a todos a la vez. Ese es todo el argumento.

| Carpeta | Qué contesta |
|---|---|
| `pruebas/seguridad/` | ¿alguien puede ver o hacer algo que no debe? |
| `pruebas/calidad/` | ¿funciona, y se ve como debe? |

**Tres reglas que se ganaron a golpes:**

- Que una función pase en la base **no dice que la herramienta funcione**: entre
  las dos están la firma, el nodo que arma el jsonb y el de Postgres. Por eso
  `tools-por-webhook.cjs` las llama **por su webhook**, como el agente.
- Un escenario que prueba una acción tiene que exigir **el hecho en la base**,
  no palabras. «Listo, queda anotado tu pedido» pasaba en verde con cero pedidos
  creados.
- Las pantallas se prueban **con sesión real y RLS puesto**, y montando **dos**
  empresas: «no ve lo del otro» no se puede comprobar con un solo cliente.

## Sitio web (frontend)

Sitio HTML + CSS + JS custom (sin CMS). Deploy estático en Hostinger.

## Deploy

```
Dominio: toqueflow.com
Herramienta: deployStaticWebsite (Hostinger MCP)
Archivos: site/
```

Para hacer deploy, zipar el contenido de `site/` y usar `deployStaticWebsite` con el dominio de arriba.

**Importante al zipar:** EXCLUIR `site/supabase/` (schema, edge functions y `*.local.sql` con secretos), `node_modules/` y `dist/` — no deben publicarse en la web. El zip debe tener los archivos en la raíz (ej. `index.html` en el root del zip). Ejemplo:
`cd site && zip -rq /ruta/sitio.zip . -x 'supabase/*' -x 'node_modules/*' -x 'dist/*' -x '*.local.sql'`
Luego: `node mcp-deploy.cjs toqueflow.com /ruta/sitio.zip` (requiere `.mcp.json` con el token de Hostinger).

## Archivos del sitio

```
site/
├── ToqueFlow Home.html   ← homepage (index)
├── servicios.html
├── agentes-virtuales.html
├── seguimiento-leads.html
├── automatizacion.html
├── nosotros.html
├── contacto.html
├── blog.html
├── post-individual.html
└── assets/
    ├── logo-*.png
    ├── responsive.css
    └── mobile-menu.js
```

## Stack

- HTML + CSS + JS puro (sin framework, sin CMS)
- Tema oscuro: `#010101` base
- Colores: violet `#8b5cf6` / cyan `#06b6d4`
- Fuentes: Space Grotesk + Space Mono (Google Fonts)
- Imágenes de blog: Unsplash CDN

## Contexto completo

Ver `CONTEXT.md` para sistema de diseño detallado.
