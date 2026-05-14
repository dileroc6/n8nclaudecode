import Seo from '../../components/Seo'
import SchemaMarkup from '../../components/SchemaMarkup'
import ServiceHero from '../../components/ServiceHero'
import TrustBadges from '../../components/TrustBadges'
import EntregablesGrid from '../../components/EntregablesGrid'
import ParaQuienEs from '../../components/ParaQuienEs'
import type { AudienceItem } from '../../components/ParaQuienEs'
import ServiceTestimonials from '../../components/ServiceTestimonials'
import type { Testimonial } from '../../components/ServiceTestimonials'
import Accordion from '../../components/Accordion'
import type { AccordionItem } from '../../components/Accordion'
import OtrosServicios from '../../components/OtrosServicios'
import BottomCTASection from '../../components/BottomCTASection'

const TEXT = '#09090b'
const BLUE = '#2563EB'

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Diseño y Desarrollo Web', href: '/servicios/diseno-desarrollo-web' },
]

const ENTREGABLES = [
  'Diseño UX/UI basado en principios de neuropsicología y comportamiento del usuario',
  'Desarrollo de sitio corporativo o página de servicios responsive',
  'Tiendas online y e-commerce (WooCommerce, Shopify o custom)',
  'Landing pages de alta conversión con A/B testing',
  'Optimización de velocidad (PageSpeed > 90) y Core Web Vitals',
  'Integración con pasarelas de pago, CRM y herramientas de marketing',
  'SEO on-page básico: estructura semántica, metas y sitemap',
  'Capacitación para gestión autónoma del contenido',
]

const AUDIENCE: AudienceItem[] = [
  {
    emoji: '🚀',
    label: 'Negocios sin presencia digital',
    description: 'Tienes un negocio sólido pero no existe en internet o tu sitio da vergüenza ajena.',
  },
  {
    emoji: '🐌',
    label: 'Sitios lentos o desactualizados',
    description: 'Tu web tarda más de 3 segundos en cargar o se ve rota en móvil — y lo sabes.',
  },
  {
    emoji: '🛒',
    label: 'Ventas online por primera vez',
    description: 'Quieres abrir un canal de e-commerce pero no sabes por dónde empezar ni qué plataforma elegir.',
  },
  {
    emoji: '📣',
    label: 'Profesionales que quieren autoridad',
    description: 'Tu sitio debe reflejar el nivel de tu servicio: impecable, claro y que inspire confianza inmediata.',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'El nuevo sitio web convirtió al 6.2% de los visitantes en contactos calificados desde el primer mes. Con el anterior, rara vez llegábamos al 1%. El equipo de InsightA entendió nuestro negocio antes de escribir una sola línea de código.',
    author: 'Carolina M.',
    role: 'Fundadora — Firma de Arquitectura de Interiores, Bogotá',
    result: '6x mejora en tasa de conversión',
  },
  {
    quote:
      'Lanzamos nuestra tienda online con InsightA y en el primer mes vendimos lo que esperábamos vender en tres. La arquitectura de la tienda y el proceso de pago son impecables — los clientes lo dicen en cada reseña.',
    author: 'Sebastián R.',
    role: 'CEO — Marca de Accesorios Outdoor, Colombia',
    result: '3x ventas esperadas en el primer mes',
  },
]

