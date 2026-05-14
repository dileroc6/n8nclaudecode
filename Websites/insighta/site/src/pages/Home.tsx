import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  ArrowRight, Check, Search, MessageCircle, TrendingUp, Globe,
  Clock, LayoutGrid, Zap, Target, BarChart3, Users,
} from 'lucide-react'
import { useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import WordsPullUp from '../components/shared/WordsPullUp'
import WordsPullUpMultiStyle from '../components/shared/WordsPullUpMultiStyle'
import HeroParticles from '../components/HeroParticles'
import { BLOG_POSTS } from '../data/blog'

const EASE     = [0.16, 1, 0.3, 1] as const
const TEXT     = '#09090b'
const NAVY     = '#1B3A6B'
const BLUE     = '#2563EB'
const MUTED    = '#71717A'
const DARK     = '#0A0E1A'
const GRADIENT = 'linear-gradient(to right, #1E3F96 0%, #3A62B8 28%, #7A8FCC 52%, #A070C0 74%, #C46090 100%)'
// Per-segment italic style — matches site key visual
const ITALIC_STYLE: CSSProperties = {
  backgroundImage: 'linear-gradient(135deg, #5B9EFF 0%, #A78BFA 55%, #F472B6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

/* ─── HERO ─────────────────────────────────────────────────────────── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="h-[90vh] p-3 md:p-5 relative z-10">
      {/* Rounded video container — all content lives inside, no outside overlap hacks */}
      <div className="absolute inset-3 md:inset-5 rounded-2xl md:rounded-[2rem] overflow-hidden">
        <video
          autoPlay muted loop playsInline preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          src="/hero.mp4"
        />
        <div className="absolute inset-0 bg-black/50 pointer-events-none" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(135deg, rgba(30,63,150,0.40) 0%, rgba(160,112,192,0.25) 60%, transparent 100%)',
          zIndex: 2,
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, transparent 55%, rgba(5,8,20,0.30) 100%)',
          zIndex: 2,
        }} />
        <div className="noise-overlay absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none" style={{ zIndex: 3 }} />
        <HeroParticles />
        <div className="absolute top-16 bottom-16 left-1/2 hidden lg:block"
          style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)', zIndex: 3 }} />

        {/* Bottom bar: INSIGHTA + text/button beside it, left-anchored */}
        <div className="absolute bottom-0 inset-x-0 flex items-end gap-8 px-7 md:px-10 lg:px-14 pb-7 md:pb-10" style={{ zIndex: 6 }}>

          <h1
            className="font-black uppercase leading-[0.85] tracking-[-0.03em] select-none pointer-events-none shrink-0"
            style={{ fontSize: 'clamp(2.5rem, 9vw, 11rem)', color: 'white' }}
          >
            <WordsPullUp text="InsightA" />
          </h1>

          <div className="flex flex-col gap-3 pb-2 ml-16">
            <motion.p
              className="text-sm leading-snug max-w-[220px]"
              style={{ color: 'rgba(255,255,255,0.70)', lineHeight: 1.45 }}
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
            >
              Hackeamos el crecimiento de tu marca combinando la psicología del consumidor con Inteligencia Artificial.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
            >
              <Link
                to="/contacto"
                className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-5 pr-1.5 py-1.5 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_6px_24px_rgba(255,255,255,0.20)]"
                style={{ backgroundColor: 'white' }}
              >
                <span className="font-medium text-sm" style={{ color: TEXT }}>Agenda una cita</span>
                <span
                  className="rounded-full w-9 h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5B9EFF 0%, #A78BFA 60%, #F472B6 100%)' }}
                >
                  <ArrowRight size={14} className="text-white" />
                </span>
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─── ABOUT SNIPPET ─────────────────────────────────────────────────── */
function AboutSnippet() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView   = useInView(sectionRef, { once: true, margin: '-8%' })

  const fade = (delay: number) => ({
    initial:    { opacity: 0, y: 22 },
    animate:    isInView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease: EASE },
  })

  return (
    <section ref={sectionRef} className="py-20 md:py-28 px-4 md:px-8">
      <div className="max-w-3xl mx-auto text-center">

        <motion.p {...fade(0)} className="label-gradient text-[10px] font-semibold tracking-[0.2em] uppercase mb-8">
          Agencia de Marketing Digital
        </motion.p>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight mb-8" style={{ color: TEXT }}>
          <WordsPullUpMultiStyle segments={[
            { text: 'No somos otra agencia', className: 'font-bold' },
            { text: 'haciendo posts bonitos.', className: 'font-serif italic', style: ITALIC_STYLE },
          ]} wrapperClassName="justify-center" />
        </h2>

        <motion.p {...fade(0.15)} className="text-sm md:text-base max-w-md mx-auto leading-relaxed mb-10" style={{ color: MUTED }}>
          Combinamos datos neuronales con código avanzado para transformar la estrategia de marca en resultados tangibles.
        </motion.p>

        {/* Stats */}
        <motion.div {...fade(0.25)} className="flex items-center justify-center gap-10 mb-10">
          <div className="flex items-center gap-3">
            <Clock size={22} className="flex-shrink-0" style={{ color: BLUE }} />
            <div className="text-left">
              <p className="text-3xl font-bold leading-none" style={{ color: TEXT }}>10</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: MUTED }}>Años</p>
            </div>
          </div>
          <div className="w-px h-10 bg-black/10" />
          <div className="flex items-center gap-3">
            <LayoutGrid size={22} className="flex-shrink-0" style={{ color: BLUE }} />
            <div className="text-left">
              <p className="text-3xl font-bold leading-none" style={{ color: TEXT }}>380+</p>
              <p className="text-[10px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: MUTED }}>Proyectos</p>
            </div>
          </div>
        </motion.div>

        {/* Button */}
        <motion.div {...fade(0.35)} className="flex justify-center">
          <Link
            to="/nosotros"
            className="group inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full border transition-all duration-300"
            style={{ color: NAVY, borderColor: NAVY }}
            onMouseEnter={(e) => {
              Object.assign(e.currentTarget.style, {
                backgroundImage:      'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
                borderColor:          '#A78BFA',
              })
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, {
                backgroundImage:      '',
                WebkitBackgroundClip: '',
                WebkitTextFillColor:  '',
                backgroundClip:       '',
                color:                NAVY,
                borderColor:          NAVY,
              })
            }}
          >
            Conoce más sobre nosotros
            <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}

