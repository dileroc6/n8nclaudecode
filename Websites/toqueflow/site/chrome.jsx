// chrome.jsx — Shared Nav, Footer, and default tokens for all pages.

// Auto-detect path depth so the same Nav/Footer works from root and subdirs.
// Just check if the current URL is inside a known subdir.
const BASE = (() => {
  const path = window.location.pathname;
  if (/\/servicios\/[^/]+$/.test(path)) return '../';
  return '';
})();
const $ = (p) => BASE + p;

// Applies the page-wide design tokens (mode, density, font, etc.) without
// the Tweaks panel. Used on inner pages where we want consistency without
// the live editor.
function applyDefaultTokens() {
  const root = document.documentElement;
  root.setAttribute('data-mode', 'mixed');
  root.setAttribute('data-hero', 'particles');
  root.setAttribute('data-bg-tone', 'standard');
  root.setAttribute('data-card-style', 'lines');
  root.setAttribute('data-density', 'regular');
  root.style.setProperty('--sans', '"Manrope", ui-sans-serif, system-ui, sans-serif');
}

function Nav({ active }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const dropRef = React.useRef(null);

  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', on);
    return () => window.removeEventListener('scroll', on);
  }, []);

  React.useEffect(() => {
    const onDoc = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const linkCls = (key) => `nav-link ${active === key ? 'is-active' : ''}`;

  return (
    <>
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href={$('index.html')} className="nav-logo">
          <img src={$('assets/toqueflow-logo.png')} alt="ToqueFlow" />
        </a>
        <div className="nav-links">
          <a href={$('index.html')} className={linkCls('inicio')}>Inicio</a>
          <div className={`nav-drop ${menuOpen ? 'open' : ''}`} ref={dropRef}>
            <button
              type="button"
              className="nav-link nav-drop-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              aria-expanded={menuOpen}
            >
              Servicios <span className="chev">↓</span>
            </button>
            <div className="nav-drop-menu">
              <a className="nav-drop-item" href={$('servicios/agentes-virtuales.html')}>
                <span className="ndi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />
                  </svg>
                </span>
                <span>
                  <b>Agentes de IA</b>
                  <span>Atienden a tus clientes y a tu equipo</span>
                </span>
                <span className="nav-drop-arrow">→</span>
              </a>
              <a className="nav-drop-item" href={$('servicios/automatizacion.html')}>
                <span className="ndi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <span>
                  <b>Automatización de procesos</b>
                  <span>Facturación, inventario, tareas repetitivas</span>
                </span>
                <span className="nav-drop-arrow">→</span>
              </a>
              <a className="nav-drop-item" href={$('servicios/integraciones.html')}>
                <span className="ndi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
                    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
                  </svg>
                </span>
                <span>
                  <b>Integraciones & sistemas</b>
                  <span>Conectamos lo que ya usas</span>
                </span>
                <span className="nav-drop-arrow">→</span>
              </a>
              <a className="nav-drop-item" href={$('servicios/seguimiento-leads.html')}>
                <span className="ndi-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 6-6" />
                  </svg>
                </span>
                <span>
                  <b>Tableros & seguimiento</b>
                  <span>Métricas en vivo y leads que no se enfrían</span>
                </span>
                <span className="nav-drop-arrow">→</span>
              </a>
            </div>
          </div>
          <a href={$('nosotros.html')} className={linkCls('nosotros')}>Nosotros</a>
          <a href={$('blog.html')} className={linkCls('blog')}>Blog</a>
          <a href={$('contacto.html')} className={linkCls('contacto')}>Contacto</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href={$('login.html')} className="nav-login cta-desktop">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/></svg>
            Ingresar
          </a>
          <a href={$('contacto.html')} className="btn btn-primary cta-desktop" style={{ padding: '12px 18px', fontSize: 13.5 }}>
            Activar mi Flow <span className="arrow">→</span>
          </a>
          <button
            type="button"
            className="nav-burger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menú"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen
                ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></>
                : <><path d="M4 8h16" /><path d="M4 16h16" /></>
              }
            </svg>
          </button>
        </div>
      </div>
    </nav>
    <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.tagName === 'A') setMobileOpen(false);
    }}>
      <a href={$('index.html')}><span>Inicio</span><span>01</span></a>
      <a href="#"><span>Servicios</span><span>02</span></a>
      <a href={$('servicios/agentes-virtuales.html')} style={{ paddingLeft: 24, fontSize: 18, color: 'var(--mute)', borderBottom: 'none' }}>↳ Agentes de IA</a>
      <a href={$('servicios/automatizacion.html')} style={{ paddingLeft: 24, fontSize: 18, color: 'var(--mute)', borderBottom: 'none' }}>↳ Automatización de procesos</a>
      <a href={$('servicios/integraciones.html')} style={{ paddingLeft: 24, fontSize: 18, color: 'var(--mute)', borderBottom: 'none' }}>↳ Integraciones & sistemas</a>
      <a href={$('servicios/seguimiento-leads.html')} style={{ paddingLeft: 24, fontSize: 18, color: 'var(--mute)' }}>↳ Tableros & seguimiento</a>
      <a href={$('nosotros.html')}><span>Nosotros</span><span>03</span></a>
      <a href={$('blog.html')}><span>Blog</span><span>04</span></a>
      <a href={$('contacto.html')}><span>Contacto</span><span>05</span></a>
      <a href={$('login.html')} className="mm-login"><span>Ingresar</span><span>→</span></a>
      <a href={$('contacto.html')} className="btn btn-primary mm-cta" style={{ marginTop: 32, justifyContent: 'center', fontSize: 16 }}>
        Activar mi Flow →
      </a>
    </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="section section-dark footer" style={{ paddingTop: 100, paddingBottom: 40 }}>
      <div className="container">
        <div className="footer-grid">
          <div>
            <a href={$('index.html')} className="footer-brand">
              <img src={$('assets/toqueflow-logo.png')} alt="ToqueFlow" />
            </a>
            <p className="footer-tag">
              Automatizamos tu seguimiento de leads y operaciones internas. Cero tareas manuales, resultados inmediatos.
            </p>
          </div>
          <div>
            <h5>Servicios</h5>
            <ul>
              <li><a href={$('servicios/agentes-virtuales.html')}>Agentes de IA</a></li>
              <li><a href={$('servicios/automatizacion.html')}>Automatización de procesos</a></li>
              <li><a href={$('servicios/integraciones.html')}>Integraciones & sistemas</a></li>
              <li><a href={$('servicios/seguimiento-leads.html')}>Tableros & seguimiento</a></li>
            </ul>
          </div>
          <div>
            <h5>Empresa</h5>
            <ul>
              <li><a href={$('nosotros.html')}>Nosotros</a></li>
              <li><a href={$('blog.html')}>Blog</a></li>
              <li><a href={$('contacto.html')}>Contacto</a></li>
              <li><a href={$('contacto.html')}>Demo gratis</a></li>
            </ul>
          </div>
          <div>
            <h5>Contacto</h5>
            <ul>
              <li><a href="mailto:hola@toqueflow.com">hola@toqueflow.com</a></li>
              <li><a href="#">+57 320 555 0142</a></li>
              <li><a href="#">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ToqueFlow · todos los derechos reservados</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Nav, Footer, applyDefaultTokens });
