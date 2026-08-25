---
name: deploy-toqueflow
description: Despliega el sitio y el portal de ToqueFlow a toqueflow.com de forma segura. Úsalo SIEMPRE que se pida publicar, desplegar, subir, actualizar el sitio, "sacar a producción" o ver un cambio en vivo en toqueflow.com. También cubre verificar el estado del sitio en vivo y hacer rollback.
---

# Deploy de ToqueFlow

## La regla que no se rompe

**NUNCA subas un zip parcial.** `deployStaticWebsite` de Hostinger reemplaza y actualiza todo el docroot, no una URL suelta. Un deploy parcial o un fallo intermitente **puede vaciar el sitio entero** — ya pasó el 2026-06-20.

El único camino válido es el script, que construye el sitio completo, respalda, verifica y revierte solo:

```
powershell -File deploy-safe.ps1
```

Se corre desde `Websites/toqueflow/`. No armes zips a mano, no llames `mcp-deploy.cjs` directamente, no uses el MCP de Hostinger por tu cuenta.

## Antes de desplegar: verificar requisitos

Si falta cualquiera de estos, **detente y dilo** — no intentes el deploy:

| Requisito | Cómo comprobar |
|---|---|
| `Websites/toqueflow/credentials.env` | Debe existir. Gitignoreado, vive solo en la máquina |
| `Websites/toqueflow/.mcp.json` | Con `HOSTINGER_API_TOKEN` resuelto, no el placeholder |
| `site/assets/` con las imágenes | `toqueflow-logo.png`, `favicon.png`, logos de clientes. **Están gitignoreados: un clone nuevo NO los trae** |
| `backups/last-good-site.zip` | Si no existe no hay rollback posible. Sembrarlo primero con `-SeedLastGood` |

Desplegar sin las imágenes de `site/assets/` publica un sitio con el logo y el favicon rotos.

## Qué hace el script

1. **Construye** el zip con todo `site/`, excluyendo `supabase/`, `node_modules/`, `dist/`, media pesada y los archivos ya migrados a Cloudflare R2.
2. **Estampa** `?v=<fecha>` a los `.jsx` y `.css` de cada `.html` — cache busting, el cambio se ve sin `Ctrl+Shift+R`.
3. **Despliega** por `mcp-deploy.cjs` contra el MCP de Hostinger.
4. **Verifica** una lista de URLs esperando 200, con hasta 20 reintentos cada 8 segundos.
5. **Rollback automático** si alguna falla: redespliega `backups/last-good-site.zip`.

Sembrar el punto de restauración sin desplegar nada:

```
powershell -File deploy-safe.ps1 -SeedLastGood
```

## La lista de verificación

Vive en la función `Test-Live` de `deploy-safe.ps1`. **Cada vez que se da de alta un flow con `tool_url`, esa URL debe entrar a la lista.** Si no, el cliente ve un 404 y el deploy pasa en verde sin avisar — pasó con Bejauha, cuyas páginas de contactos, campañas y modo prueba vivían solo en una rama.

Al agregar un cliente o una herramienta nueva: abre `Test-Live`, agrega la URL, comenta a qué cliente pertenece.

⚠️ **Estado conocido (2026-08-25):** la lista incluye `assets/toqueflow-logo.png`, que responde **404 en producción**. Tal cual está, el script haría rollback de un deploy sano. Hay que restaurar el archivo o sacarlo de la lista **antes** del próximo deploy.

## Lo que NO necesita deploy

Los cambios de **datos** —clientes, usuarios, flows, contactos, campañas— viven en Supabase y se aplican al instante. Un `seed-<cliente>.cjs` o un UPDATE no requieren publicar nada.

Solo se despliega cuando cambian archivos dentro de `site/`.

## Si algo sale mal

- **Verificación falla y hay rollback:** el sitio volvió al último bueno. El snapshot del intento queda en `backups/<fecha>-site.zip` para revisar qué se rompió.
- **"[SIN ROLLBACK]":** no existía `last-good-site.zip`. Sembrar uno y revisar Hostinger a mano.
- **El sitio local divergió del vivo:** `mirror-deploy.cjs` espeja lo que está publicado; `compare-site.cjs` compara por md5 el `site/` local contra producción.

## Referencias

- `Websites/toqueflow/_docs/README.md` — guía operativa completa
- `Websites/toqueflow/CONTEXT.md` — cómo está construido el sitio
- `Websites/toqueflow/_docs/cloudflare-r2.md` — qué media se movió a R2 y ya no se despliega
