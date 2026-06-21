# Cloudflare R2 — plan para aligerar los deploys

## ¿Qué es esto y por qué?
Hoy **cada deploy re-sube ~77 MB**, pero el código real (HTML/JSX/CSS) pesa **~0.5 MB**. El resto son **imágenes** (`site/assets/img/` ≈ 73 MB + `hero-bg.mp4`) que **casi nunca cambian**. Re-subirlas en cada cambio es lento y, cuando el sitio crezca, será un enredo.

**Cloudflare R2** = almacenamiento de objetos de Cloudflare (tipo S3, **gratis hasta 10 GB**). El usuario YA lo usa para los videos de Bejauha. La idea: **mover las imágenes pesadas a R2** y referenciarlas por URL. Así `public_html` queda **solo con código** y cada deploy:
- pesa **segundos** (no 77 MB),
- sigue siendo **completo** (sin riesgo de "deploy parcial" que vacía el sitio),
- y las imágenes se sirven desde el **CDN** de Cloudflare (más rápido).

> NOTA: muchos cambios (clientes, usuarios, flows) son **datos de Supabase** → ya hoy **no necesitan deploy**. Esto es solo para los cambios de código/diseño.

## Plan (cuando tengamos las llaves de R2)
1. Crear un bucket en R2 (ej. `toqueflow-assets`) y hacerlo **público** (o conectar un dominio/`*.r2.dev`).
2. Subir `site/assets/img/*` + `site/assets/hero-bg.mp4` (+ logos de clientes) al bucket.
3. Reemplazar en el código las rutas `assets/img/...` por la **URL pública de R2** (un solo `BASE_ASSETS` configurable, o reemplazo directo).
4. **Quitar** esas imágenes de `site/` (o añadirlas a las exclusiones de `deploy-safe.ps1`) → el zip baja a ~0.5 MB.
5. Verificar que todas las imágenes carguen desde R2 y desplegar.

## Qué necesito del usuario para hacerlo
- **Account ID** de Cloudflare.
- **R2 Access Key ID** + **Secret Access Key** (token de API de R2 con permiso de escritura).
- Nombre del **bucket** (o lo creo) y la **URL pública** (dominio propio o el `*.r2.dev`).

(Se guardarían en `credentials.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.)

## Hallazgos (2026-06-20)
- **Llaves de R2**: están en `Bejauha/plataforma/.env.local` (`R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE`). Las leo desde ahí, no se copian a toqueflow.
- **Método**: `@aws-sdk/client-s3` (ya instalado en `Bejauha/plataforma/node_modules` → se puede `require` por ruta absoluta sin instalar nada en toqueflow). Subida con `PutObjectCommand`.
- **DECISIÓN PENDIENTE (del usuario):**
  - **(A) Reusar el bucket de Bejauha** bajo un prefijo `toqueflow/` → funciona YA (ese bucket ya es público), pero las imágenes de ToqueFlow quedarían servidas desde el dominio/bucket de Bejauha (acopla los dos proyectos).
  - **(B) Bucket dedicado `toqueflow-assets`** → más limpio, pero hay que **activar acceso público** una vez en el dashboard de Cloudflare R2 (eso NO se puede por la S3 API, lo haces tú o me pasas el dominio público).

## Estado
🟡 **Listo para migrar** en cuanto elijas (A) o (B). Plan: subir `assets/img/*` + `hero-bg.mp4` (+ logos) a R2 → cambiar las rutas en el código por la URL pública → **verificar que todas carguen desde R2** → recién ahí excluir las imágenes del deploy (deploy-safe) → deploy liviano. Nada se quita de `site/` hasta verificar.

## Alternativa a futuro (no urgente)
Migrar TODO el sitio a **Cloudflare Pages** (gratis): `git push` → deploy atómico + CDN + cache-busting + rollback instantáneo. Es más limpio que el zip a Hostinger, pero es una migración mayor.
