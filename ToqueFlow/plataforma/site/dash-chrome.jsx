// dash-chrome.jsx — Shared chrome for the internal panel (Topbar + brand)

const BRAND = { name: 'ToqueFlow', user: 'Invitado', role: 'Usuario', scope: 'member', initials: 'TF', isSuperAdmin: false };

// Rellena BRAND con los datos reales de la sesión (lo llama TF_AUTH.guard antes
// de renderizar). Se mutan las props del MISMO objeto para que los componentes
// que ya referencian BRAND lean los valores nuevos al pintar.
function hydrateBrand(profile, company) {
  if (!profile) return;
  const user = profile.full_name || profile.email || 'Usuario';
  const roleLabel = profile.role === 'super_admin' ? 'Super admin' : 'Usuario';
  Object.assign(BRAND, {
    name: (company && company.name) || 'ToqueFlow',
    logo: (company && company.logo_url) || null,
    user,
    role: roleLabel,
    // 'owner' = ve el selector de "todas las sedes" + filtro por sede de SU empresa.
    scope: 'owner',
    initials: user.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
    isSuperAdmin: profile.role === 'super_admin',
  });
}
window.hydrateBrand = hydrateBrand;

// ── Sedes (locations) — shared context across panel pages ────────────────
// Se llenan con las sedes reales de la empresa (TF_AUTH.guard → hydrateSedes).
// Son arrays/objetos mutados EN SITIO para que las referencias existentes los vean.
const SEDES = [];
const SEDE_NAME = {};
function hydrateSedes(list) {
  SEDES.length = 0;
  Object.keys(SEDE_NAME).forEach((k) => delete SEDE_NAME[k]);
  (list || []).forEach((s) => {
    const initials = (s.name || '?').replace(/^sede\s+/i, '').trim().slice(0, 1).toUpperCase() || 'S';
    SEDES.push({ id: s.id, name: s.name, city: s.city || '', initials });
    SEDE_NAME[s.id] = s.name;
  });
}
window.hydrateSedes = hydrateSedes;

let _activeSede = (typeof localStorage !== 'undefined' && localStorage.getItem('tf_sede')) || 'todas';
const _sedeListeners = new Set();
function setActiveSede(id) {
  _activeSede = id;
  try { localStorage.setItem('tf_sede', id); } catch (e) {}
  _sedeListeners.forEach((fn) => fn(id));
}
function useActiveSede() {
  const [s, setS] = React.useState(_activeSede);
  React.useEffect(() => {
    const fn = (id) => setS(id);
    _sedeListeners.add(fn);
    return () => _sedeListeners.delete(fn);
  }, []);
  return s;
}

function SedeSwitcher() {
  const active = useActiveSede();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, []);

  const owner = BRAND.scope === 'owner';
  const opts = owner && SEDES.length
    ? [{ id: 'todas', name: 'Todas las sedes', city: 'vista general', initials: '★' }, ...SEDES]
    : SEDES.slice();
  const cur = opts.find((o) => o.id === active) || opts[0]
    || { id: '', name: BRAND.name, city: 'sin sedes', initials: BRAND.initials };

  // Sin menú cuando hay 0 o 1 opción (chip estático con el nombre de la empresa).
  const locked = opts.length <= 1;

  return (
    <div className={`sede-switch ${open ? 'open' : ''} ${locked ? 'locked' : ''}`} ref={ref}>
      <button type="button" className="sede-switch-btn" disabled={locked}
              onClick={(e) => { e.stopPropagation(); if (!locked) setOpen((o) => !o); }}>
        <span className={`sede-ic ${cur.id === 'todas' ? 'all' : ''}`}>{cur.initials}</span>
        <span className="sede-meta">
          <b>{cur.name}</b>
          <span>{cur.city}</span>
        </span>
        {!locked && <svg className="sede-chev" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>}
      </button>
      <div className="sede-menu">
        <div className="sede-menu-tag">// cambiar de sede</div>
        {opts.map((o) => (
          <button key={o.id} type="button" className={`sede-item ${o.id === active ? 'is-active' : ''}`}
                  onClick={() => { setActiveSede(o.id); setOpen(false); }}>
            <span className={`sede-ic sm ${o.id === 'todas' ? 'all' : ''}`}>{o.initials}</span>
            <span className="sede-item-meta">
              <b>{o.name}</b>
              <span>{o.city}</span>
            </span>
            {o.id === active && <span className="sede-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function DashTopbar({ page }) {
  const [menu, setMenu] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener('click', on);
    return () => document.removeEventListener('click', on);
  }, []);
  return (
    <header className="dash-topbar">
      <div className="dash-left">
        <div className="dash-brands">
          {BRAND.logo
            ? <img className="dash-client-logo" src={BRAND.logo} alt={BRAND.name} style={{ objectFit: 'contain' }} />
            : <image-slot id="client-logo" class="dash-client-logo" shape="rounded" radius="10" placeholder="Tu logo"></image-slot>}
          <span className="dash-cobrand-x">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </span>
          <a href="index.html" className="dash-tf-logo">
            <img src="assets/toqueflow-logo.png" alt="ToqueFlow" />
          </a>
        </div>
        {SEDES.length > 0 && <span className="dash-vdivider"></span>}
        {SEDES.length > 0 && <SedeSwitcher />}
      </div>

      <nav className="dash-nav">
        <a href="index.html" className="dash-nav-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ marginRight: 7 }}><path d="M3 11l9-8 9 8M5 10v10h14V10" /></svg>
          Inicio
        </a>
        {!BRAND.isSuperAdmin && (
          <a href="dashboard.html" className={`dash-nav-link ${page === 'panel' ? 'is-active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ marginRight: 7 }}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
            Mis flows
          </a>
        )}
        {BRAND.isSuperAdmin && (
          <a href="admin.html" className={`dash-nav-link ${page === 'admin' ? 'is-active' : ''}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ marginRight: 7 }}><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" /></svg>
            Admin
          </a>
        )}
      </nav>

      <div className="dash-actions">
        <button type="button" className="dash-bell" aria-label="Notificaciones">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
          <span className="dash-bell-dot"></span>
        </button>
        <div className={`dash-profile ${menu ? 'open' : ''}`} ref={ref}>
          <button type="button" className="dash-profile-btn" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}>
            <span className="dash-avatar">{BRAND.initials}</span>
            <span className="dash-profile-meta">
              <b>{BRAND.user}</b>
              <span>{BRAND.role}</span>
            </span>
            <svg className="dash-profile-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div className="dash-profile-menu">
            <div className="dash-profile-head">
              <span className="dash-avatar lg">{BRAND.initials}</span>
              <div>
                <b>{BRAND.user}</b>
                <span>{BRAND.name}</span>
              </div>
            </div>
            <a href="perfil.html" className={`dash-profile-item ${page === 'perfil' ? 'is-active' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> Mi perfil</a>
            <a href="ajustes.html" className={`dash-profile-item ${page === 'ajustes' ? 'is-active' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L16.5 3h-4l-.4 2.3a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.3h4l.4-2.3a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z"/></svg> Ajustes</a>
            <button type="button" className="dash-profile-item danger" onClick={() => TF_AUTH.signOut()}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg> Cerrar sesión</button>
          </div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { BRAND, DashTopbar, SEDES, SEDE_NAME, useActiveSede, setActiveSede });
