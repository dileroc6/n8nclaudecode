# ToqueFlow — Contexto del sitio

**Empresa:** ToqueFlow — Infraestructura de IA B2B  
**Stack:** HTML + CSS + JS custom (desarrollo desde cero, sin CMS)  
**URL de prueba:** https://lightyellow-goldfinch-258582.hostingersite.com  
**Estado:** Activo en subdominio de prueba, pendiente dominio de producción

---

## Sistema de diseño

### Paleta (tema oscuro)

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--bg` | `#010101` | Fondo principal |
| `--bg2` | `#0a0a12` | Secciones alternas |
| `--bg3` | `#0d0d1a` | Cards |
| `--violet` | `#8b5cf6` | Acento principal, CTAs |
| `--cyan` | `#06b6d4` | Acento secundario |
| `--white` | `#f4f4f8` | Texto principal |
| `--muted` | `rgba(244,244,248,0.5)` | Texto secundario |
| `--glass-bg` | `rgba(255,255,255,0.04)` | Cards glassmorphism |
| `--glass-border` | `rgba(255,255,255,0.08)` | Bordes glass |
| `--grad` | `linear-gradient(135deg, #8b5cf6, #06b6d4)` | Degradados |

### Tipografía

- **Space Grotesk** — titulares, navegación, CTAs (pesos 300–700)
- **Space Mono** — acentos de código, badges, elementos técnicos

### Efectos visuales

- Fondo: mesh gradient + grid-lines CSS (sin imágenes)
- Cards: glassmorphism con `backdrop-filter: blur`
- Nav: sticky con blur, `rgba(1,1,1,0.7)`

---

## Páginas del sitio

| Archivo | Página |
|---------|--------|
| `ToqueFlow Home.html` | Inicio |
| `servicios.html` | Servicios |
| `agentes-virtuales.html` | Agentes Virtuales |
| `seguimiento-leads.html` | Seguimiento de Leads |
| `automatizacion.html` | Automatización |
| `nosotros.html` | Nosotros |
| `contacto.html` | Contacto |
| `blog.html` | Blog |
| `post-individual.html` | Post individual |

---

## Estructura de archivos

```
site\
├── ToqueFlow Home.html     ← homepage
├── servicios.html
├── agentes-virtuales.html
├── seguimiento-leads.html
├── automatizacion.html
├── nosotros.html
├── contacto.html
├── blog.html
├── post-individual.html
├── HANDOFF-COMPLETO.html   ← referencia de diseño y componentes
├── TEXTOS-COPYWRITING.html ← copy de todas las páginas
├── Logo-ToqueFlow.ai       ← fuente vectorial del logo
└── assets\
    ├── logo-blanco.png
    ├── logo-cyan.png
    ├── logo-full-color.png
    ├── logo-violeta.png
    ├── responsive.css      ← breakpoints globales
    └── mobile-menu.js      ← menú hamburguesa mobile
```

---

## Próximos pasos

- [ ] Definir dominio de producción
- [ ] Migrar a dominio real una vez aprobado
- [ ] Configurar formulario de contacto (Formspree u otro servicio)
