// admin-users — Edge Function de Supabase.
// Acciones de super admin sobre usuarios (necesitan service_role).
//   POST { action: 'create', email, company_id, full_name?, role? } -> crea el usuario del cliente y devuelve su enlace de entrada
//   POST { action: 'delete', userId }            -> borra el usuario de Auth (cascade al profile)
//   POST { action: 'reset-link', email }         -> genera enlace de recuperacion (para copiar/enviar)
// SEGURIDAD: verifica que QUIEN llama sea super_admin (por su JWT) antes de actuar.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automaticamente.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const SB = (Deno.env.get("SUPABASE_URL") || "").replace(/\/+$/, "");
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SH = { apikey: SERVICE, Authorization: "Bearer " + SERVICE, "Content-Type": "application/json" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // 1) ¿quien llama? (validar su JWT contra Supabase)
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Sin sesion." }, 401);
  const meRes = await fetch(SB + "/auth/v1/user", { headers: { apikey: SERVICE, Authorization: "Bearer " + token } });
  if (!meRes.ok) return json({ error: "Sesion invalida." }, 401);
  const me = await meRes.json();

  // 2) ¿es super_admin activo?
  const prof = await fetch(SB + "/rest/v1/profiles?id=eq." + me.id + "&select=role,status", { headers: SH }).then((r) => r.json());
  if (!Array.isArray(prof) || !prof[0] || prof[0].role !== "super_admin" || prof[0].status !== "active") {
    return json({ error: "Solo el super admin puede hacer esto." }, 403);
  }

  // 3) accion
  const body = await req.json().catch(() => ({} as any));

  if (body.action === "delete") {
    if (!body.userId) return json({ error: "Falta userId." }, 400);
    if (body.userId === me.id) return json({ error: "No puedes eliminarte a ti mismo." }, 400);
    const d = await fetch(SB + "/auth/v1/admin/users/" + body.userId, { method: "DELETE", headers: SH });
    if (!d.ok) return json({ error: "No se pudo eliminar: " + (await d.text()).slice(0, 200) }, 502);
    return json({ ok: true });
  }

  // El usuario del cliente nuevo. Lo llama el asistente de alta de la consola
  // desde el dia que existe — y esta accion NO estaba, asi que el alta fallaba
  // ahi y seguia adelante avisando «el usuario no se creo, la empresa si».
  // Resultado: un cliente dado de alta por la consola quedaba SIN forma de
  // entrar a su portal. Ningun cliente se dio de alta asi todavia; todos
  // vinieron de un script, y por eso nadie lo habia notado.
  if (body.action === "create") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Falta un correo valido." }, 400);
    if (!body.company_id) return json({ error: "Falta company_id." }, 400);

    // Nace con una clave larga al azar que NO se le dice a nadie: el cliente
    // entra por el enlace de recuperacion. Una contrasena temporal dictada por
    // WhatsApp es la que despues nadie cambia — ya hay dos asi en el tablero.
    const azar = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);

    const c = await fetch(SB + "/auth/v1/admin/users", {
      method: "POST", headers: SH,
      body: JSON.stringify({ email, password: azar, email_confirm: true }),
    });
    const cb = await c.json().catch(() => ({} as any));
    if (!c.ok || !cb.id) {
      const ya = JSON.stringify(cb).includes("already been registered");
      return json({ error: ya ? "Ya hay un usuario con ese correo." : "No se pudo crear: " + JSON.stringify(cb).slice(0, 200) }, ya ? 409 : 502);
    }

    // El perfil lo crea un trigger sobre auth.users; aqui solo se le dice de
    // que empresa es y con que permisos. Si esto fallara, el usuario existiria
    // sin empresa — que es exactamente la sesion «sin perfil» que se cuela por
    // los guardias. Asi que si falla, se deshace.
    const p = await fetch(SB + "/rest/v1/profiles?id=eq." + cb.id, {
      method: "PATCH", headers: { ...SH, Prefer: "return=representation" },
      body: JSON.stringify({
        company_id: body.company_id,
        full_name: body.full_name || null,
        role: body.role === "admin" ? "admin" : "member",
        status: "active",
      }),
    });
    const pb = await p.json().catch(() => ([] as any));
    if (!p.ok || !Array.isArray(pb) || !pb[0]) {
      await fetch(SB + "/auth/v1/admin/users/" + cb.id, { method: "DELETE", headers: SH });
      return json({ error: "No se pudo dejar el perfil en su empresa: " + JSON.stringify(pb).slice(0, 200) }, 502);
    }

    // Y se devuelve el enlace para que entre y ponga su clave. Sin esto habria
    // que pedirle a alguien que genere el enlace aparte, que es un paso mas
    // donde el alta se queda a medias.
    let link: string | null = null;
    const g = await fetch(SB + "/auth/v1/admin/generate_link", {
      method: "POST", headers: SH,
      body: JSON.stringify({
        type: "recovery", email,
        options: { redirect_to: body.redirectTo || "https://toqueflow.com/login.html" },
      }),
    });
    const gb = await g.json().catch(() => ({} as any));
    if (g.ok) link = gb.action_link || (gb.properties && gb.properties.action_link) || null;

    return json({ ok: true, user: { id: cb.id, email }, link });
  }

  if (body.action === "reset-link") {
    if (!body.email) return json({ error: "Falta email." }, 400);
    const redirect = body.redirectTo || "https://toqueflow.com/login.html";
    const g = await fetch(SB + "/auth/v1/admin/generate_link", {
      method: "POST", headers: SH,
      body: JSON.stringify({ type: "recovery", email: body.email, options: { redirect_to: redirect } }),
    });
    const gb = await g.json().catch(() => ({} as any));
    if (!g.ok) return json({ error: "No se pudo generar el enlace: " + JSON.stringify(gb).slice(0, 200) }, 502);
    const link = gb.action_link || (gb.properties && gb.properties.action_link) || null;
    if (!link) return json({ error: "Sin enlace en la respuesta." }, 502);
    return json({ ok: true, link });
  }

  return json({ error: "Accion no valida." }, 400);
});
