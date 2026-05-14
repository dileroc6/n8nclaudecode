import { motion, useInView } from 'framer-motion'
import { Phone, Clock, Facebook, Instagram, ArrowRight } from 'lucide-react'
import { useRef, useState } from 'react'

const TEXT  = '#09090b'
const NAVY  = '#1B3A6B'
const BLUE  = '#2563EB'
const MUTED = '#71717A'
const EASE  = [0.16, 1, 0.3, 1] as const

const inputBase: React.CSSProperties = {
  width: '100%',
  borderRadius: 8,
  padding: '0.7rem 1rem',
  fontSize: '0.875rem',
  backgroundColor: '#FAFAFA',
  border: '1px solid #E4E4E7',
  color: TEXT,
  outline: 'none',
  transition: 'border-color 0.2s',
}

export default function Contacto() {
  const ref    = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSent(true) }

  const Field = ({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: TEXT }}>
        {label}{required && <span style={{ color: BLUE }}> *</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div className="bg-white pt-24 md:pt-28">

      {/* ── Header ── */}
      <section className="px-4 md:px-12 pb-16 max-w-7xl mx-auto">
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-6" style={{ color: BLUE }}>Contacto</p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight" style={{ color: TEXT }}>
          ¡Trabajemos<br />
          <span style={{ color: NAVY }}>Juntos!</span>
        </h1>
      </section>

      {/* ── Formulario + Info ── */}
      <section ref={ref} className="px-4 md:px-12 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

          {/* Formulario */}
          <motion.div
            className="lg:col-span-3"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, ease: EASE }}
          >
            {sent ? (
              <div className="flex items-center justify-center h-72 rounded-2xl border" style={{ borderColor: '#E4E4E7', backgroundColor: '#FAFAFA' }}>
                <div className="text-center">
                  <p className="text-2xl font-bold mb-2" style={{ color: NAVY }}>¡Mensaje enviado!</p>
                  <p className="text-sm" style={{ color: MUTED }}>Te contactamos en las próximas horas.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Nombre" required>
                    <input type="text" required placeholder="Tu nombre" style={inputBase}
                      onFocus={e => (e.target.style.borderColor = BLUE)}
                      onBlur={e => (e.target.style.borderColor = '#E4E4E7')} />
                  </Field>
                  <Field label="Teléfono">
                    <input type="tel" placeholder="312 345 6789" style={inputBase}
                      onFocus={e => (e.target.style.borderColor = BLUE)}
                      onBlur={e => (e.target.style.borderColor = '#E4E4E7')} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" required>
                    <input type="email" required placeholder="tu@email.com" style={inputBase}
                      onFocus={e => (e.target.style.borderColor = BLUE)}
                      onBlur={e => (e.target.style.borderColor = '#E4E4E7')} />
                  </Field>
                  <Field label="Empresa">
                    <input type="text" placeholder="Tu empresa" style={inputBase}
                      onFocus={e => (e.target.style.borderColor = BLUE)}
                      onBlur={e => (e.target.style.borderColor = '#E4E4E7')} />
                  </Field>
                </div>
                <Field label="Mensaje" required>
                  <textarea required rows={5} placeholder="Cuéntanos sobre tu proyecto o lo que necesitas..."
                    style={{ ...inputBase, resize: 'none' }}
                    onFocus={e => (e.target.style.borderColor = BLUE)}
                    onBlur={e => (e.target.style.borderColor = '#E4E4E7')} />
                </Field>
                <button
                  type="submit"
                  className="group inline-flex items-center gap-2 hover:gap-3 rounded-full pl-6 pr-2 py-2 transition-all duration-300 text-white text-sm font-semibold"
                  style={{ backgroundColor: NAVY }}
                >
                  Enviar mensaje
                  <span className="rounded-full w-9 h-9 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: BLUE }}>
                    <ArrowRight size={14} className="text-white" />
                  </span>
                </button>
              </form>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            className="lg:col-span-2 space-y-4"
            initial={{ y: 30, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
          >
            <div className="rounded-2xl p-6 border space-y-5" style={{ backgroundColor: '#FAFAFA', borderColor: '#E4E4E7' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF4FF', color: BLUE }}>
                  <Phone size={15} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: MUTED }}>Teléfono</p>
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>312 345 6789</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF4FF', color: BLUE }}>
                  <Clock size={15} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: MUTED }}>Horario</p>
                  <p className="text-sm font-semibold" style={{ color: TEXT }}>Lunes – Viernes</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>9:00 am – 5:00 pm</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 border" style={{ backgroundColor: '#FAFAFA', borderColor: '#E4E4E7' }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ color: MUTED }}>Redes Sociales</p>
              <div className="flex gap-2">
                {[
                  { label: 'Facebook', icon: <Facebook size={15} /> },
                  { label: 'Instagram', icon: <Instagram size={15} /> },
                  {
                    label: 'TikTok',
                    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z" />
                    </svg>
                  },
                ].map(s => (
                  <button key={s.label} aria-label={s.label}
                    className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 border"
                    style={{ backgroundColor: '#fff', borderColor: '#E4E4E7', color: MUTED }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E4E7'; e.currentTarget.style.color = MUTED }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>
      </section>

    </div>
  )
}
