# Savia Wear — Sales Agent

Agente de ventas autónomo por WhatsApp para [Savia Wear](https://savia-wear.com/), activewear femenino colombiano.

> **Stack**: n8n (VPS Hostinger) · WhatsApp Cloud API · WooCommerce REST · Wompi · PostgreSQL · Claude.

---

## Quick start

1. Leer [CLAUDE.md](CLAUDE.md) — fuente de verdad del proyecto.
2. Copiar `.env.example` a `.env` y completar credenciales reales.
3. Ejecutar DDL: ver [database/README.md](database/README.md).
4. Importar workflows: ver [workflows-n8n/](workflows-n8n/).
5. Validar 10 conversaciones simuladas con el system prompt en [prompts/system_vendedor.md](prompts/system_vendedor.md).

---

## Estructura

```
Savia/
├── CLAUDE.md                       Reglas del proyecto, arquitectura, restricciones
├── README.md                       Este archivo
├── .env.example                    Plantilla de variables
├── .gitignore
│
├── database/                       Postgres
│   ├── 001_schema.sql              DDL del schema savia (7 tablas + helpers)
│   ├── 002_seed_kb.sql             Seed inicial KB (validar con cliente)
│   └── README.md                   Instrucciones de despliegue + backup
│
├── prompts/
│   └── system_vendedor.md          System prompt del AI Agent
│
├── workflows-n8n/                  Documentación lógica de los workflows
│   ├── 01-bot-ventas-whatsapp.md   WF-01 — flujo principal
│   ├── 02-webhook-wompi.md         WF-02 — confirmación de pago
│   └── 03-alerta-tarifa-premium.md WF-03 — alerta admin >50 contactos
│
├── docs/
│   ├── arquitectura.md             Vista de componentes + decisiones
│   └── radar-riesgos.md            18 riesgos identificados + mitigación
│
└── scripts/
    └── sync_fichas_producto.md     Cron 02:00 AM — Woo → fichas_producto (Sprint 1.5)
```

---

## Sprint 1 — alcance (en construcción)

- [x] Documentación de arquitectura y reglas
- [x] DDL del schema PostgreSQL
- [x] System prompt del agente vendedor
- [x] Lógica de los 3 workflows principales
- [ ] Construcción de WF-01, WF-02, WF-03 en n8n
- [ ] Conexión WhatsApp Business + escaneo QR Evolution admin
- [ ] Credenciales Wompi y WooCommerce
- [ ] KB validado y cargado con datos reales del cliente
- [ ] Sincronización inicial de `fichas_producto`
- [ ] Test end-to-end en staging
- [ ] Go-live

## Sprint 2 — planeado

- Recuperación de carrito abandonado (3 templates Meta)
- Escalamiento bidireccional con admin (Evolution inbound)
- Sincronización `fichas_producto` automatizada
- Dashboard de conversión (Metabase sobre PG)
- pgvector para KB con búsqueda semántica

---

## Pendientes para el cliente (no bloqueantes ahora, sí para go-live)

| Item | Quién |
|---|---|
| Generar Consumer Key/Secret en WooCommerce (scope: read) | Cliente |
| Crear cuenta Wompi producción + obtener llaves | Cliente |
| Alta del número WhatsApp Business en Meta Cloud API | Cliente |
| Aprobar tono y guía de tallas en KB | Cliente + nosotros |
| URL de política de privacidad publicada en el sitio | Cliente |

---

## Contacto técnico

Mantenido por el equipo N8N-ClaudeCode. Ver [CLAUDE.md](CLAUDE.md) sección 1 para responsables actualizados.
