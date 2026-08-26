// dashboard.jsx — ToqueFlow internal dashboard (client panel)

const FLOWS_SEED = [
  {
    id: 'f1', name: 'Agente WhatsApp · Medellín', type: 'chat', kind: 'agente', status: 'activo', sede: 'medellin',
    desc: 'Atiende al público de la sede Medellín en su propio número.',
    channels: ['wa'],
    stats: [{ n: '1.840', l: 'mensajes' }, { n: '142', l: 'consultas' }, { n: '38', l: 'cotizaciones' }],
    spark: [4, 6, 5, 8, 7, 9, 12, 10, 14, 13, 16, 18],
    last: 'hace 3 min',
  },
  {
    id: 'f2', name: 'Agente WhatsApp · Bogotá', type: 'chat', kind: 'agente', status: 'activo', sede: 'bogota',
    desc: 'Atiende al público de la sede Bogotá en su propio número.',
    channels: ['wa'],
    stats: [{ n: '1.110', l: 'mensajes' }, { n: '88', l: 'consultas' }, { n: '24', l: 'cotizaciones' }],
    spark: [3, 5, 4, 6, 5, 7, 9, 8, 11, 10, 12, 13],
    last: 'hace 8 min',
  },
  {
    id: 'f3', name: 'Agente Telegram · Admin', type: 'admin', kind: 'agente', status: 'activo', sede: 'ambas',
    desc: 'Administra inventario y web de las dos sedes desde un chat.',
    channels: ['tg'],
    stats: [{ n: '96', l: 'comandos' }, { n: '540', l: 'productos' }, { n: '7', l: 'alertas' }],
    spark: [8, 7, 9, 6, 10, 8, 11, 9, 12, 10, 13, 11],
    last: 'hace 18 min',
  },
  {
    id: 'f4', name: 'Facturas Rappi', type: 'invoice', kind: 'automatización', status: 'activo', sede: 'ambas',
    desc: 'Genera la factura de cada pedido de Rappi automáticamente.',
    channels: ['rappi', 'erp'],
    stats: [{ n: '2.430', l: 'facturas' }, { n: '$184M', l: 'facturado' }, { n: '0', l: 'errores' }],
    spark: [6, 8, 7, 10, 9, 11, 10, 13, 12, 14, 15, 17],
    last: 'hace 1 min',
  },
  {
    id: 'f5', name: 'Dashboard pauta', type: 'chart', kind: 'automatización', status: 'activo', sede: 'ambas',
    desc: 'Consolida el rendimiento de tus campañas en un tablero en vivo.',
    channels: ['ads'],
    stats: [{ n: '6', l: 'campañas' }, { n: '$12.4k', l: 'CPL prom.' }, { n: '$48M', l: 'inversión' }],
    spark: [5, 6, 7, 6, 8, 7, 9, 8, 10, 11, 12, 13],
    last: 'hace 14 min',
  },
  {
    id: 'f6', name: 'Automatizaciones pauta', type: 'ads', kind: 'automatización', status: 'activo', sede: 'ambas',
    desc: 'Pausa o sube presupuesto según reglas de rendimiento.',
    channels: ['ads'],
    stats: [{ n: '18', l: 'reglas' }, { n: '34', l: 'ajustes auto' }, { n: '$9M', l: 'ahorro' }],
    spark: [4, 5, 6, 5, 7, 8, 7, 9, 8, 10, 9, 11],
    last: 'hace 40 min',
  },
];

