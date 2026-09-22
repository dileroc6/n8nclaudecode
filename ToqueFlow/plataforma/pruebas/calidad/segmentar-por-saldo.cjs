// ============================================================================
// «Te queda una clase, ¿te recargo?» — la campaña que Toque Recargas no podía armar
// ----------------------------------------------------------------------------
// El pin ya hacía su trabajo: el agente matricula, descuenta y deja las recargas
// pedidas, hay dónde aprobarlas, y `contactos.html` muestra quién tiene cuánto y
// a quién le vence pronto.
//
// Pero ahí se acababa: **se veía a quién se le estaban acabando las clases y no
// se le podía escribir.** La campaña más obvia de un estudio no se podía armar
// porque la segmentación no sabía nada de saldos. El dato estaba; la acción no.
//
// Lo que más se prueba aquí es a quién NO hay que escribirle. Un mensaje de
// «te queda una clase» a alguien que nunca compró un paquete es la clase de
// error que hace que el negocio apague las campañas para siempre.
//
//   node pruebas/calidad/segmentar-por-saldo.cjs
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
    ["ZZ Estudio de yoga", "zz-sal-" + sello])).rows[0].id;

  const quienes = async (f) => (await c.query(
    "select full_name from tf_campana_destinatarios($1,$2::jsonb,null) order by full_name",
    [emp, JSON.stringify(f)])).rows.map((x) => x.full_name);

  try {
    const alta = async (n, tel) => (await c.query(
      `insert into contacts (company_id, phone, full_name, status)
       values ($1,$2,$3,'activo') returning id`, [emp, tel, n])).rows[0].id;
    const conSaldo = async (id, unidades, venceEnDias) => c.query(
      `insert into contact_saldo (contact_id, company_id, unidades, vence)
       values ($1,$2,$3, case when $4::int is null then null
                              else (timezone(tf_zona($2), now()) + make_interval(days => $4::int))::date end)`,
      [id, emp, unidades, venceEnDias]);

    console.log("Un estudio de yoga con cinco alumnas:\n");

    const ana  = await alta("Ana Una Clase",    "573001110001"); await conSaldo(ana, 1, 40);
    const bea  = await alta("Bea Se Acabó",     "573001110002"); await conSaldo(bea, 0, 60);
    const caro = await alta("Caro Le Sobra",    "573001110003"); await conSaldo(caro, 20, 200);
    const dani = await alta("Dani Vence Pronto","573001110004"); await conSaldo(dani, 8, 5);
    await alta("Eva Nunca Compró", "573001110005");   // sin fila de saldo, a propósito

    // ── Se les están acabando ──────────────────────────────────────────────
    console.log("A quién se le están acabando:");
    const pocas = await quienes({ saldo: { hasta: 2 } });
    check(pocas.includes("Ana Una Clase") && pocas.includes("Bea Se Acabó"),
      "salen la que tiene una y la que ya no tiene ninguna", JSON.stringify(pocas));
    check(!pocas.includes("Caro Le Sobra"), "y no la que tiene veinte", JSON.stringify(pocas));

    // ESTO es lo que no puede fallar. Decirle «te queda una clase» a alguien que
    // nunca compró un paquete es como el negocio apaga las campañas para siempre.
    check(!pocas.includes("Eva Nunca Compró"),
      "y NO la que nunca compró un paquete — «te queda una clase» a quien nunca tuvo ninguna es el mensaje que quema la herramienta",
      JSON.stringify(pocas));

    // ── Solo las que se acabaron ───────────────────────────────────────────
    const cero = await quienes({ saldo: { hasta: 0 } });
    check(cero.length === 1 && cero[0] === "Bea Se Acabó",
      "y se puede pedir solo las que ya se acabaron — el cero es un valor, no «sin filtro»",
      JSON.stringify(cero));

    // ── Vencimientos ───────────────────────────────────────────────────────
    console.log("\nA quién se le vence el paquete:");
    const vencen = await quienes({ saldo_vence: { en_dias: 15 } });
    check(vencen.length === 1 && vencen[0] === "Dani Vence Pronto",
      "sale la que vence en 5 días", JSON.stringify(vencen));
    check(!vencen.includes("Ana Una Clase") && !vencen.includes("Caro Le Sobra"),
      "y no las que vencen en 40 o en 200", JSON.stringify(vencen));

    // Lo ya vencido no es un aviso, es un reclamo: es otra conversación y otro
    // mensaje, y mezclarlas hace quedar mal al negocio.
    const feli = await alta("Feli Ya Venció", "573001110006");
    await c.query(`insert into contact_saldo (contact_id, company_id, unidades, vence)
      values ($1,$2,5,(timezone(tf_zona($2), now()) - interval '10 days')::date)`, [feli, emp]);
    const trasVencido = await quienes({ saldo_vence: { en_dias: 15 } });
    check(!trasVencido.includes("Feli Ya Venció"),
      "lo YA vencido no entra: eso no es un aviso, es un reclamo", JSON.stringify(trasVencido));

    // ── Y se combina con lo demás ──────────────────────────────────────────
    console.log("\nY se combina con el resto:");
    await c.query("update contacts set last_contact_at = now() where company_id=$1 and full_name='Ana Una Clase'", [emp]);
    await c.query("update contacts set last_contact_at = now() - interval '120 days' where company_id=$1 and full_name='Bea Se Acabó'", [emp]);
    const dormidasSinSaldo = await quienes({ saldo: { hasta: 2 }, ultimo_contacto: { hace_mas_de_dias: 90 } });
    check(dormidasSinSaldo.length === 1 && dormidasSinSaldo[0] === "Bea Se Acabó",
      "«se le acabó Y lleva meses sin venir» se puede armar", JSON.stringify(dormidasSinSaldo));

    // ── Las bajas, también aquí ────────────────────────────────────────────
    await c.query(`insert into outreach_optouts (company_id, phone, reason, source)
                   values ($1,'573001110001','pidió no recibir','prueba')`, [emp]);
    const trasBaja = await quienes({ saldo: { hasta: 2 } });
    check(!trasBaja.includes("Ana Una Clase"),
      "quien pidió no recibir queda fuera también de esta", JSON.stringify(trasBaja));

    // ── Y los presets de la pantalla ───────────────────────────────────────
    console.log("\nLos botones de la pantalla:");
    const html = fs.readFileSync(path.join(PLAT, "site", "campanas.html"), "utf8");
    const bloque = html.slice(html.indexOf("const RESCATES = {"), html.indexOf("async function armarRescate"));
    check(/seacaban:/.test(bloque) && /vencen:/.test(bloque),
      "existen los dos de Recargas", "faltan en RESCATES");
    check(/saldo:\s*\{\s*hasta:\s*2\s*\}/.test(bloque),
      "y usan el mismo umbral que se probó aquí", "la pantalla y la prueba contarían distinto");

  } finally {
    await c.query("delete from outreach_optouts where company_id = $1", [emp]);
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Se le puede escribir a quien se le están acabando, y solo a quien compró.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
