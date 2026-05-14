import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { getOtherServices } from '../data/services'

interface OtrosServiciosProps {
  currentSlug: string
}

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const BLUE  = '#2563EB'
const MUTED = '#71717A'
const EASE  = [0.22, 1, 0.36, 1] as const

export default function OtrosServicios({ currentSlug }: OtrosServiciosProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const others = getOtherServices(currentSlug)

  return (
    <section aria-labelledby="otros-servicios-heading" className="py-20 md:py-28 px-4 md:px-12" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: BLUE }}>
            Ecosistema de servicios
          </p>
          <h2 id="otros-servicios-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: TEXT }}>
            Otros servicios para escalar tu marca
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {others.map((s, i) => (
            <motion.div
              key={s.slug}
              initial={{ y: 24, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            >
              <Link
                to={s.path}
                className="group flex flex-col justify-between h-full rounded-2xl border p-7 transition-all duration-300 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
                style={{ backgroundColor: '#fff', borderColor: '#E4E4E7' }}
              >
                <div>
                  <span className="text-[10px] font-bold tabular-nums mb-3 block" style={{ color: '#D1D5DB' }}>
                    {s.number}
                  </span>
                  <h3 className="font-bold text-base leading-snug mb-3" style={{ color: TEXT }}>
                    {s.shortTitle}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                    {s.shortDesc}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-6 text-sm font-semibold transition-colors duration-200" style={{ color: NAVY }}>
                  Ver servicio
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
