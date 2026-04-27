# Arquitectura del sistema CatalogBot

## Diagrama de flujo general

```
WhatsApp (usuario)
       │
       ▼
Evolution API v2 ──webhook──► WF-A: Receptor y enrutador
                                      │
                           ┌──────────┼──────────────────┐
                           │          │                  │
                     Valida         Resuelve          Adquiere
                     secreto       cliente_id          lock
                           │          │                  │
                           └──────────┴──────────────────┘
                                      │
                                      ▼
                              WF-B: Agente principal (AI Agent)
                               │         │          │
                       Reconstruye   Claude Sonnet  15 Tools
                       historial      (temp 0.2)    disponibles
                       desde BD           │              │
                                    Flujo de      Adapters de
                                    confirmación  ecommerce
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                    WF-C: Sesiones  WF-D: Auditoría  Evolution API
                    (lectura/       (INSERT async,   (envía respuesta
                    escritura BD)   no bloquea)       al usuario)
                                               
WF-E: Scheduler (cada 15 min)
  ├── Limpia sesiones expiradas
  ├── Ejecuta programados pendientes
  ├── Calcula métricas diarias
  ├── Detecta circuit breaker (5+ errores / 10 min)
  └── Purga historial > 30 días
```

## Flujo detallado mensaje entrante (WF-A → WF-B)

```
1. Evolution API envía POST al webhook de WF-A
2. WF-A valida header X-Webhook-Secret → HTTP 401 si falla
3. WF-A ignora si data.key.fromMe === true
4. WF-A consulta public.clientes WHERE whatsapp_instance = data.instance
5. WF-A extrae telefono de data.key.remoteJid (remueve @s.whatsapp.net)
6. WF-A consulta {schema}.usuarios WHERE telefono = $1 AND activo = true
7. WF-A adquiere lock: BEGIN; SELECT FOR UPDATE en {schema}.sesiones; UPDATE lock_timestamp; COMMIT
8. WF-A detecta tipo de mensaje (textMessage / imageMessage)
9. Si imageMessage: llama a Evolution API /chat/getBase64FromMediaMessage
10. WF-A llama a WF-B con payload enriquecido:
    { telefono, cliente_id, schema, rol, mensaje, base64?, messageType }

11. WF-B consulta historial: SELECT rol, contenido FROM {schema}.historial_conversacion
    WHERE telefono = $1 ORDER BY turno DESC LIMIT 10
12. WF-B invierte resultado y construye array messages para Claude
13. WF-B agrega mensaje actual como último elemento
14. WF-B ejecuta AI Agent (Claude Sonnet, temp 0.2, max 1500 tokens)
15. Claude puede invocar 0..N tools en una sola respuesta
16. Por cada tool: WF-B valida permisos de rol antes de ejecutar
17. Si la tool requiere confirmación: WF-B guarda datos_pendientes en sesión
    y retorna resumen al usuario sin ejecutar el cambio
18. Si el usuario confirma (CONFIRMAR / CONFIRMAR ELIMINAR / CONFIRMAR MASIVO):
    WF-B ejecuta la tool con los datos_pendientes guardados
19. WF-B inserta respuesta en {schema}.historial_conversacion
20. WF-B llama a Evolution API POST /message/sendText/{instance}
21. WF-B llama a WF-D (async) para registrar en auditoria
22. WF-B libera lock_timestamp en sesión
```

## Workflows

### WF-A: Receptor y enrutador
- **Trigger:** Webhook HTTP POST desde Evolution API
- **Responsabilidad:** Punto de entrada, validación de seguridad, resolución de contexto, enrutamiento
- **No contiene:** Lógica de negocio ni acceso al ecommerce
- **Depende de:** BD (public.clientes, {schema}.usuarios, {schema}.sesiones)

### WF-B: Agente principal
- **Trigger:** Sub-workflow call desde WF-A
- **Responsabilidad:** Toda la lógica conversacional y de negocio
- **Contiene:** AI Agent con Claude Sonnet + 15 tools + flujo de confirmación
- **Depende de:** WF-C, WF-D, adapters, Evolution API, Cloudinary, Anthropic API

### WF-C: Gestor de sesiones
- **Trigger:** Sub-workflow call desde WF-A y WF-B
- **Responsabilidad:** CRUD de {schema}.sesiones con transacciones seguras
- **Patrón:** Begin → SELECT FOR UPDATE → UPDATE → Commit

### WF-D: Auditoría
- **Trigger:** Sub-workflow call desde WF-B (asíncrono)
- **Responsabilidad:** INSERT en {schema}.auditoria sin bloquear la respuesta
- **En caso de fallo:** Escribe en {schema}.errores y notifica admin

### WF-E: Scheduler
- **Trigger:** Schedule Trigger cada 15 minutos
- **Responsabilidad:** Mantenimiento del sistema, ejecución de programados, métricas
- **Itera sobre:** Todos los clientes activos en public.clientes

## Aislamiento por cliente (principio central)

Cada schema de PostgreSQL es un universo independiente:

```
public.clientes          ← metadatos del sistema, NO datos del negocio
   │
   ├── cli_00001.usuarios
   ├── cli_00001.sesiones
   ├── cli_00001.historial_conversacion
   ├── cli_00001.auditoria
   ├── cli_00001.programados
   ├── cli_00001.errores
   └── cli_00001.metricas_diarias

   ├── cli_00002.usuarios     ← completamente separado
   └── ...
```

Ninguna query cruza schemas. La única tabla compartida es `public.clientes`
que contiene solo metadatos de infraestructura (no datos del negocio).

## Adapter pattern

```
WF-B (AI Agent)
     │
     ▼
Interface común (buscarProducto, actualizarPrecio, etc.)
     │
     ├── adapters/woocommerce.js ── WooCommerce REST API v3
     │                              Basic Auth
     │
     └── adapters/shopify.js ────── Shopify Admin API 2024-01
                                    X-Shopify-Access-Token
                                    Precios en variants[]
```

Para agregar nueva plataforma: crear `adapters/{plataforma}.js`
implementando los 10 métodos de la interfaz. No tocar WF-B.

## Estrategia de historial de conversación

n8n no persiste estado entre ejecuciones. Solución:

```
Turno N:
1. SELECT últimos 10 turnos FROM {schema}.historial_conversacion
2. Invertir → array messages cronológico
3. Agregar mensaje actual
4. Llamar AI Agent
5. INSERT respuesta con turno = MAX(turno) + 1

Límite de tokens: si suma tokens_aprox > 6000
→ truncar turnos más antiguos (nunca truncar turno 1)
```

## Control de concurrencia

```
Mensaje 1 (teléfono X) llega:
  WF-A: BEGIN; SELECT lock_timestamp FOR UPDATE;
        lock_timestamp = NULL → procesar, actualizar a NOW()
        COMMIT

Mensaje 2 (teléfono X) llega 5 segundos después:
  WF-A: BEGIN; SELECT lock_timestamp FOR UPDATE;
        lock_timestamp = 5s ago < 30s → DESCARTAR
        COMMIT; Notificar al usuario

Mensaje 3 (teléfono X) llega 35 segundos después:
  WF-A: BEGIN; SELECT lock_timestamp FOR UPDATE;
        lock_timestamp = 35s ago > 30s → PROCESAR (lock expirado)
        COMMIT
```
