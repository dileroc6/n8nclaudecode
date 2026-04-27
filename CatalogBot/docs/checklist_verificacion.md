# Checklist de verificación pre-producción — CatalogBot

Ejecutar en orden. Cada paso debe pasar antes de continuar al siguiente.

---

## Bloque 1: Base de datos

- [ ] `psql $DATABASE_URL -c "SELECT version()"` — confirma conexión a PostgreSQL
- [ ] `psql $DATABASE_URL -c "SELECT extname FROM pg_extension WHERE extname='pgcrypto'"` — confirma pgcrypto instalado
- [ ] `psql $DATABASE_URL -c "SELECT * FROM public.clientes LIMIT 1"` — tabla clientes existe
- [ ] `psql $DATABASE_URL -c "SELECT * FROM public.db_migrations ORDER BY aplicada_en"` — migraciones registradas
- [ ] Para el cliente de prueba (`cli_test`):
  - [ ] `\dt cli_test.*` muestra las 7 tablas
  - [ ] `SELECT * FROM cli_test.usuarios` muestra al menos 1 admin
  - [ ] `SELECT * FROM cli_test.sesiones` — tabla existe (puede estar vacía)

---

## Bloque 2: Scripts

```bash
# Validar todos los workflows
node scripts/validate_workflow.js workflows/WF-A_receptor.json
node scripts/validate_workflow.js workflows/WF-B_agente.json
node scripts/validate_workflow.js workflows/WF-C_sesiones.json
node scripts/validate_workflow.js workflows/WF-D_auditoria.json
node scripts/validate_workflow.js workflows/WF-E_scheduler.json
```

- [ ] Todos muestran `✅ PASS`
- [ ] `node scripts/test_tools.js` — pasa todas las verificaciones
- [ ] `node scripts/provision_cliente.js` con datos de prueba — completa sin errores

---

## Bloque 3: n8n — Credenciales

- [ ] `CatalogBot PostgreSQL` creada y con test de conexión exitoso
- [ ] `CatalogBot Anthropic API` creada
- [ ] `CatalogBot Evolution API Key` creada
- [ ] Para cada cliente activo: credencial de ecommerce creada

---

## Bloque 4: n8n — Workflows importados

- [ ] WF-C importado → ID obtenido → reemplazado en WF-A y WF-B
- [ ] WF-D importado → ID obtenido → reemplazado en WF-B
- [ ] WF-A importado → URL del webhook copiada
- [ ] WF-B importado → todos los `TOOL_*_WF_ID` reemplazados con IDs reales
- [ ] WF-E importado

---

## Bloque 5: n8n — Activación en orden

```
1. Activar WF-C → esperar 5s → verificar estado "active"
2. Activar WF-D → esperar 5s → verificar estado "active"
3. Activar WF-A → copiar URL del webhook
4. Activar WF-B → esperar 5s → verificar estado "active"
5. Activar WF-E → esperar 5s → verificar estado "active"
```

- [ ] Los 5 workflows muestran estado `active` en n8n

---

## Bloque 6: Evolution API

- [ ] Instancia del cliente de prueba conectada (estado `open`)
- [ ] Webhook configurado con la URL de WF-A
- [ ] Header secreto configurado correctamente

---

## Bloque 7: Prueba de humo — Secuencia completa

Enviar los siguientes mensajes desde el número de admin configurado en `cli_test`.
Esperar respuesta antes de enviar el siguiente.

### 7.1 — Mensaje de texto básico
```
Mensaje: "hola"
Respuesta esperada: Saludo del bot + mención de capacidades
Verificar en BD: SELECT * FROM cli_test.historial_conversacion ORDER BY id DESC LIMIT 2
```
- [ ] Bot responde en ≤10 segundos
- [ ] 2 registros en historial_conversacion (turno user + turno assistant)
- [ ] Sesión en cli_test.sesiones con estado 'idle'

### 7.2 — Búsqueda de producto
```
Mensaje: "buscar producto camiseta"
Respuesta esperada: Lista de productos encontrados O "No encontré ese producto"
Verificar: No hay errores en cli_test.errores
```
- [ ] Respuesta coherente (lista o mensaje de no encontrado)
- [ ] Sin errores en tabla errores

### 7.3 — Intento de operación con viewer (si hay usuario viewer configurado)
```
Desde número viewer: "cambiar precio del producto 1 a 50000"
Respuesta esperada: "No tienes permiso para realizar esa acción."
```
- [ ] Rechaza la operación sin ejecutarla
- [ ] No hay registro en auditoria

### 7.4 — Flujo de confirmación (admin)
```
Mensaje: "cambiar el precio del producto [nombre] a [precio]"
Respuesta esperada: Resumen con precio anterior/nuevo + "¿Confirmas? Escribe CONFIRMAR"
```
- [ ] datos_pendientes en cli_test.sesiones tiene el JSON de confirmación
- [ ] estado = 'pendiente_confirmacion'

```
Mensaje: "CONFIRMAR"
Respuesta esperada: "Precio actualizado correctamente"
```
- [ ] Registro en cli_test.auditoria con accion='actualizar_precio'
- [ ] estado vuelve a 'idle' en sesiones
- [ ] datos_pendientes = null

### 7.5 — Imagen
```
Enviar imagen de un producto
Respuesta esperada: Análisis de la imagen con nombre probable y características
```
- [ ] Bot describe la imagen correctamente
- [ ] Sin errores en tabla errores

### 7.6 — Mensaje no soportado
```
Enviar un sticker
Respuesta esperada: Silencio (bot ignora stickers)
```
- [ ] No hay respuesta del bot
- [ ] No hay registro nuevo en historial_conversacion

### 7.7 — Número no registrado
```
Desde un número NO registrado en cli_test.usuarios:
Mensaje: "hola"
Respuesta esperada: Mensaje genérico sin revelar que el sistema existe
```
- [ ] Respuesta genérica o silencio
- [ ] NO se crea sesión para ese número

---

## Bloque 8: WF-E Scheduler

```bash
# Ejecutar manualmente desde n8n (Test workflow)
# Verificar en BD:
psql $DATABASE_URL -c "SELECT * FROM cli_test.metricas_diarias ORDER BY fecha DESC LIMIT 3"
```

- [ ] Registro en metricas_diarias con fecha de hoy
- [ ] Sin errores críticos en logs de n8n
- [ ] Sesiones expiradas limpiadas (si las hay)

---

## Bloque 9: Monitoreo

- [ ] `SELECT * FROM cli_test.errores ORDER BY timestamp DESC LIMIT 10` — sin errores inesperados
- [ ] Logs de n8n sin stack traces
- [ ] Evolution API logs sin errores 4xx/5xx repetidos

---

## Resultado final

- [ ] **Todos los bloques completados** → sistema listo para producción
- [ ] Registrar fecha de verificación: ___________
- [ ] Responsable de la verificación: ___________