/* ─── SERVICIOS ─────────────────────────────────────────────────────── */
const SERVICES = [
  {
    n: '01', title: 'Posicionamiento SEO + GEO', to: '/servicios/posicionamiento-seo-geo',
    desc: 'Posicionamos tu marca en Google y aseguramos que la IA (ChatGPT, Gemini) te recomiende antes que a tu competencia.',
    icon: <Search size={20} className="text-white" />,
    items: ['SEO técnico y on-page', 'Optimización para buscadores de IA', 'Estrategia de contenido semántico', 'Auditoría técnica mensual'],
  },
  {
    n: '02', title: 'Atención al Cliente IA 24/7', to: '/servicios/automatizacion-ia',
    desc: 'Instalamos asistentes de IA en WhatsApp y tu web que hablan de forma natural, resuelven dudas y cierran ventas a cualquier hora.',
    icon: <MessageCircle size={20} className="text-white" />,
    items: ['Chatbots inteligentes para WhatsApp', 'Agentes virtuales con IA en la web', 'Integración con tu CRM', 'Respuesta 24/7 sin costo por hora'],
  },
  {
    n: '03', title: 'Diseño y Desarrollo Web', to: '/servicios/diseno-desarrollo-web',
    desc: 'Tu página web debe ser tu mejor vendedor. Diseñamos sitios rápidos, atractivos y optimizados para convertir.',
    icon: <Globe size={20} className="text-white" />,
    items: ['Sitios corporativos persuasivos', 'Tiendas online y e-commerce', 'Landing pages de alta conversión', 'Diseño UX/UI neuropsicológico'],
  },
  {
    n: '04', title: 'Performance Marketing', to: '/servicios/performance-marketing',
    desc: 'Creamos campañas en Facebook, Google y TikTok diseñadas para multiplicar tus ventas con ciencia de datos.',
    icon: <TrendingUp size={20} className="text-white" />,
    items: ['Meta Ads (Facebook e Instagram)', 'Google Ads Search y Display', 'TikTok, LinkedIn y X Ads', 'Optimización de ROI en tiempo real'],
  },
]

