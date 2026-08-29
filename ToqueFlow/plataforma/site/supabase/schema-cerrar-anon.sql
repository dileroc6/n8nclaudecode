-- ============================================================================
-- ToqueFlow — Cerrarle a `anon` lo que no tiene por qué poder hacer
-- ----------------------------------------------------------------------------
-- Hallazgo de la auditoría del 28-ago, y es real:
--
--   `tf_run_due_campaigns()` la podía ejecutar `anon` — o sea, cualquiera en
--   internet con la llave pública, que está en el HTML del portal a la vista
--   de quien mire el código fuente.
--
-- Lo que hace esa función es meter eventos `ejecutar_campana` en el outbox con
-- `test: false`. El outbox dispara el webhook a n8n, y n8n **manda WhatsApp de
-- verdad a los contactos de un cliente**.
--
-- El daño tiene techo —solo dispara campañas que ya estaban vencidas, así que
-- un extraño no puede inventarse un envío— pero sigue estando mal: alguien de
-- afuera podía decidir CUÁNDO sale el WhatsApp de un cliente que paga. Y en
-- este proyecto ya hubo un baneo de WhatsApp por envíos mal hechos; el momento
-- de un envío no es un detalle.
--
-- Nadie más la necesitaba: la corre un cron dentro de la base
-- (`tf-run-due-campaigns`, cada minuto) como `postgres`.
--
-- La regla que queda, y que la auditoría vigila de aquí en adelante:
--
--   `anon` no ejecuta NINGUNA función que pueda escribir.
--
-- `anon` es literalmente cualquiera. Lo que pueda leer se discute caso por
-- caso; lo que pueda escribir, no se discute.
--
-- Idempotente.
-- ============================================================================


-- ── La que disparaba envíos ──────────────────────────────────────────────────
revoke execute on function public.tf_run_due_campaigns() from public, anon, authenticated;

-- El worker tampoco: n8n recibe los eventos, no los provoca. Que el que ejecuta
-- los envíos pueda además dispararse a sí mismo es un lazo que no hace falta.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    revoke execute on function public.tf_run_due_campaigns() from n8n_worker;
  end if;
end $$;


-- ── La que empuja el outbox ──────────────────────────────────────────────────
-- Misma familia: es la que le avisa a n8n. Estaba abierta por herencia del
-- `grant execute on all functions` que Supabase deja puesto.
revoke execute on function public.tf_dispatch_n8n_event() from public, anon, authenticated;


-- ── Y de aquí en adelante, por defecto ───────────────────────────────────────
-- Postgres le da EXECUTE a `public` en cada función nueva, y `anon` hereda de
-- `public`. O sea: cada función que se cree queda abierta salvo que uno se
-- acuerde de cerrarla — y acordarse no es un mecanismo. Esto invierte el
-- defecto para lo que venga.
alter default privileges in schema public revoke execute on functions from public;

comment on function public.tf_run_due_campaigns() is
  'La corre el cron tf-run-due-campaigns cada minuto, como postgres. NO debe poder ejecutarla nadie mas: mete eventos de envio real en el outbox.';
