# Legado — no usar como referencia

Todo lo que hay en esta carpeta describe el **sistema viejo de Bejauha**: esquemas de Postgres por cliente (`bejauha`, `bejauha_legacy`), Google Sheet como fuente de datos, y el sandbox antiguo (`test_conversaciones`).

**Ese sistema está pausado desde julio de 2026.** Bejauha corre hoy sobre Supabase, como cualquier otro cliente de la plataforma ToqueFlow.

Se conserva por si hace falta rastrear una decisión histórica, pero **nada de aquí refleja cómo funciona el sistema actual**.

| Archivo | Qué era |
|---|---|
| `claude-legado.md` | El CLAUDE.md original de Bejauha, del sistema Postgres |
| `manual-admins.md` · `.html` | Manual de administradores del sistema viejo |
| `manual-admins-completo.md` · `.html` | Versión extendida del mismo manual |
| `arquitectura-toque.html` | Render HTML de un documento que ahora vive en `ToqueFlow/arquitectura/` |

## Dónde está lo vigente

- **Estado real de Bejauha:** [../estado-mvp.md](../estado-mvp.md) — fuente única de verdad
- **Contrato con n8n:** [../../../ToqueFlow/arquitectura/contrato-n8n.md](../../../ToqueFlow/arquitectura/contrato-n8n.md)
- **Arquitectura de la plataforma:** [../../../ToqueFlow/arquitectura/arquitectura-toque.md](../../../ToqueFlow/arquitectura/arquitectura-toque.md)

⚠️ El esquema Postgres `bejauha*` **no se borra todavía**: la base la comparten Savia, Zoe, LuxeSmile y Evolution. Solo se dropea cuando se retire el sistema viejo por completo.
