# Bejauha — Estado del MVP (fuente única de verdad)

> Actualizado: 2026-07-09. Refleja el estado **real** del sistema. Los docs antiguos (`claude.md`, `manual-admins`) describen el sistema viejo de Postgres y están **obsoletos** (ver "Legado" abajo).

## 1. Arquitectura actual
- **Fuente de verdad: Supabase** (proyecto ToqueFlow, ref `pyoauvbwqxuuzamnjwfd`). El Google Sheet **quedó cerrado** (migración completa).
- **Plataforma Toque** (Supabase + panel HTML en Hostinger) es dueña de los datos. **n8n** (VPS Hostinger) es el worker que integra WhatsApp/IA/envíos.
- **Puente:** outbox `n8n_events` + Database Webhook (pg_net) → **receptor n8n `toque-events`** (multi-tenant, valida `X-Toque-Signature`). Detalle en [contrato-n8n.md](contrato-n8n.md).
- **Auth n8n → Supabase:** conexión directa Postgres con rol **`n8n_worker`** (usuario/contraseña, **mínimos privilegios**) vía pooler. Ya no se usa `service_role` ni la REST.

## 2. Flujos (estado)
| Flujo | Qué hace | Datos | Envío WhatsApp | Probado |
|---|---|---|---|---|
| **Agente Admin** | asistencia (−1), recarga (+N), consulta — solo Paquete | `contacts` (Postgres) | 🔒 apagado | ✅ |
| **Recordatorio última clase** | al quedar en 1 clase, avisa cliente + admin | por evento en el admin | 🔒 | ✅ |
| **Inbound bot** | info de planes (sin URLs) + interés → grupo | `contacts` | 🔒 | ✅ |
| **Campañas** (`ejecutar_campana`) | segmenta `contacts` + envía en lotes + `campaign_runs` | `contacts`/`campaign_runs` | 🔒 | ✅ pipe real |
| **Pago fallido** (`pago_fallido`) | marca `deudor` (solo paquete) + avisa grupo | `contacts`/`n8n_events` | 🔒 | ✅ pipe real |

## 3. Sandbox (modo prueba — sin WhatsApp real)
Los eventos con **`test: true`** hacen que n8n corra el flujo real pero **desvíe la salida a la tabla `test_messages`** (que lee el chat web del panel). Ver contrato para el detalle. 3 flujos probados:
- **Chat inbound** (evento `mensaje_prueba`) → corre el inbound real, escribe la respuesta en `test_messages`.
- **Campaña test** (`ejecutar_campana` + `test:true`) → escribe el mensaje de cada contacto en `test_messages`, sin `campaign_runs`.
- **Deudor test** (`pago_fallido` + `test:true`) → escribe el aviso, **sin marcar deudor** (no muta datos reales).

## 4. Seguridad
- **TODOS los nodos de envío de WhatsApp están DESACTIVADOS físicamente** (blindados) tras el incidente 2026-07-07. Ningún flujo puede enviar por accidente.
- **Mínimos privilegios:** el rol `n8n_worker` solo puede SELECT `contacts`/`campaigns`, INSERT `campaign_runs`/`message_log`/`test_messages`, UPDATE `contacts`/`n8n_events`. **No** accede a `auth`/`profiles`.
- Secretos (`credentials.env`, `n8n-worker-pg.local.txt`, `*.local.*`) **ignorados por git**.
- El **outbound** tiene candados: exige `confirmar_envio`, sin filtros no selecciona a nadie, y nodo de envío apagado.
- Sistema viejo de Postgres (WF00/02/03) **pausado**.

## 5. Workflows n8n (IDs)
| Workflow | ID |
|---|---|
| Agente Admin | `QCRewv0AGcfFqINt` |
| Inbound bot | `RS4t963GlxCBNKq4` |
| Receptor de eventos Toque | `f04pApXeC3bLbR8K` |
| Handler `ejecutar_campana` | `Et8gzLTUbwLvilTl` |
| Handler `pago_fallido` | `HU8Dh4reb4fNJH9g` |
| Handler `mensaje_prueba` (sandbox) | `kcXaDud4ghg0XP80` |
| Credencial Postgres `n8n_worker` | `ybgnIi1YfqZ3UpVX` |

Superseded (a retirar): outbound suelto `OGepgAooB93FaKKo`, recordatorio suelto `YYtujp8tsfw0Mkmp` (ahora por evento).

## 6. Datos de prueba
- Contacto sandbox en `contacts`: **ZZ PRUEBA BOT** (`+573000000001`, `company_id 3034fa2d-c918-41bb-9eae-84f2e7913db8`). Borrable.

## 7. Pendientes
- **GO-LIVE:** encender envíos flujo por flujo, con **warm-up anti-baneo**, prueba a un número propio + OK explícito.
- **Orquestador de entrada WhatsApp** (Evolution → agentes) para que admin e inbound reciban mensajes reales.
- Confirmar datos/precios de planes (pulir inbound) y acción final de `tracking_deudor` (con Toque).
- Rotar el resto a producción: `panel de campañas` (Toque), limpiar datos de prueba.

## 8. Legado (obsoleto)
`claude.md`, `manual-admins*`, esquema Postgres `bejauha`/`bejauha_legacy` y el sandbox viejo (`test_conversaciones`) describen/pertenecen al sistema anterior. **No usar como referencia.** El esquema Postgres NO se borra (lo comparten Savia/Zoe/Luxe/Evolution); solo se dropean los esquemas `bejauha*` cuando se retire el sistema viejo.
