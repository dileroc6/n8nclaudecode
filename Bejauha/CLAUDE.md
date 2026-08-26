# Bejauha — Yoga & Bienestar

Cliente de ToqueFlow, y **el más integrado con la plataforma**. Estudio de clases por paquetes en Colombia: los alumnos compran un paquete con saldo de clases, asisten, se les descuenta, recargan.

> **Fuente única de verdad del estado real: [docs/estado-mvp.md](docs/estado-mvp.md).**
> Empezar siempre por ahí. Este archivo es solo el mapa.

---

## Por qué importa

Cuando haya que decidir cómo resolver algo para un cliente nuevo, **mirar primero cómo se hizo aquí**. Bejauha es el patrón vivo de la arquitectura:

- **Migración completa:** el Google Sheet quedó cerrado, Supabase es la fuente de verdad.
- **Flujos en producción sobre el contrato:** agente admin (asistencia y recargas), bot inbound, campañas (`ejecutar_campana`), pago fallido (`pago_fallido`) y recordatorio de última clase.
- **Sandbox real:** eventos con `test: true` corren el flujo de verdad pero desvían la salida a `test_messages`, que el panel lee como chat.
- **Mínimos privilegios:** el rol `n8n_worker` no puede borrar ni tocar `auth`/`profiles`.

Su lógica de negocio —saldo de clases, asistencia que descuenta, aviso automático al quedar una clase, reactivación de inactivos— **no es un proyecto: es un producto** replicable a cualquier estudio de clases por paquetes.

---

## Dónde está cada cosa

| Ruta | Qué es |
|---|---|
| [docs/estado-mvp.md](docs/estado-mvp.md) | **Empezar aquí.** Estado real: flujos, IDs de n8n, seguridad, pendientes |
| [docs/diagramas-mvp.md](docs/diagramas-mvp.md) | Diagramas de los flujos |
| [workflows/](workflows/) | Los JSON de n8n |
| [prompts/](prompts/) | Prompts de los agentes + tono de marca |
| [database/](database/) | Migraciones SQL numeradas e idempotentes |
| [docs/_legado/](docs/_legado/) | ⚠️ Sistema viejo de Postgres. **No usar como referencia** |

A nivel plataforma: [contrato n8n](../ToqueFlow/arquitectura/contrato-n8n.md) · [arquitectura](../ToqueFlow/arquitectura/arquitectura-toque.md) · [modo prueba](../ToqueFlow/arquitectura/modo-prueba-sandbox.md)

---

## Reglas al tocar Bejauha

1. **Nada de esquemas Postgres por cliente.** Todo vive en Supabase, multi-tenant por `company_id` con RLS. Lo que diga otra cosa está en `docs/_legado/`.
2. **Los nodos de envío de WhatsApp están apagados físicamente** tras el incidente del 2026-07-07. No encenderlos sin go-live explícito, warm-up anti-baneo y prueba a un número propio.
3. **El outbound exige `confirmar_envio`.** Sin filtros no selecciona a nadie: es a propósito.
4. **Todo flujo nuevo se prueba en modo prueba** antes de tocar producción.
5. **Los cron necesitan `settings.timezone = "America/Bogota"`** — el contenedor de n8n corre en Europe/Berlin.
