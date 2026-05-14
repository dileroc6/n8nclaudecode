import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import WordsPullUp from './shared/WordsPullUp'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section id="hero" className="h-screen p-3 md:p-5" ref={ref}>
      <div className="relative h-full w-full rounded-2xl md:rounded-[2rem] overflow-hidden hero-bg">

        {/* Glow azul */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />

        {/* Noise overlay */}
        <div className="noise-overlay absolute inset-0 opacity-[0.6] mix-blend-overlay pointer-events-none" />

        {/* Gradiente vertical */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        {/* Navbar pill */}
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          {/* El Navbar global cubre esto — este div es un placeholder visual */}
        </div>

        {/* Contenido — alineado al fondo */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
          <div className="grid grid-cols-12 items-end gap-4">

            {/* Columna izquierda — nombre gigante */}
            <div className="col-span-12 lg:col-span-8">
              <h1
                className="font-medium leading-[0.82] tracking-[-0.06em] select-none"
                style={{
                  fontSize: 'clamp(3rem, 14vw, 16vw)',
                  color: '#D0E4FF',
                }}
              >
                <WordsPullUp text="InsightA" showAsterisk />
              </h1>
            </div>

            {/* Columna derecha — descripción + CTA */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 pb-2 lg:pb-4">
              <motion.p
                className="text-primary/70 text-xs sm:text-sm md:text-base leading-snug max-w-xs"
                style={{ lineHeight: 1.3, color: 'rgba(124,185,255,0.7)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              >
                Hackeamos el crecimiento de tu marca combinando la psicología del consumidor con Inteligencia Artificial.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
              >
                <a
                  href="#contact"
                  onClick={e => {
                    e.preventDefault()
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="group inline-flex items-center gap-2 hover:gap-3 bg-primary rounded-full pl-5 pr-1.5 py-1.5 transition-all duration-300"
                  style={{ backgroundColor: '#7CB9FF' }}
                >
                  <span className="font-medium text-sm sm:text-base text-black">
                    Agenda una cita
                  </span>
                  <span className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0">
                    <ArrowRight size={16} className="text-primary" style={{ color: '#7CB9FF' }} />
                  </span>
                </a>
              </motion.div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
