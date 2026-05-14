import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Quote } from 'lucide-react'

export interface Testimonial {
  quote: string
  author: string
  role: string
  result: string
}

const EASE = [0.22, 1, 0.36, 1] as const
const NAVY = '#1B3A6B'
const BLUE = '#2563EB'

export default function ServiceTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const cols =
    testimonials.length >= 3
      ? 'lg:grid-cols-3 md:grid-cols-2'
      : testimonials.length === 2
      ? 'md:grid-cols-2'
      : ''

  return (
    <section aria-labelledby="testimonials-heading" className="py-16 md:py-24 px-4 md:px-12 bg-zinc-50">
      <div ref={ref} className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p
            className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3"
            style={{ color: BLUE }}
          >
            Resultados reales
          </p>
          <h2 id="testimonials-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900">
            Clientes que ya lo vivieron
          </h2>
        </div>
        <div className={`grid grid-cols-1 gap-5 ${cols}`}>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-2xl p-7 border border-zinc-100 flex flex-col gap-4"
              initial={{ y: 24, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            >
              <Quote size={18} style={{ color: BLUE }} />
              <p className="text-sm leading-relaxed text-zinc-700 flex-1">"{t.quote}"</p>
              <div className="border-t border-zinc-100 pt-4">
                <p className="font-semibold text-sm" style={{ color: NAVY }}>
                  {t.author}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">{t.role}</p>
                <span className="inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                  {t.result}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
