# ToqueFlow — Design System (consolidado)

> Referencia interna para mantener consistencia entre páginas. Todos los tokens y patrones aquí están **ya implementados** en `styles.css`.

---

## 1. Colores

### Naranja (brand)
| Token CSS         | Hex                 | Uso                                    |
|-------------------|---------------------|----------------------------------------|
| `--orange-1`      | `#c1272d`           | Inicio del gradiente, más rojizo       |
| `--orange-2`      | `#f15a24`           | Fin del gradiente, naranja luminoso    |
| `--orange-grad`   | linear 135° 1→2     | Todo lo "marca" (CTAs, números, hl)    |

> **Tweak "Intensidad":** subtle / balanced / loud — recompone los hex en runtime. Usar `var(--orange-grad)` siempre, nunca hardcodear hex.

### Teal oscuro
| Token CSS    | Hex       | Uso                                  |
|--------------|-----------|--------------------------------------|
| `--dark-0`   | `#011923` | Original del cliente (raramente)     |
| `--dark-1`   | `#0a2230` | **Fondo de secciones oscuras**       |
| `--dark-2`   | `#0f2a3a` | Tarjetas / superficies elevadas      |
| `--dark-ink` | `#e9ecee` | Texto principal sobre oscuro         |

### Claro
| Token CSS     | Hex       | Uso                                  |
|---------------|-----------|--------------------------------------|
| `--light-0`   | `#ffffff` | **Fondo de secciones claras**        |
| `--light-1`   | `#f4f4f2` | Surfaces alt                         |
| `--light-ink` | `#0a2230` | Texto principal sobre claro          |

### Tokens semánticos (cambian según sección)
- `--bg`, `--ink`, `--mute`, `--line`, `--card` — siempre usar estos. Cada `.section-light` / `.section-dark` los reasigna.

---

## 2. Tipografía

| Token        | Familia                            | Donde                                        |
|--------------|------------------------------------|----------------------------------------------|
| `--sans`     | Sora (default) / Manrope (tweak)   | Todo el body + headlines                     |
| `--mono`     | JetBrains Mono                     | Eyebrows `// label`, HUD tags, números chicos|
| `--brand`    | Audiowide                          | **Solo** números grandes (stats)             |
| `--display`  | = sans                             | Headlines (por compat)                       |

### Escalas (clamps)
| Elemento              | Tamaño                            | Peso |
|-----------------------|-----------------------------------|------|
| `h1` (genérico)       | `clamp(36px, 5.6vw, 92px)`        | 500  |
| `h1` hero-editorial   | `clamp(34px, 5.4vw, 84px)`        | 400  |
| `h1` hero-blueprint   | `clamp(28px, 4vw, 60px)`          | 500  |
| `h1` hero-particles   | `clamp(30px, 4.8vw, 72px)`        | 400  |
| `h2`                  | `clamp(26px, 3.8vw, 56px)`        | 500  |
| `h3`                  | `clamp(18px, 1.7vw, 23px)`        | 600  |
| `h4`                  | 17px                              | 600  |
| Body `p`              | 14.5–16.5px / line-height 1.55    | 400  |
| `.lead`               | `clamp(17px, 1.3vw, 21px)`        | 400  |
| `.eyebrow`            | 11px mono lowercase, letter .05em | 400  |
| `.hero-sub`           | `clamp(16px, 1.2vw, 19px)`        | 400  |

### Highlights (énfasis)
- **`.hl`** — única clase para "frase importante". Aplica `var(--orange-grad)` como background-clip text + shimmer animado sutil. Funciona idéntico sobre claro y oscuro. Úsala con moderación (1–2 por sección).
- **`<em>` en `<h1>`** del hero — equivalente a `.hl` (gradiente naranja).
- **`<mark>`** dentro de `.problem h2` — equivalente, para el dato 60%.

> No mezclar: si vas a resaltar una frase larga, usa `.hl`. Para una línea entera de h1/h2, mejor poner toda la línea con `.hl`.

### Punchline ("frase de marca" inline)
`.punchline` — gradiente naranja, weight 600, `clamp(17px, 1.5vw, 22px)`. Solo para 1 momento por sección.

---

## 3. Botones

