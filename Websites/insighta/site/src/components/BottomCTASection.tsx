import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BottomCTASectionProps {
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaTo?: string
}

const NAVY = '#1B3A6B'

export default function BottomCTASection({
  title   = '¿Listo para hacer crecer tu empresa?',
  subtitle = 'Agenda una sesión personalizada. Sin compromisos, sin rodeos — solo estrategia y resultados.',
  ctaLabel = 'Agenda una cita aquí',
  ctaTo   = '/contacto',
}: BottomCTASectionProps) {
  return (
    <section aria-labelledby="cta-heading" className="py-20 md:py-32 px-4 md:px-12" style={{ backgroundColor: NAVY }}>
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 text-white/50">
          ¿Por dónde empezamos?
        </p>
        <h2
          id="cta-heading"
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[0.95] tracking-tight mb-6"
        >
          {title}
        </h2>
        <p className="text-sm md:text-base text-white/60 mb-10 leading-relaxed max-w-xl mx-auto">
          {subtitle}
        </p>
        <Link
          to={ctaTo}
          className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-2 py-2 bg-white transition-all duration-300"
        >
          <span className="font-semibold text-sm" style={{ color: NAVY }}>{ctaLabel}</span>
          <span
            className="rounded-full w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
            style={{ backgroundColor: NAVY }}
          >
            <ArrowRight size={14} className="text-white" />
          </span>
        </Link>
      </div>
    </section>
  )
}
