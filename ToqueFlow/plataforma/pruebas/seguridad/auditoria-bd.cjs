// ============================================================================
// Auditoría de la base: quién puede ver y hacer qué
// ----------------------------------------------------------------------------
// Las pruebas de aislamiento comprueban casos concretos —esta empresa no ve a
// esta otra— y eso está bien, pero solo cubre lo que a uno se le ocurrió mirar.
// Esto es al revés: recorre TODO lo que existe y marca lo que se sale de la
// regla. Encuentra la tabla que alguien creó ayer y olvidó proteger.
//
// Un aviso que costó una versión de este archivo: **los permisos no se leen,
// se intentan.** La primera versión listaba los GRANT y daba 33 hallazgos
// graves — todos falsos. Supabase le concede a `anon` permisos amplios sobre
// todas las tablas a propósito y deja que RLS sea el que decide. Mirar el
// GRANT dice quién tiene la llave; solo intentar entrar dice si la puerta
// abre. Aquí se intenta.
//
// Lo que revisa:
//
//   1. Toda tabla con datos de clientes tiene RLS encendido.
//   2. Toda vista es `security_invoker` — si no, la ejecuta su dueño, que se
//      salta RLS. Ya pasó con `agent_runtime`: la tabla protegida y la vista
//      encima, no.
//   3. Ninguna función SECURITY DEFINER sin `search_path` fijo.
//   4. Con la LLAVE PÚBLICA, de verdad: no se puede leer, escribir ni borrar
//      en ninguna tabla, ni ejecutar ninguna función que haga algo.
//   5. `n8n_worker` no puede borrar ni tocar la autenticación.
//
//   node pruebas/auditoria-bd.cjs
// ============================================================================
const fs = require("fs");
const path = require("path");
const PLAT = path.join(__dirname, "..", "..");

fs.readFileSync(path.join(PLAT, "credentials.env"), "utf8").split("\n").forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
});

const { Client } = require("pg");
const URL = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const ANON = process.env.SUPABASE_ANON_KEY;

const hallazgos = [];
const anota = (gravedad, que, detalle) => hallazgos.push({ gravedad, que, detalle });

const bloque = (t) => console.log("\n── " + t + " " + "─".repeat(Math.max(0, 62 - t.length)));
const ok = (s) => console.log("  ✅ " + s);
const mal = (s) => console.log("  ❌ " + s);

