import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

export interface AccordionItem {
  question: string
  answer: string
}

interface AccordionProps {
  items: AccordionItem[]
}

const TEXT  = '#09090b'
const MUTED = '#71717A'

export default function Accordion({ items }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border overflow-hidden transition-colors duration-200"
          style={{ borderColor: open === i ? '#2563EB' : '#E4E4E7', backgroundColor: '#FAFAFA' }}
        >
          <button
            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <h3 className="font-semibold text-sm md:text-base leading-snug" style={{ color: TEXT }}>
              {item.question}
            </h3>
            <span
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
              style={{ backgroundColor: open === i ? '#2563EB' : '#F0F0F0', color: open === i ? '#fff' : TEXT }}
            >
              {open === i ? <Minus size={14} /> : <Plus size={14} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
