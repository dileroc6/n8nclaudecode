# QDMP — Que Dice Mi Perro · Guía de Diseño y Referencia Técnica

**Cliente:** Que Dice Mi Perro  
**Tipo:** Guardería, hotel y bienestar canino sin jaulas · Bogotá, Colombia  
**Ruta:** `d:\Ferney Rojas\Proyectos\ToqueFlow\Websites\QDMP\`

---

## Estructura del proyecto

```
QDMP/
├── index.html          # Home
├── nosotros.html       # Quiénes somos
├── servicios.html      # Servicios detalle
├── precios.html        # Precios (tabs)
├── contacto.html       # Contacto + form
├── .htaccess
├── .mcp.json           # Hostinger deploy
└── assets/
    ├── styles.css      # 1 353 líneas — sistema de diseño completo
    ├── site.js         # 147 líneas — interacciones core
    ├── tweaks-panel.jsx # 569 líneas — panel React para ajustes visuales
    ├── logo.png / logo-dark.png / isotipo.png
    ├── fonts/321impact.ttf
    ├── banner/         # dog-contacto/nosotros/precios/servicios.png
    ├── icons/          # heart/hotel/paw/peluqueria/shampoo/transporte · black + orange + yellow
    └── photos/         # dog-01.jpg … dog-14.jpg (referenciadas en HTML)
```

---

## Paleta de colores

| Token | Hex | Uso |
|---|---|---|
| Brand Yellow | `#F5C518` | Acento primario, fondos de sección |
| Brand Yellow Soft | `#FFE9A8` | Fondos suaves, badges |
| Brand Yellow Deep | `#E0A800` | Hover del amarillo |
| Brand Orange | `#E84D2A` | Acento secundario, highlights |
| Brand Orange Deep | `#C13E1F` | Hover del naranja |
| Brand Black | `#1A1A1A` | Texto principal, elementos oscuros |
| Brand Cream | `#FFF8E7` | Fondo general de página |
| Brand White | `#FFFFFF` | Fondos de cards |
| Ink 900 | `#1A1A1A` | Texto primario |
| Ink 700 | `#3a342a` | Texto secundario |
| Ink 500 | `#6b6357` | Texto terciario |
| Ink 300 | `#b8ad9b` | Texto suave |
| Ink 100 | `#ebe2cd` | Texto muy claro |

---

## Tipografía

| Rol | Familia | Pesos | Fuente |
|---|---|---|---|
| Headings display | **Lato** | 900 | Google Fonts |
| Body / UI | **Plus Jakarta Sans** | 400 500 600 700 800 | Google Fonts |
| Decorativo script | **Caveat** | 500 700 | Google Fonts |
| Impacto local | 321impact | regular | `/assets/fonts/321impact.ttf` |

### Escala de texto (clamp)

```css
.h-hero     → clamp(34px, 5.2vw, 78px)    /* Título hero */
.h-section  → clamp(28px, 4vw, 54px)      /* Sección heading */
.h-card     → clamp(20px, 2.1vw, 26px)    /* Card heading */
body        → clamp(16px, 1.05vw, 18px)   /* Base */
.lede       → clamp(16px, 1.25vw, 19px)   /* Intro párrafo */
.eyebrow    → 11.5px                       /* Etiqueta / categoría */
```

---

## Tokens de espaciado y forma

```css
--radius-sm: 12px
--radius-md: 20px
--radius-lg: 28px
--radius-xl: 36px
--max-w:     1240px
```

### Sombras

```css
--shadow-sticker:     0 1px 2px rgba(26,26,26,.04), 0 8px 24px -10px rgba(26,26,26,.12)
--shadow-sticker-sm:  0 1px 2px rgba(26,26,26,.04), 0 4px 12px -6px rgba(26,26,26,.08)
--shadow-soft:        0 18px 40px -20px rgba(26,26,26,.18)
--shadow-hard:        0 30px 60px -25px rgba(26,26,26,.35)
```

