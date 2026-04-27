# CatalogBot — Gestor de Catálogo vía WhatsApp

Sistema multi-cliente de gestión de catálogo de productos vía WhatsApp con IA.
Orquestado en n8n, con aislamiento total por cliente en PostgreSQL y Claude Sonnet
como agente principal.

---

## Quick Start

Pasos para empezar a trabajar en este proyecto desde cero:

```bash
# 1. Clonar el repo y entrar al directorio
cd CatalogBot

# 2. Copiar variables de entorno y completar valores reales
cp .env.example .env
# Editar .env con los valores reales antes de continuar

# 3. Aplicar migraciones del schema público
node scripts/migrate.js

# 4. Provisionara el primer cliente de prueba
node scripts/provision_cliente.js \
  cli_00001 "Cliente Demo" woocommerce \
  https://demo.com instancia_demo \
  573001234567 "Admin Demo"

# 5. Importar workflows en n8n (en orden)
# WF-C → WF-D → WF-A → WF-B → WF-E
# Importar cada JSON via: PATCH {N8N_URL}/api/v1/workflows/{id}

# 6. Validar un workflow antes de importar
node scripts/validate_workflow.js workflows/WF-A_receptor.json

# 7. Prueba de humo: enviar mensaje WhatsApp → verificar respuesta del bot
```

**Archivos clave para orientarse:**
- `prompts/system_prompt.md` — system prompt del AI Agent (leer antes de tocar WF-B)
- `db/migrations/` — definición completa del schema de BD
- `adapters/` — interfaces de ecommerce implementadas
- `schemas/tools/` — schemas JSON de cada tool del agente
- `docs/arquitectura.md` — decisiones de diseño ampliadas

---

## Estado actual del proyecto

| Fase | Componente | Estado | Notas |
|---|---|---|---|
| **Base de datos** | Migración public.clientes | ✅ | `db/migrations/20240417_000_public_setup.sql` |
| **Base de datos** | Migración schema cliente | ✅ | `db/migrations/20240417_001_schema_cliente.sql` |
| **Base de datos** | Migración credenciales_api | ✅ | `db/migrations/20240417_002_add_credenciales_api.sql` |
| **Base de datos** | Script provision_cliente.js | ✅ | `scripts/provision_cliente.js` |
| **Base de datos** | Script migrate.js | ✅ | `scripts/migrate.js` |
| **Adapters** | WooCommerce adapter | ✅ | `adapters/woocommerce.js` |
| **Adapters** | Shopify adapter | ✅ | `adapters/shopify.js` |
| **Schemas** | 15 schemas de tools JSON | ✅ | `schemas/tools/*.json` |
| **Prompts** | system_prompt.md inicial | ✅ | `prompts/system_prompt.md` |
| **Workflows** | WF-C Gestor de sesiones | ✅ | 14 nodos · PASS |
| **Workflows** | WF-D Auditoría | ✅ | 14 nodos · PASS |
| **Workflows** | WF-A Receptor y enrutador | ✅ | 25 nodos · PASS |
| **Workflows** | WF-B Agente principal | ✅ | 38 nodos · PASS |
| **Workflows** | WF-E Scheduler | ✅ | 24 nodos · PASS |
| **Scripts** | validate_workflow.js | ✅ | `scripts/validate_workflow.js` |
| **Scripts** | test_tools.js | ✅ | `scripts/test_tools.js` |
| **Tests** | test_fuzzy_search.js | ✅ | 15/15 · `tests/unit/test_fuzzy_search.js` |
| **Tests** | test_permisos.js | ✅ | 49/49 · `tests/unit/test_permisos.js` |
| **Tests** | test_woocommerce.js | ✅ | `tests/integration/test_woocommerce.js` (requiere credenciales reales) |
| **Tests** | test_shopify.js | ✅ | `tests/integration/test_shopify.js` (requiere credenciales reales) |
| **Docs** | configuracion_sistema.md | ✅ | `docs/configuracion_sistema.md` |
| **Docs** | checklist_verificacion.md | ✅ | `docs/checklist_verificacion.md` |
| **Docs** | ONBOARDING_CLIENTE.md | ✅ | `ONBOARDING_CLIENTE.md` |
| **Docs** | README.md | ✅ | `README.md` |
| **Integración** | Prueba de humo cliente demo | ⬜ | Requiere instancia n8n + Evolution API activas |

Leyenda: ✅ Completo · ⏳ En progreso · ⬜ Pendiente

---

## Descripción del sistema

CatalogBot permite a usuarios autorizados de cualquier negocio con ecommerce
gestionar su catálogo de productos enviando mensajes y fotos por WhatsApp,
sin necesidad de acceder a ningún panel web.

**Capacidades:**
- Crear, buscar, actualizar y eliminar productos
- Modificar precios individuales y por categoría (masivo)
- Crear y eliminar descuentos (porcentaje, monto fijo, precio especial)
- Subir imágenes de productos con análisis automático via IA
- Programar cambios futuros con confirmación
- Auditar y revertir cambios realizados
- Sistema de roles (admin / editor / viewer)

**El sistema es genérico.** Los "productos" pueden ser artículos físicos,
servicios, platos de menú, tratamientos, cursos, membresías, o cualquier
entidad que el ecommerce del cliente maneje como producto. No asumir nada
sobre el tipo de negocio al diseñar o extender el sistema.

---

## Principio de aislamiento por cliente

**Este es el principio de diseño más importante del sistema. Es no negociable.**

Cada cliente es un mundo completamente separado en todas las capas:

| Capa | Aislamiento |
|---|---|
| PostgreSQL | Schema propio `cli_XXXXX`. Ninguna query cruza schemas. |
| Cloudinary | Subcarpeta raíz `/{cliente_id}/` o cuenta separada si se exige. |
| Evolution API | Instancia propia con número de WhatsApp propio. |
| n8n | Credential de ecommerce nombrada con `cliente_id`. Sin hardcoding. |
| Auditoría | Tabla `auditoria` dentro del schema del cliente. |
| Backups | Cada schema se vuelca y restaura independientemente. |

