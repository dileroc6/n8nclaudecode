// rappi-tool.jsx — Herramienta genérica de Impresión Rappi (config por sede en window.RAPPI).
// Pega el pedido → Edge Function (Claude) → recibo 80mm → imprimir → backup al Sheet.

const CFG = window.RAPPI || {};
const sb = TF_AUTH.sb;
const FN_URL = (window.SUPABASE_URL || '').replace(/\/+$/, '') + '/functions/v1/rappi-print';

const cop = (n) => (n === null || n === undefined || n === '') ? '—' : '$' + Number(n).toLocaleString('es-CO');
const BIZ = CFG.biz || { name: 'FERRETERIAYA SAS', info: '', info2: '' };
const FOOTER = CFG.footer || '¡Gracias por tu pedido!';

function Receipt({ data }) {
  const ref = (data.order_id || '').toString().slice(-4);
  return (
    <div className="receipt">
      <div className="logo-row"><img src="assets/ferreteriaya-rappi.png" alt="FerreteríaYa · Rappi" /></div>
      <div className="company-name">{BIZ.name}</div>
      <div className="company-info">{BIZ.info}{BIZ.info2 ? <><br />{BIZ.info2}</> : null}</div>
      <div className="sep-solid"></div>

      <div className="order-label">Pedido Rappi</div>
      <div className="order-main-row">
        <span className="order-id-full">Orden: {data.order_id || '—'}</span>
        {ref && <div className="order-ref-row"><span className="order-ref-label">Ref:</span><span className="order-ref-box">#{ref}</span></div>}
      </div>
      <div className="sep-solid"></div>

      {data.customer_name && (<><div className="client-section"><strong>Cliente:</strong> <strong>{data.customer_name}</strong></div><div className="sep-dot"></div></>)}

      {(data.items || []).map((it, i) => (
        <React.Fragment key={i}>
          <div className="item-row">
            <div className="item-name"><span className="item-qty">{it.qty}x</span> {it.name}</div>
            <div className="item-price">{cop(it.price)}</div>
          </div>
          <div className="sep-dot"></div>
        </React.Fragment>
      ))}

      {data.subtotal != null && (<><div className="total-row"><span>Subtotal</span><span>{cop(data.subtotal)}</span></div><div className="sep-dot"></div></>)}
      {data.discount ? (<><div className="total-row"><span>Descuento de la plataforma</span><span>-{cop(data.discount)}</span></div><div className="sep-dot"></div></>) : null}
      <div className="total-row"><span><strong>Total a pagar</strong></span><span><strong>{cop(data.total)}</strong></span></div>
      <div className="sep-dot"></div>

      <div className="grand-total-section">
        <div className="grand-total-label">Pago Rappi</div>
        <div className="grand-total-amount">{cop(data.total)}</div>
      </div>
      <div className="sep-solid"></div>
      <div className="footer">{data.timestamp || ''}<br />{FOOTER}</div>
    </div>
  );
}

function RappiTool({ profile, ctx }) {
  const [texto, setTexto] = React.useState('');
  const [state, setState] = React.useState('idle'); // idle | loading
  const [error, setError] = React.useState('');
  const [data, setData] = React.useState(null);
  const textareaRef = React.useRef(null);

  const nuevoPedido = () => {
    setTexto(''); setData(null); setError(''); setState('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { if (textareaRef.current) textareaRef.current.focus(); }, 350);
  };

  const generar = async (e) => {
    e.preventDefault();
    if (state === 'loading' || !texto.trim()) return;
    setError(''); setData(null); setState('loading');

    const token = (await sb.auth.getSession()).data.session.access_token;
    let res;
    try {
      res = await fetch(FN_URL, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, apikey: window.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedido: texto, tab: CFG.tab || null, sede: CFG.sede || null, company_id: ctx.companyId || null, sede_id: ctx.sedeId || null }),
      });
    } catch (err) { setState('idle'); setError('No se pudo conectar con el servidor.'); return; }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setState('idle'); setError(body.error || 'Error procesando el pedido.'); return; }

    setData(body);
    setState('idle');
    setTimeout(() => window.print(), 400);
  };

  return (
    <div>
      <header className="tool-top no-print">
        <div className="brand">
          <img className="brand-ferre" src="assets/ferreteriaya-logo.webp" alt="FerreteríaYa" />
          <span className="brand-x">×</span>
          <img className="brand-tf" src="assets/toqueflow-logo.png" alt="ToqueFlow" />
          <div className="brand-title"><b>{CFG.title || 'Impresión Rappi'}</b></div>
        </div>
        <div className="row" style={{ margin: 0 }}>
          <span className="who">{profile.full_name || profile.email}</span>
          {CFG.historialUrl && <a className="back" href={CFG.historialUrl} target="_blank" rel="noopener noreferrer">📄 Ver historial</a>}
          <a className="back" href={profile.role === 'super_admin' ? 'admin.html' : 'dashboard.html'}>← volver</a>
        </div>
      </header>

      <div className="wrap">
        <div className="panel no-print">
          <img className="panel-logo" src="assets/ferreteriaya-rappi.png" alt="FerreteríaYa · Rappi" />
          <h1>Imprimir pedido Rappi</h1>
          <p className="sub">Pega aquí el texto del pedido copiado de Rappi Seller Center y genera el recibo POS.</p>
          <form onSubmit={generar}>
            <textarea ref={textareaRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Pega el texto del pedido Rappi aquí…" autoFocus />
            <div className="row">
              <button type="submit" className="btn btn-primary" disabled={state === 'loading'}>
                {state === 'loading' ? 'Procesando…' : '🖨 Imprimir recibo'}
              </button>
              {(data || texto) && (
                <button type="button" className="btn btn-ghost" onClick={nuevoPedido}>+ Nuevo pedido</button>
              )}
            </div>
            {error && <div className="notice error">{error}</div>}
            <p className="muted" style={{ marginTop: 14 }}>// cada pedido queda guardado automáticamente en el backup</p>
          </form>
        </div>

        {data && (
          <div className="receipt-card">
            <Receipt data={data} />
            <div className="row no-print" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>🖨 Imprimir de nuevo</button>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={nuevoPedido}>+ Nuevo pedido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

async function resolveContext(profile) {
  let companyId = profile.company_id;
  let companyName = (profile.company && profile.company.name) || null;
  if (!companyId && profile.role === 'super_admin') {
    const c = (await sb.from('companies').select('id,name').eq('slug', 'ferreteriaya').single()).data;
    if (c) { companyId = c.id; companyName = c.name; }
  }
  let sedeId = null;
  if (companyId) {
    const s = (await sb.from('sedes').select('id,name').eq('company_id', companyId).ilike('name', '%' + (CFG.sedeMatch || '') + '%').limit(1)).data;
    if (s && s.length) sedeId = s[0].id;
  }
  return { companyId, companyName, sedeId };
}

TF_AUTH.guard().then(async (profile) => {
  if (!profile) return;
  const ctx = await resolveContext(profile);
  ReactDOM.createRoot(document.getElementById('root')).render(<RappiTool profile={profile} ctx={ctx} />);
});
