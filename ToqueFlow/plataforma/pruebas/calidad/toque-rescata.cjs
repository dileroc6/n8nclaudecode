// ============================================================================
// Toque Rescata: la plata que ya estaba y se está yendo
// ----------------------------------------------------------------------------
// Las tres piezas existían sueltas. Esto prueba que juntas cuentan bien y, sobre
// todo, que **el número que enseña la pantalla es exactamente el que recibe la
// campaña**.
//
// Eso es lo que más fácil se rompe: contar por un lado y enviar por otro es como
// el negocio ve «12 personas», le da a enviar, y salen 9. Aquí las dos cosas
// salen de la misma función a propósito, y esta prueba lo comprueba en vez de
// confiar en que siga así.
//
// También prueba lo que NO debe pasar: que «falta configurarlo» se vea igual que
// «no hay ninguna». Enseñar un 0 donde nadie ha mirado es decirle al negocio que
// no tiene nada pendiente.
//
//   node pruebas/calidad/toque-rescata.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const sello = Date.now().toString(36);

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const emp = (await c.query(
    "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
    ["ZZ Rescata", "zz-res-" + sello])).rows[0].id;

  const pendiente = async () =>
    (await c.query("select tf_rescate_pendiente($1,3) r", [emp])).rows[0].r;
  const quienes = async (f) => (await c.query(
    "select full_name from tf_campana_destinatarios($1,$2::jsonb,null) order by full_name",
    [emp, JSON.stringify(f)])).rows.map((x) => x.full_name);

  try {
    // ── El paquete existe y se puede vender ────────────────────────────────
    console.log("El paquete:");
    const p = (await c.query(
      "select nombre, contiene, precio_cop, requiere, liberado, vendible, tool_url from catalogo where clave='paquete-rescata'")).rows[0];
    check(!!p, "Toque Rescata está en el catálogo", "no existe");
    check(p && p.contiene.length === 3,
      "y trae sus tres piezas", p ? JSON.stringify(p.contiene) : "");
    check(p && p.vendible && p.liberado, "se puede vender y está liberado", JSON.stringify(p));
    check(p && p.requiere === "paquete-agenda",
      "y depende de la agenda: dos de sus tres piezas no significan nada sin ella",
      p ? String(p.requiere) : "");

    // Las piezas que dice contener tienen que existir de verdad. Un paquete que
    // promete una pieza que no está es exactamente cómo se le vende a un
    // cliente algo que no hay.
    const faltan = (await c.query(
      "select x from unnest($1::text[]) x where not exists (select 1 from catalogo where clave = x)",
      [p.contiene])).rows.map((r) => r.x);
    check(faltan.length === 0, "y cada pieza que promete existe", "faltan: " + faltan.join(", "));

    // ── Sin nada configurado ───────────────────────────────────────────────
    console.log("\nUn negocio recién dado de alta:");
    let r = await pendiente();
    check(r.ok === true, "contesta", JSON.stringify(r));
    check(r.huecos.hay_agenda === false,
      "dice que NO hay agenda configurada, en vez de enseñar 0 horas libres",
      JSON.stringify(r.huecos));
    check(r.propuestas.configurado === false && r.propuestas.cuantos === null,
      "y que las propuestas no están configuradas — nulo, no cero: «nadie ha mirado» no es «no hay ninguna»",
      JSON.stringify(r.propuestas));

    // ── Se configura ───────────────────────────────────────────────────────
    for (let d = 0; d < 7; d++) {
      await c.query(`insert into agenda_franjas (company_id, dia, desde, hasta, cupos)
                     values ($1,$2,'09:00','17:00',1) on conflict do nothing`, [emp, d]);
    }
    await c.query(`insert into agenda_servicios (company_id, nombre, minutos)
                   values ($1,'Valoración',60) on conflict do nothing`, [emp]);
    await c.query(`insert into contact_campos (company_id, clave, etiqueta, tipo, orden)
                   values ($1,'propuesta_fecha','Fecha de la propuesta','fecha',10)
                   on conflict do nothing`, [emp]);

    console.log("\nQué campo guarda la fecha de la propuesta:");
    const malo = (await c.query("select tf_rescate_config($1,'no_existe',7) r", [emp])).rows[0].r;
    check(malo.ok === false,
      "no acepta un campo que no existe: guardarlo dejaría el seguimiento sin encontrar nunca a nadie, y eso se lee como «no tengo propuestas»",
      JSON.stringify(malo));

    const bueno = (await c.query("select tf_rescate_config($1,'propuesta_fecha',7) r", [emp])).rows[0].r;
    check(bueno.ok === true, "y sí acepta el que el negocio creó", JSON.stringify(bueno));

    // ── La gente ───────────────────────────────────────────────────────────
    const hace = (d) => new Date(Date.now() - d * 86400000).toISOString();
    const alta = async (n, tel, meta) => (await c.query(
      `insert into contacts (company_id, phone, full_name, status, metadata)
       values ($1,$2,$3,'prospecto',coalesce($4,'{}'::jsonb)) returning id`,
      [emp, tel, n, meta ? JSON.stringify(meta) : null])).rows[0].id;

    const falto   = await alta("Ana Faltó",     "573001110001");
    const vino    = await alta("Beto Vino",     "573001110002");
    await alta("Cris Propuesta", "573001110003", { propuesta_fecha: hace(20) });
    await alta("Dani Propuesta Ayer", "573001110004", { propuesta_fecha: hace(1) });

    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'Valoración', now() - interval '5 days', now() - interval '5 days' + interval '1 hour','no_asistio')`,
      [emp, falto]);
    await c.query(`insert into appointments (company_id, contact_id, servicio, inicio, fin, estado)
      values ($1,$2,'Valoración', now() - interval '5 days', now() - interval '5 days' + interval '1 hour','asistio')`,
      [emp, vino]);

    console.log("\nLo que se está perdiendo:");
    r = await pendiente();
    check(r.huecos.hay_agenda === true && r.huecos.horas > 0,
      "hay horas que van a quedar vacías", JSON.stringify(r.huecos).slice(0, 120));
    check(r.plantones.cuantos === 1,
      "y una persona que faltó y no ha vuelto", "dice " + r.plantones.cuantos);
    check(r.propuestas.cuantos === 1,
      "y una propuesta de hace más de 7 días sin respuesta", "dice " + r.propuestas.cuantos);

    // ── LO IMPORTANTE: el número que enseña es el que recibe ───────────────
    console.log("\nEl número que se enseña es el que recibe la campaña:");

    const dePlantones = await quienes({ no_asistio: { hace_menos_de_dias: 90 }, sin_cita_futura: true });
    check(dePlantones.length === r.plantones.cuantos && dePlantones[0] === "Ana Faltó",
      "plantones: el botón le escribe exactamente a los que cuenta la tarjeta",
      "tarjeta dice " + r.plantones.cuantos + ", campaña " + JSON.stringify(dePlantones));

    const dePropuestas = await quienes({ campo_fecha: { clave: "propuesta_fecha", hace_mas_de_dias: 7 } });
    check(dePropuestas.length === r.propuestas.cuantos && dePropuestas[0] === "Cris Propuesta",
      "propuestas: igual, y deja fuera la de ayer",
      "tarjeta dice " + r.propuestas.cuantos + ", campaña " + JSON.stringify(dePropuestas));

    const deHuecos = await quienes({ sin_cita_futura: true });
    check(deHuecos.length === r.huecos.a_quien_ofrecer,
      "huecos: a cuántos dice que se les puede ofrecer, a esos les escribe",
      "tarjeta dice " + r.huecos.a_quien_ofrecer + ", campaña " + deHuecos.length);

    // ── Y una baja no entra por ningún rescate ─────────────────────────────
    console.log("\nY quien pidió no recibir queda fuera de los tres:");
    await c.query(`insert into outreach_optouts (company_id, phone, reason, source)
                   values ($1,'573001110001','pidió no recibir','prueba')`, [emp]);
    const tras = await pendiente();
    check(tras.plantones.cuantos === 0,
      "la tarjeta de plantones ya no lo cuenta — si lo contara, el negocio vería una persona que nunca va a recibir nada",
      "dice " + tras.plantones.cuantos);
    check((await quienes({ no_asistio: { hace_menos_de_dias: 90 }, sin_cita_futura: true })).length === 0,
      "y la campaña tampoco", "");

    // ── Y los presets de la pantalla son los mismos filtros ────────────────
    console.log("\nLos botones de la pantalla mandan estos mismos filtros:");
    const HTML = fs.readFileSync(path.join(PLAT, "site", "campanas.html"), "utf8");
    const bloque = HTML.slice(HTML.indexOf("const RESCATES = {"), HTML.indexOf("async function armarRescate"));
    for (const clave of ["huecos", "plantones", "propuestas"]) {
      check(bloque.includes(clave + ":"), "«" + clave + "» está en la pantalla", "no aparece en RESCATES");
    }
    check(/no_asistio:\s*\{\s*hace_menos_de_dias:\s*90\s*\}/.test(bloque) && /sin_cita_futura:\s*true/.test(bloque),
      "y el de plantones usa la misma ventana que la tarjeta (90 días)",
      "la pantalla y la tarjeta contarían distinto");

    const AG = fs.readFileSync(path.join(PLAT, "site", "agenda.html"), "utf8");
    for (const clave of ["huecos", "plantones", "propuestas"]) {
      check(AG.includes("campanas.html?rescate=" + clave),
        "y desde la agenda se llega a «" + clave + "» con un clic", "falta el enlace");
    }

  } finally {
    await c.query("delete from outreach_optouts where company_id = $1", [emp]);
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Toque Rescata cuenta y escribe con la misma definición.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
