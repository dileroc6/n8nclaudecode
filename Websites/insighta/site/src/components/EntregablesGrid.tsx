import { motion, useInView } from 'framer-motion'
import { Check } from 'lucide-react'
import { useRef } from 'react'

interface EntregablesGridProps {
  items: string[]
}

const TEXT  = '#09090b'
const BLUE  = '#2563EB'
const EASE  = [0.22, 1, 0.36, 1] as const

export default function EntregablesGrid({ items }: EntregablesGridProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <motion.div
          key={i}
          className="flex items-start gap-4 rounded-xl border p-5"
          style={{ backgroundColor: '#FAFAFA', borderColor: '#E4E4E7' }}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.55, delay: i * 0.07, ease: EASE }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: '#EEF4FF' }}
          >
            <Check size={14} style={{ color: BLUE }} strokeWidth={2.5} />
          </span>
          <p className="text-sm font-medium leading-snug" style={{ color: TEXT }}>
            {item}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
