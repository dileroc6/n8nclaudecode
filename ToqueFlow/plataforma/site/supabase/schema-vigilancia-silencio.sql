-- ============================================================================
-- ToqueFlow — Lo que está apagado a propósito no es una avería
-- ----------------------------------------------------------------------------
-- El vigilante avisaba de `zoe` y `clinica-demo` como si estuvieran caídas.
-- Están apagadas porque alguien lo decidió: Zoe está congelada esperando la
-- recotización, y `clinica-demo` era el piloto de LeadAI que se apagó entero.
--
-- Avisar de eso todos los días es peor que no avisar de nada: el correo se
-- llena de cosas que no hay que hacer, y el día que aparezca una de verdad va
-- a estar en la misma lista que las seis que se ignoran siempre.
--
-- POR QUÉ UNA TABLA Y NO UNA LISTA EN EL CÓDIGO: que algo esté apagado a
-- propósito es una DECISIÓN, y las decisiones se escriben con su motivo y su
-- fecha. Dentro de tres meses, «¿por qué no avisa de zoe?» tiene que tener
-- respuesta sin abrir un workflow.
--
-- Y NO SE CALLA DEL TODO: el correo dice cuántas está ignorando y por qué.
-- Silencio sin decirlo es como se olvida que algo lleva medio año apagado.
--
-- Idempotente.
-- ============================================================================

create table if not exists public.vigilancia_ignorar (
  instancia  text primary key,
  motivo     text not null,
  -- Nulo = indefinido. Con fecha, el vigilante vuelve a mirarla ese día: sirve
  -- para «cállate mientras arreglo esto», que es distinto de «está congelado».
  hasta      date,
  creado_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.vigilancia_ignorar is
  'Instancias de WhatsApp que estan apagadas A PROPOSITO y de las que el vigilante no debe avisar. Con su motivo: dentro de tres meses alguien va a preguntar por que, y tiene que haber respuesta.';

insert into public.vigilancia_ignorar (instancia, motivo) values
  ('zoe', 'Zoe esta congelada esperando la recotizacion (fila 2 del tablero). Su agente vive en la estructura nueva, apagado.'),
  ('clinica-demo', 'Era el piloto propio de LeadAI para clinicas esteticas. Se apagaron sus 13 flujos el 10-sep: no es de ningun cliente.')
on conflict (instancia) do update set motivo = excluded.motivo;


-- ── Lo que el vigilante tiene que preguntar ─────────────────────────────────
-- Devuelve las que hay que ignorar hoy, para que el flujo no tenga que saber
-- nada de fechas ni de motivos.
create or replace function public.tf_vigilancia_silencio()
returns table (instancia text, motivo text)
language sql
stable
security definer
set search_path = public
as $fn$
  select v.instancia, v.motivo
  from public.vigilancia_ignorar v
  where v.hasta is null or v.hasta >= current_date
  union
  -- Y las de agentes que están apagados en la plataforma: si alguien decidió
  -- apagar el agente, el silencio de su WhatsApp es la consecuencia esperada,
  -- no una sorpresa.
  select ac.whatsapp_instance, 'su agente esta apagado en la plataforma'
  from public.agent_config ac
  where not ac.activo and ac.whatsapp_instance is not null;
$fn$;

comment on function public.tf_vigilancia_silencio() is
  'Las instancias de las que NO hay que avisar: las marcadas a mano y las de agentes apagados. El vigilante la llama y no tiene que saber de fechas ni motivos.';

revoke all on function public.tf_vigilancia_silencio() from public, anon;
grant execute on function public.tf_vigilancia_silencio() to authenticated;

alter table public.vigilancia_ignorar enable row level security;
drop policy if exists vigilancia_ignorar_ver on public.vigilancia_ignorar;
create policy vigilancia_ignorar_ver on public.vigilancia_ignorar
  for select to authenticated using (public.is_super_admin());
grant select on public.vigilancia_ignorar to authenticated;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_vigilancia_silencio() to n8n_worker;
    grant select on public.vigilancia_ignorar to n8n_worker;
  end if;
end $$;
