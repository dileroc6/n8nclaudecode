// perfil.jsx — User profile page (internal panel)

function PerfilApp({ profile }) {
  React.useEffect(() => { applyDefaultTokens(); }, []);

  const company = profile.company || {};
  const canEditCompany = profile.role === 'super_admin' || profile.role === 'admin';
  const [data, setData] = React.useState({
    nombre: profile.full_name || '',
    cargo: BRAND.role,
    correo: profile.email || '',
    tel: profile.phone || '',
    empresa: company.name || '',
    sector: '',
    ciudad: company.city || '',
  });
  const [saved, setSaved] = React.useState(false);
  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); setSaved(false); };

  const save = async (e) => {
    e.preventDefault();
    await TF_AUTH.sb.from('profiles')
      .update({ full_name: data.nombre, phone: data.tel })
      .eq('id', profile.id);
    if (canEditCompany && profile.company_id) {
      await TF_AUTH.sb.from('companies')
        .update({ name: data.empresa, city: data.ciudad })
        .eq('id', profile.company_id);
    }
    setSaved(true);
  };

  return (
    <div className="dash">
      <DashTopbar page="perfil" />
      <main className="dash-main dash-narrow">
        <a href="dashboard.html" className="dash-back">← volver al panel</a>

        <div className="dash-head" style={{ marginTop: 16 }}>
          <div>
            <div className="eyebrow">mi cuenta</div>
            <h1 className="dash-greeting">Mi perfil.</h1>
            <p className="dash-greeting-sub">Tus datos y los de tu empresa dentro de ToqueFlow.</p>
          </div>
        </div>

        <div className="perfil-id">
          <span className="perfil-avatar">{data.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
          <div className="perfil-id-meta">
            <b>{data.nombre}</b>
            <span>{data.cargo} · {data.empresa}</span>
          </div>
          <button type="button" className="btn btn-ghost perfil-photo-btn">Cambiar foto</button>
        </div>

        <form className="dash-form" onSubmit={save}>
          <section className="dash-section">
            <div className="dash-section-h">
              <h2>Datos personales</h2>
              <p>Cómo te identificamos a ti dentro del panel.</p>
            </div>
            <div className="dash-fields">
              <div className="form-field"><label>nombre completo</label><input type="text" value={data.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
              <div className="form-field"><label>cargo</label><input type="text" value={data.cargo} onChange={(e) => set('cargo', e.target.value)} /></div>
              <div className="form-field"><label>correo</label><input type="email" value={data.correo} onChange={(e) => set('correo', e.target.value)} /></div>
              <div className="form-field"><label>teléfono</label><input type="tel" value={data.tel} onChange={(e) => set('tel', e.target.value)} /></div>
            </div>
          </section>

          <section className="dash-section">
            <div className="dash-section-h">
              <h2>Empresa</h2>
              <p>Los datos que aparecen en tus flows y documentos.</p>
            </div>
            <div className="dash-fields">
              <div className="form-field"><label>nombre de la empresa</label><input type="text" value={data.empresa} onChange={(e) => set('empresa', e.target.value)} /></div>
              <div className="form-field"><label>sector</label><input type="text" value={data.sector} onChange={(e) => set('sector', e.target.value)} /></div>
              <div className="form-field" style={{ gridColumn: '1 / -1' }}><label>ciudad</label><input type="text" value={data.ciudad} onChange={(e) => set('ciudad', e.target.value)} /></div>
            </div>
          </section>

          <div className="dash-form-foot">
            <span className="dash-save-hint">{saved ? <span className="dash-saved">✓ cambios guardados</span> : '// los cambios se aplican a todos tus flows'}</span>
            <button type="submit" className="btn btn-primary">Guardar cambios <span className="arrow">→</span></button>
          </div>
        </form>
      </main>
    </div>
  );
}

TF_AUTH.guard().then((profile) => {
  if (!profile) return; // el guard ya redirigió a login
  ReactDOM.createRoot(document.getElementById('root')).render(<PerfilApp profile={profile} />);
});