**Violaciones de este principio son bugs de seguridad, no mejoras pendientes.**

Si una implementación propuesta requiere cruzar datos entre schemas,
el diseño es incorrecto y debe revisarse antes de continuar.

---

## Stack tecnológico

| Componente | Tecnología | Notas |
|---|---|---|
| Orquestador | n8n self-hosted | VPS Hostinger Ubuntu |
| Canal de mensajería | WhatsApp Business API via Evolution API v2 | Una instancia por cliente |
| IA principal | Claude Sonnet (Anthropic API) | Texto + visión |
| Base de datos | PostgreSQL en mismo VPS | Schema por cliente |
| Almacenamiento de imágenes | Cloudinary | Carpeta por cliente |
| Ecommerce soportado | WooCommerce, Shopify | Extensible via adapter pattern |
| Entorno de desarrollo | VS Code + Claude Code | |
| Gestión de código | Git + GitHub | |

---

## Arquitectura de base de datos

### Schema público (sistema)

```sql
CREATE TABLE public.clientes (
  cliente_id          VARCHAR(20) PRIMARY KEY,
  nombre              VARCHAR(255) NOT NULL,
  activo              BOOLEAN DEFAULT true,
  fecha_registro      TIMESTAMPTZ DEFAULT NOW(),
  ecommerce_tipo      VARCHAR(50) NOT NULL,
  ecommerce_url       TEXT NOT NULL,
  n8n_credential_name VARCHAR(100) NOT NULL,
  cloudinary_folder   VARCHAR(100) NOT NULL,
  whatsapp_instance   VARCHAR(100) NOT NULL,
  webhook_secret      TEXT NOT NULL  -- cifrado con pgcrypto
);
```

### Schema por cliente

Cada cliente tiene su propio schema creado durante el onboarding.
`scripts/provision_cliente.js` ejecuta las migraciones reemplazando
`{schema}` por el `cliente_id` real.

```sql
-- usuarios autorizados del cliente
CREATE TABLE {schema}.usuarios (
  telefono        VARCHAR(20) PRIMARY KEY,
  nombre          VARCHAR(255) NOT NULL,
  rol             VARCHAR(20) NOT NULL CHECK (rol IN ('admin','editor','viewer')),
  activo          BOOLEAN DEFAULT true,
  fecha_registro  TIMESTAMPTZ DEFAULT NOW()
);

-- estado de conversación por número
CREATE TABLE {schema}.sesiones (
  telefono            VARCHAR(20) PRIMARY KEY,
  estado              VARCHAR(50) NOT NULL DEFAULT 'idle',
  paso                VARCHAR(100),
  datos_pendientes    JSONB,
  timestamp_inicio    TIMESTAMPTZ DEFAULT NOW(),
  timestamp_update    TIMESTAMPTZ DEFAULT NOW(),
  expira              TIMESTAMPTZ,
  lock_timestamp      TIMESTAMPTZ
);

-- historial de mensajes para reconstruir contexto del AI Agent
CREATE TABLE {schema}.historial_conversacion (
  id           SERIAL PRIMARY KEY,
  telefono     VARCHAR(20) NOT NULL,
  turno        INTEGER NOT NULL,
  rol          VARCHAR(20) NOT NULL CHECK (rol IN ('user','assistant')),
  contenido    TEXT NOT NULL,
  tokens_aprox INTEGER,
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON {schema}.historial_conversacion (telefono, turno DESC);

-- registro de cambios para auditoría y reversión
CREATE TABLE {schema}.auditoria (
  id              SERIAL PRIMARY KEY,
  timestamp       TIMESTAMPTZ DEFAULT NOW(),
  telefono        VARCHAR(20) NOT NULL,
  usuario_nombre  VARCHAR(255),
  rol             VARCHAR(20),
  accion          VARCHAR(100) NOT NULL,
  producto_id     VARCHAR(100),
  producto_nombre VARCHAR(255),
  campo           VARCHAR(100),
  valor_anterior  TEXT,
  valor_nuevo     TEXT,
  revertido       BOOLEAN DEFAULT false,
  revertido_en    TIMESTAMPTZ
);

-- cambios programados para ejecución futura
CREATE TABLE {schema}.programados (
  id                  SERIAL PRIMARY KEY,
  timestamp_creacion  TIMESTAMPTZ DEFAULT NOW(),
  timestamp_ejecucion TIMESTAMPTZ NOT NULL,
  telefono            VARCHAR(20) NOT NULL,
  accion              VARCHAR(100) NOT NULL,
  datos_json          JSONB NOT NULL,
  estado              VARCHAR(20) DEFAULT 'pendiente'
                      CHECK (estado IN ('pendiente','ejecutado','cancelado','error')),
  timestamp_ejecutado TIMESTAMPTZ,
  intentos            INTEGER DEFAULT 0
);
CREATE INDEX ON {schema}.programados (timestamp_ejecucion, estado);

-- errores del sistema para monitoreo y alertas
CREATE TABLE {schema}.errores (
  id            SERIAL PRIMARY KEY,
  timestamp     TIMESTAMPTZ DEFAULT NOW(),
  workflow      VARCHAR(50),
  nodo          VARCHAR(100),
  telefono      VARCHAR(20),
  error_tipo    VARCHAR(100),
  error_detalle TEXT,
  notificado    BOOLEAN DEFAULT false
);

-- métricas agregadas diarias para dashboard de admin
CREATE TABLE {schema}.metricas_diarias (
  fecha               DATE PRIMARY KEY,
  total_mensajes      INTEGER DEFAULT 0,
  total_cambios       INTEGER DEFAULT 0,
  total_errores       INTEGER DEFAULT 0,
  tokens_consumidos   INTEGER DEFAULT 0,
  costo_estimado_usd  NUMERIC(10,4) DEFAULT 0
);
```

