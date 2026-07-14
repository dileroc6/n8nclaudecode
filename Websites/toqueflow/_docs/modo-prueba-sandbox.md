# Modo prueba / Sandbox — contrato (as-built)

> Estado: **operativo de ambos lados** (2026-07-09). Permite probar los flujos de n8n (agente inbound, gestión de clases, campañas, deudor) **sin enviar WhatsApp real** ni mutar datos reales. Todo se ve en el **chat de prueba** del panel.

## La idea
Los eventos que la plataforma emite pueden traer **`test: true`**. Cuando viene en `true`, n8n corre su flujo real (misma IA/lógica) pero **desvía toda salida a la tabla `test_messages`** (con el rol `n8n_worker`), sin Evolution, sin admin real y **sin escribir en las tablas de negocio** (`campaign_runs`, no marca deudor, etc.).

Todo entra por el receptor de siempre: `POST /webhook/toque-events` (header `X-Toque-Signature`, envelope anidado).

## Contacto de prueba
`ZZ PRUEBA BOT` · `+573000000001` · Bejauha (`company_id 3034fa2d-c918-41bb-9eae-84f2e7913db8`). Es el "cliente" del sandbox. **No borrar.**

## Tabla `test_messages`
```
id, company_id, contact_id, telefono,
direction  -- 'in' (lo que escribe quien prueba) | 'out' (lo que el sistema habría enviado)
author     -- 'cliente' | 'bot' | 'admin' | 'sistema'
body, flow, meta, created_at
```
**Para distinguir en el panel:** `flow` ∈ `agente_atencion | gestion_clases | campana | deudor`; `author` ∈ `cliente | bot | admin`.

## Los flujos (todos honran `test:true` — n8n LISTO)

### 1) Chat inbound (conversacional) — ✅ ambos lados
- Al escribir en el chat, la plataforma: inserta `test_messages` (`in`, author `cliente`) **y** emite `mensaje_prueba` con `payload:{ test:true, contact_id, telefono, texto }`.
- n8n corre el agente real y escribe la respuesta en `test_messages` (`out`, author `bot`, flow `agente_atencion`). Si detecta interés, agrega otra fila author `admin` (handoff).
- El chat hace polling de `test_messages` y muestra las filas `out`.

### 2) Campaña en modo prueba — ✅ ambos lados (botón, no chat)
- La plataforma emite `ejecutar_campana` con `payload.test=true` (checkbox "🧪 Modo prueba").
- n8n escribe **una fila por contacto** del segmento en `test_messages` (author `bot`, flow `campana`, `body` = mensaje con `{nombre}` ya reemplazado). **NO** escribe `campaign_runs`.
- Panel: mostrarlo como **lista de vista previa** (pendiente pulir en el panel — hoy las filas aparecen en el chat de prueba).

### 3) Deudor en modo prueba — ✅ n8n listo (botón, no chat)
- La plataforma emite `pago_fallido` con `payload.test=true`.
- n8n escribe el aviso en `test_messages` (author `admin`, flow `deudor`). **No** marca deudor de verdad.
- Panel: falta el disparador (botón "probar deudor").

### 4) Gestión de clases por chat (recarga / consulta / asistencia) — ✅ ambos lados
- En el chat, elegir "🛠️ Admin" → `mensaje_prueba` con `rol:"admin"` → n8n rutea al **agente de gestión de clases**. Respuesta en `test_messages` (author `bot`, flow `gestion_clases`). Ej.: `"Ana recargó 8"`, `"¿cuántas clases le quedan a Ana?"`, `"Ana asistió"`.
- **Datos en modo test:** solo el **contacto de prueba** `+573000000001` actualiza su `clases_restantes` de verdad (para ver recarga→consulta encadenadas). Contactos reales se simulan sin escribir. Nunca hay WhatsApp.
- Botón **"↺ Reiniciar saldo de prueba"** en el chat: hace `UPDATE contacts SET clases_restantes=8 WHERE phone='+573000000001'` (desde la plataforma, con el member).

## Payload de `mensaje_prueba`
```json
{ "event":"mensaje_prueba", "event_id":"<uuid>", "company_id":"3034fa2d-...", "company_slug":"bejauha",
  "payload": { "test":true, "rol":"cliente|admin", "flow":"agente_atencion|gestion_clases",
               "contact_id":"<uuid ZZ PRUEBA>", "telefono":"+573000000001", "texto":"..." } }
```

## Estado
| Pieza | Estado |
|---|---|
| Tabla `test_messages` + RLS + grants n8n_worker | ✅ plataforma |
| Chat de prueba (`modo-prueba.html`) + card en dashboard | ✅ plataforma |
| Checkbox "Modo prueba" en campañas | ✅ plataforma |
| n8n honra `test:true` en los 4 flujos (inbound, gestión de clases, campaña, deudor) → escribe en `test_messages` | ✅ n8n |
| Ruteo por `rol=admin` → agente de gestión de clases (recarga/consulta) | ✅ n8n |
| Vista previa de campaña de prueba (lista) + botón "simular pago fallido" + "reiniciar saldo" | ✅ plataforma |

Ver [contrato-n8n.md](contrato-n8n.md) para auth, receptor, envelope y demás eventos.
