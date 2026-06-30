import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import ServiceHero from '../components/ServiceHero'

const CRUMBS = [
  { label: 'Inicio',   href: '/' },
  { label: 'Nosotros', href: '/nosotros' },
]

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const BLUE  = '#2563EB'
const MUTED = '#71717A'
const EASE  = [0.16, 1, 0.3, 1] as const

const TECH_SERVICES = [
  'Diseño Web Persuasivo',
  'Desarrollo de E-commerce',
  'Landing Pages de Alta Conversión',
  'Agentes Virtuales con IA',
  'Chatbots Inteligentes (WhatsApp)',
  'Automatización de Ventas',
  'Diseño de Experiencia (UX/UI)',
]

const PERF_SERVICES = [
  'Meta Ads (Facebook e Instagram)',
  'Google Ads (Search y Display)',
  'TikTok, LinkedIn y X Ads',
  'Posicionamiento SEO',
  'Optimización para IA (ChatGPT/Gemini)',
  'Producción de Video Comercial',
  'Fotografía Profesional de Producto',
]

export default function Nosotros() {
  const introRef = useRef<HTMLDivElement>(null)
  const isIntro   = useInView(introRef, { once: true, margin: '-80px' })
  const teamRef   = useRef<HTMLDivElement>(null)
  const isTeam    = useInView(teamRef,  { once: true, margin: '-80px' })
  const metodoRef = useRef<HTMLDivElement>(null)

  return (
    <div className="bg-white">

      <ServiceHero
        title="Nosotros"
        subtitle="No somos otra agencia — somos neurociencia y código."
        breadcrumbs={CRUMBS}
      />

      {/* ── Intro texto + imagen ── */}
      <section className="px-4 md:px-12 pb-20 md:pb-28 max-w-7xl mx-auto">
        <div ref={introRef} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={isIntro ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
            className="space-y-6"
          >
            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#374151' }}>
              El marketing digital se llenó de ruido. Para destacar hoy en Bogotá o en cualquier parte del mundo, necesitas entender los sesgos cognitivos que hacen que alguien haga clic, y la tecnología para escalar esa acción.
            </p>
            <p className="text-base md:text-lg leading-relaxed" style={{ color: '#374151' }}>
              <strong style={{ color: TEXT }}>Ese es el ADN de InsightA.</strong> Somos un equipo de estrategas, psicólogos del consumidor y expertos en IA. Analizamos el comportamiento humano para diseñar el mensaje perfecto, y usamos algoritmos avanzados para entregarlo en el milisegundo exacto en que tu cliente está listo para comprar.
            </p>
            <p className="text-base md:text-lg font-semibold" style={{ color: TEXT }}>
              No adivinamos; medimos, predecimos y convertimos.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={isIntro ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="grid grid-cols-2 gap-4"
          >
            {[['10', 'Años de experiencia'], ['380+', 'Proyectos completados'], ['4', 'Servicios especializados'], ['100%', 'Basado en datos']].map(([n, l]) => (
              <div key={l} className="rounded-2xl p-6 border" style={{ backgroundColor: '#F9FAFB', borderColor: '#E4E4E7' }}>
                <p className="text-3xl md:text-4xl font-bold mb-1" style={{ color: NAVY }}>{n}</p>
                <p className="text-xs font-medium" style={{ color: MUTED }}>{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Equipo multidisciplinar ── */}
      <section className="py-20 md:py-28 px-4 md:px-12" style={{ backgroundColor: '#F9FAFB' }}>
        <div ref={teamRef} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={isTeam ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: BLUE }}>Equipo</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight mb-6" style={{ color: TEXT }}>
              Equipo Multidisciplinar
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: '#374151' }}>
              No somos solo mercadólogos. Somos una célula de trabajo donde convergen psicólogos del consumidor, analistas de datos, ingenieros de IA y creadores audiovisuales.
            </p>
            <p className="text-base leading-relaxed" style={{ color: '#374151' }}>
              Entendemos la mente de tu cliente y desarrollamos la tecnología exacta para conquistarla.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={isTeam ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="space-y-3"
          >
            {[
              ['Psicólogos del consumidor', 'Entienden por qué y cómo toman decisiones tus clientes.'],
              ['Analistas de datos', 'Convierten comportamientos en estrategias medibles.'],
              ['Ingenieros de IA', 'Automatizan y escalan cada interacción con tecnología de punta.'],
              ['Creadores audiovisuales', 'Producen contenido que conecta emocionalmente.'],
            ].map(([r, d]) => (
              <div key={r} className="rounded-xl p-5 border flex items-start gap-4" style={{ backgroundColor: '#fff', borderColor: '#E4E4E7' }}>
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: BLUE }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: TEXT }}>{r}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{d}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Metodología ── */}
      <section className="py-20 md:py-28 px-4 md:px-12 bg-white">
        <div ref={metodoRef} className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: BLUE }}>Metodología</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight mb-6" style={{ color: TEXT }}>
              ¿Cómo Revolucionamos Tu Marca?
            </h2>
            <p className="text-base leading-relaxed" style={{ color: MUTED }}>
              Dejamos atrás las suposiciones y el marketing de esperanza. Usamos ciencia conductual e inteligencia artificial para diseñar estrategias con un único propósito: escalar tus ventas y multiplicar tu retorno de inversión.
            </p>
          </div>

          <div className="rounded-2xl p-8 md:p-12 text-center mb-10" style={{ backgroundColor: NAVY }}>
            <p className="text-2xl md:text-3xl font-bold italic font-serif text-white">
              "El crecimiento no es casualidad, es ciencia."
            </p>
          </div>

          <p className="text-base leading-relaxed text-center max-w-3xl mx-auto" style={{ color: '#374151' }}>
            En InsightA decodificamos el comportamiento de tu audiencia. Cada campaña publicitaria, cada sitio web y cada automatización que diseñamos está respaldada por principios neuropsicológicos y optimizada en tiempo real por Inteligencia Artificial.
          </p>
        </div>
      </section>

      {/* ── Lista completa de servicios ── */}
      <section className="py-20 md:py-28 px-4 md:px-12" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: BLUE }}>Lo que hacemos</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12" style={{ color: TEXT }}>Nuestras capacidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: MUTED }}>Tecnología e Inteligencia Artificial</p>
              <ul className="space-y-3">
                {TECH_SERVICES.map(s => (
                  <li key={s} className="flex items-center gap-3 text-sm font-medium" style={{ color: TEXT }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BLUE }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: MUTED }}>Performance y Estrategia Visual</p>
              <ul className="space-y-3">
                {PERF_SERVICES.map(s => (
                  <li key={s} className="flex items-center gap-3 text-sm font-medium" style={{ color: TEXT }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: BLUE }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12">
            <Link
              to="/contacto"
              className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-2 py-2 transition-all duration-300 text-white text-sm font-semibold"
              style={{ backgroundColor: NAVY }}
            >
              Trabaja con nosotros
              <span className="rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: BLUE }}>
                <ArrowRight size={14} className="text-white" />
              </span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
