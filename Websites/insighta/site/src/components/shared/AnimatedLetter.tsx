import { motion, useTransform, MotionValue } from 'framer-motion'

interface AnimatedLetterProps {
  char: string
  index: number
  total: number
  scrollYProgress: MotionValue<number>
}

export default function AnimatedLetter({ char, index, total, scrollYProgress }: AnimatedLetterProps) {
  const charProgress = index / total
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, charProgress - 0.1), Math.min(1, charProgress + 0.05)],
    [0.15, 1]
  )

  return (
    <motion.span style={{ opacity }} className="inline-block whitespace-pre">
      {char}
    </motion.span>
  )
}
