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
  { label: 'SEO y Buscadores de IA (GEO)', href: '/servicios/posicionamiento-seo-geo' },
]

const ENTREGABLES = [
  'Auditoría técnica SEO completa (velocidad, Core Web Vitals, errores de rastreo)',
  'Investigación de palabras clave con intención de búsqueda',
  'Optimización on-page: títulos, metas, headings, contenido',
  'Optimización off-page y estrategia de link building',
  'Estrategia de contenido semántico y cluster temático',
  'Posicionamiento en buscadores de IA — GEO (ChatGPT, Gemini, Perplexity)',
  'Optimización de perfil de Google Business Profile',
  'Reportes mensuales con métricas claras de posicionamiento',
]

const AUDIENCE: AudienceItem[] = [
  {
    emoji: '🏪',
    label: 'Negocios locales',
    description: 'Quieres aparecer primero cuando alguien en tu ciudad busca lo que vendes.',
  },
  {
    emoji: '🛒',
    label: 'E-commerce',
    description: 'Tienes un catálogo de productos y necesitas tráfico orgánico cualificado sin depender solo de pauta.',
  },
  {
    emoji: '👔',
    label: 'Profesionales y consultores',
    description: 'Tu reputación digital es tu mayor activo y quieres que la IA te mencione como referente.',
  },
  {
    emoji: '📈',
    label: 'PYMEs con ambición',
    description: 'Compites con empresas más grandes y necesitas visibilidad sin igualar su presupuesto de pauta.',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'En 4 meses pasamos de estar en la página 3 de Google a ocupar el primer lugar para nuestra búsqueda principal. El tráfico orgánico aumentó un 340% y hoy llegan clientes que nunca hubiéramos alcanzado con publicidad.',
    author: 'Marcela R.',
    role: 'Directora Comercial — Clínica Dental, Bogotá',
    result: '+340% tráfico orgánico',
  },
  {
    quote:
      'Lo que más me sorprendió fue que ChatGPT empezó a recomendar nuestra consultoría cuando alguien pregunta sobre servicios de auditoría financiera en Colombia. Eso vale más que cualquier pauta pagada.',
    author: 'Germán P.',
    role: 'Socio Fundador — Firma de Consultoría Financiera',
    result: 'Citado por ChatGPT y Perplexity',
  },
]

const FAQS: AccordionItem[] = [
  {
    question: '¿Cuánto tiempo tarda en verse resultados de SEO?',
    answer:
      'Los primeros indicadores de mejora (mejor rastreo, indexación, reducción de errores técnicos) son visibles en las primeras 4 semanas. Las primeras subidas de posición ocurren entre el mes 2 y 4 para términos de mediana competencia. Para palabras clave muy competidas, el impacto significativo llega entre el mes 4 y 9. El SEO es acumulativo: los resultados crecen con el tiempo y, a diferencia de la pauta, no desaparecen cuando dejas de pagar.',
  },
  {
    question: '¿Qué diferencia hay entre SEO tradicional y GEO (Generative Engine Optimization)?',
    answer:
      'El SEO tradicional optimiza para que Google te muestre en los 10 resultados clásicos. El GEO optimiza tu contenido para que modelos de IA generativa — como ChatGPT, Gemini o Perplexity — te citen o recomienden directamente en sus respuestas. Técnicas como datos estructurados (Schema Markup), entidades nombradas, contenido conversacional y autoridad de dominio son la base del GEO. En InsightA aplicamos ambas disciplinas de forma integrada.',
  },
  {
    question: '¿Trabajan con cualquier tipo de negocio o industria?',
    answer:
      'Sí. Tenemos experiencia en servicios profesionales (clínicas, abogados, consultores), retail y e-commerce, hostelería, educación y sector inmobiliario. El punto de partida es siempre una auditoría que nos muestra el estado actual, la competencia y las palabras clave con mayor potencial de retorno para tu negocio específico.',
  },
  {
    question: '¿Puedo ver reportes del avance mensual?',
    answer:
      'Absolutamente. Cada mes recibes un informe con: posición por palabra clave objetivo, tráfico orgánico vs. mes anterior, páginas con mejor y peor rendimiento, Core Web Vitals del sitio y avance en los entregables acordados. Todo está diseñado para ser legible sin conocimientos técnicos — gráficas claras, conclusiones en español y próximos pasos definidos.',
  },
]

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Posicionamiento SEO y Buscadores de IA (GEO)',
    serviceType: 'Search Engine Optimization y Generative Engine Optimization',
    description:
      'Posicionamos tu marca en Google y aseguramos que ChatGPT, Gemini y Perplexity te recomienden antes que a tu competencia. SEO técnico, contenido semántico y estrategia GEO integrados.',
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
  { label: 'Google Search Console', accent: '#4285F4' },
  { label: 'Google Analytics 4', accent: '#E37400' },
  { label: 'Schema.org / JSON-LD' },
  { label: 'Semrush' },
  { label: 'ChatGPT · Gemini · Perplexity', accent: '#10A37F' },
  { label: 'Google Business Profile', accent: '#4285F4' },
]

export default function SeoGeo() {
  return (
    <>
      <Seo
        title="Posicionamiento SEO y GEO en Colombia | InsightA"
        description="Posicionamos tu marca en Google y aseguramos que ChatGPT, Gemini y Perplexity te recomienden antes que a tu competencia. SEO técnico + estrategia GEO."
      />
      <SchemaMarkup schema={SCHEMA} />

      <article>
        {/* ── Hero ── */}
        <ServiceHero
          title="SEO y Buscadores de IA"
          subtitle="Sé el primero en Google y en ChatGPT"
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
        <OtrosServicios currentSlug="posicionamiento-seo-geo" />

        {/* ── CTA final ── */}
        <BottomCTASection
          title="¿Listo para dominar los buscadores?"
          subtitle="Haz que Google y la IA trabajen para ti. Agenda una auditoría gratuita y te mostramos exactamente dónde estás parado."
          ctaLabel="Agenda tu auditoría SEO"
        />
      </article>
    </>
  )
}
