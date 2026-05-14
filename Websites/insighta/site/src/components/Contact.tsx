import { motion, useInView } from 'framer-motion'
import { Phone, Clock, Facebook, Instagram } from 'lucide-react'
import { useRef, useState } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Contact() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contact" ref={ref} className="bg-black py-20 md:py-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          className="mb-14 md:mb-20"
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="text-[10px] sm:text-xs font-medium tracking-widest uppercase mb-4"
            style={{ color: 'rgba(124,185,255,0.5)' }}>
            Contacto
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[0.95] tracking-tight"
            style={{ color: '#D0E4FF' }}>
            ¡Trabajemos<br />
            <span style={{ color: '#7CB9FF' }}>Juntos!</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">

          {/* Formulario */}
          <motion.div
            className="lg:col-span-3"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
          >
            {sent ? (
              <div className="flex items-center justify-center h-64 rounded-2xl"
                style={{ backgroundColor: '#101010', border: '1px solid rgba(124,185,255,0.15)' }}>
                <div className="text-center">
                  <p className="text-2xl font-bold mb-2" style={{ color: '#7CB9FF' }}>¡Mensaje enviado!</p>
                  <p className="text-sm text-gray-400">Te contactamos pronto.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(208,228,255,0.6)' }}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre"
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-200"
                      style={{
                        backgroundColor: '#101010',
                        border: '1px solid rgba(124,185,255,0.15)',
                        color: '#D0E4FF',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(124,185,255,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(124,185,255,0.15)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(208,228,255,0.6)' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="Número"
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-200"
                      style={{
                        backgroundColor: '#101010',
                        border: '1px solid rgba(124,185,255,0.15)',
                        color: '#D0E4FF',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(124,185,255,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(124,185,255,0.15)')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(208,228,255,0.6)' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="tu@email.com"
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-200"
                      style={{
                        backgroundColor: '#101010',
                        border: '1px solid rgba(124,185,255,0.15)',
                        color: '#D0E4FF',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(124,185,255,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(124,185,255,0.15)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(208,228,255,0.6)' }}>
                      Empresa
                    </label>
                    <input
                      type="text"
                      placeholder="Tu empresa"
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-200"
                      style={{
                        backgroundColor: '#101010',
                        border: '1px solid rgba(124,185,255,0.15)',
                        color: '#D0E4FF',
                      }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(124,185,255,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(124,185,255,0.15)')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(208,228,255,0.6)' }}>
                    Mensaje *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Cuéntanos sobre tu proyecto..."
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors duration-200 resize-none"
                    style={{
                      backgroundColor: '#101010',
                      border: '1px solid rgba(124,185,255,0.15)',
                      color: '#D0E4FF',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(124,185,255,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(124,185,255,0.15)')}
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-1.5 py-1.5 transition-all duration-300 font-medium text-sm text-black"
                  style={{ backgroundColor: '#7CB9FF' }}
                >
                  Enviar mensaje
                  <span className="bg-black rounded-full w-9 h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7CB9FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </button>
              </form>
            )}
          </motion.div>

          {/* Info de contacto */}
          <motion.div
            className="lg:col-span-2 flex flex-col gap-8"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
          >
            <div className="rounded-2xl p-6 space-y-6"
              style={{ backgroundColor: '#101010', border: '1px solid rgba(124,185,255,0.08)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(124,185,255,0.1)' }}>
                  <Phone size={16} style={{ color: '#7CB9FF' }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Teléfono</p>
                  <p className="text-sm font-medium" style={{ color: '#D0E4FF' }}>312 345 6789</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(124,185,255,0.1)' }}>
                  <Clock size={16} style={{ color: '#7CB9FF' }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Horario de atención</p>
                  <p className="text-sm font-medium" style={{ color: '#D0E4FF' }}>Lunes – Viernes</p>
                  <p className="text-xs text-gray-400">9:00 am – 5:00 pm</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6"
              style={{ backgroundColor: '#101010', border: '1px solid rgba(124,185,255,0.08)' }}>
              <p className="text-xs text-gray-500 mb-4 font-medium tracking-widest uppercase">Redes sociales</p>
              <div className="flex gap-3">
                {[
                  { icon: <Facebook size={16} />, label: 'Facebook' },
                  { icon: <Instagram size={16} />, label: 'Instagram' },
                  {
                    icon: (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z"/>
                      </svg>
                    ),
                    label: 'TikTok'
                  },
                ].map(s => (
                  <button
                    key={s.label}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 border-none cursor-pointer"
                    style={{ backgroundColor: 'rgba(124,185,255,0.08)', color: 'rgba(124,185,255,0.6)' }}
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.backgroundColor = 'rgba(124,185,255,0.15)'
                      el.style.color = '#7CB9FF'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.backgroundColor = 'rgba(124,185,255,0.08)'
                      el.style.color = 'rgba(124,185,255,0.6)'
                    }}
                    aria-label={s.label}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  )
}
