# ToqueFlow — guía rápida del proyecto

Sitio en **toqueflow.com** (Hostinger, dominio addon). HTML + JSX en el navegador (Babel standalone, **sin build**) + backend **Supabase**. El área privada es una **consola SaaS multi-cliente**.

## Estructura
- `site/` — **el sitio** (todo lo que se publica). Páginas `.html`, componentes `.jsx`, `styles.css`, `assets/`, `supabase/` (schema + edge functions, NO se despliega).
- `deploy-safe.ps1` — **la forma de desplegar** (ver abajo).
- `credentials.env` — secretos (Supabase service_role, Hostinger, etc.). **gitignored**, nunca subir.
- `.mcp.json` — config del MCP de Hostinger. gitignored.
- `backups/` — snapshots fechados de cada deploy + `last-good-site.zip`. gitignored.
- `_docs/` — esta documentación. Ver **[cloudflare-r2.md](cloudflare-r2.md)** (plan para aligerar los deploys) y **[estrategia-leads.md](estrategia-leads.md)** (captación de clientes para ToqueFlow: ICP, oferta, máquina outbound y plan por fases).

## Cómo desplegar
```
powershell -File deploy-safe.ps1
```
Construye el sitio COMPLETO desde `site/` (excluye media pesada sin usar), respalda, sube por el MCP de Hostinger, **verifica ~9 URLs en 200** y hace **auto-rollback** si falla. Estampa `?v=<fecha>` a los `.jsx/.css` (cache-busting → se ve al instante, sin Ctrl+Shift+R).
> ⚠️ NUNCA desplegar parcial (un zip con pocos archivos) — un fallo de Hostinger puede **vaciar el sitio**. SIEMPRE el sitio completo (deploy-safe lo hace).
> 🟢 Los cambios de **datos** (clientes, usuarios, flows) son Supabase → **NO necesitan deploy**.

## Cómo agregar un cliente
Clona un `seed-<cliente>.cjs` (ej. `seed-savia.cjs`) y córrelo:
```
node seed-savia.cjs
```
Crea empresa (+logo opcional) + usuario (Auth+profile, member, pass temporal) + flows ('próximamente'). Idempotente. Es DATA → sin deploy.

## Scripts (en la raíz)
**Deploy**
- `deploy-safe.ps1` — deploy seguro (úsalo siempre).
- `mcp-deploy.cjs` — sube un zip por el MCP de Hostinger (lo llama deploy-safe).
- `mirror-deploy.cjs` — espeja el sitio en vivo (recuperación si se diverge).
- `compare-site.cjs` — compara (md5) local `site/` vs lo que está en vivo.

**Clientes (seeds)** — empresa + usuario + flows
- `seed-ferreteriaya.cjs`, `seed-smgrandhotel.cjs`, `seed-bejauha.cjs`, `seed-savia.cjs`
- `verify-bejauha.cjs`, `verify-smgrand.cjs` — verifican cada uno.

**Supabase / usuarios**
- `setup-supabase.cjs` — genera `site/supabase-config.js` desde el env.
- `crear-superadmin.cjs` — crea/eleva el super admin.
- `list-users.cjs` — lista usuarios + rol + empresa.
- `verify-creds.cjs` — chequea que credentials.env funcione contra Supabase.
- `manage-ferreteriaya-users.cjs`, `set-names.cjs` — operaciones puntuales ya hechas (referencia).

Todos leen `credentials.env` y usan la `service_role`. No hay secretos hardcodeados.
</content>
