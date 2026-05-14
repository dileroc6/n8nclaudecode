import { motion, useInView } from 'framer-motion'
import { ArrowRight, Check, Search, MessageCircle, Globe, TrendingUp } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import SchemaMarkup from '../components/SchemaMarkup'

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const BLUE  = '#2563EB'
const MUTED = '#71717A'
const EASE  = [0.22, 1, 0.36, 1] as const

const SERVICES = [
  {
    id: '01',
    slug: 'posicionamiento-seo-geo',
    title: 'Posicionamiento SEO y Buscadores de IA (GEO)',
    tagline: 'Sé el primero en Google y en ChatGPT',
    icon: <Search size={24} />,
    description: 'Posicionamos tu marca en Google y aseguramos que la Inteligencia Artificial (ChatGPT, Gemini, Perplexity) te recomiende antes que a tu competencia. El futuro de la búsqueda ya cambió — estamos preparados para él.',
    items: [
      'Auditoría técnica SEO completa',
      'Optimización on-page y off-page',
      'Estrategia de contenido semántico',
      'Posicionamiento en buscadores de IA (GEO)',
      'Link building y autoridad de dominio',
      'Reportes mensuales con métricas claras',
    ],
  },
  {
    id: '02',
    slug: 'automatizacion-ia',
    title: 'Atención al Cliente Automatizada e Inteligente 24/7',
    tagline: 'Tu equipo de ventas que nunca duerme',
    icon: <MessageCircle size={24} />,
    description: 'Instalamos asistentes de IA en WhatsApp y tu web que hablan de forma natural, resuelven dudas y cierran ventas a cualquier hora. Tus clientes siempre tendrán una respuesta inmediata y personalizada.',
    items: [
      'Chatbots inteligentes para WhatsApp Business',
      'Agentes virtuales con IA en tu sitio web',
      'Conversaciones naturales entrenadas con tu marca',
      'Integración con CRM y herramientas de ventas',
      'Automatización de seguimiento post-venta',
      'Panel de control y análisis de conversaciones',
    ],
  },
  {
    id: '03',
    slug: 'diseno-desarrollo-web',
    title: 'Diseño y Desarrollo Web',
    tagline: 'Tu página web, tu mejor vendedor',
    icon: <Globe size={24} />,
    description: 'Diseñamos tiendas online y webs corporativas rápidas, atractivas y fáciles de usar. Cada elemento está pensado para guiar al visitante hacia la conversión, usando principios de neuropsicología y UX de clase mundial.',
    items: [
      'Sitios corporativos y webs de servicios',
      'Tiendas online y e-commerce (WooCommerce / Shopify)',
      'Landing pages de alta conversión',
      'Diseño UX/UI basado en psicología del consumidor',
      'Optimización de velocidad y Core Web Vitals',
      'Integración con pasarelas de pago y CRM',
    ],
  },
  {
    id: '04',
    slug: 'performance-marketing',
    title: 'Performance Marketing',
    tagline: 'Anuncios que venden, no solo que gustan',
    icon: <TrendingUp size={24} />,
    description: 'Creamos campañas en Facebook, Google, TikTok y más, diseñadas para multiplicar tus ventas. No adivinamos qué funciona; usamos ciencia de datos y comportamiento del consumidor para que cada peso invertido regrese multiplicado.',
    items: [
      'Meta Ads (Facebook e Instagram)',
      'Google Ads (Search, Display y Shopping)',
      'TikTok Ads, LinkedIn Ads y X Ads',
      'Estrategia basada en sesgos cognitivos',
      'Optimización de ROI y CPA en tiempo real',
      'Reportes semanales y ajustes continuos',
    ],
  },
]

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
]

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Servicios de Marketing Digital — InsightA',
  description: 'Servicios de SEO, automatización con IA, diseño web y performance marketing para empresas en Colombia.',
  itemListElement: SERVICES.map((s, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: s.title,
    url: `https://insighta.com.co/servicios/${s.slug}`,
  })),
}