function ServiceCard({ s, i }: { s: typeof SERVICES[0]; i: number }) {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden flex flex-col group"
      style={{ border: '1px solid #E4E4E7' }}
      initial={{ y: 40, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: false, margin: '-60px' }}
      transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.10)', transition: { duration: 0.25 } }}
    >
      {/* Gradient header */}
      <div
        className="relative px-6 pt-7 pb-6 flex flex-col gap-4 overflow-hidden"
        style={{ background: GRADIENT, minHeight: 140 }}
      >
        {/* Decorative circle */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full"
          style={{ background: 'rgba(255,255,255,0.04)' }} />

        <div className="flex items-start justify-between relative z-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)' }}>
            {s.icon}
          </div>
          <span className="text-xs font-bold tabular-nums text-white/40">{s.n}</span>
        </div>
        <h3 className="font-bold text-base text-white leading-tight relative z-10">{s.title}</h3>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-6 flex-1" style={{ backgroundColor: '#FAFAFA' }}>
        <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
        <ul className="space-y-2 flex-1">
          {s.items.map(item => (
            <li key={item} className="flex items-start gap-2">
              <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: BLUE }} />
              <span className="text-sm" style={{ color: MUTED }}>{item}</span>
            </li>
          ))}
        </ul>
        <Link
          to={s.to}
          className="group/link self-start inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-1.5 border transition-all duration-300"
          style={{ color: BLUE, borderColor: `${BLUE}33` }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, {
              backgroundImage:      'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor:  'transparent',
              backgroundClip:       'text',
              borderColor:          '#A78BFA',
            })
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              backgroundImage:      '',
              WebkitBackgroundClip: '',
              WebkitTextFillColor:  '',
              backgroundClip:       '',
              color:                BLUE,
              borderColor:          `${BLUE}33`,
            })
          }}
        >
          Saber más
          <ArrowRight size={13} className="transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  )
}

function ServiciosSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const isInView  = useInView(headerRef, { once: true, margin: '-60px' })

  return (
    <section className="py-20 md:py-28 px-4 md:px-8" style={{ backgroundColor: '#F8F8FA' }}>
      <div className="max-w-7xl mx-auto">
        <div ref={headerRef} className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="label-gradient text-[10px] font-semibold tracking-[0.2em] uppercase mb-4"
            >
              Servicios
            </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight" style={{ color: TEXT }}>
              <WordsPullUpMultiStyle segments={[
                { text: 'Marketing de precisión', className: '' },
                { text: 'para marcas ambiciosas.', className: 'font-serif italic', style: ITALIC_STYLE },
              ]} wrapperClassName="justify-start" />
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          >
            <Link
              to="/servicios"
              className="inline-flex items-center gap-2 text-sm font-semibold group flex-shrink-0 transition-all duration-300"
              style={{ color: NAVY }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundImage: 'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                })
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundImage: '',
                  WebkitBackgroundClip: '',
                  WebkitTextFillColor: '',
                  backgroundClip: '',
                  color: NAVY,
                })
              }}
            >
              Ver todos los servicios <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((s, i) => <ServiceCard key={s.n} s={s} i={i} />)}
        </div>
      </div>
    </section>
  )
}

/* ─── PROCESO ───────────────────────────────────────────────────────── */
const STEPS = [
  { n: '01', label: 'Auditoría',    desc: 'Analizamos tu situación actual, competencia y oportunidades de crecimiento.',    icon: <Target size={20} /> },
  { n: '02', label: 'Estrategia',   desc: 'Diseñamos un plan personalizado con objetivos claros y métricas de éxito.',        icon: <Zap size={20} /> },
  { n: '03', label: 'Ejecución',    desc: 'Implementamos cada acción con precisión técnica y creatividad orientada a datos.', icon: <Users size={20} /> },
  { n: '04', label: 'Optimización', desc: 'Medimos, aprendemos y mejoramos continuamente para maximizar tu ROI.',             icon: <BarChart3 size={20} /> },
]