### Reglas de uso de BD en n8n

- Usar el nodo nativo Postgres de n8n (no HTTP Request a la BD)
- Toda query califica el schema explícitamente: `cli_00001.sesiones`
- El `cliente_id` se resuelve en WF-A desde `public.clientes` usando `whatsapp_instance`
- **Nunca usar `SET search_path` dinámico** — siempre calificar el schema
- n8n usa pool de conexiones; no crear una conexión por mensaje
- Queries con escritura concurrente usan `SELECT FOR UPDATE` dentro de transacción

---

## Arquitectura de workflows

### Orden de construcción (menor a mayor dependencia)

```
WF-C → WF-D → WF-A → WF-B → WF-E
```

### WF-A: Receptor y enrutador

**Trigger:** Webhook (Evolution API v2)

| Paso | Nodo | Descripción |
|---|---|---|
| 1 | Webhook | Recibe payload de Evolution API |
| 2 | Validar header secreto webhook | Retorna HTTP 401 si falla; no procesa nada |
| 3 | Ignorar mensajes propios | Si `data.key.fromMe === true`, salir |
| 4 | Resolver cliente desde instancia | `SELECT` en `public.clientes` por `whatsapp_instance` |
| 5 | Validar usuario activo | `SELECT` en `{schema}.usuarios` por `telefono` |
| 6 | Detectar tipo de mensaje | Switch por `data.messageType` |
| 7 | Adquirir lock de sesión | `SELECT FOR UPDATE` en `{schema}.sesiones` |
| 8 | Verificar lock activo | Si `lock_timestamp < 30s`, descartar con aviso |
| 9 | Llamar WF-B | Sub-workflow call con payload enriquecido |

### WF-B: Agente principal

**Trigger:** Sub-workflow call desde WF-A

| Parámetro AI Agent | Valor |
|---|---|
| Modelo | Claude Sonnet |
| Temperatura | 0.2 |
| Max tokens por request | 1500 |
| Historial reconstruido | Últimos 10 turnos desde `{schema}.historial_conversacion` |
| Tools disponibles | 15 (ver sección Tools) |

Flujo:
1. Reconstruir historial de conversación desde PostgreSQL
2. Agregar mensaje actual como último elemento del array
3. Llamar al AI Agent con las 15 tools disponibles
4. Validar permisos de rol antes de ejecutar cualquier tool
5. Flujo de confirmación antes de ejecutar cambios (ver `datos_pendientes`)
6. Insertar respuesta en `{schema}.historial_conversacion`
7. Enviar respuesta al usuario via Evolution API
8. Llamar WF-D para auditoría (async, no bloquea respuesta)

### WF-C: Gestor de sesiones

**Trigger:** Sub-workflow call

Operaciones:
- Leer estado de sesión: `SELECT * FROM {schema}.sesiones WHERE telefono = $1`
- Escribir estado: `BEGIN; SELECT FOR UPDATE; UPDATE; COMMIT;`
- Actualizar `lock_timestamp` para control de concurrencia
- Marcar sesión como `idle` tras expiración

### WF-D: Auditoría

**Trigger:** Sub-workflow call (asíncrono)

- Inserta en `{schema}.auditoria` tras cada cambio exitoso
- Si falla el INSERT: escribe en `{schema}.errores` y notifica al admin
- **Nunca bloquea la respuesta al usuario**

### WF-E: Scheduler

**Trigger:** Schedule Trigger (cada 15 minutos)

Por cada cliente activo en `public.clientes`:
1. Limpiar sesiones expiradas (marcar como `idle`)
2. Ejecutar programados pendientes cuyo `timestamp_ejecucion <= NOW()`
3. Verificar conflicto antes de ejecutar: si usuario tiene `estado = 'pendiente_confirmacion'`, retrasar 10 min e incrementar `intentos`
4. Calcular y escribir métricas diarias en `{schema}.metricas_diarias`
5. Detectar 5+ errores del mismo tipo en 10 minutos → alerta WhatsApp al admin
6. Purgar `historial_conversacion` con más de 30 días de antigüedad

---

## Payload de Evolution API v2

Estructura exacta que llega al webhook de WF-A:

```json
{
  "event": "messages.upsert",
  "instance": "nombre_instancia",
  "data": {
    "key": {
      "remoteJid": "573001234567@s.whatsapp.net",
      "fromMe": false,
      "id": "MESSAGE_ID"
    },
    "pushName": "Nombre Usuario",
    "messageType": "imageMessage",
    "message": {
      "imageMessage": {
        "url": "https://...",
        "mimetype": "image/jpeg",
        "caption": "texto que acompaña la imagen",
        "fileLength": "123456",
        "mediaKey": "...",
        "directPath": "..."
      }
    },
    "messageTimestamp": 1713000000,
    "instanceId": "...",
    "serverUrl": "https://evolution.tudominio.com",
    "apiKey": "..."
  }
}
```

**Reglas de extracción:**

| Campo | Extracción |
|---|---|
| Número remitente | `data.key.remoteJid` → remover `@s.whatsapp.net` |
| Filtro mensajes propios | Ignorar si `data.key.fromMe === true` |
| Resolución de cliente | `data.instance` → `SELECT` en `public.clientes WHERE whatsapp_instance = data.instance` |
| Tipo de mensaje | `data.messageType` |
| Texto plano | `data.message.conversation` o `data.message.extendedTextMessage.text` |
| Imagen | Descargar via `POST /chat/getBase64FromMediaMessage/{instance}` |

**Descarga de imagen:**
```
POST {EVOLUTION_URL}/chat/getBase64FromMediaMessage/{instance}
Body: { "message": { "key": data.key, "message": data.message } }
Respuesta: { "base64": "...", "mimetype": "image/jpeg" }
```

---

## Formato de datos_pendientes (JSONB)

