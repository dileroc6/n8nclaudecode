-- ============================================================================
-- ToqueFlow — La plataforma pone la forma; cada negocio pone las palabras
-- ----------------------------------------------------------------------------
-- Diego lo vio: «no podemos hablar de membresías ni nada de eso porque cada
-- cliente es diferente». Un spa vende cursos y membresías; una clínica estética
-- vende sesiones y no tiene cursos; una ferretería no tiene ni lo uno ni lo
-- otro pero sí tiene clientes y prospectos.
--
-- La distinción que resuelve esto:
--
--   LA PLATAFORMA define FORMAS.     un contacto · un saldo · una cita
--   CADA NEGOCIO define SUS PALABRAS. clase / sesión / cupo / crédito / bono
--
-- La forma «a esta persona le quedan N unidades de lo que compró, que vencen
-- el día X» sirve igual para un gimnasio, un spa y una clínica. Lo único que
-- cambia es cómo se llama esa unidad. Y eso es un dato del cliente, no código.
--
-- Hasta hoy el vocabulario de Bejauha estaba metido en el esquema compartido:
--
--   contacts.service_type   solo aceptaba karma, beja, uja, paquete
--   contacts.clases_restantes  se llama «clases» para todos
--
-- Lo primero impedía que otro cliente guardara lo suyo. Lo segundo es un
-- nombre feo pero inofensivo: la columna guarda un número y quien lo muestra
-- decide cómo llamarlo.
--
-- Idempotente.
-- ============================================================================


-- ── 1. Cada negocio guarda lo que vende, sin pedir permiso ───────────────────
-- La restricción de `service_type` era la lista de productos de Bejauha. Un
-- spa que quiera guardar «Ritual de 90 minutos» no tiene por qué encajar en
-- karma / beja / uja. Se retira: es un campo del negocio, no de la plataforma.
alter table public.contacts drop constraint if exists contacts_service_type_check;

comment on column public.contacts.service_type is
  'Que compro o que le interesa a esta persona, en las palabras del negocio. Antes tenia una lista fija con los productos de Bejauha, que impedia a los demas guardar lo suyo.';

comment on column public.contacts.clases_restantes is
  'Cuantas unidades le quedan de lo que compro. Se llama "clases" por herencia de Bejauha, pero la forma es general: sesiones, cupos, creditos, bonos. Como se llama de cara al cliente lo dice companies.metadata->vocabulario.';


-- ── 2. Las palabras de cada negocio ──────────────────────────────────────────
-- Se guardan en la empresa y no en el agente: son del negocio, y las usan tanto
-- el agente como el portal.
-- NO se le pone vocabulario a todas las empresas. Estuve a punto de ponerles
-- «sesión» por defecto y es el mismo error mas pequeño: una tienda no vende
-- sesiones, ni cursos, ni membresías. Vende cosas.
--
-- El vocabulario solo hace falta cuando el negocio usa una herramienta que
-- devuelve un número y hay que ponerle un sustantivo. Si no usa ninguna, no
-- hay nada que nombrar — y la mayoría de negocios están en ese caso.
--
-- El resto de las palabras del negocio ya viven donde deben: en su documento
-- de conocimiento, que lo escribe él, y en el tono. Ahí una tienda habla de
-- productos y referencias sin que nadie se lo tenga que configurar.

-- Bejauha habla de clases y membresías. Es su vocabulario, no el de todos.
update public.companies
   set metadata = metadata || jsonb_build_object('vocabulario', jsonb_build_object(
     'unidad',        'clase',
     'unidad_plural', 'clases',
     'paquete',       'membresía',
     'cliente',       'miembro de la comunidad',
     'prospecto',     'interesado'
   ))
 where slug = 'bejauha';

comment on column public.companies.metadata is
  'Datos sueltos de la empresa: mensualidad_cop y vocabulario (como llama este negocio a sus unidades, paquetes y clientes). La plataforma pone la forma; el negocio pone las palabras.';


-- ── 3. El agente recibe las palabras del negocio ─────────────────────────────
drop view if exists public.agent_runtime;
create view public.agent_runtime
with (security_invoker = on) as
select
  c.id         as agent_id,
  c.company_id,
  co.name      as empresa,
  co.slug      as company_slug,
  coalesce(c.nombre, co.name) as agente,
  c.activo,
  c.whatsapp_instance,
  c.identidad, c.captura, c.enrutamiento, c.limites, c.agenda, c.recordatorios,
  c.herramientas,
  coalesce(co.metadata->'vocabulario', '{}'::jsonb) as vocabulario,
  coalesce(k.texto, '')       as conocimiento,
  coalesce(k.bytes_total, 0)  as conocimiento_bytes,
  coalesce(k.fuentes, 0)      as conocimiento_fuentes,
  case
    when coalesce(k.bytes_total, 0) = 0 then 'vacio'
    when k.bytes_total > public.tf_limite_conocimiento_bytes() then 'excedido'
    when k.bytes_total >= public.tf_limite_conocimiento_bytes() * 0.75 then 'cerca'
    else 'ok'
  end as conocimiento_estado,
  k.actualizado_at as conocimiento_at
from public.agent_config c
join public.companies co on co.id = c.company_id
left join lateral (
  select string_agg('## ' || titulo || E'\n' || contenido, E'\n\n' order by orden, created_at) as texto,
         sum(bytes)::int     as bytes_total,
         count(*)::int       as fuentes,
         max(actualizado_at) as actualizado_at
  from public.agent_knowledge ak
  where ak.company_id = c.company_id and ak.activo
    and (ak.agent_id is null or ak.agent_id = c.id)
) k on true;

grant select on public.agent_runtime to authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant select on public.agent_runtime to n8n_worker;
  end if;
end $$;


-- ── 4. Y la herramienta del saldo responde en esas palabras ──────────────────
create or replace function public.tf_tool_consultar_saldo(
  p_instance text,
  p_telefono text
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_company uuid;
  v_voc     jsonb;
  v_c       public.contacts%rowtype;
begin
  select ac.company_id, coalesce(co.metadata->'vocabulario', '{}'::jsonb)
    into v_company, v_voc
  from public.agent_config ac
  join public.companies co on co.id = ac.company_id
  where ac.whatsapp_instance = p_instance;

  if v_company is null then
    return json_build_object('ok', false, 'motivo', 'instancia desconocida');
  end if;

  select * into v_c from public.contacts
  where company_id = v_company
    and public.tf_telefono(phone) = public.tf_telefono(p_telefono);

  if not found then
    -- Decir que no se encontró a la persona es MEJOR que devolver cero: cero
    -- suena a «se le acabaron» y es una respuesta falsa.
    return json_build_object('ok', false, 'motivo', 'no encontre a esta persona en la base');
  end if;

  return json_build_object(
    'ok', true,
    'nombre', v_c.full_name,
    'saldo', v_c.clases_restantes,
    -- Cómo llamar a lo que le queda, en las palabras de ESTE negocio. Sin
    -- esto el agente diría «clases» en una clínica estética.
    'unidad', coalesce(v_voc->>'unidad', 'sesión'),
    'unidad_plural', coalesce(v_voc->>'unidad_plural', 'sesiones'),
    'vence', v_c.fecha_renovacion,
    'que_compro', v_c.service_type,
    'estado', v_c.status
  );
end;
$fn$;

revoke all on function public.tf_tool_consultar_saldo(text, text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'n8n_worker') then
    grant execute on function public.tf_tool_consultar_saldo(text, text) to n8n_worker;
  end if;
end $$;
