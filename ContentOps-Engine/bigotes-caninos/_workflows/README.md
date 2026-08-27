# Workflows n8n de Bigotes Caninos — código archivado

Los 13 workflows que BC tenía desplegados en `n8n.srv1398596.hstgr.cloud`,
exportados el **2026-08-27** justo antes de borrarlos de la instancia.

El código queda aquí. La implementación en el servidor ya no existe.

| Archivo | WF | Nodos | Estado al borrar |
|---|---|---:|---|
| `WF1-Blog-SEO-...__vQJ5gCIDbNq2zqd8.json` | WF1 Blog SEO | 36 | activo (cron Mar/Jue/Sáb 8am) |
| `WF3-Re-optimizacion-SEO-...__PloVJdTP2G8lKMNo.json` | WF3 Re-optimización | 26 | inactivo |
| `WF5-Generador-de-Ideas-Blog__rNG8EVxwLsuwKHZM.json` | WF5 Ideas | 13 | inactivo |
| `WF6-Pillar-Generator-...__37ZMWhzGb3ObewQ6.json` | WF6 Pilares | 17 | activo |
| `WF7-AEO-Monitor-...__RYhnbWPasSKE5HL6.json` | WF7 AEO Monitor | 13 | activo (cron Lun 9am) |
| `WF8-Bulk-AEO-Migrator-...__4vPCym417t5nO9ru.json` | WF8 Bulk AEO | 23 | inactivo |
| `WF9-Pilares-Auto-Sync-...__VUA4Rnm3hYWVqcE5.json` | WF9 Auto-Sync | 12 | activo (cron diario 8:30am) |
| `WF11-GSC-Weekly-Dashboard__39sEBfGprwCtVKOD.json` | WF11 Dashboard | 11 | activo (cron Lun 9am) |
| `WF-Util-Force-Re-optimize-Post__n3j1DIxnMIJ5Xahw.json` | Util | 22 | activo (webhook) |
| `WF-Util-Publicar-Paginas-Legales__nx5ivvkMVVMBDpqE.json` | Util | 9 | activo (webhook) |
| `WF-Util-Footer-Insert-Legales__TUClcBl9RKIzw7Tz.json` | Util | 4 | activo (webhook) |
| `WF-Util-Discover-Widgets-one-off__xWG4TEwb3FqiBQHn.json` | Util | 5 | activo (one-off) |
| `WF-Util-Force-Publish-Drafts-one-off__ZXGkalck7p1Ugj26.json` | Util | 5 | inactivo (one-off) |

## Para volver a desplegar uno

```bash
curl -X POST "https://n8n.srv1398596.hstgr.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @<archivo>.json
```

n8n le asignará un **ID nuevo**. Los IDs viejos del CLAUDE.md dejan de servir.

## Credenciales

No vienen en el export — la API de n8n nunca devuelve los secretos. Los workflows
las referencian por ID. Al reimportar hay que re-vincular a mano:

| Credencial | ID | Nota |
|---|---|---|
| `BC - OpenAI Account` | `ALqgbg5Kq6byqHSI` | exclusiva de BC |
| `BC - WordPress` | `yyhjFRj5iigjQV9y` | exclusiva de BC |
| `BF - BC - nano banana` | `ysOycTrtxEO3BRcW` | **compartida con Bigotes Felinos** |
| `BF - Telegram` | `g7wMmmirtuG1Ryu9` | **compartida** — apunta al bot canino |
| Google OAuth (GSC/Sheets) | `XWbfIBmitmx1uByl` | **compartida con felino** |

Ninguna credencial fue borrada. Las compartidas siguen en uso por Bigotes Felinos.

## Respaldo completo

El snapshot de los 228 workflows de toda la instancia está en
`toque-flow/n8n-backup/2026-08-27/`.
