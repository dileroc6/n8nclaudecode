// ============================================================================
// ¿El agente sabe cómo le pagan a su negocio?
// ----------------------------------------------------------------------------
// Lo encontró una conversación de prueba, hace semanas:
//
//   cliente:  «listo me lleva 1 martillo. ¿a qué cuenta le consigno?»
//   agente:   «Para el pago por transferencia necesito que me confirmes y te
//              paso la cuenta.»
//
// No estaba siendo evasivo: **no tenía la cuenta**. Se arregló metiendo el
// cobro en el contexto… desde un archivo que PARCHEABA `tf_agente_contexto` por
// fuera. El 17-sep se reaplicó el archivo que sí la define —para arreglar la
// zona horaria— y el parche se borró en silencio. El agente volvió a quedarse
// sin saber cómo le pagan, y nadie se enteró.
//
// Por eso esta prueba no mira si el cobro «está configurado»: mira que **le
// llegue al agente en el contexto**, que es el sitio donde se pierde.
//
// Y prueba las dos fuentes, porque el 22-sep se creó una segunda sin saber que
// existía la primera: lo que prende la consola y lo que configura el cliente en
// su portal.
//
//   node pruebas/calidad/el-agente-sabe-como-le-pagan.cjs
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
    ["ZZ Cobro " + sello, "zz-cob-" + sello])).rows[0].id;
  const inst = "zz-cob-" + sello + "-sandbox";

  const cobro = async () => {
    const x = (await c.query("select tf_agente_contexto($1,'573001234567',true) x", [inst])).rows[0].x;
    return (x && x.config && x.config.cobro) || null;
  };

  try {
    await c.query(
      "insert into agent_config (company_id, whatsapp_instance, activo, herramientas) values ($1,$2,false,$3)",
      [emp, inst, ["paquete-tienda"]]);

    // ── Sin configurar ─────────────────────────────────────────────────────
    console.log("Un negocio que todavía no dijo cómo cobra:\n");
    let k = await cobro();
    check(k !== null,
      "el cobro LLEGA en el contexto — es donde se perdió dos veces",
      "no viene la clave `cobro` en `config`: el parche se volvió a borrar");
    check(k && k.configurado === false, "y dice que no está configurado", JSON.stringify(k));
    check(k && /NO inventes/i.test(k.que_decir || ""),
      "con la orden de NO inventarse una cuenta — alguien consignando a un número equivocado no se deshace",
      JSON.stringify(k && k.que_decir));

    // ── Lo que prende la consola ───────────────────────────────────────────
    console.log("\nLa consola le prende la transferencia:");
    await c.query(`insert into tienda_cobro (company_id, link, transferencia, efectivo, datos_cuenta)
      values ($1,false,true,false,'Bancolombia ahorros 111-222222-33')`, [emp]);
    k = await cobro();
    check(k.configurado === true && (k.metodos || []).includes("transferencia"),
      "llega la transferencia", JSON.stringify(k.metodos));
    check(k.datos_cuenta === "Bancolombia ahorros 111-222222-33",
      "y los datos de la cuenta, para poder dictarlos", JSON.stringify(k.datos_cuenta));
    check(/TAL CUAL/i.test(k.que_decir || ""),
      "con la orden de dictarlos TAL CUAL, sin resumir ni reordenar — un número de cuenta «mejorado» es plata perdida",
      JSON.stringify(k.que_decir));
    check(!(k.metodos || []).includes("link"),
      "y NO dice que hay link, porque no lo hay", JSON.stringify(k.metodos));

    // ── Lo que configura el CLIENTE en su portal ───────────────────────────
    console.log("\nY el cliente entra a su portal y pone su pasarela:");
    await c.query(`insert into private.tf_pasarela (company_id, proveedor, llaves)
      values ($1,'wompi',$2::jsonb)`,
      [emp, JSON.stringify({ llave_publica: "pub_x", link_pago: "https://checkout.wompi.co/l/zz" + sello })]);
    k = await cobro();
    // La consola dijo link=false, y eso es una DECISION: la fila solo existe si
    // alguien la guardo ahi. Un apagado explicito manda — encender el link
    // porque el cliente pego uno seria pasar por encima de esa decision.
    check(!(k.metodos || []).includes("link"),
      "el link NO se enciende solo: la consola lo apagó a propósito y un apagado explícito manda",
      JSON.stringify(k.metodos));

    console.log("\nY ahora la consola sí lo prende:");
    await c.query("update tienda_cobro set link = true where company_id = $1", [emp]);
    k = await cobro();
    check(k.link_pago === "https://checkout.wompi.co/l/zz" + sello,
      "le llega el link que puso el CLIENTE, no uno inventado — cada uno pone lo suyo",
      JSON.stringify(k.link_pago));
    check((k.metodos || []).includes("transferencia"),
      "sin perder la transferencia: las dos configuraciones dicen cosas distintas y las dos valen",
      JSON.stringify(k.metodos));

    console.log("\nY un cliente nuevo, sin nadie que haya tocado la consola:");
    const nueva = (await c.query(
      "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
      ["ZZ Nueva " + sello, "zz-nue-" + sello])).rows[0].id;
    const instN = "zz-nue-" + sello + "-sandbox";
    await c.query("insert into agent_config (company_id, whatsapp_instance, activo) values ($1,$2,false)", [nueva, instN]);
    await c.query(`insert into private.tf_pasarela (company_id, proveedor, llaves)
      values ($1,'transferencia',$2::jsonb)`,
      [nueva, JSON.stringify({ instrucciones: "Nequi 301 000 1111" })]);
    const kn = ((await c.query("select tf_agente_contexto($1,'573001234567',true) x", [instN])).rows[0].x.config || {}).cobro;
    check(kn && kn.configurado === true && (kn.metodos || []).includes("transferencia"),
      "ahí SÍ manda lo que configuró él solo — si no, configura su pasarela y su agente no se entera",
      JSON.stringify(kn));
    await c.query("delete from companies where id = $1", [nueva]);

    // ── Lo que pone el cliente manda ───────────────────────────────────────
    console.log("\nY si el cliente escribe su propia cuenta:");
    await c.query("delete from private.tf_pasarela where company_id = $1", [emp]);
    await c.query(`insert into private.tf_pasarela (company_id, proveedor, llaves)
      values ($1,'transferencia',$2::jsonb)`,
      [emp, JSON.stringify({ instrucciones: "Nequi 300 111 2233 a nombre de Yoga ZZ" })]);
    k = await cobro();
    check(k.datos_cuenta === "Nequi 300 111 2233 a nombre de Yoga ZZ",
      "manda la suya sobre la de la consola — conoce su propia cuenta mejor que nosotros",
      JSON.stringify(k.datos_cuenta));

    // ── Y que no haya dos definiciones otra vez ────────────────────────────
    console.log("\nY una sola definición:");
    const sql = fs.readdirSync(path.join(PLAT, "site", "supabase")).filter((f) => f.endsWith(".sql"));
    const definen = sql.filter((f) =>
      /create\s+or\s+replace\s+function\s+public\.tf_cobro_de/i
        .test(fs.readFileSync(path.join(PLAT, "site", "supabase", f), "utf8")));
    check(definen.length === 1,
      "solo un archivo define `tf_cobro_de`", "la definen: " + definen.join(", "));

    const parchean = sql.filter((f) => {
      const t = fs.readFileSync(path.join(PLAT, "site", "supabase", f), "utf8");
      return f !== "schema-agente-contexto.sql" &&
             /pg_get_functiondef|execute v_nuevo/.test(t) && /tf_agente_contexto/.test(t) &&
             !/YA NO HACE NADA/.test(t);
    });
    check(parchean.length === 0,
      "y nadie parchea `tf_agente_contexto` desde fuera — así se perdió el cobro el 17-sep",
      "lo parchean: " + parchean.join(", "));

    // ── Y lo otro que se perdio el mismo dia ───────────────────────────────
    // El 17-sep, reaplicar el archivo del contexto borro TRES parches a la vez.
    // El cobro era uno. Estos son los otros dos, y ninguno fallo al borrarse:
    // simplemente dejaron de estar.
    console.log("\nY los otros dos parches que se borraron el mismo día:");
    const vivo = (await c.query(
      "select prosrc s from pg_proc p join pg_namespace n on n.oid=p.pronamespace " +
      "where n.nspname='public' and p.proname='tf_agente_contexto'")).rows[0].s;

    check(/tf_agente_averiguado/.test(vivo),
      "el agente recuerda lo que averiguó en la conversación",
      "solo puede pedir UNA herramienta por mensaje: sin esto vuelve a preguntar lo que ya sabe");

    check(/c.instruccion/.test(vivo),
      "y lee la INSTRUCCIÓN de cada herramienta, no el texto de venta",
      "«deja de contestar déjame reviso veinte veces al día» no le dice al modelo cuándo llamar nada");

  } finally {
    await c.query("delete from companies where id = $1", [emp]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ El agente sabe cómo le pagan, de las dos fuentes, y no se inventa una cuenta.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
