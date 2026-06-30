# Savia — Despliegue de la base de datos

Schema: **`savia`** dentro de la DB compartida `leadai` en el VPS Hostinger.

## Despliegue inicial

Conectar al PG del VPS con el usuario que tenga `CREATE` sobre la DB `leadai`:

```bash
psql "postgresql://leadai_user:****@localhost:5432/leadai" \
  -f database/001_schema.sql
```

Cargar el KB inicial (placeholder — validar contenido con el cliente antes de go-live):

```bash
psql "postgresql://leadai_user:****@localhost:5432/leadai" \
  -f database/002_seed_kb.sql
```

Verificar:

```sql
\dn                          -- listar schemas: 'savia' debe estar
\dt savia.*                  -- listar tablas: 7 tablas
SELECT topico, count(*) FROM savia.kb_documentos GROUP BY 1;
```

## Convenciones

- **Teléfono**: formato E.164 sin `+` (ej. `573001234567`). El normalizador vive en n8n antes del INSERT.
- **Moneda**: COP enteros (sin decimales) en `NUMERIC(10,0)`.
- **Estados de pedido**: `link_generado | pago_confirmado | pago_rechazado | expirado | cancelado` (constraint en `pedidos.estado`).
- **Direccion de mensaje**: `'in'` (lead → bot) o `'out'` (bot → lead).
- **Idempotencia Wompi**: la tabla `eventos_wompi` tiene UNIQUE en `evento_id` para descartar reentregas del webhook.

## Cron diario (n8n)

| Frecuencia | Acción |
|---|---|
| Cada 1 hora | Expirar pedidos `link_generado` con `expira_at < now()` (ver helper C en `001_schema.sql`) |
| 02:00 AM diario | Sincronizar `savia.fichas_producto` desde WooCommerce REST API |
| 01:00 AM 1er día del mes | Mover `mensajes_logs` y `contactos_dia` con +90 días a tablas `_archive` particionadas por mes |

## Backups

PG del VPS ya tiene backups automáticos. Para snapshot manual del schema:

```bash
pg_dump --schema=savia --format=custom \
  "postgresql://leadai_user:****@localhost:5432/leadai" \
  > savia_$(date +%Y%m%d).dump
```

## Migraciones futuras

Numerar correlativamente: `003_xxx.sql`, `004_xxx.sql`, etc. Cada archivo debe ser idempotente (usar `IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
