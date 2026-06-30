import { motion, useInView } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import HeroParticles from './HeroParticles'

interface ServiceHeroProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
}

const EASE = [0.16, 1, 0.3, 1] as const
// Gradient inspired by Maxicom: blue → periwinkle → purple/pink
const BG = 'linear-gradient(to right, #1E3F96 0%, #3A62B8 22%, #7A8FCC 44%, #A070C0 66%, #C46090 88%, #CC6080 100%)'

export default function ServiceHero({ title, subtitle, breadcrumbs = [] }: ServiceHeroProps) {  // eslint-disable-line @typescript-eslint/no-unused-vars
  const ref      = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: BG, minHeight: 280, paddingTop: 96 }}
    >
      {/* Particles overlay */}
      <HeroParticles />

      {/* Noise texture */}
      <div className="noise-overlay absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" style={{ zIndex: 5 }} />

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center text-center px-4 pb-14 pt-12" style={{ zIndex: 6 }}>

        {/* Page title */}
        <motion.h1
          className="font-bold text-white tracking-[0.12em] uppercase"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.15em' }}
          initial={{ y: 24, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            className="mt-3 text-sm md:text-base text-white/70 max-w-lg"
            initial={{ y: 16, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.12, ease: EASE }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <motion.nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 mt-6 text-[11px] font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'rgba(255,255,255,0.65)' }}
            initial={{ y: 14, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-white transition-colors duration-150">
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.9)' }}>{crumb.label}</span>
                )}
              </span>
            ))}
          </motion.nav>
        )}
      </div>

      {/* Subtle bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{ zIndex: 7, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08))' }} />
    </section>
  )
}