// Con la llave pública y NINGUNA sesión: es lo que tiene cualquiera que abra
// el HTML del portal y mire el código fuente.
const comoAnon = async (metodo, ruta, cuerpo) => {
  const r = await fetch(URL + "/rest/v1/" + ruta, {
    method: metodo,
    headers: { apikey: ANON, Authorization: "Bearer " + ANON, "Content-Type": "application/json", Prefer: "return=representation" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { status: r.status, ok: r.ok, data: j };
};

(async () => {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // ── 1. RLS en todas las tablas ─────────────────────────────────────────────
  bloque("RLS: toda tabla protegida");
  const tablas = (await c.query(`
    select c.relname as tabla, c.relrowsecurity as rls,
           (select count(*) from pg_policies p where p.tablename = c.relname and p.schemaname = 'public') as politicas
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname`)).rows;

  const sinRls = tablas.filter((t) => !t.rls);
  if (!sinRls.length) ok(tablas.length + " tablas, todas con RLS encendido");
  for (const t of sinRls) {
    mal(t.tabla + " NO tiene RLS");
    anota("alta", "tabla sin RLS: " + t.tabla, "Con la llave publica se lee entera.");
  }
  for (const t of tablas.filter((t) => t.rls && Number(t.politicas) === 0)) {
    console.log("  ⚠️  " + t.tabla + ": RLS encendido y cero políticas (nadie puede leerla ni escribirla)");
  }

  // ── 2. Vistas con security_invoker ─────────────────────────────────────────
  bloque("Vistas: ninguna se salta el RLS de sus tablas");
  const vistas = (await c.query(`
    select c.relname as vista,
           coalesce((select option_value from pg_options_to_table(c.reloptions)
                     where option_name = 'security_invoker'), 'false') as invoker
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
    order by c.relname`)).rows;

  const fugas = vistas.filter((v) => v.invoker !== "true" && v.invoker !== "on");
  if (!fugas.length) ok(vistas.length + " vistas, todas con security_invoker");
  for (const v of fugas) {
    mal(v.vista + " se ejecuta como su DUEÑO — se salta el RLS de sus tablas");
    anota("alta", "vista sin security_invoker: " + v.vista,
      "Es el bug de agent_runtime: la tabla protegida y la vista encima, no.");
  }

  // ── 3. SECURITY DEFINER con search_path ────────────────────────────────────
  bloque("Funciones SECURITY DEFINER");
  const definers = (await c.query(`
    select p.proname as fn, pg_get_function_identity_arguments(p.oid) as args,
           coalesce(array_to_string(p.proconfig, ' '), '') as config
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef order by p.proname`)).rows;

  const sinPath = definers.filter((d) => !/search_path/.test(d.config));
  if (!sinPath.length) ok(definers.length + " funciones SECURITY DEFINER, todas con search_path fijo");
  for (const d of sinPath) {
    mal(d.fn + "(" + d.args + ") sin search_path fijo");
    anota("media", "SECURITY DEFINER sin search_path: " + d.fn,
      "Corre con permisos de quien la creo; sin search_path se le puede cambiar a que tabla apunta.");
  }

  // ── 4. Lo que de verdad puede hacer cualquiera con la llave pública ────────
  bloque("Con la llave pública, intentándolo de verdad");

  // Se intenta LEER, ESCRIBIR y BORRAR en cada tabla y vista. Un 200 al leer
  // con filas es una fuga; un 200 al escribir es peor.
  const todas = tablas.map((t) => t.tabla).concat(vistas.map((v) => v.vista)).sort();
  let leyó = 0, escribió = 0;

  // Una fila real por tabla, para poder intentar borrarla de verdad. Solo de
  // las tablas que tienen `id` uuid; las demás se saltan y se dice.
  const borrables = {};
  for (const t of tablas.map((x) => x.tabla)) {
    const tieneId = await c.query(`select 1 from information_schema.columns
      where table_schema='public' and table_name=$1 and column_name='id'`, [t]);
    if (!tieneId.rowCount) continue;
    const fila = await c.query("select id from public." + t + " limit 1").catch(() => ({ rows: [] }));
    if (fila.rows.length) borrables[t] = fila.rows[0].id;
  }

  for (const t of todas) {
    const lee = await comoAnon("GET", t + "?select=*&limit=1");
    if (lee.ok && Array.isArray(lee.data) && lee.data.length) {
      // El catálogo es a propósito público: es lo que ToqueFlow ofrece, no
      // datos de nadie. Cualquier otra cosa que devuelva filas es una fuga.
      if (t === "catalogo" || t === "catalogo_detalle") {
        console.log("  ℹ️  " + t + " se lee sin sesión, y es a propósito (es el catálogo de ToqueFlow)");
      } else {
        mal("LEE " + t + " — " + lee.data.length + " fila(s) sin ninguna sesión");
        anota("alta", "fuga de lectura: " + t, "Devuelve datos con solo la llave publica del HTML.");
        leyó++;
      }
    }

    // Escribir. La fila va a propósito con basura: si RLS no la para, el error
    // sera de columnas y no de permisos, y eso tambien hay que verlo.
    const mete = await comoAnon("POST", t, { id: "00000000-0000-0000-0000-000000000000" });
    if (mete.ok) {
      mal("ESCRIBE en " + t + " sin ninguna sesión");
      anota("alta", "escritura abierta: " + t, "Cualquiera con la llave publica mete filas.");
      escribió++;
      await c.query("delete from public." + t + " where id = '00000000-0000-0000-0000-000000000000'").catch(() => {});
    }

    // Borrar se prueba contra una fila que EXISTE. Un DELETE que RLS filtra a
    // cero filas devuelve 200 igual, asi que probarlo con un id inventado no
    // prueba nada — que fue el error de la primera version de este archivo.
    if (borrables[t]) {
      const antes = borrables[t];
      await comoAnon("DELETE", t + "?id=eq." + antes);
      const sigue = await c.query("select 1 from public." + t + " where id = $1", [antes]);
      if (!sigue.rowCount) {
        mal("BORRA en " + t + " sin ninguna sesión");
        anota("alta", "borrado abierto: " + t, "Cualquiera con la llave publica borra filas de un cliente.");
      }
    }
  }
  if (!leyó && !escribió) ok(todas.length + " tablas y vistas: ninguna deja leer ni escribir sin sesión");

  // Las funciones que anon puede ejecutar. La regla no es «suena a datos» —eso
  // daba falsos y escondia el hallazgo de verdad— sino la que importa:
  //
  //   anon no ejecuta NADA que pueda escribir.
  //
  // Lo dice Postgres en `provolatile`: 'v' = volatile = puede tener efectos.
  // Asi salio el unico hallazgo real de la primera auditoria:
  // `tf_run_due_campaigns`, que metia eventos de envio de WhatsApp en el outbox
  // y la podia llamar cualquiera con la llave publica del HTML.
  //
  // Lo que solo LEE se mira aparte y con la cabeza: una constante no es una
  // fuga; una lista de contactos si.
  const anonFn = (await c.query(`
    select p.proname as fn, p.provolatile as vol, p.prosecdef as definer
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')
      and p.prokind = 'f' and p.prorettype <> 'trigger'::regtype
    order by p.proname`)).rows;

  const escritoras = anonFn.filter((f) => f.vol === 'v');
  if (!escritoras.length) ok("anon no puede ejecutar ninguna función que escriba");
  for (const f of escritoras) {
    mal("anon puede ejecutar " + f.fn + ", que es VOLATILE — puede tener efectos");
    anota("alta", "anon ejecuta algo que escribe: " + f.fn,
      "anon es cualquiera en internet: la llave publica esta en el HTML del portal.");
  }

  // Y de las que solo leen, se comprueba que no devuelvan datos de nadie.
  const lectoras = anonFn.filter((f) => f.vol !== 'v');
  if (lectoras.length) {
    console.log("\n  " + lectoras.length + " función(es) de solo lectura que anon puede llamar:");
    for (const f of lectoras) {
      const r = await comoAnon("POST", "rpc/" + f.fn, {});
      if (!r.ok) { console.log("    ·  " + f.fn + " — necesita argumentos o la rechaza (HTTP " + r.status + ")"); continue; }
      const salida = JSON.stringify(r.data);
      // Un escalar suelto no es una fuga: es una constante o un `false`. Lo
      // que hay que mirar son objetos y listas, que es donde caben los datos
      // de un inquilino.
      const esCosa = r.data !== null && typeof r.data === 'object';
      if (esCosa && salida !== "{}" && salida !== "[]") {
        mal("    " + f.fn + " devuelve una estructura a quien no tiene sesión: " + salida.slice(0, 120));
        anota("alta", "anon lee por " + f.fn, salida.slice(0, 200));
      } else {
        console.log("    ✅ " + f.fn + " — " + (salida === "null" ? "nada" : salida.slice(0, 40)));
      }
    }
  }

  // ── 5. El techo del worker ─────────────────────────────────────────────────
  bloque("n8n_worker: hasta dónde llega si algo sale mal");
  if (!(await c.query("select 1 from pg_roles where rolname = 'n8n_worker'")).rowCount) {
    console.log("  ⚠️  el rol n8n_worker no existe en esta base");
  } else {
    const borra = (await c.query(`
      select table_name from information_schema.role_table_grants
      where grantee = 'n8n_worker' and privilege_type = 'DELETE' and table_schema = 'public'
      order by table_name`)).rows.map((r) => r.table_name);
    if (!borra.length) ok("no puede borrar en ninguna tabla");
    for (const t of borra) {
      mal("puede DELETE en " + t);
      anota("alta", "n8n_worker borra en " + t, "Un workflow equivocado borra datos de un cliente que paga.");
    }

    const auth = (await c.query(`
      select table_schema || '.' || table_name as t from information_schema.role_table_grants
      where grantee = 'n8n_worker' and table_schema in ('auth', 'storage') order by 1`)).rows.map((r) => r.t);
    if (!auth.length) ok("no alcanza los esquemas auth ni storage");
    for (const t of auth) {
      mal("alcanza " + t);
      anota("alta", "n8n_worker alcanza " + t, "El worker no tiene por que ver usuarios ni contrasenas.");
    }

    if (!(await c.query(`select 1 from information_schema.role_table_grants
      where grantee = 'n8n_worker' and table_name = 'profiles' and table_schema = 'public'`)).rowCount) {
      ok("no ve la tabla de perfiles");
    } else {
      mal("ve public.profiles");
      anota("media", "n8n_worker ve profiles", "Ahi estan los correos y roles de los usuarios del portal.");
    }

    const poder = (await c.query(`select rolsuper, rolcreaterole, rolcreatedb, rolbypassrls
      from pg_roles where rolname = 'n8n_worker'`)).rows[0];
    const excesos = Object.entries(poder).filter(([, v]) => v).map(([k]) => k);
    if (!excesos.length) ok("sin superusuario, sin crear roles, sin saltarse RLS");
    for (const e of excesos) {
      mal("tiene " + e);
      anota("alta", "n8n_worker con " + e, "Es un rol de worker: no deberia tener eso.");
    }
  }

  await c.end();

  console.log("\n" + "═".repeat(70));
  if (!hallazgos.length) {
    console.log("✅ La base pasa las cinco reglas.");
  } else {
    const altas = hallazgos.filter((h) => h.gravedad === "alta");
    console.log("❌ " + hallazgos.length + " hallazgo(s), " + altas.length + " grave(s):\n");
    for (const h of hallazgos) {
      console.log("  [" + h.gravedad.toUpperCase() + "] " + h.que);
      console.log("          " + h.detalle);
    }
  }
  process.exitCode = hallazgos.some((h) => h.gravedad === "alta") ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
