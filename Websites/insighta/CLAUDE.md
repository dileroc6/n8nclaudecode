# InsightA — Sitio web

React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion. Deploy estático en Hostinger.

## Deploy

```
Dominio: blue-snail-525654.hostingersite.com
Herramienta: deployStaticWebsite (Hostinger MCP)
Último build: site/dist_20260510_111000.zip
```

Para hacer un nuevo build y deploy:
```bash
cd site
npm install       # solo si no tienes node_modules
npm run build     # genera dist/
# Zipar dist/ → deployStaticWebsite al dominio de arriba
```

## Estructura del proyecto

```
site/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── Hero.tsx, About.tsx, Features.tsx, Contact.tsx
│   │   ├── Navbar.tsx, Footer.tsx
│   │   ├── ServiceHero.tsx, ServicesMegaMenu.tsx, ServiceTestimonials.tsx
│   │   ├── EntregablesGrid.tsx, ParaQuienEs.tsx, OtrosServicios.tsx
│   │   ├── BottomCTASection.tsx, StickyContact.tsx, TrustBadges.tsx
│   │   ├── Breadcrumbs.tsx, Accordion.tsx, HeroParticles.tsx
│   │   ├── Seo.tsx, SchemaMarkup.tsx
│   │   └── shared/ (AnimatedLetter, WordsPullUp, WordsPullUpMultiStyle)
│   ├── pages/
│   │   ├── Home.tsx, Nosotros.tsx, Servicios.tsx
│   │   ├── Contacto.tsx, Blog.tsx, BlogPost.tsx
│   │   └── servicios/
│   │       ├── SeoGeo.tsx
│   │       ├── AutomatizacionIA.tsx
│   │       ├── DisenoWeb.tsx
│   │       └── PerformanceMarketing.tsx
│   └── data/
│       ├── services.ts
│       └── blog.tsx
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── 0_Woman_Portrait_1920x1080.mp4   ← video de fondo
```

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + Framer Motion (animaciones scroll)
- React Router DOM (SPA multi-página)
- Lucide React (iconos)
- Fuentes: Montserrat + Instrument Serif (Google Fonts)

## Contexto completo

Ver `CONTEXT.md` para sistema de diseño y paleta de colores.
