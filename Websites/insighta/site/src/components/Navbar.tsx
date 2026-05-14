import { NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback, KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Menu, X, ChevronRight } from 'lucide-react'
import SchemaMarkup from './SchemaMarkup'
import ServicesMegaMenu from './ServicesMegaMenu'

const WHITE   = '#FFFFFF'
const DIM     = 'rgba(255,255,255,0.68)'
const MUTED   = 'rgba(255,255,255,0.40)'

// Gradient that matches hero + service headers key visual
const GRAD_BG   = 'linear-gradient(to right, #1E3F96 0%, #3A62B8 28%, #7A8FCC 52%, #A070C0 74%, #C46090 100%)'
const GRAD_LINE = 'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)'

const NAV = [
  { label: 'Inicio',    to: '/' },
  { label: 'Nosotros',  to: '/nosotros' },
  { label: 'Servicios', to: '/servicios', hasMega: true },
  { label: 'Blog',      to: '/blog' },
]

const MOBILE_SERVICES = [
  { label: 'SEO y Buscadores de IA',   to: '/servicios/posicionamiento-seo-geo' },
  { label: 'Automatización con IA',    to: '/servicios/automatizacion-ia' },
  { label: 'Diseño y Desarrollo Web',  to: '/servicios/diseno-desarrollo-web' },
  { label: 'Performance Marketing',    to: '/servicios/performance-marketing' },
]

const NAV_SCHEMA = {
  '@context': 'https://schema.org',
  '@type':    'SiteNavigationElement',
  name:       ['Inicio', 'Nosotros', 'Servicios', 'Blog', 'Contacto'],
  url: [
    'https://insighta.com.co/',
    'https://insighta.com.co/nosotros',
    'https://insighta.com.co/servicios',
    'https://insighta.com.co/blog',
    'https://insighta.com.co/contacto',
  ],
}

const OPEN_DELAY  = 120
const CLOSE_DELAY = 200

