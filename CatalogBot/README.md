# CatalogBot

Sistema multi-cliente de gestión de catálogo de productos vía WhatsApp con IA.

Los usuarios autorizados de cualquier negocio con ecommerce pueden crear, buscar,
actualizar y eliminar productos enviando mensajes y fotos por WhatsApp, sin acceder
a ningún panel web.

---

## Stack

| Componente | Tecnología |
|---|---|
| Orquestador | n8n self-hosted |
| Canal | WhatsApp Business via Evolution API v2 |
| IA | Claude Sonnet (Anthropic) |
| Base de datos | PostgreSQL (schema por cliente) |
| Imágenes | Cloudinary |
| Ecommerce | WooCommerce, Shopify (adapter pattern) |

---

## Inicio rápido

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 2. Aplicar migraciones de BD
node scripts/migrate.js

# 3. Provisionar primer cliente de prueba
node scripts/provision_cliente.js \
  cli_00001 "Mi Tienda" woocommerce \
  https://mitienda.com instancia_wa \
  573001234567 "Admin Nombre"

# 4. Validar e importar workflows en n8n (en orden: C → D → A → B → E)
node scripts/validate_workflow.js workflows/WF-C_sesiones.json
node scripts/validate_workflow.js workflows/WF-A_receptor.json
# ... etc

# 5. Prueba de humo (enviar mensaje WhatsApp → verificar respuesta)
```

Ver `ONBOARDING_CLIENTE.md` para el proceso completo de onboarding.

---

## Estructura

```
catalogbot/
├── workflows/          ← 5 workflows n8n (WF-A a WF-E)
├── adapters/           ← WooCommerce y Shopify
├── schemas/tools/      ← 15 schemas JSON para las tools del agente
├── prompts/            ← System prompt del AI Agent
├── db/migrations/      ← Migraciones SQL
├── scripts/            ← provision_cliente.js, migrate.js, validate_workflow.js
├── docs/               ← Arquitectura, configuración, checklist
└── tests/              ← Tests de integración y unitarios
```

---

## Arquitectura de workflows

```
WhatsApp → WF-A (receptor) → WF-B (agente AI) → ecommerce
                ↓                    ↓
             WF-C (sesiones)      WF-D (auditoría)

WF-E (scheduler, cada 15 min) → mantenimiento de todos los clientes
```

---

## Documentación

- `CLAUDE.md` — especificación técnica completa del sistema
- `ONBOARDING_CLIENTE.md` — proceso de alta de nuevos clientes
- `docs/arquitectura.md` — decisiones de diseño y diagramas de flujo
- `docs/configuracion_sistema.md` — credenciales n8n y orden de activación
- `docs/checklist_verificacion.md` — checklist pre-producción
- `docs/comandos_usuario.md` — comandos disponibles por rol
- `prompts/system_prompt.md` — prompt del agente (leer antes de modificar WF-B)
