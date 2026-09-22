// ============================================================================
// El negocio carga su catálogo, y no toca el del vecino
// ----------------------------------------------------------------------------
// `public.productos` existe desde que existe Toque Tienda y `buscar-catalogo`
// lee de ahí. Pero la tabla solo tenía política de LECTURA: el cliente veía su
// catálogo y **no había forma de meterlo**. Ningún archivo del portal escribía
// en ella, solo las pruebas. El pin se vendía y no se podía estrenar sin que
// alguien entrara a la base.
//
// Lo que más se prueba aquí no es que cargue: es **lo que NO puede pasar**. Un
// catálogo mal cargado no da un error visible — da un agente diciendo precios
// equivocados, o callándose sobre productos que sí hay. Y quien sube un archivo
// parcial no puede perder lo que no venía en él.
//
//   node pruebas/seguridad/cargar-su-catalogo.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sello = Date.now().toString(36);

let token = null;
const rest = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m,
    headers: { apikey: ANON, Authorization: "Bearer " + (token || ANON),
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const rpc = (fn, args) => rest("POST", "/rest/v1/rpc/" + fn, args);
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE,
                          "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const crear = async (n) => {
    const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + sello;
    await svc("POST", "/rest/v1/companies", { name: n, slug, status: "active" });
    return (await svc("GET", "/rest/v1/companies?select=id&slug=eq." + slug)).data[0].id;
  };
  const mia = await crear("ZZ Catalogo Mia");
  const vecina = await crear("ZZ Catalogo Vecina");

  await svc("POST", "/rest/v1/productos",
    { company_id: vecina, sku: "VEC-1", nombre: "Producto del vecino", precio_cop: 50000, activo: true });
  const delVecino = (await svc("GET", "/rest/v1/productos?select=id&company_id=eq." + vecina)).data[0].id;

  const email = "zz-cat-" + sello + "@toqueflow.com";
  const pass = "Zc" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  const mios = async () => (await rest("GET",
    "/rest/v1/productos?select=sku,nombre,precio_cop,existencias,activo,categoria&company_id=eq." + mia + "&order=sku")).data || [];

  try {
    console.log("Con sesión de miembro:\n");
    console.log("Cargar por primera vez:");

    const r1 = await rpc("tf_productos_importar", { p_company: mia, p_filas: [
      { sku: "MAR-001", nombre: "Martillo de uña 16oz", precio: "28900", existencias: "12", categoria: "Herramienta" },
      { sku: "TAL-220", nombre: "Taladro percutor 650W", precio: "189000", existencias: "3", categoria: "Herramienta" },
    ]});
    check(r1.data && r1.data.ok === true && r1.data.nuevos === 2,
      "carga los dos productos", JSON.stringify(r1.data).slice(0, 180));

    let hay = await mios();
    check(hay.length === 2 && hay[0].nombre === "Martillo de uña 16oz",
      "y quedan en su catálogo", JSON.stringify(hay.map((p) => p.sku)));

    // ── Volver a cargar no duplica ─────────────────────────────────────────
    console.log("\nVolver a cargar la misma lista con un precio nuevo:");
    const r2 = await rpc("tf_productos_importar", { p_company: mia, p_filas: [
      { sku: "MAR-001", nombre: "Martillo de uña 16oz", precio: "31900", existencias: "8" },
    ]});
    check(r2.data.nuevos === 0 && r2.data.actualizados === 1,
      "lo reconoce por el código y lo actualiza, no lo duplica", JSON.stringify(r2.data).slice(0, 150));

    hay = await mios();
    check(hay.length === 2, "el catálogo sigue teniendo dos, no cuatro", hay.length + " productos");
    check(Number(hay.find((p) => p.sku === "MAR-001").precio_cop) === 31900,
      "y el precio cambió", JSON.stringify(hay.find((p) => p.sku === "MAR-001")));

    // LO QUE NO PUEDE PASAR: que subir una lista parcial borre el resto.
    check(hay.some((p) => p.sku === "TAL-220"),
      "el que NO venía en el archivo sigue ahí — un negocio que suba solo las novedades del mes no puede perder su catálogo",
      JSON.stringify(hay.map((p) => p.sku)));

    // Y que una columna ausente no vacíe lo que ya había.
    check(hay.find((p) => p.sku === "MAR-001").categoria === "Herramienta",
      "ni una columna que falta vacía lo que ya estaba",
      JSON.stringify(hay.find((p) => p.sku === "MAR-001")));

    // ── Lo que no se guarda ────────────────────────────────────────────────
    console.log("\nLo que NO se guarda, y por qué:");
    const r3 = await rpc("tf_productos_importar", { p_company: mia, p_filas: [
      { sku: "", nombre: "Sin código", precio: "1000" },
      { sku: "X-1", nombre: "", precio: "1000" },
      { sku: "X-2", nombre: "Precio raro", precio: "como 30 mil" },
      { sku: "X-3", nombre: "Precio negativo", precio: "-500" },
      { sku: "OK-1", nombre: "Este sí", precio: "1000" },
    ]});
    check(r3.data.rechazados === 4 && r3.data.nuevos === 1,
      "rechaza los cuatro malos y guarda el bueno", JSON.stringify(r3.data).slice(0, 200));

    const motivos = JSON.stringify(r3.data.detalle || []);
    check(/código|sku/i.test(motivos) && /nombre/i.test(motivos) && /número/i.test(motivos),
      "y dice de cada uno por qué, no «error»", motivos.slice(0, 220));

    // Un precio que no se entiende NO puede quedar en cero: el agente lo diría
    // en voz alta y el negocio regalaría el producto.
    const raro = (await mios()).find((p) => p.sku === "X-2");
    check(!raro, "un precio que no se entiende no entra como cero", JSON.stringify(raro));

    // ── Apagar, no borrar ──────────────────────────────────────────────────
    console.log("\nApagar un producto:");
    const idMar = (await rest("GET", "/rest/v1/productos?select=id&company_id=eq." + mia + "&sku=eq.MAR-001")).data[0].id;
    const ap = await rpc("tf_producto_activo", { p_producto: idMar, p_activo: false });
    check(ap.data && ap.data.ok === true, "se puede apagar", JSON.stringify(ap.data));
    const trasApagar = (await mios()).find((p) => p.sku === "MAR-001");
    check(trasApagar && trasApagar.activo === false,
      "y se queda ahí apagado, no se borra: si vuelve en temporada se enciende otra vez",
      JSON.stringify(trasApagar));

    // ── Lo del vecino ──────────────────────────────────────────────────────
    console.log("\nLo del vecino:");
    const ve = await rest("GET", "/rest/v1/productos?select=sku&company_id=eq." + vecina);
    check((ve.data || []).length === 0, "no ve su catálogo", JSON.stringify(ve.data));

    const colar = await rpc("tf_productos_importar", { p_company: vecina, p_filas: [
      { sku: "COLADO", nombre: "Producto colado", precio: "1" },
    ]});
    const trasColar = (await svc("GET", "/rest/v1/productos?select=sku&company_id=eq." + vecina)).data || [];
    check(trasColar.length === 1 && trasColar[0].sku === "VEC-1",
      "NO puede meterle productos — un precio ajeno puesto por otro es lo que el agente diría en voz alta",
      JSON.stringify(trasColar.map((p) => p.sku)) + " · respuesta " + JSON.stringify(colar.data).slice(0, 120));

    const tocar = await rpc("tf_producto_ajustar", { p_producto: delVecino, p_precio: 1, p_existencias: 0 });
    const precioVecino = (await svc("GET", "/rest/v1/productos?select=precio_cop&id=eq." + delVecino)).data[0];
    check(Number(precioVecino.precio_cop) === 50000,
      "ni cambiarle el precio a uno suyo", "quedó en " + precioVecino.precio_cop +
      " · respuesta " + JSON.stringify(tocar.data).slice(0, 120));

    const apagarVecino = await rpc("tf_producto_activo", { p_producto: delVecino, p_activo: false });
    const sigueVivo = (await svc("GET", "/rest/v1/productos?select=activo&id=eq." + delVecino)).data[0];
    check(sigueVivo.activo === true,
      "ni apagarle uno — eso le esconde un producto al agente del vecino",
      JSON.stringify(apagarVecino.data).slice(0, 120));

    // ── Y que la pantalla exista ───────────────────────────────────────────
    console.log("\nY la pantalla:");
    const html = fs.readFileSync(path.join(PLAT, "site", "productos.html"), "utf8");
    check(/tf_productos_importar/.test(html), "productos.html carga el catálogo",
      "la función existe y no la llama nadie — que era el problema");
    check(/tf_producto_ajustar/.test(html) && /tf_producto_activo/.test(html),
      "y deja tocar precio, existencias y encendido", "falta alguna");

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Carga el suyo, no pierde lo que no venía, y no toca el del vecino.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