### Primario (Activar mi Flow)
- Clase: `.btn .btn-primary`
- Bg: `var(--orange-grad)` + segundo gradiente más brillante que fade-in en hover
- Hover: shine diagonal blanco translúcido (`105°`) cruza en 0.7s, lift -2px, shadow naranja .5
- Padding: `16px 22px`, radius `999px`
- **Cuándo:** primer CTA de cada bloque (hero, CTA final, nav)

### Ghost (Quiero una demo)
- Clase: `.btn .btn-ghost`
- Bg transparente, border `var(--line)`, color `var(--ink)`
- Hover: border `var(--ink)`, padding-right +6px, fill sutil
- **Cuándo:** CTA secundario al lado de un Primary

### Link de servicio (terminal style)
- Clase: `.svc-link`
- Pill bordeado naranja con texto mono `ver_cómo_funciona →`
- Hover: gradiente naranja llena el pill desde la izquierda (0.5s), texto a blanco, dash `──` crece detrás de la flecha
- **Cuándo:** acción terciaria dentro de una card

### Nav links
- `.nav-link` — underline gradiente naranja que se desliza de izq a der en hover
- Color `var(--mute)` → `var(--ink)` en hover

---

## 4. Iconos

| Contexto         | Tamaño contenedor | Tamaño SVG | Fondo                  | Color   |
|------------------|-------------------|------------|------------------------|---------|
| Service card     | 56×56 r-14        | 28×28      | `var(--orange-grad)`   | `#fff`  |
| Symptom card     | 36×36 r-10        | 20×20      | `var(--orange-grad)`   | `#fff`  |
| Why-reason       | 44×44 r-12        | 22×22      | `var(--orange-grad)`   | `#fff`  |
| Nav dropdown     | 36×36 r-10        | 18×18      | `--orange-grad-soft` → grad en hover | naranja → blanco |
| SVG stroke       | —                 | —          | —                      | `1.6`–`1.8` |

> **Regla:** sobre fondo claro = bg naranja sólido + icono blanco. Sobre fondo oscuro = igual (consistencia). No usar icono naranja outline.

---

## 5. Cards

### Service card (`.svc`)
- Border `1px var(--line)`, radius `18px`, padding `32px`, min-height `340px`
- Hover sutil: sweep naranja 5% diagonal, border 18% naranja, lift 1px (1.3s)
- Variantes via tweak: `lines` (default) / `solid` / `glass`

### Testimonial card (`.t-card`)
- Idéntico al svc en estructura. Mismo hover.

### Symptom card (`.symptom`)
- Más compacto: padding `16px 18px`, radius `12px`, gap interior `14px`
- Hover: `translateX(4px)` + border naranja

### Glass dropdown (`.nav-drop-menu`)
- Background `color-mix(--bg, 94%)` + `backdrop-filter: blur(22px) saturate(160%)`
- Diamond arrow pegado al botón, bridge invisible

---

## 6. Section divider

- Component `<SectionDivider />` (sections.jsx)
- Hairline gradiente a ambos lados + favicon TF central (22×22) con drop-shadow naranja
- **Cuándo:** SOLO entre dos secciones del mismo fondo. Si cambia de claro→oscuro o viceversa, el cambio de bg ES el divider.

---

## 7. Stats y números

### Megastats (`.stats-mega`)
- Grid 4 columnas con `border-left` separador
- Número: `var(--brand)` (Audiowide), `clamp(48px, 5.6vw, 84px)`, gradiente naranja
- Label: mono `// negocios funcionando con flow`
- Prefix opcional ("hasta") absoluto arriba en mono naranja

### Stat-prefix
- Posición absoluta `top: 28px; left: 32px` para no desalinear el número con sus hermanos
- Mono naranja con dash `─` decorativo

---

## 8. Animaciones

### Reveal on scroll (`[data-reveal]`)
- Default: opacity 0 + translateY(24px) → fade-up en 0.9s (cubic-bezier .2,.7,.3,1)
- Stagger via `data-reveal-delay="1..5"` (6→38ms cada uno)
- Variantes: `data-reveal="scale"`, `data-reveal="left"`, `data-reveal="right"`, `data-reveal="fade"`
- Trigger: IntersectionObserver con threshold 12%, rootMargin `-6%` bottom

> **Cuándo NO usar reveal:** sobre elementos del nav o tweaks panel (siempre visibles).

