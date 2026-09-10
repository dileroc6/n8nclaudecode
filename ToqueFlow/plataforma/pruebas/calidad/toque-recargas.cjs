/* ============================================================================
 * Toque Recargas: matricular · descontar · recargar
 * ----------------------------------------------------------------------------
 * LO QUE ESTA PRUEBA EXISTE PARA PROTEGER, y es una sola frase:
 *
 *   el agente puede QUITAR saldo solo, y no puede SUBIRLO nunca.
 *
 * Si algún día alguien "simplifica" matricular o recargar para que apliquen de
 * una, esta prueba tiene que ponerse roja. Es la regla que separa un agente
 * útil de un agente que regala.
 *
 * Corre contra la base de verdad, con una empresa y un contacto propios que se
 * borran al final. No toca ningún cliente real.
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
const INSTANCIA = 'zz-recargas-' + SELLO;
const TELEFONO  = '573009' + String(Date.now()).slice(-6);

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (sql, args) => (await c.query(sql, args)).rows[0];

  let empresa, contacto, usuario;
  try {
    console.log('\n── Montando una empresa de prueba ──');
    empresa = (await uno(
      `insert into public.companies (name, slug, status, metadata)
       values ($1, $2, 'active', '{"vocabulario":{"unidad":"clase","unidad_plural":"clases"}}'::jsonb)
       returning id`, ['ZZ Recargas ' + SELLO, 'zz-recargas-' + SELLO])).id;
    await c.query(
      `insert into public.agent_config (company_id, whatsapp_instance, activo)
       values ($1, $2, true)`, [empresa, INSTANCIA]);
    contacto = (await uno(
      `insert into public.contacts (company_id, phone, full_name, source)
       values ($1, $2, 'Persona de prueba', 'whatsapp') returning id`, [empresa, TELEFONO])).id;
    check(!!empresa && !!contacto, 'empresa, agente y contacto creados', 'algo quedó nulo');

    // Un miembro de verdad, porque aprobar exige sesión. Se borra al final:
    // una prueba que deja usuarios vivos acaba siendo un problema de
    // seguridad, no de orden.
    const admin = async (metodo, ruta, cuerpo) => {
      const r = await fetch(env.SUPABASE_URL + '/auth/v1/admin/' + ruta, {
        method: metodo,
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                   Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
                   'Content-Type': 'application/json' },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      });
      const t = await r.text();
      let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
      return { ok: r.ok, data: j };
    };
    const creado = await admin('POST', 'users', {
      email: 'zz-recargas-' + SELLO + '@toqueflow.com',
      password: 'Prueba-' + SELLO + '-Ax9', email_confirm: true });
    usuario = creado.data && creado.data.id;
    check(!!usuario, 'se creó el usuario que va a aprobar', JSON.stringify(creado.data).slice(0, 160));
    if (usuario) await c.query('update public.profiles set company_id = $1 where id = $2', [empresa, usuario]);
    const borrarUsuario = async () => { if (usuario) await admin('DELETE', 'users/' + usuario); };

    const llamar = async (fn, payload) =>
      (await uno('select public.' + fn + '($1::jsonb) as r', [JSON.stringify(payload)])).r;
    const saldoDe = async () =>
      (await uno('select coalesce(unidades, 0) n from public.contact_saldo where contact_id = $1', [contacto]) || { n: 0 }).n;

    // ── Lo que más importa ───────────────────────────────────────────────────
    console.log('\n── La regla: el agente no puede subir el saldo ──');

    const mat = await llamar('tf_tool_matricular_cliente',
      { instance: INSTANCIA, telefono: TELEFONO, unidades: 10, que_compro: 'Paquete 10 clases', dicho: 'ya consigné' });
    check(mat.ok === true, 'matricular acepta la solicitud', JSON.stringify(mat));
    check(mat.aplicado === false, 'matricular NO aplica: lo dice explícito', JSON.stringify(mat));
    check((await saldoDe()) === 0, 'y el saldo sigue en cero', 'el agente subió el saldo solo — es el fallo que esta prueba existe para cazar');

    const rec = await llamar('tf_tool_recargar_saldo',
      { instance: INSTANCIA, telefono: TELEFONO, unidades: 5, dicho: 'súbeme 5' });
    check(rec.ok === true && rec.aplicado === false, 'recargar tampoco aplica', JSON.stringify(rec));
    check((await saldoDe()) === 0, 'el saldo sigue en cero después de pedir recarga', 'subió sin que nadie aprobara');

    const pend = await c.query('select count(*)::int n from public.saldo_solicitudes where company_id = $1 and estado = $2', [empresa, 'pendiente']);
    check(pend.rows[0].n === 2, 'quedan las dos solicitudes esperando aprobación', 'hay ' + pend.rows[0].n);

    console.log('\n── No se avisa tres veces de lo mismo ──');
    await llamar('tf_tool_recargar_saldo', { instance: INSTANCIA, telefono: TELEFONO, unidades: 8, dicho: 'insisto' });
    const pend2 = await c.query("select unidades from public.saldo_solicitudes where company_id = $1 and tipo = 'recarga' and estado = 'pendiente'", [empresa]);
    check(pend2.rows.length === 1, 'insistir actualiza la solicitud, no crea otra', 'hay ' + pend2.rows.length);
    check(pend2.rows[0].unidades === 8, 'y se queda con lo último que dijo', JSON.stringify(pend2.rows[0]));

    console.log('\n── Quién puede aprobar, y quién no ──');
    // Este bloque existe por un fallo real: la primera versión del candado
    // usaba `not (es_admin or empresa = mi_empresa)`, y con un usuario sin
    // empresa esa condición daba NULL — un IF con condición nula no se
    // dispara, así que dejaba pasar justo a quien no debía.
    const sol0 = (await uno("select id from public.saldo_solicitudes where company_id = $1 and tipo = 'matricula'", [empresa])).id;

    const sinSesion = (await uno('select public.tf_saldo_resolver($1, true, null) as r', [sol0])).r;
    check(sinSesion.ok === false, 'sin sesión no se puede aprobar', JSON.stringify(sinSesion));
    check((await saldoDe()) === 0, 'y el saldo no se movió', 'quedó en ' + (await saldoDe()));

    // Con la sesión de alguien SIN empresa: es el caso que se colaba.
    await c.query("select set_config('request.jwt.claims', $1, false)",
      [JSON.stringify({ sub: '00000000-0000-0000-0000-000000000009', role: 'authenticated' })]);
    const colado = (await uno('select public.tf_saldo_resolver($1, true, null) as r', [sol0])).r;
    check(colado.ok === false, 'un usuario sin empresa tampoco', JSON.stringify(colado));
    check((await saldoDe()) === 0, 'y el saldo sigue sin moverse', 'quedó en ' + (await saldoDe()));
    await c.query("select set_config('request.jwt.claims', '', false)");

    console.log('\n── Una persona aprueba ──');
    const sol = (await uno("select id from public.saldo_solicitudes where company_id = $1 and tipo = 'matricula'", [empresa])).id;
    // Con la sesión de un miembro de ESA empresa, que es el camino real.
    await c.query("select set_config('request.jwt.claims', $1, false)",
      [JSON.stringify({ sub: usuario, role: 'authenticated' })]);
    const apro = (await uno('select public.tf_saldo_resolver($1, true, $2) as r', [sol, 'consignación verificada'])).r;
    check(apro.ok === true && apro.estado === 'aprobada', 'la aprobación pasa', JSON.stringify(apro));
    check((await saldoDe()) === 10, 'ahora sí el saldo subió a 10', 'quedó en ' + (await saldoDe()));

    const dosveces = (await uno('select public.tf_saldo_resolver($1, true, null) as r', [sol])).r;
    check(dosveces.ok === false, 'no se puede aprobar dos veces la misma', JSON.stringify(dosveces));
    check((await saldoDe()) === 10, 'y el saldo no se duplicó', 'quedó en ' + (await saldoDe()));

    console.log('\n── Descontar: eso sí lo hace el agente solo ──');
    const con1 = await llamar('tf_tool_registrar_consumo',
      { instance: INSTANCIA, telefono: TELEFONO, unidades: 1, motivo: 'asistió', referencia: 'msg-1' });
    check(con1.ok === true && con1.quedan === 9, 'descuenta una y quedan 9', JSON.stringify(con1));
    check(con1.unidad === 'clases', 'y lo dice con la palabra del negocio', JSON.stringify(con1));

    const con2 = await llamar('tf_tool_registrar_consumo',
      { instance: INSTANCIA, telefono: TELEFONO, unidades: 1, referencia: 'msg-1' });
    check(con2.repetido === true && (await saldoDe()) === 9,
      'la misma referencia no se cobra dos veces', 'quedó en ' + (await saldoDe()) + ' — un reintento de n8n le costaría una clase al cliente');

    await llamar('tf_tool_registrar_consumo', { instance: INSTANCIA, telefono: TELEFONO, unidades: 99, referencia: 'msg-2' });
    check((await saldoDe()) === 0, 'descontar más de lo que hay deja en cero, no en negativo', 'quedó en ' + (await saldoDe()));

    const vacio = await llamar('tf_tool_registrar_consumo', { instance: INSTANCIA, telefono: TELEFONO, referencia: 'msg-3' });
    check(vacio.ok === false, 'sin saldo lo dice, no inventa', JSON.stringify(vacio));

    console.log('\n── El libro cuadra ──');
    const libro = await c.query(
      'select coalesce(sum(unidades), 0)::int suma, count(*)::int n from public.saldo_movimientos where company_id = $1', [empresa]);
    check(libro.rows[0].suma === 0, 'la suma del libro da el saldo actual (0)', 'da ' + libro.rows[0].suma);
    check(libro.rows[0].n === 3, 'y quedaron las tres líneas: matrícula y dos consumos', 'hay ' + libro.rows[0].n);

    console.log('\n── Lo que no debe pasar ──');
    const ajeno = await llamar('tf_tool_registrar_consumo', { instance: 'no-existe-' + SELLO, telefono: TELEFONO });
    check(ajeno.ok === false, 'una instancia desconocida no descuenta nada', JSON.stringify(ajeno));

    const sinCuantas = await llamar('tf_tool_matricular_cliente', { instance: INSTANCIA, telefono: TELEFONO });
    check(sinCuantas.ok === false, 'matricular sin decir cuántas unidades se rechaza', JSON.stringify(sinCuantas));

  } finally {
    await c.query("select set_config('request.jwt.claims', '', false)").catch(() => {});
    if (usuario) {
      await fetch(env.SUPABASE_URL + '/auth/v1/admin/users/' + usuario, {
        method: 'DELETE',
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                   Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
      }).catch(() => {});
    }
    if (empresa) await c.query('delete from public.companies where id = $1', [empresa]);
    const queda = await c.query('select count(*)::int n from public.saldo_solicitudes where company_id = $1', [empresa]);
    check(queda.rows[0].n === 0, 'al borrar la empresa se lleva sus solicitudes (cascade)', 'quedan ' + queda.rows[0].n);
    await c.end();
  }

  console.log(fallos.length === 0 ? '\n═══ Todo pasó ═══' : '\n═══ ' + fallos.length + ' fallaron ═══');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