Campo en `{schema}.sesiones` que almacena el estado de una acción
pendiente de confirmación:

```json
{
  "accion": "actualizar_precio",
  "tool_a_ejecutar": "actualizar_precio",
  "parametros": {
    "producto_id": "1234",
    "producto_nombre": "Camiseta Azul M",
    "campo": "precio",
    "valor_anterior": 89900,
    "valor_nuevo": 75000,
    "variante_id": null,
    "cliente_id": "cli_00001"
  },
  "resumen_para_usuario": "Producto: Camiseta Azul M\nPrecio actual: $89.900\nPrecio nuevo: $75.000",
  "timestamp_creacion": "2024-04-17T10:30:00Z",
  "expira": "2024-04-17T10:35:00Z",
  "requiere_doble_confirmacion": false
}
```

- `requiere_doble_confirmacion: true` para `eliminar_producto` y `precio_masivo`
- Doble confirmación: usuario debe escribir exactamente `CONFIRMAR ELIMINAR`
  o `CONFIRMAR MASIVO` en lugar de solo `CONFIRMAR`
- Si el campo `expira` ya pasó, la acción es descartada y el usuario debe reiniciar

---

## Estrategia de historial de conversación

n8n no persiste estado entre ejecuciones. La solución usa
`{schema}.historial_conversacion` en PostgreSQL.

**Reconstrucción en cada turno:**

```sql
SELECT rol, contenido
FROM {schema}.historial_conversacion
WHERE telefono = $1
ORDER BY turno DESC
LIMIT 10
```

1. Invertir el resultado para orden cronológico
2. Construir el array `messages` para Claude API
3. Agregar el mensaje actual como último elemento
4. Llamar al AI Agent
5. Insertar respuesta con `turno = MAX(turno) + 1`

**Límite de tokens:**
- Si suma de `tokens_aprox` supera 6000 → truncar desde los más antiguos
- Nunca truncar el turno 1 (primera interacción de la sesión)

**Reset de historial:**
- Automático: WF-E marca sesión como `idle` tras 30 minutos de inactividad
- Manual: usuario escribe "nueva consulta" o "reiniciar"
- El historial no se elimina al resetear; WF-E lo purga tras 30 días

---

## Tools del AI Agent (15 tools)

Cada tool tiene su schema JSON en `schemas/tools/{nombre_tool}.json`.
Todos incluyen `cliente_id` como parámetro obligatorio.

### Gestión de productos

| # | Tool | Parámetros | Notas |
|---|---|---|---|
| 1 | `buscar_producto` | `query, cliente_id, limite?` | Fuzzy; si confianza <80% retorna lista numerada de candidatos |
| 2 | `obtener_producto` | `producto_id, cliente_id` | Detalle completo con variantes |
| 3 | `crear_producto` | `datos, cliente_id` | datos: `{nombre, descripcion, precio, categoria_id, sku?, imagen_url?}` |
| 4 | `actualizar_producto` | `producto_id, campos, cliente_id` | PATCH campos generales; no usar para precio |
| 5 | `eliminar_producto` | `producto_id, cliente_id` | Requiere doble confirmación siempre |
| 6 | `listar_categorias` | `cliente_id` | Retorna id y nombre de todas las categorías |

### Precios y descuentos

| # | Tool | Parámetros | Notas |
|---|---|---|---|
| 7 | `actualizar_precio` | `producto_id, precio, cliente_id, variante_id?` | Usar solo esta tool para cambios de precio |
| 8 | `crear_descuento` | `producto_id, tipo, valor, cliente_id, fecha_inicio?, fecha_fin?` | tipo: `porcentaje \| monto_fijo \| precio_especial` |
| 9 | `eliminar_descuento` | `producto_id, cliente_id, descuento_id?` | |
| 10 | `precio_masivo` | `categoria_id, tipo_cambio, valor, cliente_id` | tipo_cambio: `porcentaje_aumento \| porcentaje_descuento \| precio_fijo`; máx 100 productos; doble confirmación |

### Imágenes

| # | Tool | Parámetros | Notas |
|---|---|---|---|
| 11 | `subir_imagen` | `base64, mimetype, cliente_id` | Valida ≤5MB antes de subir; sube a `/{cliente_id}/` en Cloudinary; si falla → error explícito |
| 12 | `analizar_imagen` | `base64` | Claude Vision → `{nombre_probable, descripcion, caracteristicas[], nivel_confianza}` |

### Control y auditoría

| # | Tool | Parámetros | Notas |
|---|---|---|---|
| 13 | `ver_historial` | `cliente_id, filtros?` | filtros: `{usuario?, producto_id?, fecha_desde?, limite?}`; máx 50 registros |
| 14 | `revertir_cambio` | `auditoria_id, cliente_id` | Solo admin; valida `revertido = false` antes de proceder |
| 15 | `programar_cambio` | `accion, datos, fecha_ejecucion, cliente_id` | Valida fecha futura; inserta en `{schema}.programados`; retorna id |

---

## Sistema de roles

| Tool | admin | editor | viewer |
|---|---|---|---|
| `buscar_producto` | ✅ | ✅ | ✅ |
| `obtener_producto` | ✅ | ✅ | ✅ |
| `ver_historial` | ✅ todos | ✅ todos | ✅ solo propio |
| `listar_categorias` | ✅ | ✅ | ✅ |
| `actualizar_precio` | ✅ | ✅ | ❌ |
| `crear_descuento` | ✅ | ✅ | ❌ |
| `eliminar_descuento` | ✅ | ✅ | ❌ |
| `crear_producto` | ✅ | ✅ | ❌ |
| `actualizar_producto` | ✅ | ✅ | ❌ |
| `subir_imagen` | ✅ | ✅ | ❌ |
| `analizar_imagen` | ✅ | ✅ | ❌ |
| `programar_cambio` | ✅ | ✅ | ❌ |
| `precio_masivo` | ✅ | ❌ | ❌ |
| `eliminar_producto` | ✅ | ❌ | ❌ |
| `revertir_cambio` | ✅ | ❌ | ❌ |

