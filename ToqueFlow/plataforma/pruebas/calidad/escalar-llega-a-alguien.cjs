/* ============================================================================
 * Si el agente escala, ¿le llega a alguien?
 * ----------------------------------------------------------------------------
 * Encontrado en Bejauha el 10-sep, yendo a preparar su go-live. Sus reglas
 * decían a dónde escalar EN PALABRAS:
 *
 *     "quiere comprar, agendar o pagar"  →  destino: "equipo de Bejauha"
 *
 * y el workflow manda ese texto como si fuera un número de WhatsApp. Evolution
 * lo rechaza. O sea: el agente deja de responder —eso sí funciona— y el aviso
 * NO LLEGA A NADIE. La persona queda esperando en silencio.
 *
 * Eso es peor que un bot que no contesta, porque nadie se entera de que pasó.
 * Y no lo cazaba ninguna prueba: los escenarios miden lo que el agente DICE,
 * no a dónde va el aviso cuando deja de hablar.
 *
 * Solo mira los agentes ENCENDIDOS: un agente apagado con las reglas a medias
 * es trabajo pendiente, no una avería.
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const env = {};
for (const l of fs.readFileSync(path.join(ROOT, 'credentials.env'), 'utf8').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const { Client } = require(path.join(ROOT, 'node_modules', 'pg'));

// Un destino sirve si es un teléfono con indicativo o el id de un grupo.
const esNumero = (s) => /^\+?[1-9][0-9]{9,14}$/.test(String(s).replace(/[\s-]/g, ''));
const esGrupo  = (s) => /@g\.us$/i.test(String(s));
const esLink   = (s) => /^https?:\/\//i.test(String(s));

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? '  ✅ ' : '  ❌ ') + que + (cond ? '' : '\n       ' + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const q = await c.query(`
    select co.name as empresa, ac.nombre as agente, ac.whatsapp_instance, ac.enrutamiento
    from public.agent_config ac
    join public.companies co on co.id = ac.company_id
    where ac.activo
    order by co.name, ac.whatsapp_instance`);

  console.log('\n── Agentes encendidos: ' + q.rows.length + ' ──\n');

  if (!q.rows.length) console.log('  (ninguno encendido: nada que comprobar)');

  for (const r of q.rows) {
    const quien = r.empresa + ' · ' + (r.agente || r.whatsapp_instance);
    const reglas = ((r.enrutamiento || {}).reglas) || [];
    const avisan = reglas.filter((x) => /notificar|avisar|escalar/i.test(String(x.accion || '')));

    if (!avisan.length) {
      console.log('  ·  ' + quien + ' — no tiene reglas que avisen a nadie');
      continue;
    }

    const malos = avisan.filter((x) => {
      const d = String(x.destino || '').trim();
      return !d || !(esNumero(d) || esGrupo(d) || esLink(d));
    });

    check(malos.length === 0,
      quien + ': sus ' + avisan.length + ' avisos tienen a dónde llegar',
      malos.map((m) => 'la regla «' + m.si + '» manda el aviso a «' + (m.destino || '(vacío)') +
        '», que no es un número ni un grupo. El aviso no llega a nadie y el cliente queda esperando.').join('\n       '));
  }

  await c.end();
  console.log(fallos.length === 0
    ? '\n═══ Todo agente encendido sabe a quién avisar ═══'
    : '\n═══ ' + fallos.length + ' agente(s) escalan al vacío ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
