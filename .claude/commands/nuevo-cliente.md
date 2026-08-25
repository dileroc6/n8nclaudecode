---
description: Da de alta un cliente nuevo en la plataforma ToqueFlow — empresa, usuario y flows en Supabase, más su carpeta de trabajo en el repo
argument-hint: [Nombre del cliente]
---

Vas a dar de alta un cliente nuevo en **ToqueFlow**, la plataforma de automatizaciones.

Cliente solicitado: **$ARGUMENTS**
(Si viene vacío, pregúntalo antes de continuar.)

---

## Cómo funciona ToqueFlow (léelo antes de tocar nada)

Un cliente nuevo **no** es un esquema de Postgres ni una instalación aparte. Es una fila en
Supabase. Las tres reglas de oro:

1. **La plataforma es dueña de los datos.** Supabase es la única fuente de verdad, multi-tenant
   por `company_id` con RLS. Nada de bases por cliente.
2. **n8n es un worker sin estado.** Solo integra y ejecuta. La plataforma lo dispara por el
   outbox `n8n_events` → Database Webhook → receptor `toque-events`.
3. **Se hablan por un contrato.** Ver `Websites/toqueflow/_docs/contrato-n8n.md`.

El patrón de referencia es **Bejauha**, el cliente más integrado. Ver
`Bejauha/docs/estado-mvp.md` (fuente única de verdad de su estado real).

⚠️ Los documentos que describen esquemas Postgres por cliente (`bejauha`, `leadai`,
contenedor `evolution_postgres`, `PG_SCHEMA`) pertenecen al **sistema viejo, obsoleto**.
No los uses como referencia.

---

## Paso 0 — Recoger lo esencial

Pregúntale al usuario (usa AskUserQuestion donde aplique) y **no inventes valores**:

1. **Nombre comercial** exacto y **slug** en minúsculas (ej. "Mi Marca" → `mi_marca`).
2. **Sector y ciudad** de operación.
3. **Correo y nombre** de la persona que va a entrar al portal.
4. **Qué automatizaciones** se van a construir, a grandes rasgos.
5. **¿Hay logo?** Si no, la card muestra las iniciales — es válido arrancar sin él.

Si falta un dato de negocio, márcalo como ⏳ pendiente y sigue. No bloquees por eso.

---

## Paso 1 — El seed de Supabase (esto es lo que da de alta al cliente)

Clona el seed más parecido de `Websites/toqueflow/` — `seed-savia.cjs` es el más simple,
`seed-bejauha.cjs` el más completo — y ajústalo:

```js
const COMPANY = { name: 'Nombre', slug: 'slug', city: 'Ciudad', logo_url: null };
const USER    = { email: '...', password: '...', name: '...' };
const FLOWS   = [
  { name: 'Agente de atención a cliente', type: 'chat', kind: 'agente',
    status: 'próximamente', desc: '...', channels: ['wa'],
    stats: [], spark: [], last: 'en preparación' },
];
```

Reglas del seed:

- Lee `credentials.env` y usa **solo** la `service_role`. Nunca hardcodear llaves.
- Es **idempotente**: re-correrlo refresca empresa, usuario y flows sin duplicar.
- Los flows arrancan en `status: 'próximamente'` con `tool_url: null` — solo la card,
  sin herramienta detrás, hasta que exista.
- El usuario se crea en Auth + `profiles` con `role: 'member'` y `status: 'active'`.

Correr:

```
node seed-<cliente>.cjs
```

Esto es **DATA**: no necesita deploy. El cliente ya puede entrar por `login.html`.

---

## Paso 2 — La carpeta de trabajo en el repo

Crea `<Nombre>/` en la raíz, con la estructura estándar:

```
<Nombre>/
├── CLAUDE.md          ← única fuente de verdad del cliente
├── .mcp.json          ← cópialo EXACTO de Bejauha/.mcp.json
├── .claude/settings.json
├── workflows/         ← los JSON de n8n
├── prompts/           ← prompts de los agentes + tono de marca
├── database/          ← migraciones SQL numeradas e idempotentes
└── docs/
```

- **`.mcp.json`**: copia literal de `Bejauha/.mcp.json`. Usa `npx` y toma la llave de
  `${N8N_API_KEY}`. **Nunca escribas una API key dentro del archivo.**
- **`.claude/settings.json`**: replica el de `Savia/`. Rutas relativas, sin secretos.
- **`CLAUDE.md`**: esqueleto propio del cliente — qué es el negocio, qué automatizaciones,
  reglas de negocio y tono, estado y pendientes. No copies contenido de otro cliente.

---

## Paso 3 — Si el cliente va a tener herramienta propia en el portal

Solo si en el Paso 0 quedó claro que necesita una página (tipo `contactos.html`,
`campanas.html` o una herramienta a medida):

1. Crea la página en `Websites/toqueflow/site/`, autocontenida y con RLS por member.
2. Apunta el `tool_url` del flow correspondiente a esa página.
3. **Agrega la URL a la función `Test-Live` de `deploy-safe.ps1`.** Si no lo haces, el
   cliente ve un 404 y el deploy pasa en verde sin avisar.
4. Despliega — ahora sí — con el skill `deploy-toqueflow`.

---

## Paso 4 — Checklist manual para el usuario (NO la ejecutes tú)

1. **Verificar el acceso**: entrar a `toqueflow.com/login.html` con el correo y la
   contraseña temporal, y cambiarla.
2. **Crear los workflows en n8n** con la convención `[Cliente] - [Función]` y sus tags.
3. **Todo cron necesita `settings.timezone = "America/Bogota"`** — el contenedor de n8n
   corre en Europe/Berlin.
4. **Antes de encender envíos de WhatsApp**: probar en modo prueba (`test: true` →
   `test_messages`), luego un número propio, y solo entonces go-live con warm-up.

---

## Reporte final

Muestra el árbol de lo creado, confirma qué quedó en Supabase (empresa, usuario, flows)
y la checklist de pasos manuales. Sé conciso.
