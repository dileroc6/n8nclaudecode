# Configuración del sistema — CatalogBot

## Credenciales n8n a crear (en orden)

Crear estas credenciales en n8n antes de activar cualquier workflow.
Ruta en n8n: Settings → Credentials → Add Credential

### 1. CatalogBot PostgreSQL

| Campo | Valor |
|---|---|
| Tipo | Postgres |
| ID interno (asignar) | `catalogbot-pg` |
| Host | `PGHOST` del `.env` |
| Puerto | `PGPORT` (default 5432) |
| Base de datos | `PGDATABASE` |
| Usuario | `PGUSER` |
| Contraseña | `PGPASSWORD` |
| SSL | Según configuración del servidor |

### 2. CatalogBot Anthropic API

| Campo | Valor |
|---|---|
| Tipo | Anthropic API |
| ID interno (asignar) | `anthropic-catalogbot` |
| API Key | `ANTHROPIC_API_KEY` del `.env` |

### 3. CatalogBot Evolution API Key

| Campo | Valor |
|---|---|
| Tipo | HTTP Header Auth |
| ID interno (asignar) | `evolution-api-key` |
| Header Name | `apikey` |
| Header Value | `EVOLUTION_API_KEY` del `.env` |

> La URL base de Evolution API se configura en cada nodo HTTP Request
> via expresión: `$credentials.evolutionApiUrl + '/...'`
> Para esto, agregar `evolutionApiUrl` como campo en la credencial si la versión
> de n8n lo soporta, o hardcodear como variable de entorno en n8n.

### 4. Credenciales de ecommerce por cliente

Por cada cliente, crear una credencial específica:

**WooCommerce:**
| Campo | Valor |
|---|---|
| Tipo | HTTP Request (Basic Auth) |
| Nombre | `{cliente_id} WooCommerce` |
| Usuario | `consumer_key` |
| Contraseña | `consumer_secret` |

**Shopify:**
| Campo | Valor |
|---|---|
| Tipo | HTTP Header Auth |
| Nombre | `{cliente_id} Shopify` |
| Header Name | `X-Shopify-Access-Token` |
| Header Value | `access_token` |

---

## Orden de activación de workflows

Activar en este orden exacto. No activar el siguiente hasta confirmar que el anterior está en estado "active".

```
1. WF-C_sesiones      → Trigger: Execute Workflow (sub-workflow)
2. WF-D_auditoria     → Trigger: Execute Workflow (sub-workflow)
3. WF-A_receptor      → Trigger: Webhook
4. WF-B_agente        → Trigger: Execute Workflow (sub-workflow)
5. WF-E_scheduler     → Trigger: Schedule (cada 15 min)
```

---

## IDs de workflow a reemplazar en WF-A y WF-B

Después de importar todos los workflows en n8n, obtener los IDs asignados
y reemplazar los placeholders:

### En WF-A_receptor.json

| Placeholder | Reemplazar con |
|---|---|
| `WFC_WORKFLOW_ID_PLACEHOLDER` | ID de WF-C en n8n |
| `WFB_WORKFLOW_ID_PLACEHOLDER` | ID de WF-B en n8n |

### En WF-B_agente.json

| Placeholder | Reemplazar con |
|---|---|
| `WFC_WORKFLOW_ID_PLACEHOLDER` | ID de WF-C en n8n |
| `WFD_WORKFLOW_ID_PLACEHOLDER` | ID de WF-D en n8n |
| `TOOL_BUSCAR_PRODUCTO_WF_ID` | ID del workflow tool buscar_producto |
| `TOOL_OBTENER_PRODUCTO_WF_ID` | ID del workflow tool obtener_producto |
| `TOOL_CREAR_PRODUCTO_WF_ID` | ID del workflow tool crear_producto |
| `TOOL_ACTUALIZAR_PRODUCTO_WF_ID` | ID del workflow tool actualizar_producto |
| `TOOL_ELIMINAR_PRODUCTO_WF_ID` | ID del workflow tool eliminar_producto |
| `TOOL_LISTAR_CATEGORIAS_WF_ID` | ID del workflow tool listar_categorias |
| `TOOL_ACTUALIZAR_PRECIO_WF_ID` | ID del workflow tool actualizar_precio |
| `TOOL_CREAR_DESCUENTO_WF_ID` | ID del workflow tool crear_descuento |
| `TOOL_ELIMINAR_DESCUENTO_WF_ID` | ID del workflow tool eliminar_descuento |
| `TOOL_PRECIO_MASIVO_WF_ID` | ID del workflow tool precio_masivo |
| `TOOL_SUBIR_IMAGEN_WF_ID` | ID del workflow tool subir_imagen |
| `TOOL_ANALIZAR_IMAGEN_WF_ID` | ID del workflow tool analizar_imagen |
| `TOOL_VER_HISTORIAL_WF_ID` | ID del workflow tool ver_historial |
| `TOOL_REVERTIR_CAMBIO_WF_ID` | ID del workflow tool revertir_cambio |
| `TOOL_PROGRAMAR_CAMBIO_WF_ID` | ID del workflow tool programar_cambio |

---

## Variables de entorno n8n (en el VPS)

Agregar en el `docker-compose.yml` o en el archivo `.env` de n8n:

```env
# URL base de Evolution API (usada en expresiones de HTTP Request)
N8N_CUSTOM_EXTENSIONS_EVOLUTION_API_URL=https://evolution.tudominio.com

# Cloudinary (usadas en nodos Code de WF-B para subir imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## Configuración del webhook en Evolution API

Por cada cliente, configurar el webhook en Evolution API:

```bash
POST {EVOLUTION_URL}/webhook/set/{instancia}
{
  "url": "https://n8n.tudominio.com/webhook/{webhook_path_de_wfa}",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

El header secreto se envía como `X-Webhook-Secret: {webhook_secret}`.
El `webhook_secret` se genera al provisionar el cliente con `provision_cliente.js`.

---

## Verificación post-configuración

```bash
# 1. Verificar que la BD tiene todos los schemas
psql $DATABASE_URL -c "\dn"

# 2. Verificar clientes registrados
psql $DATABASE_URL -c "SELECT cliente_id, nombre, activo FROM public.clientes"

# 3. Verificar workflows activos en n8n
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  "$N8N_URL/api/v1/workflows?active=true" | jq '.data[].name'

# 4. Verificar webhook de WF-A
curl -X POST "$N8N_URL/webhook-test/{path}" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: {secret}" \
  -d '{"event":"test"}'
```