### Comandos de gestión via WhatsApp (solo admin)

```
agregar [rol] [telefono] [nombre]
listar usuarios
desactivar [telefono]
ver cambios de hoy
revertir último cambio de [nombre_producto]
ver programados pendientes
cancelar programado #[id]
estado del sistema
```

---

## Adapters de ecommerce

Interfaz común que todo adapter debe implementar:

```javascript
{
  buscarProducto(query, credenciales)
  obtenerProducto(id, credenciales)
  crearProducto(datos, credenciales)
  actualizarProducto(id, campos, credenciales)
  eliminarProducto(id, credenciales)
  listarCategorias(credenciales)
  actualizarPrecio(id, precio, credenciales, varianteId?)
  crearDescuento(id, tipo, valor, credenciales, fechas?)
  eliminarDescuento(id, credenciales, descuentoId?)
  precioMasivo(categoriaId, tipo, valor, credenciales)
}
```

**Para agregar nueva plataforma:**
1. Crear `/adapters/{plataforma}.js` implementando la interfaz completa
2. Documentar el valor de `ecommerce_tipo` a registrar en `public.clientes`
3. Actualizar `docs/arquitectura.md` con particularidades del adapter
4. Agregar tests en `tests/integration/test_{plataforma}.js`

**Particularidades por plataforma:**

| Plataforma | Auth | Precios en variantes | Rate limiting |
|---|---|---|---|
| WooCommerce | Basic Auth (consumer_key + consumer_secret) | Opcional | Standard HTTP 429 |
| Shopify | Header `X-Shopify-Access-Token` | Siempre (variants[0].price) | 429 con header `Retry-After` |

---

## Seguridad

**Webhook:**
- WF-A valida el header secreto en el primer nodo antes de cualquier procesamiento
- Secreto almacenado en `public.clientes.webhook_secret` (cifrado con pgcrypto)
- Requests inválidos: HTTP 401, sin procesamiento adicional

**Sanitización de inputs:**

| Campo | Validación |
|---|---|
| Campos de texto del usuario | Strip de HTML antes de procesar |
| Precios | Número positivo mayor a cero |
| Porcentajes de descuento | Entre 1 y 99 |
| Longitud de campos | Según restricciones de cada adapter |

**Rotación de credenciales comprometidas:**
1. Actualizar en n8n Credentials
2. Actualizar referencia en `public.clientes` si aplica
3. Revocar y regenerar en el sistema de origen
4. No requiere downtime ni cambios en workflows

**Backups por cliente:**
```bash
# Backup de un cliente específico
pg_dump -n cli_00001 catalogbot > backup_cli_00001_$(date +%Y%m%d).sql

# Backup del schema público
pg_dump -n public catalogbot > backup_public_$(date +%Y%m%d).sql
```
Frecuencia recomendada: diaria, retención 30 días.

---

## Límites técnicos y umbrales

| Sistema | Límite | Manejo |
|---|---|---|
| PostgreSQL conexiones | Según config VPS (default 100) | Pool de conexiones en n8n; no crear conexión por mensaje |
| Anthropic API | Según tier contratado | Retry con backoff exponencial, máx 3 intentos |
| Evolution API imagen | ~16MB límite WhatsApp | Rechazar >5MB antes de subir a Cloudinary |
| WhatsApp mensaje | ~4096 caracteres | Truncar y ofrecer continuar en siguiente mensaje |
| Cloudinary free | 25GB storage, 25 créditos/mes | Loguear en `{schema}.errores` si uso >80% |
| `precio_masivo` | 100 productos máximo | Rechazar, informar cantidad afectada, pedir dividir |
| `ver_historial` | 50 registros por query | Informar que muestra los 50 más recientes |
| Contexto AI Agent | 6000 tokens de historial | Truncar turnos más antiguos al reconstruir |

---

## Manejo de concurrencia

**Mensajes simultáneos del mismo número:**

```sql
-- WF-A ejecuta en transacción
BEGIN;
SELECT lock_timestamp FROM {schema}.sesiones
  WHERE telefono = $1 FOR UPDATE;
-- Si lock_timestamp > NOW() - interval '30 seconds': descartar
UPDATE {schema}.sesiones
  SET lock_timestamp = NOW()
  WHERE telefono = $1;
COMMIT;
```

**Conflicto WF-E y sesión activa:**

```sql
-- WF-E verifica antes de ejecutar un programado
SELECT estado FROM {schema}.sesiones
  WHERE telefono = $1 AND estado = 'pendiente_confirmacion';
-- Si existe: retrasar 10 minutos e incrementar intentos en programados
```

---

## Estrategia de reintentos y circuit breaker

**APIs externas (ecommerce, Cloudinary, Anthropic):**
- Máximo 3 reintentos
- Backoff exponencial: 1s → 3s → 9s
- En n8n: nodo Wait entre reintentos con contador en el item JSON

**PostgreSQL:**
- Máximo 2 reintentos (falla rápido para no bloquear la conversación)
- Si falla WF-D (auditoría): registrar en `{schema}.errores`, notificar admin, no bloquear respuesta

**Circuit breaker:**
- WF-E detecta 5+ errores en `{schema}.errores` en menos de 10 minutos
- Envía alerta WhatsApp al admin del cliente afectado
- Admin puede desactivar cliente via `public.clientes.activo = false` sin tocar n8n

**Mensajes de error al usuario (siempre en español, nunca técnicos):**

| Situación | Mensaje al usuario |
|---|---|
| API ecommerce caída | "Estoy teniendo problemas para conectarme al catálogo. Por favor intenta en unos minutos." |
| Producto no encontrado | "No encontré ese producto. ¿Puedes darme más detalles o el SKU exacto?" |
| Sin permisos | "No tienes permiso para realizar esa acción." |
| Timeout de sesión | "Tu operación anterior expiró. Puedes empezar de nuevo cuando quieras." |
| Error desconocido | "Ocurrió un error inesperado. Ya fue registrado y el administrador fue notificado." |

