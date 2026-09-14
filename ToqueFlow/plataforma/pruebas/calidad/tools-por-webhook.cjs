// Prueba las herramientas POR SU WEBHOOK, que es como las llama el agente.
// Monta su propia empresa y la borra al final.
//
// Que una funcion pase en la base no dice que la herramienta funcione: entre
// las dos estan la firma, el nodo que arma el jsonb y el de Postgres. Ahi es
// donde se rompen — un nombre con comas, una firma vencida, un parametro que
// el nodo parte en dos.
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

    // Una agenda para probar el pin: miércoles de 9 a 12, dos cupos, y un
    // servicio de una hora. Con dos cupos se puede mover una cita sin que se
    // bloquee a sí misma, que es el caso que importa.
    await c.query("insert into public.agenda_franjas (company_id, dia, desde, hasta, cupos) values ($1,3,'09:00','12:00',2)", [empresa]);
    await c.query("insert into public.agenda_servicios (company_id, nombre, minutos) values ($1,'Valoración',60)", [empresa]);
    const proxMiercoles = () => { const d = new Date(); d.setHours(0,0,0,0);
      do { d.setDate(d.getDate() + 1); } while (d.getDay() !== 3); return d; };
    const MIE = proxMiercoles();
    const aLas = (h) => { const d = new Date(MIE); d.setHours(h, 0, 0, 0); return d.toISOString(); };

    console.log('\n-- La firma las protege todas --');
    for (const ruta of ['tool-registrar-consumo','tool-matricular-cliente','tool-recargar-saldo','tool-registrar-reclamo',
                        'tool-buscar-catalogo','tool-crear-pedido','tool-estado-pedido','tool-confirmar-pago',
                        'tool-ver-disponibilidad','tool-agendar-cita','tool-confirmar-cita','tool-reagendar-cita']) {
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

    console.log('\n-- Tienda: buscar, pedir y consultar --');
    await c.query(`insert into public.productos (company_id, sku, nombre, descripcion, precio_cop, existencias, origen)
      values ($1,'W-1','Aceite de coco, prensado en frío','Frasco de 250 ml', 38000, 7, 'prueba'),
             ($1,'W-2','Aceite esencial de lavanda',null, 52000, null, 'prueba')`, [empresa]);

    const bc = await llamar('tool-buscar-catalogo', { instance: INST, telefono: TEL, que: 'aceite' });
    check(res(bc).ok === true && res(bc).encontrados === 2, 'encuentra los dos aceites', JSON.stringify(bc).slice(0, 220));
    check(res(bc).catalogo_al != null, 'y dice de cuándo es el catálogo', JSON.stringify(bc).slice(0, 220));

    // El nombre lleva comas a propósito: es lo que parte el nodo de Postgres
    // cuando los parámetros no viajan como un solo jsonb.
    const cp = await llamar('tool-crear-pedido', { instance: INST, telefono: TEL,
      dicho: 'quiero dos de coco, por favor', items: [{ sku: 'W-1', cantidad: 2, precio_cop: 9 }] });
    check(res(cp).ok === true && res(cp).total === 76000,
      'el precio sale del catálogo, no del modelo (2 × 38.000)', JSON.stringify(cp).slice(0, 220));
    check(res(cp).aplicado === false, 'y el pedido queda armado, no confirmado', JSON.stringify(cp).slice(0, 220));

    const ep = await llamar('tool-estado-pedido', { instance: INST, telefono: TEL });
    check(res(ep).tiene === true && res(ep).pedidos.length === 1, 'quien pidió ve su pedido', JSON.stringify(ep).slice(0, 220));

    const cf = await llamar('tool-confirmar-pago', { instance: INST, telefono: TEL,
      referencia: '4471', dicho: 'ya pagué, mando el soporte' });
    check(res(cf).ok === true && res(cf).pago_estado === 'reportado',
      'el pago queda anotado', JSON.stringify(cf).slice(0, 220));
    check(res(cf).verificado === false,
      'y viene marcado como NO verificado', JSON.stringify(cf).slice(0, 220));

    console.log('\n-- Agenda --');
    const disp = await llamar('tool-ver-disponibilidad', { instance: INST, servicio: 'Valoración', dias: 14 });
    check(res(disp).ok === true && res(disp).horas_libres.length >= 3,
      'ofrece las horas libres del miércoles', JSON.stringify(disp).slice(0, 220));

    const ag = await llamar('tool-agendar-cita', { instance: INST, telefono: TEL,
      servicio: 'Valoración', inicio: aLas(10), nombre: 'Prueba tools' });
    check(res(ag).ok === true, 'agenda la cita', JSON.stringify(ag).slice(0, 220));
    // El HECHO, no las palabras: la cita tiene que existir en la base.
    const hay = await uno("select count(*)::int n from public.appointments where company_id=$1 and estado<>'cancelada'", [empresa]);
    check(hay.n === 1, 'y la cita EXISTE en la base, no solo en la respuesta', JSON.stringify(hay));

    console.log('\n-- Mover, que es lo que pide la gente --');
    const mv = await llamar('tool-reagendar-cita', { instance: INST, telefono: TEL, nuevo_inicio: aLas(11) });
    check(res(mv).ok === true && res(mv).movida === true, 'mueve la cita a otra hora', JSON.stringify(mv).slice(0, 220));

    const donde = await uno("select inicio, confirmada_por_cliente, recordatorio_enviado_at from public.appointments where company_id=$1 and estado<>'cancelada'", [empresa]);
    const hora = new Date(donde.inicio).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false });
    check(hora === '11:00', 'y quedó a la hora nueva de verdad', 'quedó a las ' + hora);
    // Se movió: lo que había confirmado era la otra hora, y el recordatorio de
    // la nueva todavía no ha salido.
    check(donde.confirmada_por_cliente === null && donde.recordatorio_enviado_at === null,
      'moverla borra la confirmación y el recordatorio de la hora vieja', JSON.stringify(donde));

    const sigue = await uno("select count(*)::int n from public.appointments where company_id=$1 and estado<>'cancelada'", [empresa]);
    check(sigue.n === 1, 'y NO se duplicó: sigue habiendo UNA cita', JSON.stringify(sigue));

    const fuera = await llamar('tool-reagendar-cita', { instance: INST, telefono: TEL, nuevo_inicio: aLas(20) });
    check(res(fuera).ok === false, 'no la mueve a una hora en que el negocio no atiende', JSON.stringify(fuera).slice(0, 220));
    const quieta = await uno("select inicio from public.appointments where company_id=$1 and estado<>'cancelada'", [empresa]);
    check(new Date(quieta.inicio).getTime() === new Date(donde.inicio).getTime(),
      'y al fallar la deja donde estaba, no la pierde', 'se movió igual');

    const cc = await llamar('tool-confirmar-cita', { instance: INST, telefono: TEL, viene: true });
    check(res(cc).ok === true && res(cc).confirmada === true, 'confirma que viene', JSON.stringify(cc).slice(0, 220));

  } finally {
    if (empresa) await c.query('delete from public.companies where id = $1', [empresa]);
    await c.end();
  }
  console.log(fallos.length === 0 ? '\n=== Todo paso ===' : '\n=== ' + fallos.length + ' fallaron ===');
  process.exit(fallos.length === 0 ? 0 : 1);
})();
