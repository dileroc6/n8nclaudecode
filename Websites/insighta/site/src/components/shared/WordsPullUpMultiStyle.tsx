import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface Segment {
  text: string
  className?: string
  style?: React.CSSProperties
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[]
  wrapperClassName?: string
}

export default function WordsPullUpMultiStyle({ segments, wrapperClassName = 'justify-start' }: WordsPullUpMultiStyleProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  const allWords: { word: string; className: string; style?: React.CSSProperties }[] = []
  segments.forEach(seg => {
    seg.text.split(' ').forEach(word => {
      if (word) allWords.push({ word, className: seg.className ?? '', style: seg.style })
    })
  })

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${wrapperClassName}`}>
      {allWords.map((item, i) => (
        <span key={i} className="overflow-hidden inline-block mr-[0.2em] mb-[0.05em]">
          <motion.span
            className={`inline-block ${item.className}`}
            style={item.style}
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {item.word}
          </motion.span>
        </span>
      ))}
    </span>
  )
}