const FAQS: AccordionItem[] = [
  {
    question: '¿Cuánto tiempo tarda en desarrollarse un sitio web?',
    answer:
      'Los tiempos típicos son: landing page de conversión: 2–3 semanas. Sitio corporativo (5–8 páginas): 4–6 semanas. Tienda online básica: 6–8 semanas. E-commerce complejo (>100 productos, múltiples integraciones): 8–12 semanas. Estos plazos incluyen diseño, desarrollo, revisiones y capacitación. Todo inicia con un brief detallado para entender tu negocio, objetivos y audiencia.',
  },
  {
    question: '¿Incluyen el hosting y el dominio en el servicio?',
    answer:
      'El servicio de diseño y desarrollo cubre toda la producción del sitio. El hosting y el dominio se recomiendan y configuran, pero se facturan por separado (ya sea que los gestiones tú o nosotros). Un hosting profesional de alto rendimiento cuesta entre $50 y $150 USD al año. Te asesoramos en la mejor opción según el tráfico esperado y el tipo de sitio que construimos.',
  },
  {
    question: '¿Puedo hacer cambios al contenido después de recibir el sitio?',
    answer:
      'Sí. Todos nuestros sitios se construyen sobre un CMS (WordPress, Webflow o Shopify según el proyecto) y te entregamos con capacitación para que puedas editar textos, imágenes y publicar entradas de blog de forma autónoma. Para cambios técnicos — nuevas funcionalidades, actualizaciones de seguridad, optimizaciones — ofrecemos planes de mantenimiento mensual.',
  },
  {
    question: '¿El sitio web incluye diseño mobile-first?',
    answer:
      'Sí, sin excepción. Diseñamos para móvil primero y luego escalamos a tablet y desktop. Antes de entregarte el sitio, lo probamos en dispositivos iOS y Android reales, en diferentes tamaños de pantalla y con herramientas de emulación. También validamos que pase la prueba de compatibilidad móvil de Google y que los Core Web Vitals en mobile sean ≥ 90.',
  },
]

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Diseño y Desarrollo Web Persuasivo',
    serviceType: 'Diseño UX/UI y Desarrollo Web',
    description:
      'Diseñamos sitios corporativos, tiendas online y landing pages optimizadas para convertir, usando principios de neuropsicología y UX de clase mundial.',
    provider: {
      '@type': 'Organization',
      name: 'InsightA',
      url: 'https://insighta.com.co',
    },
    areaServed: { '@type': 'Country', name: 'Colombia' },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'COP',
      seller: { '@type': 'Organization', name: 'InsightA' },
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  },
]

const BADGES = [
  { label: 'Shopify Partners', accent: '#96BF48' },
  { label: 'WooCommerce', accent: '#7F54B3' },
  { label: 'WordPress', accent: '#21759B' },
  { label: 'Webflow' },
  { label: 'Google PageSpeed ≥ 90', accent: '#4285F4' },
  { label: 'Core Web Vitals', accent: '#34A853' },
]

export default function DisenoWeb() {
  return (
    <>
      <Seo
        title="Diseño y Desarrollo Web Persuasivo | InsightA"
        description="Diseñamos sitios corporativos, tiendas online y landing pages optimizadas para convertir, usando principios de neuropsicología y UX de clase mundial."
      />
      <SchemaMarkup schema={SCHEMA} />

      <article>
        {/* ── Hero ── */}
        <ServiceHero
          title="Diseño y Desarrollo Web"
          subtitle="Tu página web, tu mejor vendedor"
          breadcrumbs={CRUMBS}
        />

        {/* ── Trust badges ── */}
        <TrustBadges badges={BADGES} />

        {/* ── Entregables ── */}
        <section aria-labelledby="entregables-heading" className="py-16 md:py-24 px-4 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: BLUE }}>
                ¿Qué incluye?
              </p>
              <h2 id="entregables-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
                Entregables del servicio
              </h2>
            </div>
            <EntregablesGrid items={ENTREGABLES} />
          </div>
        </section>

        {/* ── Para quién es esto ── */}
        <ParaQuienEs items={AUDIENCE} />

        {/* ── Testimonials ── */}
        <ServiceTestimonials testimonials={TESTIMONIALS} />

        {/* ── FAQs ── */}
        <section aria-labelledby="faq-heading" className="py-16 md:py-24 px-4 md:px-12 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="mb-10">
              <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: BLUE }}>
                FAQ
              </p>
              <h2 id="faq-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
                Preguntas Frecuentes
              </h2>
            </div>
            <Accordion items={FAQS} />
          </div>
        </section>

        {/* ── Otros servicios ── */}
        <OtrosServicios currentSlug="diseno-desarrollo-web" />

        {/* ── CTA final ── */}
        <BottomCTASection
          title="¿Tu web merece más?"
          subtitle="Agenda una sesión de diagnóstico gratuita. Revisamos tu sitio actual y te decimos exactamente qué está perdiendo conversiones."
          ctaLabel="Quiero un sitio que venda"
        />
      </article>
    </>
  )
}
