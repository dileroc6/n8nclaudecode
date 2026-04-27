# Onboarding de cliente nuevo — CatalogBot

Proceso completo para conectar un nuevo cliente al sistema.
Tiempo estimado: 30–60 minutos.

---

## Requisitos previos

Antes de empezar, tener a mano:

| Dato | Descripción | Ejemplo |
|---|---|---|
| `cliente_id` | Identificador único, sin espacios, máx 20 chars | `cli_00002` |
| Nombre empresa | Nombre visible del cliente | `Tienda Ejemplo` |
| Tipo ecommerce | `woocommerce` o `shopify` | `woocommerce` |
| URL ecommerce | URL raíz de la tienda (sin trailing slash) | `https://tienda.ejemplo.com` |
| Nombre instancia WA | Nombre de la instancia en Evolution API | `tienda_ejemplo_wa` |
| Teléfono admin | Con código de país, sin `+` ni espacios | `573001234567` |
| Nombre admin | Nombre completo del admin inicial | `María García` |
| Credenciales ecommerce | consumer_key + secret (WC) o access_token (Shopify) | Ver abajo |

---

## Paso 1: Provisionar en base de datos

```bash
cd /path/to/catalogbot

node scripts/provision_cliente.js \
  cli_00002 \
  "Tienda Ejemplo" \
  woocommerce \
  https://tienda.ejemplo.com \
  tienda_ejemplo_wa \
  573001234567 \
  "María García"
```

El script imprime al final el `webhook_secret` generado. **Copiarlo ahora** — no se vuelve a mostrar.

Verificar que el schema fue creado:
```sql
\dt cli_00002.*
-- Debe mostrar 7 tablas: usuarios, sesiones, historial_conversacion,
-- auditoria, programados, errores, metricas_diarias
```

---

## Paso 2: Guardar credenciales de ecommerce en BD

Las credenciales se almacenan en `public.clientes.credenciales_api` para que WF-E pueda ejecutar programados de forma autónoma.

**WooCommerce:**
```sql
UPDATE public.clientes
SET credenciales_api = '{"consumer_key": "ck_...", "consumer_secret": "cs_..."}'::jsonb
WHERE cliente_id = 'cli_00002';
```

**Shopify:**
```sql
UPDATE public.clientes
SET credenciales_api = '{"access_token": "shpat_..."}'::jsonb
WHERE cliente_id = 'cli_00002';
```

> Seguridad: En producción, cifrar el valor con pgcrypto antes de insertar
> y descifrar en el nodo Code de WF-E. Para comenzar, el JSONB plano es funcional.

---

## Paso 3: Configurar instancia en Evolution API

```bash
# Crear instancia
POST {EVOLUTION_URL}/instance/create
{
  "instanceName": "tienda_ejemplo_wa",
  "qrcode": true
}

# Escanear el QR con el teléfono de WhatsApp Business del cliente
# Esperar hasta que el estado sea "open"
GET {EVOLUTION_URL}/instance/connectionState/tienda_ejemplo_wa
```

Verificar estado:
```bash
curl -H "apikey: {EVOLUTION_API_KEY}" \
  "{EVOLUTION_URL}/instance/connectionState/tienda_ejemplo_wa"
# Respuesta esperada: {"instance": {"state": "open"}}
```

---

## Paso 4: Configurar webhook en Evolution API

```bash
POST {EVOLUTION_URL}/webhook/set/tienda_ejemplo_wa
Headers: apikey: {EVOLUTION_API_KEY}
Body:
{
  "url": "https://n8n.tudominio.com/webhook/{PATH_DE_WFA}",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": ["MESSAGES_UPSERT"]
}
```

El `{PATH_DE_WFA}` se obtiene en n8n desde la configuración del nodo Webhook de WF-A.
El header secreto que envía Evolution API debe coincidir con el `webhook_secret` generado en el Paso 1.

Para configurar el header secreto en Evolution API:
```bash
POST {EVOLUTION_URL}/webhook/set/tienda_ejemplo_wa
{
  "url": "...",
  "headers": {
    "X-Webhook-Secret": "{webhook_secret_del_paso_1}"
  }
}
```

---

## Paso 5: Crear credencial de ecommerce en n8n

En n8n UI → Settings → Credentials → Add Credential

**WooCommerce:**
- Tipo: `HTTP Request` (Basic Auth)
- Nombre: `cli_00002 WooCommerce`
- Username: `{consumer_key}`
- Password: `{consumer_secret}`

**Shopify:**
- Tipo: `HTTP Header Auth`
- Nombre: `cli_00002 Shopify`
- Header Name: `X-Shopify-Access-Token`
- Header Value: `{access_token}`

Verificar que el nombre de la credencial coincide con `n8n_credential_name` en `public.clientes`.

---

## Paso 6: Crear carpeta en Cloudinary

```bash
# Usando la API de Cloudinary o desde el dashboard:
# Crear carpeta: /cli_00002/

# Verificar con curl:
curl "https://api.cloudinary.com/v1_1/{CLOUD_NAME}/folders" \
  -u "{API_KEY}:{API_SECRET}"
```

---

## Paso 7: Prueba de humo

Enviar desde el teléfono del admin configurado en el Paso 1:

1. **Mensaje:** `hola`
   - Esperar respuesta del bot (≤10s)
   - Verificar en BD: `SELECT * FROM cli_00002.historial_conversacion ORDER BY id DESC LIMIT 2`

2. **Mensaje:** `buscar producto`
   - El bot debe responder (lista vacía o error descriptivo si la tienda no tiene productos)

3. **Verificar sin errores:**
   ```sql
   SELECT * FROM cli_00002.errores ORDER BY timestamp DESC LIMIT 5;
   -- Debe estar vacía o sin errores relacionados a la prueba
   ```

---

## Paso 8: Agregar usuarios adicionales (opcional)

El admin puede hacerlo directamente por WhatsApp:
```
agregar editor 573009876543 Carlos López
agregar viewer 573007654321 Ana Martínez
```

O directamente en BD:
```sql
INSERT INTO cli_00002.usuarios (telefono, nombre, rol)
VALUES ('573009876543', 'Carlos López', 'editor');
```

---

## Checklist final

- [ ] Schema `cli_00002` con 7 tablas en PostgreSQL
- [ ] Admin insertado en `cli_00002.usuarios`
- [ ] `credenciales_api` actualizado en `public.clientes`
- [ ] Instancia Evolution API en estado `open`
- [ ] Webhook configurado con URL de WF-A y header secreto
- [ ] Credencial de ecommerce creada en n8n
- [ ] Carpeta `/{cliente_id}/` creada en Cloudinary
- [ ] Prueba de humo completada exitosamente
- [ ] Cliente notificado de que el sistema está activo

---

## Offboarding (desactivar cliente)

```sql
-- Desactivar sin borrar datos
UPDATE public.clientes SET activo = false WHERE cliente_id = 'cli_00002';
```

El sistema dejará de procesar mensajes del cliente de forma inmediata.
Los datos permanecen intactos para auditoría.

Para backup antes de desactivar:
```bash
pg_dump -n cli_00002 catalogbot > backup_cli_00002_$(date +%Y%m%d).sql
```
