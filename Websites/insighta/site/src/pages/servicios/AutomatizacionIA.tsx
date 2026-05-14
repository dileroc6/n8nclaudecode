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
  { label: 'Atención al Cliente Automatizada con IA', href: '/servicios/automatizacion-ia' },
]

const ENTREGABLES = [
  'Chatbot inteligente para WhatsApp Business con IA conversacional',
  'Agente virtual entrenado con la voz y el tono de tu marca',
  'Respuesta automática a preguntas frecuentes e intenciones de compra',
  'Flujos de ventas y calificación de leads automatizados',
  'Integración con tu CRM, calendario o sistema de reservas',
  'Notificaciones y seguimiento post-venta automatizado',
  'Panel de control con historial y análisis de conversaciones',
  'Entrenamiento continuo del modelo con datos reales de tu negocio',
]

const AUDIENCE: AudienceItem[] = [
  {
    emoji: '🛍️',
    label: 'E-commerce con alto volumen',
    description: 'Recibes muchas preguntas pre-venta y tu equipo no da abasto para atenderlas todas a tiempo.',
  },
  {
    emoji: '🏥',
    label: 'Clínicas y servicios con citas',
    description: 'Necesitas agendar, recordar y gestionar reservas sin que ocupe tiempo de tu equipo.',
  },
  {
    emoji: '🏠',
    label: 'Inmobiliarias y ciclos largos',
    description: 'Tu proceso de venta es largo y necesitas mantener leads calientes hasta que estén listos para decidir.',
  },
  {
    emoji: '⏰',
    label: 'Cualquier negocio que pierde ventas fuera de horario',
    description: 'Tus clientes contactan a las 11pm y al día siguiente ya compraron en la competencia.',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'El asistente de IA en WhatsApp agenda el 90% de nuestras citas sin intervención del equipo. Es como tener una recepcionista experta que trabaja las 24 horas sin errores ni días libres. En el primer mes recuperamos la inversión completa.',
    author: 'Andrés V.',
    role: 'Gerente — Centro Médico Estético, Medellín',
    result: '90% de citas agendadas automáticamente',
  },
  {
    quote:
      'Antes respondíamos WhatsApp manualmente y perdíamos leads cada noche y fin de semana. Ahora el bot califica, responde y agenda. Nuestro equipo llega el lunes con una agenda llena que se llenó sola.',
    author: 'Laura M.',
    role: 'Directora Comercial — Agencia Inmobiliaria',
    result: '+65% leads calificados capturados',
  },
]

const FAQS: AccordionItem[] = [
  {
    question: '¿Cuánto tiempo tarda en implementarse el chatbot?',
    answer:
      'Un asistente básico — FAQs y derivación a humanos — puede estar activo en 2 a 3 semanas. Un agente con flujos de ventas, calificación de leads e integración con CRM requiere entre 4 y 8 semanas. El proceso incluye: levantamiento de información (tu negocio, tono y casos de uso), entrenamiento inicial del modelo, fase de pruebas con tu equipo y puesta en marcha gradual con monitoreo.',
  },
  {
    question: '¿Puede el asistente hablar en varios idiomas?',
    answer:
      'Sí. Los modelos que usamos tienen capacidad nativa multilingüe. Para negocios que atienden clientes en español, inglés o portugués, el asistente detecta el idioma del usuario y responde en consecuencia, sin configuración manual. Si tu negocio requiere soporte en idiomas menos comunes, lo evaluamos caso a caso.',
  },
  {
    question: '¿Se integra con mi CRM o sistema de gestión actual?',
    answer:
      'Sí. Integramos con los principales CRM: HubSpot, Zoho, Salesforce, Bitrix24 y otros. También conectamos con Google Sheets, calendarios (Calendly, Google Calendar), plataformas de e-commerce y sistemas a medida via API REST o webhooks. En la fase de levantamiento definimos exactamente qué datos fluyen entre el chatbot y tus sistemas actuales.',
  },
  {
    question: '¿Qué pasa cuando el asistente no sabe responder algo?',
    answer:
      'El agente tiene un umbral de confianza configurado. Cuando detecta una pregunta fuera de su conocimiento entrenado, escala automáticamente: notifica a un agente humano con el historial completo de la conversación y puede enviar un resumen por correo o WhatsApp al equipo. Nunca deja al usuario sin respuesta — le indica que un asesor lo contactará pronto y registra el lead.',
  },
]

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Atención al Cliente Automatizada e Inteligente 24/7',
    serviceType: 'Automatización con Inteligencia Artificial y Chatbots',
    description:
      'Instalamos asistentes de IA en WhatsApp y tu sitio web que hablan de forma natural, resuelven dudas y cierran ventas a cualquier hora del día.',
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
  { label: 'WhatsApp Business API', accent: '#25D366' },
  { label: 'OpenAI GPT-4', accent: '#10A37F' },
  { label: 'HubSpot', accent: '#FF7A59' },
  { label: 'Calendly · Google Calendar' },
  { label: 'n8n · Make (Integromat)' },
  { label: 'API REST · Webhooks' },
]

export default function AutomatizacionIA() {
  return (
    <>
      <Seo
        title="Chatbots e IA para Ventas 24/7 | InsightA"
        description="Instalamos asistentes de IA en WhatsApp y tu sitio web que hablan de forma natural, resuelven dudas y cierran ventas a cualquier hora del día."
      />
      <SchemaMarkup schema={SCHEMA} />

      <article>
        {/* ── Hero ── */}
        <ServiceHero
          title="Automatización con IA"
          subtitle="Tu equipo de ventas que nunca duerme"
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
        <OtrosServicios currentSlug="automatizacion-ia" />

        {/* ── CTA final ── */}
        <BottomCTASection
          title="¿Listo para vender las 24 horas?"
          subtitle="Cuéntanos cómo funciona tu proceso de ventas hoy y diseñamos un asistente de IA que lo automatice y lo escale."
          ctaLabel="Quiero mi asistente de IA"
        />
      </article>
    </>
  )
}
