// ============================================================================
// Ojo con `process.exit()` DENTRO del try: se salta el `finally`, y el
// `finally` es el que borra la empresa y los usuarios que esta prueba creó.
// Por eso aquí se usa `throw`.
// La config mala de un cliente no puede tumbar al otro
// ----------------------------------------------------------------------------
// Hay UN solo flujo de n8n para todos los clientes. La pregunta que esta prueba
// contesta es la que da miedo: si el cliente A tiene algo roto —una instancia
// que no existe, un campo vacío, un dato absurdo— ¿el cliente B sigue siendo
// atendido?
//
// Se prueba por el camino real: se encolan dos eventos a la vez, uno roto y uno
// bueno, y se mira si el bueno llegó.
//
// No usa IA, así que se puede correr aunque el agente esté sin saldo.
// ============================================================================
const fs = require('fs');
const path = require('path');
const PLAT = path.join(__dirname, '..', '..');
const REPO = path.join(PLAT, '..', '..');

fs.readFileSync(path.join(PLAT, 'credentials.env'), 'utf8').split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});
const cfg = JSON.parse(fs.readFileSync(path.join(REPO, '.mcp.json'), 'utf8'));
const N8N = String(cfg.mcpServers.n8n.env.N8N_API_URL).split('/api/v1')[0];
const { Client } = require(path.join(PLAT, 'node_modules', 'pg'));

const api = async (r) => (await fetch(N8N + '/api/v1' + r,
  { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } })).json();

const fallos = [];
const check = (c, q, d) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + q + (c ? '' : '   ← ' + d));
  if (!c) fallos.push(q);
};

const SELLO = Date.now().toString(36);
const esperar = (ms) => new Promise((s) => setTimeout(s, ms));

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];

  let empA, empB;
  try {
    empA = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Roto ' + SELLO, 'zz-roto-' + SELLO])).id;
    empB = (await uno("insert into public.companies (name, slug, status) values ($1,$2,'active') returning id",
      ['ZZ Sano ' + SELLO, 'zz-sano-' + SELLO])).id;

    // A está roto a propósito: agente encendido apuntando a una instancia que
    // NO existe en Evolution. Es el caso real más común.
    await c.query('insert into public.agent_config (company_id, whatsapp_instance, activo) values ($1,$2,true)',
      [empA, 'zz-no-existe-' + SELLO]);
    // B está bien.
    await c.query('insert into public.agent_config (company_id, whatsapp_instance, activo) values ($1,$2,true)',
      [empB, 'zz-sano-' + SELLO]);

    const receptor = (await api('/workflows?limit=250')).data
      .find((w) => w.name === 'Toque - Receptor de Eventos (n8n)');
    if (!receptor) { throw new Error('no encontré el receptor'); }

    const antes = ((await api('/executions?workflowId=' + receptor.id + '&limit=1')).data || [])[0];
    const marca = antes ? antes.id : null;

    console.log('\n── Se encolan los dos a la vez: uno roto, uno sano ──');
    // El de A lleva un payload que no cuadra con nada. El de B es un ping
    // limpio. Salen con milisegundos de diferencia, como pasaría de verdad.
    const evA = (await uno(
      "insert into public.n8n_events (company_id, event, payload) values ($1,'ejecutar_campana',$2::jsonb) returning id",
      [empA, JSON.stringify({ campaign_id: null, roto: 'a proposito: sin campaña, sin contactos, sin nada' })])).id;
    const evB = (await uno(
      "insert into public.n8n_events (company_id, event, payload) values ($1,'ping',$2::jsonb) returning id",
      [empB, JSON.stringify({ desde: 'prueba de aislamiento' })])).id;
    console.log('     roto: ' + evA);
    console.log('     sano: ' + evB);

    await esperar(9000);

    const corridas = ((await api('/executions?workflowId=' + receptor.id + '&limit=10')).data || [])
      .filter((e) => !marca || e.id !== marca);

    check(corridas.length >= 2,
      'los DOS eventos llegaron a n8n, no solo el primero',
      'llegaron ' + corridas.length + ' — si solo llegó uno, el roto se comió al sano');

    // Lo que de verdad importa: que el sano no haya quedado sin atender.
    const sanoOk = corridas.some((e) => e.status === 'success');
    check(sanoOk, 'al menos una ejecución terminó bien: el cliente sano fue atendido',
      corridas.map((e) => e.status).join(', ') + ' — si todas fallaron, uno tumbó al otro');

    console.log('\n── Y si el roto falla, alguien se entera ──');
    const errWf = (await api('/workflows?limit=250')).data.find((w) => /algo fall/i.test(w.name));
    check(!!errWf, 'existe el flujo que avisa de los errores', 'sin él, un fallo se pierde en silencio');

    if (errWf) {
      const f = await api('/workflows/' + receptor.id);
      check((f.settings || {}).errorWorkflow === errWf.id,
        'y el receptor está enganchado a él',
        'errorWorkflow=' + JSON.stringify((f.settings || {}).errorWorkflow) +
        ' — un flujo que falla sin avisar es como llevó FerreteríaYa 18 días caída');
    }

    console.log('\n── Una ejecución por evento, que es el aislamiento de verdad ──');
    const míos = (await api('/workflows?limit=250')).data
      .filter((w) => w.active && /^Toque|^ToqueFlow/i.test(w.name));
    const sinAviso = [];
    for (const w of míos) {
      if (/algo fall/i.test(w.name)) continue;   // el manejador no se avisa a sí mismo
      const f = await api('/workflows/' + w.id);
      if (!(f.settings || {}).errorWorkflow) sinAviso.push(w.name);
    }
    check(sinAviso.length === 0,
      'los ' + míos.length + ' flujos nuestros avisan si fallan',
      'sin aviso: ' + sinAviso.join(', '));

    await c.query('delete from public.n8n_events where id = any($1)', [[evA, evB]]);

  } finally {
    for (const e of [empA, empB]) if (e) await c.query('delete from public.companies where id = $1', [e]);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