### Easings personalizados

```css
--ease-out-expo: cubic-bezier(.16,1,.3,1)
--ease-out-back: cubic-bezier(.34,1.56,.64,1)
```

---

## Sistema de botones

| Clase | Estado normal | Hover |
|---|---|---|
| `.btn-primary` | Negro | Naranja |
| `.btn-outline` | Transparente | Negro |
| `.btn-yellow` | Amarillo | Yellow Deep |

Los botones tienen overrides contextuales: sobre fondo naranja, amarillo o negro cambia la combinación automáticamente para mantener la jerarquía visual.

Interacción: `translateY(-2px)` + sombra en hover; `translateY(0)` en active.

---

## Componentes principales

### Header
- Sticky con clase `.scrolled` cuando `scrollY > 40px`
- Nav con underline animado + ícono de pata en hover
- Menú móvil: slide-in desde abajo
- Página activa: clase `.current` + pata visible + underline amarillo

### Service Card (`.svc-card`)
- Grid 3 columnas (colapsa a 1 en móvil < 600px)
- Fondo amarillo en home, blanco en servicios
- Ícono intercambia de negro a naranja/amarillo en hover
- Patrón SVG de patas en el fondo del card

### About Grid (`.about-grid`)
- 2 columnas: imagen + contenido
- Efecto "frame-back" amarillo desplazado detrás de la imagen
- Badge de estadística superpuesto sobre la imagen
- Colapsa a 1 columna en < 900px

### Why Grid (`.why-grid`)
- 4 columnas · ícono centrado + texto
- Hover: `transform` con cambio de color de ícono

### Section Head
- Grid 1.1fr / 0.9fr
- Columna izquierda: eyebrow + heading
- Columna derecha: párrafo + CTA

### Tabs (precios)
- Estilo segmented control
- Tab activo: fondo amarillo
- Transición suave entre paneles

### FAQ / Acordeón
- Solo un item abierto a la vez
- `max-height` animado desde `scrollHeight`
- Botón de toggle rota 45°

### Polaroids / Testimonios
- Carrusel de loop continuo (los elementos se clonan con `aria-hidden="true"`)
- Rotación individual: de -4° a 5°
- Animación de balanceo: duración 4.5s–5.5s con delays escalonados
- Hover: pausa animación + `scale(1.04)` + `translateY(-12px)` + z-index
- Clip-path con forma de clip de papel

---

## Breakpoints responsive

| Breakpoint | Ajuste |
|---|---|
| ≤ 1023px | Nav oculto, botón de menú móvil activo |
| ≤ 980px | Ajustes de grid general |
| ≤ 900px | About grid → columna única |
| ≤ 720px | Fine-tuning móvil |
| ≤ 600px | Services grid → columna única |
| ≤ 560px | Dog del banner oculto, padding reducido |
| ≤ 540px | Form → columnas apiladas |

---

## Animaciones

### Reveal en scroll (CSS + IntersectionObserver)
```css
.reveal → opacity 0→1, translateY(40px→0)
.delay-1/2/3/4/5 → delays escalonados
Threshold: 0.12 · RootMargin: "0px 0px -60px 0px"
```

### Hero (GSAP timeline)
1. Eyebrow: Y slide
2. Palabras del título: rotateX staggered
3. Subtexto y CTAs: Y slide
4. Stats: Y slide + counter animado
5. Visual: scale + opacity (back.out easing)
6. Float decorators (patas/estrellas/sol): parallax ScrollTrigger

Todos los GSAP respetan `prefers-reduced-motion`.

---

## JavaScript (site.js) — resumen de funciones

