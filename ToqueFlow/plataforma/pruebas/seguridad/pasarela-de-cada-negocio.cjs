// ============================================================================
// Cada negocio con su pasarela, y las llaves que no salen del servidor
// ----------------------------------------------------------------------------
// Hasta hoy había UNA pasarela para toda la plataforma: las llaves de ePayco de
// Bejauha vivían como secretos globales de la edge function. Funciona con un
// cliente y se rompe con dos — el segundo negocio que cobrara estaría cobrando
// a la cuenta del primero.
//
// Lo que se guarda aquí son **llaves con las que se mueve plata**, así que hay
// dos cosas que probar y la segunda es la que casi nunca se prueba:
//
//   1. que un negocio no vea ni toque la pasarela de otro
//   2. que **NADIE las pueda leer de vuelta**, ni su propio dueño desde el
//      portal. Una llave privada que el navegador puede pedir viaja en cada
//      carga de la pantalla, queda en la caché, y sale en cualquier captura que
//      el cliente mande por WhatsApp pidiendo ayuda
//
//   node pruebas/seguridad/pasarela-de-cada-negocio.cjs
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

// Una llave inventada, con forma de llave de verdad. Tiene que ser buscable
// entera en cualquier respuesta: de eso se trata la prueba.
const SECRETA = "prv_test_" + sello + "_NOESREAL_4821";

