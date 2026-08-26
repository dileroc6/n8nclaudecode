// admin-users — Edge Function de Supabase.
// Acciones de super admin sobre usuarios (necesitan service_role).
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