const CH = {
  wa: { label: 'WhatsApp', icon: <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" /> },
  tg: { label: 'Telegram', icon: <path d="M21 4 3 11l5 2 2 6 3-4 4 3z" /> },
  ig: { label: 'Instagram', icon: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.4" /><circle cx="17" cy="7" r="1" fill="currentColor" /></> },
  mail: { label: 'Correo', icon: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></> },
  web: { label: 'Web', icon: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></> },
  cal: { label: 'Calendar', icon: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></> },
  erp: { label: 'Sistema / ERP', icon: <><rect x="3" y="4" width="18" height="5" rx="1.5" /><rect x="3" y="13" width="18" height="5" rx="1.5" /><path d="M7 6.5h.01M7 15.5h.01" /></> },
  rappi: { label: 'Rappi', icon: <><path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" /><path d="M9 7a3 3 0 0 1 6 0" /></> },
  ads: { label: 'Pauta / Ads', icon: <><path d="M3 11v2a1 1 0 0 0 1 1h3l4 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a3 3 0 0 1 0 6" /></> },
};

const FLOW_ICON = {
  chat: <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V7z" />,
  admin: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3M13 15h4" /></>,
  follow: <><path d="M4 6h12l4 4-4 4H4z" /><path d="M4 14v6" /></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>,
  star: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />,
  bill: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  chart: <><path d="M3 3v18h18" /><path d="M7 14l3-3 4 4 6-6" /></>,
  ads: <><path d="M3 11v2a1 1 0 0 0 1 1h3l4 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M16 9a3 3 0 0 1 0 6" /></>,
  invoice: <><path d="M5 3h11l3 3v15l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L5 21z" /><path d="M9 8h6M9 12h6" /></>,
  stock: <><path d="M3 8l9-5 9 5-9 5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
};

function Sparkline({ data, active }) {
  const w = 100, h = 28;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => `${i * step},${h - (d / max) * (h - 4) - 2}`).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  const id = React.useId();
  return (
    <svg className="flow-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f15a24" stopOpacity={active ? '.35' : '.12'} />
          <stop offset="1" stopColor="#f15a24" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#sg-${id})`} />
      <polyline points={pts} fill="none" stroke={active ? 'url(#flowGrad)' : 'currentColor'}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                opacity={active ? 1 : .4} />
    </svg>
  );
}

function FlowCard({ flow, showSede, onView }) {
  const soon = flow.status === 'próximamente';
  const active = flow.status === 'activo';
  return (
    <article className={`flow-card ${soon ? 'is-soon' : active ? '' : 'is-paused'}`}>
      <div className="flow-card-top">
        <div className="flow-card-icon" data-kind={flow.kind}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">{FLOW_ICON[flow.type]}</svg>
        </div>
        {soon
          ? <span className="flow-status soon"><span className="flow-status-dot"></span>Próximamente</span>
          : <span className={`flow-status ${active ? 'on' : 'off'}`}><span className="flow-status-dot"></span>{flow.status}</span>}
      </div>

      <span className="flow-kind" data-kind={flow.kind}>{flow.kind}</span>
      {showSede && SEDES.length > 0 && <span className="flow-sede">{flow.sede === 'ambas' ? 'Ambas sedes' : SEDE_NAME[flow.sede]}</span>}
      <h3 className="flow-name">{flow.name}</h3>
      <p className="flow-desc">{flow.desc}</p>

      <div className="flow-channels">
        {flow.channels.map((c) => (
          <span key={c} className="flow-ch" title={CH[c].label}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{CH[c].icon}</svg>
          </span>
        ))}
      </div>

      {soon ? (
        <div className="flow-soon-note">
          <b>Disponible muy pronto</b>{flow.last ? <span> · {flow.last}</span> : null}
        </div>
      ) : (
        <>
          <div className="flow-stats">
            {flow.stats.map((s, i) => (
              <div key={i} className="flow-stat">
                <div className="flow-stat-n">{s.n}</div>
                <div className="flow-stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="flow-card-foot">
            <span className="flow-last">{flow.last}</span>
            {flow.tool_url
              ? <a className="flow-view" href={flow.tool_url}>Abrir <span className="arrow">→</span></a>
              : <span className="flow-soon-tag">Muy pronto</span>}
          </div>
        </>
      )}
    </article>
  );
}

function NewFlowCard() {
  return (
    <button type="button" className="flow-card flow-card-new">
      <div className="flow-new-plus">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <div className="flow-new-text">
        <b>Crear un nuevo flow</b>
        <span>Automatiza otra tarea o conversación</span>
      </div>
    </button>
  );
}

function FlowDetail({ flow, onClose, onToggle, canManage }) {
  React.useEffect(() => {
    if (!flow) return; // solo bloquea el scroll cuando el drawer está abierto
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [flow, onClose]);

  if (!flow) return null;
  const active = flow.status === 'activo';

  return (
    <div className="fd-overlay" onClick={onClose}>
      <aside className="fd-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="fd-drawer-head">
          <div className="fd-drawer-id">
            <div className="flow-card-icon" data-kind={flow.kind}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">{FLOW_ICON[flow.type]}</svg>
            </div>
            <div>
              <div className="fd-drawer-kind"><span className="flow-kind" data-kind={flow.kind}>{flow.kind}</span>{SEDES.length > 0 && <span className="fd-drawer-sede">{flow.sede === 'ambas' ? 'Ambas sedes' : SEDE_NAME[flow.sede]}</span>}</div>
              <h2 className="fd-drawer-name">{flow.name}</h2>
            </div>
          </div>
          <button type="button" className="fd-close" onClick={onClose} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="fd-drawer-body">
          <p className="fd-desc">{flow.desc}</p>

          <div className="fd-statusbar">
            <span className={`flow-status ${active ? 'on' : 'off'}`}><span className="flow-status-dot"></span>{flow.status}</span>
            <span className="fd-last">actualizado {flow.last}</span>
            {canManage && (
              <button type="button" className={`fd-toggle ${active ? 'on' : ''}`} onClick={() => onToggle(flow.id)}>
                {active ? 'Pausar flow' : 'Activar flow'}
              </button>
            )}
          </div>

          <div className="fd-section-label">// rendimiento</div>
          <div className="fd-metrics">
            {flow.stats.map((s, i) => (
              <div key={i} className="fd-metric">
                <div className="fd-metric-n">{s.n}</div>
                <div className="fd-metric-l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="fd-section-label">// canales conectados</div>
          <div className="fd-channels">
            {flow.channels.map((c) => (
              <span key={c} className="fd-channel">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">{CH[c].icon}</svg>
                {CH[c].label}
              </span>
            ))}
          </div>
        </div>

        <div className="fd-drawer-foot">
          <a href="contacto.html" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Pedir un ajuste</a>
          {flow.tool_url
            ? <a href={flow.tool_url} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Abrir herramienta <span className="arrow">→</span></a>
            : <a href="ajustes.html" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Configurar <span className="arrow">→</span></a>}
        </div>
      </aside>
    </div>
  );
}

// Calcula pedidos/día (últimos 12 días) + totales reales desde ai_usage.
function usageStats(rows) {
  const days = 12;
  const buckets = new Array(days).fill(0);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let mes = 0, hoy = 0;
  for (const r of rows) {
    const d = new Date(r.created_at);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diff = Math.round((startToday - dayStart) / 86400000);
    if (diff >= 0 && diff < days) buckets[days - 1 - diff]++;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) mes++;
    if (diff === 0) hoy++;
  }
  return { spark: buckets, total: rows.length, mes, hoy };
}

function DashApp({ companyId, previewName }) {
  const [flows, setFlows] = React.useState([]);
  const [usage, setUsage] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('todos');
  const [selectedId, setSelectedId] = React.useState(null);
  const [bizKpis, setBizKpis] = React.useState(null);

  React.useEffect(() => { applyDefaultTokens(); }, []);

  // Carga flows + consumo real (ai_usage) de la empresa. La gráfica y los números salen de ahí.
  React.useEffect(() => {
    (async () => {
      const cid = companyId;
      if (!cid) { setFlows([]); setLoading(false); return; }
      const [flowsRes, usageRes, contactsRes, campsRes, runsRes, tmRes] = await Promise.all([
        TF_AUTH.sb.from('flows').select('*').eq('company_id', cid).order('position', { ascending: true }).order('created_at', { ascending: true }),
        TF_AUTH.sb.from('ai_usage').select('sede_id,success,created_at').eq('company_id', cid),
        TF_AUTH.sb.from('contacts').select('status,full_name,service_type').eq('company_id', cid),
        TF_AUTH.sb.from('campaigns').select('status').eq('company_id', cid),
        TF_AUTH.sb.from('campaign_runs').select('status').eq('company_id', cid),
        TF_AUTH.sb.from('test_messages').select('id').eq('company_id', cid),
      ]);
      const usg = usageRes.data || [];
      setUsage(usg);
      // Stats EN VIVO para las tarjetas de negocio (Base de datos=stock, Campañas=follow, Simulador=chat).
      const cts = (contactsRes.data || []).filter((c) => !/^UserToque/i.test(c.full_name || ''));
      const camps = campsRes.data || [];
      const runs = runsRes.data || [];
      const testMsgs = (tmRes.data || []).length;
      const reactivar = cts.filter((c) => c.status === 'no_activo').length;
      const enviados = runs.filter((r) => r.status === 'sent').length;
      // $$ estimado por membresías mensuales (karma es gratis; paquete no es mensual → no cuenta).
      const PRECIO = { beja: 79900, uja: 120000 };
      const suma = (arr) => arr.reduce((a, c) => a + (PRECIO[c.service_type] || 0), 0);
      const fmtM = (v) => v >= 1000000 ? '$' + (v / 1000000).toFixed(1).replace('.0', '') + 'M' : v >= 1000 ? '$' + Math.round(v / 1000) + 'k' : '$' + v;
      const ingreso = suma(cts.filter((c) => c.status === 'activo'));
      // Oportunidad/mes si reactivas a los inactivos con cada plan (uja = "UHA" en pantalla).
      const potBeja = reactivar * PRECIO.beja;
      const potUha = reactivar * PRECIO.uja;
      // KPIs de valor de negocio para el resumen de arriba (si la empresa tiene contactos).
      setBizKpis(cts.length ? { contactos: cts.length, reactivar, campActivas: camps.filter((c) => c.status === 'activa').length, enviados, ingreso: fmtM(ingreso), potBeja: fmtM(potBeja), potUha: fmtM(potUha) } : null);
      const liveStats = {
        stock: [
          { n: String(cts.length), l: 'contactos' },
          { n: String(cts.filter((c) => c.status === 'activo').length), l: 'activos' },
          { n: String(cts.filter((c) => c.status === 'no_activo').length), l: 'por reactivar' },
        ],
        follow: [
          { n: String(camps.length), l: 'campañas' },
          { n: String(camps.filter((c) => c.status === 'activa').length), l: 'activas' },
          { n: String(runs.filter((r) => r.status === 'sent').length), l: 'msgs enviados' },
        ],
        chat: [
          { n: String(testMsgs), l: 'mensajes de prueba' },
          { n: '3', l: 'modos' },
        ],
      };
      setFlows((flowsRes.data || []).map((r) => {
        const matching = usg.filter((u) => (r.sede_id ? u.sede_id === r.sede_id : true));
        const st = usageStats(matching);
        // 'chart'/'chat' usan stats guardadas; 'stock'/'follow' usan stats EN VIVO; el resto, ai_usage.
        const useStored = (r.type === 'chart' || r.type === 'chat') && Array.isArray(r.stats) && r.stats.length;
        return {
          id: r.id, name: r.name, type: r.type, kind: r.kind, status: r.status,
          sede: r.sede_id || 'ambas', desc: r.description || '',
          channels: r.channels || [],
          stats: liveStats[r.type] ? liveStats[r.type] : (useStored ? r.stats : [{ n: String(st.total), l: 'pedidos' }, { n: String(st.mes), l: 'este mes' }, { n: String(st.hoy), l: 'hoy' }]),
          spark: (useStored && Array.isArray(r.spark) && r.spark.length) ? r.spark : st.spark,
          last: r.last_label || '', tool_url: r.tool_url || null,
        };
      }));
      setLoading(false);
    })();
  }, []);

  const toggle = async (id) => {
    let next;
    setFlows((fs) => fs.map((f) => {
      if (f.id !== id) return f;
      next = f.status === 'activo' ? 'pausado' : 'activo';
      return { ...f, status: next };
    }));
    if (next) await TF_AUTH.sb.from('flows').update({ status: next }).eq('id', id);
  };

  const activeSede = useActiveSede();
  const scoped = activeSede === 'todas' ? flows : flows.filter((f) => f.sede === activeSede || f.sede === 'ambas');

  const activeCount = scoped.filter((f) => f.status === 'activo').length;
  const agentCount = scoped.filter((f) => f.kind === 'agente').length;
  const autoCount = scoped.filter((f) => f.kind === 'automatización').length;
  const filtered = filter === 'todos' ? scoped
    : filter === 'agentes' ? scoped.filter((f) => f.kind === 'agente')
    : filter === 'automatizaciones' ? scoped.filter((f) => f.kind === 'automatización')
    : scoped.filter((f) => f.status === 'pausado');

  const scopedUsage = activeSede === 'todas' ? usage : usage.filter((u) => u.sede_id === activeSede);
  const okRate = scopedUsage.length ? Math.round(scopedUsage.filter((u) => u.success !== false).length / scopedUsage.length * 100) : null;
  // Resumen de valor: si la empresa tiene base de negocio (contactos), muestra KPIs
  // útiles para el cliente; si no, cae a los contadores genéricos (uso de IA).
  const overview = bizKpis ? [
    { n: String(bizKpis.contactos), l: 'contactos en tu base' },
    { n: bizKpis.ingreso, l: 'ingreso mensual (membresías)' },
    { n: bizKpis.potBeja, l: 'al mes si reactivas tus ' + bizKpis.reactivar + ' inactivos con membresía Beja' },
    { n: bizKpis.potUha, l: 'al mes si reactivas tus ' + bizKpis.reactivar + ' inactivos con membresía UHA' },
  ] : [
    { n: String(activeCount), l: 'flows activos' },
    { n: String(autoCount), l: 'automatizaciones' },
    { n: String(scopedUsage.length), l: 'pedidos procesados' },
    { n: okRate === null ? '—' : okRate + '%', l: 'ejecución sin error' },
  ];

  // Per-sede comparative summary (owner viewing "todas")
  const sedeSummary = SEDES.map((s) => {
    const fs = flows.filter((f) => f.sede === s.id || f.sede === 'ambas');
    return {
      ...s,
      total: fs.length,
      activos: fs.filter((f) => f.status === 'activo').length,
      agentes: fs.filter((f) => f.kind === 'agente').length,
      autos: fs.filter((f) => f.kind === 'automatización').length,
    };
  });

  return (
    <div className="dash">
      {/* hidden svg gradient for sparklines */}
      <svg width="0" height="0" style={{ position: 'absolute' }}><defs>
        <linearGradient id="flowGrad" x1="0" x2="1"><stop offset="0" stopColor="#c1272d" /><stop offset="1" stopColor="#f15a24" /></linearGradient>
      </defs></svg>

      <DashTopbar page="panel" />

      {previewName && (
        <div className="dash-preview-bar">
          <span>👁 Estás viendo el panel de <b>{previewName}</b> como super admin.</span>
          <a href="admin.html">← Volver a la consola</a>
        </div>
      )}

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <div className="eyebrow">panel de {BRAND.name}</div>
            <h1 className="dash-greeting">Hola, {BRAND.user.split(' ')[0]}.</h1>
            <p className="dash-greeting-sub">
              {SEDES.length === 0
                ? <>Esto es lo que está fluyendo en <span className="hl">{BRAND.name}</span> ahora mismo.</>
                : activeSede === 'todas'
                ? <>Vista general de <span className="hl">las {SEDES.length} sedes</span> de {BRAND.name}.</>
                : <>Esto es lo que está fluyendo en <span className="hl">{SEDE_NAME[activeSede]}</span> ahora mismo.</>}
            </p>
          </div>
        </div>

        {activeSede === 'todas' && SEDES.length > 0 && (
          <div className="sede-compare">
            {sedeSummary.map((s) => (
              <button key={s.id} type="button" className="sede-compare-card" onClick={() => setActiveSede(s.id)}>
                <div className="sede-compare-h">
                  <span className="sede-ic sm">{s.initials}</span>
                  <div className="sede-compare-name"><b>{s.name}</b><span>{s.city}</span></div>
                  <span className="sede-compare-arrow">→</span>
                </div>
                <div className="sede-compare-stats">
                  <div><b>{s.activos}/{s.total}</b><span>activos</span></div>
                  <div><b>{s.agentes}</b><span>agentes</span></div>
                  <div><b>{s.autos}</b><span>autom.</span></div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="dash-overview">
          {overview.map((o, i) => (
            <div key={i} className="dash-ov">
              <div className="dash-ov-n">{o.n}</div>
              <div className="dash-ov-l">{o.l}</div>
            </div>
          ))}
        </div>

        <div className="dash-flows-head">
          <h2 className="dash-flows-title">{activeSede === 'todas' ? 'Todos los flows' : 'Flows de esta sede'}</h2>
          <div className="dash-filters">
            {['todos', 'agentes', 'automatizaciones'].map((f) => (
              <button key={f} type="button" className={`dash-filter ${filter === f ? 'is-active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>

        {loading && <div className="admin-empty">Cargando tus flows…</div>}
        {!loading && flows.length === 0 && (
          <div className="admin-empty">Aún no hay flows configurados para tu empresa. El equipo de ToqueFlow los irá activando aquí.</div>
        )}
        <div className="dash-grid">
          {filtered.map((f) => <FlowCard key={f.id} flow={f} showSede={activeSede === 'todas'} onView={(fl) => setSelectedId(fl.id)} />)}
        </div>
      </main>

      <FlowDetail
        flow={flows.find((f) => f.id === selectedId) || null}
        onClose={() => setSelectedId(null)}
        onToggle={toggle}
        canManage={(window.TF_PROFILE || {}).role === 'super_admin'}
      />
    </div>
  );
}

TF_AUTH.guard().then(async (profile) => {
  if (!profile) return; // el guard ya redirigió a login

  // Modo previsualización: un super admin puede ver el panel de cualquier
  // empresa con ?empresa=<id>. Carga sus sedes/empresa antes de renderizar.
  const params = new URLSearchParams(window.location.search);
  const previewId = profile.role === 'super_admin' ? params.get('empresa') : null;
  let companyId = profile.company_id;
  let previewName = null;

  if (previewId) {
    const company = (await TF_AUTH.sb.from('companies').select('*').eq('id', previewId).single()).data;
    if (company) {
      companyId = company.id;
      previewName = company.name;
      const sedes = (await TF_AUTH.sb.from('sedes').select('*').eq('company_id', company.id)
        .eq('status', 'active').order('created_at', { ascending: true })).data || [];
      if (typeof window.hydrateBrand === 'function') window.hydrateBrand(profile, company);
      if (typeof window.hydrateSedes === 'function') window.hydrateSedes(sedes);
    }
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<DashApp companyId={companyId} previewName={previewName} />);
});
