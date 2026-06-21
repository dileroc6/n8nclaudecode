// admin.jsx — Dashboard del super admin: empresas + usuarios de todo ToqueFlow.

const sb = TF_AUTH.sb;

const ROLE_LABEL = { super_admin: 'Super admin', member: 'Usuario' };
const ROLE_ORDER = ['super_admin', 'member'];

function initials(name) {
  return (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}
function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Topbar propio del admin ───────────────────────────────────────────────────
function AdminTopbar({ profile }) {
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
        <a href="index.html" className="dash-tf-logo"><img src="assets/toqueflow-logo.png" alt="ToqueFlow" /></a>
        <span className="dash-vdivider"></span>
        <span className="admin-badge">★ consola admin</span>
      </div>
      <div className="dash-actions">
        <div className={`dash-profile ${menu ? 'open' : ''}`} ref={ref}>
          <button type="button" className="dash-profile-btn" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); }}>
            <span className="dash-avatar">{initials(profile.full_name)}</span>
            <span className="dash-profile-meta">
              <b>{profile.full_name || profile.email}</b>
              <span>Super admin</span>
            </span>
            <svg className="dash-profile-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          <div className="dash-profile-menu">
            <div className="dash-profile-head">
              <span className="dash-avatar lg">{initials(profile.full_name)}</span>
              <div><b>{profile.full_name || profile.email}</b><span>{profile.email}</span></div>
            </div>
            <a href="admin.html" className="dash-profile-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> Paneles de clientes</a>
            <button type="button" className="dash-profile-item danger" onClick={() => TF_AUTH.signOut()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg> Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Modal genérico ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-head">
          <h3>{title}</h3>
          <button type="button" className="fd-close" onClick={onClose} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Modales de acciones de usuario (editar nombre, confirmar, enlace) ─────────
function EditNameModal({ user, onClose, onSaved }) {
  const [name, setName] = React.useState(user.full_name || '');
  const [busy, setBusy] = React.useState(false);
  const save = async (e) => { e.preventDefault(); const v = name.trim(); if (!v) return; setBusy(true); try { await onSaved(user, v); } finally { setBusy(false); onClose(); } };
  return (
    <Modal title="Editar nombre" onClose={onClose}>
      <form className="adm-form" onSubmit={save}>
        <div className="form-field"><label>nombre de {user.email}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido" autoFocus /></div>
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
function ConfirmModal({ title, message, confirmLabel, danger, onClose, onConfirm }) {
  const [busy, setBusy] = React.useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); onClose(); } };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="adm-form">
        <p className="adm-hint" style={{ fontSize: 13.5, color: 'var(--ink)' }}>{message}</p>
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" disabled={busy} style={danger ? { background: '#c0392b', borderColor: '#c0392b' } : undefined} onClick={go}>{busy ? '…' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
function RecoveryModal({ email, link, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {} };
  return (
    <Modal title="Enlace de recuperación" onClose={onClose}>
      <div className="adm-form">
        <p className="adm-hint" style={{ fontSize: 13.5, color: 'var(--ink)' }}>Envíale este enlace a <b>{email}</b> para que ponga una nueva contraseña (caduca pronto).</p>
        <div className="form-field"><label>enlace</label>
          <input type="text" readOnly value={link} onFocus={(e) => e.target.select()} /></div>
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn btn-primary" onClick={copy}>{copied ? '✓ Copiado' : 'Copiar enlace'}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Modal: crear empresa ──────────────────────────────────────────────────────
function CompanyModal({ onClose, onSaved }) {
  const [f, setF] = React.useState({ name: '', city: '' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setErr('El nombre es obligatorio.'); return; }
    setBusy(true); setErr('');
    const { data, error } = await sb.from('companies')
      .insert({ name: f.name.trim(), city: f.city.trim() || null, slug: slugify(f.name) })
      .select().single();
    setBusy(false);
    if (error) { setErr(error.message); return; }
    onSaved(data);
  };

  return (
    <Modal title="Nueva empresa" onClose={onClose}>
      <form className="adm-form" onSubmit={save}>
        <div className="form-field"><label>nombre de la empresa</label>
          <input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="FerreteríaYa" autoFocus /></div>
        <div className="form-field"><label>ciudad principal (opcional)</label>
          <input type="text" value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Bogotá · Colombia" /></div>
        <p className="adm-hint">La empresa es una sola. Sus sucursales (Bogotá, Medellín…) se agregan después como <b>sedes</b>, desde el botón "Sedes" de la empresa.</p>
        {err && <div className="login-notice error">{err}</div>}
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear empresa'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: crear usuario ──────────────────────────────────────────────────────
function UserModal({ companies, onClose, onSaved }) {
  const [f, setF] = React.useState({ full_name: '', email: '', password: '', company_id: '', role: 'member' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!f.email.trim() || f.password.length < 6) { setErr('Correo válido y contraseña de al menos 6 caracteres.'); return; }
    setBusy(true); setErr('');

    // 1) Crea la cuenta en Auth con un cliente efímero (no toca tu sesión).
    const temp = TF_AUTH.tempClient();
    const { data: signRes, error: signErr } = await temp.auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: { data: { full_name: f.full_name.trim() } },
    });
    await temp.auth.signOut();

    if (signErr) { setBusy(false); setErr(signErr.message); return; }
    const uid = signRes.user && signRes.user.id;
    if (!uid) { setBusy(false); setErr('No se pudo crear el usuario (¿correo ya registrado?).'); return; }

    // 2) Como super admin, fija empresa + rol del profile recién creado.
    const { error: upErr } = await sb.from('profiles').upsert({
      id: uid,
      email: f.email.trim(),
      full_name: f.full_name.trim() || f.email.trim().split('@')[0],
      company_id: f.company_id || null,
      role: f.role,
      status: 'active',
    }, { onConflict: 'id' });

    setBusy(false);
    if (upErr) { setErr('Cuenta creada, pero falló asignar rol/empresa: ' + upErr.message); return; }
    onSaved();
  };

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form className="adm-form" onSubmit={save}>
        <div className="form-field"><label>nombre completo</label>
          <input type="text" value={f.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Ana Gómez" autoFocus /></div>
        <div className="form-field"><label>correo</label>
          <input type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="ana@empresa.com" autoComplete="off" /></div>
        <div className="form-field"><label>contraseña temporal</label>
          <input type="text" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="mínimo 6 caracteres" autoComplete="off" /></div>
        <div className="adm-form-row">
          <div className="form-field"><label>empresa</label>
            <select value={f.company_id} onChange={(e) => set('company_id', e.target.value)}>
              <option value="">— sin empresa —</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="form-field"><label>rol</label>
            <select value={f.role} onChange={(e) => set('role', e.target.value)}>
              <option value="member">Usuario</option>
              <option value="super_admin">Super admin</option>
            </select></div>
        </div>
        <p className="adm-hint">El usuario entra con esta contraseña y la puede cambiar luego. Requiere que en Supabase la confirmación por correo esté desactivada.</p>
        {err && <div className="login-notice error">{err}</div>}
        <div className="adm-form-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Creando…' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Modal: gestionar sedes de una empresa ────────────────────────────────────
function SedesModal({ company, onClose, onChanged }) {
  const [list, setList] = React.useState(null); // null = cargando
  const [f, setF] = React.useState({ name: '', city: '' });
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));

  const load = React.useCallback(async () => {
    const { data } = await sb.from('sedes').select('*').eq('company_id', company.id).order('created_at', { ascending: true });
    setList(data || []);
  }, [company.id]);
  React.useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setErr('Ponle un nombre a la sede.'); return; }
    setBusy(true); setErr('');
    const { error } = await sb.from('sedes').insert({ company_id: company.id, name: f.name.trim(), city: f.city.trim() || null });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setF({ name: '', city: '' });
    await load(); onChanged && onChanged();
  };
  const toggle = async (s) => {
    const status = s.status === 'active' ? 'paused' : 'active';
    await sb.from('sedes').update({ status }).eq('id', s.id);
    await load(); onChanged && onChanged();
  };
  const del = async (s) => {
    await sb.from('sedes').delete().eq('id', s.id);
    await load(); onChanged && onChanged();
  };

  return (
    <Modal title={'Sedes de ' + company.name} onClose={onClose}>
      <div className="adm-sedes">
        {list === null && <div className="admin-empty">Cargando…</div>}
        {list && list.length === 0 && <div className="admin-empty">Esta empresa aún no tiene sedes.</div>}
        {list && list.map((s) => (
          <div key={s.id} className={`adm-sede-row ${s.status !== 'active' ? 'is-off' : ''}`}>
            <span className="sede-ic sm">{(s.name || '?').replace(/^sede\s+/i, '').slice(0, 1).toUpperCase()}</span>
            <div className="adm-sede-meta"><b>{s.name}</b><span>{s.city || 'sin ciudad'}</span></div>
            <span className={`flow-status ${s.status === 'active' ? 'on' : 'off'}`}><span className="flow-status-dot"></span>{s.status === 'active' ? 'activa' : 'pausada'}</span>
            <button type="button" className="admin-link" onClick={() => toggle(s)}>{s.status === 'active' ? 'Pausar' : 'Activar'}</button>
            <button type="button" className="admin-link danger" onClick={() => del(s)}>Borrar</button>
          </div>
        ))}
      </div>
      <form className="adm-form adm-sede-add" onSubmit={add}>
        <div className="adm-form-row">
          <div className="form-field"><label>nueva sede</label><input type="text" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Sede Bogotá" /></div>
          <div className="form-field"><label>ciudad</label><input type="text" value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Bogotá · Cundinamarca" /></div>
        </div>
        {err && <div className="login-notice error">{err}</div>}
        <div className="adm-form-foot">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Agregando…' : '+ Agregar sede'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
function AdminApp({ profile }) {
  const [tab, setTab] = React.useState('empresas');
  const [companies, setCompanies] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [sedes, setSedes] = React.useState([]);
  const [usage, setUsage] = React.useState([]);
  const [flows, setFlows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [modal, setModal] = React.useState(null); // 'company' | 'user' | null
  const [editU, setEditU] = React.useState(null);  // usuario a renombrar
  const [delU, setDelU] = React.useState(null);     // usuario a eliminar (confirm)
  const [recov, setRecov] = React.useState(null);   // { email, link }
  const [toast, setToast] = React.useState(null);   // { type, text }
  const [sedesOf, setSedesOf] = React.useState(null); // company para el modal de sedes
  const [companyFilter, setCompanyFilter] = React.useState('todas');
  const [consumoCo, setConsumoCo] = React.useState('todas');

  React.useEffect(() => { applyDefaultTokens(); }, []);

  const reload = React.useCallback(async () => {
    setLoading(true);
    const [c, u, s, ai, fl] = await Promise.all([
      sb.from('companies').select('*').order('created_at', { ascending: true }),
      sb.from('profiles').select('*, company:companies(name)').order('created_at', { ascending: true }),
      sb.from('sedes').select('*').order('created_at', { ascending: true }),
      sb.from('ai_usage').select('*'),
      sb.from('flows').select('id, company_id'),
    ]);
    setCompanies(c.data || []);
    setUsers(u.data || []);
    setSedes(s.data || []);
    setUsage(ai.data || []);
    setFlows(fl.data || []);
    setLoading(false);
  }, []);

  React.useEffect(() => { reload(); }, [reload]);

  const usersByCompany = (cid) => users.filter((u) => u.company_id === cid).length;
  const sedesByCompany = (cid) => sedes.filter((s) => s.company_id === cid).length;
  const flowsByCompany = (cid) => flows.filter((f) => f.company_id === cid).length;

  const setRole = async (u, role) => {
    setUsers((us) => us.map((x) => x.id === u.id ? { ...x, role } : x));
    await sb.from('profiles').update({ role }).eq('id', u.id);
  };
  const updateName = async (u, full_name) => {
    setUsers((us) => us.map((x) => x.id === u.id ? { ...x, full_name } : x));
    await sb.from('profiles').update({ full_name }).eq('id', u.id);
  };
  // Acciones que necesitan service_role -> Edge Function admin-users (verifica super_admin).
  const callAdminFn = async (action, payload) => {
    const token = (await sb.auth.getSession()).data.session.access_token;
    const r = await fetch((window.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/admin-users', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, apikey: window.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    return { ok: r.ok, body: await r.json().catch(() => ({})) };
  };
  const doDelete = async (u) => {
    const { ok, body } = await callAdminFn('delete', { userId: u.id });
    if (!ok || body.error) { setToast({ type: 'error', text: 'No se pudo eliminar: ' + (body.error || 'error') }); return; }
    setUsers((us) => us.filter((x) => x.id !== u.id));
    setToast({ type: 'ok', text: u.email + ' eliminado.' });
  };
  const genRecovery = async (u) => {
    const { ok, body } = await callAdminFn('reset-link', { email: u.email });
    if (!ok || !body.link) { setToast({ type: 'error', text: 'No se pudo generar el enlace: ' + (body.error || 'error') }); return; }
    setRecov({ email: u.email, link: body.link });
  };
  const toggleUser = async (u) => {
    const status = u.status === 'active' ? 'disabled' : 'active';
    setUsers((us) => us.map((x) => x.id === u.id ? { ...x, status } : x));
    await sb.from('profiles').update({ status }).eq('id', u.id);
  };
  const setUserCompany = async (u, company_id) => {
    setUsers((us) => us.map((x) => x.id === u.id ? { ...x, company_id: company_id || null } : x));
    await sb.from('profiles').update({ company_id: company_id || null }).eq('id', u.id);
  };
  const toggleCompany = async (c) => {
    const status = c.status === 'active' ? 'paused' : 'active';
    setCompanies((cs) => cs.map((x) => x.id === c.id ? { ...x, status } : x));
    await sb.from('companies').update({ status }).eq('id', c.id);
  };

  const shownUsers = companyFilter === 'todas'
    ? users
    : companyFilter === 'sin'
      ? users.filter((u) => !u.company_id)
      : users.filter((u) => u.company_id === companyFilter);

  const overview = [
    { n: String(companies.length), l: 'empresas' },
    { n: String(users.length), l: 'usuarios' },
    { n: String(users.filter((u) => u.status === 'active').length), l: 'activos' },
    { n: String(users.filter((u) => u.role === 'super_admin').length), l: 'super admins' },
  ];

  return (
    <div className="dash">
      <AdminTopbar profile={profile} />
      <main className="dash-main">
        <div className="dash-head">
          <div>
            <div className="eyebrow">consola de ToqueFlow</div>
            <h1 className="dash-greeting">Hola, {(profile.full_name || 'admin').split(' ')[0]}.</h1>
            <p className="dash-greeting-sub">Gestiona <span className="hl">todas las empresas y usuarios</span> de la plataforma.</p>
          </div>
        </div>

        <div className="dash-overview">
          {overview.map((o, i) => (
            <div key={i} className="dash-ov"><div className="dash-ov-n">{o.n}</div><div className="dash-ov-l">{o.l}</div></div>
          ))}
        </div>

        <div className="admin-tabs">
          <button type="button" className={`admin-tab ${tab === 'empresas' ? 'is-active' : ''}`} onClick={() => setTab('empresas')}>Empresas</button>
          <button type="button" className={`admin-tab ${tab === 'usuarios' ? 'is-active' : ''}`} onClick={() => setTab('usuarios')}>Usuarios</button>
          <button type="button" className={`admin-tab ${tab === 'consumo' ? 'is-active' : ''}`} onClick={() => setTab('consumo')}>Consumo IA</button>
          <div className="admin-tabs-spacer"></div>
          {tab === 'empresas' && <button type="button" className="btn btn-primary admin-add" onClick={() => setModal('company')}>+ Nueva empresa</button>}
          {tab === 'usuarios' && <button type="button" className="btn btn-primary admin-add" onClick={() => setModal('user')}>+ Nuevo usuario</button>}
        </div>

        {loading && <div className="admin-empty">Cargando…</div>}

        {!loading && tab === 'empresas' && (
          <div className="admin-cards">
            {companies.length === 0 && <div className="admin-empty">Aún no hay empresas. Crea la primera.</div>}
            {companies.map((c) => (
              <article key={c.id} className="admin-co-card">
                <div className="admin-co-top">
                  {c.logo_url
                    ? <img className="admin-co-logo" src={c.logo_url} alt={c.name} />
                    : <span className="admin-co-logo admin-co-logo-fallback">{initials(c.name)}</span>}
                  <div className="admin-co-meta">
                    <b>{c.name}</b>
                  </div>
                  <span className={`flow-status ${c.status === 'active' ? 'on' : 'off'}`}><span className="flow-status-dot"></span>{c.status === 'active' ? 'activa' : 'pausada'}</span>
                </div>
                <div className="admin-co-stats">
                  <div><b>{usersByCompany(c.id)}</b><span>usuarios</span></div>
                  <div><b>{flowsByCompany(c.id)}</b><span>flows creados</span></div>
                  <div><b>{fmtDate(c.created_at)}</b><span>creada</span></div>
                </div>
                <div className="admin-co-foot">
                  <a className="admin-co-btn primary" href={'dashboard.html?empresa=' + c.id}>Entrar al panel →</a>
                  <button type="button" className="admin-co-btn" onClick={() => { setCompanyFilter(c.id); setTab('usuarios'); }}>Usuarios</button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && tab === 'usuarios' && (
          <div>
            <div className="admin-filters">
              <span className="admin-filter-label">// filtrar por empresa</span>
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="todas">Todas las empresas</option>
                <option value="sin">Sin empresa</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Usuario</th><th>Empresa</th><th>Rol</th><th>Alta</th><th>Último acceso</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {shownUsers.length === 0 && <tr><td colSpan="7" className="admin-empty">Sin usuarios en este filtro.</td></tr>}
                  {shownUsers.map((u) => {
                    const me = u.id === profile.id;
                    return (
                      <tr key={u.id} className={u.status === 'disabled' ? 'is-off' : ''}>
                        <td>
                          <div className="admin-user-cell">
                            <span className="dash-avatar sm">{initials(u.full_name || u.email)}</span>
                            <div><b>{u.full_name || '—'}</b><span>{u.email}</span></div>
                          </div>
                        </td>
                        <td>
                          <select className="admin-mini-select" value={u.company_id || ''} onChange={(e) => setUserCompany(u, e.target.value)}>
                            <option value="">— sin empresa —</option>
                            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td>
                          <select className={`admin-mini-select role-${u.role}`} value={u.role} disabled={me}
                                  onChange={(e) => setRole(u, e.target.value)}>
                            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                        </td>
                        <td className="admin-dim">{fmtDate(u.created_at)}</td>
                        <td className="admin-dim">{fmtDate(u.last_sign_in_at)}</td>
                        <td><span className={`flow-status ${u.status === 'active' ? 'on' : 'off'}`}><span className="flow-status-dot"></span>{u.status === 'active' ? 'activo' : 'inactivo'}</span></td>
                        <td className="admin-row-actions">
                          <button type="button" className="admin-icon-btn" title="Editar nombre" onClick={() => setEditU(u)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
                          </button>
                          <button type="button" className="admin-icon-btn" title="Enviar enlace de recuperación" onClick={() => genRecovery(u)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="15" r="4"/><path d="M11 12l8-8m-3 0h3v3m-3 2l2 2"/></svg>
                          </button>
                          {!me && <button type="button" className="admin-icon-btn" title={u.status === 'active' ? 'Desactivar' : 'Activar'} onClick={() => toggleUser(u)}>
                            {u.status === 'active'
                              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 5l12 7-12 7z"/></svg>}
                          </button>}
                          {!me && <button type="button" className="admin-icon-btn danger" title="Eliminar" onClick={() => setDelU(u)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
                          </button>}
                          {me && <span className="admin-dim">tú</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && tab === 'consumo' && (() => {
          const fmtUsd = (n) => '$' + Number(n).toFixed(n < 1 ? 4 : 2);
          const fmtDT = (ts) => { if (!ts) return '—'; return new Date(ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); };
          const TOOL_LABEL = { 'rappi-print': 'Impresión Rappi' };
          const sedeLabel = (s) => s === 'bogota' ? 'Bogotá' : s === 'medellin' ? 'Medellín' : (s || '—');
          const coName = (id) => { const c = companies.find((x) => x.id === id); return c ? c.name : '(sin empresa)'; };
          const toolName = (r) => (TOOL_LABEL[r.tool] || r.tool || '—') + (r.sede ? ' · ' + sedeLabel(r.sede) : '');

          const filtered = consumoCo === 'todas' ? usage : usage.filter((u) => u.company_id === consumoCo);
          const totIn = filtered.reduce((a, u) => a + (u.input_tokens || 0), 0);
          const totOut = filtered.reduce((a, u) => a + (u.output_tokens || 0), 0);
          const totUsd = filtered.reduce((a, u) => a + Number(u.cost_usd || 0), 0);

          const byCo = {};
          filtered.forEach((u) => {
            const cid = u.company_id || '—';
            byCo[cid] = byCo[cid] || { company: u.company_id, tools: {}, calls: 0, in: 0, out: 0, usd: 0 };
            const tk = (u.tool || '') + '|' + (u.sede || '');
            const t = byCo[cid].tools[tk] = byCo[cid].tools[tk] || { tool: u.tool, sede: u.sede, calls: 0, in: 0, out: 0, usd: 0, last: 0 };
            const ts = u.created_at ? +new Date(u.created_at) : 0;
            t.calls++; t.in += u.input_tokens || 0; t.out += u.output_tokens || 0; t.usd += Number(u.cost_usd || 0); if (ts > t.last) t.last = ts;
            byCo[cid].calls++; byCo[cid].in += u.input_tokens || 0; byCo[cid].out += u.output_tokens || 0; byCo[cid].usd += Number(u.cost_usd || 0); if (ts > (byCo[cid].last || 0)) byCo[cid].last = ts;
          });
          const groups = Object.values(byCo).sort((a, b) => b.usd - a.usd);

          return (
            <div>
              <div className="admin-filters">
                <span className="admin-filter-label">// filtrar por empresa</span>
                <select value={consumoCo} onChange={(e) => setConsumoCo(e.target.value)}>
                  <option value="todas">Todas las empresas</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="dash-overview">
                <div className="dash-ov"><div className="dash-ov-n">{filtered.length}</div><div className="dash-ov-l">pedidos IA</div></div>
                <div className="dash-ov"><div className="dash-ov-n">{(totIn + totOut).toLocaleString('es-CO')}</div><div className="dash-ov-l">tokens</div></div>
                <div className="dash-ov"><div className="dash-ov-n">{fmtUsd(totUsd)}</div><div className="dash-ov-l">costo USD</div></div>
                <div className="dash-ov"><div className="dash-ov-n">{filtered.length ? fmtUsd(totUsd / filtered.length) : '$0'}</div><div className="dash-ov-l">costo x pedido</div></div>
              </div>
              <div className="admin-table-wrap" style={{ marginTop: 18 }}>
                <table className="admin-table">
                  <thead><tr><th>Empresa</th><th>Herramienta</th><th>Última</th><th>Pedidos</th><th>Tokens entrada</th><th>Tokens salida</th><th>Costo USD</th></tr></thead>
                  <tbody>
                    {groups.length === 0 && <tr><td colSpan="7" className="admin-empty">Aún no hay consumo registrado. Genera un recibo para verlo aquí.</td></tr>}
                    {groups.map((g) => {
                      const tools = Object.values(g.tools).sort((a, b) => b.usd - a.usd);
                      return (
                        <React.Fragment key={g.company || 'none'}>
                          {tools.map((t, i) => (
                            <tr key={(g.company || 'none') + i}>
                              <td>{i === 0 ? coName(g.company) : ''}</td>
                              <td>{toolName(t)}</td>
                              <td className="admin-dim">{fmtDT(t.last)}</td>
                              <td>{t.calls}</td>
                              <td className="admin-dim">{t.in.toLocaleString('es-CO')}</td>
                              <td className="admin-dim">{t.out.toLocaleString('es-CO')}</td>
                              <td><b>{fmtUsd(t.usd)}</b></td>
                            </tr>
                          ))}
                          <tr className="admin-subtotal">
                            <td></td><td><b>Total {coName(g.company)}</b></td>
                            <td className="admin-dim">{fmtDT(g.last)}</td>
                            <td><b>{g.calls}</b></td>
                            <td className="admin-dim">{g.in.toLocaleString('es-CO')}</td>
                            <td className="admin-dim">{g.out.toLocaleString('es-CO')}</td>
                            <td><b>{fmtUsd(g.usd)}</b></td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--mute)' }}>// precio Claude Haiku 4.5 aprox: $1/M tokens entrada · $5/M salida (ajustable en la función)</p>
            </div>
          );
        })()}
      </main>

      {modal === 'company' && <CompanyModal onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {modal === 'user' && <UserModal companies={companies} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {sedesOf && <SedesModal company={sedesOf} onClose={() => setSedesOf(null)} onChanged={reload} />}
      {editU && <EditNameModal user={editU} onClose={() => setEditU(null)} onSaved={updateName} />}
      {delU && <ConfirmModal title="Eliminar usuario" danger confirmLabel="Eliminar" message={'¿Eliminar a ' + delU.email + '? Se borra su cuenta de forma permanente.'} onClose={() => setDelU(null)} onConfirm={() => doDelete(delU)} />}
      {recov && <RecoveryModal email={recov.email} link={recov.link} onClose={() => setRecov(null)} />}
      {toast && <div className={'admin-toast ' + (toast.type || '')} onClick={() => setToast(null)}>{toast.text}</div>}
    </div>
  );
}

// Guard: solo super_admin. Luego renderiza.
TF_AUTH.guard({ roles: ['super_admin'] }).then((profile) => {
  if (!profile) return; // el guard ya redirigió
  ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp profile={profile} />);
});
