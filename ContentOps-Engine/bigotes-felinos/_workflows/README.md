# Workflows n8n de Bigotes Felinos — código archivado

Los 16 workflows que BF tenía desplegados en `n8n.srv1398596.hstgr.cloud`,
exportados el **2026-08-27** justo antes de borrarlos de la instancia.

El código queda aquí. La implementación en el servidor ya no existe.

## Los 16

| Archivo | n8n ID (histórico) | Nodos | Estado al borrar |
|---|---|---:|---|
| `WF1-Blog-SEO-...` | `IVKelNHLoEaWD92B` | 38 | activo (cron L/M/V 8am) |
| `WF3-Re-optimizacion-SEO-...` | `T46531TOrPeT6VmS` | 26 | activo (cron 1° de mes) |
| `WF5-Generador-de-Ideas-Blog-Entretenimiento` | `yRbv29Y6FiQHn1Qg` | 13 | inactivo |
| `WF6-Pillar-Generator-...` | `cE3mJkzcKmJrWg4z` | 17 | activo |
| `WF7-AEO-Monitor-...` | `73UFpj4m2vke6IPk` | 13 | activo (cron Lun 9am) |
| `WF8-Bulk-AEO-Migrator-...` | `vB8ya9OSUyLsQuLg` | 23 | inactivo |
| `WF9-Pilares-Auto-Sync-...` | `XvMhI97WVqj49U9f` | 12 | activo (cron diario) |
| `WF11-GSC-Weekly-Dashboard` | `luUL1h3EVmzeUFCQ` | 11 | activo (cron Lun 9am) |
| `WF-Util-Force-Re-optimize-Post` | `gu2XtRkhfEVDsyai` | 22 | activo (webhook) |
| `WF-Util-Publish-Interactive-Page-Calculadora` | `bWYAwFDRlU7bIYRH` | 9 | activo (webhook) |
| `WF-Util-Update-Page-Content` | `v5WWkwGvXSnTGnRO` | 5 | activo (webhook) |
| `WF-Util-Publicar-Paginas-Legales` | `fmdlcPbN8juFuCMN` | 7 | inactivo |
| `WF-Util-Cleanup-Posts` | `MtGd2426PSNaYgTC` | 15 | inactivo |
| `WF-Diag-GSC-Coverage-Check-TEMP` | `M0Uqiu8ggudqtqDh` | 5 | inactivo |
| `WF-Diag-URL-Inspection-Coverage-Audit` | `mGUqQkOF2PtmPH5l` | 10 | inactivo |
| `Test-WordPress-Content` | `20Hni3eSEwS2kVra` | 2 | inactivo |

**228 nodos en total. 9 activos, 7 inactivos.**

No existían workflows separados de WF2 (Redes Sociales) ni WF4 (Entretenimiento):
la generación de entretenimiento vivía dentro de WF5.

## Para volver a desplegar uno

```bash
curl -X POST "https://n8n.srv1398596.hstgr.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @<archivo>.json
```

n8n le asignará un **ID nuevo**. Los IDs de la tabla ya no resuelven.

## Credenciales

No vienen en el export — la API de n8n nunca devuelve los secretos descifrados.
Los workflows las referencian por ID; al reimportar hay que re-vincularlas.

| Credencial | ID | Usada en |
|---|---|---|
| `BF - WordPress` | `r90z9yKyuuNlhBLy` | 30 nodos |
| `BF - Telegram Bot` | `7iBygAb1uGxktnFH` | 28 nodos |
| `BF - Sheets Service Account` | `kfmx1gj6KPrgmj2E` | 21 nodos |
| `BF - OpenAI` | `sZscccSGx3nfNyOm` | 6 nodos |
| `BF - Google OAuth` | `XWbfIBmitmx1uByl` | 5 nodos |
| `BF - Google Sheets` | `70heM3IFsNK9Cyak` | 5 nodos |
| `BF - SerpAPI` | `44hTDtjkVRDKJOeU` | 3 nodos |
| `BF - BC - nano banana` | `ysOycTrtxEO3BRcW` | 2 nodos |

**Ninguna credencial fue borrada.** Ojo: varias con nombre `BF - ...` las usan
workflows de otros clientes que siguen vivos (Bejauha, Parqueadero, FerreteríaYa),
así que borrarlas rompería producción ajena.

## Respaldo completo

El snapshot de los 228 workflows de toda la instancia está en
`toque-flow/n8n-backup/2026-08-27/`.
