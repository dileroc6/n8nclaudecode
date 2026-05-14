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
  { label: 'Performance Marketing', href: '/servicios/performance-marketing' },
]

const ENTREGABLES = [
  'Estrategia de campañas basada en sesgos cognitivos y psicología del consumidor',
  'Meta Ads: campañas en Facebook e Instagram con segmentación avanzada',
  'Google Ads: Search, Display, Shopping y Performance Max',
  'TikTok Ads, LinkedIn Ads y X (Twitter) Ads según tu audiencia',
  'Copywriting persuasivo y diseño de creatividades para cada plataforma',
  'Optimización de CPA, ROAS y ROI en tiempo real',
  'Retargeting inteligente y funnels de conversión automatizados',
  'Reportes semanales con análisis de métricas e insights accionables',
]

const AUDIENCE: AudienceItem[] = [
  {
    emoji: '🛒',
    label: 'Tiendas online con producto comprobado',
    description: 'Vendes bien de forma orgánica y quieres escalar con pauta sin desperdiciar el presupuesto.',
  },
  {
    emoji: '📅',
    label: 'Negocios estacionales',
    description: 'Tienes temporadas clave (navidad, día de la madre, temporada escolar) y necesitas resultados rápidos y predecibles.',
  },
  {
    emoji: '💼',
    label: 'Empresas sin equipo de marketing interno',
    description: 'Tienes presupuesto de pauta pero no el equipo o el tiempo para gestionarlo con rigor.',
  },
  {
    emoji: '🚀',
    label: 'Lanzamientos de productos o servicios',
    description: 'Estás lanzando algo nuevo y necesitas generar demanda, awareness y primeras ventas rápido.',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Llevábamos dos años con las mismas campañas en Meta y nunca habíamos pasado de 2x ROAS. Con InsightA llegamos a 5.8x en el segundo mes. No cambiaron el presupuesto — cambiaron la estrategia y el copy completamente.',
    author: 'Felipe S.',
    role: 'CEO — Marca de Suplementos Deportivos',
    result: 'ROAS de 1.8x → 5.8x en 60 días',
  },
  {
    quote:
      'Nuestra campaña de Google Search con InsightA generó 3 veces más leads calificados que la que teníamos antes, al mismo costo. El CPA bajó un 58% y la tasa de cierre de ventas mejoró porque los leads llegaban con mejor intención.',
    author: 'Natalia G.',
    role: 'Directora de Marketing — Empresa de Software B2B',
    result: '-58% CPA, +3x leads calificados',
  },
]

const FAQS: AccordionItem[] = [
  {
    question: '¿Cuál es el presupuesto mínimo de pauta recomendado?',
    answer:
      'Para que el algoritmo aprenda y optimice con datos reales, recomendamos mínimo $500 USD/mes en inversión de medios para Meta o Google. Por debajo de ese umbral, el ciclo de aprendizaje de las plataformas no completa y es muy difícil optimizar. Este presupuesto es de medios — lo que le pagas a Meta o Google directamente, no a InsightA. Nuestros honorarios de gestión son independientes y se calculan según el alcance de las campañas.',
  },
  {
    question: '¿En qué plataformas de publicidad trabajan?',
    answer:
      'Gestionamos campañas en Meta Ads (Facebook e Instagram), Google Ads (Search, Display, Shopping y Performance Max), TikTok Ads, LinkedIn Ads (especialmente para B2B y servicios profesionales) y YouTube Ads. La selección de plataformas depende siempre de dónde está tu audiencia ideal y del tipo de producto o servicio: no todas las plataformas son rentables para todos los negocios y nunca lo forzamos.',
  },
  {
    question: '¿Cuánto tiempo hasta ver resultados en las campañas?',
    answer:
      'Google Search puede generar tráfico desde la primera semana (alta intención de compra). Meta Ads tiene una fase de aprendizaje de 7–14 días antes de estabilizarse; el primer mes siempre es de calibración. TikTok y YouTube necesitan entre 2 y 4 semanas para optimizar. Nuestra recomendación: no juzgues el rendimiento por el primer mes — la optimización real y el ROAS objetivo llega a partir del segundo ciclo de datos.',
  },
  {
    question: '¿Cómo miden el éxito y el ROI de las campañas?',
    answer:
      'Instalamos seguimiento completo de conversiones: Meta Pixel + Conversions API (server-side), Google Tag Manager con eventos personalizados, UTM parameters en todos los links y, donde aplica, seguimiento offline de ventas. Los KPI que monitoreamos son ROAS, CPA y revenue atribuido. Entregamos reportes semanales con gasto, resultados y recomendaciones concretas de ajuste, y una llamada mensual de estrategia.',
  },
]

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Performance Marketing con IA',
    serviceType: 'Publicidad Digital y Performance Marketing',
    description:
      'Creamos campañas en Facebook, Google y TikTok diseñadas para multiplicar tus ventas usando ciencia de datos y psicología del consumidor.',
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
  { label: 'Meta Business Partner', accent: '#1877F2' },
  { label: 'Google Ads', accent: '#4285F4' },
  { label: 'TikTok Ads', accent: '#010101' },
  { label: 'LinkedIn Ads', accent: '#0A66C2' },
  { label: 'Google Analytics 4', accent: '#E37400' },
  { label: 'Meta Pixel + CAPI', accent: '#1877F2' },
]

export default function PerformanceMarketing() {
  return (
    <>
      <Seo
        title="Performance Marketing con IA | InsightA"
        description="Creamos campañas en Facebook, Google y TikTok diseñadas para multiplicar tus ventas usando ciencia de datos y psicología del consumidor."
      />
      <SchemaMarkup schema={SCHEMA} />

      <article>
        {/* ── Hero ── */}
        <ServiceHero
          title="Performance Marketing"
          subtitle="Anuncios que venden, no solo que gustan"
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
        <OtrosServicios currentSlug="performance-marketing" />

        {/* ── CTA final ── */}
        <BottomCTASection
          title="¿Listo para que tu inversión trabaje duro?"
          subtitle="Agenda una sesión estratégica. Analizamos tus campañas actuales y te mostramos cómo multiplicar el retorno."
          ctaLabel="Quiero más ROI"
        />
      </article>
    </>
  )
}
