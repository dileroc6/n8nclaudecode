import { motion, useInView } from 'framer-motion'
import { Check, ArrowRight, Search, MessageCircle, TrendingUp, Brain } from 'lucide-react'
import { useRef } from 'react'
import WordsPullUpMultiStyle from './shared/WordsPullUpMultiStyle'

const CARD_EASE = [0.22, 1, 0.36, 1] as const

interface FeatureCardProps {
  index: number
  children: React.ReactNode
}

function FeatureCard({ index, children }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl overflow-hidden h-full"
      style={{ backgroundColor: '#212121' }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: CARD_EASE }}
    >
      {children}
    </motion.div>
  )
}

interface CheckItemProps {
  text: string
}

function CheckItem({ text }: CheckItemProps) {
  return (
    <li className="flex items-start gap-2">
      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#7CB9FF' }} />
      <span className="text-xs sm:text-sm text-gray-400">{text}</span>
    </li>
  )
}

interface ServiceCardProps {
  number: string
  title: string
  icon: React.ReactNode
  items: string[]
  index: number
}

function ServiceCard({ number, title, icon, items, index }: ServiceCardProps) {
  return (
    <FeatureCard index={index}>
      <div className="p-6 h-full flex flex-col justify-between min-h-[300px] lg:min-h-0">
        <div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ backgroundColor: 'rgba(124,185,255,0.1)' }}>
            {icon}
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[10px] font-medium tabular-nums" style={{ color: 'rgba(124,185,255,0.4)' }}>
              {number}
            </span>
            <h3 className="font-semibold text-sm sm:text-base" style={{ color: '#D0E4FF' }}>
              {title}
            </h3>
          </div>
          <ul className="space-y-2 mt-4">
            {items.map((item, i) => <CheckItem key={i} text={item} />)}
          </ul>
        </div>
        <button
          className="mt-6 flex items-center gap-1 text-xs font-medium transition-colors duration-200 group bg-transparent border-none cursor-pointer p-0"
          style={{ color: 'rgba(124,185,255,0.6)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#7CB9FF')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(124,185,255,0.6)')}
        >
          Conoce más
          <ArrowRight size={12} className="-rotate-45 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </FeatureCard>
  )
}

export default function Features() {
  return (
    <section id="features" className="relative min-h-screen bg-black py-20 md:py-32 px-4 md:px-8">
      {/* Noise background */}
      <div className="bg-noise absolute inset-0 opacity-[0.12] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-snug">
            <WordsPullUpMultiStyle
              segments={[
                {
                  text: 'Marketing de precisión para marcas ambiciosas.',
                  className: 'text-white',
                },
              ]}
            />
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-snug mt-1">
            <WordsPullUpMultiStyle
              segments={[
                {
                  text: 'Construido con datos. Impulsado por IA.',
                  className: 'text-gray-500',
                },
              ]}
            />
          </h3>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:h-[480px]">

          {/* Card 1 — Visual hero con gradiente */}
          <FeatureCard index={0}>
            <div className="relative h-full min-h-[260px] lg:min-h-0 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #050d1e 0%, #0a1628 40%, #1B3A6B 100%)',
              }}
            >
              {/* Glow animado */}
              <div className="absolute inset-0 opacity-50"
                style={{
                  background: 'radial-gradient(ellipse 60% 60% at 40% 50%, rgba(59,130,246,0.25) 0%, transparent 70%)',
                }} />
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(124,185,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(124,185,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }} />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-medium text-sm sm:text-base leading-tight" style={{ color: '#D0E4FF' }}>
                  Tu marca,<br />redefinida.
                </p>
              </div>
            </div>
          </FeatureCard>

          {/* Card 2 — SEO + GEO */}
          <ServiceCard
            index={1}
            number="01"
            title="Posicionamiento SEO + GEO"
            icon={<Search size={20} style={{ color: '#7CB9FF' }} />}
            items={[
              'Posicionamiento en Google y buscadores de IA',
              'Optimización para ChatGPT y Gemini (GEO)',
              'Estrategia de contenido semántico',
              'Auditoría técnica mensual',
            ]}
          />

          {/* Card 3 — IA 24/7 */}
          <ServiceCard
            index={2}
            number="02"
            title="Atención al Cliente IA 24/7"
            icon={<MessageCircle size={20} style={{ color: '#7CB9FF' }} />}
            items={[
              'Asistentes de IA en WhatsApp y web',
              'Conversación natural que cierra ventas',
              'Integración con tu CRM y herramientas',
            ]}
          />

          {/* Card 4 — Performance */}
          <ServiceCard
            index={3}
            number="03"
            title="Performance Marketing"
            icon={<TrendingUp size={20} style={{ color: '#7CB9FF' }} />}
            items={[
              'Meta Ads, Google Ads y TikTok Ads',
              'Campañas basadas en psicología del consumidor',
              'Optimización de ROI en tiempo real',
            ]}
          />

        </div>

        {/* Card extra — Diseño Web */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <ServiceCard
            index={4}
            number="04"
            title="Diseño y Desarrollo Web"
            icon={<Brain size={20} style={{ color: '#7CB9FF' }} />}
            items={[
              'Sitios corporativos y tiendas online persuasivos',
              'Landing pages de alta conversión',
              'Diseño UX/UI basado en neuropsicología',
              'Agentes virtuales integrados con IA',
            ]}
          />
          {/* CTA card */}
          <FeatureCard index={5}>
            <div className="p-8 h-full flex flex-col justify-between min-h-[220px]"
              style={{ backgroundColor: '#212121' }}>
              <div>
                <p className="text-[10px] font-medium tracking-widest uppercase mb-4" style={{ color: 'rgba(124,185,255,0.5)' }}>
                  Propuesta de valor
                </p>
                <p className="text-base md:text-lg font-normal leading-snug" style={{ color: '#D0E4FF' }}>
                  "No adivinamos qué funciona; predecimos el comportamiento de tu cliente."
                </p>
              </div>
              <a
                href="#contact"
                onClick={e => {
                  e.preventDefault()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-5 pr-1.5 py-1.5 mt-6 self-start transition-all duration-300"
                style={{ backgroundColor: '#7CB9FF' }}
              >
                <span className="font-medium text-sm text-black">Agenda tu sesión</span>
                <span className="bg-black rounded-full w-8 h-8 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <ArrowRight size={14} style={{ color: '#7CB9FF' }} />
                </span>
              </a>
            </div>
          </FeatureCard>
        </div>

      </div>
    </section>
  )
}