let token = null;
const rest = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m,
    headers: { apikey: ANON, Authorization: "Bearer " + (token || ANON),
               "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, texto: t, data: j };
};
const rpc = (fn, args) => rest("POST", "/rest/v1/rpc/" + fn, args);
const svc = async (m, ruta, body) => {
  const r = await fetch(URL + ruta, {
    method: m, headers: { apikey: SERVICE, Authorization: "Bearer " + SERVICE,
                          "Content-Type": "application/json", Prefer: "return=representation" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  return { ok: r.ok, status: r.status, texto: t, data: j };
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
  const mia = await crear("ZZ Pasarela Mia");
  const vecina = await crear("ZZ Pasarela Vecina");

  const email = "zz-pas-" + sello + "@toqueflow.com";
  const pass = "Zp" + sello + "!Aa9";
  const u = await svc("POST", "/auth/v1/admin/users", { email, password: pass, email_confirm: true });
  const uid = u.data.id;
  await svc("PATCH", "/rest/v1/profiles?id=eq." + uid, { role: "member", status: "active", company_id: mia });
  const ses = await (await fetch(URL + "/auth/v1/token?grant_type=password", {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass }),
  })).json();
  token = ses.access_token;

  try {
    console.log("Con sesión de miembro, que es lo que tiene el negocio:\n");
    console.log("Elegir su pasarela:");

    const lista = await rest("GET", "/rest/v1/pasarelas_soportadas?select=clave,nombre,campos&order=orden");
    check(lista.ok && (lista.data || []).length >= 6,
      "ve las pasarelas que puede elegir", "HTTP " + lista.status + " · " + (lista.data || []).length);
    check((lista.data || [])[0] && lista.data[0].clave === "transferencia",
      "y la primera es transferencia/Nequi: es la que más se usa y no cuesta comisión — " +
      "enseñar primero las pasarelas haría creer que hace falta una para vender",
      JSON.stringify((lista.data || [])[0]));

    const g = await rpc("tf_pasarela_guardar", {
      p_company: mia, p_proveedor: "wompi",
      p_llaves: { llave_publica: "pub_test_visible", llave_privada: SECRETA,
                  secreto_eventos: "evt_" + sello, link_pago: "https://checkout.wompi.co/l/abc" },
    });
    check(g.data && g.data.ok === true, "guarda la suya", JSON.stringify(g.data).slice(0, 160));
    check(g.data && g.data.completa === true, "y le dice que ya puede cobrar", JSON.stringify(g.data));

    // ── LO QUE MÁS IMPORTA: no se puede leer de vuelta ─────────────────────
    console.log("\nY ahora lo que casi nunca se prueba — ¿se puede leer de vuelta?");

    const ver = await rpc("tf_pasarela_ver", { p_company: mia });
    check(!ver.texto.includes(SECRETA),
      "NO devuelve la llave privada ni a su propio dueño",
      "la devolvió entera: " + ver.texto.slice(0, 200));
    check(ver.data && ver.data.llaves && String(ver.data.llaves.llave_privada || "").startsWith("····"),
      "la devuelve tapada, con los últimos cuatro para reconocerla",
      JSON.stringify(ver.data && ver.data.llaves));
    check(ver.data && ver.data.llaves && ver.data.llaves.llave_publica === "pub_test_visible",
      "y lo que NO es secreto sí se ve — si no, el negocio no sabría qué puso",
      JSON.stringify(ver.data && ver.data.llaves));

    // Y no hay puerta trasera por la API.
    const tabla = await rest("GET", "/rest/v1/tf_pasarela?select=*");
    check(!tabla.ok || !tabla.texto.includes(SECRETA),
      "la tabla no existe para la API: vive en `private`, que no está expuesto",
      "HTTP " + tabla.status + " " + tabla.texto.slice(0, 140));

    const puerta = await rpc("tf_pasarela_del_slug", { p_slug: "zz-pasarela-mia-" + sello });
    check(!puerta.texto.includes(SECRETA),
      "y la función que SÍ las devuelve en claro no la puede llamar el portal — es solo para el receptor de pagos",
      "HTTP " + puerta.status + " " + puerta.texto.slice(0, 160));

    // ── El blanco no borra ─────────────────────────────────────────────────
    console.log("\nCambiar solo el link de pago:");
    const g2 = await rpc("tf_pasarela_guardar", {
      p_company: mia, p_proveedor: "wompi",
      p_llaves: { link_pago: "https://checkout.wompi.co/l/nuevo" },
    });
    check(g2.data && g2.data.completa === true,
      "dejar las secretas en blanco NO las borra — como la pantalla nunca se las devuelve, " +
      "si el blanco borrara, entrar a cambiar el link te dejaría sin poder cobrar",
      JSON.stringify(g2.data));

    const sigue = (await svc("POST", "/rest/v1/rpc/tf_pasarela_del_slug", { p_slug: "zz-pasarela-mia-" + sello })).texto;
    check(sigue.includes(SECRETA), "la llave sigue ahí, entera, del lado del servidor", sigue.slice(0, 120));
    check(sigue.includes("nuevo"), "y el link sí cambió", sigue.slice(0, 200));

    // ── Lo del vecino ──────────────────────────────────────────────────────
    console.log("\nLo del vecino:");
    const verAjena = await rpc("tf_pasarela_ver", { p_company: vecina });
    check(verAjena.data && verAjena.data.ok === false,
      "no puede ni mirar si tiene pasarela", JSON.stringify(verAjena.data).slice(0, 140));

    const ponerAjena = await rpc("tf_pasarela_guardar", {
      p_company: vecina, p_proveedor: "wompi", p_llaves: { llave_privada: "colada" },
    });
    check(ponerAjena.data && ponerAjena.data.ok === false,
      "NI ponerle una — eso sería desviarle los cobros a su propia cuenta",
      JSON.stringify(ponerAjena.data).slice(0, 140));

    const quitarAjena = await rpc("tf_pasarela_quitar", { p_company: vecina });
    check(quitarAjena.data && quitarAjena.data.ok === false,
      "ni quitársela — eso le tumbaría los cobros sin que se entere",
      JSON.stringify(quitarAjena.data).slice(0, 140));

    // ── Una pasarela que no existe ─────────────────────────────────────────
    const inventada = await rpc("tf_pasarela_guardar", {
      p_company: mia, p_proveedor: "la-mia-propia", p_llaves: { x: "1" },
    });
    check(inventada.data && inventada.data.ok === false,
      "y no acepta una pasarela inventada: el receptor no sabría cómo comprobar su firma",
      JSON.stringify(inventada.data).slice(0, 140));

    // ── A medias se puede, pero se dice ────────────────────────────────────
    console.log("\nDejarlo a medias:");
    const medias = await rpc("tf_pasarela_guardar", {
      p_company: mia, p_proveedor: "bold", p_llaves: { llave_identidad: "solo-esta" },
    });
    check(medias.data && medias.data.ok === true && medias.data.completa === false,
      "deja guardar a medias —se puede volver mañana con la llave que falta— pero lo dice",
      JSON.stringify(medias.data).slice(0, 180));
    check(JSON.stringify(medias.data.faltan || []).length > 2,
      "y dice cuál falta, por su nombre", JSON.stringify(medias.data.faltan));

  } finally {
    await svc("DELETE", "/auth/v1/admin/users/" + uid);
    await svc("DELETE", "/rest/v1/companies?id=eq." + mia);
    await svc("DELETE", "/rest/v1/companies?id=eq." + vecina);
  }

  console.log("\n" + "═".repeat(70));
  console.log(fallos.length
    ? "❌ " + fallos.length + " fallo(s):\n   · " + fallos.join("\n   · ")
    : "✅ Cada negocio con la suya, y las llaves no salen del servidor.");
  process.exitCode = fallos.length ? 1 : 0;
})().catch((e) => { console.error("ERROR " + e.message); process.exit(2); });
