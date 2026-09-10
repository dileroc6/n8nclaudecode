// Prueba las cuatro herramientas POR SU WEBHOOK, que es como las llama el
// agente. Monta su propia empresa y la borra al final.
const fs = require('fs');
const ROOT = 'C:/Proyectos/toque-flow/ToqueFlow/plataforma';
const env = {};
for (const l of fs.readFileSync(ROOT + '/credentials.env', 'utf8').split(/\r?\n/)) {
  const t = l.trim(); if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('='); if (i < 0) continue;
  let v = t.slice(i + 1).trim();
  if (/^["'].*["']$/.test(v)) v = v.slice(1, -1);
  env[t.slice(0, i).trim()] = v;
}
const BASE = String(process.env.N8N_API_URL).split('/api/v1')[0] + '/webhook/';
const { Client } = require(ROOT + '/node_modules/pg');

const fallos = [];
const check = (c, q, d) => { console.log((c ? '  OK  ' : '  MAL ') + q + (c ? '' : '   <- ' + d)); if (!c) fallos.push(q); };

const llamar = async (ruta, cuerpo, firma) => {
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(BASE + ruta, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'X-Toque-Signature': firma === undefined ? (env.TOQUE_AGENTE_FIRMA || '') : firma },
        body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(45000),
      });
      const t = await r.text();
      let j = null; try { j = JSON.parse(t); } catch (e) { j = t; }
      return { status: r.status, body: j };
    } catch (e) { if (i === 4) return { status: 0, body: e.message }; await new Promise((s) => setTimeout(s, 3000 * i)); }
  }
};
const res = (r) => (r.body && r.body.resultado) ? r.body.resultado : r.body;

const SELLO = Date.now().toString(36);
const INST = 'zz-tools-' + SELLO;
const TEL  = '573006' + String(Date.now()).slice(-6);

(async () => {
  const c = new Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const uno = async (s, a) => (await c.query(s, a)).rows[0];
  let empresa;
  try {
    empresa = (await uno("insert into public.companies (name, slug, status, metadata) values ($1,$2,'active','{\"vocabulario\":{\"unidad\":\"clase\",\"unidad_plural\":\"clases\"}}'::jsonb) returning id",
      ['ZZ Tools ' + SELLO, 'zz-tools-' + SELLO])).id;
    await c.query('insert into public.agent_config (company_id, whatsapp_instance, activo) values ($1,$2,true)', [empresa, INST]);
    const cid = (await uno("insert into public.contacts (company_id, phone, full_name, source) values ($1,$2,'Prueba tools','whatsapp') returning id", [empresa, TEL])).id;
    await c.query('insert into public.contact_saldo (contact_id, company_id, unidades) values ($1,$2,5)', [cid, empresa]);

    console.log('\n-- La firma protege las cuatro --');
    for (const ruta of ['tool-registrar-consumo','tool-matricular-cliente','tool-recargar-saldo','tool-registrar-reclamo']) {
      const sin = await llamar(ruta, { instance: INST, telefono: TEL }, 'firma-mala');
      check(sin.status === 403, ruta + ': sin la firma buena devuelve 403', 'HTTP ' + sin.status);
    }

    console.log('\n-- Descontar --');
    const d1 = await llamar('tool-registrar-consumo', { instance: INST, telefono: TEL, unidades: 1, referencia: 'w-1' });
    check(res(d1).ok === true && res(d1).quedan === 4, 'descuenta una y quedan 4', JSON.stringify(d1).slice(0, 200));
    const d2 = await llamar('tool-registrar-consumo', { instance: INST, telefono: TEL, unidades: 1, referencia: 'w-1' });
    check(res(d2).repetido === true, 'la misma referencia no se cobra dos veces', JSON.stringify(d2).slice(0, 200));

    console.log('\n-- Matricular y recargar NO aplican --');
    const m = await llamar('tool-matricular-cliente', { instance: INST, telefono: TEL, unidades: 10, que_compro: 'Paquete 10' });
    check(res(m).ok === true && res(m).aplicado === false, 'matricular deja solicitud y no aplica', JSON.stringify(m).slice(0, 200));
    const rr = await llamar('tool-recargar-saldo', { instance: INST, telefono: TEL, unidades: 3, dicho: 'ya pague' });
    check(res(rr).ok === true && res(rr).aplicado === false, 'recargar tampoco aplica', JSON.stringify(rr).slice(0, 200));
    const saldo = (await uno('select unidades from public.contact_saldo where contact_id = $1', [cid])).unidades;
    check(saldo === 4, 'el saldo NO se movio: sigue en 4', 'quedo en ' + saldo);

    console.log('\n-- Reclamo, con texto que trae comas --');
    const rc = await llamar('tool-registrar-reclamo', { instance: INST, telefono: TEL,
      texto: 'Pedi el lunes, me dijeron martes, y hoy es jueves', sobre: 'pedido' });
    check(res(rc).ok === true && res(rc).numero === 1, 'sale con numero 1 y aguanta las comas', JSON.stringify(rc).slice(0, 200));

  } finally {
    if (empresa) await c.query('delete from public.companies where id = $1', [empresa]);
    await c.end();
  }
  console.log(fallos.length === 0 ? '\n=== Todo paso ===' : '\n=== ' + fallos.length + ' fallaron ===');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