/* Extracted component so hooks (useRef, useInView) follow the rules of hooks */
function ServiceCard({ s, i }: { s: typeof SERVICES[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      id={s.slug}
      key={s.id}
      ref={ref}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: '#E4E4E7' }}
      initial={{ y: 30, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.7, delay: i * 0.08, ease: EASE }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Info */}
        <div className="p-8 md:p-10" style={{ backgroundColor: '#FAFAFA' }}>
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#EEF4FF', color: BLUE }}
            >
              {s.icon}
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-300 tabular-nums">{s.id}</span>
              <h2 className="font-bold text-lg md:text-xl leading-snug mt-0.5" style={{ color: TEXT }}>
                {s.title}
              </h2>
            </div>
          </div>
          <p className="text-sm font-semibold mb-3" style={{ color: NAVY }}>{s.tagline}</p>
          <p className="text-sm leading-relaxed mb-5" style={{ color: MUTED }}>{s.description}</p>
          <Link
            to={`/servicios/${s.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold group"
            style={{ color: NAVY }}
          >
            Ver página completa
            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {/* Lista */}
        <div
          className="p-8 md:p-10 bg-white border-t lg:border-t-0 lg:border-l"
          style={{ borderColor: '#E4E4E7' }}
        >
          <p
            className="text-[10px] font-semibold tracking-widest uppercase mb-6"
            style={{ color: MUTED }}
          >
            Incluye
          </p>
          <ul className="space-y-3">
            {s.items.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: BLUE }} />
                <span className="text-sm" style={{ color: TEXT }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

export default function Servicios() {
  return (
    <div className="bg-white pt-24 md:pt-28">
      <SchemaMarkup schema={SCHEMA} />

      <Breadcrumbs crumbs={CRUMBS} />

      {/* ── Header ── */}
      <section className="px-4 md:px-12 pb-10 pt-4 max-w-7xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: BLUE }}>
          Servicios
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[0.9] tracking-tight"
            style={{ color: TEXT }}
          >
            Todo lo que tu marca necesita para crecer.
          </h1>
          <p className="text-base leading-relaxed max-w-md" style={{ color: MUTED }}>
            No adivinamos qué funciona; predecimos el comportamiento de tu cliente. Usamos ciencia de datos y tecnología de vanguardia para que cada centavo que inviertas en internet regrese a ti multiplicado.
          </p>
        </div>
      </section>

      {/* ── Quick-nav ── */}
      <section className="px-4 md:px-12 pb-12 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <a
              key={s.id}
              href={`#${s.slug}`}
              className="inline-flex items-center gap-2 text-xs font-semibold rounded-full border px-4 py-2 transition-colors hover:border-blue-200 hover:bg-blue-50"
              style={{ borderColor: '#E4E4E7', color: NAVY }}
            >
              <span className="text-[10px] font-bold text-zinc-300">{s.id}</span>
              {s.tagline}
            </a>
          ))}
        </div>
      </section>

      {/* ── Servicios detallados ── */}
      <section className="px-4 md:px-12 pb-24 max-w-7xl mx-auto space-y-6">
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.id} s={s} i={i} />
        ))}
      </section>

      {/* ── CTA ── */}
      <section className="py-20 md:py-28 px-4 md:px-12" style={{ backgroundColor: NAVY }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 text-white/50">
            ¿Por dónde empezamos?
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-[0.95]">
            Agenda tu sesión personalizada
          </h2>
          <p className="text-sm md:text-base text-white/60 mb-10 leading-relaxed">
            Analizamos tu negocio, identificamos las oportunidades más rentables y te presentamos un plan de acción claro.
          </p>
          <Link
            to="/contacto"
            className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-2 py-2 bg-white transition-all duration-300"
          >
            <span className="font-semibold text-sm" style={{ color: NAVY }}>Agenda una cita aquí</span>
            <span
              className="rounded-full w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ backgroundColor: NAVY }}
            >
              <ArrowRight size={14} className="text-white" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  )
}
