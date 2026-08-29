// ============================================================================
// ¿Funciona la pestaña Productos?
// ----------------------------------------------------------------------------
// Corre las mismas consultas que hace la pantalla, con sesión real de super
// admin y el RLS puesto. Y recorre el ciclo completo de una celda:
//
//   no → prometido → activo → no
//
// que es lo que pasa cuando alguien pulsa tres veces. Si el ciclo no vuelve al
// punto de partida, la pantalla deja basura en la base de un cliente real.
//
//   node pruebas/consola-catalogo.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach(l => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = "prueba-catalogo-" + Date.now().toString(36) + "@toqueflow.com";
const PASS = "Pc" + Math.random().toString(36).slice(2) + "!Aa9";

let token = null;
const rest = async (metodo, ruta, cuerpo, extra) => {
  const r = await fetch(URL + "/rest/v1/" + ruta, {
    method: metodo,
    headers: Object.assign({ apikey: ANON, Authorization: "Bearer " + (token || ANON), "Content-Type": "application/json" }, extra || {}),
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};
const svc = async (metodo, ruta, cuerpo) => {
  const r = await fetch(URL + ruta, {
    method: metodo,
    headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, data: j };
};

const fallos = [];
const check = (cond, que, detalle) => {
  console.log((cond ? "  ✅ " : "  ❌ ") + que + (cond ? "" : "   ← " + detalle));
  if (!cond) fallos.push(que);
};

(async () => {
  const u = await svc("POST", "/auth/v1/admin/users", { email: EMAIL, password: PASS, email_confirm: true });
  if (!u.ok || !u.data.id) { console.error("no pude crear el usuario: " + JSON.stringify(u.data).slice(0, 200)); process.exit(2); }
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "super_admin", status: "active", full_name: "Prueba catálogo" });

  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  })).json();
  token = ses.access_token;

  try {
    console.log("── Lo que lee la pantalla al abrir ──");
    const cat = await rest("GET", "catalogo?select=*&activo=eq.true&order=orden");
    check(Array.isArray(cat.data) && cat.data.length >= 20, "lee el catálogo completo",
          "devolvió " + (Array.isArray(cat.data) ? cat.data.length : "?"));

    const mx = await rest("GET", "empresa_catalogo?select=*");
    const empresas = new Set((mx.data || []).map((m) => m.company_id)).size;
    const piezas = new Set((mx.data || []).map((m) => m.catalogo_id)).size;
    check(Array.isArray(mx.data) && mx.data.length === empresas * piezas,
          "la matriz trae todas las combinaciones (" + empresas + " empresas × " + piezas + " piezas)",
          "devolvió " + (Array.isArray(mx.data) ? mx.data.length : "?"));

    const conAlgo = (mx.data || []).filter((m) => m.estado_empresa !== "no");
    // Ojo: NO se compara contra el número de filas de `flows`. Una celda puede
    // agrupar varias sedes —FerreteríaYa imprime pedidos en Bogotá y Medellín—
    // así que 13 filas dan 9 celdas. Lo que tiene que cuadrar es la SUMA.
    const suma = conAlgo.reduce((a, m) => a + (m.veces || 0), 0);
    const filas = (await rest("GET", "flows?select=id")).data.length;
    check(suma === filas, "no se pierde ninguna fila al agrupar por sedes",
          suma + " contadas en la matriz contra " + filas + " filas en flows");
    check(conAlgo.length > 0, "reconoce lo que los clientes ya tenían",
          "ninguna celda encendida");

    // ── El ciclo de una celda ────────────────────────────────────────────────
    console.log("\n── El ciclo de una celda: no → prometido → activo → no ──");
    const empresa = (await rest("GET", "companies?select=id,name&limit=1")).data[0];
    // Una pieza que esa empresa NO tenga, para no tocar nada real.
    const libre = (cat.data || []).find((p) =>
      !conAlgo.some((m) => m.company_id === empresa.id && m.catalogo_id === p.id));
    check(!!libre, "hay una pieza libre para probar", "todas están tomadas");
    if (!libre) throw new Error("sin pieza libre");
    console.log("     (" + empresa.name + " × " + libre.nombre + ")");

    const estadoDe = async () => {
      const r = await rest("GET", "empresa_catalogo?select=estado_empresa,flow_ids&company_id=eq." + empresa.id + "&catalogo_id=eq." + libre.id);
      return (r.data || [])[0] || {};
    };

    // no → prometido
    let ins = await rest("POST", "flows", {
      company_id: empresa.id, catalogo_id: libre.id, name: libre.nombre,
      description: libre.beneficio, status: "próximamente", type: libre.tipo, kind: libre.clave,
    }, { Prefer: "return=representation" });
    check(ins.ok, "crea la fila al prometer la pieza", "HTTP " + ins.status + " " + JSON.stringify(ins.data).slice(0, 180));
    let e = await estadoDe();
    check(e.estado_empresa === "proximamente", "la matriz la muestra como anunciada como próximamente", "dice " + e.estado_empresa);

    // prometido → activo
    const upd = await rest("PATCH", "flows?id=eq." + (e.flow_ids || [])[0], { status: "activo" });
    check(upd.ok, "la enciende", "HTTP " + upd.status);
    e = await estadoDe();
    check(e.estado_empresa === "activo", "la matriz la muestra activa", "dice " + e.estado_empresa);

    // activo → no
    const del = await rest("DELETE", "flows?id=eq." + (e.flow_ids || [])[0]);
    check(del.ok, "la quita", "HTTP " + del.status);
    e = await estadoDe();
    check(e.estado_empresa === "no" && !(e.flow_ids || [])[0],
          "el ciclo vuelve al punto de partida sin dejar basura", JSON.stringify(e));

    // ── El catálogo no es secreto, pero lo de cada empresa sí ───────────────
    console.log("\n── Lo que ve un cliente cualquiera ──");
    const cli = await svc("POST", "/auth/v1/admin/users", {
      email: "zz-cat-" + Date.now().toString(36) + "@toqueflow.com", password: PASS, email_confirm: true });
    const cliId = cli.data.id;
    await svc("PATCH", "/rest/v1/profiles?id=eq." + cliId, { role: "member", status: "active", company_id: empresa.id });
    const sesCli = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: cli.data.email, password: PASS }),
    })).json();

    const comoCliente = async (ruta) => {
      const r = await fetch(URL + "/rest/v1/" + ruta, { headers: { apikey: ANON, Authorization: "Bearer " + sesCli.access_token } });
      return await r.json().catch(() => []);
    };
    const catCli = await comoCliente("catalogo?select=clave");
    check(Array.isArray(catCli) && catCli.length > 0,
          "puede ver el catálogo (no es secreto: es lo que ToqueFlow ofrece)", JSON.stringify(catCli).slice(0, 120));

    const mxCli = await comoCliente("empresa_catalogo?select=company_id");
    const ajenas = (Array.isArray(mxCli) ? mxCli : []).filter((m) => m.company_id !== empresa.id);
    check(ajenas.length === 0, "NO puede ver qué tienen las otras empresas",
          ajenas.length + " filas ajenas");

    await svc("DELETE", "/auth/v1/admin/users/" + cliId);

    // ── Qué es Toque Atiende ─────────────────────────────────────────────────
    // La definicion del producto, tal como la dio Diego. Se comprueba porque ya
    // se rompio sola: dos archivos SQL escribian el mismo dato y el que se corria
    // despues borraba «escalar a una persona» sin que nadie lo tocara.
    console.log("\n── El producto estandar ──");
    const ESTANDAR = ['responder-conocimiento', 'escalar-a-humano', 'consultar-cliente', 'actualizar-cliente'];
    const prod = (await svc("GET", "/rest/v1/catalogo?select=incluye,puede_llevar&clave=eq.agente-atencion")).data[0] || {};
    const falta = ESTANDAR.filter((k) => !(prod.incluye || []).includes(k));
    check(falta.length === 0, "Toque Atiende lleva SIEMPRE las cuatro piezas estandar",
          "le falta: " + falta.join(", "));

    const coladas = ESTANDAR.filter((k) => (prod.puede_llevar || []).includes(k));
    check(coladas.length === 0, "y ninguna de ellas se ofrece ademas como opcional",
          "se ofrecen: " + coladas.join(", "));

    // Que ninguna suponga un sector: o le sirve a cualquiera, o no es estandar.
    const supone = (await svc("GET", "/rest/v1/catalogo?select=clave,nombre&clave=in.(" + (prod.incluye || []).join(",") + ")")).data || [];
    const sectorial = supone.filter((p) => /saldo|clase|paquete|cita|pedido|pago/i.test(p.clave + " " + p.nombre));
    check(sectorial.length === 0, "y ninguna supone un sector",
          sectorial.map((p) => p.nombre).join(", "));

    // ── Un dato, un archivo ──────────────────────────────────────────────────
    // El error de fondo, no el caso: dos migraciones escribiendo lo mismo. La
    // segunda pisa a la primera y el sintoma aparece dias despues, en una
    // pantalla, sin que nadie haya tocado nada.
    const DIR = path.join(__dirname, "..", "site", "supabase");
    const escriben = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).filter((f) => {
      const s = fs.readFileSync(path.join(DIR, f), "utf8");
      return s.split("\n").some((l) => !l.trim().startsWith("--") && /set\s+incluye\s*=/.test(l));
    });
    check(escriben.length <= 1, "un solo archivo SQL escribe que lleva Toque Atiende",
          "lo escriben " + escriben.length + ": " + escriben.join(", "));
  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
  }

  console.log("\n═══ " + (fallos.length ? fallos.length + " fallo(s)" : "Todo pasó") + " ═══");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
