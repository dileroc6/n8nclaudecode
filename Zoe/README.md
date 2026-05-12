# Zoe Tantric SPA — Bot WhatsApp + Backend de reservas

Cliente del proyecto **N8N-CloudeCode**. Bot conversacional WhatsApp para reservas de masaje tántrico, integrado con n8n + Evolution API + Postgres + GPT-4o-mini en el VPS Hostinger compartido.

## Documentación

- [CLAUDE.md](CLAUDE.md) — fuente de verdad del proyecto (contexto, políticas, arquitectura).
- [spa-backend/README.md](spa-backend/README.md) — engineering artifacts (SQL + Code nodes + system prompt).
- [spa-backend/docs/IMPORT_GUIDE.md](spa-backend/docs/IMPORT_GUIDE.md) — pasos para llevar todo a n8n.
- [spa-backend/system_prompt.md](spa-backend/system_prompt.md) — prompt de GPT-4o-mini con guardrails Tantra.

## Estructura

```
Zoe/
├── CLAUDE.md           ← fuente de verdad para Claude Code
├── README.md           ← este archivo
├── .env                ← gitignored, credenciales locales
├── .env.example        ← template
├── .mcp.json           ← MCP server n8n
├── .gitignore
├── .claude/
│   └── settings.json
└── spa-backend/        ← artifacts importables
    ├── sql/
    ├── n8n-nodes/
    ├── system_prompt.md
    └── docs/
```

## Quick start

```bash
cp .env.example .env
# editar .env con OPENAI_API_KEY y ADMIN_PHONES
psql -h $PG_HOST -U $PG_USER -d $PG_DB -f spa-backend/sql/01_schema.sql
psql -h $PG_HOST -U $PG_USER -d $PG_DB -f spa-backend/sql/02_helpers.sql
psql -h $PG_HOST -U $PG_USER -d $PG_DB -f spa-backend/sql/03_seed.sql
```

Luego sigue [spa-backend/docs/IMPORT_GUIDE.md](spa-backend/docs/IMPORT_GUIDE.md) para los workflows en n8n.