export default function Navbar() {
  const location = useLocation()

  const [megaOpen,           setMegaOpen]           = useState(false)
  const [drawerOpen,         setDrawerOpen]         = useState(false)
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const [scrolled,           setScrolled]           = useState(false)

  const openTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    setDrawerOpen(false)
    setMegaOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    if (!megaOpen) return
    const handler = (e: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [megaOpen])

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') { setMegaOpen(false); setDrawerOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scheduleOpen  = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setMegaOpen(true), OPEN_DELAY)
  }, [])

  const scheduleClose = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setMegaOpen(false), CLOSE_DELAY)
  }, [])

  const handleServicesTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setMegaOpen(v => !v)
    }
  }

  const isServicesActive = location.pathname.startsWith('/servicios')

  return (
    <>
      <SchemaMarkup schema={NAV_SCHEMA} />

      <nav aria-label="Navegación principal" className="fixed top-3 md:top-5 left-5 md:left-7 right-5 md:right-7 z-50">
        <div
          className="flex items-center h-12 md:h-14 px-4 md:px-6 lg:px-8 rounded-2xl transition-all duration-500"
          style={scrolled ? {
            background:           'rgba(6,6,10,0.97)',
            backdropFilter:       'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border:               '1px solid rgba(255,255,255,0.08)',
            boxShadow:            '0 8px 40px rgba(0,0,0,0.55)',
          } : {}}
        >

          {/* Logo — "INSIGHT" white + "A" gradient */}
          <Link
            to="/"
            aria-label="InsightA — Ir al inicio"
            className="flex-shrink-0 font-bold text-[17px] tracking-[0.18em] uppercase select-none"
          >
            <span style={{ color: WHITE }}>INSIGHT</span>
            <span style={{
              backgroundImage: GRAD_LINE,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>A</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-8">
            {NAV.map(({ label, to, hasMega }) => {
              if (hasMega) {
                return (
                  <div
                    key={to}
                    ref={servicesRef}
                    className="relative"
                    onMouseEnter={scheduleOpen}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={megaOpen}
                      aria-controls="mega-servicios"
                      onKeyDown={handleServicesTriggerKey}
                      className="group relative flex items-center gap-1 text-sm font-medium pb-1 transition-colors duration-200"
                      style={{ color: isServicesActive ? WHITE : DIM }}
                    >
                      {label}
                      <ChevronDown
                        size={12}
                        style={{
                          color:      isServicesActive ? WHITE : MUTED,
                          transform:  megaOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                      {/* Gradient underline */}
                      <span
                        className={`absolute bottom-0 left-0 h-[1.5px] transition-all duration-300 origin-left ${isServicesActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        style={{ backgroundImage: GRAD_LINE }}
                      />
                    </button>

                    <AnimatePresence>
                      {megaOpen && (
                        <ServicesMegaMenu id="mega-servicios" onClose={() => setMegaOpen(false)} />
                      )}
                    </AnimatePresence>
                  </div>
                )
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className="group relative text-sm font-medium pb-1 transition-colors duration-200"
                  style={({ isActive }) => ({ color: isActive ? WHITE : DIM })}
                >
                  {({ isActive }) => (
                    <>
                      <span aria-current={isActive ? 'page' : undefined}>{label}</span>
                      <span
                        className={`absolute bottom-0 left-0 h-[1.5px] transition-all duration-300 origin-left ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                        style={{ backgroundImage: GRAD_LINE }}
                      />
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 ml-auto md:ml-0">
            {/* CTA */}
            <Link
              to="/contacto"
              className="hidden md:inline-flex items-center rounded-full text-sm font-semibold px-5 py-2 transition-all duration-300"
              style={{ border: '1px solid rgba(255,255,255,0.28)', color: WHITE }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, {
                  backgroundImage:      GRAD_LINE,
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
                  color:                WHITE,
                  borderColor:          'rgba(255,255,255,0.28)',
                })
              }}
            >
              Agenda una cita
            </Link>

            {/* Hamburger */}
            <button
              type="button"
              aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
              onClick={() => setDrawerOpen(v => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ color: WHITE }}
            >
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 h-full w-72 z-50 flex flex-col py-6 px-5 overflow-y-auto"
              style={{
                background:           'rgba(8,12,35,0.98)',
                backdropFilter:       'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderLeft:           '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-[11px] tracking-[0.22em] uppercase">
                  <span style={{ color: WHITE }}>INSIGHT</span>
                  <span style={{
                    backgroundImage: GRAD_LINE,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>A</span>
                </span>
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ color: MUTED, backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  <X size={15} />
                </button>
              </div>

              <nav className="flex flex-col gap-1" aria-label="Menú móvil">
                {/* Inicio */}
                <NavLink
                  to="/" end
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={({ isActive }) => ({
                    color:           isActive ? WHITE : DIM,
                    backgroundColor: isActive ? 'rgba(91,158,255,0.12)' : 'transparent',
                    borderLeft:      isActive ? '2px solid #5B9EFF' : '2px solid transparent',
                  })}
                >
                  {({ isActive }) => <span aria-current={isActive ? 'page' : undefined}>Inicio</span>}
                </NavLink>

                {/* Nosotros */}
                <NavLink
                  to="/nosotros"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={({ isActive }) => ({
                    color:           isActive ? WHITE : DIM,
                    backgroundColor: isActive ? 'rgba(91,158,255,0.12)' : 'transparent',
                    borderLeft:      isActive ? '2px solid #A78BFA' : '2px solid transparent',
                  })}
                >
                  {({ isActive }) => <span aria-current={isActive ? 'page' : undefined}>Nosotros</span>}
                </NavLink>

                {/* Servicios */}
                <div>
                  <button
                    type="button"
                    aria-expanded={mobileServicesOpen}
                    onClick={() => setMobileServicesOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color:           isServicesActive ? WHITE : DIM,
                      backgroundColor: isServicesActive ? 'rgba(91,158,255,0.12)' : 'transparent',
                      borderLeft:      isServicesActive ? '2px solid #C46090' : '2px solid transparent',
                    }}
                  >
                    Servicios
                    <ChevronRight
                      size={14}
                      style={{
                        color:      MUTED,
                        transform:  mobileServicesOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileServicesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-5 pb-1 flex flex-col gap-0.5 mt-1">
                          <Link
                            to="/servicios"
                            onClick={() => setDrawerOpen(false)}
                            className="px-3 py-2.5 rounded-xl text-[11px] font-semibold"
                            style={{
                              backgroundImage: GRAD_LINE,
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text',
                            }}
                          >
                            → Ver todos los servicios
                          </Link>
                          {MOBILE_SERVICES.map(({ label, to }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setDrawerOpen(false)}
                              className="px-3 py-2.5 rounded-xl text-[11px] transition-colors hover:text-white"
                              style={{ color: DIM }}
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Blog */}
                <NavLink
                  to="/blog"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={({ isActive }) => ({
                    color:           isActive ? WHITE : DIM,
                    backgroundColor: isActive ? 'rgba(91,158,255,0.12)' : 'transparent',
                    borderLeft:      isActive ? '2px solid #5B9EFF' : '2px solid transparent',
                  })}
                >
                  {({ isActive }) => <span aria-current={isActive ? 'page' : undefined}>Blog</span>}
                </NavLink>
              </nav>

              <div className="flex-1" />

              {/* CTA gradient */}
              <Link
                to="/contacto"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center rounded-full text-sm font-semibold py-3.5 mt-6 text-white transition-all duration-200"
                style={{ backgroundImage: GRAD_BG }}
              >
                Agenda una cita
              </Link>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <NavLink
                  to="/contacto"
                  onClick={() => setDrawerOpen(false)}
                  className="block text-center text-xs transition-colors"
                  style={({ isActive }) => ({ color: isActive ? WHITE : MUTED })}
                >
                  {({ isActive }) => <span aria-current={isActive ? 'page' : undefined}>Contacto</span>}
                </NavLink>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
