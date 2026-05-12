# N8N-ClaudeCode

## Objetivo

Crear workflows profesionales en n8n para múltiples clientes, usando el servidor MCP de n8n y skills especializados.

---

## Estructura del proyecto

```
N8N-ClaudeCode/
├── n8n-mcp/          # Servidor MCP — herramienta compartida (Node 20)
├── n8n-skills/       # Skills de Claude Code para n8n
├── LuxeSmile/        # Cliente: clínica dental Luxe Smile
└── [cliente]/        # Futuros clientes (un subdirectorio por cliente)
```

Cada carpeta de cliente contiene su propio `CLAUDE.md`, `.mcp.json`, `.env` y `.claude/settings.json`.

---

## Infraestructura compartida

### n8n MCP Server
- Ruta: `./n8n-mcp/`
- Binario Node: `/home/dileroc/.nvm/versions/node/v20.20.2/bin/node`
- Entry point: `./n8n-mcp/dist/mcp/index.js`
- Variables requeridas: `N8N_API_URL`, `N8N_API_KEY`

### n8n Skills (plugin)
- Ruta: `./n8n-skills/`
- 7 skills: Expression Syntax, MCP Tools Expert, Workflow Patterns, Validation Expert, Node Configuration, Code JavaScript, Code Python

---

## Instancia n8n

| Parámetro | Valor |
|-----------|-------|
| Tipo | Self-hosted en Hostinger |
| URL | `https://n8n.srv1398596.hstgr.cloud/` |
| Infraestructura | Docker |
| Credenciales | Ver `.env` de cada cliente |

---

## Convenciones

- Nombres de workflow: `[Cliente] - [Función]` → ej. `Luxe Smile - Bot WhatsApp`
- Tags en n8n: por cliente y por tipo de workflow
- Un subdirectorio por cliente, autónomo y con su propia configuración

---

## Patrones de calidad

- Siempre incluir nodo de manejo de errores (`Error Trigger`)
- Usar variables de entorno, nunca hardcodear credenciales
- Agregar logging para debugging
- Documentar cada workflow en el campo "Notes" de n8n
- Separar workflows complejos en sub-workflows reutilizables
