# ToqueFlow — Tablero de tareas

> Estado al **25 de agosto de 2026**, después de traer los archivos del portátil viejo.
> Repo sincronizado con `origin/main` en `ea492f5`.
> Leyenda: 🔴 bloquea · 🟠 importante · 🟡 cuando se pueda · ✅ hecho · ⛔ descartado

---

## 🔴 Producción rota — pendiente por decisión

| # | Tarea | Detalle | Quién |
|---|---|---|---|
| 1 | **El logo y el favicon dan 404 en toqueflow.com** | Los archivos **se perdieron**: no están en el repo, ni en el portátil viejo, ni en Cloudflare R2 (probé seis rutas). El logo es un `<img>` plano en el nav y el footer de `chrome.jsx`, así que está roto en todas las páginas, incluido el portal de los clientes. Lo único que sobrevive es `FerreteríaYa/Impresión Rappi/Logo-ToqueFlow-blanco.png` (650×650, con alfa) — sirve solo sobre fondo oscuro | Tú |
| 2 | **`deploy-safe.ps1` haría rollback de un deploy sano** | Su lista `Test-Live` exige 200 en `assets/toqueflow-logo.png`, que da 404. De 12 URLs, 11 pasan. Se arregla al resolver la tarea 1, o sacando esa URL de la lista | Claude |
| 3 | **No existe `backups/last-good-site.zip`** | Tampoco estaba en el portátil viejo: el deploy lleva tiempo corriendo **sin red de seguridad**. Se crea con `deploy-safe.ps1 -SeedLastGood`, que no despliega nada | Claude |

> **Decisión tomada:** el logo queda en pendiente. Las tres se destraban juntas cuando aparezca una versión usable — el original a color, o una versión oscura derivada del blanco.

---

## 🟠 Entorno

| # | Tarea | Detalle | Quién |
|---|---|---|---|
| 4 | **Reiniciar Claude Code** | Los MCP y los plugins se cargan al arrancar. El MCP de n8n y los 7 skills no aparecen hasta abrir una sesión nueva | Tú |
| 5 | `npm i pg --no-save` en `ToqueFlow/plataforma/` | No hay `node_modules`. Los scripts que hablan con Supabase por Postgres directo lo necesitan | Claude |
| 6 | Registrar los submódulos | `n8n-skills` ya tiene contenido y su origen es `github.com/czlonkowski/n8n-skills`. Falta crear el `.gitmodules` o convertirlo en carpeta normal. `n8n-mcp` sigue vacío y ya no hace falta: ahora corre por `npx` | Claude |
| 7 | Instalar Python *(opcional)* | Solo lo necesita `Bejauha/scripts/importar_seguimiento.py` | Tú |
| 8 | Commitear el trabajo de hoy | Nada versionado aún | Tú decides |

---

## 🟠 Seguridad

| # | Tarea | Estado | Quién |
|---|---|---|---|
| 9 | Rotar la `N8N_API_KEY` expuesta | ✅ **Hecha y verificada** — HTTP 200 contra la API. La vieja está muerta | — |
| 10 | Sacar los secretos del repo | ✅ **Hecho** — los 6 archivos sensibles verificados como ignorados por git | — |
| 11 | Rotar el token de Hostinger *(opcional)* | 🟡 Quedó impreso en la terminal al extraerlo. No se filtró a ningún lado, pero rotarlo es gratis | Tú |
| 12 | Auditar los usos de `service_role` | 🟡 RLS está bien construido, pero la `service_role` **se salta RLS por completo** y la usan todos los `.cjs` y las edge functions. Ahí es donde un bug filtraría datos entre clientes | Claude |
| 13 | Probar el aislamiento con datos reales | 🟡 Entrar como usuario de un cliente e intentar leer los de otro. Ya se puede hacer: las credenciales funcionan | Claude |
| 14 | Decidir sobre el historial de git | 🟡 La llave vieja sigue en commits anteriores. Ya revocada, así que es cosmético | Tú |

---

## ✅ Hecho