---

## Casos edge

| Caso | Comportamiento |
|---|---|
| Usuario envía audio | "Por ahora solo proceso texto e imágenes. ¿Puedes escribirlo?" |
| Usuario envía PDF | "No puedo procesar PDFs. Envía la información en texto o imagen." |
| Usuario envía sticker | Ignorar silenciosamente |
| Número no registrado | Respuesta genérica sin revelar si el sistema existe |
| Producto no existe y usuario insiste en modificarlo | Ofrecer crear el producto como alternativa |
| `precio_masivo` afecta >100 productos | Rechazar, informar cantidad y pedir dividir por subcategoría |
| Ecommerce rechaza el cambio | Mostrar error del ecommerce traducido a lenguaje simple |
| Usuario escribe en otro idioma | Responder en ese idioma; avisar que el sistema está optimizado para español |
| Imagen de baja calidad | `analizar_imagen` retorna `nivel_confianza: bajo` → pedir imagen más clara |
| Producto eliminado antes de ejecutar programado | WF-E detecta 404, cancela programado, notifica usuario |
| Admin intenta revertir cambio ya revertido | Bloquear, informar con timestamp del revert anterior |
| Tool no definida invocada por Claude | Rechazar, responder con error genérico en español sin exponer detalles técnicos |

---

## Monitoreo y alertas

**Alertas inmediatas al admin del cliente (WhatsApp):**
- 5+ errores del mismo tipo en 10 minutos
- PostgreSQL retorna error de conexión
- Evolution API no responde
- Cloudinary >80% del límite

**Métricas diarias:**
WF-E calcula y escribe en `{schema}.metricas_diarias` al cierre del día.

**Consulta de estado vía WhatsApp (solo admin):**
Comando `estado del sistema` → resumen de últimas 24h desde `metricas_diarias`.

---

## Deploy y actualizaciones

### Flujo VS Code → VPS

```bash
# 1. Desarrollar y probar en Docker local (misma versión n8n del VPS)
# 2. Exportar workflow como JSON desde n8n UI
# 3. Guardar en workflows/ y commitear
git add workflows/WF-B_agente.json
git commit -m "Actualiza WF-B: agrega tool programar_cambio"
git push

# 4. En VPS
ssh user@vps
cd /path/to/catalogbot
git pull

# 5. Importar via API de n8n
curl -X PATCH \
  -H "X-N8N-API-KEY: {N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @workflows/WF-B_agente.json \
  https://n8n.tudominio.com/api/v1/workflows/{id}
```

### Actualización sin interrumpir conversaciones activas

Antes de actualizar WF-B, verificar sesiones activas:

```sql
SELECT COUNT(*) FROM {schema}.sesiones
  WHERE estado = 'pendiente_confirmacion';
-- Si hay sesiones activas: esperar o notificar a los usuarios afectados
```

### Rollback de workflow

Versiones anteriores guardadas en `workflows/history/` con timestamp.
Para rollback: importar versión anterior via API de n8n.

### Migraciones de BD

- Cada cambio de schema en `db/migrations/`
- Nombre: `{timestamp}_{descripcion}.sql`
- Aplicar con `node scripts/migrate.js`
- **Nunca modificar una migración ya aplicada; crear una nueva**

---

## Onboarding de cliente nuevo

El proceso completo está en `ONBOARDING_CLIENTE.md` (se genera al finalizar el build).

Pasos del script:
```bash
node scripts/provision_cliente.js \
  cli_00001           \  # cliente_id (único, sin espacios)
  "Nombre Empresa"    \  # nombre visible
  woocommerce         \  # ecommerce_tipo
  https://tienda.com  \  # ecommerce_url
  instancia_wa        \  # nombre instancia en Evolution API
  573001234567        \  # teléfono del admin inicial
  "Nombre Admin"         # nombre del admin inicial
```

El script ejecuta en orden:
1. INSERT en `public.clientes`
2. `CREATE SCHEMA {cliente_id}`
3. Todas las migraciones de `db/migrations/` sobre el schema nuevo
4. INSERT del usuario admin en `{cliente_id}.usuarios`

Pasos manuales post-script:
5. Crear instancia en Evolution API y conectar número WhatsApp
6. Configurar webhook apuntando a WF-A con header secreto
7. Crear Credential en n8n con credenciales de ecommerce del cliente
8. Crear subcarpeta `/{cliente_id}/` en Cloudinary
9. Prueba de humo: WhatsApp → respuesta bot → verificar registros en PostgreSQL

---

## Estructura de carpetas

```
catalogbot/
├── CLAUDE.md
├── ONBOARDING_CLIENTE.md        ← generar al finalizar el build
├── README.md
├── .env.example
├── .env                         ← no commitear nunca
├── workflows/
│   ├── WF-A_receptor.json
│   ├── WF-B_agente.json
│   ├── WF-C_sesiones.json
│   ├── WF-D_auditoria.json
│   ├── WF-E_scheduler.json
│   └── history/                 ← versiones anteriores con timestamp
├── prompts/
│   ├── system_prompt.md         ← leer antes de cualquier cambio a WF-B
│   └── history/
├── schemas/
│   └── tools/                   ← un .json por tool del agente
├── adapters/
│   ├── woocommerce.js
│   └── shopify.js
├── db/
│   ├── migrations/
│   │   ├── 20240417_000_public_setup.sql
│   │   └── 20240417_001_schema_cliente.sql
│   └── seeds/
│       └── test_cliente.sql
├── scripts/
│   ├── provision_cliente.js
│   ├── migrate.js
│   ├── test_tools.js
│   └── validate_workflow.js
├── tests/
│   ├── integration/
│   └── unit/
└── docs/
    ├── arquitectura.md
    ├── comandos_usuario.md
    └── payload_evolution_api.md
```