### Micro-movimientos perpetuos
- Stats numbers: `numFloat` ±2px en loop 6s después del reveal
- `.hl`: shimmer del gradiente en loop 12s
- WhatsApp badge: pulse naranja 2.2s
- WhatsApp typing dots: 1.2s con stagger

### Hover transitions
| Elemento     | Duración | Easing                       |
|--------------|----------|------------------------------|
| Botón        | 0.25s    | `cubic-bezier(.5,.05,.2,1)`  |
| Card sweep   | 1.3s     | `cubic-bezier(.2,.7,.3,1)`   |
| Nav link     | 0.25s    | `ease`                       |
| Arrow `→`    | 0.35s    | `cubic-bezier(.5,.05,.2,1)`  |
| Symptom card | 0.2s     | `ease`                       |

`prefers-reduced-motion: reduce` desactiva todo.

---

## 9. Espaciado

| Token       | Valor                            | Uso                              |
|-------------|----------------------------------|----------------------------------|
| `--pad-y`   | `calc(88px * var(--density))`    | Padding vertical de `.section`   |
| `--container`| `1320px`                        | Max-width interno                |
| Container padding horizontal | `32px` desktop, `24px` tablet, `20px` mobile | — |
| `.shead` margin-bottom | 64px desktop, 32px mobile | Entre header de sección y contenido |

**Tweak "Densidad":** compact (0.78) / regular (1.0) / comfy (1.22).

---

## 10. Layouts

### Hero
3 variantes via tweak `hero`:
- **Editorial** (dark): h1 grande, video bg + glow + chat card flotante, hero-meta 4 cols inferior, HUD corners
- **Blueprint** (light): grid técnico, FlowDiagram animado a la derecha, h1 condensado
- **Particles** (dark): centrado, video bg + glow central + partículas en CSS

### Section grids
| Sección       | Desktop  | Tablet (760-1080) | Mobile (<760) |
|---------------|----------|-------------------|---------------|
| Stats         | 4 cols   | 2 cols            | 1 col         |
| Problem       | 2 cols   | 2 cols (gap 48)   | 1 col         |
| Services      | 3 cols   | 2 cols + 3rd center | 1 col       |
| Why reasons   | 3 cols   | 2 cols            | 1 col         |
| Testimonials  | 3 cols   | 2 cols + 3rd center | 1 col       |
| Footer        | 4 cols   | 3 cols (1.4 1 1)  | 1 col         |

---

## 11. Reglas no negociables

1. **Naranja gradiente** = brand. Nunca usar naranja sólido fuera de iconos blancos.
2. **Sora + Audiowide** = identidad. Mono solo para etiquetas técnicas (`// label`, `08:14`, `v.26`).
3. **No emojis** — siempre SVG iconos con stroke 1.6–1.8.
4. **Cards = bordes finos** por default. Glass solo via tweak.
5. **Hover sutil** — sweep < 10% opacity naranja. Nada agresivo.
6. **Divider solo entre secciones del mismo fondo**.
7. **Eyebrow obligatorio** en cada `<section>` mayor — formato `// label`.
8. **Highlights selectivos** — máximo 2 `.hl` por sección, fuera de h1/h2.
9. **No `--orange-*` hardcodeado** — siempre via custom property para que el tweak funcione.

---

## 12. Estructura de archivos

```
index.html           ← entry point, carga fonts + scripts
styles.css           ← TODO el CSS (tokens, base, secciones, responsive, motion)
tweaks-panel.jsx     ← shell de tweaks (starter component)
motion.jsx           ← initRevealObserver + Counter component
hero.jsx             ← 3 variantes del hero
sections.jsx         ← BrandStrip, StatsMega, Problem, Services, WhyUs, Testimonials, FinalCTA, SectionDivider, WhatsAppMock
app.jsx              ← Nav, Footer, App root + TWEAK_DEFAULTS
assets/
  toqueflow-logo.png ← logo con wordmark (nav, footer)
  favicon.png        ← solo TF mark (favicon, section divider)
  hero-bg.mp4        ← video del hero
```

Cuando agregues una página nueva:
1. Lee este styleguide
2. Importa los mismos scripts en orden
3. Reutiliza `<Nav />`, `<Footer />`, `<SectionDivider />`
4. Sigue las clases existentes — no inventes nuevas sin actualizar este doc
