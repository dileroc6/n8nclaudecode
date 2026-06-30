import { useRef } from 'react'
import { useScroll } from 'framer-motion'
import WordsPullUpMultiStyle from './shared/WordsPullUpMultiStyle'
import AnimatedLetter from './shared/AnimatedLetter'

const BODY_TEXT =
  'El marketing digital se llenó de ruido. Para destacar en cualquier parte del mundo, necesitas entender los sesgos cognitivos que hacen que alguien haga clic, y la tecnología para escalar esa acción. Ese es el ADN de InsightA. No adivinamos; medimos, predecimos y convertimos.'

export default function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.8', 'end 0.2'],
  })

  const chars = BODY_TEXT.split('')

  return (
    <section id="about" ref={sectionRef} className="bg-black py-20 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-2xl md:rounded-3xl px-6 py-14 md:px-14 md:py-20 text-center"
          style={{ backgroundColor: '#101010' }}
        >
          {/* Label */}
          <p
            className="text-[10px] sm:text-xs font-medium tracking-widest uppercase mb-8"
            style={{ color: '#7CB9FF' }}
          >
            Agencia de Marketing Digital
          </p>

          {/* Titular multi-estilo */}
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl max-w-3xl mx-auto leading-[0.95] sm:leading-[0.9] mb-12"
            style={{ color: '#D0E4FF' }}
          >
            <WordsPullUpMultiStyle
              segments={[
                { text: 'No somos otra agencia', className: 'font-normal' },
                { text: 'haciendo posts bonitos.', className: 'font-serif italic' },
                { text: 'Somos neurociencia y código.', className: 'font-normal' },
              ]}
            />
          </h2>

          {/* Párrafo animado por scroll — carácter a carácter */}
          <p
            className="text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#7CB9FF' }}
          >
            {chars.map((char, i) => (
              <AnimatedLetter
                key={i}
                char={char}
                index={i}
                total={chars.length}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </p>

          {/* Estadísticas */}
          <div className="flex justify-center gap-12 md:gap-20 mt-16 pt-10 border-t" style={{ borderColor: 'rgba(124,185,255,0.1)' }}>
            <div>
              <p className="text-4xl md:text-5xl font-bold leading-none" style={{ color: '#D0E4FF' }}>10</p>
              <p className="text-[10px] sm:text-xs font-medium mt-2 tracking-widest uppercase" style={{ color: 'rgba(124,185,255,0.5)' }}>
                Años de experiencia
              </p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold leading-none" style={{ color: '#D0E4FF' }}>380+</p>
              <p className="text-[10px] sm:text-xs font-medium mt-2 tracking-widest uppercase" style={{ color: 'rgba(124,185,255,0.5)' }}>
                Proyectos completados
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