| # | Tarea | Resultado |
|---|---|---|
| 15 | Clonar y sincronizar el repo | Fast-forward a `ea492f5` sin conflictos |
| 16 | Reconectar los 9 MCP | De rutas absolutas de Linux a `npx`. Verificado que arranca en esta máquina |
| 17 | Limpiar 6 `.claude/settings.json` por cliente | `LuxeSmile` tenía la API key en texto plano **dos veces más**, dentro de reglas de `curl` |
| 18 | Corregir la variable de Hostinger | El `.mcp.json` viejo usaba `APITOKEN`, que **el paquete no lee**: ignoraba el token y se iba por OAuth. Ahora es `HOSTINGER_API_TOKEN` |
| 19 | Traer los archivos del portátil viejo | `credentials.env`, los `.local.*` y `n8n-skills` completo. Verificado contra Supabase: 4 empresas, 8 perfiles |
| 20 | Reescribir el `CLAUDE.md` raíz | Describe ToqueFlow como producto, el portal, las 3 reglas de oro y Bejauha como referencia |
| 21 | Corregir `CONTEXT.md` | Describía un sitio que ya no existe: stack, paleta, fuentes, URL y páginas |
| 22 | Escribir la estrategia de captación | `_docs/estrategia-leads.md` |
| 23 | Reescribir `/nuevo-cliente` | Enseñaba la arquitectura **obsoleta**. Ahora enseña Supabase multi-tenant |
| 24 | Crear el skill `deploy-toqueflow` | Encoda la regla de oro: nunca un deploy parcial |
| 25 | Simplificar la máquina de leads | `contacts`, `campaigns`, `campaign_runs` y la vista Prospectos **ya sirven**. De 5 tablas nuevas a 1 tabla + 1 índice |
| 26 | Escribir `schema-prospeccion.sql` | Índice único por `place_id`, `outreach_events`, `outreach_optouts` (bajas) y `demos`, con RLS |
| 27 | Escribir `seed-toqueflow.cjs` | Da de alta ToqueFlow como empresa con sus 4 flows. **Falta completar el bloque `USER`** antes de correrlo |

---

## 🟡 Skills

| # | Tarea | Para qué |
|---|---|---|
| 28 | `/nuevo-flow` | Encodar el contrato: outbox `n8n_events`, receptor `toque-events`, modo prueba obligatorio |
| 29 | `/migracion` | SQL numerado e idempotente al estilo `Bejauha/database/` |
| 30 | ⛔ Superpowers | **Descartado.** Metodología con TDD y subagentes; este repo no tiene pruebas ni build |

---

## 🟡 Documentación

| # | Tarea | Detalle |
|---|---|---|
| 31 | Retirar los docs obsoletos de Bejauha | `claude.md` y `manual-admins*` describen el sistema viejo de Postgres |

---

## 🟢 Máquina de leads — Fase 0

**Decisión tomada: Opción A** — ToqueFlow se da de alta como una empresa más en su propia plataforma. Sus prospectos viven en `contacts` con `status='prospecto'`, reusando la vista Prospectos y `campanas.html`.

| # | Tarea | Nota | Quién |
|---|---|---|---|
| 32 | Completar el bloque `USER` de `seed-toqueflow.cjs` y correrlo | Es el usuario con el que entras a ver tus prospectos | Tú |
| 33 | Correr `schema-prospeccion.sql` en Supabase | Ya está escrito e idempotente | Claude |
| 34 | Confirmar vertical y ciudad | Recomendación: **spas, Bogotá** | Tú |
| 35 | **Comprar el dominio de outbound y arrancar el warm-up** | ⏱️ **Camino crítico: 3–4 semanas.** Va primero aunque el resto no esté listo | Tú |
| 36 | Configurar SPF, DKIM y DMARC | Antes del primer envío | Claude |
| 37 | Cerrar precio y alcance del piloto | Propuesta: ~$1.500.000 + $350.000/mes | Tú |
| 38 | Places API directa o proveedor gestionado | Estimar costo por 1.000 fichas | Tú + Claude |
| 39 | Definir capacidad mensual de implementación | El cuello de botella no será conseguir leads, será poder atenderlos | Tú |
| 40 | Revisar `Bejauha/database/008_prospeccion.sql` | Ya hay precedente, no diseñar desde cero | Claude |

---

## Orden sugerido

1. **Reiniciar Claude Code** (tarea 4) para que carguen el MCP de n8n y los skills.
2. **Arrancar el warm-up del dominio** (tarea 35). Tarda semanas: cada día que pase retrasa la máquina completa.
3. **Correr el seed y el schema** (tareas 32 y 33). Con eso ToqueFlow existe en su propia plataforma y la Fase 1 puede empezar.
4. **El logo** (tareas 1–3) cuando aparezca una versión usable.
