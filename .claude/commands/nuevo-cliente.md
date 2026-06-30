---
description: Da de alta un cliente nuevo — crea su carpeta, archivos base y deja listos los pasos manuales (esquema PG, registro en settings)
argument-hint: [Nombre del cliente]
---

Vas a dar de alta un cliente nuevo en el workspace N8N-ClaudeCode, replicando
la estructura estándar que ya usan Bejauha, Savia, Zoe y LuxeSmile.

Nombre del cliente solicitado: **$ARGUMENTS**
(Si viene vacío, pregúntalo antes de continuar.)

## Paso 0 — Recoger lo esencial

Antes de crear nada, pregúntale al usuario (usa AskUserQuestion donde aplique)
y NO inventes valores:

1. **Sector / tipo de negocio** (ej. yoga, clínica dental, activewear).
2. **Ciudad y país** de operación.
3. **Canal(es)** del bot (Evolution API / Cloud API de WhatsApp / web…).
4. **Esquema de Postgres**: propón un slug en minúsculas derivado del nombre
   (ej. "Mi Marca" → `mi_marca`) y confírmalo. Vive en la DB `leadai`,
   contenedor `evolution_postgres`, owner `leadai_user`. NUNCA `public`.
5. **Qué se va a construir** (cuántos agentes/workflows, a grandes rasgos).

Si el usuario no tiene algún dato, márcalo como ⏳ pendiente en el CLAUDE.md
y sigue. No bloquees la creación por datos de negocio.

## Paso 1 — Crear la estructura de carpetas

Carpeta raíz: `[Nombre]/` (respeta mayúsculas como las quiera el usuario).
Subcarpetas: `workflows/`, `prompts/`, `database/`, `docs/`, `.claude/`.

## Paso 2 — Generar los archivos base

- **`.mcp.json`**: cópialo EXACTO desde `Bejauha/.mcp.json` (es idéntico en
  todos los clientes — mismo binario node, mismo entry point del MCP, misma
  N8N_API_URL y N8N_API_KEY). No lo modifiques.

- **`.gitignore`**: usa como base `Bejauha/.gitignore` (ignora `.env*`,
  dumps `*.dump`/`*.sql.gz`, `workflows/*.credentials.json`, basura de
  editores). Ajusta el prefijo de los dumps al slug del cliente.

- **`.env.example`**: replica la estructura de `Bejauha/.env.example`
  (secciones: Evolution API, PostgreSQL, LLM, Lógica de negocio) pero con los
  valores y el nombre del cliente nuevo. Reglas que SIEMPRE aplican:
  - `PG_HOST=evolution_postgres`, `PG_DB=leadai`, `PG_USER=leadai_user`,
    `PG_SCHEMA=<slug>`, password vacío.
  - Incluir `<SLUG>_TIMEZONE=America/Bogota` con el recordatorio de que el
    container n8n corre en Europe/Berlin y todo cron necesita
    `settings.timezone`.
  - Sin valores reales (API keys vacías). El `.env` real lo llena el usuario.

- **`CLAUDE.md`**: crea un esqueleto SSOT (Única Fuente de Verdad) siguiendo
  el estilo de `Bejauha/claude.md`. Encabezado con la nota de SSOT y estado
  "Sprint 1 — cimientos". Secciones mínimas (rellena lo que sepas del Paso 0,
  deja ⏳ en lo pendiente):
  1. Qué es el cliente (resumen del negocio)
  2. Arquitectura (agentes/workflows previstos)
  3. Infraestructura (n8n, Evolution, esquema PG `<slug>`, timezone)
  4. Reglas de negocio / tono
  5. Estado y pendientes
  No copies contenido de otro cliente; este archivo es propio.

- **`.claude/settings.json`**: replica el de `Savia/.claude/settings.json`
  (ajústalo al cliente nuevo).

## Paso 3 — Registrar el cliente en el workspace

- Añade la ruta absoluta de la carpeta nueva a `additionalDirectories` en
  `.claude/settings.json` de la RAÍZ del workspace (como ya está LuxeSmile).

## Paso 4 — Recordar los pasos manuales (NO los ejecutes tú)

Al terminar, dale al usuario una checklist clara de lo que falta a mano:

1. **Crear el esquema en Postgres**: conéctate al contenedor
   `evolution_postgres` y `CREATE SCHEMA <slug> AUTHORIZATION leadai_user;`
   (luego correr los `database/*.sql` cuando existan).
2. **Copiar `.env.example` → `.env`** y llenar las credenciales reales.
3. **Crear el workflow en n8n** con la convención `[Cliente] - [Función]` y
   sus tags.
4. Recordatorio: todo workflow con cron necesita
   `settings.timezone="America/Bogota"`.

## Reporte final

Muestra el árbol de archivos creados y la checklist de pasos manuales
pendientes. Sé conciso.