---

## Convenciones del proyecto

| Elemento | Convención |
|---|---|
| Workflows n8n | Prefijo `WF-` + letra + nombre: `WF-A_receptor` |
| Nombres de nodos en n8n | Descriptivos en español: "Validar header secreto webhook" |
| Tools del agente | Verbo en snake_case, siempre con `cliente_id`: `actualizar_precio` |
| Variables n8n | camelCase |
| Archivos | snake_case excepto `CLAUDE.md` y `README.md` |
| Commits | Español, imperativo: "Agrega tool precio_masivo" |
| Código y comentarios | Español |
| Nombres de variables y funciones en código | Inglés |
| Queries SQL | Schema siempre calificado explícitamente |
| Migraciones | Un archivo por cambio; nunca modificar las ya aplicadas |
| Versionado de prompts y workflows | Copiar a `history/` antes de modificar; el archivo activo nunca lleva timestamp |

---

## Decisiones de arquitectura

### PostgreSQL con schemas por cliente vs Google Sheets u otra solución

**Decisión:** PostgreSQL con un schema por cliente.

**Por qué:**
- Google Sheets no soporta transacciones, no tiene control de concurrencia y no escala
  más allá de unas pocas decenas de operaciones por minuto.
- Una sola BD con tabla compartida y columna `cliente_id` es una bomba de tiempo:
  un bug de filtro expone datos de todos los clientes al mismo tiempo.
- Los schemas de PostgreSQL dan aislamiento a nivel de motor: un error en las queries
  de un cliente no puede afectar físicamente las tablas de otro.
- `pg_dump -n cli_00001` permite backup y restauración quirúrgica por cliente sin
  tocar el resto del sistema.
- La extensión pgcrypto, `SELECT FOR UPDATE`, y las transacciones son requisitos
  no negociables para el control de concurrencia de sesiones.

### n8n AI Agent nativo vs HTTP Requests manuales a la API de Anthropic

**Decisión:** Nodo AI Agent nativo de n8n con tool calling.

**Por qué:**
- El nodo AI Agent de n8n maneja el ciclo tool-call → tool-result → respuesta
  automáticamente, incluyendo múltiples rondas de herramientas en un solo turno.
- Hacerlo con HTTP Requests manuales requeriría implementar el loop de tool calling
  a mano, con más nodos, más superficie de error y código menos mantenible.
- El nodo nativo integra con el sistema de credenciales de n8n, eliminando
  la necesidad de manejar API keys en expressions.
- La temperatura y el límite de tokens se configuran directamente en el nodo,
  sin necesidad de construir el payload completo de la API manualmente.

### Adapter pattern para ecommerce

**Decisión:** Interfaz común implementada por cada plataforma en su propio archivo.

**Por qué:**
- WooCommerce y Shopify tienen APIs radicalmente diferentes: autenticación distinta,
  estructura de precios distinta (Shopify pone los precios en variants, no en el
  producto raíz), y distintos mecanismos de rate limiting.
- Sin un adapter, WF-B necesitaría tener ramificaciones por plataforma en cada
  operación, haciendo el workflow inmantenible.
- Con el adapter, WF-B solo habla con la interfaz común. Agregar Magento, Tienda
  Nube o cualquier otra plataforma es agregar un archivo sin tocar ningún workflow.
- Los adapters son testables unitariamente sin necesidad de un entorno n8n.

### Cloudinary para imágenes

**Decisión:** Cloudinary como capa de almacenamiento y CDN para imágenes.

**Por qué:**
- Las imágenes recibidas por WhatsApp son base64 en memoria. Necesitan un destino
  permanente con URL pública para ser asignadas a los productos en el ecommerce.
- Cloudinary provee transformaciones en el momento de servir (resize, formato WebP)
  sin costo adicional de procesamiento en el servidor.
- La organización por carpetas `/{cliente_id}/` mantiene el principio de aislamiento
  por cliente en la capa de medios.
- El SDK de Cloudinary maneja reintentos, CDN global y firmado de URLs.
- Alternativas como S3 requieren configuración de permisos de bucket, políticas IAM
  y un CDN separado para servir con baja latencia.

### Historial de conversación en BD vs memoria del workflow

**Decisión:** Historial persistido en `{schema}.historial_conversacion` en PostgreSQL.

**Por qué:**
- n8n no tiene estado entre ejecuciones de workflow. Cada mensaje es una ejecución
  nueva desde cero. Si el historial viviera en memoria (por ejemplo, en una variable
  estática), se perdería en cada ejecución.
- El historial en BD permite: truncar inteligentemente por tokens, auditar
  conversaciones completas, y reiniciar sesiones sin perder el historial histórico.
- La alternativa de usar la memoria de conversación nativa de n8n (nodo Memory)
  no sobrevive reinicios del proceso n8n y no es compartible entre workers
  en una instalación multi-instancia.
- Con la BD, WF-E puede purgar automáticamente historiales viejos sin tocar
  el estado actual de sesiones activas.

### Aislamiento total por cliente como principio de diseño no negociable

**Decisión:** Zero tolerance para queries cross-schema o credenciales compartidas entre clientes.

**Por qué:**
- Un sistema multi-tenant con datos mezclados es una vulnerabilidad de seguridad
  de primera clase. Una query mal filtrada expone todos los datos de todos los clientes.
- Los clientes de distintos rubros (salud, retail, restaurantes) tienen diferentes
  requisitos regulatorios. El aislamiento físico hace que el cumplimiento de cada
  cliente sea independiente.
- Un cliente que crece y necesita migrar a su propia instancia puede hacerlo con
  un simple `pg_dump -n cli_XXXXX` sin coordinación con otros clientes.
