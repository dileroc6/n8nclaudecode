import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export interface AudienceItem {
  emoji: string
  label: string
  description: string
}

const EASE = [0.22, 1, 0.36, 1] as const

export default function ParaQuienEs({ items }: { items: AudienceItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section aria-labelledby="para-quien-heading" className="py-16 md:py-24 px-4 md:px-12 bg-white">
      <div ref={ref} className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-3 text-blue-600">
            ¿Para quién es esto?
          </p>
          <h2 id="para-quien-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900">
            Este servicio es ideal si…
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-5"
              initial={{ y: 20, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            >
              <span className="text-2xl mb-3 block">{item.emoji}</span>
              <p className="font-semibold text-sm mb-1.5 text-zinc-900">{item.label}</p>
              <p className="text-xs leading-relaxed text-zinc-500">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
