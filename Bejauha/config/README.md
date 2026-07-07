# Config — Bejauha

Centraliza la configuración de infraestructura. **Ningún secreto real**
vive aquí ni en git: los valores reales van en `.env` (gitignored) y en
n8n → Settings → Environment Variables.

## Fuentes de verdad

| Variable | Para qué | Dónde se obtiene |
|----------|----------|------------------|
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` | Canal WhatsApp (in/out) | Reusa Savia (env vars de n8n) |
| `EVOLUTION_INSTANCE_OUTBOUND` / `_INBOUND` | Sesiones WhatsApp de cada agente | `dev-router` (prueba) hasta tener número(s) oficial(es) |
| `PG_*` | Persistencia (esquema `bejauha`) | Reusa Savia · DB `leadai` del VPS |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | LLM de clasificación y conversación | Reusa Savia (env vars de n8n) |
| `BEJAUHA_ASESOR_PHONES` | Destino de alertas de handoff | Definir con el cliente |

> Ver `.env.example` en la raíz para la lista completa y los valores
> teóricos de arranque. Copiar a `.env` y completar lo pendiente.

## Pendiente de confirmar con el cliente

- ¿Dos números distintos para los dos agentes? (recomendado, ver `claude.md` §7).
- Número(s) de WhatsApp definitivo(s) de Bejauha.
- Teléfono(s) del/los asesor(es) humano(s) para handoff.
- Copy del primer mensaje outbound (3-4 variantes para rotar).
- Proveedor LLM final (GPT-4o vs Claude) según costo.
