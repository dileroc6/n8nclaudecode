# Build-spec — WF02 Agente 2 · Admin / Control de Clases

> Especificación de nodos para construir el workflow en n8n. Modelada sobre el
> patrón **real** de `Zoe — WF6 Admin GPT` (mismo servidor, mismo Evolution,
> misma DB `leadai`). Prompt: [`../prompts/agente2-admin-control-clases.md`](../prompts/agente2-admin-control-clases.md).

## Arquitectura (igual que Zoe)
Un **orquestador** recibe el webhook de Evolution en la línea principal y
enruta: si el remitente es admin → llama a este sub-workflow (Agente 2); si no
→ Agente 3. Por eso el Agente 2 arranca con **Execute Workflow Trigger**
(no webhook propio).

```
Orquestador (línea principal) ──(es admin)──> WF02 Agente 2 (este)
                              └─(es cliente)─> WF03 Agente 3
```

## Patrones confirmados de la instancia
- **Envío WhatsApp** = nodo `HTTP Request` v4.2:
  `POST https://evolution.srv1398596.hstgr.cloud/message/sendText/{instancia}`,
  auth `httpHeaderAuth`, body
  `{{ JSON.stringify({ number, text, options:{ delay:600, presence:'composing' } }) }}`.
  Instancia: `dev-router` (pruebas) → línea principal Bejauha en producción.
- **Postgres** = nodo `postgres` v2.5/2.6 con credencial al servidor `leadai`.
  Tablas siempre calificadas `bejauha.*`.
- **LLM** = `HTTP Request` v4.2 a OpenAI con credencial `openAiApi`.

## Nodos del WF02 (flujo)

| # | Nodo | Tipo | Función |
|---|------|------|---------|
| 1 | Trigger sub-workflow | `executeWorkflowTrigger` | Recibe `{ admin_whatsapp, admin_body }` del orquestador. |
| 2 | Validar inputs | `code` | Verifica campos; corta si faltan. |
| 3 | Cargar contexto | `postgres` | Si el admin nombra un cliente, intenta resolverlo (saldos vigentes). |
| 4 | Ensamblar prompt | `code` | Arma el system prompt (del .md) + contexto + mensaje del admin. |
| 5 | LLM interpreta orden | `httpRequest` (OpenAI) | Devuelve JSON: `{accion, cliente, tipo, cantidad}`. |
| 6 | Parsear respuesta | `code` | Valida el JSON del LLM (guard anti-alucinación). |
| 7 | Rutear y preparar SQL | `code` | Según `accion`, arma la query y parámetros. |
| 8 | Switch acción | `switch` | asistencia · recarga · consulta · sin_accion. |
| 9a | PG asistencia | `postgres` | INSERT asistencias + UPDATE saldos (−1). Devuelve saldo nuevo. |
| 9b | PG recarga | `postgres` | INSERT recargas + UPSERT saldos (+cantidad, vence_at). |
| 9c | PG consulta | `postgres` | SELECT saldo actual. |
| 10 | Decidir aviso cliente | `code` | Si saldo==1 → aviso "queda 1"; ==0 → MENSAJE 1 (renovar). |
| 11 | Confirmar al admin | `httpRequest` (Evolution) | Responde al admin el resultado de la operación. |
| 12 | Avisar al cliente | `httpRequest` (Evolution) | (Condicional) envía el aviso de saldo al cliente. |
| 13 | Log | `postgres` | INSERT en `mensajes_logs` (turno admin + avisos). |
| E | Error Trigger | `errorTrigger` | Captura fallos y notifica. |

## Reglas SQL clave (ver `003_saldos_clases.sql`)
- **Antes de tocar saldos**, UPSERT del cliente en `bejauha.leads`
  (`ON CONFLICT (telefono) DO NOTHING`) para mantener una sola identidad.
- Asistencia: `UPDATE bejauha.saldos_clases SET clases_restantes = clases_restantes - 1 ... RETURNING clases_restantes`.
- Pre-formatear `NULL` en Code antes del SQL (gotcha `queryReplacement`).

## Credenciales que requiere (decisión pendiente)
1. **Postgres → `leadai`** (acceso al esquema `bejauha`, usuario `leadai_user`).
2. **Evolution API** (`httpHeaderAuth` con la apikey; instancia `dev-router`).
3. **OpenAI** (`openAiApi`).

## Pendientes de negocio que afinan la lógica
- Membresía: ¿saldo o ilimitado? (afecta nodo 10).
- ¿Saldo aplica a presencial, virtual o ambos? (afecta `tipo` en SQL).
