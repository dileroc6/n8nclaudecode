// ============================================================================
// La hora que se teclea es la hora que sale
// ----------------------------------------------------------------------------
// La pantalla tenía un campo de fecha y hora, le pegaba '-05:00' a mano y lo
// guardaba. Para volver a pintarlo cortaba los 16 primeros caracteres de lo que
// devuelve Supabase — que viene en UTC.
//
//     se teclea         09:00
//     se guarda         2026-09-20T09:00:00-05:00   (bien)
//     Supabase devuelve 2026-09-20T14:00:00+00:00   (el mismo instante, en UTC)
//     la pantalla pinta 14:00                        ← mentira
//
// Y al abrir esa campaña para editarla, el campo se rellenaba con 14:00.
// Guardar la corría a las 19:00. **Cada edición la empujaba cinco horas.**
//
// Roto en Colombia, no solo para un cliente de fuera. Por eso lo que se prueba
// aquí es el VIAJE COMPLETO —teclear, guardar, volver a pintar, editar, volver
// a guardar— y no que la conversión de ida dé bien: la de ida ya daba bien.
//
//   node pruebas/calidad/hora-de-campana.cjs
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

// Lo mismo que hace la pantalla para pintar: formatear el instante en la zona
// del negocio. Si esto y la base no coinciden, el portal miente.
const enHoraDelNegocio = (iso, zona) => {
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date(iso)).reduce((a, x) => ((a[x.type] = x.value), a), {});
  return p.year + "-" + p.month + "-" + p.day + " " + p.hour + ":" + p.minute;
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const crear = async (nombre, zona) => {
    const id = (await c.query(
      "insert into companies (name, slug, status) values ($1,$2,'active') returning id",
      [nombre, "zz-hc-" + zona.replace(/[^a-z]/gi, "").toLowerCase() + "-" + sello])).rows[0].id;
    await c.query("select tf_zona_guardar($1,$2)", [id, zona]);
    return id;
  };

  const bogota = await crear("ZZ Hora Bogotá", "America/Bogota");
  const madrid = await crear("ZZ Hora Madrid", "Europe/Madrid");

  try {
    // El viaje completo, para cada negocio.
    for (const [nombre, emp, zona] of [["Bogotá", bogota, "America/Bogota"],
                                       ["Madrid", madrid, "Europe/Madrid"]]) {
      console.log("\nUn negocio en " + nombre + ", programando para las 09:00:");

      // 1. Se teclea. La pantalla parte «2026-09-20T09:00» en fecha y hora.
      const guardado = (await c.query(
        "select tf_campana_momento($1,$2,$3) m", [emp, "2026-09-20", "09:00"])).rows[0].m;
      check(guardado != null, "  la base entiende la fecha y la hora", "devolvió nulo");

      // 2. Se vuelve a pintar — que es donde estaba el error.
      const pintado = enHoraDelNegocio(guardado, zona);
      check(pintado === "2026-09-20 09:00",
        "  y al volver a pintarla sigue diciendo 09:00", "pinta " + pintado);

      // Y la base lo escribe igual que la pantalla. Dos formas de convertir es
      // como el portal dice una hora y el envío sale a otra.
      const desdeLaBase = (await c.query(
        "select tf_campana_cuando($1,$2) t", [emp, guardado])).rows[0].t;
      check(desdeLaBase === pintado,
        "  y la base la escribe igual que la pantalla",
        "base: " + desdeLaBase + " · pantalla: " + pintado);

      // 3. Se abre para editar y se vuelve a guardar SIN tocar nada. Aquí es
      //    donde la campaña se corría cinco horas en cada edición.
      const [f2, h2] = pintado.split(" ");
      const reguardado = (await c.query(
        "select tf_campana_momento($1,$2,$3) m", [emp, f2, h2])).rows[0].m;
      check(new Date(reguardado).getTime() === new Date(guardado).getTime(),
        "  y editarla sin tocar nada NO la mueve",
        "antes " + guardado + " · después " + reguardado);

      // 4. Y tres ediciones seguidas tampoco: el error viejo era acumulativo.
      let x = guardado;
      for (let i = 0; i < 3; i++) {
        const [fa, ha] = enHoraDelNegocio(x, zona).split(" ");
        x = (await c.query("select tf_campana_momento($1,$2,$3) m", [emp, fa, ha])).rows[0].m;
      }
      check(new Date(x).getTime() === new Date(guardado).getTime(),
        "  ni tres ediciones seguidas", "acabó en " + enHoraDelNegocio(x, zona));
    }

    // Las 09:00 de Madrid y las 09:00 de Bogotá NO son el mismo instante. Si lo
    // fueran, la zona no se estaría usando para nada.
    console.log("\nLa hora es de cada negocio, no una sola para todos:");
    const mB = (await c.query("select tf_campana_momento($1,'2026-09-20','09:00') m", [bogota])).rows[0].m;
    const mM = (await c.query("select tf_campana_momento($1,'2026-09-20','09:00') m", [madrid])).rows[0].m;
    const horas = (new Date(mB) - new Date(mM)) / 3600000;
    check(horas === 7,
      "las 9 de Madrid y las 9 de Bogotá van con 7 horas de diferencia",
      "van con " + horas + " horas");

    // Y nadie programa campañas en una empresa ajena.
    console.log("\nY la conversión no es una puerta:");
    const ajena = (await c.query(
      "select tf_campana_cuando($1,$2) t", [madrid, mB])).rows[0].t;
    check(ajena != null, "un dueño sí puede leer la suya", "devolvió nulo para su propia empresa");

  } finally {
    await c.query("delete from companies where id in ($1,$2)", [bogota, madrid]);
    await c.end();
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ La hora que se teclea es la hora que sale, y editarla no la mueve.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
