// login.jsx — ToqueFlow login page

function LoginBrandPanel() {
  return (
    <div className="login-brand">
      <img className="login-brand-photo" src="assets/img/portrait-light.jpg" alt="" aria-hidden="true" />
      <div className="login-brand-tint"></div>
      <div className="bp-grid" style={{ opacity: .4 }}></div>
      <div className="glow" style={{ left: '-160px', bottom: '-180px', opacity: .4 }}></div>

      <div className="login-brand-top">
        <a href="index.html" className="login-logo">
          <img src="assets/toqueflow-logo.png" alt="ToqueFlow" />
        </a>
        <span className="hud-tag no-dot">v.26 · panel</span>
      </div>

      <div className="login-brand-body">
        <h2>
          Tu negocio<br/>
          ya está trabajando.<br/>
          <span className="hl">Entra a verlo.</span>
        </h2>
        <ul className="login-brand-list">
          <li><span className="lb-dot"></span> Conversaciones y leads en tiempo real</li>
          <li><span className="lb-dot"></span> Seguimientos corriendo solos</li>
          <li><span className="lb-dot"></span> Tus métricas, en un solo lugar</li>
        </ul>
      </div>

      <div className="login-brand-foot">
        <span>// flow.system</span>
        <span className="login-status">● online</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const [data, setData] = React.useState({ correo: '', pass: '' });
  const [show, setShow] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [state, setState] = React.useState('idle'); // idle | loading | done
  const [error, setError] = React.useState('');
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  // Mensajes que llegan por querystring desde el guard.
  const params = new URLSearchParams(window.location.search);
  const notConfigured = params.get('setup') === '1' || !TF_AUTH.configured;
  const wasDisabled = params.get('disabled') === '1';

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    setError('');

    if (notConfigured) {
      setError('Supabase aún no está configurado. Edita supabase-config.js con tu URL y anon key.');
      return;
    }

    setState('loading');
    const { data: res, error: err } = await TF_AUTH.sb.auth.signInWithPassword({
      email: data.correo.trim(),
      password: data.pass,
    });

    if (err) {
      setState('idle');
      setError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message);
      return;
    }

    // Trae el rol para decidir a dónde entra.
    const prof = (await TF_AUTH.sb.from('profiles').select('role, status').eq('id', res.user.id).single()).data;

    if (prof && prof.status === 'disabled') {
      await TF_AUTH.sb.auth.signOut();
      setState('idle');
      setError('Tu cuenta está desactivada. Contacta al administrador.');
      return;
    }

    setState('done');
    const dest = prof && prof.role === 'super_admin' ? 'admin.html' : 'dashboard.html';
    setTimeout(() => window.location.replace(dest), 500);
  };

  return (
    <div className="login-panel">
      <div className="login-card">
        <div className="login-mobile-logo">
          <a href="index.html"><img src="assets/toqueflow-logo.png" alt="ToqueFlow" /></a>
        </div>

        <div className="eyebrow">acceso a tu panel</div>
        <h1 className="login-title">Inicia sesión.</h1>
        <p className="login-sub">Entra para ver cómo está fluyendo tu negocio ahora mismo.</p>

        {notConfigured && (
          <div className="login-notice warn">
            Falta configurar Supabase. Edita <b>supabase-config.js</b> con tu URL y anon key.
          </div>
        )}
        {wasDisabled && !notConfigured && (
          <div className="login-notice warn">Tu sesión se cerró: la cuenta está desactivada.</div>
        )}
        {error && <div className="login-notice error">{error}</div>}

        <form className="login-form" onSubmit={submit}>
          <div className="form-field">
            <label>correo</label>
            <input
              type="email"
              value={data.correo}
              onChange={(e) => set('correo', e.target.value)}
              placeholder="ana@empresa.com"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <div className="login-label-row">
              <label>contraseña</label>
              <a href="#" className="login-forgot">¿la olvidaste?</a>
            </div>
            <div className="login-pass">
              <input
                type={show ? 'text' : 'password'}
                value={data.pass}
                onChange={(e) => set('pass', e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" className="login-eye" onClick={() => setShow((s) => !s)} aria-label="Mostrar contraseña">
                {show
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-2.2 3.1M6.1 6.1C3.8 7.5 2.3 9.7 2 12c1 2.5 5 7 10 7a9.7 9.7 0 0 0 3.3-.6"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          <label className="login-remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="login-check"></span>
            Mantener sesión iniciada
          </label>

          <button type="submit" className={`btn btn-primary login-submit ${state}`}>
            {state === 'idle' && <>Entrar a mi Flow <span className="arrow">→</span></>}
            {state === 'loading' && <span className="login-spinner"></span>}
            {state === 'done' && <>✓ Bienvenido</>}
          </button>

          <div className="login-divider"><span>o continúa con</span></div>

          <div className="login-social">
            <button type="button" className="login-social-btn">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.3h4.6c-.2 1.2-1.5 3.5-4.6 3.5-2.8 0-5-2.3-5-5.1s2.2-5.1 5-5.1c1.6 0 2.6.7 3.2 1.2l2.2-2.1C16 4.9 14.2 4 12 4 7.6 4 4 7.6 4 12s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5 0-.9-.1-1.2H12z"/></svg>
              Continuar con Google
            </button>
          </div>
        </form>

        <p className="login-foot">
          ¿Todavía no tienes cuenta? <a href="contacto.html">Activa tu Flow →</a>
        </p>
      </div>
    </div>
  );
}

// Pantalla "nueva contraseña": aparece cuando se entra por un enlace de
// recuperación (Supabase pone #type=recovery en la URL y deja una sesión temporal).
function RecoveryForm() {
  const [pass, setPass] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [state, setState] = React.useState('idle'); // idle | loading | done
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'loading') return;
    if (pass.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setState('loading'); setError('');
    const { error: err } = await TF_AUTH.sb.auth.updateUser({ password: pass });
    if (err) { setState('idle'); setError(err.message || 'No se pudo cambiar. El enlace pudo expirar; pide otro.'); return; }
    setState('done');
    const ctx = await TF_AUTH.load();
    const dest = ctx && ctx.profile && ctx.profile.role === 'super_admin' ? 'admin.html' : 'dashboard.html';
    setTimeout(() => { try { history.replaceState(null, '', 'login.html'); } catch (e) {} window.location.replace(dest); }, 700);
  };

  return (
    <div className="login-panel">
      <div className="login-card">
        <div className="login-mobile-logo"><a href="index.html"><img src="assets/toqueflow-logo.png" alt="ToqueFlow" /></a></div>
        <div className="eyebrow">recuperar acceso</div>
        <h1 className="login-title">Nueva contraseña.</h1>
        <p className="login-sub">Escribe tu nueva contraseña para entrar a tu panel.</p>
        {error && <div className="login-notice error">{error}</div>}
        <form className="login-form" onSubmit={submit}>
          <div className="form-field">
            <label>nueva contraseña</label>
            <div className="login-pass">
              <input type={show ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 6 caracteres" autoComplete="new-password" autoFocus />
              <button type="button" className="login-eye" onClick={() => setShow((s) => !s)} aria-label="Mostrar contraseña">
                {show
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-2.2 3.1M6.1 6.1C3.8 7.5 2.3 9.7 2 12c1 2.5 5 7 10 7a9.7 9.7 0 0 0 3.3-.6"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>
          <button type="submit" className={`btn btn-primary login-submit ${state}`}>
            {state === 'idle' && <>Guardar y entrar <span className="arrow">→</span></>}
            {state === 'loading' && <span className="login-spinner"></span>}
            {state === 'done' && <>✓ Listo</>}
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginApp() {
  const isRecovery = ((window.location.hash || '') + (window.location.search || '')).indexOf('type=recovery') !== -1;
  React.useEffect(() => {
    applyDefaultTokens();
    if (isRecovery) return; // recovery: NO redirigir; mostrar el form de nueva contraseña
    // Si ya hay sesión activa, salta directo al panel que corresponde.
    (async () => {
      const ctx = await TF_AUTH.load();
      if (ctx && ctx.profile && ctx.profile.status !== 'disabled') {
        window.location.replace(ctx.profile.role === 'super_admin' ? 'admin.html' : 'dashboard.html');
      }
    })();
  }, []);
  return (
    <div className="login-shell">
      <LoginBrandPanel />
      {isRecovery ? <RecoveryForm /> : <LoginForm />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LoginApp />);
