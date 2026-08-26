# ToqueFlow — Login + Super Admin (Supabase)

Se habilitó autenticación **real** sobre el sitio estático, con dos niveles:
**empresas** (clientes de ToqueFlow) y **usuarios** dentro de cada empresa, más
una **consola de super admin** que gestiona todo.

## Qué se agregó

| Archivo | Para qué |
|---|---|
| `site/supabase/schema.sql` | Tablas `companies` y `profiles`, roles, RLS y triggers. Se corre una vez en Supabase. |
| `site/supabase-config.js` | Aquí pegas la URL y la anon key de tu proyecto Supabase. |
| `site/auth.js` | Cliente de Supabase + guards de sesión + helpers de rol/logout. |
| `site/login.jsx` | Login real (antes era solo visual). Redirige según el rol. |
| `site/admin.html` + `site/admin.jsx` | **Consola del super admin**: empresas + usuarios, crear/editar/desactivar y asignar roles. |
| `dashboard / perfil / ajustes` | Ahora exigen sesión; cargan los datos reales del usuario; logout real. |

**Roles:** `super_admin` (ve y gestiona todo) · `admin` (administrador de su empresa) · `member` (usuario normal).
Al entrar, un `super_admin` cae en `admin.html`; los demás en `dashboard.html`.

---

## Puesta en marcha (10–15 min)

### 1. Crear el proyecto Supabase
1. Entra a <https://supabase.com> → **New project** (el plan free alcanza de sobra).
2. Anota la contraseña de la base de datos.

### 2. Crear las tablas
1. En el proyecto → **SQL Editor → New query**.
2. Copia **todo** el contenido de `site/supabase/schema.sql`, pégalo y dale **Run**.
   (Es idempotente: lo puedes correr de nuevo sin romper nada.)

### 3. Desactivar confirmación por correo
Para que los usuarios creados desde la consola entren de inmediato:
- **Authentication → Sign In / Providers → Email** → desactiva **"Confirm email"**.

### 4. Pegar las llaves
1. **Project Settings → API**. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon / public** key → `SUPABASE_ANON_KEY`
2. Pégalas en `site/supabase-config.js`.
   > La anon key es pública y segura de exponer en el front: los datos están
   > protegidos por las políticas RLS del schema. **Nunca** pongas la
   > `service_role` key ahí.

### 5. Crear tu super admin
1. **Authentication → Users → Add user** → tu correo + contraseña.
   Marca **"Auto Confirm User"**.
2. **SQL Editor**, corre (cambia el correo si hace falta):
   ```sql
   update public.profiles
   set role = 'super_admin', full_name = 'Ferney Rojas'
   where email = 'feruroc@gmail.com';
   ```

### 6. Probar y desplegar
- Local: abre `site/login.html` con un servidor (ej. `npx serve site`) — no
  funciona bien con `file://` por las llamadas a Supabase.
- Entra con tu super admin → caes en la **consola admin**.
  Crea una empresa, luego un usuario y asígnale empresa + rol.
- Deploy a Hostinger: zipa el contenido de `site/` y usa `deployStaticWebsite`
  con el dominio de `CLAUDE.md`.

---

## Cómo opera el super admin
- **Empresas:** crear, pausar/activar, ver cuántos usuarios tiene cada una.
- **Usuarios:** crear (correo + contraseña temporal + empresa + rol), cambiar
  rol, mover de empresa, activar/desactivar. La creación usa un cliente efímero
  para no cerrar tu propia sesión.

## Pendientes / opcionales (no bloquean)
- **"Continuar con Google"** y **"¿la olvidaste?"** del login son visuales aún.
  Google OAuth se habilita en Supabase (Authentication → Providers → Google) y
  el reset de contraseña con `sb.auth.resetPasswordForEmail(...)`. Avísame si los
  quieres conectar.
- **Borrado total** de un usuario (de Auth) se hace desde el panel de Supabase;
  desde la consola solo se **desactiva** (queda sin acceso).
- El `dashboard.html` sigue mostrando flows de ejemplo (`FLOWS_SEED`); el saludo
  y el perfil ya son reales. Conectar los flows a datos reales es un paso aparte.
