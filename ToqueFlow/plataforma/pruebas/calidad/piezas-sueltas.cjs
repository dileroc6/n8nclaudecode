/* ============================================================================
 * Las dos piezas sueltas: registrar un reclamo · a quién reactivar
 * ----------------------------------------------------------------------------
 * Lo que protege:
 *   · un reclamo sale con un NÚMERO que se le puede dictar a la persona
 *   · quien insiste no acaba con tres números para un solo problema
 *   · la reactivación NUNCA propone a quien se dio de baja
 *
 * Corre contra la base con una empresa propia que se borra al final.
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

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? '  ✅ ' : '  ❌ ') + que + (cond ? '' : '   ← ' + detalle));
  if (!cond) fallos.push(que);
};

const SELLO = Date.now().toString(36);
const INSTANCIA = 'zz-sueltas-' + SELLO;
const TEL_A = '573007' + String(Date.now()).slice(-6);
const TEL_B = '573008' + String(Date.now()).slice(-6);

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (sql, args) => (await c.query(sql, args)).rows[0];
  let empresa;

  try {
    empresa = (await uno(
      `insert into public.companies (name, slug, status) values ($1, $2, 'active') returning id`,
      ['ZZ Sueltas ' + SELLO, 'zz-sueltas-' + SELLO])).id;
    await c.query(`insert into public.agent_config (company_id, whatsapp_instance, activo)
                   values ($1, $2, true)`, [empresa, INSTANCIA]);
    const cA = (await uno(`insert into public.contacts (company_id, phone, full_name, source, last_contact_at)
                           values ($1, $2, 'Ana', 'whatsapp', now() - interval '200 days') returning id`, [empresa, TEL_A])).id;
    const cB = (await uno(`insert into public.contacts (company_id, phone, full_name, source, last_contact_at)
                           values ($1, $2, 'Beto', 'whatsapp', now() - interval '200 days') returning id`, [empresa, TEL_B])).id;
    check(!!cA && !!cB, 'empresa, agente y dos contactos creados', 'algo quedó nulo');

    const llamar = async (fn, payload) =>
      (await uno('select public.' + fn + '($1::jsonb) as r', [JSON.stringify(payload)])).r;

    console.log('\n── Un reclamo sale con número ──');
    const r1 = await llamar('tf_tool_registrar_reclamo',
      { instance: INSTANCIA, telefono: TEL_A, texto: 'Llevo tres días esperando el pedido', sobre: 'pedido' });
    check(r1.ok === true && r1.numero === 1, 'el primero es el número 1', JSON.stringify(r1));
    check(/1/.test(String(r1.que_decir)), 'y viene la frase para decírselo a la persona', JSON.stringify(r1));

    console.log('\n── Quien insiste no se lleva tres números ──');
    const r2 = await llamar('tf_tool_registrar_reclamo',
      { instance: INSTANCIA, telefono: TEL_A, texto: 'sigo esperando' });
    check(r2.numero === 1 && r2.ya_existia === true, 'insistir suma al caso abierto, no abre otro', JSON.stringify(r2));
    const cuantos = await uno('select count(*)::int n from public.reclamos where company_id = $1', [empresa]);
    check(cuantos.n === 1, 'sigue habiendo un solo reclamo', 'hay ' + cuantos.n);
    const texto = await uno('select texto from public.reclamos where company_id = $1', [empresa]);
    check(/sigo esperando/.test(texto.texto), 'y lo nuevo quedó dentro del mismo caso', texto.texto);

    console.log('\n── Otra persona, otro número ──');
    const r3 = await llamar('tf_tool_registrar_reclamo',
      { instance: INSTANCIA, telefono: TEL_B, texto: 'me cobraron de más' });
    check(r3.numero === 2, 'a otra persona le toca el 2', JSON.stringify(r3));

    console.log('\n── Lo que no debe pasar ──');
    const vacio = await llamar('tf_tool_registrar_reclamo', { instance: INSTANCIA, telefono: TEL_A });
    check(vacio.ok === false, 'un reclamo sin texto se rechaza', JSON.stringify(vacio));
    const ajeno = await llamar('tf_tool_registrar_reclamo',
      { instance: 'no-existe-' + SELLO, telefono: TEL_A, texto: 'hola' });
    check(ajeno.ok === false, 'una instancia desconocida no registra nada', JSON.stringify(ajeno));

    console.log('\n── A quién reactivar ──');
    const cand = await c.query('select * from public.tf_reactivacion_candidatos($1, 60, 50)', [empresa]);
    check(cand.rows.length === 2, 'los dos llevan 200 días sin volver y salen', 'salieron ' + cand.rows.length);
    check(cand.rows[0].dias_sin_volver >= 199, 'y dice cuántos días llevan', JSON.stringify(cand.rows[0]));

    const nadie = await c.query('select * from public.tf_reactivacion_candidatos($1, 365, 50)', [empresa]);
    check(nadie.rows.length === 0, 'con un umbral de 365 días no sale nadie', 'salieron ' + nadie.rows.length);

    console.log('\n── El que se dio de baja NO se toca ──');
    await c.query(`insert into public.outreach_optouts (company_id, phone, reason, source)
                   values ($1, $2, 'pidió que no le escribieran', 'prueba')`, [empresa, TEL_A]);
    const sinAna = await c.query('select * from public.tf_reactivacion_candidatos($1, 60, 50)', [empresa]);
    check(sinAna.rows.length === 1 && sinAna.rows[0].contact_id === cB,
      'quien se dio de baja desaparece de la lista', JSON.stringify(sinAna.rows.map((x) => x.nombre)));

    await c.query("update public.contacts set status = 'perdido' where id = $1", [cB]);
    const ninguno = await c.query('select * from public.tf_reactivacion_candidatos($1, 60, 50)', [empresa]);
    check(ninguno.rows.length === 0, 'y a quien el negocio marcó como perdido tampoco se le escribe',
      JSON.stringify(ninguno.rows.map((x) => x.nombre)));

  } finally {
    if (empresa) await c.query('delete from public.companies where id = $1', [empresa]);
    const queda = await c.query('select count(*)::int n from public.reclamos where company_id = $1', [empresa]);
    check(queda.rows[0].n === 0, 'al borrar la empresa se lleva sus reclamos (cascade)', 'quedan ' + queda.rows[0].n);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
