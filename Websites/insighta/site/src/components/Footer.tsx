import { NavLink } from 'react-router-dom'

const GRAD_LINE = 'linear-gradient(to right, #5B9EFF, #A78BFA, #F472B6)'
const GRAD_BG   = 'linear-gradient(to right, #1E3F96 0%, #3A62B8 28%, #7A8FCC 52%, #A070C0 74%, #C46090 100%)'

const COL1 = [
  { label: 'Inicio',    to: '/' },
  { label: 'Nosotros',  to: '/nosotros' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Blog',      to: '/blog' },
  { label: 'Contacto',  to: '/contacto' },
]

const SERVICES = [
  { label: 'Posicionamiento SEO + GEO',  to: '/servicios/posicionamiento-seo-geo' },
  { label: 'Atención al Cliente IA 24/7', to: '/servicios/automatizacion-ia' },
  { label: 'Diseño y Desarrollo Web',    to: '/servicios/diseno-desarrollo-web' },
  { label: 'Performance Marketing',      to: '/servicios/performance-marketing' },
]

function FooterLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className="group inline-flex items-center gap-1.5 text-sm transition-all duration-200"
        style={{ color: 'rgba(255,255,255,0.50)' }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundImage:      GRAD_LINE,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor:  'transparent',
            backgroundClip:       'text',
            transform:            'translateX(4px)',
          })
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            backgroundImage:      '',
            WebkitBackgroundClip: '',
            WebkitTextFillColor:  '',
            backgroundClip:       '',
            color:                'rgba(255,255,255,0.50)',
            transform:            '',
          })
        }}
      >
        {label}
      </NavLink>
    </li>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#09090b] text-white px-6 md:px-12 pt-16 pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Marca */}
          <div className="lg:col-span-2">
            <p className="font-bold text-[17px] tracking-[0.18em] uppercase mb-4">
              <span style={{ color: '#fff' }}>INSIGHT</span>
              <span style={{
                backgroundImage:      GRAD_LINE,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }}>A</span>
            </p>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Hackeamos el crecimiento de tu marca combinando la psicología del consumidor con Inteligencia Artificial.
            </p>
            <div className="flex gap-3 mt-6">
              {['Facebook', 'Instagram', 'TikTok'].map(r => (
                <span
                  key={r}
                  className="text-[10px] px-3 py-1 rounded-full font-medium cursor-pointer transition-all duration-200"
                  style={{ backgroundColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={(e) => {
                    Object.assign(e.currentTarget.style, {
                      backgroundImage: GRAD_BG,
                      color: 'white',
                    })
                  }}
                  onMouseLeave={(e) => {
                    Object.assign(e.currentTarget.style, {
                      backgroundImage: '',
                      backgroundColor: 'rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.5)',
                    })
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          {/* Páginas */}
          <div>
            <p
              className="text-[9px] font-semibold tracking-[0.22em] uppercase mb-5"
              style={{
                backgroundImage:      GRAD_LINE,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }}
            >
              Páginas
            </p>
            <ul className="space-y-3">
              {COL1.map(({ label, to }) => (
                <FooterLink key={to} to={to} label={label} />
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div>
            <p
              className="text-[9px] font-semibold tracking-[0.22em] uppercase mb-5"
              style={{
                backgroundImage:      GRAD_LINE,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:       'text',
              }}
            >
              Servicios
            </p>
            <ul className="space-y-3">
              {SERVICES.map(({ label, to }) => (
                <FooterLink key={to} to={to} label={label} />
              ))}
            </ul>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>© 2026 InsightA. Todos los derechos reservados.</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>312 345 6789 · Lun–Vie 9am–5pm</p>
        </div>
      </div>
    </footer>
  )
}
