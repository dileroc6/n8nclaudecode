# InsightA — Contexto del sitio

**Empresa:** InsightA — Agencia de marketing digital (Bogotá, Colombia)  
**Propuesta:** Psicología del consumidor + IA para marketing digital  
**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion  
**URL de prueba:** https://blue-snail-525654.hostingersite.com  
**Estado:** Activo en subdominio de prueba, último build 2026-05-10

---

## Sistema de diseño

### Paleta (tema oscuro)

| Token | Valor | Uso |
|-------|-------|-----|
| Fondo | `#000000` | Fondo principal |
| Card bg | `#101010` | Secciones / cards |
| Primary text | `#D0E4FF` | Titulares |
| Accent | `#7CB9FF` | Botones, labels, highlights |
| Accent muted | `rgba(124,185,255,0.5)` | Texto secundario |
| Border | `rgba(124,185,255,0.1)` | Separadores |

### Tipografía

- **Montserrat** — fuente principal, headings y body (pesos 300–800)
- **Instrument Serif** — itálica, para frases de impacto en titulares

### Efectos visuales

- Glow azul en hero (`hero-bg`, `hero-glow`)
- Noise overlay (textura de grano)
- Animaciones scroll: `useInView` + Framer Motion (`useScroll`, `scrollYProgress`)
- Texto animado carácter a carácter en scroll (About)

---

## Páginas (React Router)

| Página | Archivo |
|--------|---------|
| Home | `pages/Home.tsx` |
| Nosotros | `pages/Nosotros.tsx` |
| Servicios (listado) | `pages/Servicios.tsx` |
| SEO y GEO | `pages/servicios/SeoGeo.tsx` |
| Automatización IA | `pages/servicios/AutomatizacionIA.tsx` |
| Diseño Web | `pages/servicios/DisenoWeb.tsx` |
| Performance Marketing | `pages/servicios/PerformanceMarketing.tsx` |
| Contacto | `pages/Contacto.tsx` |
| Blog | `pages/Blog.tsx` |
| Post individual | `pages/BlogPost.tsx` |

---

## Componentes

**Secciones principales:**
- `Hero.tsx` — hero full-screen, nombre gigante, CTA "Agenda una cita"
- `About.tsx` — texto animado carácter a carácter por scroll, stats (10 años / 380+)
- `Features.tsx` — servicios en cards
- `Contact.tsx` — formulario de contacto
- `Navbar.tsx` — nav con `ServicesMegaMenu.tsx`
- `Footer.tsx`

**Páginas de servicio:**
- `ServiceHero.tsx` — hero reutilizable por servicio
- `ServiceTestimonials.tsx`, `EntregablesGrid.tsx`, `ParaQuienEs.tsx`
- `OtrosServicios.tsx`, `BottomCTASection.tsx`

**UI / utilidades:**
- `HeroParticles.tsx` — partículas animadas
- `StickyContact.tsx` — botón flotante de contacto
- `TrustBadges.tsx` — badges de confianza
- `Breadcrumbs.tsx`, `Accordion.tsx`
- `Seo.tsx`, `SchemaMarkup.tsx` — SEO y schema.org

**Shared / animaciones:**
- `AnimatedLetter.tsx` — animación por carácter en scroll
- `WordsPullUp.tsx`, `WordsPullUpMultiStyle.tsx` — entrada animada de palabras

---

## Data

- `data/services.ts` — datos de los 4 servicios
- `data/blog.tsx` — posts del blog

---

## Copy clave

- **H1 hero:** "InsightA" (tipografía gigante `clamp(3rem, 14vw, 16vw)`, color `#D0E4FF`)
- **Subtítulo:** "Hackeamos el crecimiento de tu marca combinando la psicología del consumidor con IA."
- **CTA:** "Agenda una cita"
- **Stats:** 10 años experiencia / 380+ proyectos
- **Contacto:** 312 345 6789 | Lun-Vie 9am-5pm
- **Redes:** Facebook, Instagram, TikTok

---

## Estructura de archivos

```
site\
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── 0_Woman_Portrait_1920x1080.mp4   ← video de fondo hero
├── dist_20260510_111000.zip         ← último build listo para deploy
└── src\
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components\
    │   ├── Hero.tsx, About.tsx, Features.tsx, Contact.tsx
    │   ├── Navbar.tsx, Footer.tsx
    │   ├── ServiceHero.tsx, ServicesMegaMenu.tsx, ServiceTestimonials.tsx
    │   ├── EntregablesGrid.tsx, ParaQuienEs.tsx, OtrosServicios.tsx
    │   ├── BottomCTASection.tsx, StickyContact.tsx, TrustBadges.tsx
    │   ├── Breadcrumbs.tsx, Accordion.tsx, HeroParticles.tsx
    │   ├── Seo.tsx, SchemaMarkup.tsx
    │   └── shared\
    │       ├── AnimatedLetter.tsx
    │       ├── WordsPullUp.tsx
    │       └── WordsPullUpMultiStyle.tsx
    ├── pages\
    │   ├── Home.tsx, Nosotros.tsx, Servicios.tsx
    │   ├── Contacto.tsx, Blog.tsx, BlogPost.tsx
    │   └── servicios\
    │       ├── SeoGeo.tsx
    │       ├── AutomatizacionIA.tsx
    │       ├── DisenoWeb.tsx
    │       └── PerformanceMarketing.tsx
    └── data\
        ├── services.ts
        └── blog.tsx
```

---

## Flujo de deploy

```bash
cd site
npm install        # solo si no hay node_modules
npm run build      # genera dist/
# Zipar dist/ y hacer deployStaticWebsite a blue-snail-525654.hostingersite.com
```

---

## Próximos pasos

- [ ] Completar formulario funcional en Contact.tsx
- [ ] Definir dominio de producción
- [ ] Migrar a dominio real una vez aprobado
