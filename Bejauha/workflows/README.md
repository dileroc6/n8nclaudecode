# Workflows n8n — Bejauha

JSONs exportados de n8n para los dos agentes. Se versionan **sin
credenciales inline** (usar variables de entorno / credenciales n8n).

## Archivos esperados

| Archivo | n8n ID | Trigger | Descripción |
|---------|--------|---------|-------------|
| `wf00-orquestador.json` | `rD794jC4vc9C1Ke7` | Webhook `bejauha-wa` | Recibe Evolution (línea principal), normaliza, detecta admin/cliente y llama al sub-workflow. |
| `wf02-agente-admin-clases.json` | `sILA5Co9FD3JI5eJ` | executeWorkflow + webhook | Admin: asistencia/recarga/consulta, avisos a 1 y 0 clases. |
| `wf03-agente-inbound-nurturing.json` | `rctOPl2BpQ4UVjEk` | executeWorkflow + webhook | Inbound: responde con KB + memoria, escala a humano si Caliente. |
| `wf04-recordatorios-vencimiento.json` | `SRCYX5c8qImyTYt9` | Schedule (cron 9am) | Recordatorio al cliente 2 semanas antes de vencer su paquete. |
| `wf01-...` (outbound) | ⏳ | Schedule | Pendiente: espera la oferta (P20). |

Todos **inactivos · v1 · sin probar**. Credenciales transversales. Instancia
`dev-router` para pruebas (cambiar a la línea real en producción).

## Convenciones (heredadas del proyecto N8N-ClaudeCode)

- **Nombre en n8n:** `Bejauha - [Función]` (ej. `Bejauha - Agente Filtrado Outbound`).
- **Timezone:** todo workflow con `Schedule`/cron debe fijar
  `settings.timezone = "America/Bogota"`. El container n8n corre en
  **Europe/Berlin** y dispararía horas antes.
- **Error handling:** incluir `Error Trigger` con notificación.
- **Postgres:** `search_path` al esquema `bejauha`; pre-formatear `NULL`
  en nodos Code (evitar gotchas de `queryReplacement`).
- Exportar con `n8n export` o desde la UI tras cada cambio estable.