| Función | Qué hace |
|---|---|
| Header scroll state | Clase `.scrolled` en `scrollY > 40` |
| Mobile menu | Toggle `.open` con botón y cierre en links |
| Nav highlight | Lee `pathname`, marca `.current` + muestra pata |
| Scroll reveals | IntersectionObserver activa clase `.in` |
| Pricing tabs | Cambia panel activo, aria-selected |
| FAQ accordion | Expande/colapsa con max-height dinámico |
| Contact form | Arma mensaje y abre WhatsApp Web |
| Polaroid carousel | Clona hijos, activa animación CSS de loop |
| Hero GSAP | Timeline con 7 pasos + parallax decoraciones |

---

## Tweaks Panel (tweaks-panel.jsx)

Panel React draggable para ajustes en tiempo real. **Solo para desarrollo/presentación.**

| Tweak | Tipo | Default | Efecto |
|---|---|---|---|
| `posterMode` | toggle | `false` | Muestra decoraciones flotantes (patas, estrellas, sol) |
| `marquee` | toggle | `true` | Oculta el band de marquee |
| `density` | radio | `"comoda"` | `body.t-compact` reduce paddings y radius |
| `accent` | radio | `"black"` | `body.t-accent-orange` → botones e isotipo en naranja |

---

## Dependencias externas (CDN)

| Librería | Versión | Uso |
|---|---|---|
| GSAP | 3.12.5 | Animaciones hero |
| ScrollTrigger | 3.12.5 | Parallax scroll |
| React + ReactDOM | 18.3.1 | Tweaks panel |
| Babel Standalone | 7.29.0 | Transpilación JSX |
| Google Fonts | — | Bungee, Black Ops One, Lato, Plus Jakarta Sans, Caveat |

---

## Páginas y contenido

### Home (`index.html`)
Hero → Marquee → Grid de 6 servicios → Teaser nosotros → Testimonios polaroids → CTA strip → Footer

### Nosotros (`nosotros.html`)
Banner → Filosofía (about-grid) → Diferenciadores (why-grid 4 cols) → 3 cards operativos → CTA

### Servicios (`servicios.html`)
Grid de 6 tarjetas → 6 secciones detalle con imagen alternada L/R + lista de features:
1. Guardería Indoor
2. Hotel 24/7
3. Baño y Peluquería
4. Profilaxis Dental
5. Paseos
6. Ruta Pet

### Precios (`precios.html`)
3 tabs: **Hotel** / **Guardería por días** / **Guardería mensual**

| Plan | Rango |
|---|---|
| Hotel por noche | $50k – $82k |
| Guardería día | $13k – $72k (por bloque/día) |
| Guardería mensual | $240k – $680k |

Servicios adicionales: Ruta y Paseos. Sección FAQ al final.

### Contacto (`contacto.html`)
Banner → 3 cards de contacto → Form reserva (→ WhatsApp) → FAQ 7 preguntas

---

## Datos de negocio

| | |
|---|---|
| **Teléfono / WhatsApp** | 311 214 6996 |
| **Ciudad** | Bogotá, Colombia |
| **L–V** | 6:00am – 6:30pm |
| **S–D** | 8:30am – 5:30pm |
| **Hotel** | 24/7 |
| **Instagram** | @quedicemiperro · @quedicemiperrocol |
| **WhatsApp link** | `https://wa.me/573112146996` |

---

## Decisiones de diseño clave

- **Sin jaulas** → espacio visual amplio, fondos claros, tipografía abierta
- **Motivo de patas** → nav hover, SVG pattern en cards, clips de polaroid
- **Amarillo + naranja** → energético pero no agresivo; legible sobre crema y negro
- **GSAP solo en hero** → máximo impacto sin sobrecarga de JS en el resto
- **Polaroids** → autenticidad y confianza (vs. testimonios genéricos)
- **Marquee** → refuerza diferenciadores sin sonido ni distracción
- **WhatsApp como CTA primario** → alineado con comportamiento colombiano
- **Clamp() en todo** → tipografía y espaciado se escalan solos sin breakpoints adicionales
- **Botones context-aware** → la jerarquía se mantiene independientemente del fondo de sección
