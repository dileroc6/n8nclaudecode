// auth.js — Capa de autenticación de ToqueFlow sobre Supabase.
// Carga DESPUÉS de: supabase CDN + supabase-config.js, y ANTES de los .jsx.
// Expone window.TF_AUTH con el cliente y los helpers de sesión/roles.

(function () {
  var URL = window.SUPABASE_URL || '';
  var KEY = window.SUPABASE_ANON_KEY || '';
  var CONFIGURED = URL && KEY && URL.indexOf('TU-PROYECTO') === -1 && KEY !== 'TU_ANON_KEY';

  if (!CONFIGURED) {
    console.warn('[ToqueFlow] Supabase no está configurado. Edita supabase-config.js con tu URL y anon key.');
  }

  // Cliente principal (sesión persistente en este dispositivo).
  var sb = CONFIGURED
    ? window.supabase.createClient(URL, KEY, {
        auth: { storageKey: 'tf-auth', persistSession: true, autoRefreshToken: true },
      })
    : null;

  // Página de login (relativa a la raíz del sitio).
  var LOGIN = 'login.html';

  function go(page) { window.location.replace(page); }

  // Devuelve { session, profile, company } o null si no hay sesión.
  async function load() {
    if (!sb) return null;
    var s = (await sb.auth.getSession()).data.session;
    if (!s) return null;
    var prof = (await sb.from('profiles').select('*').eq('id', s.user.id).single()).data;
    var company = null;
    var sedes = [];
    if (prof && prof.company_id) {
      company = (await sb.from('companies').select('*').eq('id', prof.company_id).single()).data;
      sedes = (await sb.from('sedes').select('*').eq('company_id', prof.company_id)
        .eq('status', 'active').order('created_at', { ascending: true })).data || [];
    }
    return { session: s, profile: prof, company: company, sedes: sedes };
  }

  // Guard de página. Llama ANTES de renderizar.
  //   opts.roles  → array de roles permitidos (ej. ['super_admin'])
  // Si no hay sesión → manda a login. Si el rol no aplica → manda a su panel.
  // Devuelve el profile (con .company adjunto) cuando todo está OK.
  async function guard(opts) {
    opts = opts || {};
    if (!CONFIGURED) { go(LOGIN + '?setup=1'); return null; }

    var ctx = await load();
    if (!ctx || !ctx.profile) { go(LOGIN); return null; }

    if (ctx.profile.status === 'disabled') {
      await sb.auth.signOut();
      go(LOGIN + '?disabled=1');
      return null;
    }

    if (opts.roles && opts.roles.indexOf(ctx.profile.role) === -1) {
      // No tiene permiso para esta página → a su panel por defecto.
      go(ctx.profile.role === 'super_admin' ? 'admin.html' : 'dashboard.html');
      return null;
    }

    var profile = ctx.profile;
    profile.company = ctx.company;
    window.TF_PROFILE = profile;
    window.TF_COMPANY = ctx.company;

    // Marca último acceso (sin bloquear el render).
    try {
      var nowIso = new Date().toISOString();
      sb.from('profiles').update({ last_sign_in_at: nowIso }).eq('id', profile.id);
    } catch (e) {}

    // Hidrata el BRAND y las sedes del panel si dash-chrome ya está cargado.
    if (typeof window.hydrateBrand === 'function') window.hydrateBrand(profile, ctx.company);
    if (typeof window.hydrateSedes === 'function') window.hydrateSedes(ctx.sedes);

    return profile;
  }

  async function signOut() {
    if (sb) { try { await sb.auth.signOut(); } catch (e) {} }
    go(LOGIN);
  }

  // Cliente efímero para que el super admin pueda crear usuarios sin perder
  // su propia sesión (persistSession:false → no toca el localStorage 'tf-auth').
  function tempClient() {
    return window.supabase.createClient(URL, KEY, {
      auth: { storageKey: 'tf-temp-' + Math.floor(performance.now()), persistSession: false, autoRefreshToken: false },
    });
  }

  window.TF_AUTH = {
    sb: sb,
    configured: CONFIGURED,
    load: load,
    guard: guard,
    signOut: signOut,
    tempClient: tempClient,
  };
})();