function ProcesoSection() {
  const ref      = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-20 md:py-28 px-4 md:px-8" style={{ background: 'linear-gradient(to right, #1E3F96 0%, #3A62B8 25%, #7A8FCC 50%, #A070C0 72%, #C46090 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Cómo trabajamos
            </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight text-white">
              <WordsPullUpMultiStyle segments={[
                { text: 'Proceso claro,', className: '' },
                { text: 'resultados medibles.', className: 'font-serif italic text-white/60' },
              ]} wrapperClassName="justify-start" />
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              className="rounded-2xl p-8 flex flex-col gap-5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: '-60px' }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, backgroundColor: 'rgba(255,255,255,0.18)', transition: { duration: 0.2 } }}
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                  {step.icon}
                </div>
                <span
                  className="text-4xl font-black tabular-nums leading-none text-white"
                  style={{ opacity: 0.18 }}
                >
                  {step.n}
                </span>
              </div>
              <div>
                <p className="font-bold text-base text-white mb-2">{step.label}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── TESTIMONIOS ───────────────────────────────────────────────────── */
const TESTIMONIOS = [
  { name: 'Markus Dumble', role: 'CEO Global BMT', initial: 'M',
    text: 'InsightA transformó nuestra presencia digital con una estrategia basada en datos reales. Los resultados superaron todas nuestras expectativas en menos de 3 meses.' },
  { name: 'Alan Ginsburg', role: 'Smart GH', initial: 'A',
    text: 'El chatbot de IA que implementaron en nuestro WhatsApp aumentó las conversiones en un 40%. Responde de forma natural y cierra ventas incluso de madrugada.' },
  { name: 'Kate Bucher', role: 'Learning Online', initial: 'K',
    text: 'Su enfoque en la psicología del consumidor hace toda la diferencia. Cada campaña está diseñada para conectar emocionalmente, y los números lo reflejan.' },
]

function TestimoniosSection() {
  const [active, setActive]  = useState(0)
  const ref      = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const t = TESTIMONIOS[active]

  return (
    <section ref={ref} className="py-20 md:py-28 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">

        <div className="relative min-h-[320px]">

          {/* Texto — flujo normal, limitado al 40% izquierdo en desktop */}
          <div className="lg:max-w-[40%]">
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="label-gradient text-[10px] font-semibold tracking-[0.2em] uppercase mb-4"
            >
              Testimonios
            </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight mb-6" style={{ color: TEXT }}>
              <WordsPullUpMultiStyle segments={[
                { text: 'Lo que dicen', className: 'font-bold' },
                { text: 'nuestros clientes.', className: 'font-serif italic', style: ITALIC_STYLE },
              ]} wrapperClassName="justify-start" />
            </h2>

            <AnimatePresence mode="wait">
              <motion.div key={active}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: EASE }}>
                <div className="text-7xl font-black leading-none mb-3 select-none"
                  style={{ backgroundImage: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ❝
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{t.text}</p>
              </motion.div>
            </AnimatePresence>

            {/* Botones móvil */}
            <div className="flex lg:hidden gap-3 mt-8">
              {TESTIMONIOS.map((_, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className="w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center"
                  style={active === i
                    ? { background: GRADIENT, color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }
                    : { border: '1px solid #E4E4E7', color: MUTED, backgroundColor: 'white' }}>
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Círculo — absolute center (top 50% left 50%) */}
          <AnimatePresence mode="wait">
            <motion.div key={active}
              className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: EASE }}>
              <div className="w-56 h-56 rounded-full" style={{ backgroundColor: '#E4E4E7' }} />
            </motion.div>
          </AnimatePresence>

          {/* Botones 01/02/03 — absolute right, vertical center */}
          <div className="hidden lg:flex flex-col gap-3 absolute right-0 top-1/2 -translate-y-1/2">
            {TESTIMONIOS.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className="w-12 h-12 rounded-full font-bold text-sm transition-all duration-300 flex items-center justify-center"
                style={active === i
                  ? { background: GRADIENT, color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }
                  : { border: '1px solid #E4E4E7', color: MUTED, backgroundColor: 'white' }}>
                {String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}


/* ─── BLOG ──────────────────────────────────────────────────────────── */
function BlogSection() {
  const ref      = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const posts    = BLOG_POSTS.slice(0, 3)

  return (
    <section ref={ref} className="py-20 md:py-28 px-4 md:px-8" style={{ backgroundColor: '#F8F8FA' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="label-gradient text-[10px] font-semibold tracking-[0.2em] uppercase mb-4"
            >
              Blog
            </motion.p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight" style={{ color: TEXT }}>
              <WordsPullUpMultiStyle segments={[
                { text: 'Ideas que hacen', className: 'font-bold' },
                { text: 'crecer marcas.', className: 'font-serif italic', style: ITALIC_STYLE },
              ]} wrapperClassName="justify-start" />
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold group flex-shrink-0 transition-all duration-200"
              style={{ color: NAVY }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundImage: 'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                })
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundImage: '', WebkitBackgroundClip: '', WebkitTextFillColor: '', backgroundClip: '', color: NAVY,
                })
              }}
            >
              Ver todos los artículos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ y: 24, opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group block rounded-2xl border overflow-hidden hover:shadow-md transition-all duration-300"
                style={{ borderColor: '#E4E4E7' }}
              >
                {/* Image area */}
                <div className="aspect-[16/9] overflow-hidden relative" style={{ backgroundColor: `${post.tagAccent}10` }}>
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={post.imageAlt}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: `${post.tagAccent}15` }} />
                  )}
                  <span
                    className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${post.tagAccent}18`, color: post.tagAccent }}
                  >
                    {post.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: MUTED }}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} lectura</span>
                  </div>
                  <h3 className="font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors" style={{ color: TEXT }}>
                    {post.title}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: MUTED }}>{post.excerpt}</p>
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold mt-1 transition-all duration-200"
                    style={{ color: BLUE }}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, {
                        backgroundImage:      'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor:  'transparent',
                        backgroundClip:       'text',
                      })
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, {
                        backgroundImage:      '',
                        WebkitBackgroundClip: '',
                        WebkitTextFillColor:  '',
                        backgroundClip:       '',
                        color:                BLUE,
                      })
                    }}
                  >
                    Leer más <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ─── CLIENTES ──────────────────────────────────────────────────────── */
const LOGO_SLOTS = [1, 2, 3, 4, 5, 6]

function ClientesSection() {
  return (
    <section className="py-14 md:py-20 px-4 md:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="label-gradient text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Clientes</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[0.95] tracking-tight" style={{ color: TEXT }}>
            <WordsPullUpMultiStyle segments={[
              { text: 'Clientes que', className: 'font-bold' },
              { text: 'confían en nosotros.', className: 'font-serif italic', style: ITALIC_STYLE },
            ]} wrapperClassName="justify-center" />
          </h2>
        </div>
        {/* Círculos placeholder — reemplazar por logos reales / carrusel */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8 items-center justify-items-center">
          {LOGO_SLOTS.map(n => (
            <div
              key={n}
              className="w-20 h-20 rounded-full"
              style={{ backgroundColor: '#F0F0F2' }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA ────────────────────────────────────────────────────────────── */
function CTASection() {
  const ref      = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-20 md:py-32 px-4 md:px-8" style={{ backgroundColor: DARK }}>
      <div className="max-w-4xl mx-auto text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6 text-white/40"
        >
          ¿Listo para crecer?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 18 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-[0.95] tracking-tight mb-8"
        >
          <WordsPullUpMultiStyle segments={[
            { text: '¿Listo para hacer crecer', className: 'font-bold' },
            { text: 'tu empresa?', className: 'font-serif italic text-white/60' },
          ]} wrapperClassName="justify-center" />
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
          className="text-sm md:text-base text-white/50 max-w-lg mx-auto mb-10 leading-relaxed"
        >
          Agenda una sesión personalizada con nuestro equipo. Sin compromisos, sin rodeos — solo estrategia y resultados.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
        >
          <Link
            to="/contacto"
            className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-2 py-2 transition-all duration-300"
            style={{ backgroundColor: '#fff' }}
          >
            <span className="font-semibold text-sm md:text-base" style={{ color: DARK }}>Agenda una cita aquí</span>
            <span
              className="rounded-full w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
              style={{ background: GRADIENT }}
            >
              <ArrowRight size={16} className="text-white" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── HOME PAGE ─────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <>
      <Hero />
      <AboutSnippet />
      <ServiciosSection />
      <ProcesoSection />
      <TestimoniosSection />
      <BlogSection />
      <ClientesSection />
      <CTASection />
    </>
  )
}
