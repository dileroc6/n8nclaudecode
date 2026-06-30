import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Bot, Monitor, TrendingUp, ArrowRight } from 'lucide-react'

const GRAD_LINE = 'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)'
const TEXT      = '#F5F1E8'
const MUTED     = 'rgba(255,255,255,0.50)'

const SERVICES = [
  {
    to:    '/servicios/posicionamiento-seo-geo',
    icon:  Search,
    label: 'SEO y Buscadores de IA',
    desc:  'Posicionamiento en Google, ChatGPT y Gemini',
  },
  {
    to:    '/servicios/automatizacion-ia',
    icon:  Bot,
    label: 'Automatización con IA',
    desc:  'Chatbots, flujos automáticos y agentes inteligentes',
  },
  {
    to:    '/servicios/diseno-desarrollo-web',
    icon:  Monitor,
    label: 'Diseño y Desarrollo Web',
    desc:  'Sitios de alta conversión con Core Web Vitals ≥90',
  },
  {
    to:    '/servicios/performance-marketing',
    icon:  TrendingUp,
    label: 'Performance Marketing',
    desc:  'Campañas en Meta, Google, TikTok y LinkedIn Ads',
  },
]

interface Props {
  id: string
  onClose: () => void
}

export default function ServicesMegaMenu({ id, onClose }: Props) {
  return (
    <motion.div
      id={id}
      role="menu"
      aria-label="Servicios"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute top-[calc(100%+14px)] left-1/2 -translate-x-1/2 w-[520px] rounded-2xl p-5 z-50"
      style={{
        background: 'rgba(6,6,10,0.97)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}
      onMouseLeave={onClose}
    >
      <p
        className="text-[9px] font-semibold tracking-[0.22em] uppercase mb-3 px-1"
        style={{
          backgroundImage:       GRAD_LINE,
          WebkitBackgroundClip:  'text',
          WebkitTextFillColor:   'transparent',
          backgroundClip:        'text',
        }}
      >
        Nuestros Servicios
      </p>

      <div className="grid grid-cols-1 gap-1">
        {SERVICES.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            role="menuitem"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-3 group transition-colors duration-150"
            style={{ outline: 'none' }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(91,158,255,0.08)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = ''
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(91,158,255,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = ''
            }}
          >
            <span
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-150 group-hover:bg-[rgba(91,158,255,0.18)]"
              style={{ backgroundColor: 'rgba(91,158,255,0.10)' }}
            >
              <Icon size={16} className="transition-colors duration-150 text-[#7A8FCC] group-hover:text-[#A78BFA]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-xs font-semibold leading-snug" style={{ color: TEXT }}>
                {label}
              </span>
              <span className="block text-[11px] leading-snug mt-0.5" style={{ color: MUTED }}>
                {desc}
              </span>
            </span>
            <ArrowRight
              size={12}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transition-transform duration-150"
              style={{ color: '#A78BFA' }}
            />
          </Link>
        ))}
      </div>

      {/* Footer link */}
      <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
        <Link
          to="/servicios"
          role="menuitem"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg transition-all duration-150"
          style={{ color: MUTED }}
          onMouseEnter={(e) => {
            Object.assign(e.currentTarget.style, {
              backgroundImage:       GRAD_LINE,
              WebkitBackgroundClip:  'text',
              WebkitTextFillColor:   'transparent',
              backgroundClip:        'text',
            })
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, {
              backgroundImage:       '',
              WebkitBackgroundClip:  '',
              WebkitTextFillColor:   '',
              backgroundClip:        '',
              color:                 MUTED,
            })
          }}
        >
          Ver todos los servicios
          <ArrowRight size={11} />
        </Link>
      </div>
    </motion.div>
  )
}
