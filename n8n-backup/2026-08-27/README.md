# Respaldo n8n — snapshot 2026-08-27

Copia completa de **los 228 workflows** de la instancia
`https://n8n.srv1398596.hstgr.cloud/` tomada antes de desmontar lo implementado.

## Qué hay aquí

| Ruta | Contenido |
|---|---|
| `workflows/<id>.json` | export completo de cada workflow (nodos, conexiones, settings, versión publicada) |
| `INVENTARIO.md` | los 228 workflows clasificados por cliente, con ID, estado y nº de nodos |
| `SECRETOS_REDACTADOS.md` | claves que estaban hardcodeadas y fueron reemplazadas — **rotar** |
| `_meta/indice.json` | índice legible por máquina |
| `_meta/credenciales-inventario.json` | las 45 credenciales de n8n: id, nombre y tipo (sin secretos) |

## Cifras

- 228 workflows · 3.957 nodos · 85 activos · 3 archivados
- 45 credenciales configuradas en la instancia

## Importante

- Las **credenciales no se pueden exportar**: la API de n8n nunca devuelve los secretos
  descifrados. Este respaldo guarda solo el inventario. Al restaurar hay que volver a
  crear cada credencial a mano y re-vincularla.
- Los workflows referencian credenciales por `id`. Si se recrean con IDs distintos,
  hay que re-mapear.
- Seis workflows tenían claves API en texto plano dentro de los nodos. Aquí aparecen
  como `__REDACTED_<TIPO>__`. Ver `SECRETOS_REDACTADOS.md`.

## Restaurar uno

```bash
curl -X POST "$N8N_API_URL/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @workflows/<id>.json
```