- El costo de implementar el aislamiento desde el inicio es bajo. El costo de
  migrarlo retrospectivamente cuando hay datos mezclados es altísimo y riesgoso.

---

## Troubleshooting común

### PostgreSQL

**Error: `relation "cli_00001.sesiones" does not exist`**
- El schema del cliente no fue creado. Ejecutar `provision_cliente.js` para ese cliente.
- Verificar que el `cliente_id` en el mensaje coincide con el nombre del schema.

**Error: `deadlock detected`**
- Dos ejecuciones de WF-A procesando mensajes del mismo número simultáneamente.
- Verificar que el `SELECT FOR UPDATE` en WF-C está dentro de una transacción explícita.
- Verificar el tiempo de expiración del lock (30 segundos en `sesiones.lock_timestamp`).

**Error: `too many connections`**
- n8n está creando una conexión nueva por cada ejecución de workflow.
- Verificar que el nodo Postgres usa la misma Credential con pool habilitado.
- Aumentar `max_connections` en PostgreSQL si el pool es legítimamente grande.

**Error: `column "datos_pendientes" is of type jsonb but expression is of type text`**
- Al escribir `datos_pendientes`, convertir el objeto a string JSON antes de insertar:
  `JSON.stringify(datosPendientes)` en un nodo Code antes del nodo Postgres.

### Evolution API

**El webhook no llega a WF-A**
- Verificar que la URL del webhook está configurada en la instancia de Evolution API.
- Verificar que el header secreto está correcto en ambos lados (Evolution y `public.clientes`).
- Comprobar que WF-A está activo en n8n (no en modo test).
- Revisar logs de Evolution API: `docker logs evolution_api --tail 50`.

**`getBase64FromMediaMessage` retorna error 404**
- La imagen de WhatsApp expira rápido. Si el mensaje llegó hace más de ~5 minutos,
  la URL de media ya no es válida.
- Responder al usuario pidiendo que reenvíe la imagen.

**Evolution API no responde**
- Verificar que el contenedor está corriendo: `docker ps | grep evolution`.
- Verificar que el puerto está accesible desde n8n: `curl http://localhost:8080/health`.

### n8n AI Agent

**Claude invoca una tool con parámetros incorrectos**
- El schema JSON de la tool en `schemas/tools/` tiene restricciones que Claude no está
  respetando. Revisar la descripción de la tool en el system prompt.
- Agregar ejemplos de uso correcto en la descripción de la tool.

**El AI Agent entra en loop infinito de tool calls**
- Poner un límite de iteraciones máximas en el nodo AI Agent (recomendado: 5).
- Verificar que las tools retornan errores informativos que permiten a Claude saber
  cuándo detenerse.

**Respuestas del agente muy largas que exceden el límite de WhatsApp (4096 chars)**
- El system prompt debe instruir a Claude a ser conciso.
- En WF-B, agregar un nodo Code después del AI Agent que trunca la respuesta
  y agrega "..." si supera el límite, con oferta de continuar.

### Cloudinary

**Error al subir imagen: `File size too large`**
- El tamaño se debe validar antes de llamar a la tool `subir_imagen`, no después.
- Verificar el nodo de validación de tamaño en WF-B (límite: 5MB).

**URLs de imágenes subidas no accesibles**
- Verificar que la carpeta `/{cliente_id}/` existe en Cloudinary.
- Verificar que el preset de upload está configurado como `unsigned` o que el
  API key/secret son correctos.

### WooCommerce

**Error 401 en todas las llamadas**
- El consumer_key y consumer_secret deben generarse desde WooCommerce > Ajustes >
  Avanzado > REST API. No son las credenciales de WordPress.
- Verificar que la credencial en n8n tiene los valores correctos.

**Precios retornan como string en lugar de número**
- WooCommerce retorna precios como strings ("89900"). Convertir a número antes de
  comparar o calcular: `parseFloat(producto.price)`.

### Shopify

**Error 429 en llamadas masivas**
- Shopify tiene rate limiting por bucket (40 puntos, se regenera a 2/segundo).
- El adapter debe leer el header `X-Shopify-Shop-Api-Call-Limit` y esperar si está
  cerca del límite.
- Para `precioMasivo`, implementar procesamiento en lotes de 10 con pausa de 1s
  entre lotes.

**Precios de variantes no se actualizan**
- En Shopify, el precio no está en el producto sino en cada variante.
- `actualizarPrecio` debe llamar a `PUT /admin/api/variants/{variant_id}.json`,
  no a `PUT /admin/api/products/{product_id}.json`.

---

## Instrucciones para Claude Code

1. **Leer `prompts/system_prompt.md` antes de cualquier cambio al agente** (WF-B)
2. Al modificar un schema de tool, verificar impacto en WF-B y en la descripción
   de la tool en el system prompt
3. Para nueva tool: crear schema en `schemas/tools/`, documentar en `docs/arquitectura.md`
4. **Toda query SQL debe calificar el schema explícitamente.**
   Rechazar cualquier implementación que use `SET search_path` dinámico
5. Antes de cambiar un workflow, identificar todos los sub-workflow calls que lo referencian
6. **Nunca hardcodear credenciales**; siempre usar n8n Credentials
7. Al agregar nueva plataforma de ecommerce, implementar la interfaz completa del adapter
   antes de integrar con el workflow
8. Ante duda sobre un caso edge, consultar la sección Casos Edge antes de improvisar
9. **Los límites técnicos son restricciones de diseño, no sugerencias.**
   Cualquier implementación que los ignore es incorrecta
10. **El principio de aislamiento por cliente es inviolable.**
    Si una implementación propuesta requiere cruzar datos entre schemas,
    el diseño es incorrecto y debe revisarse antes de continuar
11. Los nombres de nodos en n8n deben ser descriptivos en español.
    Rechazar nombres default como "HTTP Request1" o "If"
12. Al versionar workflows o prompts: copiar la versión actual a `history/`
    con timestamp antes de modificar el archivo activo
