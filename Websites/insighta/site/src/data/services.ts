export interface ServiceMeta {
  slug: string
  number: string
  title: string
  shortTitle: string
  shortDesc: string
  path: string
  metaTitle: string
  metaDesc: string
}

export const ALL_SERVICES: ServiceMeta[] = [
  {
    slug: 'posicionamiento-seo-geo',
    number: '01',
    title: 'Posicionamiento SEO y Buscadores de IA (GEO)',
    shortTitle: 'SEO + GEO',
    shortDesc: 'Posiciona tu marca en Google y en ChatGPT antes que tu competencia.',
    path: '/servicios/posicionamiento-seo-geo',
    metaTitle: 'Posicionamiento SEO y GEO en Colombia | InsightA',
    metaDesc: 'Posicionamos tu marca en Google y aseguramos que ChatGPT, Gemini y Perplexity te recomienden antes que a tu competencia. SEO técnico + estrategia GEO.',
  },
  {
    slug: 'automatizacion-ia',
    number: '02',
    title: 'Atención al Cliente Automatizada e Inteligente 24/7',
    shortTitle: 'IA & Chatbots 24/7',
    shortDesc: 'Asistentes de IA en WhatsApp y tu web que cierran ventas a cualquier hora.',
    path: '/servicios/automatizacion-ia',
    metaTitle: 'Chatbots e IA para Ventas 24/7 | InsightA',
    metaDesc: 'Instalamos asistentes de IA en WhatsApp y tu sitio web que hablan de forma natural, resuelven dudas y cierran ventas a cualquier hora del día.',
  },
  {
    slug: 'diseno-desarrollo-web',
    number: '03',
    title: 'Diseño y Desarrollo Web',
    shortTitle: 'Diseño & Desarrollo Web',
    shortDesc: 'Sitios rápidos, persuasivos y optimizados para convertir visitantes en clientes.',
    path: '/servicios/diseno-desarrollo-web',
    metaTitle: 'Diseño y Desarrollo Web Persuasivo | InsightA',
    metaDesc: 'Diseñamos sitios corporativos, tiendas online y landing pages optimizadas para convertir, usando principios de neuropsicología y UX de clase mundial.',
  },
  {
    slug: 'performance-marketing',
    number: '04',
    title: 'Performance Marketing',
    shortTitle: 'Performance Marketing',
    shortDesc: 'Campañas en Meta, Google y TikTok basadas en ciencia del comportamiento.',
    path: '/servicios/performance-marketing',
    metaTitle: 'Performance Marketing con IA | InsightA',
    metaDesc: 'Creamos campañas en Facebook, Google y TikTok diseñadas para multiplicar tus ventas usando ciencia de datos y psicología del consumidor.',
  },
]

export function getOtherServices(currentSlug: string): ServiceMeta[] {
  return ALL_SERVICES.filter(s => s.slug !== currentSlug)
}
