# Arquitectura — Savia Sales Agent

## Vista de componentes

```
                ┌─────────────────────────────────────────────┐
                │              VPS Hostinger                   │
                │                                              │
   ┌────────┐   │   ┌─────────────┐        ┌────────────────┐ │
   │ Cliente│──►│──►│ n8n         │◄──────►│ PostgreSQL     │ │
   │ WApp   │   │   │ (workflows) │        │ schema: savia  │ │
   └────────┘   │   └─────┬───────┘        └────────────────┘ │
        ▲       │         │                                    │
        │       │         │  AI Agent                          │
        │       │         ▼                                    │
        │       │   ┌─────────────┐        ┌────────────────┐ │
        │       │   │ Claude API  │        │ Evolution API  │ │
        │       │   │ (Anthropic) │        │ inst:savia-admin│ │
        │       │   └─────────────┘        └────────┬───────┘ │
        │       │         │                          │         │
        │       └─────────┼──────────────────────────┼─────────┘
        │                 │                          │
        │                 ▼                          ▼
   ┌────┴────────┐  ┌──────────────┐         ┌────────────┐
   │ Meta Cloud  │  │ WooCommerce  │         │ Admin      │
   │ WhatsApp API│  │ REST API     │         │ WhatsApp   │
   └─────────────┘  │ (savia-wear) │         └────────────┘
        │           └──────────────┘
        │                  │
        ▼                  │
   ┌─────────────┐         │
   │   Cliente   │         │
   └─────────────┘         │
                           ▼
                    ┌──────────────┐
                    │ Wompi        │
                    │ Payment Link │
                    └──────────────┘
```

## Flujos clave

### Conversación + venta (síncrono)
1. Cliente → WhatsApp Cloud API → webhook n8n (`WF-01`).
2. n8n persiste, clasifica, llama al AI Agent.
3. AI Agent consulta WooCommerce (tool) + KB (tool).
4. Si hay intención de compra → tool `wompi_generar_payment_link` → revalida stock → crea link → INSERT `pedidos`.
5. n8n responde al cliente con el link.

### Confirmación de pago (asíncrono)
1. Cliente paga en Wompi → Wompi → webhook n8n (`WF-02`).
2. Verifica HMAC, idempotencia, actualiza `pedidos.estado`.
3. Notifica al cliente vía Cloud API.

### Alerta de volumen (asíncrono interno)
1. WF-01 detecta cruce del umbral → invoca WF-03.
2. WF-03 marca atómicamente la activación + envía mensaje al admin vía Evolution.

## Aislamiento por cliente

- **DB**: schema `savia` separado dentro de `leadai`. Sin acoplamiento con `luxe_smile`, `bigotes_felinos`, etc.
- **Evolution**: instancia dedicada `savia-admin` (no comparte sesión WhatsApp con otros clientes).
- **Credenciales n8n**: prefijo `Savia —` en todas (Wompi, Woo, Meta WA Cloud, etc.).
- **Variables de entorno**: namespace `SAVIA_*` para constantes de negocio.

## Tres principios de diseño

1. **Single source of truth para stock**: WooCommerce REST API en vivo. La tabla `fichas_producto` es **solo cache** (fallback si Woo no responde).
2. **Contador O(1) por mensaje**: nunca COUNT(*) sobre logs; siempre PK compuesta + UPSERT.
3. **Idempotencia en todo borde externo**: HMAC + UNIQUE en `eventos_wompi.evento_id`, dedup de `mensajes[0].id` en Meta, INSERT ON CONFLICT en `contactos_dia` y `metricas_dia`.

## Decisiones explícitas (con justificación)

| Decisión | Alternativa descartada | Por qué |
|---|---|---|
| WhatsApp Cloud API directo, no BSP | 360dialog/Wati | Costo cero hasta 1k convs/mes; tenemos n8n para orquestar |
| Evolution API solo para admin (outbound) | Cloud API para admin también | Admin no necesita templates; Evolution es más rápido para 1-1 |
| Wompi sobre Bold/MP | Bold | Mejor API de payment_links; mercado CO estándar |
| Schema PG dedicado vs. DB dedicada | DB nueva | Consistencia con resto del proyecto; backups unificados |
| Sin transferencia bancaria | Flujo OCR + admin | Reduce 80% complejidad Sprint 1; conversión Wompi es alta |
| KB en tabla relacional vs. pgvector | pgvector | Sprint 1 cabe con keywords + topico; vector es Sprint 2 |
| `mensajes_logs` plano vs. `mensajes` por lead | Tabla por lead | Append puro escala mejor; los joins por `telefono` son baratos con índice |

## Observabilidad mínima

- Cada nodo crítico de WF-01/02/03 hace INSERT en `mensajes_logs.metadata` con `latency_ms`, `tools_used`, `model`.
- Vista materializada `savia.dashboard_dia` (Sprint 2) con: conversión, intents top, latencia P50/P95.
- Errores 5xx de Wompi/Woo → POST a Evolution admin como warning (no como alerta crítica).
