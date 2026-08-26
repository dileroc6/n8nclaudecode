# ToqueFlow — Contexto del sitio

**Producto:** ToqueFlow — plataforma de automatizaciones, con o sin IA, para pymes
**Stack:** HTML + JSX compilado en el navegador (React 18 UMD + Babel standalone) · **sin build** · backend Supabase
**URL:** https://toqueflow.com (Hostinger, dominio addon)
**Estado:** En producción. El sitio público y la consola privada multi-cliente viven en el mismo despliegue.

> Fuente de verdad de este documento: `site/styles.css` (tokens) y `site/chrome.jsx` (tokens aplicados en runtime).
> Guía operativa (deploy, seeds, scripts): [_docs/README.md](_docs/README.md) · Plataforma y contrato con n8n: [CLAUDE.md](CLAUDE.md)

---

## Cómo está construido

No hay framework de build, ni bundler, ni CMS. Cada página es un `.html` mínimo que carga React y Babel desde unpkg y luego los `.jsx` como `type="text/babel"`. Babel los compila en el navegador.

```html
<div id="root"></div>
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"></script>
<script type="text/babel" src="chrome.jsx"></script>
<script type="text/babel" src="app.jsx"></script>
```

**Consecuencias prácticas:**
- Editar un `.jsx` y desplegar es todo el ciclo. No hay `npm run build`.
- El deploy estampa `?v=<fecha>` a los `.jsx` y `.css` para romper caché — el cambio se ve al instante, sin `Ctrl+Shift+R`.
- Los scripts de React y Babel vienen de CDN con `integrity`. Si unpkg cae, el sitio no renderiza.

---

## Sistema de diseño

### Paleta

Definida en `site/styles.css`. La marca es un degradado naranja sobre una familia oscura azul petróleo.

| Token | Valor | Uso |
|---|---|---|
| `--orange-1` | `#c1272d` | Rojo de marca, inicio del degradado |
| `--orange-2` | `#f15a24` | Naranja de marca, fin del degradado |
| `--orange-grad` | `linear-gradient(135deg, #c1272d, #f15a24)` | Acentos, CTAs, cifras destacadas |
| `--dark-1` | `#0a2230` | Fondo oscuro principal |
| `--dark-2` | `#0f2a3a` | Fondo oscuro secundario, cards |
| `--dark-0` | `#011923` | Oscuro original (heredado) |
| `--dark-ink` | `#e9ecee` | Texto sobre oscuro |
| `--light-0` | `#ffffff` | Fondo claro principal |
| `--light-1` | `#f4f4f2` | Fondo claro secundario |
| `--light-ink` | `#0a2230` | Texto sobre claro |

Los tokens activos (`--bg`, `--ink`, `--mute`, `--line`, `--card`) apuntan a la familia clara u oscura según el modo. **Nunca escribir un color literal en un componente: siempre a través del token activo.**

### Tipografía

| Token | Familia | Rol |
|---|---|---|
| `--brand` | **Audiowide** | Solo el logotipo y cifras grandes de impacto |
| `--sans` | **Sora** (por defecto en CSS) | Titulares e interfaz |
| `--sans` en runtime | **Manrope** | `chrome.jsx` lo sobrescribe en las páginas internas |
| `--mono` | **JetBrains Mono** | Datos, etiquetas, elementos técnicos |
| — | Instrument Serif | Acentos editoriales, cargada en las páginas de marketing |

⚠️ **Ojo con `--sans`.** `styles.css` lo define como Sora, pero `applyDefaultTokens()` en `chrome.jsx` lo reasigna a Manrope al cargar. El resultado efectivo en la mayoría de páginas es **Manrope para texto, Sora solo donde se pide explícitamente**.

Las páginas de marketing cargan el juego completo (Sora, Manrope, Instrument Serif, JetBrains Mono, Audiowide). Las páginas de la consola cargan solo Sora + JetBrains Mono.

### Modo y variantes

El tema no se resuelve con `prefers-color-scheme`. Se controla con atributos en `<html>`, aplicados por `applyDefaultTokens()` en `chrome.jsx`:

| Atributo | Valores | Por defecto |
|---|---|---|
| `data-mode` | `mixed` · `dark` · `light` | `mixed` — secciones claras y oscuras alternadas |
| `data-bg-tone` | `darker` · `standard` · `lighter` | `standard` |
| `data-hero` | `particles` · otros | `particles` |
| `data-card-style` | `lines` · otros | `lines` |
| `data-density` | `regular` · otros | `regular` |

La página de inicio además carga `tweaks-panel.jsx`, un editor en vivo de estos tokens. Las páginas internas usan `applyDefaultTokens()` para tener el mismo resultado sin el panel.

### Escala y efectos

- `--container: 1320px` · `--pad-y: 88px * --density`
- Fondo: mesh gradient y grid en CSS, sin imágenes
- Cards: glassmorphism con `backdrop-filter`
- Nav: sticky con blur, cambia de tratamiento al pasar 24px de scroll

---

## Páginas

### Sitio público

| Archivo | Página |
|---|---|
| `index.html` | Inicio — «Que tu negocio venda solo» |
| `nosotros.html` | Nosotros |
| `contacto.html` | Contacto (ancla `#diagnostico`) |
| `blog.html` · `blog-post.html` | Blog e individual |
| `servicios/agentes-virtuales.html` | Agentes de IA |
| `servicios/automatizacion.html` | Automatización de procesos |
| `servicios/integraciones.html` | Integraciones y sistemas |
| `servicios/seguimiento-leads.html` | Tableros y seguimiento |

### Consola del cliente (privada, RLS por `company_id`)

| Archivo | Página |
|---|---|
| `login.html` | Entrada |
| `dashboard.html` | Cards de flows del cliente (tabla `flows`, `tool_url`) |
| `contactos.html` | Base de datos de contactos |
| `campanas.html` | Campañas: segmentar, programar, medir |
| `modo-prueba.html` | Sandbox sin WhatsApp real |
| `perfil.html` · `ajustes.html` | Cuenta y configuración |
| `admin.html` | Administración (superadmin ToqueFlow) |

### Herramientas por cliente

| Archivo | Cliente |
|---|---|
| `rappi-bogota.html` · `rappi-medellin.html` | FerreteríaYa — impresión Rappi |
| `sm-grand/ocupacion.html` | SM Grand Hotel — ocupación |

---

## Estructura de archivos

```
site/
├── *.html                  ← una por página, mínimas (cargan React + los .jsx)
├── styles.css              ← TODOS los tokens y estilos
├── chrome.jsx              ← Nav, Footer y applyDefaultTokens() — compartido
├── motion.jsx              ← utilidades de animación
├── tweaks-panel.jsx        ← editor de tokens en vivo (solo en index)
├── hero.jsx · sections.jsx · app.jsx        ← inicio
├── nosotros.jsx · contacto.jsx · blog.jsx · blog-post.jsx
├── login.jsx · dashboard.jsx · dash-chrome.jsx · admin.jsx
├── perfil.jsx · ajustes.jsx · rappi-tool.jsx
├── servicios/              ← .html + .jsx de cada servicio
├── sm-grand/               ← ocupacion.html + data.csv
├── assets/
│   ├── responsive.css      ← breakpoints globales
│   └── mobile-menu.js      ← menú hamburguesa
└── supabase/               ← schema + edge functions — NO se despliega
```

⚠️ La media pesada de `assets/` (png, webp, jpg, mp4, mov) está **gitignoreada**: se versiona el código, no los binarios. Los respaldos viven en `backups/` y en el sitio en vivo.

---

## Contacto público

- Correo: `hola@toqueflow.com`
- WhatsApp: `+57 320 555 0142`

---

## Reglas al tocar el sitio

1. **Colores solo por token.** Un literal rompe el modo contrario.
2. **`chrome.jsx` es compartido.** Un cambio ahí afecta todas las páginas.
3. **Nunca desplegar parcial.** Un zip con pocos archivos puede vaciar el sitio. Usar siempre `deploy-safe.ps1`, que sube el sitio completo, verifica y hace rollback automático.
4. **`site/supabase/` no se publica.** Contiene el schema y las edge functions.
5. **Los cambios de datos** (clientes, usuarios, flows) son Supabase — no necesitan deploy.
6. **Tono de cara al usuario:** español neutro (Colombia).
